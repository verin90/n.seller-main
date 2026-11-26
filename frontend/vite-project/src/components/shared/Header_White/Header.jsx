import { Link } from 'react-router-dom';

export default function SellerHeader() {
    return (
        <header className="market-header">
            <div className="market-container">
                <Link to="/" className="market-logo">NOVO SELLER</Link>
                <nav aria-label="Навигация">
                    {localStorage.getItem('token') && <Link to="/my-ads">Кабинет</Link>}
                    <Link to="/mainUsers" className="market-button">Перейти на NOVO</Link>
                </nav>
            </div>
        </header>
    );
}
