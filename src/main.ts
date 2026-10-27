import './style.css';
import type { Product, FilterState, SearchMatchResult, CustomImageAsset, AuditLog } from './types/catalog.ts';
import {
  initDatabase,
  getAllActiveProducts,
  getTrashProducts,
  getProductById,
  getProductBySku,
  saveProduct,
  adjustStockQty,
  softDeleteProduct,
  restoreProductFromTrash,
  hardDeleteProduct,
  addCustomImage,
  getCustomImagesForProduct,
  deleteCustomImage,
  getRecentAuditLogs,
  resetToFactorySeed,
} from './db/database.ts';
import { searchProducts } from './utils/smartSearch.ts';
import { convertBlobToWebP, extractImagesFromClipboard, formatBytes } from './utils/imagePipeline.ts';
import {
  exportDatabaseBackup,
  restoreDatabaseBackup,
  exportInventoryCsv,
  importInventoryCsv,
} from './utils/backupRestore.ts';
import { renderNavbar } from './components/navbar.ts';
import { renderFilterSidebar } from './components/filter-sidebar.ts';
import { renderProductCard } from './components/product-card.ts';
import { renderProductDetailModal } from './components/product-detail-modal.ts';
import { renderProductFormModal } from './components/product-form-modal.ts';
import { renderManagementModal } from './components/management-modal.ts';
import { renderLightboxModal } from './components/lightbox-modal.ts';
import { icon } from './components/icons.ts';

// -------------------------------------------------------------
// APPLICATION STATE
// -------------------------------------------------------------
let allProducts: Product[] = [];
let trashProductsList: Product[] = [];
let availableMakes: string[] = [];

let filterState: FilterState = {
  query: '',
  brand: 'ALL',
  category: 'ALL',
  make: 'ALL',
  position: 'ALL',
  inStockOnly: false,
  launchesOnly: false,
  sortBy: 'relevance',
};

let isCustomerMode = localStorage.getItem('mode_cliente') === 'true';
let isDarkMode = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Modal states
let activeDetailProduct: Product | null = null;
let activeCustomImages: CustomImageAsset[] = [];
let displayedProductsLimit = 48;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let isFormModalOpen = false;
let formEditProduct: Product | null = null;

let isManagementModalOpen = false;
let managementTab: 'backup' | 'csv' | 'logs' | 'trash' = 'backup';
let recentAuditLogs: AuditLog[] = [];

let lightboxUrl: string | null = null;
let lightboxZoom = 1.0;

// Toast notification
let toastTimeout: any = null;

