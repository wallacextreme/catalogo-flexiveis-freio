import type { Product, SearchMatchResult } from '../types/catalog.ts';
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

function cleanMake(raw: string): string {
  if (!raw) return 'Geral';
  const up = raw.toUpperCase().trim();
  return CORRUPT_MAKE_MAP[up] || raw;
}

function cleanModel(raw: string): string {
  if (!raw) return '';
  let m = raw;
  for (const bad of Object.keys(CORRUPT_MAKE_MAP)) {
    m = m.replaceAll(bad, '');
  }
  m = m.replaceAll('E.E.E.E E-E E.E.E.E', '').replaceAll('E.E.E.E', '').replaceAll('E-E', '').replaceAll('... - ...', '');
  return m.replace(/\/\//g, ' / ').trim();
}

export interface ProductCardProps {
  item: SearchMatchResult;
  isCustomerMode: boolean;
  onOpenDetail: (productId: string) => void;
  onStockAdjust: (productId: string, delta: number) => void;
}

export function renderProductCard(props: ProductCardProps): string {
  const { item, isCustomerMode } = props;
  const p = item.product;
  const inv = p.storeInventoryData;

  const isNorflex = p.brand.toLowerCase() === 'norflex';
  const brandBadgeClass = isNorflex
    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';

  // Primary image
  const rawImg = p.images && p.images.length > 0 ? p.images[0] : '/catalog-images/norflex/placeholder.webp';
  const primaryImg = resolveImageUrl(rawImg);
  const fallbackImg = resolveImageUrl('/catalog-images/norflex/placeholder.webp');

  // Formatted price
  const priceFormatted = (inv.priceCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Main vehicle applications snippet
  const primaryApp = p.applications && p.applications.length > 0 ? p.applications[0] : null;
  const appSnippet = primaryApp
    ? `${cleanMake(primaryApp.make)} ${cleanModel(primaryApp.models)} (${primaryApp.years})`
    : p.makes.map(cleanMake).slice(0, 3).join(', ') || 'Aplicação Geral';

  // Primary OEM code
  const primaryOem = p.oemEquivalents && p.oemEquivalents.length > 0 ? p.oemEquivalents[0] : null;

  // Cross links count
  const directEquivCount = p.links?.directEquivalents?.length || 0;

  return `
    <article
      data-product-card-id="${p.id}"
      class="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
    >
      <!-- Top Card Header -->
      <div>
        <!-- Photo Container -->
        <div
          class="relative w-full h-44 bg-white dark:bg-slate-950 flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer overflow-hidden"
          data-action="open-detail"
          data-product-id="${p.id}"
        >
          <img
            src="${primaryImg}"
            alt="${p.name}"
            loading="lazy"
            class="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
            onerror="this.src='${fallbackImg}'"
          />
          
          <!-- Badges overlay -->
          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 text-[11px] font-extrabold uppercase rounded-md border shadow-2xs ${brandBadgeClass}">
              ${p.brand}
            </span>
            ${
              p.isLaunch
                ? `<span class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500 text-white shadow-2xs">Destaque</span>`
                : ''
            }
          </div>

          <div class="absolute top-2.5 right-2.5 flex items-center gap-1">
            <span class="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Pág. ${p.pdfPage}
            </span>
          </div>

          ${
            item.matchField && item.matchField !== 'all'
              ? `
            <div class="absolute bottom-2 left-2 right-2">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-red-600/90 text-white rounded-md backdrop-blur-xs">
                ${icon('search', 'w-3 h-3')} ${item.matchField}
              </span>
            </div>
          `
              : ''
          }
        </div>

        <!-- Body Info -->
        <div class="p-4 space-y-3">
          
          <!-- SKU & Direct Links Badge -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <h3
                  class="text-lg font-black tracking-tight text-slate-900 dark:text-white cursor-pointer hover:text-red-600 dark:hover:text-red-400 font-mono-code"
                  data-action="open-detail"
                  data-product-id="${p.id}"
                >
                  ${p.sku}
                </h3>
                <button
                  type="button"
                  data-action="copy-sku"
                  data-sku="${p.sku}"
                  class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                  title="Copiar Código SKU"
                >
                  ${icon('copy', 'w-3.5 h-3.5')}
                </button>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                ${p.name}
              </p>
            </div>

            ${
              directEquivCount > 0
                ? `
              <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Possui equivalência direta na outra marca">
                ${icon('link', 'w-3 h-3')} ${directEquivCount} ${p.brand === 'TRW' ? 'Norflex' : 'TRW'}
              </span>
            `
                : ''
            }
          </div>

          <!-- Position & Length Pill -->
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <span class="px-2 py-0.5 font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              ${p.specs.position || 'Dianteiro/Traseiro'}
            </span>
            ${
              p.specs.lengthMm
                ? `
              <span class="px-2 py-0.5 font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                ${p.specs.lengthMm} mm
              </span>
            `
                : ''
            }
          </div>

          <!-- Application Vehicle & OEM Code -->
          <div class="text-xs space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 line-clamp-1" title="${appSnippet}">
              ${icon('car', 'w-3.5 h-3.5 text-slate-400 shrink-0')}
              <span class="font-medium truncate">${appSnippet}</span>
            </div>

            ${
              primaryOem
                ? `
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-400 font-mono-code text-[11px]">
                <span class="truncate">OEM: <strong class="text-slate-800 dark:text-slate-200">${primaryOem}</strong></span>
                <button
                  type="button"
                  data-action="copy-oem"
                  data-oem="${primaryOem}"
                  class="text-slate-400 hover:text-red-600 p-0.5 rounded"
                  title="Copiar OEM"
                >
                  ${icon('copy', 'w-3 h-3')}
                </button>
              </div>
            `
                : ''
            }
          </div>

        </div>
      </div>

      <!-- Bottom Logistics & Counter Actions -->
      <div class="p-4 pt-0 space-y-3">
        
        <!-- Stock Location (Hidden in Customer Mode) -->
        ${
          !isCustomerMode
            ? `
          <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2 text-xs flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 truncate">
              ${icon('mapPin', 'w-3.5 h-3.5 text-amber-600 shrink-0')}
              <span class="font-medium truncate">${inv.stockLocation || 'Corredor F'}</span>
            </div>
            
            <!-- Quick Stock Buttons -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-action="stock-dec"
                data-product-id="${p.id}"
                class="w-6 h-6 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                title="Diminuir Estoque (-1)"
              >
                ${icon('minus', 'w-3 h-3')}
              </button>
              <span class="min-w-6 text-center font-mono font-bold text-slate-900 dark:text-white text-xs">
                ${inv.stockQty || 0}
              </span>
              <button
                type="button"
                data-action="stock-inc"
                data-product-id="${p.id}"
                class="w-6 h-6 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                title="Aumentar Estoque (+1)"
              >
                ${icon('plus', 'w-3 h-3')}
              </button>
            </div>
          </div>
        `
            : ''
        }

        <!-- Price & Action Buttons Strip -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
          
          <!-- Price Display (or Privacy Placeholder in Customer Mode) -->
          <div>
            ${
              isCustomerMode
                ? `<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Consulte no Balcão</span>`
                : `
              <div class="leading-tight">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Preço Balcão</span>
                <span class="text-base font-extrabold text-slate-900 dark:text-white font-mono-code">${priceFormatted}</span>
              </div>
            `
            }
          </div>

          <!-- Buttons: WhatsApp & Edit/Detail -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              data-action="share-whatsapp"
              data-product-id="${p.id}"
              class="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs shadow-emerald-500/30 transition-colors"
              title="Copiar Ficha Técnica Formatada para WhatsApp"
            >
              ${icon('whatsapp', 'w-4 h-4')}
            </button>

            <button
              type="button"
              data-action="open-detail"
              data-product-id="${p.id}"
              class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              Ver Detalhes
            </button>
          </div>

        </div>

      </div>
    </article>
  `;
}
