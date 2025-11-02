import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import { Link } from 'react-router-dom';
import './ForumPage.css';

const ForumPage = () => {
    const { token, user } = useAuth();
    const { showNotification } = useNotification();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/forum/posts');
            if (!response.ok) {
                throw new Error('No se pudieron cargar los temas del foro.');
            }
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!token) {
            showNotification('Debes iniciar sesión para crear un tema.', 'error');
            return;
        }
        if (!newPostTitle || !newPostContent) {
            showNotification('Por favor, completa el título y el contenido.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:3000/api/forum/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newPostTitle,
                    content: newPostContent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el tema.');
            }

            // Añade el nuevo post al principio de la lista y actualiza el estado
            setPosts([data.post, ...posts]);
            showNotification('¡Tema creado exitosamente!', 'success');
            setNewPostTitle('');
            setNewPostContent('');
        } catch (err) {
            setError(err.message);
            showNotification(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="forum-page-container">
            {/* Títulos y subtítulos fuera del .container para que puedan centrarse en todo el ancho */}
            <h2 className="forum-title">Comunidad Harajuku</h2>
            <p className="forum-subtitle">Comparte tus estilos, dudas y outfits con la comunidad.</p>

            {/* El .container ahora solo envuelve la parte de la cuadrícula */}
            <div className="container">
                <div className="forum-content-grid">
                    {token && (
                        <div className="new-post-form-card">
                            <h3>Crear un nuevo tema de discusión</h3>
                            <form onSubmit={handleCreatePost}>
                                <div className="form-group">
                                    <label htmlFor="postTitle">Título del Tema</label>
                                    <input
                                        type="text"
                                        id="postTitle"
                                        className="form-control"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        placeholder="Ej: ¿Dónde conseguir zapatos estilo lolita?"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="postContent">Tu mensaje</label>
                                    <textarea
                                        id="postContent"
                                        className="form-control"
                                        rows="5"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="Escribe tu pregunta o comparte tu opinión aquí..."
                                        disabled={isSubmitting}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-primary btn-kawaii" disabled={isSubmitting}>
                                    {isSubmitting ? 'Publicando...' : 'Publicar Tema'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="post-list-container">
                        <h3>Temas Recientes</h3>
                        {loading && <p>Cargando temas...</p>}
                        {error && <p className="error-message">{error}</p>}

                        {!loading && posts.length === 0 && (
                            <p className="empty-message">Aún no hay temas. ¡Sé el primero en crear uno!</p>
                        )}

                        <div className="post-list">
                            {posts.map(post => (
                                <div key={post._id} className="post-item-card">
                                    <div className="post-item-header">
                                        <span className="post-author-name">
                                            Por: {post.author ? post.author.profile.name : 'Usuario Eliminado'}
                                        </span>
                                        <span className="post-date">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="post-item-title">{post.title}</h4>
                                    <p className="post-item-content-preview">
                                        {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
                                    </p>
                                    <div className="post-item-footer">
                                        <span className="post-comment-count">
                                            {/* Asegúrate de que post.comments sea un array antes de acceder a .length */}
                                            {(post.comments ? post.comments.length : 0)} {(post.comments ? post.comments.length : 0) === 1 ? 'Respuesta' : 'Respuestas'}
                                        </span>
                                        {/* ¡¡¡ESTA ES LA LÍNEA CLAVE QUE SE MODIFICÓ!!! */}
                                        <Link to={`/foro/post/${post._id}`} className="btn-secondary btn-sm">
                                            Ver Discusión
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForumPage;