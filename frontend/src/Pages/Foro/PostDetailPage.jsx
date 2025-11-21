// src/Pages/Foro/PostDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faReply, faFlag, faTimes } from '@fortawesome/free-solid-svg-icons';
import './PostDetailPage.css';

// --- CORRECCIÓN: URL Dinámica ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Lista de razones de reporte predefinidas
const reportReasons = [
    'Contenido inapropiado',
    'Spam o autopromoción',
    'Discurso de odio o acoso',
    'Información falsa o engañosa',
    'Violencia o contenido gráfico',
    'Violación de derechos de autor',
    'Otros (especificar)',
];

const PostDetailPage = () => {
    const { postId } = useParams();
    const { token, user } = useAuth();
    const { showNotification } = useNotification();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newCommentContent, setNewCommentContent] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // --- ESTADOS Y LÓGICA PARA EL MODAL DE REPORTE ---
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingItemId, setReportingItemId] = useState(null);
    const [reportingItemType, setReportingItemType] = useState(''); 
    const [selectedReportReason, setSelectedReportReason] = useState('');
    const [customReportReason, setCustomReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const openReportModal = (itemId, itemType) => {
        if (!token) {
            showNotification('Debes iniciar sesión para reportar.', 'error');
            return;
        }
        setReportingItemId(itemId);
        setReportingItemType(itemType);
        setIsReportModalOpen(true);
        setSelectedReportReason('');
        setCustomReportReason('');
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
        setReportingItemId(null);
        setReportingItemType('');
        setSelectedReportReason('');
        setCustomReportReason('');
    };

    const handleSendReport = async (e) => {
        e.preventDefault();
        let reasonToSend = selectedReportReason;
        let customReasonToSend = '';

        if (selectedReportReason === 'Otros (especificar)') {
            reasonToSend = 'Otro'; 
            customReasonToSend = customReportReason.trim();
            if (!customReasonToSend) {
                showNotification('Por favor, especifica el motivo del reporte.', 'warning');
                return;
            }
        }

        if (!reasonToSend) {
            showNotification('Por favor, selecciona un motivo para el reporte.', 'warning');
            return;
        }

        setIsSubmittingReport(true);
        try {
            // --- Uso de API_BASE_URL ---
            let endpoint = '';
            switch (reportingItemType) {
                case 'Post':
                    endpoint = `${API_BASE_URL}/forum/posts/${reportingItemId}/report`;
                    break;
                case 'Comment':
                    endpoint = `${API_BASE_URL}/forum/comments/${reportingItemId}/report`;
                    break;
                case 'Reply':
                    endpoint = `${API_BASE_URL}/forum/replies/${reportingItemId}/report`;
                    break;
                default:
                    throw new Error('Tipo de ítem a reportar desconocido.');
            }
            
            const response = await fetch(endpoint, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason: reasonToSend,
                    customReason: customReasonToSend, 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al enviar el reporte.');
            }
            
            setPost(prevPost => {
                return prevPost;
            });

            showNotification('Contenido reportado exitosamente. Gracias por tu contribución.', 'success');
            closeReportModal();
        } catch (err) {
            console.error('Error al enviar reporte:', err);
            showNotification(err.message || 'Error desconocido al enviar el reporte.', 'error');
        } finally {
            setIsSubmittingReport(false);
        }
    };
    // --- FIN LÓGICA PARA EL MODAL DE REPORTE ---

    const formatPostDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const fetchPostDetails = useCallback(async () => {
        setLoading(true);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('El tema de discusión no fue encontrado.');
                }
                throw new Error('No se pudieron cargar los detalles del tema.');
            }
            const data = await response.json();
            setPost(data);
        } catch (err) {
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [postId, showNotification]);

    useEffect(() => {
        fetchPostDetails();
    }, [fetchPostDetails]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!token) {
            showNotification('Debes iniciar sesión para comentar.', 'error');
            return;
        }
        if (!newCommentContent.trim()) {
            showNotification('Por favor, escribe un comentario.', 'warning');
            return;
        }

        setIsSubmittingComment(true);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newCommentContent })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al añadir el comentario.');
            }

            setPost(prevPost => ({
                ...prevPost,
                comments: [...prevPost.comments, data.comment]
            }));
            showNotification('¡Comentario añadido exitosamente!', 'success');
            setNewCommentContent('');
        } catch (err) {
            console.error("Error al añadir comentario:", err);
            showNotification(err.message || 'Error desconocido al añadir comentario.', 'error');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentInteraction = async (commentId, action) => {
        if (!token || !user) {
            showNotification('Debes iniciar sesión para interactuar.', 'error');
            return;
        }

        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/forum/comments/${commentId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Error al ${action} el comentario.`;
                showNotification(errorMessage, 'error');
                return;
            }

            setPost(prevPost => {
                if (!prevPost) return null;

                const updatedComments = prevPost.comments.map(comment => {
                    if (comment._id === commentId) {
                        return { ...comment, ...data.comment };
                    }
                    return comment;
                });

                return {
                    ...prevPost,
                    comments: updatedComments
                };
            });

            showNotification(`¡${action} procesado exitosamente!`, 'success');

        } catch (err) {
            console.error(`Error en handleCommentInteraction para ${action}:`, err);
            showNotification(err.message || `Hubo un error al procesar tu ${action}.`, 'error');
        }
    };

    const handleAddReply = async (e, commentId) => {
        e.preventDefault();
        if (!token) {
            showNotification('Debes iniciar sesión para responder.', 'error');
            return;
        }
        if (!replyContent.trim()) {
            showNotification('Por favor, escribe tu respuesta.', 'warning');
            return;
        }

        setIsSubmittingReply(true);
        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/forum/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: replyContent })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al añadir la respuesta.');
            }

            setPost(prevPost => {
                if (!prevPost) return null;

                const updatedComments = prevPost.comments.map(comment => {
                    if (comment._id === commentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), data.reply]
                        };
                    }
                    return comment;
                });

                return {
                    ...prevPost,
                    comments: updatedComments
                };
            });

            showNotification('¡Respuesta añadida exitosamente!', 'success');
            setReplyContent('');
            setReplyToCommentId(null);
        } catch (err) {
            console.error("Error al añadir respuesta:", err);
            showNotification(err.message || 'Error desconocido al añadir respuesta.', 'error');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleReplyInteraction = async (commentId, replyId, action) => {
        if (!token || !user) {
            showNotification('Debes iniciar sesión para interactuar.', 'error');
            return;
        }

        try {
            // --- Uso de API_BASE_URL ---
            const response = await fetch(`${API_BASE_URL}/forum/replies/${replyId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Error al ${action} la respuesta.`;
                showNotification(errorMessage, 'error');
                return;
            }

            setPost(prevPost => {
                if (!prevPost) return null;

                const updatedComments = prevPost.comments.map(comment => {
                    if (comment._id === commentId) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply._id === replyId) {
                                return { ...reply, ...data.reply };
                            }
                            return reply;
                        });
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                });

                return {
                    ...prevPost,
                    comments: updatedComments
                };
            });

            showNotification(`¡${action} de respuesta procesado exitosamente!`, 'success');

        } catch (err) {
            console.error(`Error en handleReplyInteraction para ${action}:`, err);
            showNotification(err.message || `Hubo un error al procesar tu ${action} en la respuesta.`, 'error');
        }
    };

    if (loading) {
        return (
            <div className="post-detail-page-container">
                <div className="container">
                    <p className="loading-message">Cargando tema de discusión...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post-detail-page-container">
                <div className="container">
                    <p className="error-message">{error}</p>
                    <Link to="/foro" className="btn-secondary">Volver al Foro</Link>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-detail-page-container">
                <div className="container">
                    <p className="empty-message">El tema de discusión no existe.</p>
                    <Link to="/foro" className="btn-secondary">Volver al Foro</Link>
                </div>
            </div>
        );
    }

    const getAuthorName = (author) => author?.profile?.name || 'Usuario Eliminado';

    return (
        <div className="post-detail-page-container">
            <div className="container">
                <Link to="/foro" className="back-to-forum-link">&lt; Volver a la Comunidad</Link>

                <div className="post-and-comments-grid">
                    <div className="post-detail-card">
                        <h1 className="post-detail-title">{post.title}</h1>
                        <div className="post-meta">
                            <span className="post-author">Por: {getAuthorName(post.author)}</span>
                            <span className="post-date">{formatPostDate(post.createdAt)}</span>
                            {user && user.id !== post.author?._id && (
                                <button
                                    className={`action-btn report-btn ${post.hasPendingReports ? 'reported' : ''}`}
                                    onClick={() => openReportModal(post._id, 'Post')}
                                    disabled={!token}
                                    title="Reportar Post"
                                >
                                    <FontAwesomeIcon icon={faFlag} /> Reportar Post
                                </button>
                            )}
                        </div>
                        <div className="post-content">
                            <p>{post.content}</p>
                        </div>
                    </div>

                    <div className="comments-section">
                        <h2>Comentarios ({post.comments.length})</h2>

                        {token && (
                            <div className="add-comment-card">
                                <h4>Añadir un comentario</h4>
                                <form onSubmit={handleAddComment}>
                                    <div className="form-group">
                                        <textarea
                                            className="form-control"
                                            rows="4"
                                            placeholder="Escribe tu comentario aquí..."
                                            value={newCommentContent}
                                            onChange={(e) => setNewCommentContent(e.target.value)}
                                            disabled={isSubmittingComment}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn-primary btn-kawaii" disabled={isSubmittingComment}>
                                        {isSubmittingComment ? 'Publicando...' : 'Comentar'}
                                    </button>
                                </form>
                            </div>
                        )}
                        {!token && (
                            <p className="login-to-comment-message">
                                <Link to="/login" className="login-link">Inicia sesión</Link> para dejar un comentario.
                            </p>
                        )}

                        <div className="comment-list">
                            {post.comments.length === 0 && <p className="empty-message">Sé el primero en comentar este tema.</p>}
                            {post.comments.map(comment => (
                                <div key={comment._id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author-name">{getAuthorName(comment.author)}</span>
                                        <span className="comment-date">{formatPostDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="comment-content">{comment.content}</p>
                                    <div className="comment-actions">
                                        <button
                                            className={`action-btn like-btn ${user && comment.likes.includes(user.id) ? 'active' : ''}`}
                                            onClick={() => handleCommentInteraction(comment._id, 'like')}
                                            disabled={!token}
                                            title="Me gusta"
                                        >
                                            <FontAwesomeIcon icon={faThumbsUp} /> {comment.likes.length}
                                        </button>
                                        <button
                                            className={`action-btn dislike-btn ${user && comment.dislikes.includes(user.id) ? 'active' : ''}`}
                                            onClick={() => handleCommentInteraction(comment._id, 'dislike')}
                                            disabled={!token}
                                            title="No me gusta"
                                        >
                                            <FontAwesomeIcon icon={faThumbsDown} /> {comment.dislikes.length}
                                        </button>
                                        <button
                                            className="action-btn reply-btn"
                                            onClick={() => setReplyToCommentId(replyToCommentId === comment._id ? null : comment._id)}
                                            disabled={!token}
                                            title="Responder"
                                        >
                                            <FontAwesomeIcon icon={faReply} /> Responder
                                        </button>
                                        {user && user.id !== comment.author?._id && (
                                            <button
                                                className={`action-btn report-btn ${comment.hasPendingReports ? 'reported' : ''}`}
                                                onClick={() => openReportModal(comment._id, 'Comment')}
                                                disabled={!token}
                                                title="Reportar"
                                            >
                                                <FontAwesomeIcon icon={faFlag} /> Reportar
                                            </button>
                                        )}
                                    </div>

                                    {replyToCommentId === comment._id && token && (
                                        <div className="reply-form-card">
                                            <form onSubmit={(e) => handleAddReply(e, comment._id)}>
                                                <div className="form-group">
                                                    <textarea
                                                        className="form-control"
                                                        rows="2"
                                                        placeholder={`Responde a ${getAuthorName(comment.author)}...`}
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        disabled={isSubmittingReply}
                                                    ></textarea>
                                                </div>
                                                <div className="reply-form-actions">
                                                    <button type="submit" className="btn-primary btn-kawaii btn-sm" disabled={isSubmittingReply}>
                                                        {isSubmittingReply ? 'Enviando...' : 'Enviar'}
                                                    </button>
                                                    <button type="button" className="btn-secondary btn-sm" onClick={() => setReplyToCommentId(null)} disabled={isSubmittingReply}>
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="reply-list">
                                            {comment.replies.map(reply => (
                                                <div key={reply._id} className="reply-item">
                                                    <div className="reply-header">
                                                        <span className="reply-author-name">{getAuthorName(reply.author)}</span>
                                                        <span className="reply-date">{formatPostDate(reply.createdAt)}</span>
                                                    </div>
                                                    <p className="reply-content">{reply.content}</p>
                                                    <div className="comment-actions">
                                                        <button
                                                            className={`action-btn like-btn ${user && reply.likes.includes(user.id) ? 'active' : ''}`}
                                                            onClick={() => handleReplyInteraction(comment._id, reply._id, 'like')}
                                                            disabled={!token}
                                                            title="Me gusta"
                                                        >
                                                            <FontAwesomeIcon icon={faThumbsUp} /> {reply.likes.length}
                                                        </button>
                                                        <button
                                                            className={`action-btn dislike-btn ${user && reply.dislikes.includes(user.id) ? 'active' : ''}`}
                                                            onClick={() => handleReplyInteraction(comment._id, reply._id, 'dislike')}
                                                            disabled={!token}
                                                            title="No me gusta"
                                                        >
                                                            <FontAwesomeIcon icon={faThumbsDown} /> {reply.dislikes.length}
                                                        </button>
                                                        {user && user.id !== reply.author?._id && (
                                                            <button
                                                                className={`action-btn report-btn ${reply.hasPendingReports ? 'reported' : ''}`}
                                                                onClick={() => openReportModal(reply._id, 'Reply')}
                                                                disabled={!token}
                                                                title="Reportar"
                                                            >
                                                                <FontAwesomeIcon icon={faFlag} /> Reportar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isReportModalOpen && (
                <div className="report-modal-overlay">
                    <div className="report-modal">
                        <div className="report-modal-header">
                            <h2>Reportar Contenido</h2>
                            <button className="close-modal-btn" onClick={closeReportModal} disabled={isSubmittingReport}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <p className="report-modal-description">Ayúdanos a mantener la comunidad segura. Selecciona el motivo de tu reporte para el <strong>{reportingItemType}</strong>.</p>
                        <form onSubmit={handleSendReport}>
                            <div className="report-reason-list">
                                {reportReasons.map((reason) => (
                                    <label key={reason} className="report-reason-item">
                                        <input
                                            type="radio"
                                            name="reportReason"
                                            value={reason}
                                            checked={selectedReportReason === reason}
                                            onChange={(e) => setSelectedReportReason(e.target.value)}
                                            disabled={isSubmittingReport}
                                        />
                                        <span>{reason}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedReportReason === 'Otros (especificar)' && (
                                <div className="form-group mt-3">
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Especifique su motivo aquí..."
                                        value={customReportReason}
                                        onChange={(e) => setCustomReportReason(e.target.value)}
                                        disabled={isSubmittingReport}
                                    ></textarea>
                                </div>
                            )}
                            <div className="report-modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeReportModal} disabled={isSubmittingReport}>Cancelar</button>
                                <button type="submit" className="btn-primary btn-kawaii report-submit-btn" disabled={isSubmittingReport}>
                                    {isSubmittingReport ? 'Enviando...' : 'Enviar Reporte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetailPage;