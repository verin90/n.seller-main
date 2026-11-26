import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorText } from '../../../api';
import styles from './RegistrationSalesman.module.scss';

const companyFields = {
    name_company: 'Название компании', country: 'Страна', city: 'Город', adress: 'Адрес',
    pocht_index: 'Почтовый индекс', work_number: 'Рабочий телефон', web_site: 'Веб-сайт',
};
const contactFields = { initials: 'ФИО', number: 'Номер телефона' };
const required = ['work_number', 'initials', 'number'];
const inputTypes = { work_number: 'tel', number: 'tel', web_site: 'url' };

function Fields({ fields }) {
    return <div className={styles.grid}>{Object.entries(fields).map(([field, label]) => (
        <label key={field}>{label}{required.includes(field) && ' *'}
            <input name={field} type={inputTypes[field] || 'text'} required={required.includes(field)} maxLength={500} />
        </label>
    ))}</div>;
}

export default function RegistrationSalesman() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [role, setRole] = useState(params.get('role') === 'buyer' ? 'buyer' : 'seller');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function register(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/registration_seller', Object.fromEntries(new FormData(event.currentTarget)));
            localStorage.setItem('token', data.token);
            navigate(data.user.role === 'buyer' ? '/mainUsers' : '/my-ads', { replace: true });
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="market-page">
            <form className={styles.registration} onSubmit={register}>
                <header>
                    <h1>{role === 'buyer' ? 'Регистрация покупателя' : 'Регистрация продавца'}</h1>
                    <p>Заполните поля, чтобы создать аккаунт.</p>
                </header>
                <fieldset>
                    <legend>Аккаунт</legend>
                    <label>Тип аккаунта
                        <select name="role" value={role} onChange={(event) => setRole(event.target.value)}>
                            <option value="buyer">Покупатель</option>
                            <option value="seller">Продавец</option>
                        </select>
                    </label>
                    <div className={styles.grid}>
                        <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
                        <label>Пароль *<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
                    </div>
                </fieldset>
                {role === 'seller' && <>
                    <fieldset><legend>О компании</legend><Fields fields={companyFields} /></fieldset>
                    <fieldset><legend>Контактное лицо</legend><Fields fields={contactFields} /></fieldset>
                </>}
                {error && <p className="market-error" role="alert">{error}</p>}
                <button className="market-button" disabled={loading}>{loading ? 'Регистрация…' : 'Продолжить'}</button>
                <p>Уже есть аккаунт? <Link to="/login-sales">Войти</Link></p>
            </form>
        </main>
    );
}
