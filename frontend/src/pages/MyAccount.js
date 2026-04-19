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

    if (result.success) {
      toast.success('Profile updated');
    } else {
      toast.error(result.error);
    }
  };

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              data-testid="my-account-heading"
            >
              My Account
            </h1>
            <p className="text-sm text-[#71717A]">View your quotes, bookings, invoices, and account details.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/booking')}
              className="px-4 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition"
            >
              New Booking
            </button>
            {['ceo', 'manager', 'staff'].includes((user?.role || '').toLowerCase()) && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase text-sm hover:bg-[#CCFF00] hover:text-black transition"
              >
                Staff Dashboard
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="border-2 border-black p-6 bg-white">
            <p className="text-sm font-semibold uppercase text-[#71717A]">Customer</p>
            <p className="text-2xl font-black mt-2">{user?.name}</p>
            <p className="mt-2 break-all">{user?.email}</p>
            <p className="mt-1">{user?.phone || 'No phone saved yet'}</p>
          </div>
          <div className="border-2 border-black p-6 bg-white">
            <p className="text-sm font-semibold uppercase text-[#71717A]">Submitted Quotes</p>
            <p className="text-4xl font-black mt-2">{quotes.length}</p>
          </div>
          <div className="border-2 border-black p-6 bg-white">
            <p className="text-sm font-semibold uppercase text-[#71717A]">Bookings / Invoices</p>
            <p className="text-4xl font-black mt-2">{bookings.length} / {invoices.length}</p>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 border-2 border-black bg-white p-0">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="quotes" className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase">
              Quotes
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#CCFF00] font-bold uppercase">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                description="Your scheduled services will show up here."
                actionLabel="Book Your First Service"
                onAction={() => navigate('/booking')}
              />
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <div key={booking.booking_id} className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_#0A0A0A] transition-shadow">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black uppercase" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                          Booking #{booking.booking_id}
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <StatusPill label={booking.payment_status} active={booking.payment_status === 'paid'} />
                          <StatusPill label={booking.booking_status} active={booking.booking_status === 'completed'} />
                        </div>
                      </div>
                      <p className="text-2xl font-black">${Number(booking.amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <IconRow icon={Calendar} text={booking.date} />
                      <IconRow icon={Clock} text={booking.time} />
                      <IconRow icon={MapPin} text={booking.address} />
                      <IconRow icon={CreditCard} text={(booking.payment_method || '').toUpperCase()} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            {quotes.length === 0 ? (
              <EmptyState
                title="No submitted quotes yet"
                description="Requested estimates will appear here as soon as you send them."
                actionLabel="Request a Quote"
                onAction={() => navigate('/quote')}
              />
            ) : (
              <div className="grid gap-6">
                {quotes.map((quote) => (
                  <div key={quote.quote_id} className="border-2 border-black p-6 bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black uppercase" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                          Quote #{quote.quote_id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-[#71717A] mt-2">{quote.service_type} for {quote.property_size}</p>
                      </div>
                      <StatusPill label={quote.status} active={quote.status === 'approved'} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <IconRow icon={House} text={quote.name} />
                      <IconRow icon={Phone} text={quote.phone} />
                      <IconRow icon={Receipt} text={quote.email} />
                      <IconRow icon={FileText} text={quote.response_message || 'Awaiting response from Fast Lane'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {invoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="Invoices created for your account will be listed here."
              />
            ) : (
              <div className="grid gap-6">
                {invoices.map((invoice) => (
                  <div key={invoice.invoice_id} className="border-2 border-black p-6 bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black uppercase" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                          Invoice #{invoice.invoice_id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-[#71717A] mt-2">Due {invoice.due_date}</p>
                      </div>
                      <div className="text-right">
                        <StatusPill label={invoice.status} active={invoice.status === 'paid'} />
                        <p className="text-2xl font-black mt-2">${Number(invoice.total_amount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {invoice.items.map((item, index) => (
                        <div key={`${invoice.invoice_id}-${index}`} className="flex justify-between gap-4 border-t border-black/20 pt-2">
                          <span>{item.description}</span>
                          <span>{item.quantity} x ${Number(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <form onSubmit={handleProfileSave} className="border-2 border-black p-6 bg-[#F4F4F5] max-w-2xl">
              <h2 className="text-2xl font-black uppercase mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                Edit Profile
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block font-semibold uppercase text-sm mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))}
                    className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-sm mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((current) => ({ ...current, phone: e.target.value }))}
                    className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                  />
                </div>
                <div className="border-2 border-black p-4 bg-[#F4F4F5]">
                  <h3 className="font-bold uppercase text-sm mb-4">Service Address</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">House/Building Number *</label>
                      <input
                        type="text"
                        value={profileForm.houseNumber}
                        onChange={(e) => setProfileForm((current) => ({ ...current, houseNumber: e.target.value }))}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Street Name *</label>
                      <input
                        type="text"
                        value={profileForm.streetName}
                        onChange={(e) => setProfileForm((current) => ({ ...current, streetName: e.target.value }))}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Apt/Lot # (Optional)</label>
                      <input
                        type="text"
                        value={profileForm.aptNumber}
                        onChange={(e) => setProfileForm((current) => ({ ...current, aptNumber: e.target.value }))}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">City *</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        readOnly
                        className="w-full h-12 px-4 border-2 border-black text-base bg-gray-100 focus:outline-none"
                        title="We service within 45 miles of Bloomington, IL"
                      />
                      <p className="text-xs text-[#71717A] mt-1">45 mile radius from Bloomington, IL</p>
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Zip Code *</label>
                      <input
                        type="text"
                        maxLength="5"
                        value={profileForm.zipCode}
                        onChange={(e) => setProfileForm((current) => ({ ...current, zipCode: e.target.value.replace(/\D/g, '') }))}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold uppercase text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full h-14 px-4 border-2 border-black text-lg bg-[#E4E4E7] text-[#52525B]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="mt-6 px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatusPill({ label, active }) {
  return (
    <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${active ? 'bg-[#CCFF00]' : 'bg-white'}`}>
      {label}
    </span>
  );
}

function IconRow({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={18} weight="bold" className="mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 border-2 border-dashed border-black bg-white">
      <p className="text-xl font-semibold mb-2">{title}</p>
      <p className="text-[#71717A] mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}