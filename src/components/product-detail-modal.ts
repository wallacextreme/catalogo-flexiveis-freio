import type { Product, CustomImageAsset } from '../types/catalog.ts';
import { icon } from './icons.ts';
import { resolveImageUrl } from '../utils/imageUrl.ts';

const CORRUPT_MAKE_MAP: Record<string, string> = {
  'ECEHEREYESELEEERE': 'CHRYSLER',
  'EFEIEAETE': 'FIAT',
  'EFEOEREDE': 'FORD',
  'ECEHEEEVEREOELEEETE': 'CHEVROLET',
  'EGEEENEEEREAELE EMEOETEOERESE': 'CHEVROLET',
  'GM': 'CHEVROLET',
  'EIEVEEECEOE': 'IVECO',
  'EMEEERECEEEDEEESE-EBEEENEZE': 'MERCEDES-BENZ',
  'MERCEDES': 'MERCEDES-BENZ',
  'ECEIETEREOEEENE': 'CITROËN',
  'CITROEN': 'CITROËN',
  'EHEOENEDEAE': 'HONDA',
  'EKEIEAE': 'KIA',
  'EPEEEUEGEEEOETE': 'PEUGEOT',
  'EREEENEAEUELETE': 'RENAULT',
  'ETEOEYEOETEAE': 'TOYOTA',
  'EVEOELEKESEWEAEGEEENE': 'VOLKSWAGEN',
  'VW': 'VOLKSWAGEN',
  'FIAI': 'FIAT',
  'FORO': 'FORD',
};

function cleanMakeName(raw: string): string {
  if (!raw) return 'Geral';
  const up = raw.toUpperCase().trim();
  if (CORRUPT_MAKE_MAP[up]) return CORRUPT_MAKE_MAP[up];
  if (up.startsWith('E') && up.endsWith('E') && up.length >= 3) {
    let allE = true;
    for (let i = 0; i < up.length; i += 2) {
      if (up[i] !== 'E') { allE = false; break; }
    }
    if (allE) {
      let decoded = '';
      for (let i = 1; i < up.length; i += 2) decoded += up[i];
      if (CORRUPT_MAKE_MAP[decoded]) return CORRUPT_MAKE_MAP[decoded];
      return decoded;
    }
  }
  return raw;
}

