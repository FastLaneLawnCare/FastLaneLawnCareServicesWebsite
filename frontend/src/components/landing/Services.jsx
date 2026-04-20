import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Trash, Tree, Flower, Snowflake, Wrench } from '@phosphor-icons/react';

export default function Services() {
  const navigate = useNavigate();

  const services = [
    {
      icon: Scissors,
      title: 'Lawn Mowing',
      desc: 'Professional mowing with stripe patterns for a pristine look.',
    },
    {
      icon: Trash,
      title: 'Yard Cleanup',
      desc: 'Complete cleanup including leaf removal and debris clearing.',
    },
    {
      icon: Tree,
      title: 'Edging',
      desc: 'Clean edges along walkways, driveways, and flower beds.',
    },
    {
      icon: Flower,
      title: 'Mulching',
      desc: 'Fresh mulch installation to enrich soil and prevent weeds.',
    },
    {
      icon: Snowflake,
      title: 'Seasonal Cleanup',
      desc: 'Spring and fall cleanups to prepare your yard for the season.',
    },
    {
      icon: Wrench,
      title: 'Weekly Maintenance',
      desc: 'Regular maintenance to keep your lawn healthy all season.',
    },
  ];

  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Our Services
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            From basic mowing to full yard transformations, we do it all.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="group p-6 bg-white border-2 border-gray-200 hover:border-[#CCFF00] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/booking')}
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-[#CCFF00] flex items-center justify-center mb-4 transition-colors">
                <service.icon size={24} weight="fill" className="text-black group-hover:text-black" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 group-hover:text-[#CCFF00] transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}