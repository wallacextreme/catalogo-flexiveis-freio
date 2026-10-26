export interface VehicleApplication {
  make: string;
  models: string;
  years: string;
  position?: string;
  lengthMm?: number;
}

export interface ProductSpecs {
  lengthMm: number;
  position: string;
  threadStandard: string;
  hoseType: string;
  norm: string;
}

export interface ProductLinks {
  directEquivalents: string[];
  couplingCompatible: string[];
  kitComposition: string[];
  productVariants: string[];
}

export interface StoreInventoryData {
  priceCents: number; // Stored as integer cents (BigInt arithmetic safe)
  stockQty: number;
  internalCode: string;
  stockLocation: string;
  notes: string;
}

export interface Product {
  id: string;
  sku: string;
  brand: string; // "TRW" | "Norflex"
  name: string;
  category: string;
  subcategory: string;
  makes: string[];
  models: string[];
  applications: VehicleApplication[];
  yearRanges: [number, number][];
  oemEquivalents: string[];
  specs: ProductSpecs;
  images: string[];
  staticImageUrls?: string[];
  imageAssetIds?: number[];
  removedStaticUrls?: string[];
  links: ProductLinks;
  storeInventoryData: StoreInventoryData;
  pdfPage: number;
  isLaunch: boolean;
  isCustom?: boolean;
  deletedAt?: number | null;
}

export interface CustomImageAsset {
  id?: number;
  productId: string;
  dataUrl: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  createdAt: number;
}

export interface AuditLog {
  id?: number;
  timestamp: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'STOCK_ADJUST' | 'BACKUP_EXPORT' | 'BACKUP_RESTORE' | 'CSV_IMPORT';
  targetId: string;
  targetSku: string;
  details: string;
  user?: string;
}

export interface FilterState {
  query: string;
  brand: string;
  category: string;
  make: string;
  position: string;
  inStockOnly: boolean;
  launchesOnly: boolean;
  sortBy: 'relevance' | 'sku' | 'name' | 'priceAsc' | 'priceDesc' | 'stockDesc' | 'lengthAsc';
}

export interface SearchMatchResult {
  product: Product;
  score: number;
  tier: 1 | 2 | 3 | 4;
  matchField: string;
  matchSnippet?: string;
}
