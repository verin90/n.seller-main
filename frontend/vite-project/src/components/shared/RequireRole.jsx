import { Navigate, useLocation } from 'react-router-dom';
import { useApi } from '../../useApi';

export default function RequireRole({ roles, children }) {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const { data: user, loading, error, status, reload } = useApi(token ? '/me' : null);

    if (!token || status === 401) {
        return <Navigate to="/login-sales" replace state={{ from: location.pathname }} />;
    }
    if (loading) return <p className="page-status" role="status">Загрузка профиля…</p>;
    if (error) return <div className="page-status" role="alert">{error} <button type="button" onClick={reload}>Повторить</button></div>;
    if (roles && !roles.includes(user.role)) return <Navigate to="/mainUsers" replace />;
    return children;
}
