import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const serverFile = fileURLToPath(new URL('../index.js', import.meta.url));

async function startServer(directory) {
    const child = spawn(process.execPath, [serverFile], {
        env: {
            ...process.env, PORT: '0', HOST: '127.0.0.1', DATA_DIR: directory,
            DATABASE_URL: '', JWT_SECRET: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
    });
    let logs = '';
    child.stderr.on('data', (chunk) => { logs += chunk; });
    const output = createInterface({ input: child.stdout });
    let origin;
    try {
        for await (const line of output) {
            if (line.startsWith('NOVO: ')) {
                origin = line.slice(6);
                break;
            }
        }
        assert.ok(origin, logs || 'Сервер завершился до запуска');
    } catch (error) {
        child.kill();
        throw error;
    }
    return {
        origin,
        async close() {
            if (child.exitCode !== null || child.signalCode !== null) return;
            const exited = once(child, 'exit');
            child.kill();
            await exited;
        },
    };
}

test('Продавец управляет только своими объявлениями, данные сохраняются после перезапуска', { timeout: 15000 }, async () => {
    const temporaryRoot = resolve(tmpdir());
    const directory = await mkdtemp(join(temporaryRoot, 'novo-test-'));
    assert.equal(dirname(resolve(directory)), temporaryRoot);
    let server;
    const password = 'Test-only-password';
    const credentials = { email: 'seller@example.test', password };

    async function request(path, { method = 'GET', token, body, status = 200 } = {}) {
        const response = await fetch(server.origin + '/api' + path, {
            method,
            headers: {
                ...(token && { Authorization: 'Bearer ' + token }),
                ...(body && { 'Content-Type': 'application/json' }),
            },
            body: body && JSON.stringify(body),
        });
        const data = await response.json();
        assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
        return data;
    }
    const register = (body) => request('/registration_seller', { method: 'POST', body, status: 201 });

    try {
        server = await startServer(directory);
        const seller = await register({ ...credentials, role: 'admin' });
        assert.equal(seller.user.role, 'seller');
        const other = await register({ email: 'other@example.test', password });
        const buyer = await register({ email: 'buyer@example.test', password, role: 'buyer' });
        const photo = await readFile(new URL('../../frontend/vite-project/public/car01.png', import.meta.url));
        const values = {
            category: 'Грузовики', brand: 'Volvo', model: 'FH 500', country: 'Россия',
            year: 2019, price: '34500.50', photos: ['data:image/png;base64,' + photo.toString('base64')],
        };
        await request('/car', { method: 'POST', body: values, token: buyer.token, status: 403 });
        const car = await request('/car', { method: 'POST', body: values, token: seller.token, status: 201 });
        const path = '/car/' + car.id;
        assert.equal((await request('/my-cars', { token: other.token })).length, 0);
        await request(path, { method: 'DELETE', token: other.token, status: 403 });
        const saved = await request(path, { method: 'PUT', token: seller.token, body: {
            ...values, model: 'FH 540', photos: [], keepPhotos: car.photos,
        } });
        assert.equal(saved.img_car, car.img_car);
        const message = await request('/messages', { method: 'POST', token: buyer.token, status: 201, body: {
            carId: car.id, body: 'Есть в наличии?',
        } });
        await request('/messages', { method: 'POST', token: other.token, status: 404, body: {
            replyTo: message.id, body: 'Чужой ответ',
        } });
        assert.equal((await request('/messages', { token: seller.token }))[0].id, message.id);
        await server.close();
        server = await startServer(directory);
        assert.equal((await request('/me', { token: seller.token })).email, credentials.email);
        assert.equal((await request(path)).name_car, 'FH 540');
        const uploaded = await fetch(server.origin + car.img_car);
        assert.equal(uploaded.status, 200);
        assert.deepEqual(Buffer.from(await uploaded.arrayBuffer()), photo);
        await request(path, { method: 'DELETE', token: seller.token });
        await request(path, { status: 404 });
        assert.equal((await fetch(server.origin + car.img_car)).status, 404);
    } finally {
        await server?.close();
        await rm(directory, { recursive: true, force: true, maxRetries: 3 });
    }
});
