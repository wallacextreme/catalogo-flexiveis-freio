import Dexie, { type Table } from 'dexie';
import type { Product, CustomImageAsset, AuditLog, StoreInventoryData } from '../types/catalog.ts';
import masterSeedData from '../data/catalog-master-seed.json';

export interface InventoryOverrideRecord {
  productId: string;
  storeInventoryData: StoreInventoryData;
  updatedAt: number;
}

export class BrakeHosesDatabase extends Dexie {
  products!: Table<Product, string>;
  customImages!: Table<CustomImageAsset, number>;
  auditLogs!: Table<AuditLog, number>;
  inventoryOverrides!: Table<InventoryOverrideRecord, string>;

  constructor() {
    super('BrakeHosesCatalogDB');
    this.version(1).stores({
      products: 'id, sku, brand, category, *makes, *oemEquivalents, deletedAt',
      customImages: '++id, productId, createdAt',
      auditLogs: '++id, timestamp, action, targetId',
      inventoryOverrides: 'productId, updatedAt',
    });
  }
}

export const db = new BrakeHosesDatabase();

export const CURRENT_SEED_VERSION = 'v3_mercadocar_hd_images_2026';

/**
 * Initializes the database and runs instant auto-seeding if empty or if seed version is updated.
 * Guarantees inviolable isolation of inventory data (prices, stock, locations).
 */
export async function initDatabase(): Promise<number> {
  const count = await db.products.count();
  const savedVersion = localStorage.getItem('catalog_seed_version');

  if (count === 0 || savedVersion !== CURRENT_SEED_VERSION) {
    console.log(`[DB] Sincronizando catálogo master versão ${CURRENT_SEED_VERSION}...`);
    const newCount = await resetToFactorySeed();
    localStorage.setItem('catalog_seed_version', CURRENT_SEED_VERSION);
    return newCount;
  }

  return count;
}

/**
 * Get all active (non-deleted) products.
 */
export async function getAllActiveProducts(): Promise<Product[]> {
  const all = await db.products.toArray();
  return all.filter((p) => !p.deletedAt);
}

/**
 * Get products currently in the Trash (soft-deleted).
 */
export async function getTrashProducts(): Promise<Product[]> {
  const all = await db.products.toArray();
  return all.filter((p) => !!p.deletedAt);
}

/**
 * Get single product by id.
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  return await db.products.get(id);
}

/**
 * Get single product by SKU.
 */
export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const clean = sku.trim().toUpperCase();
  return await db.products.where('sku').equalsIgnoreCase(clean).first();
}

/**
 * Saves or updates a product, preserving inventory isolation.
 */
export async function saveProduct(product: Product, action: 'CREATE' | 'UPDATE' = 'UPDATE'): Promise<void> {
  await db.products.put(product);

  // Save isolated inventory override
  await db.inventoryOverrides.put({
    productId: product.id,
    storeInventoryData: product.storeInventoryData,
    updatedAt: Date.now(),
  });

  await db.auditLogs.add({
    timestamp: Date.now(),
    action,
    targetId: product.id,
    targetSku: product.sku,
    details: `${action === 'CREATE' ? 'Criado' : 'Atualizado'} produto ${product.brand} ${product.sku}`,
  });
}

/**
 * Quick stock adjustment (+ / -) directly on card or modal.
 */
export async function adjustStockQty(productId: string, delta: number): Promise<number> {
  const prod = await db.products.get(productId);
  if (!prod) return 0;

  const current = prod.storeInventoryData.stockQty || 0;
  const newQty = Math.max(0, current + delta);
  prod.storeInventoryData.stockQty = newQty;

  await db.products.put(prod);
  await db.inventoryOverrides.put({
    productId: prod.id,
    storeInventoryData: prod.storeInventoryData,
    updatedAt: Date.now(),
  });

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'STOCK_ADJUST',
    targetId: prod.id,
    targetSku: prod.sku,
    details: `Ajuste de estoque para ${prod.sku}: ${current} -> ${newQty} (delta: ${delta > 0 ? '+' : ''}${delta})`,
  });

  return newQty;
}

