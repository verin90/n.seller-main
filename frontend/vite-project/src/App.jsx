import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import MainSaler from './page/mainSaler';
import Footer from './components/shared/Footer/footer';
import SellerHeader from './components/shared/Header_White/Header';
import BuyerHeader from './components/shared/header_users/Header';
import RequireRole from './components/shared/RequireRole';
import RegistrationSalesman from './components/page_seller/registrationSalesman/registrationSalesman';
import MyAds from './components/page_seller/myAds/myAds';
import AddCarForm from './components/page_seller/myAds/AddCarForm';
import Layout from './components/page_seller/myAds/Layout';
import SubscriptionPage from './components/page_seller/myAds/menuAdmin/SubscriptionPage/subscriptionPage';
import LoginSalesman from './components/page_seller/loginSalesman/LoginSalesman';
import Settings from './components/page_seller/myAds/menuAdmin/SettingsPage/settings';
import Messages from './components/shared/Messages/messages';
import Redact from './components/page_seller/myAds/redact/redact';
import MainUsers from './components/page_users/mainPage/mainUsers';
import Vehicles from './components/page_users/vehicles/vehicles';
import Admin from './components/page_admin/admin';
import './App.css';

function SiteLayout({ header }) {
    return <>{header}<Outlet /><Footer /></>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<SiteLayout />}>
                    <Route index element={<MainSaler />} />
                </Route>
                <Route element={<SiteLayout header={<BuyerHeader />} />}>
                    <Route path="mainUsers" element={<MainUsers />} />
                    <Route path="vehicles" element={<Vehicles />} />
                    <Route path="vehicles/:id" element={<Redact />} />
                    <Route path="messages" element={<RequireRole><Messages /></RequireRole>} />
                </Route>
                <Route element={<SiteLayout header={<SellerHeader />} />}>
                    <Route path="registrationSalesman" element={<RegistrationSalesman />} />
                    <Route path="registrationUsers" element={<Navigate to="/registrationSalesman?role=buyer" replace />} />
                    <Route path="login-sales" element={<LoginSalesman />} />
                    <Route path="admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
                    <Route path="*" element={<main className="page-status"><h1>Страница не найдена</h1><Link to="/mainUsers">Вернуться на главную</Link></main>} />
                </Route>
                <Route path="my-ads" element={<RequireRole roles={['seller', 'admin']}><Layout /></RequireRole>}>
                    <Route index element={<MyAds />} />
                    <Route path="new" element={<AddCarForm />} />
                    <Route path=":id" element={<Redact key="seller-details" manage />} />
                    <Route path=":id/edit" element={<Redact key="seller-edit" manage edit />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="subscription" element={<SubscriptionPage />} />
                    <Route path="profile" element={<Settings />} />
                </Route>

                <Route path="redact" element={<Navigate to="/my-ads" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
