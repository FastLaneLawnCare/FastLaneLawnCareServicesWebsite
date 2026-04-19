import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, Calendar, Users, ChartBar, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useContext(AuthContext);
  const role = (user?.role || '').toLowerCase();
  const isCEO = role === 'ceo';
  const isManager = role === 'manager';
  const isStaff = role === 'staff';
  const canViewAdminData = isCEO || isManager;
  const [analytics, setAnalytics] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [myStaffMetrics, setMyStaffMetrics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hourlyRateDrafts, setHourlyRateDrafts] = useState({});
  const [roleDrafts, setRoleDrafts] = useState({});

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    due_date: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || !['ceo', 'manager', 'staff'].includes((user.role || '').toLowerCase()))) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      if (isStaff) {
        const { data } = await axios.get(`${API}/staff/me`, { withCredentials: true });
        setMyStaffMetrics(data);
        return;
      }

      const [analyticsRes, quotesRes, bookingsRes, staffRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/analytics`, { withCredentials: true }),
        axios.get(`${API}/quotes`, { withCredentials: true }),
        axios.get(`${API}/bookings`, { withCredentials: true }),
        axios.get(`${API}/staff`, { withCredentials: true }),
        axios.get(`${API}/invoices`, { withCredentials: true })
      ]);

      setAnalytics(analyticsRes.data);
      setQuotes(quotesRes.data);
      setBookings(bookingsRes.data);
      setStaff(staffRes.data);
      setInvoices(invoicesRes.data);
      setHourlyRateDrafts(
        staffRes.data.reduce((acc, member) => ({ ...acc, [member.user_id]: member.hourly_rate || 0 }), {})
      );
      setRoleDrafts(
        staffRes.data.reduce((acc, member) => ({ ...acc, [member.user_id]: (member.role || 'staff').toLowerCase() }), {})
      );
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteUpdate = async (quoteId, status, message) => {
    if (!isCEO) return;
    try {
      await axios.patch(
        `${API}/quotes/${quoteId}`,
        { status, response_message: message },
        { withCredentials: true }
      );
      toast.success('Quote updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update quote');
    }
  };

  const handleQuoteDelete = async (quoteId) => {
    if (!isCEO) return;
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await axios.delete(`${API}/quotes/${quoteId}`, { withCredentials: true });
      toast.success('Quote deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };

  const handleBookingDelete = async (bookingId) => {
    if (!isCEO) return;
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await axios.delete(`${API}/bookings/${bookingId}`, { withCredentials: true });
      toast.success('Booking deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const handleInvoiceDelete = async (invoiceId) => {
    if (!isCEO) return;
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await axios.delete(`${API}/invoices/${invoiceId}`, { withCredentials: true });
      toast.success('Invoice deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleCreateInvoice = async (e) => {
    if (!isCEO) return;
    e.preventDefault();
    const total = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    try {
      await axios.post(
        `${API}/invoices`,
        {
          ...invoiceForm,
          total_amount: total
        },
        { withCredentials: true }
      );
      toast.success('Invoice created');
      setShowInvoiceForm(false);
      setInvoiceForm({
        customer_name: '',
        customer_email: '',
        items: [{ description: '', quantity: 1, price: 0 }],
        due_date: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const addInvoiceItem = () => {
    if (!isCEO) return;
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    if (!isCEO) return;
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index)
    });
  };

  const handleHourlyRateUpdate = async (member) => {
    const value = parseFloat(hourlyRateDrafts[member.user_id]);
    if (Number.isNaN(value) || value < 0) {
      toast.error('Please enter a valid hourly rate');
      return;
    }
    try {
      await axios.patch(
        `${API}/staff/${member.user_id}/hourly-rate`,
        { hourly_rate: value },
        { withCredentials: true }
      );
      toast.success('Hourly rate updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update hourly rate');
    }
  };

  const handleRoleUpdate = async (member) => {
    const selectedRole = roleDrafts[member.user_id];
    if (!selectedRole) return;
    try {
      await axios.patch(
        `${API}/staff/${member.user_id}/role`,
        { role: selectedRole },
        { withCredentials: true }
      );
      toast.success('Role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update role');
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

  if (isStaff && myStaffMetrics) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b-2 border-black bg-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                Staff Dashboard
              </h1>
              <p className="text-sm text-[#71717A]">Your performance and earnings summary.</p>
            </div>
            <button
              onClick={() => navigate('/my-account')}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              My Account
            </button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="border-2 border-black p-6 bg-white">
            <h2 className="text-2xl font-black uppercase mb-4">{myStaffMetrics.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xl font-black">${Number(myStaffMetrics.hourly_rate || 0).toFixed(2)}</p>
                <p className="text-xs font-semibold uppercase text-[#71717A]">Earnings/Hour</p>
              </div>
              <div>
                <p className="text-xl font-black">{myStaffMetrics.completed_jobs || 0}</p>
                <p className="text-xs font-semibold uppercase text-[#71717A]">Completed Jobs</p>
              </div>
              <div>
                <p className="text-xl font-black">{myStaffMetrics.total_hours || 0}h</p>
                <p className="text-xs font-semibold uppercase text-[#71717A]">Total Hours</p>
              </div>
              <div>
                <p className="text-xl font-black">{myStaffMetrics.jobs_per_hour || 0}</p>
                <p className="text-xs font-semibold uppercase text-[#71717A]">Jobs/Hour</p>
              </div>
              <div>
                <p className="text-xl font-black">{myStaffMetrics.avg_performance_score || 0}</p>
                <p className="text-xs font-semibold uppercase text-[#71717A]">Avg Performance</p>
              </div>
            </div>
          </div>
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
              data-testid="admin-dashboard-heading"
            >
              {isCEO ? 'CEO Dashboard' : 'Manager Dashboard'}
            </h1>
            <p className="text-sm text-[#71717A]">
              {isCEO ? 'Full control access, including role assignment and edits.' : 'Read-only admin data with staff pay management.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              data-testid="back-to-bookings"
              onClick={() => navigate('/my-account')}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              My Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition"
            >
              Home Page
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {canViewAdminData && (
        <>
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="analytics-section">
          {[
            { label: 'Total Bookings', value: analytics?.total_bookings || 0, icon: Calendar },
            { label: 'Total Clients', value: analytics?.total_customers || 0, icon: Users },
            { label: 'Total Earnings', value: `$${analytics?.total_earnings || 0}`, icon: ChartBar },
            { label: 'Pending Quotes', value: analytics?.pending_quotes || 0, icon: FileText }
          ].map((stat, idx) => (
            <div
              key={idx}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
              className="border-2 border-black p-6 bg-white"
            >
              <stat.icon size={32} weight="bold" className="mb-3" />
              <p className="text-sm font-semibold uppercase text-[#71717A]">{stat.label}</p>
              <p className="text-3xl font-black mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-4 border-2 border-black bg-white p-0">
            <TabsTrigger
              value="invoices"
              data-testid="tab-invoices"
              className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase"
            >
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="quotes"
              data-testid="tab-quotes"
              className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase"
            >
              Quotes
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              data-testid="tab-bookings"
              className="data-[state=active]:bg-[#CCFF00] border-r-2 border-black font-bold uppercase"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              data-testid="tab-staff"
              className="data-[state=active]:bg-[#CCFF00] font-bold uppercase"
            >
              Staff
            </TabsTrigger>
          </TabsList>

          {/* Invoice Creator */}
          <TabsContent value="invoices" className="mt-6" data-testid="invoices-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                Invoice Creator
              </h2>
              <button
                data-testid="new-invoice-btn"
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                disabled={!isCEO}
                className="px-6 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
              >
                + New Invoice
              </button>
            </div>

            {showInvoiceForm && isCEO && (
              <form onSubmit={handleCreateInvoice} className="border-2 border-black p-6 mb-6 bg-[#F4F4F5]" data-testid="invoice-form">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-semibold uppercase text-sm mb-2">Customer Name</label>
                    <input
                      data-testid="invoice-customer-name"
                      required
                      value={invoiceForm.customer_name}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-sm mb-2">Customer Email</label>
                    <input
                      data-testid="invoice-customer-email"
                      type="email"
                      required
                      value={invoiceForm.customer_email}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-black"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block font-semibold uppercase text-sm mb-2">Items</label>
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                      <input
                        data-testid={`invoice-item-desc-${idx}`}
                        placeholder="Description"
                        required
                        value={item.description}
                        onChange={(e) => {
                          const items = [...invoiceForm.items];
                          items[idx].description = e.target.value;
                          setInvoiceForm({ ...invoiceForm, items });
                        }}
                        className="col-span-6 h-12 px-4 border-2 border-black"
                      />
                      <input
                        data-testid={`invoice-item-qty-${idx}`}
                        type="number"
                        placeholder="Qty"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const items = [...invoiceForm.items];
                          items[idx].quantity = parseInt(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items });
                        }}
                        className="col-span-2 h-12 px-4 border-2 border-black"
                      />
                      <input
                        data-testid={`invoice-item-price-${idx}`}
                        type="number"
                        placeholder="Price"
                        required
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const items = [...invoiceForm.items];
                          items[idx].price = parseFloat(e.target.value);
                          setInvoiceForm({ ...invoiceForm, items });
                        }}
                        className="col-span-3 h-12 px-4 border-2 border-black"
                      />
                      {invoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(idx)}
                          className="col-span-1 h-12 border-2 border-black bg-white hover:bg-red-100 transition flex items-center justify-center"
                        >
                          <X size={20} weight="bold" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="mt-2 px-4 py-2 bg-white border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block font-semibold uppercase text-sm mb-2">Due Date</label>
                  <input
                    data-testid="invoice-due-date"
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full h-12 px-4 border-2 border-black"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    data-testid="create-invoice-btn"
                    type="submit"
                    className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
                  >
                    Create Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="px-6 py-3 bg-white text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Invoices List - Mobile Responsive */}
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="border-2 border-black p-4 bg-white" data-testid={`invoice-${invoice.invoice_id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold">#{invoice.invoice_id.slice(-8).toUpperCase()}</p>
                      <p className="font-semibold mt-1">{invoice.customer_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                      invoice.status === 'paid' ? 'bg-[#CCFF00]' : 'bg-white'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <p><span className="text-[#71717A]">Amount:</span> <span className="font-bold">${invoice.total_amount}</span></p>
                    <p><span className="text-[#71717A]">Due:</span> {invoice.due_date}</p>
                  </div>
                  <button
                    onClick={() => handleInvoiceDelete(invoice.invoice_id)}
                    disabled={!isCEO}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white border-2 border-black font-bold uppercase text-sm hover:bg-red-700 transition"
                    data-testid={`delete-invoice-${invoice.invoice_id}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Quote Requests */}
          <TabsContent value="quotes" className="mt-6" data-testid="quotes-content">
            <h2 className="text-2xl font-black uppercase mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Quote Requests
            </h2>
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.quote_id} className="border-2 border-black p-6 bg-white" data-testid={`quote-${quote.quote_id}`}>
                  <div className="flex gap-6">
                    {/* Photo Thumbnail */}
                    {quote.photo_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${quote.photo_url}`}
                          alt="Property"
                          className="w-32 h-32 object-cover border-2 border-black"
                          data-testid={`quote-photo-${quote.quote_id}`}
                        />
                      </div>
                    )}
                    
                    {/* Quote Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black uppercase text-lg">{quote.name}</h3>
                          <p className="text-sm text-[#71717A]">{quote.email} • {quote.phone}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          quote.status === 'pending' ? 'bg-[#CCFF00]' : 
                          quote.status === 'approved' ? 'bg-green-200' : 'bg-red-100'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <p><span className="font-semibold">Service:</span> {quote.service_type}</p>
                        <p><span className="font-semibold">Property Size:</span> {quote.property_size}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {isCEO && quote.status === 'pending' && (
                          <>
                            <button
                              data-testid={`approve-quote-${quote.quote_id}`}
                              onClick={() => handleQuoteUpdate(quote.quote_id, 'approved', 'Quote approved')}
                              className="px-4 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition"
                            >
                              Approve
                            </button>
                            <button
                              data-testid={`decline-quote-${quote.quote_id}`}
                              onClick={() => handleQuoteUpdate(quote.quote_id, 'declined', 'Quote declined')}
                              className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-red-100 transition"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {isCEO && quote.status === 'declined' && (
                          <button
                            data-testid={`delete-quote-${quote.quote_id}`}
                            onClick={() => handleQuoteDelete(quote.quote_id)}
                            className="px-4 py-2 bg-red-600 text-white border-2 border-black font-bold uppercase text-sm hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      {!isCEO && (
                        <p className="text-xs font-semibold uppercase text-[#71717A]">Managers have read-only access to quotes</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Bookings - Mobile Responsive */}
          <TabsContent value="bookings" className="mt-6" data-testid="bookings-content">
            <h2 className="text-2xl font-black uppercase mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              All Bookings
            </h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.booking_id} className="border-2 border-black p-4 bg-white" data-testid={`booking-${booking.booking_id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold">#{booking.booking_id}</p>
                      <p className="font-semibold mt-1">{booking.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                        booking.booking_status === 'completed' ? 'bg-[#CCFF00]' : 'bg-white'
                      }`}>
                        {booking.booking_status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black ${
                        booking.payment_status === 'paid' ? 'bg-[#CCFF00]' : 'bg-white'
                      }`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                    <p><span className="text-[#71717A]">Date:</span> {booking.date}</p>
                    <p><span className="text-[#71717A]">Time:</span> {booking.time}</p>
                    <p><span className="text-[#71717A]">Address:</span> {booking.address}</p>
                    <p><span className="text-[#71717A]">Amount:</span> <span className="font-bold">${booking.amount}</span></p>
                  </div>
                  {isCEO && (
                  <button
                    onClick={() => handleBookingDelete(booking.booking_id)}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white border-2 border-black font-bold uppercase text-sm hover:bg-red-700 transition"
                    data-testid={`delete-booking-${booking.booking_id}`}
                  >
                    Delete
                  </button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Staff Monitoring */}
          <TabsContent value="staff" className="mt-6" data-testid="staff-content">
            <h2 className="text-2xl font-black uppercase mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Staff Monitoring
            </h2>
            <div className="grid gap-6">
              {staff.map((member) => (
                <div key={member.user_id} className="border-2 border-black p-6 bg-white" data-testid={`staff-${member.user_id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black uppercase text-lg">{member.name}</h3>
                      <p className="text-sm text-[#71717A]">{member.email}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold uppercase border-2 border-black bg-[#CCFF00]">
                      {member.role}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center border-t-2 border-black pt-4">
                    <div>
                      <p className="text-2xl font-black">{member.completed_jobs || 0}</p>
                      <p className="text-xs font-semibold uppercase text-[#71717A]">Completed Jobs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black">{member.total_hours || 0}h</p>
                      <p className="text-xs font-semibold uppercase text-[#71717A]">Total Hours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black">{member.avg_performance_score || 0}/10</p>
                      <p className="text-xs font-semibold uppercase text-[#71717A]">Avg Performance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t-2 border-black pt-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold uppercase text-[#71717A] mb-2">Earnings/Hour</p>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={hourlyRateDrafts[member.user_id] ?? 0}
                        onChange={(e) => setHourlyRateDrafts((current) => ({ ...current, [member.user_id]: e.target.value }))}
                        disabled={!['staff'].includes((member.role || '').toLowerCase()) || (!isCEO && !isManager)}
                        className="w-full h-12 px-4 border-2 border-black"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => handleHourlyRateUpdate(member)}
                        disabled={!['staff'].includes((member.role || '').toLowerCase()) || (!isCEO && !isManager)}
                        className="w-full h-12 px-4 bg-[#CCFF00] border-2 border-black font-bold uppercase disabled:opacity-50"
                      >
                        Save Pay Rate
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase text-[#71717A] mb-2">Role</p>
                      <div className="flex gap-2">
                        <select
                          value={roleDrafts[member.user_id] || (member.role || 'staff').toLowerCase()}
                          onChange={(e) => setRoleDrafts((current) => ({ ...current, [member.user_id]: e.target.value }))}
                          disabled={!isCEO || (member.role || '').toLowerCase() === 'ceo'}
                          className="w-full h-12 px-3 border-2 border-black bg-white uppercase"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(member)}
                          disabled={!isCEO || (member.role || '').toLowerCase() === 'ceo'}
                          className="h-12 px-4 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