// PWA Install prompt state
let deferredInstallPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  renderApp();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  showToast('Catálogo instalado com sucesso como PWA!');
  renderApp();
});

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------
async function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Apply dark mode class
  applyTheme();

  // Show initial loading state
  appContainer.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div class="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 animate-pulse">
        ${icon('wrench', 'w-8 h-8')}
      </div>
      <h1 class="mt-4 text-xl font-extrabold text-slate-900 dark:text-white uppercase font-heading">
        Flexíveis <span class="text-red-600">Pro</span>
      </h1>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-code">
        Indexando base Offline-First (TRW & Norflex)...
      </p>
    </div>
  `;

  // Initialize IndexedDB with auto-seed
  await initDatabase();

  // Load products
  await refreshProductsFromDb();

  // Setup global event listeners
  setupGlobalListeners();

  // Render main layout
  renderApp();

  // Register PWA Service Worker if in browser
  registerServiceWorker();
}

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

function sanitizeMake(raw: string): string {
  if (!raw) return '';
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
  return raw.trim();
}

async function refreshProductsFromDb() {
  allProducts = await getAllActiveProducts();
  trashProductsList = await getTrashProducts();

  // Compute unique makes
  const makeSet = new Set<string>();
  for (const p of allProducts) {
    for (const m of p.makes) {
      const cleanM = sanitizeMake(m);
      if (cleanM && cleanM !== 'GERAL') makeSet.add(cleanM);
    }
  }
  availableMakes = Array.from(makeSet).sort();
}

function applyTheme() {
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
  }
}

// -------------------------------------------------------------
// RENDER MAIN APPLICATION LAYOUT
// -------------------------------------------------------------
function renderApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Preserve search input focus and selection range across full re-renders
  const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
  const wasInputFocused = document.activeElement === searchInput;
  const selStart = searchInput?.selectionStart ?? null;
  const selEnd = searchInput?.selectionEnd ?? null;

  const t0 = performance.now();
  const searchResults = searchProducts(allProducts, filterState);
  const searchDurationMs = (performance.now() - t0).toFixed(1);

  const navbarHtml = renderNavbar({
    query: filterState.query,
    totalCount: allProducts.length,
    filteredCount: searchResults.length,
    trashCount: trashProductsList.length,
    isCustomerMode,
    isDarkMode,
    isInstallable: !!deferredInstallPrompt,
    onSearchChange: (q) => {
      filterState.query = q;
      displayedProductsLimit = 48;
      updateSearchListOnly();
    },
    onToggleCustomerMode: () => {
      isCustomerMode = !isCustomerMode;
      localStorage.setItem('mode_cliente', String(isCustomerMode));
      renderApp();
    },
    onToggleDarkMode: () => {
      isDarkMode = !isDarkMode;
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      applyTheme();
      renderApp();
    },
    onOpenManagement: async () => {
      recentAuditLogs = await getRecentAuditLogs(60);
      isManagementModalOpen = true;
      renderApp();
    },
    onOpenCreate: () => {
      formEditProduct = null;
      isFormModalOpen = true;
      renderApp();
    },
    onOpenTrash: () => {
      managementTab = 'trash';
      isManagementModalOpen = true;
      renderApp();
    },
  });

  const sidebarHtml = renderFilterSidebar({
    filter: filterState,
    availableMakes,
    totalActiveCount: allProducts.length,
    onFilterChange: (newFilters) => {
      filterState = { ...filterState, ...newFilters };
      displayedProductsLimit = 48;
      renderApp();
    },
    onResetFilters: () => {
      filterState = {
        query: '',
        brand: 'ALL',
        category: 'ALL',
        make: 'ALL',
        position: 'ALL',
        inStockOnly: false,
        launchesOnly: false,
        sortBy: 'relevance',
      };
      displayedProductsLimit = 48;
      renderApp();
    },
  });

  // Product cards
  let productsGridHtml = '';
  if (searchResults.length > 0) {
    const itemsToRender = searchResults.slice(0, displayedProductsLimit);
    productsGridHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        ${itemsToRender.map((item) => renderProductCard({ item, isCustomerMode, onOpenDetail: () => {}, onStockAdjust: () => {} })).join('')}
      </div>
    `;
    if (searchResults.length > displayedProductsLimit) {
      productsGridHtml += `
        <div class="pt-6 pb-2 text-center">
          <button
            id="btn-load-more"
            type="button"
            class="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            Exibindo ${displayedProductsLimit} de ${searchResults.length} — Carregar mais peças (+${Math.min(48, searchResults.length - displayedProductsLimit)})
          </button>
        </div>
      `;
    }
  } else {
    productsGridHtml = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          ${icon('search', 'w-6 h-6')}
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Nenhum flexível encontrado</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Tente buscar o número do flexível (ex: 3036, 1005, 2129), código TRW (ex: RPFX00480) ou modelo do carro e ano (ex: Siena 2012, Palio, Gol).
        </p>
      </div>
    `;
  }

  // Modals
  let modalHtml = '';
  if (activeDetailProduct) {
    modalHtml += renderProductDetailModal({
      product: activeDetailProduct,
      customImages: activeCustomImages,
      isCustomerMode,
      onClose: () => {},
      onNavigateProduct: () => {},
      onOpenEdit: () => {},
      onOpenLightbox: () => {},
      onDeleteCustomImage: () => {},
      onRemoveStaticImage: () => {},
      onStockAdjust: () => {},
    });
  }

  if (isFormModalOpen) {
    modalHtml += renderProductFormModal({
      product: formEditProduct,
      isTrash: formEditProduct ? !!formEditProduct.deletedAt : false,
      onSave: () => {},
      onDuplicate: () => {},
      onSoftDelete: () => {},
      onRestore: () => {},
      onHardDelete: () => {},
      onClose: () => {},
    });
  }

  if (isManagementModalOpen) {
    modalHtml += renderManagementModal({
      activeTab: managementTab,
      auditLogs: recentAuditLogs,
      trashProducts: trashProductsList,
      onTabChange: () => {},
      onExportBackup: () => {},
      onRestoreBackup: () => {},
      onResetFactorySeed: () => {},
      onExportCsv: () => {},
      onImportCsv: () => {},
      onRestoreTrashItem: () => {},
      onHardDeleteTrashItem: () => {},
      onClose: () => {},
    });
  }

  if (lightboxUrl) {
    modalHtml += renderLightboxModal({
      imageUrl: lightboxUrl,
      zoomLevel: lightboxZoom,
      onZoomIn: () => {},
      onZoomOut: () => {},
      onResetZoom: () => {},
      onClose: () => {},
    });
  }

  appContainer.innerHTML = `
    <div class="min-h-screen flex flex-col transition-colors">
      ${navbarHtml}

      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          ${sidebarHtml}

          <section class="flex-1 w-full space-y-4">
            
            <!-- Search Results Meta Bar -->
            <div id="search-meta-container" class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <span>Exibindo <strong>${Math.min(searchResults.length, displayedProductsLimit)}</strong> de ${searchResults.length} peças encontradas</span>
                ${
                  filterState.query
                    ? `<span class="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-[11px]">Busca: "${escapeHtml(filterState.query)}"</span>`
                    : ''
                }
              </div>
              <div>
                <span>Latência de busca: <strong class="text-emerald-600 dark:text-emerald-400">${searchDurationMs} ms</strong></span>
              </div>
            </div>

            <div id="products-grid-container">
              ${productsGridHtml}
            </div>
          </section>
        </div>
      </main>

      <div id="toast-container" class="fixed bottom-5 right-5 z-70 pointer-events-none"></div>

      ${modalHtml}
    </div>
  `;

  // Restore search input focus & cursor selection position if it had focus
  if (wasInputFocused) {
    const newSearchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
    if (newSearchInput) {
      newSearchInput.focus();
      if (selStart !== null && selEnd !== null) {
        newSearchInput.setSelectionRange(selStart, selEnd);
      }
    }
  }
}

function updateSearchListOnly() {
  const t0 = performance.now();
  const searchResults = searchProducts(allProducts, filterState);
  const searchDurationMs = (performance.now() - t0).toFixed(1);

  const navCount = document.getElementById('navbar-filtered-count');
  const navLat = document.getElementById('navbar-latency');
  if (navCount) navCount.textContent = String(searchResults.length);
  if (navLat) navLat.textContent = `${searchDurationMs} ms (Sub-50ms)`;

  const metaContainer = document.getElementById('search-meta-container');
  if (metaContainer) {
    metaContainer.innerHTML = `
      <div class="flex items-center gap-2">
        <span>Exibindo <strong>${Math.min(searchResults.length, displayedProductsLimit)}</strong> de ${searchResults.length} peças encontradas</span>
        ${
          filterState.query
            ? `<span class="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono text-[11px]">Busca: "${escapeHtml(filterState.query)}"</span>`
            : ''
        }
      </div>
      <div>
        <span>Latência de busca: <strong class="text-emerald-600 dark:text-emerald-400">${searchDurationMs} ms</strong></span>
      </div>
    `;
  }

  const gridContainer = document.getElementById('products-grid-container');
  if (gridContainer) {
    if (searchResults.length > 0) {
      const itemsToRender = searchResults.slice(0, displayedProductsLimit);
      let html = `
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          ${itemsToRender.map((item) => renderProductCard({ item, isCustomerMode, onOpenDetail: () => {}, onStockAdjust: () => {} })).join('')}
        </div>
      `;
      if (searchResults.length > displayedProductsLimit) {
        html += `
          <div class="pt-6 pb-2 text-center">
            <button
              id="btn-load-more"
              type="button"
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              Exibindo ${displayedProductsLimit} de ${searchResults.length} — Carregar mais peças (+${Math.min(48, searchResults.length - displayedProductsLimit)})
            </button>
          </div>
        `;
      }
      gridContainer.innerHTML = html;
    } else {
      gridContainer.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            ${icon('search', 'w-6 h-6')}
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Nenhum flexível encontrado</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Tente buscar o número do flexível (ex: 3036, 1005, 2129), código TRW (ex: RPFX00480) ou modelo do carro e ano (ex: Siena 2012, Palio, Gol).
          </p>
        </div>
      `;
    }
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS & DELEGATION
// -------------------------------------------------------------
function setupGlobalListeners() {
  // Delegate clicks on document
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Search bar shortcut "/"
    const closestBtn = target.closest('button, [data-action], [data-filter-brand], [data-filter-category], [data-filter-position], [data-mgmt-tab], [data-thumb-index]') as HTMLElement | null;

    if (!closestBtn) return;

    // 1. Navbar Buttons
    if (closestBtn.id === 'btn-install-pwa') {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('Instalação do PWA iniciada!');
        }
        deferredInstallPrompt = null;
        renderApp();
      }
      return;
    }

    if (closestBtn.id === 'btn-toggle-customer-mode') {
      isCustomerMode = !isCustomerMode;
      localStorage.setItem('mode_cliente', String(isCustomerMode));
      showToast(isCustomerMode ? 'Modo Cliente ativado (preços e localização ocultos)' : 'Modo Balcão ativado (preços visíveis)');
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-toggle-dark-mode') {
      isDarkMode = !isDarkMode;
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      applyTheme();
      showToast(isDarkMode ? 'Tema Escuro ativado' : 'Tema Claro ativado');
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-open-management') {
      recentAuditLogs = await getRecentAuditLogs(60);
      isManagementModalOpen = true;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-open-trash') {
      managementTab = 'trash';
      isManagementModalOpen = true;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-open-create') {
      formEditProduct = null;
      isFormModalOpen = true;
      renderApp();
      return;
    }

    // 2. Filters
    const filterBrand = closestBtn.getAttribute('data-filter-brand');
    if (filterBrand) {
      filterState.brand = filterBrand;
      renderApp();
      return;
    }

    const filterCategory = closestBtn.getAttribute('data-filter-category');
    if (filterCategory) {
      filterState.category = filterCategory;
      renderApp();
      return;
    }

    const filterPosition = closestBtn.getAttribute('data-filter-position');
    if (filterPosition) {
      filterState.position = filterPosition;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-reset-filters') {
      filterState = {
        query: '',
        brand: 'ALL',
        category: 'ALL',
        make: 'ALL',
        position: 'ALL',
        inStockOnly: false,
        launchesOnly: false,
        sortBy: 'relevance',
      };
      renderApp();
      return;
    }

    // 3. Product Card Actions
    const action = closestBtn.getAttribute('data-action');

    if (action === 'open-detail') {
      const prodId = closestBtn.getAttribute('data-product-id');
      if (prodId) {
        await openProductDetail(prodId);
      }
      return;
    }

    if (action === 'copy-sku') {
      const sku = closestBtn.getAttribute('data-sku');
      if (sku) {
        navigator.clipboard.writeText(sku);
        showToast(`Código SKU "${sku}" copiado!`);
      }
      return;
    }

    if (action === 'copy-oem') {
      const oem = closestBtn.getAttribute('data-oem');
      if (oem) {
        navigator.clipboard.writeText(oem);
        showToast(`Código OEM "${oem}" copiado!`);
      }
      return;
    }

    if (action === 'share-whatsapp') {
      const prodId = closestBtn.getAttribute('data-product-id');
      if (prodId) {
        const prod = await getProductById(prodId);
        if (prod) shareProductWhatsApp(prod);
      }
      return;
    }

    if (action === 'stock-inc' || action === 'stock-dec') {
      const prodId = closestBtn.getAttribute('data-product-id');
      if (prodId) {
        const delta = action === 'stock-inc' ? 1 : -1;
        await adjustStockQty(prodId, delta);
        await refreshProductsFromDb();
        renderApp();
      }
      return;
    }

    // 4. Detail Modal Actions
    if (closestBtn.id === 'btn-modal-close' || closestBtn.id === 'btn-modal-close-footer') {
      activeDetailProduct = null;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-modal-edit') {
      formEditProduct = activeDetailProduct;
      isFormModalOpen = true;
      activeDetailProduct = null;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-trigger-lightbox') {
      const url = closestBtn.getAttribute('data-image-url');
      if (url) {
        lightboxUrl = url;
        lightboxZoom = 1.0;
        renderApp();
      }
      return;
    }

    const thumbIndex = closestBtn.getAttribute('data-thumb-index');
    if (thumbIndex !== null) {
      const url = closestBtn.getAttribute('data-thumb-url');
      const featImg = document.getElementById('modal-featured-image') as HTMLImageElement | null;
      const lightBtn = document.getElementById('btn-trigger-lightbox') as HTMLElement | null;
      if (featImg && url) featImg.src = url;
      if (lightBtn && url) lightBtn.setAttribute('data-image-url', url);
      return;
    }

    const jumpSku = closestBtn.getAttribute('data-jump-sku');
    if (jumpSku) {
      const found = await getProductBySku(jumpSku);
      if (found) {
        await openProductDetail(found.id);
      } else {
        showToast(`Código ${jumpSku} não encontrado no catálogo.`);
      }
      return;
    }

    if (action === 'modal-stock-inc' || action === 'modal-stock-dec') {
      if (activeDetailProduct) {
        const delta = action === 'modal-stock-inc' ? 1 : -1;
        const newQty = await adjustStockQty(activeDetailProduct.id, delta);
        activeDetailProduct.storeInventoryData.stockQty = newQty;
        const qtyEl = document.getElementById('modal-stock-qty');
        if (qtyEl) qtyEl.textContent = String(newQty);
        await refreshProductsFromDb();
      }
      return;
    }

    if (action === 'delete-custom-img') {
      const assetId = parseInt(closestBtn.getAttribute('data-asset-id') || '0', 10);
      if (assetId && activeDetailProduct) {
        await deleteCustomImage(assetId, activeDetailProduct.id);
        activeCustomImages = await getCustomImagesForProduct(activeDetailProduct.id);
        renderApp();
        showToast('Foto excluída com sucesso.');
      }
      return;
    }

    if (closestBtn.id === 'btn-modal-whatsapp') {
      if (activeDetailProduct) {
        shareProductWhatsApp(activeDetailProduct);
      }
      return;
    }

    // 5. Form Modal Actions
    if (closestBtn.id === 'btn-form-close' || closestBtn.id === 'btn-form-cancel') {
      isFormModalOpen = false;
      formEditProduct = null;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-form-submit') {
      await handleFormSubmit();
      return;
    }

    if (closestBtn.id === 'btn-form-duplicate') {
      if (formEditProduct) {
        const clone: Product = {
          ...formEditProduct,
          id: `${formEditProduct.brand.toLowerCase()}-${formEditProduct.sku.toLowerCase()}-copy-${Date.now().toString().slice(-4)}`,
          sku: `${formEditProduct.sku}-COPIA`,
          isCustom: true,
          deletedAt: null,
        };
        await saveProduct(clone, 'CREATE');
        await refreshProductsFromDb();
        isFormModalOpen = false;
        formEditProduct = null;
        renderApp();
        showToast(`Peça duplicada com sucesso: ${clone.sku}`);
      }
      return;
    }

    if (closestBtn.id === 'btn-form-soft-delete') {
      if (formEditProduct) {
        await softDeleteProduct(formEditProduct.id);
        await refreshProductsFromDb();
        isFormModalOpen = false;
        formEditProduct = null;
        renderApp();
        showToast('Peça movida para a Lixeira.');
      }
      return;
    }

    if (closestBtn.id === 'btn-form-restore' || action === 'trash-restore') {
      const pid = formEditProduct?.id || closestBtn.getAttribute('data-product-id');
      if (pid) {
        await restoreProductFromTrash(pid);
        await refreshProductsFromDb();
        if (isFormModalOpen) isFormModalOpen = false;
        renderApp();
        showToast('Peça restaurada da lixeira!');
      }
      return;
    }

    if (closestBtn.id === 'btn-form-hard-delete' || action === 'trash-hard-delete') {
      const pid = formEditProduct?.id || closestBtn.getAttribute('data-product-id');
      if (pid) {
        if (confirm('Tem certeza que deseja excluir esta peça permanentemente do banco? Esta ação não pode ser desfeita.')) {
          await hardDeleteProduct(pid);
          await refreshProductsFromDb();
          if (isFormModalOpen) isFormModalOpen = false;
          renderApp();
          showToast('Peça excluída permanentemente.');
        }
      }
      return;
    }

    // 6. Management Modal Actions
    if (closestBtn.id === 'btn-management-close' || closestBtn.id === 'btn-management-close-footer') {
      isManagementModalOpen = false;
      renderApp();
      return;
    }

    const mgmtTab = closestBtn.getAttribute('data-mgmt-tab') as any;
    if (mgmtTab) {
      managementTab = mgmtTab;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-export-backup') {
      const hash = await exportDatabaseBackup();
      showToast(`Backup baixado! SHA-256: ${hash.slice(0, 12)}...`);
      return;
    }

    if (closestBtn.id === 'btn-export-csv') {
      await exportInventoryCsv();
      showToast('Planilha de estoque CSV exportada!');
      return;
    }

    if (closestBtn.id === 'btn-reset-factory') {
      if (confirm('Deseja resetar o catálogo para a base de fábrica original? (Seus preços e estoque locais serão preservados).')) {
        await resetToFactorySeed();
        await refreshProductsFromDb();
        isManagementModalOpen = false;
        renderApp();
        showToast('Catálogo restaurado com sucesso!');
      }
      return;
    }

    // 7. Lightbox Actions
    if (closestBtn.id === 'btn-lightbox-close') {
      lightboxUrl = null;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-lightbox-zoom-in') {
      lightboxZoom = Math.min(4.0, +(lightboxZoom + 0.25).toFixed(2));
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-lightbox-zoom-out') {
      lightboxZoom = Math.max(0.5, +(lightboxZoom - 0.25).toFixed(2));
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-lightbox-reset-zoom') {
      lightboxZoom = 1.0;
      renderApp();
      return;
    }

    if (closestBtn.id === 'btn-load-more') {
      displayedProductsLimit += 48;
      updateSearchListOnly();
      return;
    }
  });

  // Handle inputs & changes
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;

    if (target.id === 'global-search-input') {
      filterState.query = target.value;
      displayedProductsLimit = 48;
      updateSearchListOnly();
    }
  });

  document.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target) return;

    if (target.id === 'select-filter-make') {
      filterState.make = target.value;
      renderApp();
    } else if (target.id === 'select-filter-sort') {
      filterState.sortBy = target.value as any;
      renderApp();
    } else if (target.id === 'checkbox-filter-stock') {
      filterState.inStockOnly = (target as HTMLInputElement).checked;
      renderApp();
    } else if (target.id === 'checkbox-filter-launches') {
      filterState.launchesOnly = (target as HTMLInputElement).checked;
      renderApp();
    } else if (target.id === 'input-restore-backup') {
      const fileInput = target as HTMLInputElement;
      if (fileInput.files && fileInput.files[0]) {
        const res = await restoreDatabaseBackup(fileInput.files[0]);
        if (res.success) {
          await refreshProductsFromDb();
          isManagementModalOpen = false;
          renderApp();
          showToast(res.message);
        } else {
          alert(res.message);
        }
      }
    } else if (target.id === 'input-import-csv') {
      const fileInput = target as HTMLInputElement;
      if (fileInput.files && fileInput.files[0]) {
        const res = await importInventoryCsv(fileInput.files[0]);
        await refreshProductsFromDb();
        renderApp();
        showToast(res.message);
      }
    } else if (target.id === 'gallery-file-input') {
      const fileInput = target as HTMLInputElement;
      if (fileInput.files && activeDetailProduct) {
        for (let i = 0; i < fileInput.files.length; i++) {
          await uploadAndAttachImage(fileInput.files[i], activeDetailProduct.id);
        }
        activeCustomImages = await getCustomImagesForProduct(activeDetailProduct.id);
        renderApp();
      }
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Focus search on '/'
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const input = document.getElementById('global-search-input') as HTMLInputElement | null;
      input?.focus();
      return;
    }

    // Escape closes modals
    if (e.key === 'Escape') {
      if (lightboxUrl) {
        lightboxUrl = null;
        renderApp();
      } else if (isFormModalOpen) {
        isFormModalOpen = false;
        renderApp();
      } else if (isManagementModalOpen) {
        isManagementModalOpen = false;
        renderApp();
      } else if (activeDetailProduct) {
        activeDetailProduct = null;
        renderApp();
      }
      return;
    }
  });

  // Global Clipboard Paste (Ctrl+V / Win+Shift+S)
  document.addEventListener('paste', async (e) => {
    if (!activeDetailProduct) return;
    const blobs = extractImagesFromClipboard(e);
    if (blobs.length > 0) {
      e.preventDefault();
      for (const blob of blobs) {
        await uploadAndAttachImage(blob, activeDetailProduct.id);
      }
      activeCustomImages = await getCustomImagesForProduct(activeDetailProduct.id);
      renderApp();
    }
  });

  // Drag and drop into gallery
  document.addEventListener('dragover', (e) => {
    const dropzone = (e.target as HTMLElement)?.closest('#gallery-dropzone');
    if (dropzone) {
      e.preventDefault();
      dropzone.classList.add('border-red-600', 'bg-red-50/20');
    }
  });

  document.addEventListener('dragleave', (e) => {
    const dropzone = (e.target as HTMLElement)?.closest('#gallery-dropzone');
    if (dropzone) {
      dropzone.classList.remove('border-red-600', 'bg-red-50/20');
    }
  });

  document.addEventListener('drop', async (e) => {
    const dropzone = (e.target as HTMLElement)?.closest('#gallery-dropzone');
    if (dropzone && activeDetailProduct) {
      e.preventDefault();
      dropzone.classList.remove('border-red-600', 'bg-red-50/20');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            await uploadAndAttachImage(files[i], activeDetailProduct.id);
          }
        }
        activeCustomImages = await getCustomImagesForProduct(activeDetailProduct.id);
        renderApp();
      }
    }
  });
}

