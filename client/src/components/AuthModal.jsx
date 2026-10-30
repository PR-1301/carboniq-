import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Lock,
  Factory,
  BarChart3,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { registerCompany, verifyCompanyOtp, resendCompanyOtp, loginCompany } from '../services/api.js';

export function AuthModal({ onAuthenticated }) {
  const [view, setView] = useState('REGISTER'); // 'REGISTER' | 'OTP' | 'LOGIN'

  // Registration Fields
  const [companyName, setCompanyName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [industryType, setIndustryType] = useState('Manufacturing');
  const [businessSize, setBusinessSize] = useState('Small');
  const [gstin, setGstin] = useState('');

  // OTP Verification
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const payload = {
      companyName,
      businessEmail,
      phoneNumber,
      password,
      industryType,
      businessSize,
      gstin,
    };

    try {
      const res = await registerCompany(payload);
      if (!res.success) {
        throw new Error(res.error || 'Registration failed');
      }

      setOtpEmail(res.businessEmail);
      setOtpPhone(res.phoneNumber);
      setInfoMessage(res.message);
      setView('OTP');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyCompanyOtp({
        businessEmail: otpEmail,
        otp: otp.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'OTP verification failed');
      }

      if (onAuthenticated) {
        onAuthenticated(res.company, res.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resendCompanyOtp({ businessEmail: otpEmail });
      if (!res.success) {
        throw new Error(res.error || 'Failed to resend OTP');
      }
      setInfoMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginCompany({
        businessEmail: loginEmail,
        password: loginPassword,
      });

      if (!res.success) {
        if (res.requiresOtp) {
          setOtpEmail(res.businessEmail);
          setOtpPhone(res.phoneNumber);
          setView('OTP');
          setInfoMessage('Phone verification is pending. An OTP has been logged to the server terminal console.');
          return;
        }
        throw new Error(res.error || 'Login failed');
      }

      if (onAuthenticated) {
        onAuthenticated(res.company, res.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Top Brand Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-2xl shadow-inner">
              C
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">CarbonIQ India</h2>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-mono">
                  SME Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI-Powered Carbon Footprint Accounting & Document Ingestion for Indian SMEs (₹ INR)
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {view === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Register New Indian SME</h3>
                <button
                  type="button"
                  onClick={() => {
                    setView('LOGIN');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Already registered? Log in
                </button>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Business Name <span className="text-emerald-400">*</span>
                  <span className="text-slate-500 font-normal ml-1">(Identify the SME)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Precision Auto Ancillaries Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Email <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="accounts@apexauto.in"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number <span className="text-emerald-400">*</span>
                    <span className="text-slate-500 font-normal ml-1">(OTP verification)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password <span className="text-emerald-400">*</span>
                  <span className="text-slate-500 font-normal ml-1">(Secure account access)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Industry Type & Business Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Industry Type <span className="text-emerald-400">*</span>
                    <span className="text-slate-500 font-normal ml-1">(Emissions profile)</span>
                  </label>
                  <select
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Textiles & Garments">Textiles & Garments</option>
                    <option value="Chemicals & Pharmaceuticals">Chemicals & Pharmaceuticals</option>
                    <option value="Food Processing & FMCG">Food Processing & FMCG</option>
                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                    <option value="IT & Software Services">IT & Software Services</option>
                    <option value="Agriculture & Agribusiness">Agriculture & Agribusiness</option>
                    <option value="Retail & Wholesale Distribution">Retail & Wholesale Distribution</option>
                    <option value="Construction & Engineering">Construction & Engineering</option>
                    <option value="Automotive & Ancillary">Automotive & Ancillary</option>
                    <option value="Metal & Fabrication">Metal & Fabrication</option>
                    <option value="Other">Other SME</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Size <span className="text-emerald-400">*</span>
                    <span className="text-slate-500 font-normal ml-1">(Classify SME)</span>
                  </label>
                  <select
                    value={businessSize}
                    onChange={(e) => setBusinessSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Small">Small Enterprise</option>
                    <option value="Medium">Medium Enterprise</option>
                    <option value="Emerging">Emerging Business</option>
                  </select>
                </div>
              </div>

              {/* GSTIN / Business Registration Number */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GSTIN / Business Registration Number
                  <span className="text-slate-500 font-normal ml-1">(Verify business identity)</span>
                </label>
                <div className="relative">
                  <FileCheck2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5 or Udyam / CIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Verification OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Register SME & Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: OTP VERIFICATION */}
          {view === 'OTP' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="h-12 w-12 rounded-full bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">Enter Verification OTP</h3>
                <p className="text-xs text-slate-400">
                  A 6-digit OTP has been dispatched for phone verification ({otpPhone || otpEmail}).
                </p>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300 mt-2">
                  🔒 <strong>Server Security Log:</strong> For development and security compliance, the OTP has been securely logged to the <strong>backend server terminal console</strong>.
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 text-center mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-48 mx-auto block px-4 py-2.5 text-center tracking-[0.4em] font-mono text-lg rounded-xl bg-slate-800 border-2 border-emerald-600/70 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <span>Verify & Activate Account</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-slate-400 hover:text-emerald-400"
                  >
                    Resend OTP to console
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('REGISTER')}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to Registration
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW: LOGIN */}
          {view === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">SME Account Login</h3>
                <button
                  type="button"
                  onClick={() => {
                    setView('REGISTER');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  New SME? Register here
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="accounts@yourcompany.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log In to CarbonIQ</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
