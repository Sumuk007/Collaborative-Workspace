import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import ShareDocumentDialog from './ShareDocumentDialog';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    collaborations: 0,
    sharedLinks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const docs = await documentsAPI.getAll(0, 100);
      
      // Fetch roles for each document
      const docsWithRoles = await Promise.all(
        docs.map(async (doc) => {
          try {
            const collaborators = await documentsAPI.getCollaborators(doc.id);
            const userCollab = collaborators.find(c => c.user_id === user.id);
            return { ...doc, userRole: userCollab?.role };
          } catch (err) {
            console.error(`Failed to fetch role for document ${doc.id}:`, err);
            return doc;
          }
        })
      );
      
      setDocuments(docsWithRoles);
      
      // Calculate stats
      const totalDocs = docs.length;
      
      // Count documents where user is a collaborator (not owner)
      const collaborationsCount = docs.filter(doc => doc.owner_id !== user.id).length;
      
      // Count total share links across all documents
      let sharedLinksCount = 0;
      for (const doc of docs) {
        if (doc.id) {
          // Note: We'd need a separate endpoint to get share links count
          // For now, we'll set it to 0 or you can add an endpoint
        }
      }
      
      setStats({
        totalDocuments: totalDocs,
        collaborations: collaborationsCount,
        sharedLinks: sharedLinksCount
      });
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateDocument = () => {
    setShowCreateDialog(true);
    setNewDocTitle('');
    setError('');
  };

  const handleConfirmCreate = async () => {
    if (!newDocTitle.trim()) {
      setError('Document title is required');
      return;
    }

    try {
      setCreating(true);
      const newDoc = await documentsAPI.create({
        title: newDocTitle.trim(),
        content: ''
      });
      setShowCreateDialog(false);
      navigate(`/document/${newDoc.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setError('Failed to create document. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateDialog(false);
    setNewDocTitle('');
    setError('');
  };

  const handleViewAllDocuments = () => {
    navigate('/documents');
  };

  const handleDocumentClick = (docId) => {
    navigate(`/document/${docId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">CollabDocs</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-base text-gray-700">
                Welcome, <span className="font-semibold">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Welcome to Your Workspace
          </h1>
          <p className="text-xl text-white/70">
            Start creating and collaborating on documents with your team
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-50 rounded-2xl p-6 shadow-md border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-500">Total Documents</p>
                <p className="text-4xl font-extrabold text-gray-800 mt-2">
                  {loading ? '...' : stats.totalDocuments}
                </p>
              </div>
              <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 shadow-md border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-500">Collaborations</p>
                <p className="text-4xl font-extrabold text-gray-800 mt-2">
                  {loading ? '...' : stats.collaborations}
                </p>
              </div>
              <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 shadow-md border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-500">Shared Links</p>
                <p className="text-4xl font-extrabold text-gray-800 mt-2">
                  {loading ? '...' : stats.sharedLinks}
                </p>
              </div>
              <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="bg-gray-50 rounded-2xl p-8 shadow-md border border-white/10 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Create New Document</h3>
                <p className="text-base text-gray-500 mb-4">
                  Start a new document and invite collaborators to work together
                </p>
                <button 
                  onClick={handleCreateDocument}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  New Document
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-white">Recent Documents</h2>
            <button 
              onClick={handleViewAllDocuments}
              className="text-sm font-semibold text-white/80 hover:text-white flex items-center gap-2 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-base text-white/70 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base text-white/70">No documents yet</p>
              <p className="text-sm text-white/50 mt-2">Create your first document to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px]">
              {documents.slice(0, 5).map((doc, index) => {
                // First item is large (2x2), others are normal (1x1)
                const isFirst = index === 0;
                
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => handleDocumentClick(doc.id)}
                    className={`group relative bg-white rounded-xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-gray-200 flex flex-col
                      ${isFirst ? 'md:col-span-2 md:row-span-2 bg-gradient-to-br from-white to-gray-50' : ''}
                    `}
                  >
                    {/* Share Icon and Owner Badge - Top Right */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      {doc.owner_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForShare(doc);
                            setShowShareDialog(true);
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shadow-sm"
                          title="Share document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg font-medium text-xs border ${
                        doc.owner_id === user.id
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : doc.userRole === 'editor'
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {doc.owner_id === user.id 
                          ? 'Owner' 
                          : doc.userRole 
                          ? doc.userRole.charAt(0).toUpperCase() + doc.userRole.slice(1)
                          : 'Shared'
                        }
                      </span>
                    </div>

                    {/* Document Icon and Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg ${isFirst ? 'bg-cyan-50 text-cyan-600' : 'bg-gray-50 text-gray-500'}`}>
                        <svg className={`${isFirst ? 'w-8 h-8' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className={`font-bold text-gray-800 truncate ${isFirst ? 'text-xl' : 'text-sm'}`}>
                          {doc.title}
                        </h3>
                        {isFirst && (
                          <p className="text-sm text-gray-500 mt-1">
                            Last edited {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Preview - First document only */}
                    {isFirst && (
                      <div className="flex-1 overflow-hidden mb-3">
                        {doc.content ? (
                          <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                            {doc.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No content yet</p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    {!isFirst && (
                      <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Document Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Document</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="docTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                Document Title
              </label>
              <input
                id="docTitle"
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmCreate()}
                placeholder="Enter document title..."
                autoFocus
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:border-gray-700 focus:ring-4 focus:ring-gray-700/10 focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                disabled={creating || !newDocTitle.trim()}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center"
              >
                {creating ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Document Dialog */}
      <ShareDocumentDialog 
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setSelectedDocForShare(null);
        }}
        doc={selectedDocForShare}
        onShareSuccess={fetchDocuments}
      />
    </div>
  );
};

export default Home;
