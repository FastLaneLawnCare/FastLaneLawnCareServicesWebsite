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
  const [stage, setStage] = useState(0); // Start at 0 for service selection
  const [selectedService, setSelectedService] = useState('');
  const [servicePrice, setServicePrice] = useState(parseFloat(process.env.REACT_APP_DEFAULT_SERVICE_PRICE || '50.0'));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const express = require('express');
  const cors = require('cors');
  const app = express();
  const [details, setDetails] = useState({
    firstName: '',
    lastName: '',
    houseNumber: '',
    streetName: '',
    aptNumber: '',
    city: 'Bloomington',
    zipCode: '',
    phone: '',
    email: ''
  });
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  
  app.use(cors({ origin: 'https://fastlanelawn.com' }));

  const services = [
    { id: 'lawn_mowing', name: 'Lawn Mowing', description: 'Includes: Lawn Mowing, Edge Trimming, and Debris Removal', price: 30 },
    { id: 'junk_removal_house', name: 'Junk Removal - Full House', description: 'Complete house junk removal', price: 350, note: 'Starting at' },
    { id: 'junk_removal_garage', name: 'Junk Removal - Garage/Shed/Storage', description: 'Garage, shed & storage units', price: 150, note: 'Starting at' },
    { id: 'junk_removal_sidewalk', name: 'Junk Removal - Sidewalk', description: 'Sidewalk junk removal', price: 25, note: 'Starting at' },
    { id: 'scrap_metal', name: 'Free Scrap/Junk Metal Pickup', description: 'Free pickup of scrap metal', price: 0 },
    { id: 'yard_cleanup', name: 'Yard Cleanup', description: 'Includes: Leaves & sticks removal & raking', price: 35, note: 'Starting at' },
    { id: 'snow_removal', name: 'Snow Removal', description: 'Professional snow removal service', price: 30, note: 'Starting at' }
  ];

  const handleNext = () => {
    if (stage === 0 && !selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (stage === 1 && !selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (stage === 2 && !selectedTime) {
      toast.error('Please select a time');
      return;
    }
    if (stage === 3) {
      if (!details.firstName || !details.lastName || !details.houseNumber || !details.streetName || !details.city || !details.zipCode || !details.phone || !details.email) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!addressConfirmed) {
        // Show map for confirmation
        const fullAddress = `${details.houseNumber} ${details.streetName}${details.aptNumber ? ' ' + details.aptNumber : ''}, ${details.city}, IL ${details.zipCode}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=-89.1,40.4,-88.9,40.6&layer=mapnik&marker=40.484,89.003`);
        setShowMap(true);
        return;
      }
    }
    setStage(stage + 1);
  };

  const handleAddressConfirmation = (confirmed) => {
    if (confirmed) {
      // Convert address to uppercase
      setDetails({
        ...details,
        firstName: details.firstName.toUpperCase(),
        lastName: details.lastName.toUpperCase(),
        houseNumber: details.houseNumber.toUpperCase(),
        streetName: details.streetName.toUpperCase(),
        aptNumber: details.aptNumber.toUpperCase(),
        city: details.city.toUpperCase(),
        zipCode: details.zipCode.toUpperCase()
      });
      setAddressConfirmed(true);
      setShowMap(false);
      setStage(stage + 1);
    } else {
      setShowMap(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service.id);
    setServicePrice(service.price);
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
        name: `${details.firstName} ${details.lastName}`,
        address: `${details.houseNumber} ${details.streetName}${details.aptNumber ? ' ' + details.aptNumber : ''}, ${details.city}, IL ${details.zipCode}`,
        phone: details.phone,
        email: details.email,
        payment_method: paymentMethod,
        amount: servicePrice,
        service: selectedService
      };

      const { data } = await axios.post(`${API}/bookings`, bookingData, { withCredentials: true });

      if (paymentMethod === 'cash') {
        toast.success('Booking created! Pay cash on service day.');
        setTimeout(() => navigate('/my-bookings'), 2000);
      } 
      
      else if (paymentMethod === 'stripe') {
  try {const { data: sessionData } = await axios.post(
      `${API}/payments/stripe/create-session`, {
        booking_id: data.booking_id,
        payment_type: 'stripe'
      }
    );

    if (!sessionData?.url) {
      throw new Error("Missing Stripe checkout URL");
    }

    window.location.href = sessionData.url;

  } catch (err) {
    console.error("Stripe session error:", err);
    alert("Failed to start Stripe checkout. Please try again.");
  }
}
      
      else if (paymentMethod === 'paypal') {
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
            {[0, 1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-black flex items-center justify-center font-black text-base sm:text-lg ${
                    stage >= s ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                  }`}
                >
                  {s + 1}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-1 sm:mx-2 ${stage > s ? 'bg-[#CCFF00]' : 'bg-[#E4E4E7]'}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-semibold uppercase">Service</span>
            <span className="text-xs font-semibold uppercase">Date</span>
            <span className="text-xs font-semibold uppercase">Time</span>
            <span className="text-xs font-semibold uppercase">Details</span>
            <span className="text-xs font-semibold uppercase">Payment</span>
          </div>
        </div>


        {/* Stage 0: Service Selection */}
        {stage === 0 && (
          <div data-testid="stage-0">
            <div className="mb-6">
              <button
                onClick={() => navigate('/quote')}
                className="w-full py-3 px-4 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-[#E4E4E7] transition mb-2"
                data-testid="switch-to-quote-btn"
              >
                Large or Unique Job? Request a Quote Instead for Price Estimates
              </button>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Select Service
            </h2>
            
            <div className="bg-yellow-50 border-2 border-yellow-600 p-4 mb-6">
              <p className="text-sm font-semibold text-yellow-900">
                <strong>Note:</strong> Prices may vary based on property size and job complexity. Larger properties or more demanding tasks will incur additional charges. "Starting at" prices shown are base rates.
              </p>
            </div>

            <div className="space-y-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  data-testid={`service-${service.id}`}
                  onClick={() => handleServiceSelect(service)}
                  className={`w-full p-6 border-2 border-black text-left transition-all duration-150 ${
                    selectedService === service.id
                      ? 'bg-[#CCFF00] text-black'
                      : 'bg-white text-black hover:bg-[#E4E4E7]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-black uppercase text-lg mb-1">{service.name}</h3>
                      <p className="text-sm text-[#71717A]">{service.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      {service.note && <p className="text-xs font-semibold uppercase text-[#71717A]">{service.note}</p>}
                      <p className="text-2xl font-black">
                        {service.price === 0 ? 'FREE' : `$${service.price}`}
                      </p>
                    </div>
                  </div>
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

        {/* Stage 1: Date Selection */}
        {stage === 1 && (
          <div data-testid="stage-1">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase mb-8"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Select Date
            </h2>
            <div className="border-2 border-black p-4 sm:p-6 flex justify-center">
              <div className="w-full max-w-md">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="w-full scale-90 sm:scale-100"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-base sm:text-lg font-bold uppercase",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 sm:h-10 sm:w-10 bg-transparent p-0 border-2 border-black hover:bg-[#CCFF00] transition",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-black rounded-md w-8 sm:w-12 font-bold text-xs sm:text-sm uppercase",
                    row: "flex w-full mt-2",
                    cell: "h-8 w-8 sm:h-12 sm:w-12 text-center text-sm p-0 relative",
                    day: "h-8 w-8 sm:h-12 sm:w-12 p-0 font-bold border-2 border-black hover:bg-[#CCFF00] transition text-xs sm:text-base",
                    day_selected: "bg-[#CCFF00] text-black border-black",
                    day_today: "bg-[#E4E4E7]",
                    day_disabled: "text-[#71717A] opacity-50"
                  }}
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
            
            {!showMap ? (
              <div className="space-y-6">
                {/* Name Fields - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold uppercase text-sm mb-2">First Name *</label>
                    <input
                      data-testid="details-firstname-input"
                      type="text"
                      required
                      value={details.firstName}
                      onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                      className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-sm mb-2">Last Name *</label>
                    <input
                      data-testid="details-lastname-input"
                      type="text"
                      required
                      value={details.lastName}
                      onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                      className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                    />
                  </div>
                </div>

                {/* Service Address */}
                <div className="border-2 border-black p-4 bg-[#F4F4F5]">
                  <h3 className="font-bold uppercase text-sm mb-4">Service Address</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">House/Building Number *</label>
                      <input
                        data-testid="details-housenumber-input"
                        type="text"
                        required
                        value={details.houseNumber}
                        onChange={(e) => setDetails({ ...details, houseNumber: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Street Name *</label>
                      <input
                        data-testid="details-streetname-input"
                        type="text"
                        required
                        value={details.streetName}
                        onChange={(e) => setDetails({ ...details, streetName: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Apt/Lot # (Optional)</label>
                      <input
                        data-testid="details-aptnumber-input"
                        type="text"
                        value={details.aptNumber}
                        onChange={(e) => setDetails({ ...details, aptNumber: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">City *</label>
                      <input
                        data-testid="details-city-input"
                        type="text"
                        required
                        value={details.city}
                        readOnly
                        className="w-full h-12 px-4 border-2 border-black text-base bg-gray-100 focus:outline-none"
                        title="We service within 45 miles of Bloomington, IL"
                      />
                      <p className="text-xs text-[#71717A] mt-1">45 mile radius from Bloomington, IL</p>
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-xs mb-2">Zip Code *</label>
                      <input
                        data-testid="details-zipcode-input"
                        type="text"
                        required
                        maxLength="5"
                        value={details.zipCode}
                        onChange={(e) => setDetails({ ...details, zipCode: e.target.value.replace(/\D/g, '') })}
                        className="w-full h-12 px-4 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label className="block font-semibold uppercase text-sm mb-2">Phone *</label>
                  <input
                    data-testid="details-phone-input"
                    type="tel"
                    required
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-sm mb-2">Email *</label>
                  <input
                    data-testid="details-email-input"
                    type="email"
                    required
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
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
            ) : (
              /* Address Confirmation with Map */
              <div className="space-y-6">
                <div className="border-2 border-black p-6 bg-white">
                  <h3 className="font-bold uppercase mb-4">Address to Service:</h3>
                  <p className="text-lg mb-4">
                    {details.houseNumber} {details.streetName}{details.aptNumber ? ` ${details.aptNumber}` : ''}<br />
                    {details.city}, IL {details.zipCode}
                  </p>
                  
                  <div className="border-2 border-black h-64 bg-gray-200 flex items-center justify-center">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=-89.05,40.45,-88.95,40.55&layer=mapnik&marker=40.484,-89.003`}
                      title="Service Location Map"
                    ></iframe>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xl font-bold uppercase mb-6">Is This Address Correct?</p>
                  <div className="flex gap-4">
                    <button
                      data-testid="confirm-address-yes"
                      onClick={() => handleAddressConfirmation(true)}
                      className="flex-1 py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition"
                    >
                      Yes
                    </button>
                    <button
                      data-testid="confirm-address-no"
                      onClick={() => handleAddressConfirmation(false)}
                      className="flex-1 py-4 bg-white text-black border-2 border-black font-bold uppercase text-lg hover:bg-red-100 transition"
                    >
                      No
                    </button>
                  </div>
                  <p className="text-sm text-[#71717A] mt-2">Press No To Edit Info</p>
                </div>
              </div>
            )}
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
                <p><span className="font-semibold">Service:</span> {services.find(s => s.id === selectedService)?.name}</p>
                <p><span className="font-semibold">Date:</span> {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}</p>
                <p><span className="font-semibold">Time:</span> {selectedTime}</p>
                <p><span className="font-semibold">Name:</span> {details.firstName} {details.lastName}</p>
                <p><span className="font-semibold">Address:</span> {details.houseNumber} {details.streetName}{details.aptNumber ? ` ${details.aptNumber}` : ''}, {details.city}, IL {details.zipCode}</p>
                <p className="text-2xl font-black mt-4">Total: {servicePrice === 0 ? 'FREE' : `$${servicePrice.toFixed(2)}`}</p>
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
