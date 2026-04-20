import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Envelope, MapPin } from '@phosphor-icons/react';

export default function ContactSection() {
  const navigate = useNavigate();

  return (
    <section id="contact" className="py-24 bg-black">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2
          className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4 text-white"
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
        >
          Get In Touch
        </h2>
        <p className="text-gray-400 text-lg mb-12">
          Have questions? Ready to book? Reach out anyway that works for you.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 flex items-center justify-center mb-4">
              <Phone size={24} weight="fill" className="text-[#CCFF00]" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm mb-2">Phone</h3>
            <a href="tel:+13315519080" className="text-gray-300 hover:text-[#CCFF00] transition-colors">
              (331) 551-9080
            </a>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 flex items-center justify-center mb-4">
              <Envelope size={24} weight="fill" className="text-[#CCFF00]" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm mb-2">Email</h3>
            <a href="mailto:FastLaneLawnBusiness@gmail.com" className="text-gray-300 hover:text-[#CCFF00] transition-colors break-all">
              FastLaneLawnBusiness@gmail.com
            </a>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 flex items-center justify-center mb-4">
              <MapPin size={24} weight="fill" className="text-[#CCFF00]" />
            </div>
            <h3 className="font-bold text-white uppercase text-sm mb-2">Address</h3>
            <p className="text-gray-300">
              310 Macadamia Dr<br />Bloomington, IL 61705
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/booking')}
          className="px-10 py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] hover:border-black hover:shadow-[6px_6px_0px_#CCFF00] transition-all duration-150 transform hover:-translate-y-1"
        >
          Book Your Service
        </button>
      </div>
    </section>
  );
}