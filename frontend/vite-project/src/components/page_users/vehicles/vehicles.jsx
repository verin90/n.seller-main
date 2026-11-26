import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../../../useApi';
import { filterLabels, matchesVehicle } from '../../../vehicles';
import ListingCard from '../../shared/ListingCard';

export default function Vehicles() {
    const [params, setParams] = useSearchParams();
    const [limit, setLimit] = useState(12);
    const { data: cars = [], loading, error, reload } = useApi('/car');
    const matching = cars.filter((car) => matchesVehicle(car, params));

    function filter(event) {
        event.preventDefault();
        const values = [...new FormData(event.currentTarget)].filter(([, value]) => value.trim());
        setParams(values);
        setLimit(12);
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <Link to="/mainUsers">Главная</Link>
                <h1>Транспортные средства</h1>
                <div className="catalog-layout">
                    <form key={params.toString()} onSubmit={filter} className="catalog-filters">
                        <h2>Фильтры</h2>
                        {Object.entries(filterLabels).map(([field, label], index) => (
                            <label key={field}>{label}
                                <input name={field} defaultValue={params.get(field) || ''}
                                    type={index < 4 ? 'text' : 'number'} min="0" step={field.endsWith('Price') ? '0.01' : '1'} />
                            </label>
                        ))}
                        <button className="market-button">Применить</button>
                        {params.size > 0 && <button type="button" className="market-secondary" onClick={() => { setParams({}); setLimit(12); }}>Сбросить</button>}
                    </form>
                    <div className="catalog-results">
                        {loading && <p role="status">Загрузка каталога…</p>}
                        {error && <p role="alert">{error} <button onClick={reload}>Повторить</button></p>}
                        {!loading && !error && <p>Найдено объявлений: {matching.length}</p>}
                        {!loading && !error && !matching.length && <p>{params.size ? 'Попробуйте изменить фильтры.' : 'Опубликованные объявления появятся здесь.'}</p>}
                        <div className="listing-grid">
                            {matching.slice(0, limit).map((car) => <ListingCard key={car.id} item={car} />)}
                        </div>
                        {matching.length > limit && <button className="market-button" onClick={() => setLimit(limit + 12)}>Загрузить ещё</button>}
                    </div>
                </div>
            </div>
        </main>
    );
}
