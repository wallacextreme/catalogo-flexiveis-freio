import type { Product, FilterState, SearchMatchResult } from '../types/catalog.ts';

/**
 * Normalizes strings by removing accents, spaces, special symbols, and lowercasing.
 */
export function normalizeCanonical(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes text for general fuzzy word matching.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Parses numerical years from query string (e.g. "Gol 2004" -> 2004, "Palio 98" -> 1998).
 */
export function extractYearFromQuery(query: string): number | null {
  const matches = query.match(/\b(19\d{2}|20\d{2})\b/);
  if (matches) {
    return parseInt(matches[1], 10);
  }
  const twoDigit = query.match(/\b([6-9]\d|0\d|1\d|2\d)\b/);
  if (twoDigit) {
    const val = parseInt(twoDigit[1], 10);
    return val < 50 ? 2000 + val : 1900 + val;
  }
  return null;
}

/**
 * Sub-50ms 4-Tier Search Engine.
 */
export function searchProducts(
  products: Product[],
  filter: FilterState
): SearchMatchResult[] {
  const rawQuery = filter.query.trim();
  const canonicalQuery = normalizeCanonical(rawQuery);
  const normalizedQuery = normalizeText(rawQuery);
  const queryWords = normalizedQuery.split(/[\s,;/]+/).filter(Boolean);
  const searchYear = extractYearFromQuery(rawQuery);
  const nonYearWords = queryWords.filter((w) => !/^\d{2,4}$/.test(w));

  const results: SearchMatchResult[] = [];

  for (const product of products) {
    // 1. Static Filter Checks
    if (filter.brand && filter.brand !== 'ALL') {
      if (product.brand.toLowerCase() !== filter.brand.toLowerCase()) {
        continue;
      }
    }

    if (filter.category && filter.category !== 'ALL') {
      if (product.category.toLowerCase() !== filter.category.toLowerCase()) {
        continue;
      }
    }

    if (filter.make && filter.make !== 'ALL') {
      const hasMake = product.makes.some(
        (m) => normalizeCanonical(m) === normalizeCanonical(filter.make)
      );
      if (!hasMake) continue;
    }

    if (filter.position && filter.position !== 'ALL') {
      const posFilter = filter.position.toUpperCase();
      const prodPos = (product.specs.position || '').toUpperCase();
      if (!prodPos.includes(posFilter)) {
        continue;
      }
    }

    if (filter.inStockOnly && product.storeInventoryData.stockQty <= 0) {
      continue;
    }

    if (filter.launchesOnly && !product.isLaunch) {
      continue;
    }

    // If query is empty, return matching static filters
    if (!canonicalQuery) {
      results.push({
        product,
        score: 100,
        tier: 4,
        matchField: 'all',
      });
      continue;
    }

    // 2. 4-Tier Ranking Calculation
    let score = 0;
    let tier: 1 | 2 | 3 | 4 = 4;
    let matchField = '';
    let matchSnippet = '';

    const canonicalSku = normalizeCanonical(product.sku);

    // TIER 1: Exact or Prefix SKU Match
    if (canonicalSku === canonicalQuery) {
      score += 20000;
      tier = 1;
      matchField = 'SKU Exato';
      matchSnippet = product.sku;
    } else if (canonicalSku.startsWith(canonicalQuery)) {
      score += 12000;
      tier = 1;
      matchField = 'SKU Prefixo';
      matchSnippet = product.sku;
    } else if (canonicalQuery.length >= 2 && canonicalSku.includes(canonicalQuery)) {
      score += 8000;
      tier = 1;
      matchField = 'SKU Parcial';
      matchSnippet = product.sku;
    }

    // TIER 2: OEM Equivalent Codes
    if (tier > 2 || score < 10000) {
      for (const oem of product.oemEquivalents) {
        const canonicalOem = normalizeCanonical(oem);
        if (canonicalOem === canonicalQuery) {
          score += 10000;
          tier = 2;
          matchField = 'Código OEM Exato';
          matchSnippet = oem;
          break;
        } else if (canonicalOem.startsWith(canonicalQuery) && canonicalQuery.length >= 2) {
          score += 7000;
          if (tier > 2) tier = 2;
          matchField = 'Código OEM Prefixo';
          matchSnippet = oem;
          break;
        } else if (canonicalOem.includes(canonicalQuery) && canonicalQuery.length >= 3) {
          score += 6000;
          if (tier > 2) tier = 2;
          matchField = 'Código OEM';
          matchSnippet = oem;
          break;
        }
      }
    }

    // TIER 3: Vehicle Applications (Make, Model, Year)
    if (tier > 2) {
      let matchedApp = false;
      const textToMatch = normalizeText(`${product.name} ${(product.makes || []).join(' ')}`);

      if (nonYearWords.length > 0) {
        for (const app of product.applications) {
          const normMake = normalizeText(app.make);
          const normModel = normalizeText(app.models);
          const normYears = normalizeText(app.years || '');
          const appCombined = `${normMake} ${normModel} ${normYears} ${textToMatch}`;

          // Words matching
          const wordsMatch = nonYearWords.every((word) => appCombined.includes(word));

          if (wordsMatch) {
            let yearMatches = true;
            if (searchYear) {
              const twoDigitYear = String(searchYear % 100).padStart(2, '0');
              const hasYearInApp = normYears.includes(String(searchYear)) || normYears.includes(twoDigitYear);
              const hasYearInRange = product.yearRanges && product.yearRanges.some(
                ([start, end]) => searchYear >= start && searchYear <= end
              );
              yearMatches = hasYearInApp || !!hasYearInRange;
            }

            if (yearMatches) {
              score += searchYear ? 9000 : 5000;
              tier = 3;
              matchField = 'Aplicação Veicular';
              matchSnippet = `${app.make} ${app.models}${app.years ? ` (${app.years})` : ''}`.trim();
              matchedApp = true;
              break;
            }
          }
        }
      } else if (searchYear && product.yearRanges && product.yearRanges.length > 0) {
        const inYearRange = product.yearRanges.some(
          ([start, end]) => searchYear >= start && searchYear <= end
        );
        if (inYearRange) {
          score += 2500;
          tier = 3;
          matchField = 'Ano Compatível';
          matchSnippet = `Ano ${searchYear}`;
        }
      }
    }

    // TIER 4: Specs, Lengths, Stock Location, General Text
    if (score === 0 && rawQuery.length >= 2) {
      const prodText = normalizeText(
        `${product.name} ${product.category} ${product.specs.position} ${product.specs.lengthMm}mm ${product.storeInventoryData.stockLocation} ${product.storeInventoryData.internalCode}`
      );

      const wordsHit = queryWords.filter((w) => prodText.includes(w)).length;

      if (wordsHit === queryWords.length) {
        score += 1500;
        tier = 4;
        matchField = 'Especificação / Medida';
        matchSnippet = `${product.specs.position || ''} ${product.specs.lengthMm ? `${product.specs.lengthMm}mm` : ''}`.trim();
      } else if (wordsHit > 0 && queryWords.length > 1) {
        score += wordsHit * 200;
        tier = 4;
        matchField = 'Descrição';
      }
    }

    if (score > 0) {
      results.push({
        product,
        score,
        tier,
        matchField,
        matchSnippet,
      });
    }
  }

  // 3. Sorting
  return sortSearchResults(results, filter.sortBy);
}

function sortSearchResults(
  results: SearchMatchResult[],
  sortBy: FilterState['sortBy']
): SearchMatchResult[] {
  return results.sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.score - a.score;
      case 'sku':
        return a.product.sku.localeCompare(b.product.sku, undefined, { numeric: true });
      case 'name':
        return a.product.name.localeCompare(b.product.name);
      case 'priceAsc':
        return a.product.storeInventoryData.priceCents - b.product.storeInventoryData.priceCents;
      case 'priceDesc':
        return b.product.storeInventoryData.priceCents - a.product.storeInventoryData.priceCents;
      case 'stockDesc':
        return b.product.storeInventoryData.stockQty - a.product.storeInventoryData.stockQty;
      case 'lengthAsc':
        return (a.product.specs.lengthMm || 0) - (b.product.specs.lengthMm || 0);
      default:
        return b.score - a.score;
    }
  });
}
