import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BookingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPayment = async () => {
      // Check for Stripe session
      const stripeSessionId = searchParams.get('session_id');
      if (stripeSessionId) {
        await handleStripeSuccess(stripeSessionId);
        return;
      }

      // Check for PayPal token
      const paypalToken = searchParams.get('token');
      if (paypalToken) {
        await handlePayPalSuccess(paypalToken);
        return;
      }

      // No payment info found
      setStatus('error');
      setMessage('No payment information found');
    };

    processPayment();
  }, [searchParams]);

  const handleStripeSuccess = async (sessionId) => {
    let attempts = 0;
    const maxAttempts = 5;

    const pollStatus = async () => {
      if (attempts >= maxAttempts) {
        setStatus('error');
        setMessage('Payment verification timed out. Please check My Bookings.');
        return;
      }

      try {
        const { data } = await axios.get(`${API}/payments/stripe/status/${sessionId}`);
        if (data.payment_status === 'paid') {
          setStatus('success');
          setMessage('Payment successful! Your booking is confirmed.');
          setTimeout(() => navigate('/my-bookings'), 3000);
          return;
        }
      } catch (error) {
        console.error('Stripe status check failed:', error);
      }

      attempts++;
      setTimeout(pollStatus, 2000);
    };

    pollStatus();
  };

  const handlePayPalSuccess = async (orderId) => {
    try {
      // Capture the PayPal order
      const { data } = await axios.post(`${API}/payments/paypal/capture/${orderId}`);
      
      if (data.payment_status === 'paid') {
        setStatus('success');
        setMessage('PayPal payment successful! Your booking is confirmed.');
        setTimeout(() => navigate('/my-bookings'), 3000);
      } else {
        setStatus('processing');
        setMessage('Processing PayPal payment...');
        
        // Poll for status
        let attempts = 0;
        const maxAttempts = 5;
        
        const pollStatus = async () => {
          if (attempts >= maxAttempts) {
            setStatus('error');
            setMessage('Payment verification timed out. Please check My Bookings.');
            return;
          }

          try {
            const { data: statusData } = await axios.get(`${API}/payments/paypal/status/${orderId}`);
            if (statusData.payment_status === 'paid') {
              setStatus('success');
              setMessage('PayPal payment successful! Your booking is confirmed.');
              setTimeout(() => navigate('/my-bookings'), 3000);
              return;
            }
          } catch (error) {
            console.error('PayPal status check failed:', error);
          }

          attempts++;
          setTimeout(pollStatus, 2000);
        };

        setTimeout(pollStatus, 2000);
      }
    } catch (error) {
      console.error('PayPal capture failed:', error);
      setStatus('error');
      setMessage('Payment processing failed. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="border-2 border-black p-8 bg-white">
          {status === 'processing' && (
            <>
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-[#CCFF00] border-r-transparent mb-6"></div>
              <h2
                className="text-2xl font-black uppercase mb-4"
                style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              >
                {message}
              </h2>
              <p className="text-[#71717A]">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={64} weight="bold" className="mx-auto mb-6 text-[#CCFF00]" />
              <h2
                className="text-2xl font-black uppercase mb-4"
                style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              >
                Booking Confirmed!
              </h2>
              <p className="text-lg mb-6">{message}</p>
              <p className="text-[#71717A]">Redirecting to your bookings...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-block h-16 w-16 mb-6 text-red-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h2
                className="text-2xl font-black uppercase mb-4"
                style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              >
                Payment Issue
              </h2>
              <p className="text-lg mb-6">{message}</p>
              <button
                onClick={() => navigate('/my-bookings')}
                className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase hover:bg-black hover:text-[#CCFF00] transition"
              >
                Go to My Bookings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