/**
 * Soft-delete product to Trash.
 */
export async function softDeleteProduct(productId: string): Promise<void> {
  const prod = await db.products.get(productId);
  if (!prod) return;

  prod.deletedAt = Date.now();
  await db.products.put(prod);

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'DELETE',
    targetId: prod.id,
    targetSku: prod.sku,
    details: `Produto ${prod.sku} movido para a Lixeira`,
  });
}

/**
 * Restore product from Trash.
 */
export async function restoreProductFromTrash(productId: string): Promise<void> {
  const prod = await db.products.get(productId);
  if (!prod) return;

  prod.deletedAt = null;
  await db.products.put(prod);

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'RESTORE',
    targetId: prod.id,
    targetSku: prod.sku,
    details: `Produto ${prod.sku} restaurado da Lixeira`,
  });
}

/**
 * Permanently deletes a product.
 */
export async function hardDeleteProduct(productId: string): Promise<void> {
  const prod = await db.products.get(productId);
  const sku = prod?.sku || productId;

  await db.products.delete(productId);
  await db.inventoryOverrides.delete(productId);
  await db.customImages.where('productId').equals(productId).delete();

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'DELETE',
    targetId: productId,
    targetSku: sku,
    details: `Produto ${sku} excluído permanentemente do banco`,
  });
}

/**
 * Custom image asset methods for Drag & Drop and Ctrl+V.
 */
export async function addCustomImage(asset: Omit<CustomImageAsset, 'id'>): Promise<number> {
  const id = await db.customImages.add(asset as CustomImageAsset);
  const prod = await db.products.get(asset.productId);
  if (prod) {
    prod.imageAssetIds = prod.imageAssetIds || [];
    prod.imageAssetIds.push(id);
    await db.products.put(prod);
  }
  return id;
}

export async function getCustomImagesForProduct(productId: string): Promise<CustomImageAsset[]> {
  return await db.customImages.where('productId').equals(productId).toArray();
}

export async function deleteCustomImage(assetId: number, productId: string): Promise<void> {
  await db.customImages.delete(assetId);
  const prod = await db.products.get(productId);
  if (prod && prod.imageAssetIds) {
    prod.imageAssetIds = prod.imageAssetIds.filter((id) => id !== assetId);
    await db.products.put(prod);
  }
}

/**
 * Audit log queries.
 */
export async function getRecentAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  return await db.auditLogs.orderBy('timestamp').reverse().limit(limit).toArray();
}

/**
 * Reset to factory seed while preserving inventory overrides.
 */
export async function resetToFactorySeed(): Promise<number> {
  console.log('[DB] Restaurando catálogo de fábrica preservando inventário...');
  const currentOverrides = await db.inventoryOverrides.toArray();
  const overrideMap = new Map<string, StoreInventoryData>();
  for (const ov of currentOverrides) {
    overrideMap.set(ov.productId, ov.storeInventoryData);
  }

  await db.products.clear();
  const seedProducts = (masterSeedData as unknown as Product[]).map((p) => {
    return {
      ...p,
      staticImageUrls: p.images || [],
      imageAssetIds: [],
      removedStaticUrls: [],
      deletedAt: null,
      storeInventoryData: overrideMap.has(p.id) ? overrideMap.get(p.id)! : p.storeInventoryData,
    };
  });

  await db.products.bulkAdd(seedProducts);

  await db.auditLogs.add({
    timestamp: Date.now(),
    action: 'BACKUP_RESTORE',
    targetId: 'SYSTEM',
    targetSku: 'ALL',
    details: `Restauração de fábrica: ${seedProducts.length} produtos carregados (inventário preservado).`,
  });

  return seedProducts.length;
}
