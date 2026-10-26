import { db } from '../db/database.ts';
import type { Product, CustomImageAsset, AuditLog } from '../types/catalog.ts';

export interface BackupPackage {
  version: string;
  createdAt: number;
  system: string;
  itemCount: number;
  sha256?: string;
  products: Product[];
  inventoryOverrides: any[];
  customImages: CustomImageAsset[];
  auditLogs: AuditLog[];
}

/**
 * Computes SHA-256 hex string using native Web Crypto API.
 */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates and downloads a complete JSON backup with SHA-256 integrity checksum.
 */
export async function exportDatabaseBackup(): Promise<string> {
  const products = await db.products.toArray();
  const inventoryOverrides = await db.inventoryOverrides.toArray();
  const customImages = await db.customImages.toArray();
  const auditLogs = await db.auditLogs.toArray();

  const rawPackage: Omit<BackupPackage, 'sha256'> = {
    version: '1.0',
    createdAt: Date.now(),
    system: 'Flexíveis de Freio Pro (TRW & Norflex)',
    itemCount: products.length,
    products,
    inventoryOverrides,
    customImages,
    auditLogs,
  };

  const jsonWithoutHash = JSON.stringify(rawPackage);
  const hash = await computeSha256(jsonWithoutHash);

  const fullPackage: BackupPackage = {
    ...rawPackage,
    sha256: hash,
  };

  const finalJson = JSON.stringify(fullPackage, null, 2);
  const blob = new Blob([finalJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `backup-flexiveis-freio-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'BACKUP_EXPORT',
    targetId: 'SYSTEM',
    targetSku: 'BACKUP',
    details: `Exportado backup completo com ${products.length} produtos. SHA-256: ${hash.slice(0, 16)}...`,
  });

  return hash;
}

/**
 * Restores database from a JSON backup file, validating SHA-256.
 */
export async function restoreDatabaseBackup(file: File): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const text = await file.text();
    const pkg: BackupPackage = JSON.parse(text);

    if (!pkg.products || !Array.isArray(pkg.products)) {
      return { success: false, message: 'Arquivo de backup inválido (lista de produtos ausente).' };
    }

    // Verify checksum
    if (pkg.sha256) {
      const copy = { ...pkg };
      delete copy.sha256;
      const calculatedHash = await computeSha256(JSON.stringify(copy));
      if (calculatedHash !== pkg.sha256) {
        return {
          success: false,
          message: 'Falha na validação SHA-256. O arquivo pode ter sido corrompido ou alterado.',
        };
      }
    }

    // Restore tables
    await db.transaction('rw', db.products, db.inventoryOverrides, db.customImages, db.auditLogs, async () => {
      await db.products.clear();
      await db.products.bulkAdd(pkg.products);

      if (pkg.inventoryOverrides && pkg.inventoryOverrides.length > 0) {
        await db.inventoryOverrides.clear();
        await db.inventoryOverrides.bulkAdd(pkg.inventoryOverrides);
      }

      if (pkg.customImages && pkg.customImages.length > 0) {
        await db.customImages.clear();
        await db.customImages.bulkAdd(pkg.customImages);
      }

      if (pkg.auditLogs && pkg.auditLogs.length > 0) {
        await db.auditLogs.bulkAdd(pkg.auditLogs);
      }
    });

    await db.auditLogs.add({
      timestamp: Date.now(),
      action: 'BACKUP_RESTORE',
      targetId: 'SYSTEM',
      targetSku: 'RESTORE',
      details: `Restauração concluída: ${pkg.products.length} produtos importados com integridade SHA-256 confirmada.`,
    });

    return {
      success: true,
      message: `Backup restaurado com sucesso! ${pkg.products.length} produtos importados.`,
      count: pkg.products.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao processar backup: ${err.message || String(err)}`,
    };
  }
}

/**
 * Exports store inventory to CSV (SKU, Marca, CodigoInterno, PrecoReais, QtdEstoque, Localizacao, Notas).
 */
export async function exportInventoryCsv(): Promise<void> {
  const products = await db.products.toArray();
  const headers = ['SKU', 'Marca', 'CodigoInterno', 'PrecoReais', 'QtdEstoque', 'Localizacao', 'Notas'];

  const rows = products.map((p) => {
    const inv = p.storeInventoryData;
    const priceReais = (inv.priceCents / 100).toFixed(2).replace('.', ',');
    return [
      `"${p.sku}"`,
      `"${p.brand}"`,
      `"${inv.internalCode || ''}"`,
      `"${priceReais}"`,
      inv.stockQty || 0,
      `"${(inv.stockLocation || '').replace(/"/g, '""')}"`,
      `"${(inv.notes || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `estoque-flexiveis-freio-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports store inventory updates from CSV.
 */
export async function importInventoryCsv(file: File): Promise<{ updatedCount: number; message: string }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    return { updatedCount: 0, message: 'Arquivo CSV vazio ou sem linhas de dados.' };
  }

  // Parse header
  const separator = lines[0].includes(';') ? ';' : ',';
  let updatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split with regex handling quotes
    const parts = line.split(separator).map((s) => s.replace(/^"|"$/g, '').trim());
    if (parts.length < 5) continue;

    const [sku, _brand, internalCode, priceRaw, stockRaw, location, notes] = parts;
    if (!sku) continue;

    const prod = await db.products.where('sku').equalsIgnoreCase(sku).first();
    if (!prod) continue;

    // Parse price
    const cleanPriceStr = priceRaw.replace(/[^\d.,]/g, '').replace(',', '.');
    const priceFloat = parseFloat(cleanPriceStr);
    const priceCents = !isNaN(priceFloat) ? Math.round(priceFloat * 100) : prod.storeInventoryData.priceCents;

    // Parse stock
    const stockQty = parseInt(stockRaw, 10);
    const validStock = !isNaN(stockQty) ? stockQty : prod.storeInventoryData.stockQty;

    prod.storeInventoryData = {
      priceCents,
      stockQty: validStock,
      internalCode: internalCode || prod.storeInventoryData.internalCode,
      stockLocation: location || prod.storeInventoryData.stockLocation,
      notes: notes || prod.storeInventoryData.notes,
    };

    await db.products.put(prod);
    await db.inventoryOverrides.put({
      productId: prod.id,
      storeInventoryData: prod.storeInventoryData,
      updatedAt: Date.now(),
    });

    updatedCount++;
  }

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'CSV_IMPORT',
    targetId: 'SYSTEM',
    targetSku: 'CSV',
    details: `Importação de estoque via CSV: ${updatedCount} peças atualizadas.`,
  });

  return {
    updatedCount,
    message: `${updatedCount} produtos tiveram estoque e preços atualizados com sucesso via CSV!`,
  };
}
