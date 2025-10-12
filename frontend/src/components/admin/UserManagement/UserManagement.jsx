// src/components/Admin/UserManagement/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../Notifications/NotificationSystem';
import './UserManagement.css'; // Estilos específicos para UserManagement

const UserManagement = () => {
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null); // Para saber qué usuario se está actualizando

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar usuarios.');
            }

            const data = await response.json();
            setUsers(data);
            showNotification('Usuarios cargados exitosamente.', 'success');
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showNotification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- NUEVA FUNCIÓN PARA CAMBIAR EL ROL ---
    const handleChangeRole = async (userId, currentRole) => {
        // Confirmación antes de cambiar el rol
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const confirmChange = window.confirm(
            `¿Estás seguro de que quieres cambiar el rol de este usuario a "${newRole}"?`
        );

        if (!confirmChange) {
            return; // Cancelar si el usuario no confirma
        }

        setUpdatingUserId(userId); // Establecer el ID del usuario que se está actualizando
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole }) // Enviar el nuevo rol al backend
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el rol.');
            }

            // Si la actualización fue exitosa, refrescar la lista de usuarios
            // Opcional: Actualizar el estado 'users' directamente para una actualización instantánea
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userId ? { ...user, role: newRole } : user
                )
            );
            showNotification(`Rol de usuario actualizado a "${newRole}" exitosamente.`, 'success');

        } catch (err) {
            console.error('Error changing user role:', err);
            showNotification(`Error al cambiar el rol: ${err.message}`, 'error');
        } finally {
            setUpdatingUserId(null); // Restablecer el ID de actualización
        }
    };
    // --- FIN DE NUEVA FUNCIÓN ---

    if (loading) {
        return (
            <div className="user-management-container text-center py-5">
                <i className="fas fa-spinner fa-spin fa-3x text-kawaii-pink"></i>
                <p className="mt-3">Cargando usuarios...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-management-container text-center py-5">
                <p className="text-danger">Error: {error}</p>
                <button onClick={fetchUsers} className="btn-kawaii btn-primary mt-3">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="user-management-container">
            <h3>Gestión de Usuarios</h3>
            {users.length === 0 ? (
                <p className="text-center mt-4">No hay usuarios registrados.</p>
            ) : (
                <div className="table-responsive">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user._id}</td>
                                    <td>{user.email}</td>
                                    <td>{user.profile?.name || 'N/A'}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button
                                            className={`btn-kawaii btn-${user.role === 'admin' ? 'demote' : 'promote'} btn-sm`}
                                            onClick={() => handleChangeRole(user._id, user.role)}
                                            disabled={updatingUserId === user._id} // Deshabilitar durante la actualización
                                        >
                                            {updatingUserId === user._id ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                user.role === 'admin' ? 'Degradar a Usuario' : 'Promover a Admin'
                                            )}
                                        </button>
                                        {/* Puedes añadir otros botones aquí si lo deseas */}
                                        {/* <button className="btn-kawaii btn-edit btn-sm ms-2" disabled>Editar</button> */}
                                        {/* <button className="btn-kawaii btn-delete btn-sm ms-2" disabled>Eliminar</button> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagement;