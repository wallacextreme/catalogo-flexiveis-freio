import type { AuditLog, Product } from '../types/catalog.ts';
import { icon } from './icons.ts';

export interface ManagementModalProps {
  activeTab: 'backup' | 'csv' | 'logs' | 'trash';
  auditLogs: AuditLog[];
  trashProducts: Product[];
  onTabChange: (tab: 'backup' | 'csv' | 'logs' | 'trash') => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
  onResetFactorySeed: () => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  onRestoreTrashItem: (productId: string) => void;
  onHardDeleteTrashItem: (productId: string) => void;
  onClose: () => void;
}

export function renderManagementModal(props: ManagementModalProps): string {
  const { activeTab, auditLogs, trashProducts } = props;

  return `
    <div id="management-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 glass-overlay animate-fadeIn">
      <div class="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              ${icon('database', 'w-4 h-4')}
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900 dark:text-white uppercase font-heading">
                Painel de Gestão & Backup
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Segurança Offline-First, CSV de Estoque e Trilha de Auditoria
              </p>
            </div>
          </div>

          <button
            id="btn-management-close"
            type="button"
            class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ${icon('x', 'w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            type="button"
            data-mgmt-tab="backup"
            class="px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }"
          >
            ${icon('shieldCheck', 'w-3.5 h-3.5')}
            <span>Backup & SHA-256</span>
          </button>

          <button
            type="button"
            data-mgmt-tab="csv"
            class="px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }"
          >
            ${icon('download', 'w-3.5 h-3.5')}
            <span>Estoque CSV</span>
          </button>

          <button
            type="button"
            data-mgmt-tab="logs"
            class="px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }"
          >
            ${icon('layers', 'w-3.5 h-3.5')}
            <span>Trilha de Auditoria</span>
          </button>

          <button
            type="button"
            data-mgmt-tab="trash"
            class="px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'trash'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }"
          >
            ${icon('trash', 'w-3.5 h-3.5')}
            <span>Lixeira (${trashProducts.length})</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
          
          <!-- TAB 1: Backup & SHA-256 -->
          ${
            activeTab === 'backup'
              ? `
            <div class="space-y-6">
              
              <!-- Export Section -->
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      ${icon('download', 'w-4 h-4 text-emerald-600')}
                      Exportar Backup Completo (.JSON)
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Gera um arquivo de backup com hash criptográfico SHA-256 contendo peças, fotos manuais e inventário.
                    </p>
                  </div>
                  <button
                    id="btn-export-backup"
                    type="button"
                    class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    ${icon('download', 'w-3.5 h-3.5')}
                    <span>Baixar Backup</span>
                  </button>
                </div>
              </div>

              <!-- Restore Section -->
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    ${icon('upload', 'w-4 h-4 text-blue-600')}
                    Restaurar Backup com Validação SHA-256
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    O sistema valida o hash SHA-256 antes de aplicar as alterações para garantir zero corrupção.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <input id="input-restore-backup" type="file" accept=".json" class="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-300" />
                </div>
              </div>

              <!-- Factory Reset Section -->
              <div class="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      ${icon('refresh', 'w-4 h-4 text-red-600')}
                      Restaurar Catálogo Original de Fábrica
                    </h3>
                    <p class="text-xs text-red-600/80 dark:text-red-400/80">
                      Recarrega a base oficial master dos PDFs (preservando suas edições de preços, estoque e localização).
                    </p>
                  </div>
                  <button
                    id="btn-reset-factory"
                    type="button"
                    class="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Reset de Fábrica
                  </button>
                </div>
              </div>

            </div>
          `
              : ''
          }

          <!-- TAB 2: CSV Stock Import/Export -->
          ${
            activeTab === 'csv'
              ? `
            <div class="space-y-6">
              
              <!-- Export CSV -->
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      ${icon('download', 'w-4 h-4 text-emerald-600')}
                      Exportar Tabela de Estoque em CSV
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Exporta colunas SKU, Marca, Código Interno, Preço (R$), Quantidade em Estoque e Localização Física.
                    </p>
                  </div>
                  <button
                    id="btn-export-csv"
                    type="button"
                    class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    ${icon('download', 'w-3.5 h-3.5')}
                    <span>Baixar CSV</span>
                  </button>
                </div>
              </div>

              <!-- Import CSV -->
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    ${icon('upload', 'w-4 h-4 text-blue-600')}
                    Importar / Atualizar Estoque via Planilha CSV
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Cruza por código SKU ou código interno e atualiza os preços e saldos em massa.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <input id="input-import-csv" type="file" accept=".csv" class="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-200 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-300" />
                </div>
              </div>

            </div>
          `
              : ''
          }

          <!-- TAB 3: Audit Logs -->
          ${
            activeTab === 'logs'
              ? `
            <div class="space-y-3">
              <div class="flex items-center justify-between pb-2">
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Últimos ${auditLogs.length} Registros de Atividade
                </span>
              </div>

              <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                    <tr>
                      <th class="px-3 py-2">Data / Hora</th>
                      <th class="px-3 py-2">Ação</th>
                      <th class="px-3 py-2">SKU</th>
                      <th class="px-3 py-2">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono-code text-[11px]">
                    ${
                      auditLogs.length > 0
                        ? auditLogs
                            .map((log) => {
                              const date = new Date(log.timestamp).toLocaleString('pt-BR');
                              return `
                          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td class="px-3 py-2 text-slate-500">${date}</td>
                            <td class="px-3 py-2">
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.action === 'CREATE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : log.action === 'DELETE'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }">
                                ${log.action}
                              </span>
                            </td>
                            <td class="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">${log.targetSku}</td>
                            <td class="px-3 py-2 text-slate-600 dark:text-slate-400 font-sans">${log.details}</td>
                          </tr>
                        `;
                            })
                            .join('')
                        : '<tr><td colspan="4" class="px-3 py-4 text-center text-slate-400 italic">Nenhum registro de log encontrado.</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>
          `
              : ''
          }

          <!-- TAB 4: Trash -->
          ${
            activeTab === 'trash'
              ? `
            <div class="space-y-3">
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Peças Inativas na Lixeira (${trashProducts.length})
              </span>

              <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                    <tr>
                      <th class="px-3 py-2">SKU</th>
                      <th class="px-3 py-2">Marca</th>
                      <th class="px-3 py-2">Nome</th>
                      <th class="px-3 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                    ${
                      trashProducts.length > 0
                        ? trashProducts
                            .map(
                              (tp) => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td class="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">${tp.sku}</td>
                          <td class="px-3 py-2 text-slate-600 dark:text-slate-400">${tp.brand}</td>
                          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${tp.name}</td>
                          <td class="px-3 py-2 text-right space-x-2">
                            <button
                              type="button"
                              data-action="trash-restore"
                              data-product-id="${tp.id}"
                              class="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                            >
                              Restaurar
                            </button>
                            <button
                              type="button"
                              data-action="trash-hard-delete"
                              data-product-id="${tp.id}"
                              class="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      `
                            )
                            .join('')
                        : '<tr><td colspan="4" class="px-3 py-6 text-center text-slate-400 italic">A lixeira está vazia.</td></tr>'
                    }
                  </tbody>
                </table>
              </div>
            </div>
          `
              : ''
          }

        </div>

        <!-- Modal Bottom Bar -->
        <div class="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            id="btn-management-close-footer"
            type="button"
            class="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  `;
}
