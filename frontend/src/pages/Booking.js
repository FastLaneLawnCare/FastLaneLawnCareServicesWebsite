import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock as ClockIcon } from '@phosphor-icons/react';
import { Calendar } from '../components/ui/calendar';
import axios from 'axios';
import { toast } from 'sonner';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIME_SLOTS = [
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

export default function Booking() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [details, setDetails] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (stage === 1 && !selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (stage === 2 && !selectedTime) {
      toast.error('Please select a time');
      return;
    }
    if (stage === 3) {
      if (!details.name || !details.address || !details.phone || !details.email) {
        toast.error('Please fill all fields');
        return;
      }
    }
    setStage(stage + 1);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        ...details,
        payment_method: paymentMethod,
        amount: 50.0
      };

      const { data } = await axios.post(`${API}/bookings`, bookingData, { withCredentials: true });

      if (paymentMethod === 'cash') {
        toast.success('Booking created! Pay cash on service day.');
        setTimeout(() => navigate('/my-bookings'), 2000);
      } else if (paymentMethod === 'stripe') {
        const { data: sessionData } = await axios.post(`${API}/payments/stripe/create-session`, {
          booking_id: data.booking_id,
          payment_type: 'stripe'
        });
        window.location.href = sessionData.url;
      } else if (paymentMethod === 'paypal') {
        const { data: paypalData } = await axios.post(`${API}/payments/paypal/create-order`, {
          booking_id: data.booking_id,
          payment_type: 'paypal'
        });
        window.location.href = paypalData.approval_url;
      }
    } catch (error) {
      toast.error('Failed to create booking');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            data-testid="back-button"
            onClick={() => stage === 1 ? navigate('/') : setStage(stage - 1)}
            className="flex items-center gap-2 font-bold uppercase text-sm hover:text-[#71717A] transition"
          >
            <ArrowLeft size={20} weight="bold" />
            {stage === 1 ? 'Back to Home' : 'Previous Step'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Progress Indicator */}
        <div className="mb-12" data-testid="progress-indicator">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black text-lg ${
                    stage >= s ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${stage > s ? 'bg-[#CCFF00]' : 'bg-[#E4E4E7]'}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-semibold uppercase">Date</span>
            <span className="text-xs font-semibold uppercase">Time</span>
            <span className="text-xs font-semibold uppercase">Details</span>
            <span className="text-xs font-semibold uppercase">Payment</span>
          </div>
        </div>

        {/* Stage 1: Date Selection */}
        {stage === 1 && (
          <div data-testid="stage-1">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-8"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Select Date
            </h2>
            <div className="border-2 border-black p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-lg font-bold uppercase",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-10 w-10 bg-transparent p-0 border-2 border-black hover:bg-[#CCFF00] transition",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-black rounded-md w-12 font-bold text-sm uppercase",
                  row: "flex w-full mt-2",
                  cell: "h-12 w-12 text-center text-sm p-0 relative",
                  day: "h-12 w-12 p-0 font-bold border-2 border-black hover:bg-[#CCFF00] transition",
                  day_selected: "bg-[#CCFF00] text-black border-black",
                  day_today: "bg-[#E4E4E7]",
                  day_disabled: "text-[#71717A] opacity-50"
                }}
              />
            </div>
            <button
              data-testid="next-button"
              onClick={handleNext}
              className="mt-8 w-full py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} weight="bold" />
            </button>
          </div>
        )}

        {/* Stage 2: Time Selection */}
        {stage === 2 && (
          <div data-testid="stage-2">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Select Time
            </h2>
            <p className="text-lg text-[#71717A] mb-8">Choose a time between 11 AM and 5 PM</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  data-testid={`time-slot-${time}`}
                  onClick={() => setSelectedTime(time)}
                  className={`py-4 px-6 border-2 border-black font-bold uppercase text-sm transition-all duration-150 ${
                    selectedTime === time
                      ? 'bg-[#CCFF00] text-black'
                      : 'bg-white text-black hover:bg-[#E4E4E7]'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <button
              data-testid="next-button"
              onClick={handleNext}
              className="mt-8 w-full py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} weight="bold" />
            </button>
          </div>
        )}

        {/* Stage 3: Personal Details */}
        {stage === 3 && (
          <div data-testid="stage-3">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-8"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Your Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold uppercase text-sm mb-2">Name</label>
                <input
                  data-testid="details-name-input"
                  type="text"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase text-sm mb-2">Service Address</label>
                <input
                  data-testid="details-address-input"
                  type="text"
                  value={details.address}
                  onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase text-sm mb-2">Phone</label>
                <input
                  data-testid="details-phone-input"
                  type="tel"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block font-semibold uppercase text-sm mb-2">Email</label>
                <input
                  data-testid="details-email-input"
                  type="email"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
            </div>
            <button
              data-testid="next-button"
              onClick={handleNext}
              className="mt-8 w-full py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} weight="bold" />
            </button>
          </div>
        )}

        {/* Stage 4: Payment Method */}
        {stage === 4 && (
          <div data-testid="stage-4">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Payment Method
            </h2>
            <p className="text-lg text-[#71717A] mb-8">Choose how you'd like to pay</p>

            {/* Summary Card */}
            <div className="border-2 border-black bg-[#F4F4F5] p-6 mb-8">
              <h3 className="font-bold uppercase mb-4">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Date:</span> {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}</p>
                <p><span className="font-semibold">Time:</span> {selectedTime}</p>
                <p><span className="font-semibold">Address:</span> {details.address}</p>
                <p className="text-2xl font-black mt-4">Total: $50.00</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <button
                data-testid="payment-method-stripe"
                onClick={() => setPaymentMethod('stripe')}
                className={`w-full py-6 px-6 border-2 border-black font-bold uppercase text-lg transition-all duration-150 text-left ${
                  paymentMethod === 'stripe'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-white text-black hover:bg-[#E4E4E7]'
                }`}
              >
                Pay with Stripe (Card)
              </button>
              <button
                data-testid="payment-method-paypal"
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full py-6 px-6 border-2 border-black font-bold uppercase text-lg transition-all duration-150 text-left ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-white text-black hover:bg-[#E4E4E7]'
                }`}
              >
                Pay with PayPal
              </button>
              <button
                data-testid="payment-method-cash"
                onClick={() => setPaymentMethod('cash')}
                className={`w-full py-6 px-6 border-2 border-black font-bold uppercase text-lg transition-all duration-150 text-left ${
                  paymentMethod === 'cash'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-white text-black hover:bg-[#E4E4E7]'
                }`}
              >
                Pay Cash on Service Day
              </button>
            </div>

            <button
              data-testid="confirm-booking-btn"
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase text-lg hover:bg-[#CCFF00] hover:text-black transition-all duration-150 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
