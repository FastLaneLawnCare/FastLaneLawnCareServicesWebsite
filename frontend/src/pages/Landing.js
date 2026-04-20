import React from 'react';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import TrustBar from '../components/landing/TrustBar';
import HowItWorks from '../components/landing/HowItWorks';
import Services from '../components/landing/Services';
import BeforeAfter from '../components/landing/BeforeAfter';
import Pricing from '../components/landing/Pricing';
import Reviews from '../components/landing/Reviews';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import ServiceArea from '../components/landing/ServiceArea';
import CTABreak from '../components/landing/CTABreak';
import FAQ from '../components/landing/FAQ';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Services />
        <BeforeAfter />
        <Pricing />
        <Reviews />
        <WhyChooseUs />
        <ServiceArea />
        <CTABreak />
        <FAQ />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}