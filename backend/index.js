import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataDir, openDatabase } from './database.js';

const query = await openDatabase();
const uploads = join(dataDir, 'uploads');
mkdirSync(uploads, { recursive: true });
const secretPath = join(dataDir, 'session-key');
if (!process.env.JWT_SECRET && !existsSync(secretPath)) {
    try {
        writeFileSync(secretPath, randomBytes(48).toString('hex'), { flag: 'wx', mode: 0o600 });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}
const secret = process.env.JWT_SECRET || readFileSync(secretPath, 'utf8');
const app = express();
const port = Number(process.env.PORT ?? 3000);
const profileFields = [
    'name_company', 'country', 'city', 'adress', 'pocht_index', 'work_number',
    'web_site', 'initials', 'number', 'business_hours', 'company_description',
];
const profileColumns = ['id', 'email', 'role', ...profileFields].join(', ');
const clean = (value) => typeof value === 'string' ? value.trim() : '';
const emailOk = (value) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const passwordOk = (value) => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72;
const api = express.Router();

app.disable('x-powered-by');
app.use('/uploads', express.static(uploads, { setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use('/uploads', express.static(fileURLToPath(new URL('./uploads/', import.meta.url))));
app.use('/api', express.json({ limit: '25mb' }), api);

async function authenticate(req, res, next) {
    const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    let id;
    try {
        id = jwt.verify(token || '', secret, { algorithms: ['HS256'] }).id;
    } catch {
        return res.status(401).json({ error: 'Войдите в аккаунт' });
    }
    const [user] = await query(`SELECT ${profileColumns} FROM registration_seller WHERE id = $1`, [id]);
    if (!user) return res.status(401).json({ error: 'Аккаунт не найден' });
    req.user = user;
    next();
}

function sellerOnly(req, res, next) {
    if (['admin', 'seller'].includes(req.user.role)) return next();
    res.status(403).json({ error: 'Действие доступно продавцам и администраторам' });
}

function adminOnly(req, res, next) {
    if (req.user.role === 'admin') return next();
    res.status(403).json({ error: 'Требуются права администратора' });
}

function session(user) {
    return { user, token: jwt.sign({ id: user.id }, secret, { expiresIn: '24h' }) };
}

api.post('/registration_seller', async (req, res) => {
    const body = req.body ?? {};
    const email = clean(body.email).toLowerCase();
    if (!emailOk(email) || !passwordOk(body.password)) {
        return res.status(400).json({ error: 'Укажите корректный email и пароль от 8 символов (до 72 байт)' });
    }
    const role = body.role === 'buyer' ? 'buyer' : 'seller';
    const fields = profileFields.slice(0, 9);
    const values = fields.map((field) => clean(body[field] ?? (field === 'pocht_index' ? body.poch_index : undefined)).slice(0, 500));
    const [user] = await query(
        `INSERT INTO registration_seller (email, password, role, ${fields.join(', ')})
         VALUES ($1, $2, $3, ${fields.map((_, index) => '$' + (index + 4)).join(', ')})
         RETURNING id, email, role`,
        [email, await bcrypt.hash(body.password, 10), role, ...values],
    );
    res.status(201).json(session(user));
});

api.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    const [user] = await query('SELECT id, email, role, password FROM registration_seller WHERE lower(email) = $1', [clean(email).toLowerCase()]);
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    res.json(session({ id: user.id, email: user.email, role: user.role }));
});

api.get('/me', authenticate, (req, res) => res.json(req.user));

api.put('/update_profile', authenticate, async (req, res) => {
    const { newEmail, newPassword, currentPassword, ...contacts } = req.body ?? {};
    const updates = profileFields.filter((field) => Object.hasOwn(contacts, field));
    const values = updates.map((field) => clean(contacts[field]).slice(0, field === 'company_description' ? 6000 : 500));
    if (newEmail || newPassword) {
        const [account] = await query('SELECT password FROM registration_seller WHERE id = $1', [req.user.id]);
        if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, account.password))) {
            return res.status(400).json({ error: 'Введите действующий пароль' });
        }
    }
    if (newEmail) {
        const email = clean(newEmail).toLowerCase();
        if (!emailOk(email)) return res.status(400).json({ error: 'Укажите корректный email' });
        updates.push('email');
        values.push(email);
    }
    if (newPassword) {
        if (!passwordOk(newPassword)) return res.status(400).json({ error: 'Пароль должен содержать от 8 символов (до 72 байт)' });
        updates.push('password');
        values.push(await bcrypt.hash(newPassword, 10));
    }
    if (!updates.length) return res.status(400).json({ error: 'Укажите данные для обновления' });
    const [user] = await query(
        `UPDATE registration_seller SET ${updates.map((field, index) => field + ' = $' + (index + 1)).join(', ')}
         WHERE id = $${values.length + 1} RETURNING ${profileColumns}`,
        [...values, req.user.id],
    );
    res.json({ user });
});

