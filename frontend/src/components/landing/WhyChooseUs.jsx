import React from 'react';
import { Clock, Wrench, Lightning, Medal } from '@phosphor-icons/react';

export default function WhyChooseUs() {
  const benefits = [
    {
      icon: Clock,
      title: 'Reliable Scheduling',
      desc: 'We show up when we say we will. No more waiting around for no-shows.',
    },
    {
      icon: Wrench,
      title: 'Professional Equipment',
      desc: 'Commercial-grade mowers and tools for the best results every time.',
    },
    {
      icon: Lightning,
      title: 'Fast Service',
      desc: 'Most properties completed in under an hour. Quick and efficient.',
    },
    {
      icon: Medal,
      title: 'Satisfaction Guarantee',
      desc: 'Not happy with the work? We will make it right, guaranteed.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Why Choose Us
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            We go above and beyond to deliver the best lawn care experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <div
              key={idx}
              className="text-center p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black flex items-center justify-center group-hover:bg-[#CCFF00] transition-colors">
                <benefit.icon size={28} weight="fill" className="text-white group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}