import { apiFetch } from './api';
import { API_BASE_URL } from './config';
import { showToast } from './toast';
import { t, setupLanguageToggle, getLanguage } from './i18n';

interface CarDetails {
    id: number;
    brand: number | null;
    marca: string | null;
    modelo: string;
    ano_fabricacao: number | null;
    ano_modelo: number | null;
    placa: string | null;
    preco: number | null;
    moeda: string | null;
    foto: string | null;
    placeholder?: string | null;
    descricao: string | null;
    imagens_adicionais?: { id: number; foto: string | null; placeholder: string | null }[] | null;
    ficha_tecnica?: string | null;
}

let usdToBrlRate = 5.50;

async function fetchExchangeRate() {
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        if (res.ok) {
            const data = await res.json();
            if (data && data.USDBRL && data.USDBRL.bid) {
                usdToBrlRate = parseFloat(data.USDBRL.bid);
                console.log('Taxa de câmbio USD-BRL obtida:', usdToBrlRate);
            }
        }
    } catch (err) {
        console.error('Falha ao obter cotação:', err);
    }
}

function formatCurrency(val: number, currencyCode: string): string {
    if (currencyCode === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    } else {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(val);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // setup i18n
    setupLanguageToggle();
    await fetchExchangeRate();

    // 1. Checar se usuário está logado e traduzir navbar
    const username = localStorage.getItem('username');
    const authContainer = document.getElementById('auth-container');

    if (authContainer) {
        if (username) {
            authContainer.innerHTML = `
                <li class="nav-greeting">${getLanguage() === 'pt' ? 'Olá' : 'Hello'}, ${username}!</li>
                <li class="nav-btn-red"><a href="../new_car/">${t('add_car')}</a></li>
                <li><a href="../cars/">${t('garagem')}</a></li>
                <li><button id="logout-btn">${t('logout')}</button></li>
            `;
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

    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    if (!carId) {
        showToast('Carro não especificado.', 'error');
        setTimeout(() => {
            window.location.href = '../cars/';
        }, 1500);
        return;
    }

    // 2. Elementos do DOM
    const backLink = document.getElementById('back-link');
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

    if (backLink) {
        backLink.innerHTML = `&larr; ${t('back')}`;
    }
    if (btnEdit) btnEdit.textContent = t('edit');
    if (btnDelete) btnDelete.textContent = t('delete');

    const specsCardTitle = document.querySelector('.specs-card .specs-title');
    if (specsCardTitle) specsCardTitle.textContent = t('specs');

    const specLabels = document.querySelectorAll('.specs-card .spec-label');
    if (specLabels.length >= 3) {
        specLabels[0].textContent = t('factory_year');
        specLabels[1].textContent = t('model_year');
        specLabels[2].textContent = t('plate');
    }

    const bioTitle = document.querySelector('.bio-card .bio-title');
    if (bioTitle) bioTitle.textContent = t('label_desc').split(' / ')[0];

    const simTitle = document.querySelector('#financing-simulator-card .specs-title');
    if (simTitle) simTitle.textContent = t('finance_sim');

    const simLabels = document.querySelectorAll('#financing-simulator-card .spec-label');
    if (simLabels.length >= 2) {
        simLabels[0].textContent = t('downpayment');
        simLabels[1].textContent = t('installments');
    }

    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }

    // 3. Buscar detalhes do carro
    try {
        const car = await apiFetch<CarDetails>(`/api/v1/car/${carId}/`);
        if (car) {
            renderCarDetails(car);
        } else {
            showToast('Não foi possível encontrar os detalhes do carro.', 'error');
            setTimeout(() => {
                window.location.href = '../cars/';
            }, 1500);
        }
    } catch (err) {
        console.error('Erro ao buscar detalhes do carro:', err);
        showToast('Erro ao carregar detalhes do carro.', 'error');
        setTimeout(() => {
            window.location.href = '../cars/';
        }, 1500);
    }

    function renderCarDetails(car: CarDetails) {
        const isPt = getLanguage() === 'pt';
        const fotoUrl = car.foto 
            ? (car.foto.startsWith('http') ? car.foto : `${API_BASE_URL}${car.foto}`) 
            : '';
        
        const currentCurrency = car.moeda || 'BRL';
        let precoFormatado = '';
        let precoConvertido = '';

        if (car.preco) {
            if (currentCurrency === 'USD') {
                precoFormatado = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(car.preco);
                const valorEmBrl = car.preco * usdToBrlRate;
                precoConvertido = ` (~ ` + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valorEmBrl) + `)`;
            } else {
                precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(car.preco);
                const valorEmUsd = car.preco / usdToBrlRate;
                precoConvertido = ` (~ ` + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(valorEmUsd) + `)`;
            }
        } else {
            precoFormatado = 'Preço sob consulta';
        }

        if (photoContainer) {
            photoContainer.style.position = 'relative';
            photoContainer.style.overflow = 'hidden';
            photoContainer.style.display = 'flex';
            photoContainer.style.flexDirection = 'column';
            photoContainer.style.gap = '1rem';

            const allPhotos: { url: string; placeholder: string | null }[] = [];
            if (fotoUrl) {
                allPhotos.push({ url: fotoUrl, placeholder: car.placeholder || null });
            }
            if (car.imagens_adicionais && car.imagens_adicionais.length > 0) {
                car.imagens_adicionais.forEach((img: any) => {
                    if (img.foto) {
                        const imgUrl = img.foto.startsWith('http') ? img.foto : `${API_BASE_URL}${img.foto}`;
                        allPhotos.push({ url: imgUrl, placeholder: img.placeholder || null });
                    }
                });
            }

            if (allPhotos.length > 0) {
                let thumbnailsHTML = '';
                if (allPhotos.length > 1) {
                    thumbnailsHTML = `
                        <div class="thumbnail-track" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; width: 100%; scrollbar-width: thin;">
                            ${allPhotos.map((photo, idx) => `
                                <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="width: 70px; height: 46px; border-radius: 4px; overflow: hidden; cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--gold)' : 'transparent'}; flex-shrink: 0; position: relative; background: var(--dark); transition: border-color 0.2s;">
                                    ${photo.placeholder ? `<div style="background-image: url(${photo.placeholder}); position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(2px);"></div>` : ''}
                                    <img src="${photo.url}" style="width:100%; height:100%; object-fit:cover; position: relative; z-index: 1;" onload="this.style.opacity='1'" onerror="this.style.display='none'">
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                photoContainer.innerHTML = `
                    <div class="main-image-viewer" style="position: relative; aspect-ratio: 16/10; width: 100%; overflow: hidden; border-radius: 8px; background: var(--dark);">
                        ${allPhotos[0].placeholder
                            ? `<div class="img-placeholder" style="background-image: url(${allPhotos[0].placeholder}); position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(8px); transform: scale(1.1); pointer-events: none; z-index: 0;"></div>`
                            : ''
                        }
                        <img id="main-detail-img" src="${allPhotos[0].url}" alt="${car.marca || ''} ${car.modelo}" loading="eager" fetchpriority="high" decoding="async" class="img-fade-in" style="position: relative; z-index: 1; width:100%; height:100%; object-fit:cover;" onload="this.classList.add('loaded')">
                    </div>
                    ${thumbnailsHTML}
                `;

                if (allPhotos.length > 1) {
                    const mainImg = document.getElementById('main-detail-img') as HTMLImageElement | null;
                    const mainPlaceholder = photoContainer.querySelector('.img-placeholder') as HTMLDivElement | null;
                    const thumbItems = photoContainer.querySelectorAll('.thumb-item');
                    
                    thumbItems.forEach(item => {
                        item.addEventListener('click', () => {
                            const idx = parseInt(item.getAttribute('data-idx') || '0');
                            const selectedPhoto = allPhotos[idx];
                            
                            thumbItems.forEach(t => (t as HTMLElement).style.borderColor = 'transparent');
                            (item as HTMLElement).style.borderColor = 'var(--gold)';
                            
                            if (mainImg) {
                                mainImg.classList.remove('loaded');
                                mainImg.src = selectedPhoto.url;
                                if (mainPlaceholder) {
                                    if (selectedPhoto.placeholder) {
                                        mainPlaceholder.style.backgroundImage = `url(${selectedPhoto.placeholder})`;
                                        mainPlaceholder.style.display = 'block';
                                    } else {
                                        mainPlaceholder.style.display = 'none';
                                    }
                                }
                            }
                        });
                    });
                }
            } else {
                photoContainer.innerHTML = `
                    <div class="no-photo-lg" style="position: relative; z-index: 2; aspect-ratio: 16/10; width:100%;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <rect x="1" y="6" width="22" height="13" rx="2"/><path d="M5 6l2-3h10l2 3"/><circle cx="7.5" cy="13" r="1.5"/><circle cx="16.5" cy="13" r="1.5"/>
                        </svg>
                        <span>${isPt ? 'Foto não disponível' : 'Photo not available'}</span>
                    </div>
                `;
            }
        }

        if (brandTag) brandTag.textContent = car.marca || 'MARCA';
        if (modelTitle) modelTitle.textContent = car.modelo;
        if (valueDisplay) {
            valueDisplay.innerHTML = `${precoFormatado}<span style="font-size: 0.95rem; color: var(--text-dim); font-weight: 400; margin-left: 0.5rem;">${precoConvertido}</span>`;
        }

        // Configurar Simulador de Financiamento se houver preço
        const simCard = document.getElementById('financing-simulator-card');
        const simEntrada = document.getElementById('sim-entrada') as HTMLInputElement | null;
        const simParcelas = document.getElementById('sim-parcelas') as HTMLSelectElement | null;
        const simResultValue = document.getElementById('sim-result-value');

        if (car.preco && simCard && simEntrada && simParcelas && simResultValue) {
            simCard.style.display = 'block';
            
            // Entrada padrão de 30% arredondada
            const defaultEntrada = Math.round(car.preco * 0.3);
            simEntrada.value = formatCurrency(defaultEntrada, currentCurrency);

            const calculateFinancing = () => {
                if (!car.preco) return;
                
                let entradaVal = 0;
                const cleanStr = simEntrada.value.replace(/\D/g, '');
                if (cleanStr) {
                    entradaVal = parseFloat(cleanStr);
                }
                
                const financedAmount = car.preco - entradaVal;
                if (financedAmount <= 0) {
                    simResultValue.textContent = 'R$ 0,00';
                    return;
                }
                
                const months = parseInt(simParcelas.value) || 48;
                const monthlyInterestRate = 0.015; // Taxa de 1.5% a.m.
                
                // Fórmula Price: P = (A * i) / (1 - (1 + i)^-n)
                const installment = (financedAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -months));
                
                simResultValue.textContent = formatCurrency(installment, currentCurrency);
            };

            simEntrada.addEventListener('input', () => {
                let val = simEntrada.value.replace(/\D/g, '');
                if (val) {
                    const numberVal = parseFloat(val);
                    simEntrada.value = formatCurrency(numberVal, currentCurrency);
                } else {
                    simEntrada.value = '';
                }
                calculateFinancing();
            });

            simParcelas.addEventListener('change', calculateFinancing);
            
            // Cálculo inicial
            calculateFinancing();
        }
        
        // Exibir bio se houver
        const bioCard = document.getElementById('car-bio-card');
        if (bioCard && bioText) {
            if (car.descricao) {
                bioText.textContent = car.descricao;
                bioCard.style.display = 'block';
            } else {
                bioCard.style.display = 'none';
            }
        }

        // Renderizar Ficha Técnica se houver
        const techCard = document.getElementById('tech-specs-card');
        const techGrid = document.getElementById('tech-specs-grid');
        const techTitle = document.getElementById('tech-specs-title');
        
        if (techTitle) {
            techTitle.textContent = getLanguage() === 'pt' ? 'Ficha Técnica Detalhada (IA)' : 'Detailed Technical Specs (AI)';
        }

        if (techCard && techGrid && car.ficha_tecnica) {
            try {
                const specs = JSON.parse(car.ficha_tecnica);
                let gridHTML = '';
                
                for (const [key, val] of Object.entries(specs)) {
                    gridHTML += `
                        <div style="display: flex; flex-direction: column; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.4rem;">
                            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">${key}</span>
                            <span style="font-size: 0.9rem; color: var(--text-hi); font-weight: 500; margin-top: 0.15rem;">${val}</span>
                        </div>
                    `;
                }
                
                techGrid.innerHTML = gridHTML;
                techCard.style.display = 'block';
            } catch (err) {
                console.error('Erro ao processar Ficha Técnica:', err);
                techCard.style.display = 'none';
            }
        } else if (techCard) {
            techCard.style.display = 'none';
        }
        
        if (specFactoryYear) specFactoryYear.textContent = car.ano_fabricacao?.toString() || '—';
        if (specModelYear) specModelYear.textContent = car.ano_modelo?.toString() || '—';
        if (specPlate) specPlate.textContent = car.placa || '—';

        // Mostrar ações apenas se o usuário estiver logado
        const username = localStorage.getItem('username');
        const detailActions = document.getElementById('detail-actions');
        if (detailActions) {
            if (username) {
                detailActions.style.display = 'flex';
            } else {
                detailActions.style.display = 'none';
            }
        }

        // Configurar Botão de WhatsApp
        const btnWhatsapp = document.getElementById('btn-whatsapp') as HTMLAnchorElement | null;
        const whatsappBtnContainer = document.getElementById('whatsapp-btn-container');
        if (btnWhatsapp && whatsappBtnContainer) {
            const isPt = getLanguage() === 'pt';
            const contactPhone = "5511999999999"; // Telefone fictício da concessionária
            
            const messageText = isPt
                ? `Olá! Gostaria de mais informações sobre o ${car.marca || ''} ${car.modelo} (${car.ano_modelo || car.ano_fabricacao || ''}) anunciado por ${precoFormatado} no AutoDrive. Link: ${window.location.href}`
                : `Hello! I would like more information about the ${car.marca || ''} ${car.modelo} (${car.ano_modelo || car.ano_fabricacao || ''}) listed for ${precoFormatado} on AutoDrive. Link: ${window.location.href}`;
            
            btnWhatsapp.href = `https://wa.me/${contactPhone}?text=${encodeURIComponent(messageText)}`;
            
            const btnWhatsappSpan = btnWhatsapp.querySelector('span');
            if (btnWhatsappSpan) {
                btnWhatsappSpan.textContent = t('negotiate');
            }
            whatsappBtnContainer.style.display = 'block';
        }

        // Traduzir labels adicionais do Simulador
        const simResultLabel = document.querySelector('#financing-simulator-card .spec-row:last-of-type .spec-label');
        if (simResultLabel) {
            simResultLabel.textContent = getLanguage() === 'pt' ? 'Parcela Estimada' : 'Estimated Installment';
        }
        
        const simPriceLabel = document.querySelector('#financing-simulator-card div[style*="font-size: 0.7rem"]');
        if (simPriceLabel) {
            simPriceLabel.textContent = t('sim_price_rule');
        }

        // Renderiza o gráfico de depreciação se houver preço
        if (car.preco) {
            renderDepreciationChart(car.preco, currentCurrency, car.ano_modelo || car.ano_fabricacao || 2020);
        }

        // Configurar Alerta de Preço
        const alertTitle = document.getElementById('price-alert-title');
        const alertSub = document.getElementById('price-alert-subtitle');
        const btnSubmitAlert = document.getElementById('btn-submit-alert');
        const btnSubmitAlertLabel = document.getElementById('btn-submit-alert-label');
        const alertEmailInput = document.getElementById('alert-email') as HTMLInputElement | null;

        if (alertTitle) alertTitle.textContent = t('price_alert');
        if (alertSub) alertSub.textContent = t('price_alert_sub');
        if (btnSubmitAlertLabel) btnSubmitAlertLabel.textContent = getLanguage() === 'pt' ? 'Ativar' : 'Activate';

        const alertKey = `price_alert_registered_${car.id}`;
        if (localStorage.getItem(alertKey)) {
            if (alertEmailInput) {
                alertEmailInput.value = localStorage.getItem(alertKey) || '';
                alertEmailInput.disabled = true;
            }
            if (btnSubmitAlert) {
                (btnSubmitAlert as HTMLButtonElement).disabled = true;
                btnSubmitAlert.style.opacity = '0.6';
            }
            if (btnSubmitAlertLabel) {
                btnSubmitAlertLabel.textContent = getLanguage() === 'pt' ? 'Ativado' : 'Activated';
            }
        }

        btnSubmitAlert?.addEventListener('click', async () => {
            if (!alertEmailInput) return;
            const email = alertEmailInput.value.trim();
            if (!email || !email.includes('@')) {
                showToast(getLanguage() === 'pt' ? 'Por favor, insira um e-mail válido.' : 'Please enter a valid email.', 'error');
                return;
            }

            try {
                const response = await apiFetch<any>(`/api/v1/car/${car.id}/alert/`, {
                    method: 'POST',
                    body: JSON.stringify({ email })
                });

                if (response && response.success) {
                    showToast(t('favorite_success'), 'success');
                    localStorage.setItem(alertKey, email);
                    alertEmailInput.disabled = true;
                    (btnSubmitAlert as HTMLButtonElement).disabled = true;
                    btnSubmitAlert.style.opacity = '0.6';
                    if (btnSubmitAlertLabel) {
                        btnSubmitAlertLabel.textContent = getLanguage() === 'pt' ? 'Ativado' : 'Activated';
                    }
                } else {
                    showToast(getLanguage() === 'pt' ? 'Erro ao ativar alerta.' : 'Error activating alert.', 'error');
                }
            } catch (err: any) {
                showToast((getLanguage() === 'pt' ? 'Erro de conexão: ' : 'Connection error: ') + err.message, 'error');
            }
        });

        // Configurar Ações
        if (btnEdit) {
            btnEdit.addEventListener('click', () => {
                window.location.href = `../new_car/?id=${car.id}`;
            });
        }

        // Configurar Ações do Modal Customizado
        const confirmModal   = document.getElementById('confirm-modal');
        const modalCarName   = document.getElementById('modal-car-name');
        const modalCancel    = document.getElementById('modal-cancel-btn');
        const modalConfirm   = document.getElementById('modal-confirm-btn');

        if (btnDelete && confirmModal && modalCarName && modalCancel && modalConfirm) {
            btnDelete.addEventListener('click', () => {
                modalCarName.textContent = `${car.marca || ''} ${car.modelo}`;
                confirmModal.style.display = 'flex';
            });

            const closeModal = () => {
                confirmModal.style.display = 'none';
            };

            modalCancel.addEventListener('click', closeModal);
            
            // Fecha ao clicar fora (backdrop)
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) closeModal();
            });

            modalConfirm.addEventListener('click', async () => {
                closeModal();
                try {
                    const result = await apiFetch<any>(`/api/v1/car/${car.id}/`, {
                        method: 'DELETE'
                    });
                    if (result) {
                        showToast(getLanguage() === 'pt' ? 'Carro excluído com sucesso!' : 'Vehicle deleted successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '../cars/';
                        }, 1500);
                    } else {
                        showToast(getLanguage() === 'pt' ? 'Falha ao excluir carro.' : 'Failed to delete vehicle.', 'error');
                    }
                } catch (err: any) {
                    showToast((getLanguage() === 'pt' ? 'Erro ao excluir carro: ' : 'Error deleting vehicle: ') + err.message, 'error');
                }
            });
        }
    }

    function renderDepreciationChart(price: number, currency: string, carYear: number) {
        const currentYear = 2026;
        const years: number[] = [];
        const values: number[] = [];
        
        let startY = carYear && carYear > 1950 ? carYear : 2020;
        const isPt = getLanguage() === 'pt';
        
        if (startY >= currentYear) {
            // Projeção futura
            for (let i = 0; i < 5; i++) {
                const yr = currentYear + i;
                years.push(yr);
                values.push(price * Math.pow(0.92, i));
            }
        } else {
            // Curva histórica de depreciação
            const gap = currentYear - startY;
            if (gap > 5) {
                startY = currentYear - 5;
            }
            for (let yr = startY; yr <= currentYear; yr++) {
                years.push(yr);
                const yearsDiff = currentYear - yr;
                values.push(price * Math.pow(1.08, yearsDiff));
            }
        }
        
        const width = 450;
        const height = 180;
        const paddingLeft = 60;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;
        
        const minVal = Math.min(...values) * 0.9;
        const maxVal = Math.max(...values) * 1.1;
        
        const getX = (index: number) => {
            return paddingLeft + (index / (years.length - 1)) * (width - paddingLeft - paddingRight);
        };
        
        const getY = (val: number) => {
            return height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
        };
        
        let pathD = "";
        let pointsHTML = "";
        
        for (let i = 0; i < years.length; i++) {
            const x = getX(i);
            const y = getY(values[i]);
            if (i === 0) {
                pathD = `M ${x} ${y}`;
            } else {
                pathD += ` L ${x} ${y}`;
            }
            
            const displayVal = formatCurrency(values[i], currency);
            pointsHTML += `
                <circle cx="${x}" cy="${y}" r="4" fill="var(--gold)" class="chart-point">
                    <title>${years[i]}: ${displayVal}</title>
                </circle>
            `;
        }
        
        const areaPath = `
            ${pathD}
            L ${getX(years.length - 1)} ${height - paddingBottom}
            L ${getX(0)} ${height - paddingBottom}
            Z
        `;
        
        let gridHTML = "";
        for (let i = 0; i < 4; i++) {
            const gridVal = minVal + (i / 3) * (maxVal - minVal);
            const y = getY(gridVal);
            const label = formatCurrency(gridVal, currency);
            gridHTML += `
                <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3" stroke-width="0.5" />
                <text x="${paddingLeft - 8}" y="${y + 4}" fill="var(--text-dim)" font-size="8" text-anchor="end">${label}</text>
            `;
        }
        
        for (let i = 0; i < years.length; i++) {
            const x = getX(i);
            gridHTML += `
                <text x="${x}" y="${height - 10}" fill="var(--text-dim)" font-size="9" text-anchor="middle">${years[i]}</text>
            `;
        }
        
        const svgHTML = `
            <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; font-family:inherit; overflow:visible;">
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                
                ${gridHTML}
                <path d="${areaPath}" fill="url(#chartGrad)" />
                <path d="${pathD}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                ${pointsHTML}
            </svg>
        `;
        
        const chartContainer = document.getElementById('depreciation-chart-container');
        const card = document.getElementById('depreciation-card');
        const titleEl = document.getElementById('depreciation-title');
        const subtitleEl = document.getElementById('depreciation-subtitle');
        
        if (titleEl) titleEl.textContent = isPt ? 'Histórico de Depreciação (FIPE)' : 'Depreciation History (FIPE)';
        if (subtitleEl) subtitleEl.textContent = isPt ? 'Estimativa baseada na desvalorização média anual do modelo.' : 'Estimate based on model average annual depreciation.';
        
        if (chartContainer && card) {
            chartContainer.innerHTML = svgHTML;
            card.style.display = 'block';
        }
    }
});
