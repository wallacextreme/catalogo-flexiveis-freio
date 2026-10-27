import { icon } from './icons.ts';

export interface NavbarProps {
  totalCount: number;
  filteredCount: number;
  trashCount: number;
  isCustomerMode: boolean;
  isDarkMode: boolean;
  isInstallable?: boolean;
  onSearchChange: (query: string) => void;
  onToggleCustomerMode: () => void;
  onToggleDarkMode: () => void;
  onOpenManagement: () => void;
  onOpenCreate: () => void;
  onOpenTrash: () => void;
  onInstallPwa?: () => void;
}

export function renderNavbar(props: NavbarProps): string {
  const {
    totalCount,
    filteredCount,
    trashCount,
    isCustomerMode,
    isDarkMode,
    isInstallable,
  } = props;

  return `
    <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          <!-- Logo & Brand Title -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
              ${icon('wrench', 'w-5 h-5', 2.2)}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-base tracking-tight text-slate-900 dark:text-white uppercase font-heading">
                  Flexíveis <span class="text-red-600">Pro</span>
                </span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  TRW • Norflex
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ${isCustomerMode ? '<span class="text-emerald-600 dark:text-emerald-400 font-semibold">Modo Apresentação Cliente</span>' : 'Modo Operação de Balcão'}
              </p>
            </div>
          </div>

          <!-- Global Sub-50ms Search Bar -->
          <div class="flex-1 max-w-2xl relative">
            <div class="relative flex items-center">
              <span class="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                ${icon('search', 'w-4 h-4')}
              </span>
              <input
                id="global-search-input"
                type="text"
                placeholder="Buscar SKU, código OEM, carro, ano (ex: 3036, RPFX00480, Siena 2012, 540mm)..."
                class="w-full pl-10 pr-12 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all font-mono-code"
                autocomplete="off"
                spellcheck="false"
              />
              <span class="absolute right-3 px-1.5 py-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 pointer-events-none">
                /
              </span>
            </div>
          </div>

          <!-- Counter & Privacy Action Controls -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            <!-- Customer Mode Toggle (Ocultar/Mostrar Preços) -->
            ${
              isInstallable
                ? `
            <button
              id="btn-install-pwa"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] animate-pulse"
              title="Instalar Catálogo no Dispositivo (Modo PWA Offline)"
            >
              ${icon('download', 'w-4 h-4')}
              <span class="hidden sm:inline">Instalar App</span>
            </button>
            `
                : ''
            }
            <button
              id="btn-toggle-customer-mode"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                isCustomerMode
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }"
              title="${isCustomerMode ? 'Modo Cliente Ativo (Preços e Estoque Ocultos)' : 'Ativar Modo Cliente (Oculta Preços de Balcão e Localização)'}"
            >
              ${isCustomerMode ? icon('eyeOff', 'w-4 h-4') : icon('eye', 'w-4 h-4')}
              <span class="hidden md:inline">${isCustomerMode ? 'Preços Ocultos' : 'Modo Cliente'}</span>
            </button>

            <!-- Dark / Light Theme Toggle -->
            <button
              id="btn-toggle-dark-mode"
              type="button"
              class="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Alternar Tema Claro / Escuro"
            >
              ${isDarkMode ? icon('sun', 'w-4 h-4 text-amber-400') : icon('moon', 'w-4 h-4 text-slate-700')}
            </button>

            <!-- Management & Backup Modal -->
            <button
              id="btn-open-management"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
              title="Gestão de Estoque, Backup SHA-256 e Auditoria"
            >
              ${icon('database', 'w-4 h-4 text-red-600 dark:text-red-400')}
              <span class="hidden lg:inline">Gestão & Backup</span>
            </button>

            <!-- Trash / Soft-delete -->
            <button
              id="btn-open-trash"
              type="button"
              class="relative p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Lixeira / Peças Inativas"
            >
              ${icon('trash', 'w-4 h-4')}
              ${
                trashCount > 0
                  ? `<span class="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">${trashCount}</span>`
                  : ''
              }
            </button>

            <!-- Create New Product -->
            <button
              id="btn-open-create"
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm shadow-red-600/30 transition-all hover:translate-y-[-1px]"
              title="Cadastrar Nova Peça no Catálogo"
            >
              ${icon('plus', 'w-4 h-4', 2.5)}
              <span class="hidden sm:inline">Nova Peça</span>
            </button>

          </div>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <div class="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span>Produtos: <strong class="text-slate-800 dark:text-slate-200">${filteredCount}</strong> de ${totalCount}</span>
            <span class="hidden sm:inline">•</span>
            <span class="hidden sm:inline">Latência: <strong class="text-emerald-600 dark:text-emerald-400">0 ms (Offline-First)</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded">IndexedDB Dexie 4.0</span>
          </div>
        </div>
      </div>
    </header>
  `;
}