api.get('/tariffs', async (_req, res) => res.json(await query('SELECT * FROM tariffs ORDER BY id')));
api.get('/sales-requests', authenticate, adminOnly, async (_req, res) => {
    res.json(await query('SELECT * FROM sales_requests ORDER BY id DESC'));
});
api.post('/sales-requests', async (req, res) => {
    const { name, email, phone } = req.body ?? {};
    if (!clean(name) || !emailOk(clean(email)) || clean(phone).replace(/\D/g, '').length < 7) {
        return res.status(400).json({ error: 'Укажите имя, электронную почту и телефон' });
    }
    await query('INSERT INTO sales_requests (name,email,phone) VALUES ($1,$2,$3)', [clean(name).slice(0, 150), clean(email), clean(phone).slice(0, 40)]);
    res.status(201).json({ message: 'Заявка сохранена' });
});

function gallery(car) {
    const photos = car.photos ? JSON.parse(car.photos) : [car.img_car];
    return photos.filter(Boolean).map((photo) => {
        if (photo.startsWith('/') || /^https?:\/\//i.test(photo)) return photo;
        return '/' + photo.replace(/^\.\//, '');
    });
}

function listing(car) {
    const photos = gallery(car);
    return { ...car, name_car: car.name_car || car.name, img_car: photos[0] ?? null, photos };
}

async function listCars(res, filters = [], values = []) {
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
    res.json((await query(`SELECT * FROM car ${where} ORDER BY id DESC`, values)).map(listing));
}

api.get('/car', (req, res) => {
    const brands = clean(req.query.proizvoditel).split(',').map((brand) => brand.trim().toLowerCase()).filter(Boolean).slice(0, 50);
    const filters = brands.length ? [`LOWER(proizvoditel) IN (${brands.map((_, index) => '$' + (index + 1)).join(',')})`] : [];
    return listCars(res, filters, brands);
});
api.get('/my-cars', authenticate, sellerOnly, (req, res) => listCars(res, ['seller_id = $1'], [req.user.id]));

async function getCar(id) {
    if (!/^\d{1,9}$/.test(id)) return undefined;
    const [car] = await query('SELECT * FROM car WHERE id = $1', [Number(id)]);
    return car;
}

api.get('/car/:id', async (req, res) => {
    const car = await getCar(req.params.id);
    if (!car) return res.status(404).json({ error: 'Объявление не найдено' });
    res.json(listing(car));
});

function hydratePhotos(input) {
    if (!Array.isArray(input) || input.length > 6) throw Object.assign(new Error('Можно добавить до 6 фотографий'), { status: 400 });
    return input.map((photo) => {
        const match = typeof photo === 'string' && photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
        if (!match) throw Object.assign(new Error('Выберите фото в формате JPG, PNG или WebP'), { status: 400 });
        const bytes = Buffer.from(match[2], 'base64');
        const signature = match[1] === 'jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff'
            : match[1] === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
                : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!signature || bytes.length > 3 * 1024 * 1024) {
            throw Object.assign(new Error('Проверьте формат и размер фото (до 3 МБ)'), { status: 400 });
        }
        return { filename: `${randomUUID()}.${match[1]}`, bytes };
    });
}

function removePhotos(paths) {
    for (const path of paths) {
        const filename = path?.match(/^\/uploads\/([a-f0-9-]{36}\.(?:jpeg|png|webp))$/)?.[1];
        if (!filename) continue;
        try {
            rmSync(join(uploads, filename), { force: true });
        } catch (error) {
            console.error('Ошибка очистки загруженного фото', error.message);
        }
    }
}

async function saveCar(req, res, car) {
    const { category, brand, model, country, year, mileage, price, weight, description, photos = [], keepPhotos = [] } = req.body ?? {};
    const texts = [category, brand, model, country].map((value) => clean(value).slice(0, 180));
    const optionalNumbers = [year, mileage, weight];
    const validPrice = /^(?:\d{1,9})(?:\.\d{1,2})?$/.test(String(price));
    const validNumbers = optionalNumbers.every((value) => value === '' || value == null || /^\d{1,9}$/.test(String(value)));
    if (texts.some((value) => !value) || !validPrice || !validNumbers || (year && (+year < 1886 || +year > new Date().getFullYear() + 1))) {
        return res.status(400).json({ error: 'Проверьте категорию, марку, модель, страну, цену и характеристики' });
    }
    const oldPhotos = car ? gallery(car) : [];
    const retained = oldPhotos.filter((photo) => Array.isArray(keepPhotos) && keepPhotos.includes(photo));
    const images = hydratePhotos(photos);
    if (retained.length + images.length > 6) return res.status(400).json({ error: 'Можно добавить до 6 фотографий' });
    const newPaths = images.map(({ filename }) => '/uploads/' + filename);
    const imagePaths = [...retained, ...newPaths];
    const [bodyType, manufacturer, name, sellerCountry] = texts;
    const [modelYear, km, kg] = optionalNumbers.map((value) => value === '' || value == null ? null : Number(value));
    const fields = ['body_type', 'proizvoditel', 'name_car', 'seller_country', 'years_car', 'distance_traveled', 'size_car', 'price', 'description', 'img_car', 'photos'];
    const values = [bodyType, manufacturer, name, sellerCountry, modelYear, km, kg, Number(price), clean(description).slice(0, 8000), imagePaths[0] ?? null, JSON.stringify(imagePaths)];
    const slots = fields.map((_, index) => '$' + (index + 1));
    let saved;
    try {
        for (const image of images) writeFileSync(join(uploads, image.filename), image.bytes, { flag: 'wx' });
        if (car) {
            [saved] = await query(
                `UPDATE car SET ${fields.map((field, index) => field + ' = ' + slots[index]).join(', ')}
                 WHERE id = $12 AND COALESCE(photos, '') = COALESCE($13, '') RETURNING *`,
                [...values, car.id, car.photos ?? null],
            );
        } else {
            [saved] = await query(
                `INSERT INTO car (${fields.join(', ')}, seller_id, seller_name) VALUES (${slots.join(', ')}, $12, $13) RETURNING *`,
                [...values, req.user.id, req.user.name_company || req.user.initials || 'Продавец'],
            );
        }
    } catch (error) {
        removePhotos(newPaths);
        throw error;
    }
    if (!saved) {
        removePhotos(newPaths);
        return res.status(409).json({ error: 'Объявление уже изменилось. Обновите страницу' });
    }
    removePhotos(oldPhotos.filter((photo) => !retained.includes(photo)));
    res.status(car ? 200 : 201).json(listing(saved));
}

async function canManageCar(req, res, next) {
    const car = await getCar(req.params.id);
    if (!car) return res.status(404).json({ error: 'Объявление не найдено' });
    if (req.user.role !== 'admin' && String(car.seller_id) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Можно управлять только своими объявлениями' });
    }
    req.car = car;
    next();
}

api.post('/car', authenticate, sellerOnly, (req, res) => saveCar(req, res));
api.put('/car/:id', authenticate, sellerOnly, canManageCar, (req, res) => saveCar(req, res, req.car));
api.delete('/car/:id', authenticate, sellerOnly, canManageCar, async (req, res) => {
    const [deleted] = await query('DELETE FROM car WHERE id = $1 RETURNING *', [req.car.id]);
    if (!deleted) return res.status(404).json({ error: 'Объявление уже удалено' });
    removePhotos(gallery(deleted));
    res.json({ message: 'Объявление удалено' });
});

api.get('/messages', authenticate, async (req, res) => res.json(await query(
    `SELECT m.*, c.name_car AS listing_name,
        COALESCE(NULLIF(sender.name_company, ''), NULLIF(sender.initials, ''), sender.email) AS sender_name,
        COALESCE(NULLIF(recipient.name_company, ''), NULLIF(recipient.initials, ''), recipient.email) AS recipient_name
     FROM messages m JOIN car c ON c.id = m.car_id
     JOIN registration_seller sender ON sender.id = m.sender_id
     JOIN registration_seller recipient ON recipient.id = m.recipient_id
     WHERE m.sender_id = $1 OR m.recipient_id = $1 ORDER BY m.id`, [req.user.id],
)));

api.post('/messages', authenticate, async (req, res) => {
    const { carId, replyTo, body } = req.body ?? {};
    const content = clean(body);
    if (!content || content.length > 3000) return res.status(400).json({ error: 'Введите сообщение длиной до 3000 символов' });
    let targetCar = carId;
    let recipient;
    if (replyTo) {
        const [message] = await query('SELECT * FROM messages WHERE id = $1 AND (recipient_id = $2 OR sender_id = $2)', [replyTo, req.user.id]);
        if (!message) return res.status(404).json({ error: 'Переписка не найдена' });
        targetCar = message.car_id;
        recipient = message.sender_id === req.user.id ? message.recipient_id : message.sender_id;
    } else {
        const car = await getCar(targetCar);
        recipient = car?.seller_id;
    }
    if (!recipient || String(recipient) === String(req.user.id)) return res.status(400).json({ error: 'Продавец недоступен для переписки' });
    const [message] = await query(
        'INSERT INTO messages (car_id,sender_id,recipient_id,body) VALUES ($1,$2,$3,$4) RETURNING *',
        [targetCar, req.user.id, recipient, content],
    );
    res.status(201).json(message);
});

api.use((_req, res) => res.status(404).json({ error: 'Маршрут API не найден' }));
app.use((error, _req, res, _next) => {
    if (error.code === '23505' || (error.code === 'ERR_SQLITE_ERROR' && error.errcode === 2067)) {
        return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    if (error.status === 413) return res.status(413).json({ error: 'Размер запроса слишком большой' });
    if (error.status === 400) return res.status(400).json({ error: error.type === 'entity.parse.failed' ? 'Некорректный запрос' : error.message });
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const dist = fileURLToPath(new URL('../frontend/vite-project/dist/', import.meta.url));
if (existsSync(join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}', (req, res, next) => {
        if (req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) return next();
        res.sendFile(join(dist, 'index.html'));
    });
}
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, (error) => {
    if (error) throw error;
    console.log(`NOVO: http://${host}:${server.address().port}`);
});
