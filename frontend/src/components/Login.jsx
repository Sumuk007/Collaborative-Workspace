import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });
    
    if (result.success) {
      // Check if there's a pending share token
      const pendingToken = localStorage.getItem('pendingShareToken');
      if (pendingToken) {
        localStorage.removeItem('pendingShareToken');
        navigate(`/share/${pendingToken}`);
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black font-sans selection:bg-black selection:text-white relative overflow-hidden p-6">
      
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Brand Watermark (Top Left) */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-black flex items-center justify-center">
            <div className="w-2 h-2 bg-white"></div>
        </div>
        <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">CollabDocs_</span>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Main Card */}
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 md:p-12">
          
          <div className="mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Welcome<br/>Back.</h1>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Enter credentials to access workspace.</p>
          </div>

          {successMessage && (
            <div className="bg-green-50 border-2 border-green-600 p-4 mb-8 flex items-start gap-3">
              <span className="text-green-600 font-bold text-lg leading-none">✓</span>
              <span className="text-green-700 text-sm font-bold font-mono">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8 flex items-start gap-3">
              <span className="text-red-600 font-bold text-lg leading-none">!</span>
              <span className="text-red-700 text-sm font-bold font-mono">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-gray-500 hover:text-black underline decoration-1 underline-offset-2 hover:decoration-2">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-black p-4 pr-12 text-sm font-bold focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:font-normal placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-5 h-5 border-2 border-black rounded-none text-black focus:ring-0 focus:ring-offset-0 bg-gray-50 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm font-bold text-gray-700 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-600">
              New to the platform?{' '}
              <Link
                to="/register"
                className="text-black font-bold uppercase tracking-wide border-b-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
        
        {/* Decorative corner tag */}
        <div className="absolute -top-4 -right-4 bg-black text-white px-3 py-1 font-mono text-xs font-bold transform rotate-3 shadow-lg">
          SECURE_LOGIN
        </div>
      </div>
    </div>
  );
};

export default Login;