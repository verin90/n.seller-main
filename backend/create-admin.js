import bcrypt from 'bcryptjs';
import { openDatabase } from './database.js';

const email = process.env.NOVO_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.NOVO_ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password ||
    password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Укажите NOVO_ADMIN_EMAIL и NOVO_ADMIN_PASSWORD (от 8 символов, до 72 байт).');
}
const query = await openDatabase();
const [existing] = await query('SELECT id FROM registration_seller WHERE lower(email) = $1', [email]);
if (existing) throw new Error('Аккаунт с таким email уже существует. Выберите отдельный адрес администратора.');
await query(
    'INSERT INTO registration_seller (email,password,role) VALUES ($1,$2,$3)',
    [email, await bcrypt.hash(password, 10), 'admin'],
);
console.log('Аккаунт администратора создан.');
