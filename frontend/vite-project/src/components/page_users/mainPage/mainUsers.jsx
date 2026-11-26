import { Link, useNavigate } from 'react-router-dom';
import { Photos } from '../../../../photo';
import { useApi } from '../../../useApi';
import { filterLabels } from '../../../vehicles';
import ListingCard from '../../shared/ListingCard';

export default function MainUsers() {
    const navigate = useNavigate();
    const { data: cars = [], loading, error, reload } = useApi('/car');

    return (
        <main className="market-page">
            <div className="market-container">
                <section className="market-hero">
                    <div>
                        <h1>Маркетплейс техники NOVO</h1>
                        <p>Коммерческий транспорт и спецтехника от продавцов.</p>
                        <form className="quick-search" onSubmit={(event) => {
                            event.preventDefault();
                            const values = [...new FormData(event.currentTarget)].filter(([, value]) => value.trim());
                            navigate({ pathname: '/vehicles', search: new URLSearchParams(values).toString() });
                        }}>
                            {Object.entries(filterLabels).slice(0, 4).map(([field, label]) => (
                                <label key={field}>{label}<input name={field} /></label>
                            ))}
                            <button className="market-button">Найти технику</button>
                        </form>
                    </div>
                    <img src={Photos.ourSellers} alt="" />
                </section>
                <div className="market-bar">
                    <h2>Новые объявления</h2>
                    <Link to="/vehicles">Весь каталог</Link>
                </div>
                {loading && <p role="status">Загрузка объявлений…</p>}
                {error && <p role="alert">{error} <button onClick={reload}>Повторить</button></p>}
                {!loading && !error && !cars.length && <p>Пока нет опубликованных объявлений.</p>}
                <div className="listing-grid">{cars.slice(0, 6).map((car) => <ListingCard key={car.id} item={car} />)}</div>
            </div>
        </main>
    );
}
