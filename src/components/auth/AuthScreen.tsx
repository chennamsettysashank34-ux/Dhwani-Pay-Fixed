import React, { useState } from 'react';
import {
  Volume2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Store,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function AuthScreen() {
  const { loginUser, registerUser } = useApp();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }

      setIsLoading(true);
      const res = await registerUser(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } else {
      setIsLoading(true);
      const res = await loginUser(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Login failed.');
      }
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('merchant@dhwanipay.in');
    setPassword('soundbox123');
    setConfirmPassword('soundbox123');
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#17231D] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-xl border border-slate-200/90 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#DDF7EA] text-[#087F5B] shadow-inner mb-2 relative">
            <Volume2 className="w-8 h-8" />
            <span className="absolute -bottom-1 -right-1 bg-[#087F5B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">
              ₹
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            DhwaniPay Soundbox
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Your smartphone is your payment soundbox. Instant voice announcements for UPI payments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Merchant Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="store@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
                  required
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#087F5B] hover:bg-[#07533F] text-white font-extrabold text-sm shadow-md shadow-[#087F5B]/20 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{mode === 'signin' ? 'Sign In to Soundbox' : 'Register & Setup Store'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Helper */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure local merchant ledger</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="text-[#087F5B] hover:underline font-bold"
          >
            Quick Fill
          </button>
        </div>
      </div>
    </div>
  );
}
