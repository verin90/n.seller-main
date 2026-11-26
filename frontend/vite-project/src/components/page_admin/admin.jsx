import { useState } from 'react';
import { useApi } from '../../useApi';
import { api, errorText } from '../../api';
import ListingCard from '../shared/ListingCard';

export default function Admin() {
    const { data: cars = [], loading, error, reload } = useApi('/car');
    const { data: requests = [], loading: requestsLoading, error: requestsError, reload: reloadRequests } = useApi('/sales-requests');
    const [failure, setFailure] = useState('');
    const [busy, setBusy] = useState(null);

    async function remove(car) {
        if (!window.confirm(`Удалить объявление «${car.name_car}»?`)) return;
        setBusy(car.id);
        setFailure('');
        try {
            await api.delete(`/car/${car.id}`);
            reload();
        } catch (error) {
            setFailure(errorText(error));
        } finally {
            setBusy(null);
        }
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <h1>Панель администратора</h1>
                <h2>Объявления</h2>
                {loading && <p role="status">Загрузка объявлений…</p>}
                {(error || failure) && <p role="alert">{error || failure} {error && <button onClick={reload}>Повторить</button>}</p>}
                {!loading && !error && !cars.length && <p>Пока нет объявлений.</p>}
                <div className="listing-grid">{cars.map((car) => <ListingCard key={car.id} item={car} actions={
                    <button className="market-danger" onClick={() => remove(car)} disabled={busy !== null}>{busy === car.id ? 'Удаление…' : 'Удалить'}</button>
                } />)}</div>
                <h2>Заявки в отдел продаж</h2>
                {requestsLoading && <p role="status">Загрузка заявок…</p>}
                {requestsError && <p role="alert">{requestsError} <button onClick={reloadRequests}>Повторить</button></p>}
                {!requestsLoading && !requestsError && !requests.length && <p>Пока нет заявок.</p>}
                {requests.length > 0 && <ul className="sales-requests">{requests.map((request) => (
                    <li key={request.id}><strong>{request.name}</strong><span>{request.email}</span><span>{request.phone}</span></li>
                ))}</ul>}
            </div>
        </main>
    );
}
