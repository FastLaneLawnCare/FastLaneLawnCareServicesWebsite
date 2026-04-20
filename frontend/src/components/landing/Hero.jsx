import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretDown, ShieldCheck, MapPin, Star } from '@phosphor-icons/react';

export default function Hero() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const trustIndicators = [
    { icon: Star, label: '5.0 Stars', sub: '500+ Reviews' },
    { icon: ShieldCheck, label: 'Licensed & Insured', sub: 'Certified Pros' },
    { icon: MapPin, label: 'Local Business', sub: 'Bloomington, IL' },
  ];

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center animate-zoom"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1625766924175-4c010046038d?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      <div
        className={`relative z-10 text-center px-6 max-w-5xl mx-auto transition-all duration-1000 transform ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mb-6">
          <span className="inline-block px-4 py-1 bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00] font-bold uppercase text-sm tracking-wider">
            Professional Lawn Care
          </span>
        </div>

        <h2
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase text-white mb-6"
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
        >
          Lightning-Fast<br />
          <span className="text-[#CCFF00]">Lawn Service</span>
        </h2>

        <p className="text-xl sm:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-medium">
          Professional lawn care that moves at your speed. Quality results, zero wait.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => navigate('/booking')}
            className="px-10 py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] hover:border-black hover:shadow-[6px_6px_0px_#0A0A0A] transition-all duration-150 transform hover:-translate-y-1"
          >
            Book Now
          </button>
          <button
            onClick={() => navigate('/quote')}
            className="px-10 py-4 bg-transparent text-white border-2 border-white font-bold uppercase text-lg hover:bg-white hover:text-black transition-all duration-150 transform hover:-translate-y-1"
          >
            Request Quote
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {trustIndicators.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                <item.icon size={24} weight="fill" className="text-[#CCFF00]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">{item.label}</p>
                <p className="text-sm text-gray-300">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => scrollToSection('trust')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white animate-bounce cursor-pointer"
      >
        <CaretDown size={32} />
      </button>
    </section>
  );
}