import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Envelope, MapPin, FacebookLogo, InstagramLogo } from '@phosphor-icons/react';

export default function Footer() {
  const navigate = useNavigate();

  const footerLinks = {
    services: [
      { label: 'Lawn Mowing', path: '/booking' },
      { label: 'Yard Cleanup', path: '/booking' },
      { label: 'Edging', path: '/booking' },
      { label: 'Mulching', path: '/booking' },
      { label: 'Seasonal Cleanup', path: '/booking' },
    ],
    company: [
      { label: 'Home', path: '/' },
      { label: 'Book Now', path: '/booking' },
      { label: 'Request Quote', path: '/quote' },
      { label: 'Login', path: '/login' },
    ],
  };

  return (
    <footer className="bg-black text-white py-16 border-t-4 border-[#CCFF00]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3
              className="text-2xl font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Fast Lane<br />
              <span className="text-[#CCFF00]">Lawn Care</span>
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Professional lawn care services in Bloomington and surrounding areas. Quality results, zero wait.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-colors">
                <FacebookLogo size={20} weight="fill" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-colors">
                <InstagramLogo size={20} weight="fill" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider mb-4 text-[#CCFF00]">
              Services
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-gray-400 hover:text-[#CCFF00] transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider mb-4 text-[#CCFF00]">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-gray-400 hover:text-[#CCFF00] transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider mb-4 text-[#CCFF00]">
              Contact Info
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-[#CCFF00] mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <a href="tel:+13315519080" className="hover:text-[#CCFF00] transition-colors">
                    (331) 551-9080
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Envelope size={18} className="text-[#CCFF00] mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <a href="mailto:FastLaneLawnBusiness@gmail.com" className="hover:text-[#CCFF00] transition-colors break-all">
                    FastLaneLawnBusiness@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#CCFF00] mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p>310 Macadamia Dr<br />Bloomington, IL 61705</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Fast Lane Lawn Care. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-[#CCFF00] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-[#CCFF00] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}