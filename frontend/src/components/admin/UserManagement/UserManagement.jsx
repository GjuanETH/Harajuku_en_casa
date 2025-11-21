// src/components/Admin/UserManagement/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../Notifications/NotificationSystem';
import './UserManagement.css';

// --- CORRECCIÓN: URL Dinámica ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const UserManagement = () => {
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    // Función para cargar los usuarios desde el backend
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar usuarios.');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showNotification]);

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [fetchUsers, token]);

    // Función para cambiar el rol (Admin/User)
    const handleChangeRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`¿Estás seguro de que quieres cambiar el rol de este usuario a "${newRole}"?`)) return;

        setUpdatingUserId(userId);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar el rol.');
            }
            
            // Actualizar el estado localmente para reflejar el cambio
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
            setUpdatingUserId(null);
        }
    };

    // --- FUNCIÓN PARA ANULAR SILENCIO ---
    const handleUnsilenceUser = async (userId) => {
        if (!window.confirm("¿Estás seguro de anular el silencio de este usuario?")) return;

        setUpdatingUserId(userId);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unsilence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al anular el silencio.');
            }

            // Actualizar el estado local del usuario
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userId ? { ...user, isSilenced: false, silencedUntil: null } : user
                )
            );
            showNotification(data.message, 'success');
        } catch (err) {
            console.error('Error unsilencing user:', err);
            showNotification(err.message, 'error');
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Función para formatear la fecha (si existe)
    const formatSilencedDate = (dateString) => {
        if (!dateString) return '(Indefinido)';
        return `hasta ${new Date(dateString).toLocaleDateString('es-CO')}`;
    };

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
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user._id}</td>
                                    <td>{user.email}</td>
                                    <td>{user.profile?.name || 'N/A'}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.isSilenced ? (
                                            <span className="status-silenced">
                                                Silenciado {formatSilencedDate(user.silencedUntil)}
                                            </span>
                                        ) : (
                                            <span className="status-active">Activo</span>
                                        )}
                                    </td>
                                    <td className="user-actions">
                                        <button
                                            className={`btn-kawaii btn-sm ${user.role === 'admin' ? 'btn-demote' : 'btn-promote'}`}
                                            onClick={() => handleChangeRole(user._id, user.role)}
                                            disabled={updatingUserId === user._id}
                                            title={user.role === 'admin' ? 'Degradar a Usuario' : 'Promover a Admin'}
                                        >
                                            {updatingUserId === user._id ? <i className="fas fa-spinner fa-spin"></i> : (user.role === 'admin' ? 'Degradar' : 'Promover')}
                                        </button>
                                        
                                        {user.isSilenced && (
                                            <button 
                                                className="btn-kawaii btn-unsilence btn-sm"
                                                onClick={() => handleUnsilenceUser(user._id)}
                                                disabled={updatingUserId === user._id}
                                                title="Anular silencio"
                                            >
                                                Anular Silencio
                                            </button>
                                        )}
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