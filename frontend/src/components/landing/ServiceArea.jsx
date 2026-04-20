import React from 'react';
import { MapPin } from '@phosphor-icons/react';

export default function ServiceArea() {
  const cities = [
    'Bloomington', 'Normal', 'Champaign', 'Oak Brook', 'Decatur',
    'Springfield', 'Peoria', 'Naperville', 'Aurora', 'Joliet'
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              className="text-4xl sm:text-5xl font-black tracking-tight uppercase mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Service Area
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Proudly serving Bloomington and surrounding areas. If you do not see your city listed, give us a call!
            </p>

            <div className="flex flex-wrap gap-3">
              {cities.map((city, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-white border-2 border-gray-200 font-semibold text-sm uppercase hover:border-[#CCFF00] hover:bg-[#CCFF00]/10 transition-colors cursor-pointer"
                >
                  {city}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <MapPin size={24} className="text-[#CCFF00]" />
              <span className="font-semibold">Bloomington, IL 61705</span>
            </div>
          </div>

          <div className="relative h-80 bg-gray-200 border-2 border-black flex items-center justify-center" style={{ boxShadow: '8px 8px 0px #0A0A0A' }}>
            <div className="text-center">
              <MapPin size={48} className="mx-auto mb-4 text-[#CCFF00]" />
              <p className="font-bold text-lg">Interactive Map</p>
              <p className="text-gray-500 text-sm">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}