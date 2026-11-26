import { Link } from 'react-router-dom';
import { Photos } from '../../../photo';
import { priceText } from '../../vehicles';

export default function ListingCard({ item, actions }) {
    return (
        <article className="listing-card">
            <Link to={`/vehicles/${item.id}`} className="listing-link">
                {item.img_car ? <img className="listing-photo" src={item.img_car} alt={item.name_car} loading="lazy" />
                    : <div className="listing-photo listing-placeholder">Фото не добавлено</div>}
                <p className="listing-category">{item.body_type}</p>
                <h3>{item.name_car}</h3>
            </Link>
            <ul className="listing-specs">
                {item.years_car && <li>{item.years_car} г.</li>}
                {item.distance_traveled != null && item.distance_traveled !== '' && <li>{item.distance_traveled} км</li>}
                {item.size_car != null && item.size_car !== '' && <li>{item.size_car} кг</li>}
            </ul>
            <div className="listing-meta">
                <div><img src={Photos.location} alt="" /><span>{[item.seller_name, item.seller_country].filter(Boolean).join(' · ')}</span></div>
                <strong>{priceText(item.price)}</strong>
            </div>
            {actions && <div className="listing-actions">{actions}</div>}
        </article>
    );
}
