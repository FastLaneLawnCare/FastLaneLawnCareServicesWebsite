import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import InstallPWA from './components/InstallPWA';
import { Analytics } from '@vercel/analytics/react';

import Landing from './pages/Landing';
import Booking from './pages/Booking';
import QuoteRequest from './pages/QuoteRequest';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import BookingSuccess from './pages/BookingSuccess';

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/quote" element={<QuoteRequest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <InstallPWA />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" />
          <Analytics />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
