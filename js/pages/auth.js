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
});
// ======================================================
// LÓGICA DE AUTENTICACIÓN (VERSIÓN FINAL CON SINCRONIZACIÓN)
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
    // ... (Tu código para el registerForm se mantiene igual)

    // --- MANEJADOR PARA EL FORMULARIO DE LOGIN (ACTUALIZADO) ---
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
                    // Guardamos el token y el email como antes
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userEmail', data.userEmail);

                    // ¡NUEVO! Llamamos a la función para sincronizar el carrito
                    await syncCartWithDB();

                    alert(data.message);
                    window.location.href = 'index.html';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }
});

/**
 * ¡NUEVA FUNCIÓN!
 * Sincroniza el carrito local con la base de datos después del login.
 */
async function syncCartWithDB() {
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    const token = localStorage.getItem('token');

    if (!token) return; // No hacer nada si no hay token

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
            // Reemplazamos el carrito local con la versión final y autoritativa del servidor
            localStorage.setItem('cart', JSON.stringify(finalCart));
            updateCartVisuals(); // Actualizamos el contador del header
            console.log("Carrito sincronizado exitosamente.");
        } else {
            console.error("Falló la sincronización del carrito.");
        }
    } catch (error) {
        console.error("Error al sincronizar el carrito:", error);
    }
}