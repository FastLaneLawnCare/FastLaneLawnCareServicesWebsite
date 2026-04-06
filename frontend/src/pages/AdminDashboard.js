import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Invoice, FileText, Calendar, Users, ChartBar, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invoice form state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    due_date: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
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
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteUpdate = async (quoteId, status, message) => {
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

  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      await axios.patch(
        `${API}/bookings/${bookingId}`,
        updates,
        { withCredentials: true }
      );
      toast.success('Booking updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const handleCreateInvoice = async (e) => {
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
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index)
    });
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            data-testid="admin-dashboard-heading"
          >
            Admin Dashboard
          </h1>
          <button
            data-testid="back-to-bookings"
            onClick={() => navigate('/my-bookings')}
            className="px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition"
          >
            My Bookings
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
                className="px-6 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
              >
                + New Invoice
              </button>
            </div>

            {showInvoiceForm && (
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

            <div className="border-2 border-black">
              <table className="w-full">
                <thead className="border-b-2 border-black bg-[#F4F4F5]">
                  <tr>
                    <th className="p-4 text-left font-bold uppercase text-sm">Invoice ID</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Customer</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Amount</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Due Date</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="border-b border-black" data-testid={`invoice-${invoice.invoice_id}`}>
                      <td className="p-4 font-mono text-sm">{invoice.invoice_id.slice(-8).toUpperCase()}</td>
                      <td className="p-4">{invoice.customer_name}</td>
                      <td className="p-4 font-bold">${invoice.total_amount}</td>
                      <td className="p-4">{invoice.due_date}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          invoice.status === 'paid' ? 'bg-[#CCFF00]' : 'bg-white'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black uppercase text-lg">{quote.name}</h3>
                      <p className="text-sm text-[#71717A]">{quote.email} • {quote.phone}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                      quote.status === 'pending' ? 'bg-[#CCFF00]' : 'bg-white'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <p><span className="font-semibold">Service:</span> {quote.service_type}</p>
                    <p><span className="font-semibold">Property Size:</span> {quote.property_size}</p>
                  </div>
                  {quote.status === 'pending' && (
                    <button
                      data-testid={`approve-quote-${quote.quote_id}`}
                      onClick={() => handleQuoteUpdate(quote.quote_id, 'approved', 'Quote approved')}
                      className="px-4 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition"
                    >
                      Approve Quote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings" className="mt-6" data-testid="bookings-content">
            <h2 className="text-2xl font-black uppercase mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              All Bookings
            </h2>
            <div className="border-2 border-black">
              <table className="w-full">
                <thead className="border-b-2 border-black bg-[#F4F4F5]">
                  <tr>
                    <th className="p-4 text-left font-bold uppercase text-sm">Booking ID</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Customer</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Date/Time</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Status</th>
                    <th className="p-4 text-left font-bold uppercase text-sm">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.booking_id} className="border-b border-black" data-testid={`booking-${booking.booking_id}`}>
                      <td className="p-4 font-mono text-sm">{booking.booking_id.slice(-8).toUpperCase()}</td>
                      <td className="p-4">{booking.name}</td>
                      <td className="p-4">{booking.date} {booking.time}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          booking.booking_status === 'completed' ? 'bg-[#CCFF00]' : 'bg-white'
                        }`}>
                          {booking.booking_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black ${
                          booking.payment_status === 'paid' ? 'bg-[#CCFF00]' : 'bg-white'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