function cleanModelName(raw: string, make: string): string {
  if (!raw) return make ? `${make} (Geral)` : 'Geral';
  let m = raw;
  for (const bad of Object.keys(CORRUPT_MAKE_MAP)) {
    m = m.replaceAll(bad, '');
  }
  m = m.replaceAll('E.E.E.E E-E E.E.E.E', '').replaceAll('E.E.E.E', '').replaceAll('E-E', '').replaceAll('... - ...', '');
  m = m.replace(/\/\//g, ' / ').trim();
  return m || `${make} (Geral)`;
}

export interface ProductDetailModalProps {
  product: Product;
  customImages: CustomImageAsset[];
  isCustomerMode: boolean;
  onClose: () => void;
  onNavigateProduct: (sku: string) => void;
  onOpenEdit: (product: Product) => void;
  onOpenLightbox: (imageUrl: string) => void;
  onDeleteCustomImage: (assetId: number) => void;
  onRemoveStaticImage: (url: string) => void;
  onStockAdjust: (delta: number) => void;
}

export function renderProductDetailModal(props: ProductDetailModalProps): string {
  const { product: p, customImages, isCustomerMode } = props;
  const inv = p.storeInventoryData;

  // Compile active gallery images: static urls (excluding removed) + custom images
  const removedSet = new Set(p.removedStaticUrls || []);
  const activeStatic = (p.staticImageUrls || p.images || []).filter((u) => !removedSet.has(u));
  const activeCustom = customImages.map((ci) => ({
    id: ci.id,
    url: ci.dataUrl,
    isCustom: true,
  }));

  const allGalleryItems = [
    ...activeStatic.map((u) => ({ id: 0, url: resolveImageUrl(u), isCustom: false })),
    ...activeCustom,
  ];

  if (allGalleryItems.length === 0) {
    allGalleryItems.push({ id: 0, url: resolveImageUrl('/catalog-images/norflex/placeholder.webp'), isCustom: false });
  }

  const priceFormatted = (inv.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const links = p.links || {
    directEquivalents: [],
    couplingCompatible: [],
    kitComposition: [],
    productVariants: [],
  };

  return `
    <div id="product-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 glass-overlay animate-fadeIn">
      <div class="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 text-xs font-black uppercase rounded-lg border shadow-xs ${
              p.brand.toLowerCase() === 'norflex'
                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }">
              ${p.brand}
            </span>
            <div>
              <h2 class="text-xl font-extrabold text-slate-900 dark:text-white font-mono-code flex items-center gap-2">
                ${p.sku}
                <button
                  type="button"
                  data-action="copy-sku"
                  data-sku="${p.sku}"
                  class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Copiar SKU"
                >
                  ${icon('copy', 'w-4 h-4')}
                </button>
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${p.name}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              id="btn-modal-edit"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              ${icon('edit', 'w-3.5 h-3.5')}
              <span>Editar Peça</span>
            </button>

            <button
              id="btn-modal-close"
              type="button"
              class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Modal Body (Two-Column Layout) -->
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- LEFT COLUMN: Multi-Angle Gallery & Upload Dropzone -->
          <div class="lg:col-span-5 space-y-4">
            
            <!-- Main Featured Image with Zoom overlay -->
            <div class="relative w-full h-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-4 group">
              <img
                id="modal-featured-image"
                src="${allGalleryItems[0].url}"
                alt="${p.name}"
                class="max-h-full max-w-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-200"
              />

              <button
                id="btn-trigger-lightbox"
                type="button"
                data-image-url="${allGalleryItems[0].url}"
                class="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-lg shadow-md backdrop-blur-xs transition-colors"
                title="Abrir Lightbox (Zoom 50% - 400%)"
              >
                ${icon('maximize', 'w-4 h-4')}
              </button>
            </div>

            <!-- Angle Thumbnails Carousel -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Galeria Multi-Ângulos (${allGalleryItems.length} foto${allGalleryItems.length > 1 ? 's' : ''})
              </span>
              <div class="flex items-center gap-2 overflow-x-auto pb-2">
                ${allGalleryItems
                  .map(
                    (item, idx) => `
                  <div class="relative shrink-0 w-16 h-16 rounded-lg border-2 ${
                    idx === 0 ? 'border-red-600' : 'border-slate-200 dark:border-slate-700'
                  } bg-white dark:bg-slate-950 p-1 cursor-pointer group/thumb overflow-hidden"
                  data-thumb-index="${idx}"
                  data-thumb-url="${item.url}"
                  >
                    <img src="${item.url}" alt="Ângulo ${idx + 1}" class="w-full h-full object-contain" />
                    ${
                      item.isCustom
                        ? `
                      <button
                        type="button"
                        data-action="delete-custom-img"
                        data-asset-id="${item.id}"
                        class="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                        title="Excluir Foto"
                      >
                        ${icon('x', 'w-2.5 h-2.5')}
                      </button>
                    `
                        : ''
                    }
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Drag & Drop / Ctrl+V Paste Upload Zone -->
            <div
              id="gallery-dropzone"
              class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-600 dark:hover:border-red-500 rounded-xl p-4 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer"
            >
              <div class="flex flex-col items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400">
                ${icon('camera', 'w-6 h-6 text-red-600 dark:text-red-400')}
                <p class="text-xs font-semibold">
                  Arraste fotos ou aperte <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded border">Ctrl+V</kbd>
                </p>
                <p class="text-[11px] text-slate-400">
                  Conversão automática para WebP (quality 0.92)
                </p>
                <input id="gallery-file-input" type="file" multiple accept="image/*" class="hidden" />
              </div>
            </div>

            <!-- Original PDF Page Badge -->
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Catálogo Oficial ${p.brand}</span>
              <span class="font-mono font-semibold">Página ${p.pdfPage}</span>
            </div>

          </div>

          <!-- RIGHT COLUMN: Logistics, 4-Link Panel, OEMs & Specs -->
          <div class="lg:col-span-7 space-y-6">
            
            <!-- Logistics Block (Exclusive Counter - Hidden in Customer Mode) -->
            ${
              !isCustomerMode
                ? `
              <div class="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs uppercase tracking-wide">
                    ${icon('boxes', 'w-4 h-4 text-amber-600')}
                    <span>Logística Interna de Balcão</span>
                  </div>
                  <span class="text-xs font-mono font-semibold text-amber-800 dark:text-amber-300">
                    Cód. Interno: ${inv.internalCode || 'N/A'}
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span class="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">Preço de Balcão</span>
                    <span class="text-lg font-black text-slate-900 dark:text-white font-mono-code">${priceFormatted}</span>
                  </div>

                  <div>
                    <span class="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">Localização Física</span>
                    <span class="text-xs font-bold text-slate-900 dark:text-white">${inv.stockLocation || 'Corredor F'}</span>
                  </div>

                  <div>
                    <span class="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">Qtd em Estoque</span>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        data-action="modal-stock-dec"
                        class="w-6 h-6 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                      >
                        ${icon('minus', 'w-3 h-3')}
                      </button>
                      <span id="modal-stock-qty" class="min-w-6 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                        ${inv.stockQty || 0}
                      </span>
                      <button
                        type="button"
                        data-action="modal-stock-inc"
                        class="w-6 h-6 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                      >
                        ${icon('plus', 'w-3 h-3')}
                      </button>
                    </div>
                  </div>
                </div>

                ${
                  inv.notes
                    ? `<p class="text-xs text-amber-800/80 dark:text-amber-300/80 italic border-t border-amber-200/60 dark:border-amber-900/40 pt-2">${inv.notes}</p>`
                    : ''
                }
              </div>
            `
                : ''
            }

            <!-- 4-LINK TYPES PANEL: Cross-Brand Interchange -->
            <div class="space-y-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div class="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide">
                ${icon('link', 'w-4 h-4 text-red-600')}
                <span>Vínculos Cruzados Inteligentes</span>
              </div>

              <!-- 1. Equivalência Direta -->
              <div class="space-y-1">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Equivalência Direta (${links.directEquivalents.length}):
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${
                    links.directEquivalents.length > 0
                      ? links.directEquivalents
                          .map(
                            (eq) => `
                        <button
                          type="button"
                          data-action="jump-sku"
                          data-jump-sku="${eq}"
                          class="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 rounded-lg shadow-2xs transition-colors"
                        >
                          ${eq}
                        </button>
                      `
                          )
                          .join('')
                      : '<span class="text-xs text-slate-400 italic">Sem equivalência direta cadastrada</span>'
                  }
                </div>
              </div>

              <!-- 2. Compatibilidade de Acoplamento (Eixo Oposto / Diant-Tras) -->
              <div class="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  Acoplamento / Par Complementar (${links.couplingCompatible.length}):
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${
                    links.couplingCompatible.length > 0
                      ? links.couplingCompatible
                          .map(
                            (c) => `
                        <button
                          type="button"
                          data-action="jump-sku"
                          data-jump-sku="${c}"
                          class="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 rounded-lg shadow-2xs transition-colors"
                        >
                          ${c}
                        </button>
                      `
                          )
                          .join('')
                      : '<span class="text-xs text-slate-400 italic">Nenhum par complementar sugerido</span>'
                  }
                </div>
              </div>

              <!-- 3. Composição de Kit -->
              <div class="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                  Itens do Mesmo Veículo / Kit (${links.kitComposition.length}):
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${
                    links.kitComposition.length > 0
                      ? links.kitComposition
                          .map(
                            (k) => `
                        <button
                          type="button"
                          data-action="jump-sku"
                          data-jump-sku="${k}"
                          class="px-2 py-0.5 text-xs font-mono font-medium bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 rounded-md transition-colors"
                        >
                          ${k}
                        </button>
                      `
                          )
                          .join('')
                      : '<span class="text-xs text-slate-400 italic">Sem composição de kit</span>'
                  }
                </div>
              </div>

              <!-- 4. Variantes de Produto (Comprimento / Rosca) -->
              <div class="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  Variantes de Comprimento / Rosca (${links.productVariants.length}):
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${
                    links.productVariants.length > 0
                      ? links.productVariants
                          .map(
                            (v) => `
                        <button
                          type="button"
                          data-action="jump-sku"
                          data-jump-sku="${v}"
                          class="px-2 py-0.5 text-xs font-mono font-medium bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          ${v}
                        </button>
                      `
                          )
                          .join('')
                      : '<span class="text-xs text-slate-400 italic">Sem variantes de medida</span>'
                  }
                </div>
              </div>

            </div>

            <!-- OEM Equivalents List -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Códigos Originais (OEM Equivalents)
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${
                  p.oemEquivalents && p.oemEquivalents.length > 0
                    ? p.oemEquivalents
                        .map(
                          (oem) => `
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        ${oem}
                        <button
                          type="button"
                          data-action="copy-oem"
                          data-oem="${oem}"
                          class="text-slate-400 hover:text-red-600 transition-colors"
                          title="Copiar OEM"
                        >
                          ${icon('copy', 'w-3 h-3')}
                        </button>
                      </span>
                    `
                        )
                        .join('')
                    : '<span class="text-xs text-slate-400 italic">Sem código OEM informado</span>'
                }
              </div>
            </div>

            <!-- Technical Specifications Table -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Ficha Técnica de Engenharia
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span class="text-slate-400 block text-[11px]">Posição:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.specs.position || 'Dianteiro/Traseiro'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Comprimento:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.specs.lengthMm ? `${p.specs.lengthMm} mm` : 'Padrão'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Padrão de Rosca:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.specs.threadStandard || 'M10x1 / M12x1'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Tipo de Tubo:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.specs.hoseType || 'Hidráulico Alta Pressão'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Norma Técnica:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.specs.norm || 'SAE J 1401'}</strong>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Fabricante:</span>
                  <strong class="text-slate-800 dark:text-slate-200">${p.brand}</strong>
                </div>
              </div>
            </div>

            <!-- Structured Vehicle Applications Table -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Aplicações Veiculares (${p.applications.length})
              </span>
              <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase sticky top-0">
                    <tr>
                      <th class="px-3 py-2">Montadora</th>
                      <th class="px-3 py-2">Modelo / Versão</th>
                      <th class="px-3 py-2">Ano</th>
                      <th class="px-3 py-2">Posição</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                    ${p.applications
                      .map(
                        (app) => `
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td class="px-3 py-2 font-semibold text-slate-900 dark:text-white">${cleanMakeName(app.make)}</td>
                        <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${cleanModelName(app.models, app.make)}</td>
                        <td class="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">${app.years}</td>
                        <td class="px-3 py-2 text-slate-600 dark:text-slate-400">${app.position || p.specs.position || '-'}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              id="btn-modal-whatsapp"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
            >
              ${icon('whatsapp', 'w-4 h-4')}
              <span>Copiar p/ WhatsApp</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              id="btn-modal-close-footer"
              type="button"
              class="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}
