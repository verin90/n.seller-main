import { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../../../api';

export default function PopUp({ onClose }) {
    const dialog = useRef(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => { dialog.current.showModal(); }, []);

    async function send(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await api.post('/sales-requests', Object.fromEntries(new FormData(event.currentTarget)));
            setSuccess(true);
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setBusy(false);
        }
    }

    return (
        <dialog ref={dialog} className="market-dialog" aria-labelledby="sales-heading" onClose={onClose}>
            <div className="market-bar">
                <h2 id="sales-heading">Отдел продаж</h2>
                <button className="market-secondary" type="button" onClick={() => dialog.current.close()}>Закрыть</button>
            </div>
            {success ? <p role="status">Заявка сохранена.</p> : <form onSubmit={send}>
                <label>Имя<input name="name" required maxLength={150} autoComplete="name" /></label>
                <label>Телефон<input name="phone" type="tel" required maxLength={40} autoComplete="tel" /></label>
                <label>Email<input name="email" type="email" required autoComplete="email" /></label>
                {error && <p className="market-error" role="alert">{error}</p>}
                <button className="market-button" disabled={busy}>Отправить заявку</button>
            </form>}
        </dialog>
    );
}
