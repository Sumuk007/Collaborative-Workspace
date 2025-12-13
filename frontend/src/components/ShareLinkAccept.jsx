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

  if (loading && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accepting Invitation</h2>
          <p className="text-gray-600">Please wait while we add you to the document...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <svg className="w-16 h-16 text-cyan-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Document Invitation</h2>
            <p className="text-gray-600">You've been invited to collaborate on a document!</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please login or register to accept this invitation
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Login to Accept
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Create Account
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            After logging in, you'll automatically be added to the shared document
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">You've been added as a collaborator.</p>
          <p className="text-sm text-gray-500">Redirecting to your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default ShareLinkAccept;
