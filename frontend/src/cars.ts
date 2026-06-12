import { apiFetch } from './api';
import { API_BASE_URL } from './config';

interface Car {
    id: number;
    marca: string | null;
    modelo: string;
    ano: number | null;
    preco: number | null;
    foto: string | null;
    descricao: string | null;
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Checar se usuário está logado
    const username = localStorage.getItem('username');
    const authContainer = document.getElementById('auth-container');
    
    if (authContainer) {
        if (username) {
            authContainer.innerHTML = `
                <li class="text-brand-text-dim border-l-2 border-brand-red px-3.5 py-1.5">Olá, ${username}!</li>
                <li class="bg-brand-red text-white px-4 py-1.5 rounded-sm hover:bg-brand-red/80 transition-colors">
                    <a href="../new_car/">Cadastrar</a>
                </li>
                <li><a href="../cars/" class="text-brand-text-hi bg-brand-panel px-3.5 py-1.5 rounded-sm transition-all">Garagem</a></li>
                <li><button id="logout-btn" class="text-brand-text-dim hover:text-brand-text-hi hover:bg-brand-panel px-3.5 py-1.5 rounded-sm transition-all uppercase font-semibold">Sair</button></li>
            `;
            
            document.getElementById('logout-btn')?.addEventListener('click', () => {
                localStorage.removeItem('username');
                localStorage.removeItem('auth_token');
                window.location.reload();
            });
        } else {
            authContainer.innerHTML = `
                <li><a href="../login/" class="bg-brand-red text-white px-4 py-1.5 rounded-sm hover:bg-brand-red/80 transition-colors">Entrar</a></li>
                <li><a href="../register/" class="text-brand-text-dim hover:text-brand-text-hi hover:bg-brand-panel px-3.5 py-1.5 rounded-sm transition-all">Cadastre-se</a></li>
            `;
        }
    }

    // 2. Elementos DOM para a lista de carros
    const carsGrid = document.getElementById('cars-grid');
    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    const brandFilter = document.getElementById('brand-filter') as HTMLSelectElement | null;
    const highlightSection = document.getElementById('highlight-section');

    let allCars: Car[] = [];

