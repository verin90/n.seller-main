import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorText } from '../../../../api';
import { useApi } from '../../../../useApi';
import { fieldLabels, listingValues, priceText } from '../../../../vehicles';
import AddCarForm from '../AddCarForm';

export default function Redact({ manage = false, edit = false }) {
    const { id } = useParams();
    const { data: car, loading, error, reload } = useApi(`/car/${id}`);
    const { data: user, loading: checkingUser, error: accountError } = useApi(localStorage.getItem('token') ? '/me' : null);

    if (loading) return <p className="page-status" role="status">Загрузка объявления…</p>;
    if (error) return <div className="page-status" role="alert">{error} <button onClick={reload}>Повторить</button></div>;
    const canManage = Boolean(user && (user.role === 'admin' || (user.role === 'seller' && String(user.id) === String(car.seller_id))));
    if (edit) return canManage ? <AddCarForm key={id} car={car} /> : <p className="page-status">{checkingUser ? 'Проверка прав доступа…' : accountError || 'Можно редактировать только свои объявления.'}</p>;
    return <VehicleDetails key={id} car={car} manage={manage && canManage} user={user} back={manage ? '/my-ads' : '/vehicles'} />;
}

function VehicleDetails({ car, manage, user, back }) {
    const navigate = useNavigate();
    const dialog = useRef(null);
    const [selected, setSelected] = useState(0);
    const [body, setBody] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function remove() {
        setBusy(true);
        setError('');
        try {
            await api.delete(`/car/${car.id}`);
            navigate('/my-ads', { replace: true });
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setBusy(false);
        }
    }

    async function send(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await api.post('/messages', { carId: car.id, body });
            setNotice('Сообщение отправлено.');
            setBody('');
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <div className="market-bar">
                    <Link to={back}>Назад</Link>
                    {manage && <div className="listing-actions">
                        <Link to={`/my-ads/${car.id}/edit`}>Редактировать объявление</Link>
                        <button className="market-danger" onClick={() => dialog.current.showModal()}>Удалить</button>
                    </div>}
                </div>
                <section className="detail-layout">
                    <div className="detail-gallery">
                        {car.photos.length ? <img className="detail-cover" src={car.photos[selected]} alt={`${car.name_car}, фото ${selected + 1}`} />
                            : <div className="detail-cover listing-placeholder">Фото не добавлено</div>}
                        {car.photos.length > 1 && <div className="detail-thumbnails">{car.photos.map((photo, index) => (
                            <button key={`${photo}-${index}`} onClick={() => setSelected(index)} aria-pressed={selected === index} aria-label={`Показать фото ${index + 1}`}>
                                <img src={photo} alt="" />
                            </button>
                        ))}</div>}
                    </div>
                    <div className="detail-summary">
                        <p className="listing-category">{car.body_type}</p>
                        <h1>{car.name_car}</h1>
                        <strong>{priceText(car.price)}</strong>
                        <p>{[car.seller_name, car.seller_country].filter(Boolean).join(' · ')}</p>
                        {!manage && car.seller_id && String(user?.id) !== String(car.seller_id) && (user ? (
                            <form className="contact-seller" onSubmit={send}>
                                <label>Сообщение продавцу<textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={3000} rows={3} /></label>
                                <button className="market-button" disabled={busy}>Отправить</button>
                                {notice && <p role="status">{notice} <Link to="/messages">К переписке</Link></p>}
                            </form>
                        ) : <Link to="/login-sales" state={{ from: `/vehicles/${car.id}` }}>Войдите, чтобы написать продавцу</Link>)}
                    </div>
                </section>
                <section className="detail-facts">
                    <h2>Обзор транспортного средства</h2>
                    <dl>{Object.entries(listingValues(car)).filter(([field, value]) => field !== 'price' && value !== '').map(([field, value]) => (
                        <div key={field}><dt>{fieldLabels[field]}</dt><dd>{value}</dd></div>
                    ))}</dl>
                    {car.description && <><h2>Описание</h2><p>{car.description}</p></>}
                </section>
                {error && !manage && <p className="market-error" role="alert">{error}</p>}
                {manage && <dialog ref={dialog} className="market-dialog" onClose={() => setError('')}>
                    <h2>Удалить объявление?</h2>
                    <p>{car.name_car}. Переписка по объявлению тоже будет удалена.</p>
                    {error && <p className="market-error" role="alert">{error}</p>}
                    <div className="market-bar">
                        <button className="market-danger" disabled={busy} onClick={remove}>Да, удалить</button>
                        <button className="market-secondary" disabled={busy} onClick={() => dialog.current.close()}>Отмена</button>
                    </div>
                </dialog>}
            </div>
        </main>
    );
}
