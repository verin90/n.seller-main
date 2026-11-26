import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="market-footer">
            <div className="market-container">
                <div>
                    <Link to="/mainUsers" className="market-logo">N O V O</Link>
                    <p>Маркетплейс коммерческого транспорта и тяжёлой техники</p>
                </div>
                <nav aria-label="Ссылки в подвале">
                    <Link to="/vehicles">Каталог</Link>
                    <Link to="/registrationSalesman">Стать продавцом</Link>
                    <a href="/#tariffs">Тарифы</a>
                </nav>
                <p className="market-footer-copy">© NOVO</p>
            </div>
        </footer>
    );
}
