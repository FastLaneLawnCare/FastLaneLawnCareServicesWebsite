import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, UploadSimple } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';
import { formatPhoneNumber } from '../lib/phone';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function QuoteRequest() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_type: '',
    property_size: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || formatPhoneNumber(user.phone || '')
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/quotes`, formData, { withCredentials: true });

      if (file) {
        const formDataFile = new FormData();
        formDataFile.append('file', file);
        await axios.post(`${API}/quotes/${data.quote_id}/upload`, formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Quote request submitted successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error('Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            data-testid="back-button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold uppercase text-sm hover:text-[#71717A] transition"
          >
            <ArrowLeft size={20} weight="bold" />
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tighter uppercase mb-4"
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          data-testid="quote-heading"
        >
          Request a Quote
        </h1>
        <p className="text-lg mb-8 text-[#71717A]">Fill out the form below and we'll get back to you soon.</p>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="quote-form">
          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Name</label>
            <input
              data-testid="quote-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Email</label>
            <input
              data-testid="quote-email-input"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Phone</label>
            <input
              data-testid="quote-phone-input"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
              placeholder="(000)-000-0000"
              maxLength="14"
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Service Type</label>
            <select
              data-testid="quote-service-select"
              required
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            >
              <option value="">Select service</option>
              <option value="lawn_mowing">Lawn Mowing</option>
              <option value="landscaping">Landscaping</option>
              <option value="tree_trimming">Tree Trimming</option>
              <option value="garden_maintenance">Garden Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Property Size</label>
            <input
              data-testid="quote-property-size-input"
              type="text"
              required
              placeholder="e.g., 1000 sq ft, 0.5 acre"
              value={formData.property_size}
              onChange={(e) => setFormData({ ...formData, property_size: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Upload Photo (Optional)</label>
            <div
              className="border-2 border-dashed border-black bg-[#F4F4F5] p-8 text-center cursor-pointer hover:bg-[#E4E4E7] transition"
              onClick={() => document.getElementById('file-input').click()}
              data-testid="file-upload-area"
            >
              <UploadSimple size={48} weight="bold" className="mx-auto mb-2" />
              <p className="font-semibold">{file ? file.name : 'Click to upload photo'}</p>
              <p className="text-sm text-[#71717A] mt-1">JPG, PNG up to 10MB</p>
            </div>
            <input
              id="file-input"
              data-testid="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <button
            data-testid="quote-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Quote Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
