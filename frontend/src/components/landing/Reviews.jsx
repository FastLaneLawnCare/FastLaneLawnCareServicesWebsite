import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, CaretRight, Star } from '@phosphor-icons/react';

export default function Reviews() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const reviews = [
    {
      name: 'Sarah M.',
      location: 'Bloomington',
      rating: 5,
      text: 'Fast Lane completely transformed my yard. They arrived on time, did an amazing job, and the price was exactly as quoted. Highly recommend!',
    },
    {
      name: 'James K.',
      location: 'Normal',
      rating: 5,
      text: 'Best lawn service I have ever used. Professional, efficient, and my lawn has never looked better. The stripe patterns are perfect.',
    },
    {
      name: 'Emily R.',
      location: 'Oak Brook',
      rating: 5,
      text: 'Booked online at 8pm, got a same-day appointment. Team showed up on time and my yard looks amazing. Will definitely use again.',
    },
    {
      name: 'Michael T.',
      location: 'Champaign',
      rating: 5,
      text: 'Finally found a reliable lawn service! They are always on time and do consistent quality work. Highly satisfied.',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <section id="reviews" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            What Customers Say
          </h2>
        </div>

        <div className="relative bg-white border-2 border-black p-8 md:p-12" style={{ boxShadow: '8px 8px 0px #0A0A0A' }}>
          <div className="flex flex-col items-center text-center">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={24} weight="fill" className="text-[#CCFF00]" />
              ))}
            </div>

            <p className="text-xl md:text-2xl font-medium text-gray-700 mb-8 italic">
              "{reviews[current].text}"
            </p>

            <div>
              <p className="font-bold uppercase text-lg">{reviews[current].name}</p>
              <p className="text-gray-500 text-sm">{reviews[current].location}</p>
            </div>
          </div>

          <button
            onClick={() => setCurrent((current - 1 + reviews.length) % reviews.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border-2 border-gray-200 hover:border-[#CCFF00] hover:bg-[#CCFF00] transition-colors"
          >
            <CaretLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((current + 1) % reviews.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border-2 border-gray-200 hover:border-[#CCFF00] hover:bg-[#CCFF00] transition-colors"
          >
            <CaretRight size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === current ? 'bg-[#CCFF00]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}