// Este código solo se ejecutará si encuentra un formulario de registro en la página
const registerForm = document.getElementById('register-form'); // Asegúrate de que tu formulario tenga este ID

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenir que la página se recargue

        const email = document.getElementById('email').value; // Asegúrate de que tu input de email tenga este ID
        const password = document.getElementById('password').value; // Asegúrate de que tu input de contraseña tenga este ID

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Muestra "Usuario registrado exitosamente."
                window.location.href = 'login.html'; // Redirige al usuario a la página de login
            } else {
                alert('Error: ' + data.message); // Muestra el mensaje de error del backend
            }

        } catch (error) {
            console.error('Hubo un error en el registro:', error);
            alert('No se pudo conectar con el servidor. Inténtalo más tarde.');
        }
    });
}