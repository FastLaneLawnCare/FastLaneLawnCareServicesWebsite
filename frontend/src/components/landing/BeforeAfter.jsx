import React from 'react';
import { Check } from '@phosphor-icons/react';

import lawn1 from '../assets/images/Lawn1.jpg';
import lawn2 from '../assets/images/Lawn2.jpg';
import lawn3 from '../assets/images/Lawn3.jpg';
import lawn4 from '../assets/images/Lawn4.jpg';
import lawn5 from '../assets/images/Lawn5.jpg';
import yard from '../assets/images/Yard.jpg';

const galleryImages = [
  { url: lawn1, title: 'Striped Perfection', location: 'Garden District' },
  { url: lawn2, title: 'Yard Cleanup', location: 'Oak Park' },
  { url: lawn3, title: 'Fresh Cut Lawns', location: 'Highland Park' },
  { url: lawn4, title: 'Precision Mowing', location: 'Lakeview' },
  { url: lawn5, title: 'Crisp Clean Cuts', location: 'West End' },
  { url: yard, title: 'Full Transformation', location: 'Downtown' },
];

export default function BeforeAfter() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Our Work
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            See the transformation with your own eyes. Real results, real lawns.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden border-2 border-black bg-black cursor-pointer"
              style={{ boxShadow: '6px 6px 0px #0A0A0A' }}
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white font-bold">
                    <Check size={24} weight="fill" />
                    <span>VIEW PROJECT</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border-t-2 border-black">
                <h3 className="font-bold uppercase text-sm">{img.title}</h3>
                <p className="text-gray-500 text-xs">{img.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}