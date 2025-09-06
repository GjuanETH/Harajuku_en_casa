// ======================================================
// LÓGICA ESPECÍFICA PARA LAS PÁGINAS DE AUTENTICACIÓN
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- MANEJADOR PARA EL FORMULARIO DE REGISTRO ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    window.location.href = 'login.html';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- ¡NUEVO MANEJADOR PARA EL FORMULARIO DE LOGIN! ---
// --- MANEJADOR PARA EL FORMULARIO DE LOGIN ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                // --- ¡NUEVO: Guardar el token y el email en localStorage! ---
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.userEmail); // Guarda el email para mostrarlo
                window.location.href = 'index.html'; // Redirige al inicio tras el login
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('No se pudo conectar con el servidor.');
        }
    });
}
});