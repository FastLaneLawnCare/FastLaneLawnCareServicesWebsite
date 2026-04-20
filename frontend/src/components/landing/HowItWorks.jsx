import React from 'react';
import { CalendarCheck, Truck, CheckCircle } from '@phosphor-icons/react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: CalendarCheck,
      title: 'Book Online',
      desc: 'Choose your service, pick a time that works for you. It takes less than 2 minutes.',
    },
    {
      num: '02',
      icon: Truck,
      title: 'We Arrive',
      desc: 'Our professional crew arrives on time with all the equipment needed.',
    },
    {
      num: '03',
      icon: CheckCircle,
      title: 'Perfect Lawn',
      desc: 'Enjoy your beautifully maintained lawn. We wont leave until its perfect.',
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
            How It Works
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Get a perfect lawn in three simple steps. No hassle, no fuss.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-8 border-2 border-black bg-white hover:-translate-y-2 transition-transform duration-200"
              style={{ boxShadow: '6px 6px 0px #0A0A0A' }}
            >
              <span className="text-6xl font-black text-[#CCFF00]/30 absolute top-4 right-6">
                {step.num}
              </span>
              <div className="w-16 h-16 rounded-full bg-[#CCFF00] flex items-center justify-center mb-6">
                <step.icon size={32} weight="fill" className="text-black" />
              </div>
              <h3 className="text-xl font-bold uppercase mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}