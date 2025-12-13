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
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Share "{doc.title}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Permission
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setRole('editor')}
              className={`flex-1 p-3 rounded-lg border-2 transition-all text-left ${
                role === 'editor' 
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editor
              </div>
              <div className="text-xs opacity-75 mt-1">Can view and edit document</div>
            </button>
            <button
              onClick={() => setRole('reader')}
              className={`flex-1 p-3 rounded-lg border-2 transition-all text-left ${
                role === 'reader' 
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Viewer
              </div>
              <div className="text-xs opacity-75 mt-1">Can only view document</div>
            </button>
          </div>
        </div>

        <button
          onClick={handleShare}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            copied 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Link Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Copy Share Link
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ShareDocumentDialog;
