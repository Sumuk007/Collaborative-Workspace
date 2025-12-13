import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';

const DocumentEditor = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [userRole, setUserRole] = useState(null);

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
      <div className="bg-gray-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {canEdit ? 'Editing' : 'Viewing'}: {document?.title}
                </h1>
                {lastSaved && (
                  <p className="text-xs text-gray-500 mt-1">
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
                  Save
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
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto px-6 py-8">
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
