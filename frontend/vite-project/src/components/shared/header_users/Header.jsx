import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../../useApi';

export default function BuyerHeader() {
    const navigate = useNavigate();
    const { data: user } = useApi(localStorage.getItem('token') ? '/me' : null);

    function logout() {
        localStorage.removeItem('token');
        navigate('/login-sales', { replace: true });
    }

    return (
        <header className="market-header">
            <div className="market-container">
                <Link to="/mainUsers" className="market-logo">NOVO</Link>
                <nav aria-label="Навигация">
                    <Link to="/vehicles">Каталог</Link>
                    {user ? <Link to="/messages">Сообщения</Link> : <Link to="/login-sales">Войти</Link>}
                    {user?.role === 'seller' && <Link className="market-button" to="/my-ads">Кабинет продавца</Link>}
                    {user?.role === 'admin' && <Link className="market-button" to="/admin">Администрирование</Link>}
                    {!user && <Link className="market-button" to="/registrationSalesman">Стать продавцом</Link>}
                    {user && <button className="market-secondary" onClick={logout}>Выйти</button>}
                </nav>
            </div>
        </header>
    );
}
