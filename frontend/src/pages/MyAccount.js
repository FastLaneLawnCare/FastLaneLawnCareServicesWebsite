import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, Clock, CreditCard, FileText, House, MapPin, Phone, Receipt } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, logout, updateProfile } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    houseNumber: '',
    streetName: '',
    aptNumber: '',
    city: 'Bloomington',
    zipCode: ''
  });

  /* ---------- FIX: ensure arrays ---------- */
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const fetchAccountData = useCallback(async () => {
    try {
      const [bookingsRes, quotesRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/bookings/mine`, { withCredentials: true }),
        axios.get(`${API}/quotes/mine`, { withCredentials: true }),
        axios.get(`${API}/invoices/mine`, { withCredentials: true })
      ]);

      setBookings(ensureArray(bookingsRes.data));
      setQuotes(ensureArray(quotesRes.data));
      setInvoices(ensureArray(invoicesRes.data));
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      toast.error('Failed to load your account');
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
          fetchAccountData();
          window.history.replaceState({}, '', '/my-account');
          return;
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
      }

      attempts += 1;
      setTimeout(pollStatus, 2000);
    };

    pollStatus();
  }, [fetchAccountData, searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/my-account' } });
      return;
    }

    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        houseNumber: user.house_number || '',
        streetName: user.street_name || '',
        aptNumber: user.apt_number || '',
        city: user.city || 'Bloomington',
        zipCode: user.zip_code || ''
      });
      fetchAccountData();
      checkPaymentStatus();
    }
  }, [authLoading, checkPaymentStatus, fetchAccountData, navigate, user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const result = await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      house_number: profileForm.houseNumber,
      street_name: profileForm.streetName,
      apt_number: profileForm.aptNumber,
      city: profileForm.city,
      zip_code: profileForm.zipCode
    });

    setSavingProfile(false);

    if (result.success) toast.success('Profile updated');
    else toast.error(result.error);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <h1 className="text-2xl font-black uppercase">My Account</h1>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* BOOKINGS */}
          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <EmptyState title="No bookings yet" />
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <div key={booking.booking_id}>
                    Booking #{booking.booking_id}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* QUOTES */}
          <TabsContent value="quotes">
            {quotes.map((quote) => (
              <div key={quote.quote_id}>
                Quote #{quote.quote_id}
              </div>
            ))}
          </TabsContent>

          {/* INVOICES */}
          <TabsContent value="invoices">
            {invoices.map((invoice) => (
              <div key={invoice.invoice_id}>
                {(invoice.items || []).map((item, index) => (
                  <div key={index}>{item.description}</div>
                ))}
              </div>
            ))}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile">
            <form onSubmit={handleProfileSave}>
              <input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((c) => ({ ...c, name: e.target.value }))
                }
              />
              <button type="submit" disabled={savingProfile}>
                Save
              </button>
            </form>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function StatusPill({ label, active }) {
  return (
    <span className={active ? 'bg-[#CCFF00]' : ''}>
      {label}
    </span>
  );
}

function IconRow({ icon: Icon, text }) {
  return (
    <div className="flex gap-2">
      <Icon size={18} />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      <p>{title}</p>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}