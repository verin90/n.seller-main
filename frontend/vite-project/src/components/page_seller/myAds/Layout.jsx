import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Photos } from '../../../../photo';
import styles from './Layout.module.scss';
import Header_White from '../../shared/Header_White/Header';
import Footer from '../../shared/Footer/footer';
import { useMemo } from 'react';

function Layout() {
    const location = useLocation();

    const pageTitle = useMemo(() => {
        switch (location.pathname) {
            case '/my-ads':
                return 'Мои объявления';
            case '/my-ads/new':
                return 'Создание объявления';
            case '/my-ads/messages':
                return 'Сообщения';
            case '/my-ads/subscription':
                return 'Управление подпиской';
            case '/my-ads/profile':
                return 'Настройки профиля';
            default:
                return location.pathname.endsWith('/edit') ? 'Редактирование объявления' : 'Объявление';
        }
    }, [location]);

    return (
        <>
            <Header_White />
            <section className={styles.myAdsNav}>
                <div className={styles.mainNav}>
                    <h1>{pageTitle}</h1>
                    <ul className={styles.userMenuList}>
                        <li className={styles.userMenuItem}>
                            <NavLink to="/my-ads" end>Мои объявления</NavLink>
                        </li>
                        <li className={styles.userMenuItem}>
                            <NavLink to="/my-ads/messages">
                                Сообщения
                            </NavLink>
                        </li>
                        <li className={styles.userMenuItem}>
                            <NavLink to="/my-ads/subscription">Управление подпиской</NavLink>
                        </li>
                        <li className={styles.userMenuItem}>
                            <img src={Photos.settings} alt="" />
                            <NavLink to="/my-ads/profile">Настройки профиля</NavLink>
                        </li>
                    </ul>
                </div>
            </section>
            <Outlet />

            <Footer />
        </>
    );
}

export default Layout;
