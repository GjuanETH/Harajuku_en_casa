// src/components/Admin/AdminReport/AdminReportsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Ajusta la ruta si es diferente
import { useNotification } from '../../Notifications/NotificationSystem'; // Ajusta la ruta si es diferente
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Añadimos el icono de "silencio"
import { faCheckCircle, faTimesCircle, faTrash, faEye, faSyncAlt, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import './AdminReportPage.css';

const AdminReportsPage = () => {
    const { token } = useAuth();
    const { showNotification } = useNotification();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); 
    const [itemToActOn, setItemToActOn] = useState(null);

    const formatDateTime = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-CO', options); // 'es-CO' para formato colombiano
    };

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/admin/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los reportes.');
            }
            const data = await response.json();
            setReports(data);
        } catch (err) {
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showNotification]);

    useEffect(() => {
        if (token) {
            fetchReports();
        }
    }, [token, fetchReports]);

    const openDetailModal = async (reportId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/reports/${reportId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar detalles del reporte.');
            }
            const data = await response.json();
            setSelectedReport(data);
            setIsDetailModalOpen(true);
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedReport(null);
    };

    const openConfirmModal = (action, item) => {
        setConfirmAction(action);
        setItemToActOn(item);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
        setItemToActOn(null);
    };

    const handleResolveDismiss = async () => {
        if (!itemToActOn || !confirmAction) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/admin/reports/${itemToActOn._id}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: confirmAction === 'resolve' ? 'resolve' : 'dismiss' })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al ${confirmAction} el reporte.`);
            }
            showNotification(`Reporte marcado como ${confirmAction === 'resolve' ? 'resuelto' : 'desestimado'} exitosamente.`, 'success');
            fetchReports(); 
            closeDetailModal();
            closeConfirmModal();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToActOn || confirmAction !== 'delete') return;
        // Asegurarse de que tenemos el reportedItem y su ID
        const item = itemToActOn.reportedItem;
        if (!item || !item._id) {
            showNotification('Error: No se puede eliminar un ítem que ya no existe.', 'error');
            closeConfirmModal();
            return;
        }

        setLoading(true);
        try {
            const endpoint = `http://localhost:3000/api/admin/item/${itemToActOn.onModel}/${item._id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el contenido.');
            }
            showNotification('Contenido eliminado exitosamente. Todos los reportes relacionados también han sido eliminados.', 'success');
            fetchReports(); 
            closeDetailModal();
            closeConfirmModal();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- NUEVA FUNCIÓN PARA SILENCIAR AL AUTOR ---
    // --- NUEVA FUNCIÓN PARA SILENCIAR AL AUTOR ---
    const handleSilenceUser = async (report) => {
        const author = report?.reportedItem?.author;
        if (!author || !author._id) {
            showNotification("No se pudo encontrar al autor de este contenido (puede haber sido eliminado).", "error");
            return;
        }

        const durationInput = window.prompt(`¿Por cuántos minutos deseas silenciar a ${author.profile.name}? (Ingresa 0 para silencio indefinido)`);
        
        if (durationInput === null) return; // Si el admin presiona "Cancelar"

        const durationMinutes = parseInt(durationInput, 10);
        if (isNaN(durationMinutes) || durationMinutes < 0) {
             showNotification("Duración inválida. Ingresa un número (ej. 60 para 1 hora, 0 para indefinido).", 'error');
             return;
        }

        try {
            setLoading(true); // Opcional: un estado de carga específico para esta acción
            const response = await fetch(`http://localhost:3000/api/admin/users/${author._id}/silence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ durationMinutes })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al silenciar al usuario.');
            }
            showNotification(data.message, 'success');
            // Opcional: Resolver el reporte automáticamente después de silenciar
            // Ya que handleResolveReport no existe, la comentamos o eliminamos:
            // handleResolveReport(report._id, 'resolve'); // <-- COMENTAR O ELIMINAR ESTA LÍNEA
            
            // Si quieres que el reporte se resuelva, deberías usar handleResolveDismiss
            // Pero como esta acción es del reporte, y el silenciar es del usuario,
            // lo más limpio es dejar que el admin resuelva el reporte por separado si lo desea.
            // O bien, llamar a handleResolveDismiss pasando el reporte y la acción, por ejemplo:
            // openConfirmModal('resolve', report); // Esto abriría el modal de confirmación
            // O si quieres que se resuelva sin confirmación:
            // await handleResolveDismissInternal(report, 'resolve'); // Necesitarías refactorizar handleResolveDismiss para que sea una función interna que pueda ser llamada.
            
        } catch (err) {
            console.error("Error silencing user:", err);
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
            closeConfirmModal(); // Cierra cualquier modal abierto
            closeDetailModal(); // Cierra el modal de detalles si está abierto
            fetchReports(); // Volvemos a cargar los reportes para actualizar la vista
        }
    };

    const getReportedContentTitle = (reportedItem, onModel) => {
        if (!reportedItem) return 'Contenido Eliminado';
        switch (onModel) {
            case 'Post': return reportedItem.title || 'Post sin título';
            case 'Comment': return reportedItem.content ? `Comentario: "${reportedItem.content.substring(0, 50)}..."` : 'Comentario sin contenido';
            case 'Reply': return reportedItem.content ? `Respuesta: "${reportedItem.content.substring(0, 50)}..."` : 'Respuesta sin contenido';
            default: return 'Tipo de contenido desconocido';
        }
    };


    if (loading && reports.length === 0) {
        return (
            <div className="admin-reports-page">
                <p>Cargando reportes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-reports-page">
                <p className="error-message">Error: {error}</p>
                <button className="btn btn-primary" onClick={fetchReports}>
                    <FontAwesomeIcon icon={faSyncAlt} /> Reintentar Carga
                </button>
            </div>
        );
    }

    return (
        <div className="admin-reports-page">
            <h1 className="admin-page-title">Moderación de Contenido</h1>
            <p className="admin-page-description">Revisa y gestiona los reportes de contenido generados por los usuarios.</p>

            <div className="reports-controls">
                <button className="btn btn-primary refresh-btn" onClick={fetchReports} disabled={loading}>
                    <FontAwesomeIcon icon={faSyncAlt} /> Recargar Reportes
                </button>
            </div>

            {reports.length === 0 ? (
                <p className="no-reports-message">No hay reportes pendientes en este momento. ¡Buen trabajo!</p>
            ) : (
                <div className="reports-list">
                    {reports.map((report) => (
                        <div key={report._id} className="report-card">
                            <div className="report-summary">
                                <span className="report-type">{report.onModel}</span>
                                <span className="report-reason">Motivo: {report.reason}</span>
                                <span className="report-by">Reportado por: {report.reportedBy?.profile?.name || report.reportedBy?.email || 'Usuario Desconocido'}</span>
                                <span className="report-date">Fecha: {formatDateTime(report.createdAt)}</span>
                            </div>
                            <div className="reported-item-preview">
                                {report.reportedItem ? (
                                    <>
                                        <strong>Contenido: </strong>
                                        {getReportedContentTitle(report.reportedItem, report.onModel)}
                                        <span className="text-muted-author"> (por: {report.reportedItem.author?.profile?.name || 'N/A'})</span>
                                    </>
                                ) : (
                                    <em>Contenido original no encontrado (posiblemente eliminado).</em>
                                )}
                            </div>
                            <div className="report-actions">
                                <button className="btn btn-info btn-sm" onClick={() => openDetailModal(report._id)} title="Ver Detalles">
                                    <FontAwesomeIcon icon={faEye} /> Detalles
                                </button>
                                <button className="btn btn-success btn-sm" onClick={() => openConfirmModal('resolve', report)} title="Resolver Reporte">
                                    <FontAwesomeIcon icon={faCheckCircle} /> Resolver
                                </button>
                                <button className="btn btn-warning btn-sm" onClick={() => openConfirmModal('dismiss', report)} title="Desestimar Reporte">
                                    <FontAwesomeIcon icon={faTimesCircle} /> Desestimar
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => openConfirmModal('delete', report)} title="Eliminar Contenido">
                                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                                </button>
                                {/* --- BOTÓN AÑADIDO --- */}
                                <button 
                                    className="btn btn-dark btn-sm" 
                                    onClick={() => handleSilenceUser(report)}
                                    disabled={!report.reportedItem?.author}
                                    title="Silenciar al autor de este contenido"
                                >
                                    <FontAwesomeIcon icon={faVolumeMute} /> Silenciar Autor
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalles del Reporte */}
            {isDetailModalOpen && selectedReport && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal report-detail-modal">
                        <div className="modal-header">
                            <h2>Detalles del Reporte</h2>
                            <button className="close-modal-btn" onClick={closeDetailModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>ID Reporte:</strong> {selectedReport._id}</p>
                            <p><strong>Tipo de Contenido:</strong> {selectedReport.onModel}</p>
                            <p><strong>Reportado Por:</strong> {selectedReport.reportedBy?.profile?.name || selectedReport.reportedBy?.email || 'N/A'}</p>
                            <p><strong>Motivo:</strong> {selectedReport.reason}</p>
                            {selectedReport.customReason && (
                                <p><strong>Motivo Detallado:</strong> {selectedReport.customReason}</p>
                            )}
                            <p><strong>Fecha del Reporte:</strong> {formatDateTime(selectedReport.createdAt)}</p>
                            <p><strong>Estado:</strong> {selectedReport.status}</p>

                            <hr />
                            <h3>Contenido Reportado</h3>
                            {selectedReport.reportedItem ? (
                                <>
                                    <p><strong>ID Contenido:</strong> {selectedReport.reportedItem._id}</p>
                                    <p><strong>Autor del Contenido:</strong> {selectedReport.reportedItem.author?.profile?.name || selectedReport.reportedItem.author?.email || 'N/A'}</p>
                                    <p><strong>Fecha Creación Contenido:</strong> {formatDateTime(selectedReport.reportedItem.createdAt)}</p>
                                    {selectedReport.onModel === 'Post' && <p><strong>Título:</strong> {selectedReport.reportedItem.title}</p>}
                                    <p><strong>Contenido:</strong></p>
                                    <div className="reported-content-text">
                                        {selectedReport.reportedItem.content}
                                    </div>
                                </>
                            ) : (
                                <p className="deleted-content-message">El contenido original de este reporte ya no está disponible (posiblemente fue eliminado).</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeDetailModal}>Cerrar</button>
                            {selectedReport.status === 'Pendiente' && (
                                <>
                                    <button className="btn btn-success" onClick={() => openConfirmModal('resolve', selectedReport)}>
                                        <FontAwesomeIcon icon={faCheckCircle} /> Resolver
                                    </button>
                                    <button className="btn btn-warning" onClick={() => openConfirmModal('dismiss', selectedReport)}>
                                        <FontAwesomeIcon icon={faTimesCircle} /> Desestimar
                                    </button>
                                    {selectedReport.reportedItem && (
                                        <button className="btn btn-danger" onClick={() => openConfirmModal('delete', selectedReport)}>
                                            <FontAwesomeIcon icon={faTrash} /> Eliminar Contenido
                                        </button>
                                    )}
                                    {/* --- BOTÓN AÑADIDO EN MODAL --- */}
                                    {selectedReport.reportedItem && (
                                        <button 
                                            className="btn btn-dark" 
                                            onClick={() => handleSilenceUser(selectedReport)}
                                            disabled={!selectedReport.reportedItem?.author}
                                        >
                                            <FontAwesomeIcon icon={faVolumeMute} /> Silenciar Autor
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para acciones */}
            {isConfirmModalOpen && itemToActOn && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal confirm-modal">
                        <div className="modal-header">
                            <h2>Confirmar Acción</h2>
                            <button className="close-modal-btn" onClick={closeConfirmModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {confirmAction === 'resolve' && (
                                <p>¿Estás seguro de que quieres marcar este reporte como **resuelto**?</p>
                            )}
                            {confirmAction === 'dismiss' && (
                                <p>¿Estás seguro de que quieres **desestimar** este reporte?</p>
                            )}
                            {confirmAction === 'delete' && itemToActOn.reportedItem && (
                                <p className="text-danger">
                                    <strong>¡ADVERTENCIA!</strong> Estás a punto de **eliminar permanentemente** el {itemToActOn.onModel.toLowerCase()}
                                    "{getReportedContentTitle(itemToActOn.reportedItem, itemToActOn.onModel)}".
                                    Esta acción es **irreversible**.
                                </p>
                            )}
                             {confirmAction === 'delete' && !itemToActOn.reportedItem && (
                                <p className="text-danger">
                                    <strong>¡ADVERTENCIA!</strong> El contenido original ya fue eliminado. Esto solo eliminará el reporte.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeConfirmModal} disabled={loading}>Cancelar</button>
                            <button
                                className={`btn ${confirmAction === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={confirmAction === 'delete' ? handleDeleteItem : handleResolveDismiss}
                                disabled={loading}
                            >
                                {loading ? 'Procesando...' : (confirmAction === 'resolve' ? 'Confirmar Resolución' : confirmAction === 'dismiss' ? 'Confirmar Desestimar' : 'Confirmar Eliminación')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;