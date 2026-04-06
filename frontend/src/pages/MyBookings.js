import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, CreditCard } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyBookings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/bookings`, { withCredentials: true });
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async () => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    let attempts = 0;
    const maxAttempts = 5;

    const pollStatus = async () => {
      if (attempts >= maxAttempts) {
        toast.error('Payment verification timed out');
        return;
      }

      try {
        const { data } = await axios.get(`${API}/payments/stripe/status/${sessionId}`);
        if (data.payment_status === 'paid') {
          toast.success('Payment successful!');
          fetchBookings();
          window.history.replaceState({}, '', '/my-bookings');
          return;
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
      }

      attempts++;
      setTimeout(pollStatus, 2000);
    };

    pollStatus();
  }, [searchParams, fetchBookings]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/my-bookings' } });
      return;
    }

    if (user) {
      fetchBookings();
      checkPaymentStatus();
    }
  }, [user, authLoading, navigate, checkPaymentStatus]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#CCFF00] border-r-transparent"></div>
          <p className="mt-4 font-semibold uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            data-testid="my-bookings-heading"
          >
            My Bookings
          </h1>
          <div className="flex gap-4">
            {user?.role === 'admin' && (
              <button
                data-testid="admin-dashboard-link"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase text-sm hover:bg-[#CCFF00] hover:text-black transition"
              >
                Admin Dashboard
              </button>
            )}
            <button
              data-testid="logout-button"
              onClick={logout}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <p className="text-lg">Welcome, <span className="font-bold">{user?.name}</span></p>
            <p className="text-[#71717A]">{user?.email}</p>
          </div>
          <button
            data-testid="new-booking-btn"
            onClick={() => navigate('/booking')}
            className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
          >
            + New Booking
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-black" data-testid="no-bookings">
            <p className="text-xl font-semibold mb-4">No bookings yet</p>
            <button
              onClick={() => navigate('/booking')}
              className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
            >
              Book Your First Service
            </button>
          </div>
        ) : (
          <div className="grid gap-6" data-testid="bookings-list">
            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                data-testid={`booking-${booking.booking_id}`}
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_#0A0A0A] transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black uppercase" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                      Booking #{booking.booking_id.slice(-8).toUpperCase()}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          booking.payment_status === 'paid' ? 'bg-[#CCFF00]' : 'bg-[#E4E4E7]'
                        }`}
                      >
                        {booking.payment_status}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          booking.booking_status === 'completed' ? 'bg-[#CCFF00]' : 'bg-white'
                        }`}
                      >
                        {booking.booking_status}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-black">${booking.amount}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} weight="bold" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} weight="bold" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={20} weight="bold" />
                    <span>{booking.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} weight="bold" />
                    <span className="uppercase">{booking.payment_method}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
