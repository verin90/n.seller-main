import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../../useApi';
import ListingCard from '../../shared/ListingCard';

export default function MyAds() {
    const { data: cars = [], error, loading, reload } = useApi('/my-cars');
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(9);
    const matching = cars.filter((car) => [car.name_car, car.proizvoditel].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <main className="market-page">
            <div className="market-container">
                <div className="market-bar">
                    <p>Объявлений опубликовано <strong>{cars.length}</strong></p>
                    <Link to="new" className="market-button">Добавить объявление</Link>
                </div>
                <input type="search" aria-label="Поиск по объявлениям" placeholder="Поиск по объявлениям" value={search}
                    onChange={(event) => { setSearch(event.target.value); setLimit(9); }} />
                {loading && <p role="status">Загрузка объявлений…</p>}
                {error && <p role="alert">{error} <button onClick={reload}>Повторить</button></p>}
                {!loading && !error && !matching.length && <p>{search ? 'По вашему запросу ничего не найдено.' : 'У вас пока нет опубликованных объявлений.'}</p>}
                <div className="listing-grid">
                    {matching.slice(0, limit).map((car) => <ListingCard key={car.id} item={car} actions={
                        <>
                            <Link to={String(car.id)}>Открыть в кабинете</Link>
                            <Link to={`${car.id}/edit`}>Редактировать</Link>
                        </>
                    } />)}
                </div>
                {matching.length > limit && <button className="market-button" onClick={() => setLimit(limit + 9)}>Загрузить ещё</button>}
            </div>
        </main>
    );
}
