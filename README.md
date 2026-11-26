# NOVO — маркетплейс техники

## Локальный запуск

Нужен Node.js 24 или новее. Из папки проекта выполните:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend/vite-project
npm.cmd run build --prefix frontend/vite-project
npm.cmd start --prefix backend
```

Сайт откроется по адресу [http://127.0.0.1:3000](http://127.0.0.1:3000). Сервер обслуживает API и собранный интерфейс. Для разработки можно дополнительно запустить `npm.cmd run dev --prefix frontend/vite-project` и открыть адрес Vite из терминала.

По умолчанию сервер создаёт базу SQLite и хранит фотографии в `backend/data`. `DATA_DIR` указывает другой каталог данных. Для существующей базы PostgreSQL задайте `DATABASE_URL` перед запуском. Пустую базу сервер инициализирует автоматически.

## Доступ администратора

Публичная регистрация создаёт аккаунты продавца и покупателя. Для создания отдельного администратора в PowerShell:

```powershell
$env:NOVO_ADMIN_EMAIL = Read-Host 'Email администратора'
$env:NOVO_ADMIN_PASSWORD = Read-Host 'Пароль администратора' -MaskInput
node backend/create-admin.js
Remove-Item Env:NOVO_ADMIN_PASSWORD
Remove-Item Env:NOVO_ADMIN_EMAIL
```

Запускайте эту команду с теми же `DATA_DIR` или `DATABASE_URL`, которые использует сервер. После входа администратору доступны объявления и заявки в отдел продаж по адресу `/admin`.

## Проверки

```powershell
npm.cmd test --prefix backend
npm.cmd run lint --prefix frontend/vite-project
npm.cmd run build --prefix frontend/vite-project
```
