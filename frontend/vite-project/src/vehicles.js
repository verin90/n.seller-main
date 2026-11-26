export const fieldLabels = {
    category: 'Категория',
    brand: 'Марка',
    model: 'Модель',
    country: 'Страна',
    year: 'Год выпуска',
    mileage: 'Пробег, км',
    price: 'Цена, €',
    weight: 'Вес, кг',
};

export function listingValues(car = {}) {
    return {
        category: car.body_type ?? '',
        brand: car.proizvoditel ?? '',
        model: car.name_car ?? '',
        country: car.seller_country ?? '',
        year: car.years_car ?? '',
        mileage: car.distance_traveled ?? '',
        price: car.price ?? '',
        weight: car.size_car ?? '',
    };
}

export function priceText(value) {
    if (value == null || value === '') return 'Цена по запросу';
    const number = Number(value);
    return Number.isFinite(number)
        ? new Intl.NumberFormat('ru', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(number)
        : value;
}

export const filterLabels = {
    brand: 'Марка', country: 'Страна', category: 'Категория', model: 'Модель',
    year: 'Год, от', minPrice: 'Цена от, €', maxPrice: 'Цена до, €',
    mileage: 'Пробег до, км', weight: 'Вес до, кг',
};

export function matchesVehicle(car, params) {
    const values = listingValues(car);
    const text = ['brand', 'country', 'category', 'model'].every((field) => {
        return String(values[field]).toLowerCase().includes((params.get(field) || '').toLowerCase().trim());
    });
    const within = (field, key, compare) => {
        const limit = params.get(key);
        if (!limit || !Number.isFinite(Number(limit))) return true;
        const value = Number(String(values[field]).replace(/[^\d.,-]/g, '').replace(',', '.'));
        return values[field] !== '' && compare(value, Number(limit));
    };
    return text && within('year', 'year', (a, b) => a >= b)
        && within('price', 'minPrice', (a, b) => a >= b)
        && within('price', 'maxPrice', (a, b) => a <= b)
        && within('mileage', 'mileage', (a, b) => a <= b)
        && within('weight', 'weight', (a, b) => a <= b);
}
