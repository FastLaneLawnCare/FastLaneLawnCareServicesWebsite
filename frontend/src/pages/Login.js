import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';
import { formatPhoneNumber } from '../lib/phone';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state?.from || '/my-account';
      navigate(from, { replace: true });
    }
  }, [authLoading, location.state, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await login(formData.email, formData.password)
      : await register(formData.email, formData.password, formData.name, formData.phone);

    setLoading(false);

    if (result.success) {
      const from = location.state?.from || '/my-account';
      navigate(from);
    } else {
      setError(result.error);
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

      <div className="max-w-md mx-auto px-6 py-16">
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tighter uppercase mb-8 text-center"
          style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          data-testid="login-heading"
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </h1>

        {error && (
          <div data-testid="error-message" className="mb-6 p-4 bg-red-100 border-2 border-red-600 text-red-600 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="auth-form">
          {!isLogin && (
            <div>
              <label className="block font-semibold uppercase text-sm mb-2">Name</label>
              <input
                data-testid="name-input"
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Email</label>
            <input
              data-testid="email-input"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-sm mb-2">Password</label>
            <input
              data-testid="password-input"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block font-semibold uppercase text-sm mb-2">Phone</label>
              <input
                data-testid="phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                placeholder="(000)-000-0000"
                maxLength="14"
                className="w-full h-14 px-4 border-2 border-black text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              />
            </div>
          )}

          <button
            data-testid="submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#CCFF00] text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-[#CCFF00] transition-all duration-150 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold hover:text-[#71717A] transition"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
