import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Phone, Envelope } from '@phosphor-icons/react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Fast Lane Lawn Care
          </h1>
          <button
            data-testid="header-book-now-btn"
            onClick={() => navigate('/booking')}
            className="px-6 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] transition-all duration-150"
          >
            Book Now
          </button>
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
              { url: 'https://customer-assets.emergentagent.com/job_fast-lane-lawn/artifacts/cpyhjggy_2026-03-28%2011.43.57.jpg', title: 'Striped Perfection' },
              { url: 'https://customer-assets.emergentagent.com/job_fast-lane-lawn/artifacts/2qzzgrlp_2026-03-28%2011.44.07.jpg', title: 'Yard Transformation' },
              { url: 'https://customer-assets.emergentagent.com/job_fast-lane-lawn/artifacts/x2iw3so3_2026-03-28%2011.44.09.jpg', title: 'Fresh Cut Lawns' },
              { url: 'https://customer-assets.emergentagent.com/job_fast-lane-lawn/artifacts/29w2f6id_2026-03-28%2011.44.17.jpg', title: 'Precision Mowing' },
              { url: 'https://customer-assets.emergentagent.com/job_fast-lane-lawn/artifacts/tnokpzg4_2026-03-28%2011.44.04.jpg', title: 'Crisp Clean Cuts' },
              { url: 'https://images.unsplash.com/photo-1758414335609-fe94a3b089c0?crop=entropy&cs=srgb&fm=jpg&w=800&q=85', title: 'Beautiful Landscaping' }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-center gap-3" data-testid="contact-phone">
              <Phone size={32} weight="bold" className="text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-sm uppercase font-semibold text-[#CCFF00]">Phone</p>
                <p className="text-lg font-medium">(555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3" data-testid="contact-email">
              <Envelope size={32} weight="bold" className="text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-sm uppercase font-semibold text-[#CCFF00]">Email</p>
                <p className="text-lg font-medium">info@fastlanelawn.com</p>
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
