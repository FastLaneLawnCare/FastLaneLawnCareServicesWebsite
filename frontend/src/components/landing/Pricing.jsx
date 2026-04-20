import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from '@phosphor-icons/react';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Small Yard',
      price: '$45',
      period: 'starting',
      features: ['Up to 5,000 sq ft', 'Standard mowing', 'Edge cleanup', 'Debris removal'],
    },
    {
      name: 'Medium Yard',
      price: '$65',
      period: 'starting',
      features: ['Up to 10,000 sq ft', 'Stripe patterns', 'Edge cleanup', 'Debris removal'],
      popular: true,
    },
    {
      name: 'Large Yard',
      price: '$95',
      period: 'starting',
      features: ['Up to 20,000 sq ft', 'Premium service', 'Edge cleanup', 'Debris removal'],
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4 text-white"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Simple Pricing
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            No hidden fees. No surprises. Just fair, transparent pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 bg-white border-2 ${
                plan.popular ? 'border-[#CCFF00]' : 'border-gray-700'
              } hover:-translate-y-2 transition-transform duration-200`}
              style={{
                boxShadow: plan.popular ? '8px 8px 0px #CCFF00' : '6px 6px 0px #333',
              }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#CCFF00] text-black font-bold uppercase text-xs tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold uppercase mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-sm">
                    <Check size={16} weight="fill" className="text-[#CCFF00]" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/quote')}
                className={`w-full py-3 font-bold uppercase text-sm border-2 transition-all duration-150 ${
                  plan.popular
                    ? 'bg-[#CCFF00] border-black text-black hover:bg-black hover:text-[#CCFF00]'
                    : 'border-gray-400 text-black hover:border-[#CCFF00]'
                }`}
              >
                Get Quote
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}