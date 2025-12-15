import { useState } from 'react';
import { documentsAPI } from '../services/api';

const ShareDocumentDialog = ({ isOpen, onClose, doc, onShareSuccess }) => {
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !doc) return null;

  const handleShare = async () => {
    try {
      setLoading(true);
      // Create share link
      const shareData = await documentsAPI.createShareLink(doc.id, {
        role: role,
        expires_in_hours: null // No expiration
      });
      
      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/share/${shareData.token}`;
      await navigator.clipboard.writeText(shareUrl);
      
      setCopied(true);
      
      // Call onShareSuccess callback to refresh data
      if (onShareSuccess) {
        onShareSuccess();
      }
      
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    } catch (error) {
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/90 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Window */}
      <div 
        className="relative bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* System Header Bar */}
        <div className="bg-black text-white px-4 py-2 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-mono text-xs uppercase tracking-widest">system: generate_link</span>
          </div>
          <button 
            onClick={onClose} 
            className="hover:text-gray-300 font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Share Access</h2>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest truncate">
              Target: {doc.title}
            </p>
          </div>
          
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest mb-4">
              Permission Level
            </label>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setRole('editor')}
                className={`group relative p-4 border-2 text-left transition-all duration-200 ${
                  role === 'editor' 
                    ? 'border-black bg-black text-white' 
                    : 'border-black bg-white text-black hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editor
                  </div>
                  {role === 'editor' && <div className="w-2 h-2 bg-white"></div>}
                </div>
                <div className={`text-[10px] font-mono mt-1 ${role === 'editor' ? 'text-gray-400' : 'text-gray-500'}`}>
                  FULL READ / WRITE ACCESS
                </div>
              </button>

              <button
                onClick={() => setRole('reader')}
                className={`group relative p-4 border-2 text-left transition-all duration-200 ${
                  role === 'reader' 
                    ? 'border-black bg-black text-white' 
                    : 'border-black bg-white text-black hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Viewer
                  </div>
                  {role === 'reader' && <div className="w-2 h-2 bg-white"></div>}
                </div>
                <div className={`text-[10px] font-mono mt-1 ${role === 'reader' ? 'text-gray-400' : 'text-gray-500'}`}>
                  READ ONLY PERMISSION
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={handleShare}
            disabled={loading}
            className={`w-full py-4 font-bold text-sm uppercase tracking-widest border-2 border-black transition-all flex items-center justify-center gap-3 ${
              copied 
                ? 'bg-white text-black shadow-none' 
                : 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] hover:bg-gray-900'
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Generate & Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentDialog;