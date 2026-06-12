import { apiFetch } from './api';
import { API_BASE_URL } from './config';

interface CarDetails {
    id: number;
    brand: number | null;
    marca: string | null;
    modelo: string;
    ano_fabricacao: number | null;
    ano_modelo: number | null;
    placa: string | null;
    preco: number | null;
    foto: string | null;
    descricao: string | null;
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obter ID do carro da URL
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    if (!carId) {
        alert('Carro não especificado.');
        window.location.href = '../cars/';
        return;
    }

    // 2. Elementos do DOM
    const photoContainer = document.getElementById('car-photo-container');
    const brandTag = document.getElementById('car-brand-tag');
    const modelTitle = document.getElementById('car-model-title');
    const valueDisplay = document.getElementById('car-value-display');
    const bioText = document.getElementById('car-bio');
    const specFactoryYear = document.getElementById('spec-factory-year');
    const specModelYear = document.getElementById('spec-model-year');
    const specPlate = document.getElementById('spec-plate');
    const btnEdit = document.getElementById('btn-edit');
    const btnDelete = document.getElementById('btn-delete');

    // 3. Buscar detalhes do carro
    try {
        const car = await apiFetch<CarDetails>(`/api/v1/car/${carId}/`);
        if (car) {
            renderCarDetails(car);
        } else {
            alert('Não foi possível encontrar os detalhes do carro.');
            window.location.href = '../cars/';
        }
    } catch (err) {
        console.error('Erro ao buscar detalhes do carro:', err);
        alert('Erro ao carregar detalhes do carro.');
        window.location.href = '../cars/';
    }

    // Função para renderizar os dados no DOM
    function renderCarDetails(car: CarDetails) {
        const fotoUrl = car.foto ? `${API_BASE_URL}${car.foto}` : '';
        const precoFormatado = car.preco 
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.preco)
            : 'Preço sob consulta';

        if (photoContainer) {
            if (fotoUrl) {
                photoContainer.innerHTML = `<img src="${fotoUrl}" alt="${car.modelo}" class="w-full h-full object-contain max-h-[400px]">`;
            } else {
                photoContainer.innerHTML = `<span class="text-brand-text-dim font-barlow-cond tracking-widest uppercase">Sem Foto Disponível</span>`;
            }
        }

        if (brandTag) brandTag.textContent = car.marca || 'MARCA';
        if (modelTitle) modelTitle.textContent = car.modelo;
        if (valueDisplay) valueDisplay.textContent = precoFormatado;
        if (bioText) bioText.textContent = car.descricao || 'Nenhuma descrição fornecida para este veículo.';
        
        if (specFactoryYear) specFactoryYear.textContent = car.ano_fabricacao?.toString() || '-';
        if (specModelYear) specModelYear.textContent = car.ano_modelo?.toString() || '-';
        if (specPlate) specPlate.textContent = car.placa || '-';

        // Configurar Ações
        if (btnEdit) {
            btnEdit.addEventListener('click', () => {
                window.location.href = `../new_car/?id=${car.id}`;
            });
        }

        if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
                const confirmDelete = confirm(`Deseja realmente excluir o carro ${car.modelo}?`);
                if (confirmDelete) {
                    try {
                        const result = await apiFetch<any>(`/api/v1/car/${car.id}/`, {
                            method: 'DELETE'
                        });
                        if (result) {
                            alert('Carro excluído com sucesso!');
                            window.location.href = '../cars/';
                        } else {
                            alert('Falha ao excluir carro.');
                        }
                    } catch (err: any) {
                        alert('Erro ao excluir carro: ' + err.message);
                    }
                }
            });
        }
    }
});
