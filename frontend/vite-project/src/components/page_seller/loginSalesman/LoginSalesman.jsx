import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, errorText } from '../../../api';
import styles from './LoginSalesman.module.scss';

function LoginSalesman() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email || !formData.password) {
            setError('Email и пароль обязательны');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/login', formData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);

            const requested = location.state?.from;
            const requestedAllowed = typeof requested === 'string'
                && (requested === '/messages' || /^\/vehicles\/\d+$/.test(requested)
                    || (user.role !== 'buyer' && /^\/my-ads(?:\/|$)/.test(requested)));
            const home = { admin: '/admin', seller: '/my-ads', buyer: '/mainUsers' }[user.role] || '/';
            navigate(requestedAllowed ? requested : home, { replace: true });
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.loginSection}>
            <div className={styles.loginContainer}>
                <h2>Вход в систему</h2>
                <p>Введите email и пароль, чтобы войти</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email" autoComplete="username"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password" autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className={styles.registerLink}>
                    Нет аккаунта? <Link to="/registrationSalesman">Зарегистрироваться</Link>
                </p>
            </div>
        </section>
    );
}

export default LoginSalesman;
