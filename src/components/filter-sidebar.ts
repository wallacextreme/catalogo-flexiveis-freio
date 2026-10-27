import type { FilterState } from '../types/catalog.ts';
import { icon } from './icons.ts';

export interface FilterSidebarProps {
  filter: FilterState;
  availableMakes: string[];
  totalActiveCount: number;
  isOpen: boolean;
  filteredCount: number;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onClose: () => void;
}

export function renderFilterSidebar(props: FilterSidebarProps): string {
  const { filter, availableMakes, isOpen, filteredCount } = props;

  if (!isOpen) return '';

  const brands = [
    { id: 'ALL', label: 'Todas as Marcas' },
    { id: 'TRW', label: 'TRW Aftermarket' },
    { id: 'Norflex', label: 'Norflex Brasil' },
  ];

  const categories = [
    { id: 'ALL', label: 'Todas as Categorias' },
    { id: 'Flexíveis de Freio Hidráulico', label: 'Freio Hidráulico' },
    { id: 'Flexíveis de Freio Ar', label: 'Freio a Ar (Pesados)' },
    { id: 'Direção Hidráulica', label: 'Direção Hidráulica' },
  ];

  const positions = [
    { id: 'ALL', label: 'Todas as Posições' },
    { id: 'DIANTEIRO', label: 'Dianteiro' },
    { id: 'TRASEIRO', label: 'Traseiro' },
    { id: 'CENTRAL', label: 'Central / Intermediário' },
  ];

  return `
    <div class="fixed inset-0 z-50 flex">
      <!-- Backdrop -->
      <div
        id="filter-drawer-backdrop"
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
        title="Clique para fechar filtros"
      ></div>

      <!-- Slide-over Drawer Panel -->
      <aside
        class="relative w-84 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 transition-transform duration-200 animate-in slide-in-from-left"
      >
        <!-- Drawer Header with reset & close -->
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <div class="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm uppercase font-heading">
            ${icon('layers', 'w-4 h-4 text-red-600')}
            <span>Filtros do Balcão</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              id="btn-reset-filters"
              type="button"
              class="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Limpar todos os filtros"
            >
              Limpar
            </button>
            <button
              id="btn-close-filter-drawer"
              type="button"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar Menu de Filtros"
            >
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Scrollable Filters List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-5">
          <!-- Brand Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Fabricante / Catálogo
            </label>
            <div class="flex flex-col gap-1">
              ${brands
                .map(
                  (b) => `
                <button
                  type="button"
                  data-filter-brand="${b.id}"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    filter.brand === b.id
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }"
                >
                  <span>${b.label}</span>
                  ${filter.brand === b.id ? icon('check', 'w-3.5 h-3.5') : ''}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Category Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Linha de Produto
            </label>
            <div class="flex flex-col gap-1">
              ${categories
                .map(
                  (c) => `
                <button
                  type="button"
                  data-filter-category="${c.id}"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    filter.category === c.id
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }"
                >
                  <span class="truncate">${c.label}</span>
                  ${filter.category === c.id ? icon('check', 'w-3.5 h-3.5') : ''}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Position Filter -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Posição no Veículo
            </label>
            <div class="flex flex-col gap-1">
              ${positions
                .map(
                  (p) => `
                <button
                  type="button"
                  data-filter-position="${p.id}"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    filter.position === p.id
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }"
                >
                  <span>${p.label}</span>
                  ${filter.position === p.id ? icon('check', 'w-3.5 h-3.5') : ''}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Make / Assembler Select -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Montadora / Veículo
            </label>
            <select
              id="select-filter-make"
              class="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium cursor-pointer"
            >
              <option value="ALL">Todas as Montadoras (${availableMakes.length})</option>
              ${availableMakes
                .map(
                  (m) => `
                <option value="${m}" ${filter.make === m ? 'selected' : ''}>${m}</option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Stock & Launch Quick Toggles -->
          <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label class="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 font-medium p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                id="checkbox-filter-stock"
                type="checkbox"
                ${filter.inStockOnly ? 'checked' : ''}
                class="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
              />
              <span>Apenas Com Estoque (> 0)</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 font-medium p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                id="checkbox-filter-launches"
                type="checkbox"
                ${filter.launchesOnly ? 'checked' : ''}
                class="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
              />
              <span>Destaques do Catálogo</span>
            </label>
          </div>

          <!-- Ordering -->
          <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Ordenação
            </label>
            <select
              id="select-filter-sort"
              class="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium cursor-pointer"
            >
              <option value="relevance" ${filter.sortBy === 'relevance' ? 'selected' : ''}>Relevância do Ranking</option>
              <option value="sku" ${filter.sortBy === 'sku' ? 'selected' : ''}>Código SKU (A-Z)</option>
              <option value="name" ${filter.sortBy === 'name' ? 'selected' : ''}>Nome do Produto</option>
              <option value="priceAsc" ${filter.sortBy === 'priceAsc' ? 'selected' : ''}>Menor Preço</option>
              <option value="priceDesc" ${filter.sortBy === 'priceDesc' ? 'selected' : ''}>Maior Preço</option>
              <option value="stockDesc" ${filter.sortBy === 'stockDesc' ? 'selected' : ''}>Maior Estoque</option>
              <option value="lengthAsc" ${filter.sortBy === 'lengthAsc' ? 'selected' : ''}>Comprimento (mm)</option>
            </select>
          </div>
        </div>

        <!-- Drawer Footer (Apply / Close) -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            id="btn-apply-filters"
            type="button"
            class="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-heading"
          >
            ${icon('check', 'w-4 h-4')}
            <span>Ver Peças (${filteredCount})</span>
          </button>
        </div>
      </aside>
    </div>
  `;
}
