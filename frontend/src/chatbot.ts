import { apiFetch } from './api';
import { getLanguage } from './i18n';

document.addEventListener('DOMContentLoaded', () => {
    // Evita duplicar chatbot na página
    if (document.getElementById('ai-chatbot-container')) return;

    // Obtém carId da URL se disponível
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    const isPt = getLanguage() === 'pt';
    const welcomeMessage = isPt 
        ? "Olá! Sou o assistente virtual da AutoDrive. Como posso te ajudar a encontrar o veículo ideal hoje?"
        : "Hello! I'm the AutoDrive virtual assistant. How can I help you find your perfect car today?";

    // 1. Criar container principal e injetar estilo e HTML
    const container = document.createElement('div');
    container.id = 'ai-chatbot-container';
    container.style.position = 'fixed';
    container.style.bottom = '2rem';
    container.style.right = '2rem';
    container.style.zIndex = '9999';
    container.style.fontFamily = 'Barlow, sans-serif';

    // HTML do botão flutuante e do painel
    container.innerHTML = `
        <!-- Botão Flutuante -->
        <button id="chatbot-toggle" style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #7f00ff, #e100ff); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 15px rgba(127,0,255,0.4); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
        </button>

        <!-- Painel de Chat (Oculto por padrão) -->
        <div id="chatbot-panel" style="display: none; position: absolute; bottom: 80px; right: 0; width: 340px; height: 450px; background: rgba(26, 26, 29, 0.95); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); backdrop-filter: blur(10px); flex-direction: column; overflow: hidden; animation: chatbotFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7f00ff, #e100ff); padding: 1rem; color: white; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></div>
                    <span style="font-weight: 600; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 0.5px;">AutoDrive AI</span>
                </div>
                <button id="chatbot-close" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
            </div>

            <!-- Corpo de Mensagens -->
            <div id="chatbot-messages" style="flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.85rem;">
                <div style="align-self: flex-start; background: var(--dark); border: 1px solid var(--border); padding: 0.6rem 0.8rem; border-radius: 12px 12px 12px 0; max-width: 85%; color: var(--text-hi); line-height: 1.4;">
                    ${welcomeMessage}
                </div>
            </div>

            <!-- Input / Envio -->
            <div style="padding: 0.8rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; background: rgba(15,15,18,0.8);">
                <input type="text" id="chatbot-input" placeholder="${isPt ? 'Pergunte sobre os carros...' : 'Ask about our inventory...'}" style="flex: 1; background: var(--dark); border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 0.8rem; color: var(--text-hi); font-size: 0.85rem; outline: none; transition: border-color 0.2s;">
                <button id="chatbot-send" style="background: linear-gradient(135deg, #7f00ff, #e100ff); border: none; border-radius: 6px; color: white; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                    ${isPt ? 'Enviar' : 'Send'}
                </button>
            </div>
        </div>
    `;

    // Injeta CSS chave para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes chatbotFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #chatbot-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(127,0,255,0.6);
        }
        #chatbot-input:focus {
            border-color: var(--gold) !important;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);

    // 2. Controlar abertura e fechamento
    const toggleBtn = document.getElementById('chatbot-toggle');
    const panel = document.getElementById('chatbot-panel');
    const closeBtn = document.getElementById('chatbot-close');
    const messagesBody = document.getElementById('chatbot-messages');
    const chatInput = document.getElementById('chatbot-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('chatbot-send');

    if (!toggleBtn || !panel || !closeBtn || !messagesBody) return;

    toggleBtn.addEventListener('click', () => {
        const isClosed = panel.style.display === 'none';
        panel.style.display = isClosed ? 'flex' : 'none';
        if (isClosed && chatInput) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // 3. Histórico de mensagens
    const messageHistory: { role: 'user' | 'assistant'; content: string }[] = [];

    const appendMessage = (role: 'user' | 'assistant', content: string) => {
        const msgDiv = document.createElement('div');
        const isUser = role === 'user';
        
        msgDiv.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
        msgDiv.style.background = isUser ? 'linear-gradient(135deg, #7f00ff, #e100ff)' : 'var(--dark)';
        if (!isUser) {
            msgDiv.style.border = '1px solid var(--border)';
        }
        msgDiv.style.padding = '0.6rem 0.8rem';
        msgDiv.style.borderRadius = isUser ? '12px 12px 0 12px' : '12px 12px 12px 0';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.color = 'white';
        msgDiv.style.lineHeight = '1.4';
        msgDiv.style.whiteSpace = 'pre-line';
        msgDiv.textContent = content;
        
        messagesBody.appendChild(msgDiv);
        messagesBody.scrollTop = messagesBody.scrollHeight;
    };

    // 4. Envio de Mensagens para o Backend
    const handleSend = async () => {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        appendMessage('user', text);
        messageHistory.push({ role: 'user', content: text });

        // Adiciona indicador visual de carregamento
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'chatbot-typing';
        typingIndicator.style.alignSelf = 'flex-start';
        typingIndicator.style.background = 'var(--dark)';
        typingIndicator.style.border = '1px solid var(--border)';
        typingIndicator.style.padding = '0.6rem 0.8rem';
        typingIndicator.style.borderRadius = '12px 12px 12px 0';
        typingIndicator.style.color = 'var(--text-dim)';
        typingIndicator.style.fontStyle = 'italic';
        typingIndicator.textContent = isPt ? 'AutoDrive digitando...' : 'AutoDrive typing...';
        messagesBody.appendChild(typingIndicator);
        messagesBody.scrollTop = messagesBody.scrollHeight;

        try {
            const data = await apiFetch<any>('/api/v1/chatbot/', {
                method: 'POST',
                body: JSON.stringify({
                    messages: messageHistory,
                    car_id: carId ? parseInt(carId) : null
                })
            });

            // Remove indicador
            document.getElementById('chatbot-typing')?.remove();

            if (data && data.success && data.reply) {
                appendMessage('assistant', data.reply);
                messageHistory.push({ role: 'assistant', content: data.reply });
            } else {
                appendMessage('assistant', isPt ? 'Desculpe, ocorreu um problema no meu sistema.' : 'Sorry, a problem occurred in my system.');
            }
        } catch (err) {
            document.getElementById('chatbot-typing')?.remove();
            appendMessage('assistant', isPt ? 'Desculpe, ocorreu um erro de conexão.' : 'Sorry, a connection error occurred.');
            console.error(err);
        }
    };

    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
