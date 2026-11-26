import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorText } from '../../../../../api';
import { useApi } from '../../../../../useApi';

const contacts = {
    name_company: 'Название компании', country: 'Страна', city: 'Город', adress: 'Адрес',
    pocht_index: 'Почтовый индекс', work_number: 'Рабочий телефон', web_site: 'Веб-сайт',
    business_hours: 'Время работы', initials: 'ФИО контактного лица', number: 'Мобильный телефон',
};

export default function Settings() {
    const { data: user, loading, error, reload } = useApi('/me');
    if (loading) return <p className="page-status" role="status">Загрузка профиля…</p>;
    if (error) return <p className="page-status" role="alert">{error} <button onClick={reload}>Повторить</button></p>;
    return <Profile user={user} />;
}

function Profile({ user }) {
    const [profile, setProfile] = useState(user);
    const [accountValues, setAccountValues] = useState(null);
    const [result, setResult] = useState({});
    const [busy, setBusy] = useState(false);
    const dialog = useRef(null);
    const accountForm = useRef(null);
    const navigate = useNavigate();

    async function save(values, section) {
        setBusy(true);
        setResult({});
        try {
            const { data } = await api.put('/update_profile', values);
            setProfile(data.user);
            setResult({ section, message: 'Изменения сохранены.' });
            if (section === 'account') dialog.current.close();
            return true;
        } catch (failure) {
            setResult({ section, error: errorText(failure) });
            return false;
        } finally {
            setBusy(false);
        }
    }

    function status(section) {
        if (result.section !== section) return null;
        return result.error
            ? <p className="market-error" role="alert">{result.error}</p>
            : <p role="status">{result.message}</p>;
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <div className="market-bar">
                    <h2>{profile.name_company || 'Профиль продавца'}</h2>
                    <button className="market-secondary" onClick={() => { localStorage.removeItem('token'); navigate('/login-sales', { replace: true }); }}>Выйти из аккаунта</button>
                </div>
                <details className="profile-section">
                    <summary>Настройки аккаунта</summary>
                    <form ref={accountForm} onSubmit={(event) => {
                        event.preventDefault();
                        const values = Object.fromEntries(new FormData(event.currentTarget));
                        if (!values.newEmail && !values.newPassword) {
                            setResult({ section: 'account', error: 'Введите новый email или пароль.' });
                            return;
                        }
                        setResult({});
                        setAccountValues(values);
                        dialog.current.showModal();
                    }}>
                        <p>Текущий email <strong>{profile.email}</strong></p>
                        <label>Новый email<input name="newEmail" type="email" autoComplete="email" /></label>
                        <label>Новый пароль<input name="newPassword" type="password" minLength={8} autoComplete="new-password" /></label>
                        <button className="market-button">Сохранить</button>
                        {status('account')}
                    </form>
                </details>
                <details className="profile-section">
                    <summary>Контактная информация</summary>
                    <form onSubmit={(event) => { event.preventDefault(); save(Object.fromEntries(new FormData(event.currentTarget)), 'contacts'); }}>
                        <div className="profile-fields">
                            {Object.entries(contacts).map(([field, label]) => <label key={field}>{label}
                                <input name={field} defaultValue={profile[field] || ''} maxLength={500}
                                    type={field === 'web_site' ? 'url' : ['work_number', 'number'].includes(field) ? 'tel' : 'text'} />
                            </label>)}
                        </div>
                        <button className="market-button" disabled={busy}>Сохранить контакты</button>
                        {status('contacts')}
                    </form>
                </details>
                <details className="profile-section">
                    <summary>Информация о компании</summary>
                    <form onSubmit={(event) => { event.preventDefault(); save(Object.fromEntries(new FormData(event.currentTarget)), 'company'); }}>
                        <label>Описание компании<textarea name="company_description" defaultValue={profile.company_description || ''} rows={6} maxLength={6000} /></label>
                        <button className="market-button" disabled={busy}>Сохранить описание</button>
                        {status('company')}
                    </form>
                </details>
                <dialog className="market-dialog" ref={dialog} onClose={() => { setAccountValues(null); dialog.current.querySelector('form')?.reset(); }}>
                    <form onSubmit={async (event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        if (await save({ ...accountValues, ...Object.fromEntries(new FormData(form)) }, 'account')) {
                            form.reset();
                            accountForm.current?.reset();
                        }
                    }}>
                        <h2>{accountValues?.newEmail && accountValues?.newPassword ? 'Подтвердите изменения' : accountValues?.newEmail ? 'Подтвердите смену email' : 'Подтвердите смену пароля'}</h2>
                        <label>Действующий пароль<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
                        {result.error && status('account')}
                        <div className="market-bar">
                            <button className="market-button" disabled={busy}>Подтвердить</button>
                            <button type="button" className="market-secondary" disabled={busy} onClick={() => dialog.current.close()}>Отмена</button>
                        </div>
                    </form>
                </dialog>
            </div>
        </main>
    );
}
