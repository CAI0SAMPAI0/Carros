import { apiFetch } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
    const registerForm = document.getElementById('register-form') as HTMLFormElement | null;
    const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement | null;
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;

    // 1. Alternar Visibilidade da Senha (Olho)
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Alternar a opacidade ou o ícone do olho para indicar estado
            if (isPassword) {
                togglePasswordBtn.classList.remove('text-brand-text-dim');
                togglePasswordBtn.classList.add('text-brand-red');
            } else {
                togglePasswordBtn.classList.remove('text-brand-red');
                togglePasswordBtn.classList.add('text-brand-text-dim');
            }
        });
    }

    // 2. Submissão do Formulário de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = loginForm.elements.namedItem('username') as HTMLInputElement | null;
            const passwordInputEl = loginForm.elements.namedItem('password') as HTMLInputElement | null;
            
            if (!usernameInput || !passwordInputEl) return;
            
            const username = usernameInput.value;
            const password = passwordInputEl.value;
            
            try {
                const data = await apiFetch<any>('/login/', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
                
                if (data && data.success) {
                    // Guarda o nome de usuário logado
                    localStorage.setItem('username', data.username);
                    alert(data.message || 'Login bem-sucedido!');
                    window.location.href = '../';
                }
            } catch (err: any) {
                alert('Erro ao fazer login: ' + err.message);
            }
        });
    }

    // 3. Submissão do Formulário de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = registerForm.elements.namedItem('username') as HTMLInputElement | null;
            const emailInput = registerForm.elements.namedItem('email') as HTMLInputElement | null;
            const passwordInputEl = registerForm.elements.namedItem('password') as HTMLInputElement | null;
            
            if (!usernameInput || !emailInput || !passwordInputEl) return;
            
            const username = usernameInput.value;
            const email = emailInput.value;
            const password = passwordInputEl.value;
            
            try {
                const data = await apiFetch<any>('/register/', {
                    method: 'POST',
                    body: JSON.stringify({ username, email, password })
                });
                
                if (data && data.success) {
                    alert(data.message || 'Cadastro realizado com sucesso!');
                    window.location.href = '../login/';
                }
            } catch (err: any) {
                // Trata múltiplos erros de validação se retornados pelo form do Django
                if (err.message && typeof err.message === 'object') {
                    const errors = Object.values(err.message).join('\n');
                    alert('Erro no cadastro:\n' + errors);
                } else {
                    alert('Erro ao cadastrar: ' + err.message);
                }
            }
        });
    }
});
