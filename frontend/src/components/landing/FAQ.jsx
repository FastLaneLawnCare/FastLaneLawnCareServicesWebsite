import React, { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How do I book a service?',
      a: 'Simply click "Book Now" and select your service, property size, and preferred time. You can book online 24/7 or call us during business hours.',
    },
    {
      q: 'How much does lawn mowing cost?',
      a: 'Starting prices are $45 for small yards, $65 for medium yards, and $95 for large yards. Exact pricing depends on yard size, terrain, and services needed.',
    },
    {
      q: 'Do you offer same-day service?',
      a: 'Yes! We offer same-day service for most requests. Book by 10am for same-day afternoon appointments, subject to availability.',
    },
    {
      q: 'Are you licensed and insured?',
      a: 'Absolutely. We are fully licensed and insured for your peace of mind. All our technicians are trained professionals.',
    },
    {
      q: 'What if I am not satisfied with the service?',
      a: 'We offer a 100% satisfaction guarantee. If you are not happy with the work, we will make it right at no additional cost.',
    },
    {
      q: 'Do you offer weekly maintenance?',
      a: 'Yes, we offer weekly, bi-weekly, and monthly maintenance plans. Contact us for pricing and availability.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-lg pr-4">{faq.q}</span>
                {openIndex === idx ? (
                  <CaretUp size={20} className="text-[#CCFF00]" />
                ) : (
                  <CaretDown size={20} className="text-gray-400" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === idx ? 'max-h-40' : 'max-h-0'
                }`}
              >
                <p className="px-5 pb-5 text-gray-600">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}