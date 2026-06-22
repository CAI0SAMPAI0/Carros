import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import { showToast } from './toast';
import { t, setupLanguageToggle, getLanguage } from './i18n';

interface Car {
    id: number;
    marca: string | null;
    modelo: string;
    ano: number | null;
    preco: number | null;
    moeda: string | null;
    foto: string | null;
    placeholder?: string | null;
    descricao: string | null;
    categoria: string | null;
}

// Labels de categoria em português
const CATEGORIA_LABELS: Record<string, string> = {
    SEDAN:     'Sedan',
    SUV:       'SUV',
    HATCH:     'Hatch',
    PICAPE:    'Picape',
    ESPORTIVO: 'Esportivo',
    MINIVAN:   'Minivan',
    ELETRICO:  'Elétrico',
    CLASSICO:  'Clássico',
    OUTRO:     'Outro',
};

// Cor do badge por categoria
const CATEGORIA_COLORS: Record<string, string> = {
    SEDAN:     'var(--text-dim)',
    SUV:       '#4a9eff',
    HATCH:     '#7a6fff',
    PICAPE:    '#d97706',
    ESPORTIVO: 'var(--red)',
    MINIVAN:   '#059669',
    ELETRICO:  '#10b981',
    CLASSICO:  'var(--gold)',
    OUTRO:     'var(--text-dim)',
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Checar se usuário está logado
    const username = localStorage.getItem('username');
    const authContainer = document.getElementById('auth-container');

    if (authContainer) {
        if (username) {
            authContainer.innerHTML = `
                <li class="nav-greeting">${getLanguage() === 'pt' ? 'Olá' : 'Hello'}, ${username}!</li>
                <li class="nav-btn-red"><a href="../new_car/">${t('add_car')}</a></li>
                <li><a href="#" id="dashboard-btn">${t('dashboard')}</a></li>
                <li><a href="../cars/">${t('garagem')}</a></li>
                <li><button id="logout-btn">${t('logout')}</button></li>
            `;
            document.getElementById('dashboard-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                openDashboard();
            });
            document.getElementById('logout-btn')?.addEventListener('click', () => {
                localStorage.removeItem('username');
                localStorage.removeItem('auth_token');
                window.location.reload();
            });
        } else {
            authContainer.innerHTML = `
                <li><a href="../login/">${t('login')}</a></li>
                <li><a href="../register/">${t('register')}</a></li>
            `;
        }
    }

    // ── CONFIGURAR DASHBOARD ───────────────────────────────────
    const dashboardModal = document.getElementById('dashboard-modal');
    const btnCloseDashboard = document.getElementById('btn-close-dashboard');
    
    const dashModalTitle = document.getElementById('dashboard-modal-title');
    const dashLabelTotalCars = document.getElementById('dash-label-total-cars');
    const dashLabelTotalValuation = document.getElementById('dash-label-total-valuation');
    const dashLabelByBrand = document.getElementById('dash-label-by-brand');
    const dashLabelByCategory = document.getElementById('dash-label-by-category');
    const dashLabelSearches = document.getElementById('dash-label-searches');

    function applyDashboardTranslations() {
        if (dashModalTitle) dashModalTitle.textContent = t('dashboard_title');
        if (dashLabelTotalCars) dashLabelTotalCars.textContent = t('total_vehicles');
        if (dashLabelTotalValuation) dashLabelTotalValuation.textContent = t('total_valuation');
        if (dashLabelByBrand) dashLabelByBrand.textContent = t('by_brand');
        if (dashLabelByCategory) dashLabelByCategory.textContent = t('by_category');
        if (dashLabelSearches) dashLabelSearches.textContent = t('recent_searches');
    }

    async function openDashboard() {
        if (!dashboardModal) return;
        applyDashboardTranslations();

        const totalCarsEl = document.getElementById('dash-total-cars');
        const totalValueEl = document.getElementById('dash-total-value');
        const totalValueConvEl = document.getElementById('dash-total-value-converted');
        const byBrandList = document.getElementById('dash-by-brand-list');
        const byCatList = document.getElementById('dash-by-category-list');
        const searchesList = document.getElementById('dash-searches-list');

        if (totalCarsEl) totalCarsEl.textContent = '...';
        if (totalValueEl) totalValueEl.textContent = '...';
        if (byBrandList) byBrandList.innerHTML = '<div style="color:var(--muted)">Loading...</div>';
        if (byCatList) byCatList.innerHTML = '<div style="color:var(--muted)">Loading...</div>';
        if (searchesList) searchesList.innerHTML = '<div style="color:var(--muted)">Loading...</div>';

        dashboardModal.style.display = 'flex';

        try {
            const data = await apiFetch<any>('/api/v1/dashboard/stats/');
            if (data && data.success) {
                if (totalCarsEl) totalCarsEl.textContent = data.total_cars.toString();
                
                const valBrl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.total_value_brl);
                const valUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(data.total_value_usd);
                
                if (totalValueEl) totalValueEl.textContent = valBrl;
                if (totalValueConvEl) totalValueConvEl.textContent = `(~ ${valUsd})`;

                if (byBrandList) {
                    if (data.agrupado_por_marca && data.agrupado_por_marca.length > 0) {
                        byBrandList.innerHTML = data.agrupado_por_marca.map((b: any) => `
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.3rem;">
                                <span style="color:var(--text-hi); font-weight:500;">${b.marca}</span>
                                <span style="color:var(--gold); font-weight:600;">${b.quantidade}</span>
                            </div>
                        `).join('');
                    } else {
                        byBrandList.innerHTML = `<div style="color:var(--muted)">${getLanguage() === 'pt' ? 'Nenhum veículo.' : 'No vehicles.'}</div>`;
                    }
                }

                if (byCatList) {
                    if (data.agrupado_por_categoria && data.agrupado_por_categoria.length > 0) {
                        byCatList.innerHTML = data.agrupado_por_categoria.map((c: any) => `
                            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.3rem;">
                                <span style="color:var(--text-hi); font-weight:500;">${CATEGORIA_LABELS[c.categoria] || c.categoria}</span>
                                <span style="color:var(--gold); font-weight:600;">${c.quantidade}</span>
                            </div>
                        `).join('');
                    } else {
                        byCatList.innerHTML = `<div style="color:var(--muted)">${getLanguage() === 'pt' ? 'Nenhuma categoria.' : 'No categories.'}</div>`;
                    }
                }

                if (searchesList) {
                    if (data.buscas_recentes && data.buscas_recentes.length > 0) {
                        searchesList.innerHTML = data.buscas_recentes.map((s: string) => `
                            <span class="dash-search-tag" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:0.25rem 0.6rem; border-radius:16px; font-size:0.8rem; color:var(--text-dim); cursor:pointer;" data-query="${s}">
                                ${s}
                            </span>
                        `).join('');

                        // Listener para clicar na tag e buscar
                        searchesList.querySelectorAll('.dash-search-tag').forEach(tag => {
                            tag.addEventListener('click', () => {
                                const q = tag.getAttribute('data-query');
                                if (q) {
                                    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
                                    if (searchInput) {
                                        searchInput.value = q;
                                        sessionStorage.setItem('last_search_query', q);
                                    }
                                    const searchBtn = document.getElementById('search-btn');
                                    if (searchBtn) searchBtn.click();
                                    else loadCars(true);
                                    
                                    if (dashboardModal) dashboardModal.style.display = 'none';
                                }
                            });
                        });
                    } else {
                        searchesList.innerHTML = `<div style="color:var(--muted); font-size:0.85rem;">${t('no_searches')}</div>`;
                    }
                }
            } else {
                showToast("Erro ao carregar estatísticas do dashboard.", "error");
            }
        } catch (err: any) {
            console.error(err);
            showToast("Erro ao conectar ao servidor do dashboard: " + err.message, "error");
        }
    }

    btnCloseDashboard?.addEventListener('click', () => {
        if (dashboardModal) dashboardModal.style.display = 'none';
    });

    dashboardModal?.addEventListener('click', (e) => {
        if (e.target === dashboardModal) {
            dashboardModal.style.display = 'none';
        }
    });

    // 2. Elementos DOM
    const carsGrid       = document.getElementById('cars-grid');
    const searchInput    = document.getElementById('search-input')    as HTMLInputElement | null;
    
    // ── CONFIGURAR COMPARADOR DE VEÍCULOS ───────────────────────
    const comparisonDrawer   = document.getElementById('comparison-drawer');
    const compCount          = document.getElementById('comp-count');
    const compItemsPreview   = document.getElementById('comp-items-preview');
    const btnCompareClear    = document.getElementById('btn-compare-clear');
    const btnCompareOpen     = document.getElementById('btn-compare-open');
    const comparisonModal    = document.getElementById('comparison-modal');
    const btnCloseCompare    = document.getElementById('btn-close-compare');
    const compTableContainer = document.getElementById('comparison-table-container');

    // Executa setup da tradução
    setupLanguageToggle();

    const searchLabel = document.querySelector('.search-strip .search-label');
    if (searchLabel) searchLabel.textContent = t('find_your_car');
    if (searchInput) searchInput.placeholder = t('search_placeholder');
    
    const brandFilter = document.getElementById('brand-filter') as HTMLSelectElement | null;
    if (brandFilter && brandFilter.options[0]) brandFilter.options[0].textContent = t('all_brands');
    
    const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement | null;
    if (categoryFilter && categoryFilter.options[0]) categoryFilter.options[0].textContent = t('all_categories');
    
    const orderingFilter = document.getElementById('ordering-filter') as HTMLSelectElement | null;
    if (orderingFilter) {
        orderingFilter.options[0].textContent = t('sort_by');
        orderingFilter.options[1].textContent = t('sort_price_asc');
        orderingFilter.options[2].textContent = t('sort_price_desc');
        orderingFilter.options[3].textContent = t('sort_year_desc');
        orderingFilter.options[4].textContent = t('sort_year_asc');
    }
    
    if (btnCompareClear) btnCompareClear.textContent = t('clear');
    if (btnCompareOpen) btnCompareOpen.textContent = t('compare');
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.textContent = t('load_more');

    const compHeaderTitle = comparisonModal?.querySelector('.modal-header h3');
    if (compHeaderTitle) compHeaderTitle.textContent = t('comparison_title');

    let comparedCars: any[] = [];

    function updateComparisonDrawer() {
        if (!comparisonDrawer || !compCount || !compItemsPreview) return;

        if (comparedCars.length === 0) {
            comparisonDrawer.style.display = 'none';
            return;
        }

        comparisonDrawer.style.display = 'block';
        compCount.textContent = comparedCars.length.toString();

        compItemsPreview.innerHTML = comparedCars.map(car => `
            <div class="comp-preview-item">
                <span>${car.marca} ${car.model}</span>
                <button class="remove-comp-btn" data-id="${car.id}">&times;</button>
            </div>
        `).join('');

        // Remove do comparador pelo botão do Drawer
        document.querySelectorAll('.remove-comp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                comparedCars = comparedCars.filter(c => c.id !== id);
                
                const chk = document.querySelector(`.compare-chk[data-id="${id}"]`) as HTMLInputElement | null;
                if (chk) chk.checked = false;
                
                updateComparisonDrawer();
            });
        });
    }

    btnCompareClear?.addEventListener('click', () => {
        comparedCars = [];
        document.querySelectorAll('.compare-chk').forEach(chk => {
            (chk as HTMLInputElement).checked = false;
        });
        updateComparisonDrawer();
    });

    btnCompareOpen?.addEventListener('click', () => {
        if (comparedCars.length < 2) {
            showToast(
                getLanguage() === 'pt' 
                    ? "Selecione pelo menos 2 veículos para fazer o comparativo." 
                    : "Select at least 2 vehicles to compare.", 
                "error"
            );
            return;
        }

        if (!comparisonModal || !compTableContainer) return;

        const isPt = getLanguage() === 'pt';
        let headerRow = `<th>${isPt ? 'Especificações' : 'Specifications'}</th>`;
        let imgRow    = `<th>${isPt ? 'Visual' : 'Photo'}</th>`;
        let brandRow  = `<th>${t('label_brand')}</th>`;
        let modelRow  = `<th>${t('label_model')}</th>`;
        let yearRow   = `<th>${t('model_year')}</th>`;
        let catRow    = `<th>${t('category')}</th>`;
        let priceRow  = `<th>${t('value')}</th>`;
        let descRow   = `<th>${isPt ? 'Descrição' : 'Description'}</th>`;

        comparedCars.forEach(car => {
            const priceFormatted = car.preco
                ? (car.moeda === 'USD'
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(car.preco))
                    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(parseFloat(car.preco)))
                : (isPt ? 'Preço sob consulta' : 'Price on request');

            headerRow += `<td style="font-weight: 700; color: var(--text-hi); font-size: 1.1rem; text-align: center;">${car.marca} ${car.model}</td>`;
            imgRow    += `<td>${car.foto ? `<img src="${car.foto}" class="compare-img" alt="${car.model}">` : `<div class="compare-img" style="display:flex;align-items:center;justify-content:center;background:var(--dark);color:var(--muted)">${isPt ? 'Sem foto' : 'No photo'}</div>`}</td>`;
            brandRow  += `<td>${car.marca}</td>`;
            modelRow  += `<td>${car.model}</td>`;
            yearRow   += `<td>${car.ano || '-'}</td>`;
            catRow    += `<td>${CATEGORIA_LABELS[car.categoria] || car.categoria || '-'}</td>`;
            priceRow  += `<td class="compare-price">${priceFormatted}</td>`;
            descRow   += `<td style="font-size: 0.85rem; line-height: 1.4;">${car.desc || (isPt ? 'Sem descrição.' : 'No description.')}</td>`;
        });

        compTableContainer.innerHTML = `
            <table class="compare-table">
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>
                    <tr>${imgRow}</tr>
                    <tr>${brandRow}</tr>
                    <tr>${modelRow}</tr>
                    <tr>${yearRow}</tr>
                    <tr>${catRow}</tr>
                    <tr>${priceRow}</tr>
                    <tr>${descRow}</tr>
                </tbody>
            </table>
        `;

        comparisonModal.style.display = 'flex';
    });

    btnCloseCompare?.addEventListener('click', () => {
        if (comparisonModal) comparisonModal.style.display = 'none';
    });

    comparisonModal?.addEventListener('click', (e) => {
        if (e.target === comparisonModal) {
            comparisonModal.style.display = 'none';
        }
    });


    const ITEMS_PER_PAGE = 30;
    let currentPage = 1;
    let hasNextPage = true;
    let isLoading = false;
    let currentCarsList: Car[] = [];

    // ── Carregar marcas ──────────────────────────────────────────
    async function loadBrands() {
        if (!brandFilter) return;
        try {
            const brands = await apiFetch<{id: number, name: string}[]>('/api/v1/brands/');
            if (brands) {
                brandFilter.innerHTML = '<option value="">Todas as marcas</option>';
                brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.name;
                    option.textContent = brand.name;
                    brandFilter.appendChild(option);
                });
                const saved = sessionStorage.getItem('last_selected_brand');
                if (saved) brandFilter.value = saved;
            }
        } catch (err) {
            console.error('Erro ao buscar marcas:', err);
        }
    }

    // ── Carregar categorias ──────────────────────────────────────
    async function loadCategories() {
        if (!categoryFilter) return;
        try {
            const cats = await apiFetch<{value: string, label: string}[]>('/api/v1/categorias/');
            if (cats) {
                categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
                cats.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.value;
                    option.textContent = cat.label;
                    categoryFilter.appendChild(option);
                });
                const saved = sessionStorage.getItem('last_selected_category');
                if (saved) categoryFilter.value = saved;
            }
        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
        }
    }

    // ── Skeletons ────────────────────────────────────────────────
    function buildSkeletons(count: number, extraClass = '') {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-card ${extraClass}">
                <div class="skeleton-img"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                    <div style="overflow:hidden;margin-top:1.2rem;">
                        <div class="skeleton-line last"></div>
                        <div class="skeleton-line price"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ── Carregar carros ──────────────────────────────────────────
    async function loadCars(reset = false) {
        if (isLoading) return;

        if (reset) {
            currentPage = 1;
            hasNextPage = true;
            currentCarsList = [];
            if (carsGrid) carsGrid.innerHTML = buildSkeletons(6);
        } else if (carsGrid) {
            const temp = document.createElement('div');
            temp.innerHTML = buildSkeletons(3, 'temp-skeleton');
            while (temp.firstChild) carsGrid.appendChild(temp.firstChild);
        }

        if (!hasNextPage) {
            document.querySelectorAll('.temp-skeleton').forEach(el => el.remove());
            return;
        }

        isLoading = true;

        const query    = searchInput?.value.toLowerCase().trim() || '';
        const brand    = brandFilter?.value || '';
        const category = categoryFilter?.value || '';
        const ordering = orderingFilter?.value || '';

        try {
            let url = `/api/v1/cars/?page=${currentPage}`;
            if (query)    url += `&search=${encodeURIComponent(query)}`;
            if (brand)    url += `&brand=${encodeURIComponent(brand)}`;
            if (category) url += `&categoria=${encodeURIComponent(category)}`;
            if (ordering) url += `&ordering=${encodeURIComponent(ordering)}`;

            const response = await apiFetch<{ results: Car[], count: number, has_next: boolean }>(url);
            document.querySelectorAll('.temp-skeleton').forEach(el => el.remove());

            if (response) {
                currentCarsList = [...currentCarsList, ...response.results];
                hasNextPage = response.has_next;
                renderCars(currentCarsList, response.count);
                currentPage++;
            }
        } catch (err) {
            console.error('Erro ao buscar carros:', err);
            document.querySelectorAll('.temp-skeleton').forEach(el => el.remove());
            if (reset && carsGrid) {
                carsGrid.innerHTML = `
                    <div style="grid-column:span 3;width:100%;text-align:center;padding:3rem;">
                        <p style="color:var(--red);font-weight:600;">Erro ao carregar os carros do servidor.</p>
                    </div>
                `;
            }
        } finally {
            isLoading = false;
        }
    }

    let isAiSearchActive = false;

    async function loadAiSearch(query: string) {
        if (isLoading) return;
        isLoading = true;
        isAiSearchActive = true;
        
        if (carsGrid) carsGrid.innerHTML = buildSkeletons(6);
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';

        try {
            const data = await apiFetch<any>('/api/v1/cars/semantic_search/', {
                method: 'POST',
                body: JSON.stringify({ query })
            });

            if (data && data.success) {
                renderCars(data.results, data.count);
                
                const carsMeta = document.getElementById('cars-meta');
                if (carsMeta && data.explicacao) {
                    const explainText = getLanguage() === 'pt' ? 'IA entendeu' : 'AI understood';
                    carsMeta.innerHTML = `${data.count} ${data.count === 1 ? t('found_vehicle') : t('found_vehicles')} <span style="display:block; font-size:0.9rem; color:var(--gold); margin-top:0.4rem; font-style:italic;">✨ ${explainText}: "${data.explicacao}"</span>`;
                }
            } else {
                showToast(getLanguage() === 'pt' ? "Erro na busca inteligente" : "Error in smart search", "error");
            }
        } catch (err: any) {
            console.error('Erro na busca IA:', err);
            if (carsGrid) {
                carsGrid.innerHTML = `
                    <div style="grid-column:span 3;width:100%;text-align:center;padding:3rem;">
                        <p style="color:var(--red);font-weight:600;">${getLanguage() === 'pt' ? 'Erro ao carregar busca inteligente.' : 'Error loading smart search.'}</p>
                    </div>
                `;
            }
        } finally {
            isLoading = false;
        }
    }

    // ── Renderizar carros ────────────────────────────────────────
    function renderCars(cars: Car[], totalCount: number) {
        if (!carsGrid) return;

        const carsMeta = document.getElementById('cars-meta');
        if (carsMeta) {
            const plural = totalCount === 1 ? t('found_vehicle') : t('found_vehicles');
            carsMeta.textContent = `${totalCount} ${plural}`;
        }

        if (cars.length === 0) {
            carsGrid.innerHTML = `
                <div class="empty-state" style="grid-column:span 3;width:100%;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="1" y="6" width="22" height="13" rx="2"/>
                        <path d="M5 6l2-3h10l2 3"/>
                        <circle cx="7.5" cy="13" r="1.5"/>
                        <circle cx="16.5" cy="13" r="1.5"/>
                    </svg>
                    <h3>${t('no_vehicles')}</h3>
                    <p>${t('no_vehicles_sub')}</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        carsGrid.innerHTML = cars.map((car, index) => {
            const fotoUrl = car.foto
                ? (car.foto.startsWith('http') ? car.foto : `${API_BASE_URL}${car.foto}`)
                : '';

            const precoFormatado = car.preco
                ? (car.moeda === 'USD'
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(car.preco)
                    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(car.preco))
                : 'Preço sob consulta';

            const indexString = (index + 1).toString().padStart(2, '0');

            const categoriaLabel = car.categoria ? (CATEGORIA_LABELS[car.categoria] || car.categoria) : null;
            const categoriaColor = car.categoria ? (CATEGORIA_COLORS[car.categoria] || 'var(--text-dim)') : null;
            const categoriaBadge = categoriaLabel
                ? `<span class="car-category-badge" style="color:${categoriaColor};border-color:${categoriaColor};">${categoriaLabel}</span>`
                : '';

            const isAboveFold = index < 6;
            const imgAttrs = isAboveFold
                ? 'loading="eager" fetchpriority="high" decoding="async" class="img-fade-in"'
                : 'loading="lazy" fetchpriority="low" decoding="async" class="img-fade-in"';

            return `
                <a href="../car_detail/?id=${car.id}" class="car-link anim-fadeup" style="animation-delay:${(index % ITEMS_PER_PAGE) * 50}ms">
                    <div class="car-img" style="position: relative; overflow: hidden;">
                        <span class="car-index">${indexString}</span>
                        ${car.placeholder
                            ? `<div class="img-placeholder" style="background-image: url(${car.placeholder}); position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(8px); transform: scale(1.1); pointer-events: none; z-index: 0;"></div>`
                            : ''
                        }
                        ${fotoUrl
                            ? `<img src="${fotoUrl}" alt="${car.marca || ''} ${car.modelo}" ${imgAttrs} style="position: relative; z-index: 1;" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                            : ''
                        }
                        <div class="no-photo" style="${fotoUrl ? 'display:none;' : ''}; position: relative; z-index: 2;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                                <rect x="1" y="6" width="22" height="13" rx="2"/>
                                <path d="M5 6l2-3h10l2 3"/>
                                <circle cx="7.5" cy="13" r="1.5"/>
                                <circle cx="16.5" cy="13" r="1.5"/>
                            </svg>
                            <span>Sem foto</span>
                        </div>
                    </div>
                    <div class="car-body">
                        <div class="car-brand-row">
                            <div class="car-brand">${car.marca || 'Marca não informada'}</div>
                            ${categoriaBadge}
                        </div>
                        <div class="car-name">${car.modelo}</div>
                        <div class="car-specs">
                            <span class="car-year">${car.ano || '-'}</span>
                            <span class="car-price">${precoFormatado}</span>
                        </div>
                        <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
                            <label class="comp-checkbox-label" onclick="event.stopPropagation();">
                                <input type="checkbox" class="compare-chk" data-id="${car.id}" data-model="${car.modelo}" data-marca="${car.marca || ''}" data-preco="${car.preco || ''}" data-moeda="${car.moeda || ''}" data-foto="${fotoUrl}" data-ano="${car.ano || ''}" data-categoria="${car.categoria || ''}" data-desc="${car.descricao || ''}">
                                <span>Comparar</span>
                            </label>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        if (loadMoreBtn) {
            loadMoreBtn.style.display = hasNextPage ? 'inline-block' : 'none';
        }

        // Configura listeners para as checkboxes do comparador
        document.querySelectorAll('.compare-chk').forEach(chk => {
            const input = chk as HTMLInputElement;
            const id = input.getAttribute('data-id');
            
            // Re-checa se o carro já está no comparador
            input.checked = comparedCars.some(c => c.id === id);

            input.addEventListener('change', () => {
                if (input.checked) {
                    if (comparedCars.length >= 3) {
                        input.checked = false;
                        showToast("Você pode comparar no máximo 3 veículos lado a lado.", "error");
                        return;
                    }
                    comparedCars.push({
                        id: id,
                        model: input.getAttribute('data-model'),
                        marca: input.getAttribute('data-marca'),
                        preco: input.getAttribute('data-preco'),
                        moeda: input.getAttribute('data-moeda'),
                        foto: input.getAttribute('data-foto'),
                        ano: input.getAttribute('data-ano'),
                        categoria: input.getAttribute('data-categoria'),
                        desc: input.getAttribute('data-desc')
                    });
                } else {
                    comparedCars = comparedCars.filter(c => c.id !== id);
                }
                updateComparisonDrawer();
            });
        });
    }

    // ── Inicialização ────────────────────────────────────────────
    const savedQuery = sessionStorage.getItem('last_search_query');
    if (savedQuery && searchInput) searchInput.value = savedQuery;

    const savedOrdering = sessionStorage.getItem('last_selected_ordering');
    if (savedOrdering && orderingFilter) orderingFilter.value = savedOrdering;

    await Promise.all([loadBrands(), loadCategories()]);
    loadCars(true);

    // Debounce da busca padrão
    let searchTimeout: number;
    searchInput?.addEventListener('input', () => {
        isAiSearchActive = false;
        clearTimeout(searchTimeout);
        if (searchInput) sessionStorage.setItem('last_search_query', searchInput.value);
        searchTimeout = window.setTimeout(() => loadCars(true), 400);
    });

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.textContent = getLanguage() === 'pt' ? 'Buscar' : 'Search';
        searchBtn.addEventListener('click', () => {
            isAiSearchActive = false;
            loadCars(true);
        });
    }

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            isAiSearchActive = false;
            loadCars(true);
        }
    });

    const aiSearchBtn = document.getElementById('ai-search-btn');
    if (aiSearchBtn) {
        aiSearchBtn.title = getLanguage() === 'pt' ? 'Busca Inteligente com IA' : 'Smart AI Search';
        aiSearchBtn.addEventListener('click', () => {
            const query = searchInput?.value.trim() || '';
            if (query) {
                loadAiSearch(query);
            } else {
                showToast(
                    getLanguage() === 'pt' 
                        ? 'Digite uma frase de busca (ex: SUV honda até 100k) para buscar com IA.' 
                        : 'Type a search phrase (e.g. SUV honda under 100k) to search with AI.', 
                    'info'
                );
            }
        });
    }

    brandFilter?.addEventListener('change', () => {
        if (brandFilter) sessionStorage.setItem('last_selected_brand', brandFilter.value);
        if (isAiSearchActive && searchInput) {
            loadAiSearch(searchInput.value);
        } else {
            loadCars(true);
        }
    });

    categoryFilter?.addEventListener('change', () => {
        if (categoryFilter) sessionStorage.setItem('last_selected_category', categoryFilter.value);
        if (isAiSearchActive && searchInput) {
            loadAiSearch(searchInput.value);
        } else {
            loadCars(true);
        }
    });

    orderingFilter?.addEventListener('change', () => {
        if (orderingFilter) sessionStorage.setItem('last_selected_ordering', orderingFilter.value);
        if (isAiSearchActive && searchInput) {
            loadAiSearch(searchInput.value);
        } else {
            loadCars(true);
        }
    });

    loadMoreBtn?.addEventListener('click', () => {
        if (isAiSearchActive && searchInput) {
            loadAiSearch(searchInput.value);
        } else {
            loadCars(false);
        }
    });

    window.addEventListener('scroll', () => {
        if (!loadMoreBtn || loadMoreBtn.style.display === 'none' || isLoading) return;
        const rect = loadMoreBtn.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 200) {
            if (isAiSearchActive && searchInput) {
                // Para busca IA não temos paginação, então não carrega mais no scroll
                return;
            }
            loadCars(false);
        }
    });
});
