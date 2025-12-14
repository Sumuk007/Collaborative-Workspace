import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';

const DocumentEditor = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const doc = await documentsAPI.getById(id);
      
      // Fetch collaborators to determine user role
      const collaborators = await documentsAPI.getCollaborators(id);
      console.log('Collaborators:', collaborators);
      console.log('Current user ID:', user.id);
      const currentUserCollab = collaborators.find(c => c.user_id === user.id);
      console.log('Current user collaborator:', currentUserCollab);
      const role = currentUserCollab?.role || null;
      console.log('Setting user role to:', role);
      setUserRole(role);
      
      setDocument(doc);
      setTitle(doc.title);
      setContent(doc.content || '');
      setLastSaved(new Date(doc.updated_at));
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError('Failed to load document. You may not have access.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const updated = await documentsAPI.update(id, {
        title: title.trim() || 'Untitled Document',
        content: content
      });
      setDocument(updated);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save document:', err);
      setError('Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-lg">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = document?.owner_id === user?.id;
  const canEdit = userRole === 'owner' || userRole === 'editor';

  console.log('User role:', userRole);
  console.log('Can edit:', canEdit);
  console.log('Is owner:', isOwner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Header */}
      <nav className="bg-gray-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">CollabDocs</span>
            </div>

            <div className="flex items-center gap-4">
              {lastSaved && (
                <p className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleString()}
                </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              )}
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                >
                  Delete
                </button>
              )}
              
              {/* Profile Dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 hover:from-gray-600 hover:via-gray-700 hover:to-gray-800 hover:shadow-xl transition-all duration-200 ring-2 ring-gray-300"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-50/80 backdrop-blur-sm text-gray-800 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-lg border border-gray-200/50 z-30">
                    @{user?.username || user?.email?.split('@')[0]}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]">
                      <div className="border-[5px] border-transparent border-b-gray-50/80"></div>
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowProfileMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-4 text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold truncate">{user?.username}</p>
                            <p className="text-sm text-gray-200/80 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150 flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
      </nav>

      {/* Editor */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Title Editor */}
          <div className="border-b border-gray-200 p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              disabled={!canEdit}
              className="w-full text-3xl font-bold text-gray-800 placeholder-gray-400 outline-none disabled:bg-transparent"
            />
          </div>

          {/* Content Editor */}
          <div className="p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your document..."
              disabled={!canEdit}
              className="w-full min-h-[600px] text-base text-gray-700 placeholder-gray-400 outline-none resize-none disabled:bg-transparent"
            />
          </div>
        </div>

        {/* Document Info */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Document Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <p className="font-semibold text-gray-800">{new Date(document?.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <p className="font-semibold text-gray-800">{new Date(document?.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Owner:</span>
              <p className="font-semibold text-gray-800">{isOwner ? 'You' : 'Someone else'}</p>
            </div>
            <div>
              <span className="text-gray-500">Your Role:</span>
              <p className="font-semibold text-gray-800">
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
