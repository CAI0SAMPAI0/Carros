// Função auxiliar para fazer requisições à API do Django
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    // API_BASE_URL deve ser definido globalmente no arquivo js/config.js
    const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8000';
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Token ${token}`; 
    }
    
    const config = {
        ...options,
        headers,
    };
    
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, config);
        
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            // Só redireciona se não estivermos já na página de login
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = '/pages/login.html';
            }
            return null;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || 'Erro na requisição');
        }
        
        if (response.status === 204) {
            return true;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
