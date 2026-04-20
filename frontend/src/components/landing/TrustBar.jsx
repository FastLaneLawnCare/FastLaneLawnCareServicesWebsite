import React from 'react';
import { Clock, ShieldCheck, CalendarCheck, Lightning } from '@phosphor-icons/react';

export default function TrustBar() {
  const features = [
    {
      icon: Clock,
      title: 'Same-Day Service',
      desc: 'Fast turnaround when you need it most',
    },
    {
      icon: ShieldCheck,
      title: 'Fully Insured',
      desc: 'Your property protected',
    },
    {
      icon: CalendarCheck,
      title: 'Online Booking',
      desc: 'Book anytime, anywhere',
    },
    {
      icon: Lightning,
      title: 'Fast Response',
      desc: 'We respond within hours',
    },
  ];

  return (
    <section id="trust" className="py-12 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center mb-4 group-hover:bg-[#CCFF00]/30 transition-colors">
                <item.icon size={28} weight="fill" className="text-[#CCFF00]" />
              </div>
              <h3 className="font-bold text-white uppercase text-sm tracking-wide mb-1">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}