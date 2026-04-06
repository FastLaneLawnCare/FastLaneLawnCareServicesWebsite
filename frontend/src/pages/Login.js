import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await login(formData.email, formData.password)
      : await register(formData.email, formData.password, formData.name, formData.phone);

    setLoading(false);

    if (result.success) {
      const from = location.state?.from || '/my-bookings';
      navigate(from);
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/my-bookings';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

        <div className="my-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white font-semibold uppercase">Or</span>
            </div>
          </div>
        </div>

        <button
          data-testid="google-login-button"
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white text-black border-2 border-black font-bold uppercase text-lg hover:bg-black hover:text-white transition-all duration-150 flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" />
            <path d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z" />
            <path d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z" />
            <path d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z" />
          </svg>
          Continue with Google
        </button>

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
