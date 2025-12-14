import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ShareLinkAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const acceptLink = async () => {
      // Check if user is logged in
      if (!user) {
        // Store the share link token to redirect after login
        localStorage.setItem('pendingShareToken', token);
        setLoading(false);
        return;
      }

      // User is logged in, attempt to accept the share link
      try {
        setLoading(true);
        await documentsAPI.acceptShareLink(token);
        setSuccess(true);
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err) {
        console.error('Error accepting share link:', err);
        console.error('Error response:', err.response?.data);
        if (err.response?.status === 404) {
          setError('This share link is invalid or has expired.');
        } else if (err.response?.status === 400) {
          const errorDetail = err.response?.data?.detail || 'Bad request';
          console.log('Error detail:', errorDetail);
          
          // Check if it's a role conflict message (already a collaborator with same role)
          if (errorDetail.includes('already a') && errorDetail.includes('on this document')) {
            // User already has access with the same role
            setSuccess(true);
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setError(errorDetail);
            setLoading(false);
          }
        } else {
          setError('Failed to accept share link. Please try again.');
          setLoading(false);
        }
      }
    };

    acceptLink();
  }, [token, user, navigate]);

  // Shared Layout Wrapper
  const LayoutWrapper = ({ children }) => (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      {/* Brand Watermark */}
      <div className="absolute top-8 left-8 flex items-center gap-3 opacity-50">
        <div className="w-6 h-6 bg-black flex items-center justify-center">
            <div className="w-2 h-2 bg-white"></div>
        </div>
        <span className="text-lg font-black tracking-tighter uppercase">CollabDocs_</span>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {children}
      </div>
    </div>
  );

  // Common Card Style
  const Card = ({ children, title, subtitle }) => (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      {(title || subtitle) && (
        <div className="mb-8 border-b-2 border-black pb-4">
          {title && <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{title}</h2>}
          {subtitle && <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );

  if (loading && user) {
    return (
      <LayoutWrapper>
        <Card>
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Verifying Token</h2>
            <p className="font-mono text-xs text-gray-500">ESTABLISHING CONNECTION...</p>
          </div>
        </Card>
      </LayoutWrapper>
    );
  }

  if (!user) {
    return (
      <LayoutWrapper>
        <Card title="Invitation" subtitle="Authentication Required">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-2 border-black bg-gray-50 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              You've been invited to collaborate on a secure document.
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-black p-4 mb-8">
            <div className="flex gap-3">
              <div className="text-xl font-bold">!</div>
              <p className="text-xs font-mono font-bold leading-relaxed pt-1">
                ACCESS RESTRICTED: PLEASE IDENTIFY YOURSELF TO PROCEED.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none"
            >
              Login to Accept
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-4 bg-white text-black font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-50 transition-all"
            >
              Create Account
            </button>
          </div>
          
          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <p className="font-mono text-[10px] text-gray-400">SESSION ID: {token?.substring(0, 8).toUpperCase()}...</p>
          </div>
        </Card>
      </LayoutWrapper>
    );
  }

  if (success) {
    return (
      <LayoutWrapper>
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Access Granted</h2>
            <p className="text-sm font-bold text-gray-600 mb-6">You are now a collaborator.</p>
            
            <div className="inline-block px-4 py-2 border border-black bg-gray-50">
              <p className="font-mono text-xs animate-pulse">REDIRECTING_TO_WORKSPACE...</p>
            </div>
          </div>
        </Card>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <Card title="Error" subtitle="400 Bad Request">
          <div className="text-center py-4">
             <div className="w-16 h-16 border-2 border-red-600 bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <p className="text-lg font-bold text-black mb-8 leading-tight">
              {error}
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-white text-black font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px]"
            >
              Return to Dashboard
            </button>
          </div>
        </Card>
      </LayoutWrapper>
    );
  }

  return null;
}

export default ShareLinkAccept;