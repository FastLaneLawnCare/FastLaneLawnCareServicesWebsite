import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTABreak() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#CCFF00]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-6 text-black">
          Ready for a Perfect Lawn?
        </h2>
        <p className="text-xl text-black/70 mb-8 max-w-xl mx-auto">
          Join hundreds of happy customers who trust Fast Lane for their lawn care needs.
        </p>
        <button
          onClick={() => navigate('/booking')}
          className="px-12 py-5 bg-black text-[#CCFF00] border-2 border-black font-bold uppercase text-xl hover:bg-white hover:text-black transition-all duration-150 transform hover:-translate-y-1"
        >
          Book Now
        </button>
      </div>
    </section>
  );
}