// -------------------------------------------------------------
// MODAL WORKFLOWS
// -------------------------------------------------------------
async function openProductDetail(productId: string) {
  const prod = await getProductById(productId);
  if (!prod) return;

  activeDetailProduct = prod;
  activeCustomImages = await getCustomImagesForProduct(prod.id);
  renderApp();
}

async function uploadAndAttachImage(blob: Blob, productId: string) {
  try {
    showToast('Convertendo foto para WebP client-side...');
    const result = await convertBlobToWebP(blob, 0.92);

    await addCustomImage({
      productId,
      dataUrl: result.dataUrl,
      mimeType: 'image/webp',
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      createdAt: Date.now(),
    });

    showToast(`Foto adicionada! Reduzida de ${formatBytes(result.originalSize)} para ${formatBytes(result.compressedSize)} (-${result.savedPercentage}%)`);
  } catch (err: any) {
    showToast(`Erro ao processar imagem: ${err.message}`);
  }
}

async function handleFormSubmit() {
  const skuEl = document.getElementById('form-sku') as HTMLInputElement | null;
  const brandEl = document.getElementById('form-brand') as HTMLSelectElement | null;
  const catEl = document.getElementById('form-category') as HTMLSelectElement | null;
  const nameEl = document.getElementById('form-name') as HTMLInputElement | null;
  const posEl = document.getElementById('form-position') as HTMLInputElement | null;
  const lenEl = document.getElementById('form-length') as HTMLInputElement | null;
  const threadEl = document.getElementById('form-thread') as HTMLInputElement | null;
  const hoseEl = document.getElementById('form-hose-type') as HTMLInputElement | null;
  const normEl = document.getElementById('form-norm') as HTMLInputElement | null;
  const oemsEl = document.getElementById('form-oems') as HTMLTextAreaElement | null;
  const makesEl = document.getElementById('form-makes') as HTMLInputElement | null;
  const directEl = document.getElementById('form-direct-links') as HTMLInputElement | null;
  const couplingEl = document.getElementById('form-coupling-links') as HTMLInputElement | null;
  const priceEl = document.getElementById('form-price') as HTMLInputElement | null;
  const stockEl = document.getElementById('form-stock-qty') as HTMLInputElement | null;
  const internalEl = document.getElementById('form-internal-code') as HTMLInputElement | null;
  const locEl = document.getElementById('form-location') as HTMLInputElement | null;
  const notesEl = document.getElementById('form-notes') as HTMLInputElement | null;

  if (!skuEl || !skuEl.value.trim()) {
    alert('O código SKU é obrigatório.');
    return;
  }

  const sku = skuEl.value.trim().toUpperCase();
  const brand = brandEl?.value || 'TRW';
  const category = catEl?.value || 'Flexíveis de Freio Hidráulico';
  const name = nameEl?.value.trim() || `Flexível de Freio ${sku}`;
  const position = posEl?.value.trim() || 'Dianteiro';
  const lengthMm = lenEl?.value ? parseInt(lenEl.value, 10) : 0;
  const threadStandard = threadEl?.value.trim() || 'Macho / Fêmea M10x1';
  const hoseType = hoseEl?.value.trim() || 'Hidráulico Alta Pressão';
  const norm = normEl?.value.trim() || 'SAE J 1401';

  const oemEquivalents = (oemsEl?.value || '')
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const makes = (makesEl?.value || '')
    .split(/[,;]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const directEquivalents = (directEl?.value || '')
    .split(/[,;]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const couplingCompatible = (couplingEl?.value || '')
    .split(/[,;]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  // Parse price in cents
  const priceStr = (priceEl?.value || '0').replace(/[^\d.,]/g, '').replace(',', '.');
  const priceFloat = parseFloat(priceStr);
  const priceCents = !isNaN(priceFloat) ? Math.round(priceFloat * 100) : 3500;

  const stockQty = stockEl?.value ? parseInt(stockEl.value, 10) : 0;
  const internalCode = internalEl?.value.trim() || `INT-${sku}`;
  const stockLocation = locEl?.value.trim() || 'Corredor F • Prateleira 2 • Gaveta 10';
  const notes = notesEl?.value.trim() || '';

  const id = formEditProduct?.id || `${brand.toLowerCase()}-${sku.toLowerCase()}`;

  const updatedProduct: Product = {
    id,
    sku,
    brand,
    name,
    category,
    subcategory: 'Flexível de Freio',
    makes: makes.length > 0 ? makes : ['GERAL'],
    models: formEditProduct?.models || [],
    applications: formEditProduct?.applications || [
      { make: makes[0] || 'Geral', models: name, years: 'Todos' },
    ],
    yearRanges: formEditProduct?.yearRanges || [[1970, 2026]],
    oemEquivalents,
    specs: {
      lengthMm,
      position,
      threadStandard,
      hoseType,
      norm,
    },
    images: formEditProduct?.images || ['/catalog-images/norflex/placeholder.webp'],
    staticImageUrls: formEditProduct?.staticImageUrls || formEditProduct?.images || ['/catalog-images/norflex/placeholder.webp'],
    imageAssetIds: formEditProduct?.imageAssetIds || [],
    removedStaticUrls: formEditProduct?.removedStaticUrls || [],
    links: {
      directEquivalents,
      couplingCompatible,
      kitComposition: formEditProduct?.links?.kitComposition || [],
      productVariants: formEditProduct?.links?.productVariants || [],
    },
    storeInventoryData: {
      priceCents,
      stockQty,
      internalCode,
      stockLocation,
      notes,
    },
    pdfPage: formEditProduct?.pdfPage || 1,
    isLaunch: formEditProduct?.isLaunch || false,
    isCustom: true,
    deletedAt: null,
  };

  const isNew = !formEditProduct;
  await saveProduct(updatedProduct, isNew ? 'CREATE' : 'UPDATE');
  await refreshProductsFromDb();

  isFormModalOpen = false;
  formEditProduct = null;
  renderApp();
  showToast(isNew ? `Produto ${sku} criado com sucesso!` : `Produto ${sku} atualizado com sucesso!`);
}

function shareProductWhatsApp(product: Product) {
  const p = product;
  const inv = p.storeInventoryData;
  const priceStr = (inv.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const oemsStr = p.oemEquivalents && p.oemEquivalents.length > 0 ? p.oemEquivalents.join(', ') : 'Consulte';
  const primaryApp = p.applications && p.applications.length > 0 ? `${p.applications[0].make} ${p.applications[0].models} (${p.applications[0].years})` : p.makes.join(', ');

  let message = `*FLEXÍVEL DE FREIO — ${p.brand}*\n`;
  message += `🔧 *Código SKU:* ${p.sku}\n`;
  message += `🚗 *Aplicação:* ${primaryApp}\n`;
  message += `📏 *Medida:* ${p.specs.lengthMm ? `${p.specs.lengthMm} mm` : 'Padrão'} • ${p.specs.position || 'Dianteiro/Traseiro'}\n`;
  message += `🔩 *Rosca:* ${p.specs.threadStandard}\n`;
  message += `📄 *OEM Equivalente:* ${oemsStr}\n`;
  if (!isCustomerMode) {
    message += `💰 *Preço:* ${priceStr}\n`;
    message += `📦 *Estoque:* ${inv.stockQty > 0 ? `${inv.stockQty} unidades em estoque` : 'Sob encomenda'}\n`;
  }
  message += `✅ *Garantia & Procedência:* Catálogo Oficial ${p.brand} (Norma ${p.specs.norm})`;

  navigator.clipboard.writeText(message);
  showToast('Ficha técnica formatada copiada para o WhatsApp!');
}

function showToast(message: string) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  if (toastTimeout) clearTimeout(toastTimeout);

  container.innerHTML = `
    <div class="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 text-xs font-semibold animate-slideUp">
      ${icon('check', 'w-4 h-4 text-emerald-400')}
      <span>${message}</span>
    </div>
  `;

  toastTimeout = setTimeout(() => {
    container.innerHTML = '';
  }, 3500);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.log('[PWA] SW registro em modo dev ou não suportado:', err.message);
      });
  }
}

// Start Application
initApp().catch((err) => {
  console.error('[FATAL] Erro ao iniciar a aplicação:', err);
});
