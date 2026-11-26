import { useState } from 'react';
import { useApi } from '../../../../../useApi';
import PopUp from '../../../popUp/popUp';

export default function SubscriptionPage() {
    const { data: tariffs = [], loading, error, reload } = useApi('/tariffs');
    const [showSales, setShowSales] = useState(false);

    return (
        <main className="market-page">
            <div className="market-container">
                {loading && <p role="status">Загрузка тарифов…</p>}
                {error && <p role="alert">{error} <button onClick={reload}>Повторить</button></p>}
                {!loading && !error && !tariffs.length && <p>Тарифы пока недоступны.</p>}
                {tariffs.length > 0 && <><h2>Тарифы для продавцов</h2>
                    <div className="listing-grid">
                        {tariffs.map((tariff) => <article key={tariff.id} className="tariff-card">
                            {tariff.icon_tariff && <img src={tariff.icon_tariff.startsWith('/') ? tariff.icon_tariff : '/' + tariff.icon_tariff} alt="" />}
                            <h3>{tariff.plan}</h3>
                            <strong>{tariff.price}</strong>
                            <p>{tariff.limit}</p>
                        </article>)}
                    </div>
                    <div className="market-bar"><p>По вопросам подключения и размещения более 50 объявлений свяжитесь с отделом продаж.</p>
                        <button className="market-button" onClick={() => setShowSales(true)}>Отдел продаж</button>
                    </div>
                </>}
                {showSales && <PopUp onClose={() => setShowSales(false)} />}
            </div>
        </main>
    );
}
