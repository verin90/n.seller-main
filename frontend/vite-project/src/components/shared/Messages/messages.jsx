import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText } from '../../../api';
import { useApi } from '../../../useApi';

export default function Messages() {
    const { data: user } = useApi('/me');
    const { data: messages = [], loading, error, reload } = useApi('/messages');
    const [active, setActive] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState('');
    const threads = new Map();

    for (const message of user ? messages : []) {
        const sent = String(message.sender_id) === String(user.id);
        const other = sent ? message.recipient_id : message.sender_id;
        const key = `${message.car_id}:${other}`;
        if (!threads.has(key)) threads.set(key, { name: sent ? message.recipient_name : message.sender_name, messages: [] });
        threads.get(key).messages.push({ ...message, sent });
    }
    const selected = threads.has(active) ? active : threads.keys().next().value;
    const thread = threads.get(selected);
    const last = thread?.messages.at(-1);

    async function reply(event) {
        event.preventDefault();
        setBusy(true);
        setFailure('');
        try {
            await api.post('/messages', { replyTo: last.id, body });
            setBody('');
            reload();
        } catch (error) {
            setFailure(errorText(error));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <h1>Сообщения</h1>
                {loading && <p role="status">Загрузка сообщений…</p>}
                {error && <p role="alert">{error} <button onClick={reload}>Повторить</button></p>}
                {!loading && !error && !messages.length && <p>У вас пока нет сообщений. <Link to="/vehicles">Перейти в каталог</Link></p>}
                {thread && <div className="message-layout">
                    <nav aria-label="Переписки">
                        {[...threads].reverse().map(([key, chat]) => <button key={key} type="button" className="market-secondary" aria-pressed={key === selected}
                            onClick={() => { setActive(key); setBody(''); setFailure(''); }}><strong>{chat.name}</strong><span>{chat.messages[0].listing_name}</span></button>)}
                    </nav>
                    <section>
                        <div className="market-bar"><h2>{thread.name}</h2><Link to={`/vehicles/${last.car_id}`}>{last.listing_name}</Link></div>
                        <ol className="message-thread">
                            {thread.messages.map((message) => <li key={message.id} className={message.sent ? 'sent' : ''}><small>{message.sent ? 'Вы' : message.sender_name}</small><p>{message.body}</p></li>)}
                        </ol>
                        <form onSubmit={reply}>
                            <label>Ответить<textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={3000} rows={3} /></label>
                            <button className="market-button" disabled={busy}>Отправить</button>
                            {failure && <p className="market-error" role="alert">{failure}</p>}
                        </form>
                    </section>
                </div>}
            </div>
        </main>
    );
}
