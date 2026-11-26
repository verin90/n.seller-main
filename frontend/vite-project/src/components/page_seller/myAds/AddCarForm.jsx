import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorText } from '../../../api';
import { fieldLabels, listingValues } from '../../../vehicles';
import styles from './AddCarForm.module.scss';

const textFields = ['category', 'brand', 'model', 'country'];
const types = ['image/jpeg', 'image/png', 'image/webp'];

function readPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function AddCarForm({ car }) {
    const navigate = useNavigate();
    const [values, setValues] = useState(() => listingValues(car));
    const [description, setDescription] = useState(car?.description || '');
    const [retained, setRetained] = useState(car?.photos || []);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const back = car ? `/my-ads/${car.id}` : '/my-ads';
    const photoCount = retained.length + files.length;

    function selectPhotos(event) {
        const selected = [...event.target.files];
        event.target.value = '';
        if (selected.length + photoCount > 6 || selected.some((file) => !types.includes(file.type) || file.size > 3 * 1024 * 1024)) {
            setError('Добавьте до 6 фотографий JPG, PNG или WebP размером до 3 МБ каждая.');
            return;
        }
        setFiles((previous) => [...previous, ...selected]);
        setError('');
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const payload = { ...values, description, keepPhotos: retained, photos: await Promise.all(files.map(readPhoto)) };
            const { data } = car ? await api.put(`/car/${car.id}`, payload) : await api.post('/car', payload);
            navigate(`/my-ads/${data.id}`, { replace: true });
        } catch (failure) {
            setError(errorText(failure));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="market-page">
            <div className="market-container">
                <div className="market-bar"><Link to={back}>Назад</Link></div>
                <form className={styles.form} onSubmit={submit}>
                    <h2>Обзор транспортного средства</h2>
                    <div className={styles.grid}>
                        {Object.entries(fieldLabels).map(([field, label]) => (
                            <label key={field}>
                                {label}
                                <input name={field} value={values[field]} required={textFields.includes(field) || field === 'price'}
                                    type={textFields.includes(field) ? 'text' : 'number'} maxLength={180}
                                    min={field === 'year' ? 1886 : 0} max={field === 'year' ? new Date().getFullYear() + 1 : 999999999}
                                    step={field === 'price' ? '0.01' : '1'}
                                    onChange={(event) => setValues({ ...values, [field]: event.target.value })} />
                            </label>
                        ))}
                    </div>
                    <div className={styles.media}>
                        <h3>Фотографии</h3>
                        <p>Первое фото станет обложкой. До 6 файлов JPG, PNG или WebP, по 3 МБ.</p>
                        {photoCount < 6 && <input aria-label="Добавить фотографии" type="file" accept={types.join(',')} multiple onChange={selectPhotos} />}
                        {photoCount > 0 && <ul className={styles.photos}>
                            {retained.map((url, index) => <li key={url}>
                                <img src={url} alt={`Фото ${index + 1}`} />
                                <button type="button" onClick={() => setRetained(retained.filter((_, position) => position !== index))}>Убрать фото {index + 1}</button>
                            </li>)}
                            {files.map((file, index) => <li key={`${file.name}-${index}`}>
                                <span>{file.name}</span>
                                <button type="button" onClick={() => setFiles(files.filter((_, position) => position !== index))}>Убрать фото {retained.length + index + 1}</button>
                            </li>)}
                        </ul>}
                    </div>
                    <label>Описание
                        <textarea rows={6} value={description} maxLength={8000} onChange={(event) => setDescription(event.target.value)} />
                    </label>
                    {error && <p className="market-error" role="alert">{error}</p>}
                    <div className="market-bar">
                        <Link to={back}>Отменить</Link>
                        <button className="market-button" disabled={busy}>{busy ? 'Сохранение…' : car ? 'Сохранить изменения' : 'Опубликовать объявление'}</button>
                    </div>
                </form>
            </div>
        </main>
    );
}