    // Carregar carros
    try {
        const carsData = await apiFetch<Car[]>('/api/v1/cars/');
        if (carsData) {
            allCars = carsData;
            renderCars(allCars);
            renderHighlight(allCars);
            populateBrandFilter(allCars);
        }
    } catch (err) {
        console.error('Erro ao buscar carros:', err);
        if (carsGrid) {
            carsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-brand-red font-semibold">Erro ao carregar os carros do servidor. Verifique a conexão.</p>
                </div>
            `;
        }
    }

    // Renderizar carros no grid
    function renderCars(cars: Car[]) {
        if (!carsGrid) return;
        
        if (cars.length === 0) {
            carsGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-brand-text-dim">
                    Nenhum carro encontrado com os filtros selecionados.
                </div>
            `;
            return;
        }

        carsGrid.innerHTML = cars.map(car => {
            const fotoUrl = car.foto ? `${API_BASE_URL}${car.foto}` : '';
            const precoFormatado = car.preco 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.preco)
                : 'Preço sob consulta';

            return `
                <a href="../car_detail/?id=${car.id}" class="group bg-brand-panel border border-brand-border rounded-md overflow-hidden hover:border-brand-red transition-all duration-300 hover:shadow-[0_4px_30px_rgba(229,34,34,0.15)] flex flex-col justify-between">
                    <div class="aspect-video bg-brand-dark flex items-center justify-center overflow-hidden relative">
                        ${fotoUrl 
                            ? `<img src="${fotoUrl}" alt="${car.modelo}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" onError="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                            : ''
                        }
                        <div class="absolute inset-0 flex items-center justify-center bg-brand-dark/50 ${fotoUrl ? 'hidden' : 'flex'}">
                            <span class="text-brand-text-dim text-xs uppercase tracking-widest font-barlow-cond">Sem imagem</span>
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <span class="text-brand-red font-barlow-cond text-[10px] font-bold tracking-widest uppercase mb-1 block">${car.marca || 'Marca não informada'}</span>
                            <h3 class="font-bebas text-2xl text-brand-text-hi tracking-wide leading-none group-hover:text-brand-red transition-colors mb-2">${car.modelo}</h3>
                            <p class="text-brand-text-dim text-xs line-clamp-2 mb-4 font-barlow">${car.descricao || 'Nenhuma descrição fornecida para este veículo.'}</p>
                        </div>
                        <div class="flex items-center justify-between pt-4 border-t border-brand-border/50">
                            <span class="font-barlow-cond text-xs text-brand-text-dim uppercase font-semibold">${car.ano || '-'}</span>
                            <span class="font-bebas text-lg text-brand-text-hi tracking-wide">${precoFormatado}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Renderizar carro em destaque (o primeiro carro com foto)
    function renderHighlight(cars: Car[]) {
        if (!highlightSection) return;

        const highlightCar = cars.find(car => car.foto);
        if (!highlightCar) {
            highlightSection.innerHTML = `
                <div class="w-full md:w-1/2 flex items-center justify-center bg-brand-panel border border-brand-border rounded-md p-8 min-h-[300px]">
                    <span class="text-brand-text-dim font-barlow-cond tracking-widest uppercase">Sem Imagem de Destaque</span>
                </div>
                <div class="w-full md:w-1/2 flex flex-col justify-center">
                    <h2 class="text-6xl font-bold font-bebas text-brand-text-hi leading-none mb-4">Encontre seu carro perfeito</h2>
                    <p class="text-brand-text-dim text-lg mb-6 max-w-md">Consulte a listagem completa de carros, filtre por marca e ano, ou adicione um novo carro ao catálogo.</p>
                </div>
            `;
            return;
        }

        const fotoUrl = highlightCar.foto ? `${API_BASE_URL}${highlightCar.foto}` : '';
        const precoFormatado = highlightCar.preco 
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(highlightCar.preco)
            : 'Preço sob consulta';

        highlightSection.innerHTML = `
            <div class="w-full md:w-1/2 aspect-video md:aspect-auto bg-brand-panel border border-brand-border rounded-md overflow-hidden relative min-h-[300px]">
                <img src="${fotoUrl}" alt="${highlightCar.modelo}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent"></div>
            </div>
            <div class="w-full md:w-1/2 flex flex-col justify-center">
                <span class="text-brand-red font-barlow-cond text-xs font-bold tracking-widest uppercase mb-2 block">Destaque da Semana</span>
                <h2 class="text-6xl font-bold font-bebas text-brand-text-hi leading-none mb-2">${highlightCar.modelo}</h2>
                <p class="font-bebas text-2xl text-brand-red tracking-wide mb-4">${precoFormatado}</p>
                <p class="text-brand-text-dim text-sm mb-6 max-w-md">${highlightCar.descricao || 'Confira os detalhes e especificações completas deste veículo.'}</p>
                <div>
                    <a href="../car_detail/?id=${highlightCar.id}"
                        class="inline-block bg-brand-red text-white font-barlow-cond font-bold tracking-widest text-sm uppercase px-8 py-3 rounded-sm hover:bg-brand-red/90 transition-all shadow-[0_4px_20px_rgba(229,34,34,0.35)]">
                        Ver Detalhes
                    </a>
                </div>
            </div>
        `;
    }

    // Preencher filtro de marcas dinamicamente
    function populateBrandFilter(cars: Car[]) {
        if (!brandFilter) return;

        const brands = new Set<string>();
        cars.forEach(car => {
            if (car.marca) brands.add(car.marca);
        });

        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            option.className = 'bg-brand-panel';
            brandFilter.appendChild(option);
        });
    }

    // Filtrar carros por pesquisa e marca
    function filterAndRender() {
        const query = searchInput?.value.toLowerCase().trim() || '';
        const selectedBrand = brandFilter?.value || '';

        const filtered = allCars.filter(car => {
            const matchesSearch = car.modelo.toLowerCase().includes(query) || 
                                 (car.marca && car.marca.toLowerCase().includes(query)) ||
                                 (car.descricao && car.descricao.toLowerCase().includes(query));
            const matchesBrand = selectedBrand === '' || car.marca === selectedBrand;
            return matchesSearch && matchesBrand;
        });

        renderCars(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
    brandFilter?.addEventListener('change', filterAndRender);
});
