import { describe, it, expect } from 'bun:test';
import masterSeedData from '../src/data/catalog-master-seed.json';
import type { Product, FilterState } from '../src/types/catalog.ts';
import { searchProducts, extractYearFromQuery, normalizeCanonical } from '../src/utils/smartSearch.ts';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

describe('QUALITY GATE 1: Seed Data & Extraction Fidelity', () => {
  const products = masterSeedData as unknown as Product[];

  it('deve possuir mais de 800 produtos no catálogo master', () => {
    expect(products.length).toBeGreaterThan(800);
  });

  it('deve conter produtos de ambas as fabricantes (TRW e Norflex)', () => {
    const brands = new Set(products.map((p) => p.brand));
    expect(brands.has('TRW')).toBe(true);
    expect(brands.has('Norflex')).toBe(true);
  });

  it('todos os produtos devem ter SKU, nome, categoria e especificações válidas', () => {
    for (const p of products) {
      expect(p.id).toBeDefined();
      expect(p.sku).toBeDefined();
      expect(p.sku.length).toBeGreaterThan(0);
      expect(p.name).toBeDefined();
      expect(p.category).toBeDefined();
      expect(p.specs).toBeDefined();
      expect(p.specs.norm).toBeDefined();
      expect(p.images.length).toBeGreaterThan(0);
    }
  });

  it('preços devem ser armazenados em centavos inteiros (BigInt-safe)', () => {
    for (const p of products) {
      const inv = p.storeInventoryData;
      expect(inv).toBeDefined();
      expect(Number.isInteger(inv.priceCents)).toBe(true);
      expect(inv.priceCents).toBeGreaterThan(0);
      expect(Number.isInteger(inv.stockQty)).toBe(true);
    }
  });
});

describe('QUALITY GATE 2: Image Coverage & Zero Black Images', () => {
  const products = masterSeedData as Product[];

  it('todas as imagens referenciadas devem existir no disco com tamanho > 300 bytes', () => {
    let checkedCount = 0;
    for (const p of products) {
      for (const imgUrl of p.images) {
        if (imgUrl.startsWith('/catalog-images/')) {
          const diskPath = join(process.cwd(), 'public', imgUrl.replace('/', ''));
          expect(existsSync(diskPath)).toBe(true);
          const stat = statSync(diskPath);
          expect(stat.size).toBeGreaterThan(300);
          checkedCount++;
        }
      }
    }
    expect(checkedCount).toBeGreaterThan(800);
  });
});

describe('QUALITY GATE 3: Cross-Brand Link Integrity', () => {
  const products = masterSeedData as Product[];

  it('deve conter vínculos calculados dos 4 tipos', () => {
    let directCount = 0;
    let couplingCount = 0;
    let kitCount = 0;
    let variantCount = 0;

    for (const p of products) {
      if (p.links) {
        directCount += p.links.directEquivalents.length;
        couplingCount += p.links.couplingCompatible.length;
        kitCount += p.links.kitComposition.length;
        variantCount += p.links.productVariants.length;
      }
    }

    expect(directCount).toBeGreaterThan(100);
    expect(couplingCount).toBeGreaterThan(50);
    expect(kitCount).toBeGreaterThan(100);
    expect(variantCount).toBeGreaterThan(100);
  });

  it('equivalência entre Norflex 3036 e TRW RPFX00480 deve estar mapeada', () => {
    const norflex3036 = products.find((p) => p.sku === '3036');
    const trwRPFX00480 = products.find((p) => p.sku === 'RPFX00480');

    expect(norflex3036).toBeDefined();
    expect(trwRPFX00480).toBeDefined();

    if (norflex3036 && trwRPFX00480) {
      expect(norflex3036.links.directEquivalents).toContain('RPFX00480');
      expect(trwRPFX00480.links.directEquivalents).toContain('3036');
    }
  });
});

describe('QUALITY GATE 5: Sub-50ms Search Engine Benchmark', () => {
  const products = masterSeedData as Product[];

  const defaultFilter: FilterState = {
    query: '',
    brand: 'ALL',
    category: 'ALL',
    make: 'ALL',
    position: 'ALL',
    inStockOnly: false,
    launchesOnly: false,
    sortBy: 'relevance',
  };

  it('extração de ano em consultas deve suportar 4 dígitos e 2 dígitos', () => {
    expect(extractYearFromQuery('Gol 2004')).toBe(2004);
    expect(extractYearFromQuery('Palio 98')).toBe(1998);
    expect(extractYearFromQuery('Siena 12')).toBe(2012);
    expect(extractYearFromQuery('Apenas texto')).toBe(null);
  });

  it('normalização canônica deve eliminar espaços, pontuações e acentos', () => {
    expect(normalizeCanonical('RPFX-00010')).toBe('rpfx00010');
    expect(normalizeCanonical('3.617.777')).toBe('3617777');
    expect(normalizeCanonical('Doblò')).toBe('doblo');
  });

  it('ranking de 4 níveis: busca por SKU exato deve retornar Tier 1 no topo', () => {
    const results = searchProducts(products, { ...defaultFilter, query: '3036' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].product.sku).toBe('3036');
    expect(results[0].tier).toBe(1);
  });

  it('ranking de 4 níveis: busca por código OEM deve localizar peça correspondente', () => {
    const results = searchProducts(products, { ...defaultFilter, query: '3.617.777' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].product.sku).toBe('RPFX00010');
    expect(results[0].tier).toBe(2);
  });

  it('BENCHMARK: 1.000 buscas em lote devem rodar com média inferior a 50ms por busca', () => {
    const sampleQueries = ['3036', 'RPFX00480', 'Palio', 'Gol', 'Siena', '540mm', 'Dianteiro', 'Traseiro', 'Ford', '2012'];
    const iterations = 1000;

    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const q = sampleQueries[i % sampleQueries.length];
      searchProducts(products, { ...defaultFilter, query: q });
    }
    const elapsedTotal = performance.now() - t0;
    const avgPerSearch = elapsedTotal / iterations;

    console.log(`\n  [BENCHMARK] ${iterations} buscas completadas em ${elapsedTotal.toFixed(2)} ms (Média: ${avgPerSearch.toFixed(3)} ms/busca)`);
    expect(avgPerSearch).toBeLessThan(50); // Quality gate: sub-50ms
  }, 15000);
});
