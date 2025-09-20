// js/pages/auth.js (Adaptado si tus IDs son solo 'email' y 'password')

document.addEventListener('DOMContentLoaded', () => {

    // --- MANEJADOR PARA EL FORMULARIO DE REGISTRO ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            // ¡IMPORTANTE! Si tus IDs son solo 'email' y 'password' en singup.html
            const email = document.getElementById('email').value; // CAMBIO AQUÍ
            const password = document.getElementById('password').value; // CAMBIO AQUÍ

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userEmail', data.userEmail);
                    localStorage.setItem('userRole', data.userRole);

                    if (typeof showNotification === 'function') {
                        showNotification(data.message, 'success');
                    } else {
                        alert(data.message);
                    }
                    window.location.href = 'index.html';
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification('Error: ' + (data.message || 'Registro fallido.'), 'error');
                    } else {
                        alert('Error: ' + (data.message || 'Registro fallido.'));
                    }
                }
            } catch (error) {
                console.error("Error en el registro:", error);
                if (typeof showNotification === 'function') {
                    showNotification('No se pudo conectar con el servidor para registrar.', 'error');
                } else {
                    alert('No se pudo conectar con el servidor.');
                }
            }
        });
    }

    // --- MANEJADOR PARA EL FORMULARIO DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            // ¡IMPORTANTE! Si tus IDs son solo 'email' y 'password' en login.html
            const email = document.getElementById('email').value; // CAMBIO AQUÍ
            const password = document.getElementById('password').value; // CAMBIO AQUÍ

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userEmail', data.userEmail);
                    localStorage.setItem('userRole', data.userRole);

                    await syncCartWithDB();

                    if (typeof showNotification === 'function') {
                        showNotification(data.message, 'success');
                    } else {
                        alert(data.message);
                    }
                    window.location.href = 'index.html';
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification('Error: ' + (data.message || 'Inicio de sesión fallido.'), 'error');
                    } else {
                        alert('Error: ' + (data.message || 'Inicio de sesión fallido.'));
                    }
                }
            } catch (error) {
                console.error("Error en el login:", error);
                if (typeof showNotification === 'function') {
                    showNotification('No se pudo conectar con el servidor para iniciar sesión.', 'error');
                } else {
                    alert('No se pudo conectar con el servidor.');
                }
            }
        });
    }

    async function syncCartWithDB() {
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        const token = localStorage.getItem('token');

        if (!token) return;

        try {
            const response = await fetch('http://localhost:3000/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cart: localCart })
            });

            if (response.ok) {
                const finalCart = await response.json();
                localStorage.setItem('cart', JSON.stringify(finalCart));
                if (typeof updateCartVisuals === 'function') {
                    updateCartVisuals();
                }
                console.log("Carrito sincronizado exitosamente.");
            } else {
                console.error("Falló la sincronización del carrito.");
            }
        } catch (error) {
            console.error("Error al sincronizar el carrito:", error);
        }
    }
});