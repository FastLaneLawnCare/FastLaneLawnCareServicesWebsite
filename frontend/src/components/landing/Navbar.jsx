import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Services', id: 'services' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'Reviews', id: 'reviews' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <h1
          className={`text-2xl font-black uppercase tracking-tight cursor-pointer transition-transform hover:scale-105 ${
            scrolled ? 'text-black' : 'text-white'
          }`}
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          onClick={() => navigate('/')}
        >
          Fast Lane<br />
          <span className="text-[#CCFF00]">Lawn Care</span>
        </h1>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`font-semibold uppercase text-sm tracking-wide hover:text-[#CCFF00] transition-colors ${
                scrolled ? 'text-black' : 'text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className={`px-5 py-2 font-bold uppercase text-sm border-2 transition-all duration-150 hover:bg-[#CCFF00] hover:border-[#CCFF00] hover:text-black ${
              scrolled
                ? 'border-black text-black hover:shadow-[4px_4px_0px_#0A0A0A]'
                : 'border-white text-white hover:shadow-[4px_4px_0px_#fff]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/booking')}
            className="px-6 py-2 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-sm hover:bg-black hover:text-[#CCFF00] hover:border-black hover:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-150 transform hover:-translate-y-0.5"
          >
            Book Now
          </button>
        </div>

        <button
          className={`md:hidden p-2 ${scrolled ? 'text-black' : 'text-white'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={28} /> : <List size={28} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl py-6 px-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="font-bold uppercase text-black text-left"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => navigate('/booking')}
            className="px-6 py-3 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase"
          >
            Book Now
          </button>
        </div>
      )}
    </header>
  );
}