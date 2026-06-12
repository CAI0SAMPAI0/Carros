// Lógica de Autenticação (Login, Registro e Toggle de Senha)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

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
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            
            try {
                const data = await apiFetch('/login/', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
                
                if (data && data.success) {
                    // Guarda o nome de usuário logado
                    localStorage.setItem('username', data.username);
                    alert(data.message || 'Login bem-sucedido!');
                    window.location.href = '../index.html';
                }
            } catch (err) {
                alert('Erro ao fazer login: ' + err.message);
            }
        });
    }

    // 3. Submissão do Formulário de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            
            try {
                const data = await apiFetch('/register/', {
                    method: 'POST',
                    body: JSON.stringify({ username, email, password })
                });
                
                if (data && data.success) {
                    alert(data.message || 'Cadastro realizado com sucesso!');
                    window.location.href = 'login.html';
                }
            } catch (err) {
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
