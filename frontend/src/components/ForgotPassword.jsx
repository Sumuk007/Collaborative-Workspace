import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.requestPasswordReset(email);
      setSuccess(true);
      // In development, the token is returned (in production, it would be sent via email)
      if (response.token) {
        setResetToken(response.token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black font-sans selection:bg-black selection:text-white relative overflow-hidden p-6">
        {/* Background Texture */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Brand Watermark */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center">
              <div className="w-2 h-2 bg-white"></div>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">CollabDocs_</span>
        </div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-500 border-2 border-black flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-center">Check Your Email</h1>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest text-center">Reset instructions sent</p>
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 p-6 mb-8">
              <p className="text-sm text-gray-700 mb-4">
                We've sent password reset instructions to:
              </p>
              <p className="font-bold text-black mb-4">{email}</p>
              <p className="text-xs text-gray-600">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            {/* Development Mode: Show token */}
            {resetToken && (
              <div className="bg-yellow-50 border-2 border-yellow-500 p-4 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-800 mb-2">
                  Development Mode
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  In production, this would be sent via email. For now, use this link:
                </p>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="block w-full text-center py-3 bg-yellow-500 text-black font-bold text-sm uppercase tracking-widest border-2 border-yellow-600 hover:bg-yellow-600 transition-all"
                >
                  Reset Password Now
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="block w-full py-4 text-center bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black font-sans selection:bg-black selection:text-white relative overflow-hidden p-6">
      
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Brand Watermark */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-black flex items-center justify-center">
            <div className="w-2 h-2 bg-white"></div>
        </div>
        <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">CollabDocs_</span>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">
          
          <div className="mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Reset<br/>Password.</h1>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Enter your email to receive reset instructions.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8 flex items-start gap-3">
              <span className="text-red-600 font-bold text-lg leading-none">!</span>
              <span className="text-red-700 text-sm font-bold font-mono">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-black p-4 text-sm font-bold focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:font-normal placeholder:text-gray-400"
                placeholder="user@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t-2 border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-black font-bold uppercase tracking-wide border-b-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
        
        <div className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-mono text-xs font-bold transform rotate-3 shadow-lg">
          PASSWORD_RESET
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
