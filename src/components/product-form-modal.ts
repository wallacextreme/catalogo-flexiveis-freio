import type { Product } from '../types/catalog.ts';
import { icon } from './icons.ts';

export interface ProductFormModalProps {
  product?: Product | null; // null = create mode
  isTrash?: boolean;
  onSave: (product: Product, isNew: boolean) => void;
  onDuplicate: (product: Product) => void;
  onSoftDelete: (productId: string) => void;
  onRestore: (productId: string) => void;
  onHardDelete: (productId: string) => void;
  onClose: () => void;
}

export function renderProductFormModal(props: ProductFormModalProps): string {
  const { product: p, isTrash } = props;
  const isEdit = !!p;

  const title = isEdit ? `Editar Peça — ${p.sku}` : 'Cadastrar Nova Peça no Catálogo';

  // Default values
  const sku = p?.sku || '';
  const brand = p?.brand || 'TRW';
  const name = p?.name || 'Flexível de Freio Dianteiro';
  const category = p?.category || 'Flexíveis de Freio Hidráulico';
  const subcategory = p?.subcategory || 'Flexível de Freio';
  const position = p?.specs?.position || 'Dianteiro';
  const lengthMm = p?.specs?.lengthMm || 450;
  const threadStandard = p?.specs?.threadStandard || 'Macho / Fêmea M10x1';
  const hoseType = p?.specs?.hoseType || 'Hidráulico Alta Pressão';
  const norm = p?.specs?.norm || 'SAE J 1401';
  const oemText = (p?.oemEquivalents || []).join('\n');
  const makesText = (p?.makes || []).join(', ');
  const directLinksText = (p?.links?.directEquivalents || []).join(', ');
  const couplingLinksText = (p?.links?.couplingCompatible || []).join(', ');

  const priceReais = p ? (p.storeInventoryData.priceCents / 100).toFixed(2).replace('.', ',') : '35,00';
  const stockQty = p ? p.storeInventoryData.stockQty : 10;
  const internalCode = p?.storeInventoryData?.internalCode || `INT-${sku || 'NEW'}`;
  const stockLocation = p?.storeInventoryData?.stockLocation || 'Corredor F • Prateleira 2 • Gaveta 10';
  const notes = p?.storeInventoryData?.notes || '';

  return `
    <div id="product-form-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 glass-overlay animate-fadeIn">
      <div class="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              ${icon('wrench', 'w-4 h-4')}
            </div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white uppercase font-heading">
              ${title}
            </h2>
          </div>

          <button
            id="btn-form-close"
            type="button"
            class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ${icon('x', 'w-5 h-5')}
          </button>
        </div>

        <!-- Form Scrollable Body -->
        <form id="product-edit-form" class="flex-1 overflow-y-auto p-6 space-y-6">
          <input type="hidden" id="form-product-id" value="${p?.id || ''}" />
          
          <!-- Section 1: Identification -->
          <div>
            <h3 class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ${icon('tag', 'w-3.5 h-3.5')}
              1. Identificação do Produto
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Código SKU *</label>
                <input
                  id="form-sku"
                  type="text"
                  required
                  value="${sku}"
                  placeholder="Ex: RPFX00480 ou 3036"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fabricante *</label>
                <select
                  id="form-brand"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  <option value="TRW" ${brand === 'TRW' ? 'selected' : ''}>TRW Automotive</option>
                  <option value="Norflex" ${brand === 'Norflex' ? 'selected' : ''}>Norflex Brasil</option>
                  <option value="Outro" ${brand !== 'TRW' && brand !== 'Norflex' ? 'selected' : ''}>Outro Fabricante</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Linha / Categoria</label>
                <select
                  id="form-category"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  <option value="Flexíveis de Freio Hidráulico" ${category === 'Flexíveis de Freio Hidráulico' ? 'selected' : ''}>Freio Hidráulico</option>
                  <option value="Flexíveis de Freio Ar" ${category === 'Flexíveis de Freio Ar' ? 'selected' : ''}>Freio a Ar (Pesados)</option>
                  <option value="Direção Hidráulica" ${category === 'Direção Hidráulica' ? 'selected' : ''}>Direção Hidráulica</option>
                </select>
              </div>

              <div class="sm:col-span-3">
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Descritivo do Produto</label>
                <input
                  id="form-name"
                  type="text"
                  value="${name}"
                  placeholder="Ex: Flexível de Freio Dianteiro Direito 540mm"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Technical Specs -->
          <div class="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ${icon('wrench', 'w-3.5 h-3.5')}
              2. Ficha Técnica de Engenharia
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Posição no Veículo</label>
                <input
                  id="form-position"
                  type="text"
                  value="${position}"
                  placeholder="Ex: Dianteiro, Traseiro, D/D, D/E"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Comprimento (mm)</label>
                <input
                  id="form-length"
                  type="number"
                  value="${lengthMm}"
                  placeholder="Ex: 540"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Padrão de Rosca</label>
                <input
                  id="form-thread"
                  type="text"
                  value="${threadStandard}"
                  placeholder="Ex: Macho / Fêmea M10x1 / M12x1"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Tubo</label>
                <input
                  id="form-hose-type"
                  type="text"
                  value="${hoseType}"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Norma Técnica</label>
                <input
                  id="form-norm"
                  type="text"
                  value="${norm}"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: OEMs & Applications -->
          <div class="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ${icon('car', 'w-3.5 h-3.5')}
              3. Códigos OEM & Montadoras
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Códigos Originais (OEM - 1 por linha)</label>
                <textarea
                  id="form-oems"
                  rows="3"
                  placeholder="51.785.991&#10;3.617.777&#10;BED.T22.82A"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                >${oemText}</textarea>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Montadoras (separadas por vírgula)</label>
                <input
                  id="form-makes"
                  type="text"
                  value="${makesText}"
                  placeholder="Ex: FIAT, FORD, VOLKSWAGEN"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Section 4: Cross Links -->
          <div class="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 class="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ${icon('link', 'w-3.5 h-3.5')}
              4. Vínculos e Equivalências Cruzadas
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Equivalência Direta (SKUs separados por vírgula)</label>
                <input
                  id="form-direct-links"
                  type="text"
                  value="${directLinksText}"
                  placeholder="Ex: RPFX00480, 3036"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pares de Acoplamento (Eixo oposto)</label>
                <input
                  id="form-coupling-links"
                  type="text"
                  value="${couplingLinksText}"
                  placeholder="Ex: 3013, RPFX00110"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Section 5: Counter Store Inventory (Isolated) -->
          <div class="border-t border-slate-200 dark:border-slate-800 pt-4 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border">
            <h3 class="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ${icon('boxes', 'w-3.5 h-3.5')}
              5. Dados de Inventário e Balcão (Isolamento Inviolável)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-amber-900 dark:text-amber-300 mb-1">Preço de Balcão (R$)</label>
                <input
                  id="form-price"
                  type="text"
                  value="${priceReais}"
                  placeholder="35,00"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-amber-900 dark:text-amber-300 mb-1">Quantidade em Estoque</label>
                <input
                  id="form-stock-qty"
                  type="number"
                  value="${stockQty}"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-amber-900 dark:text-amber-300 mb-1">Código Interno da Loja</label>
                <input
                  id="form-internal-code"
                  type="text"
                  value="${internalCode}"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-amber-900 dark:text-amber-300 mb-1">Localização Física no Estoque</label>
                <input
                  id="form-location"
                  type="text"
                  value="${stockLocation}"
                  placeholder="Corredor F • Prateleira 2 • Gaveta 10"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-amber-900 dark:text-amber-300 mb-1">Notas Internas</label>
                <input
                  id="form-notes"
                  type="text"
                  value="${notes}"
                  placeholder="Observações do balconista"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

        </form>

        <!-- Modal Bottom Actions -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          
          <!-- Destructive / Duplicate Actions for Existing Item -->
          <div class="flex items-center gap-2">
            ${
              isEdit
                ? `
              <button
                id="btn-form-duplicate"
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Criar cópia desta peça com novo SKU"
              >
                ${icon('copy', 'w-3.5 h-3.5')}
                <span>Duplicar Peça</span>
              </button>

              ${
                !isTrash
                  ? `
                <button
                  id="btn-form-soft-delete"
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-colors"
                  title="Mover para a Lixeira"
                >
                  ${icon('trash', 'w-3.5 h-3.5')}
                  <span>Lixeira</span>
                </button>
              `
                  : `
                <button
                  id="btn-form-restore"
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  title="Restaurar Peça para o Catálogo Ativo"
                >
                  ${icon('refresh', 'w-3.5 h-3.5')}
                  <span>Restaurar Peça</span>
                </button>
              `
              }

              <button
                id="btn-form-hard-delete"
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 transition-colors"
                title="Excluir definitivamente do banco"
              >
                ${icon('trash', 'w-3.5 h-3.5')}
                <span>Excluir Definitivo</span>
              </button>
            `
                : ''
            }
          </div>

          <!-- Save / Cancel -->
          <div class="flex items-center gap-2">
            <button
              id="btn-form-cancel"
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            <button
              id="btn-form-submit"
              type="button"
              class="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm shadow-red-600/30 transition-all hover:-translate-y-0.5"
            >
              ${icon('check', 'w-4 h-4', 2.5)}
              <span>${isEdit ? 'Salvar Alterações' : 'Cadastrar Peça'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  `;
}
