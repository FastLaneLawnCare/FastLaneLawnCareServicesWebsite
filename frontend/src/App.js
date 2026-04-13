import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import InstallPWA from './components/InstallPWA';

import Landing from './pages/Landing';
import Booking from './pages/Booking';
import QuoteRequest from './pages/QuoteRequest';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import MyAccount from './pages/MyAccount';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import BookingSuccess from './pages/BookingSuccess';

function AppRouter() {
  const location = useLocation();

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-reveal]');
    if (!revealElements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -10% 0px' }
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location.pathname]);

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <div className="themed-shell page-enter">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/quote" element={<QuoteRequest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <InstallPWA />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
