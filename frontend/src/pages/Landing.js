import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Envelope, MapPin } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';

import lawn1 from '../assets/images/Lawn1.jpg';
import lawn2 from '../assets/images/Lawn2.jpg';
import lawn3 from '../assets/images/Lawn3.jpg';
import lawn4 from '../assets/images/Lawn4.jpg';
import lawn5 from '../assets/images/Lawn5.jpg';
import yard from '../assets/images/Yard.jpg';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Fast Lane Lawn Care
          </h1>
          <div className="flex gap-3">
            <button
              data-testid="header-login-btn"
              onClick={() => navigate(user ? '/my-account' : '/login')}
              className="px-6 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-all duration-150"
            >
              {loading ? 'Loading' : user ? 'My Account' : 'Login'}
            </button>
            <button
              data-testid="header-book-now-btn"
              onClick={() => navigate('/booking')}
              className="px-6 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition-all duration-150"
            >
              Book Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative h-[600px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1625766924175-4c010046038d?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85)',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-6">
          <h2
            className="text-5xl sm:text-6xl font-black tracking-tighter uppercase text-white mb-6"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            data-testid="hero-heading"
          >
            Lightning-Fast<br />Lawn Service
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto font-medium">
            Professional lawn care that moves at your speed. Quality results, zero wait.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              data-testid="hero-book-now-btn"
              onClick={() => navigate('/booking')}
              className="px-8 py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 transform hover:-translate-y-1"
            >
              Book Now
            </button>
            <button
              data-testid="hero-request-quote-btn"
              onClick={() => navigate('/quote')}
              className="px-8 py-4 bg-white text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-white transition-all duration-150 transform hover:-translate-y-1"
            >
              Request Quote
            </button>
          </div>
        </div>
      </section>

      {/* Previous Work Gallery */}
      <section className="py-24 px-6 bg-white" data-testid="gallery-section">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-12 text-center"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Our Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { url: lawn1, title: 'Striped Perfection' },
              { url: lawn2, title: 'Yard Cleanup' },
              { url: lawn3, title: 'Fresh Cut Lawns' },
              { url: lawn4, title: 'Precision Mowing' },
              { url: lawn5, title: 'Crisp Clean Cuts' },
              { url: yard, title: 'Yard Transformation' }
            ].map((img, idx) => (
              <div
                key={idx}
                data-testid={`gallery-item-${idx}`}
                className="border-2 border-black bg-white overflow-hidden transform hover:-translate-y-1 transition-transform duration-150"
                style={{ boxShadow: '4px 4px 0px #0A0A0A' }}
              >
                <img src={img.url} alt={img.title} className="w-full h-64 object-cover" />
                <div className="p-4 bg-[#F4F4F5]">
                  <h3 className="font-bold uppercase text-sm">{img.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-24 px-6 bg-[#0A0A0A] text-white" data-testid="contact-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-12"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center gap-3" data-testid="contact-phone">
              <Phone size={32} weight="bold" className="text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-sm uppercase font-semibold text-[#CCFF00]">Phone</p>
                <p className="text-lg font-medium">(331) 551-9080</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3" data-testid="contact-email">
              <Envelope size={32} weight="bold" className="text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-sm uppercase font-semibold text-[#CCFF00]">Email</p>
                <p className="text-lg font-medium break-all">FastLaneLawnBusiness@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3" data-testid="contact-address">
              <MapPin size={32} weight="bold" className="text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-sm uppercase font-semibold text-[#CCFF00]">Address</p>
                <p className="text-base font-medium">310 Macadamia Dr<br />Bloomington, IL 61705</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-6 border-t-2 border-[#CCFF00]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-medium">&copy; 2026 Fast Lane Lawn Care. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
