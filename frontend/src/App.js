import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { AppProvider } from "./context/AppContext";
import { Header, Footer } from "./components/Layout";
import FloatingSocialBar from "./components/FloatingSocialBar";
import VisitorTracker from "./components/VisitorTracker";
import CookieConsent from "./components/CookieConsent";

import Home from "./pages/Home";
import About from "./pages/About";
import Actions from "./pages/Actions";
import Events from "./pages/Events";
import News from "./pages/News";
import Gallery from "./pages/Gallery";
import Member from "./pages/Member";
import Donate from "./pages/Donate";
import Contact from "./pages/Contact";
import StaticPage from "./pages/StaticPage";
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import Register from "./pages/Register";

import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import PageEditor from "./admin/PageEditor";
import EventsAdmin from "./admin/EventsAdmin";
import NewsAdmin from "./admin/NewsAdmin";
import GalleryAdmin from "./admin/GalleryAdmin";
import MembersAdmin from "./admin/MembersAdmin";
import MessagesAdmin from "./admin/MessagesAdmin";
import SettingsAdmin from "./admin/SettingsAdmin";
import UsersAdmin from "./admin/UsersAdmin";
import NewslettersAdmin from "./admin/NewslettersAdmin";

const PublicShell = () => (
    <div className="min-h-screen flex flex-col">
        <VisitorTracker />
        <Header />
        <FloatingSocialBar />
        <main className="flex-1">
            <Outlet />
        </main>
        <Footer />
        <CookieConsent />
    </div>
);

function App() {
    return (
        <HelmetProvider>
            <AppProvider>
                <Toaster position="top-right" richColors />
            <div className="App">
                <BrowserRouter>
                    <Routes>
                        <Route element={<PublicShell />}>
                            <Route path="/" element={<Home />} />
                            <Route path="a-propos" element={<About />} />
                            <Route path="nos-actions" element={<Actions />} />
                            <Route path="evenements" element={<Events />} />
                            <Route path="actualites" element={<News />} />
                            <Route path="galerie" element={<Gallery />} />
                            <Route path="devenir-membre" element={<Member />} />
                            <Route path="faire-un-don" element={<Donate />} />
                            <Route path="contact" element={<Contact />} />
                            <Route path="connexion" element={<UserLogin />} />
                            <Route path="inscription" element={<Register />} />
                            <Route path="mentions-legales" element={<StaticPage slug="legal" />} />
                            <Route path="confidentialite" element={<StaticPage slug="privacy" />} />
                        </Route>

                        <Route path="/admin/login" element={<Login />} />
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="pages" element={<PageEditor />} />
                            <Route path="events" element={<EventsAdmin />} />
                            <Route path="news" element={<NewsAdmin />} />
                            <Route path="gallery" element={<GalleryAdmin />} />
                            <Route path="members" element={<MembersAdmin />} />
                            <Route path="users" element={<UsersAdmin />} />
                            <Route path="messages" element={<MessagesAdmin />} />
                            <Route path="newsletters" element={<NewslettersAdmin />} />
                            <Route path="settings" element={<SettingsAdmin />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </div>
            </AppProvider>
        </HelmetProvider>
    );
}

export default App;
