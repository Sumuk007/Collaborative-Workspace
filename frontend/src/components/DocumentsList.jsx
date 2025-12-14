import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import ShareDocumentDialog from './ShareDocumentDialog';
import ViewCollaboratorsDialog from './ViewCollaboratorsDialog';

const DocumentsList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState(null);
  const [openOptionsMenu, setOpenOptionsMenu] = useState(null);
  const [showCollaboratorsDialog, setShowCollaboratorsDialog] = useState(false);
  const [selectedDocForCollaborators, setSelectedDocForCollaborators] = useState(null);

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

  const handleBack = () => {
    navigate('/');
  };

  const handleDocumentClick = (docId) => {
    navigate(`/document/${docId}`);
  };

  const handleViewCollaborators = async (e, doc) => {
    e.stopPropagation();
    setOpenOptionsMenu(null);
    setSelectedDocForCollaborators(doc);
    setShowCollaboratorsDialog(true);
  };

  const handleDeleteDocument = async (e, doc) => {
    e.stopPropagation();
    setOpenOptionsMenu(null);
    
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      await documentsAPI.delete(doc.id);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
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

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            All Documents
          </h1>
          <p className="text-xl text-white/70">
            Browse and manage all your documents
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-12 py-3.5 text-sm bg-transparent text-white placeholder-white/50 outline-none"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateDocument}
            className="px-6 py-3.5 text-sm font-semibold text-white bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        {/* Documents Grid */}
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-base text-gray-500 mt-4">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base text-gray-500">
                {searchQuery ? 'No documents found matching your search' : 'No documents yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchQuery ? 'Try a different search term' : 'Create your first document to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredDocuments.map((doc) => {
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer group relative"
                  >
                    {/* Share Icon, Options Menu and Owner Badge - Top Right */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      {doc.owner_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForShare(doc);
                            setShowShareDialog(true);
                          }}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                          title="Share document"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      )}
                      
                      {/* 3-dot Options Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptionsMenu(openOptionsMenu === doc.id ? null : doc.id);
                          }}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                          title="Options"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Options Dropdown */}
                        {openOptionsMenu === doc.id && (
                          <>
                            <div 
                              className="fixed inset-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenOptionsMenu(null);
                              }}
                            ></div>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                              <button
                                onClick={(e) => handleViewCollaborators(e, doc)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                View Collaborators
                              </button>
                              {doc.owner_id === user.id && (
                                <button
                                  onClick={(e) => handleDeleteDocument(e, doc)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Document
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        doc.owner_id === user.id
                          ? 'bg-gray-100 text-gray-600'
                          : doc.userRole === 'editor'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-600'
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
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-gray-100">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
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

      {/* View Collaborators Dialog */}
      {showCollaboratorsDialog && selectedDocForCollaborators && (
        <ViewCollaboratorsDialog
          document={selectedDocForCollaborators}
          onClose={() => {
            setShowCollaboratorsDialog(false);
            setSelectedDocForCollaborators(null);
          }}
        />
      )}
    </div>
  );
};

export default DocumentsList;
