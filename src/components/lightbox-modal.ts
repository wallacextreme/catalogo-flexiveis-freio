import { icon } from './icons.ts';

export interface LightboxModalProps {
  imageUrl: string;
  zoomLevel: number; // e.g. 1.0 = 100%, 0.5 = 50%, 4.0 = 400%
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClose: () => void;
}

export function renderLightboxModal(props: LightboxModalProps): string {
  const { imageUrl, zoomLevel } = props;
  const zoomPercent = Math.round(zoomLevel * 100);

  return `
    <div id="lightbox-modal" class="fixed inset-0 z-60 flex flex-col bg-slate-950/95 backdrop-blur-md animate-fadeIn select-none">
      
      <!-- Lightbox Header Controls -->
      <div class="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-white uppercase tracking-wider">
            Visualizador de Estúdio HD
          </span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            ${zoomPercent}%
          </span>
        </div>

        <!-- Zoom & Close Actions -->
        <div class="flex items-center gap-2">
          <button
            id="btn-lightbox-zoom-out"
            type="button"
            class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            title="Reduzir Zoom (-25%)"
          >
            ${icon('zoomOut', 'w-4 h-4')}
          </button>

          <button
            id="btn-lightbox-reset-zoom"
            type="button"
            class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            title="Resetar Zoom (100%)"
          >
            100%
          </button>

          <button
            id="btn-lightbox-zoom-in"
            type="button"
            class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            title="Aumentar Zoom (+25%)"
          >
            ${icon('zoomIn', 'w-4 h-4')}
          </button>

          <div class="h-6 w-px bg-slate-800 mx-1"></div>

          <button
            id="btn-lightbox-close"
            type="button"
            class="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="Fechar Visualizador (Esc)"
          >
            ${icon('x', 'w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Image Canvas Viewport -->
      <div class="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div
          class="transition-transform duration-200 ease-out origin-center flex items-center justify-center p-6"
          style="transform: scale(${zoomLevel});"
        >
          <img
            src="${imageUrl}"
            alt="Foto do Flexível de Freio em Alta Definição"
            class="max-h-[80vh] max-w-[85vw] object-contain drop-shadow-2xl rounded-lg bg-white p-4"
          />
        </div>
      </div>

      <!-- Bottom Hint -->
      <div class="py-2 px-6 text-center text-xs text-slate-500 bg-slate-900/60 border-t border-slate-800">
        Pressione <kbd class="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd> para fechar ou use os controles de zoom de 50% a 400%.
      </div>

    </div>
  `;
}
