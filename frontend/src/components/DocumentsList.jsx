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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const docs = await documentsAPI.getAll(0, 100);
      
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

  const handleDeleteDocument = (e, doc) => {
    e.stopPropagation();
    setOpenOptionsMenu(null);
    setDocumentToDelete(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    setShowDeleteDialog(false);
    try {
      await documentsAPI.delete(documentToDelete.id);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDocumentToDelete(null);
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
       {/* Background Texture */}
       <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Navigation Bar */}
      <nav className="border-b-2 border-black sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <div className="w-3 h-3 bg-white"></div>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">CollabDocs_</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="group flex items-center gap-4 pl-4 py-1 pr-1 cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold uppercase tracking-wide leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {user?.username || 'USER_01'}</p>
              </div>
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all">
                 <span className="font-bold font-mono text-lg">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                  <div className="p-4 border-b-2 border-black bg-gray-50">
                    <p className="font-bold text-sm">Currently signed in as:</p>
                    <p className="font-mono text-xs truncate mt-1">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>Log Out</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full z-10 relative">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-8 group"
        >
          <div className="w-8 h-8 border-2 border-black flex items-center justify-center bg-white group-hover:bg-black group-hover:text-white transition-all">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Return Home</span>
        </button>

        {/* Header */}
        <div className="mb-12 border-b-2 border-black pb-8">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-2">
            Archive<br/>Registry
          </h1>
          <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">
            Full database access and management
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 relative">
             <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH DATABASE..."
              className="w-full h-14 pl-4 pr-12 bg-white border-2 border-black text-black font-bold placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
            {searchQuery ? (
               <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-red-600"
              >
                ✕
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>

          <button
            onClick={handleCreateDocument}
            className="h-14 px-8 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none whitespace-nowrap"
          >
            + Create New
          </button>
        </div>

        {/* Documents Grid */}
        <div>
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-8 flex items-center gap-3">
              <span className="font-bold text-red-600">ERROR:</span>
              <span className="font-mono text-sm text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-50">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-mono text-sm uppercase">Accessing Records...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center rounded-full border border-gray-300">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-bold uppercase mb-2">
                {searchQuery ? 'Search yielded no results' : 'Registry Empty'}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                {searchQuery ? 'Refine your query parameters.' : 'Initialize a new document to begin.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => {
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className="group relative bg-white border-2 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:-translate-x-1"
                  >
                    {/* Card Header: Actions & Role */}
                    <div className="flex justify-between items-start p-4 border-b-2 border-black bg-gray-50">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 border border-black ${
                          doc.owner_id === user.id ? 'bg-black text-white' : 'bg-white text-black'
                        }`}>
                           {doc.owner_id === user.id ? 'OWNER' : (doc.userRole || 'SHARED')}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 z-10">
                            {doc.owner_id === user.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocForShare(doc);
                                    setShowShareDialog(true);
                                  }}
                                  className="p-1 hover:bg-black hover:text-white transition-colors"
                                  title="Share"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                </button>
                            )}

                            <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenOptionsMenu(openOptionsMenu === doc.id ? null : doc.id);
                                  }}
                                  className={`p-1 transition-colors ${openOptionsMenu === doc.id ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
                                >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                   </svg>
                                </button>

                                {openOptionsMenu === doc.id && (
                                  <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                                     <button
                                      onClick={(e) => handleViewCollaborators(e, doc)}
                                      className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white border-b border-gray-100 transition-colors"
                                    >
                                      Collaborators
                                    </button>
                                    {doc.owner_id === user.id && (
                                      <button
                                        onClick={(e) => handleDeleteDocument(e, doc)}
                                        className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold leading-tight mb-4 line-clamp-2 min-h-[3.5rem]">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <p className="text-xs font-mono text-gray-500">
                          UPDATED: {new Date(doc.updated_at).toLocaleDateString()}
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
            <div className="mt-12 pt-8 border-t-2 border-gray-100 text-center">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded">
                Index Count: {filteredDocuments.length} / {documents.length}
              </span>
            </div>
          )}
        </div>
      </main>

       {/* Footer */}
       <footer className="bg-black text-white mt-auto z-10 relative">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-white/20 pb-16">
            <div className="md:col-span-2">
              <h4 className="text-3xl font-black uppercase tracking-tighter mb-6">CollabDocs_</h4>
              <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
                A minimal, high-performance document collaboration platform designed for teams who value clarity over clutter. Built for the modern web.
              </p>
            </div>
            
            {/* <div>
              <h5 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">Platform</h5>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="#" className="hover:text-gray-400 transition-colors">Overview</a></li>
                <li><a href="#" className="hover:text-gray-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-400 transition-colors">API Status</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">Legal</h5>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gray-400 transition-colors">Security</a></li>
              </ul>
            </div> */}
            
            <div>
              <h5 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">Features</h5>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="/" className="hover:text-gray-400 transition-colors">Real-time Editing</a></li>
                <li><a href="/" className="hover:text-gray-400 transition-colors">Collaboration</a></li>
                <li><a href="/" className="hover:text-gray-400 transition-colors">Share Links</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">Resources</h5>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="/" className="hover:text-gray-400 transition-colors">Home</a></li>
                <li><a href="/forgot-password" className="hover:text-gray-400 transition-colors">Reset Password</a></li>
                <li><a href="/" className="hover:text-gray-400 transition-colors">Help & Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs text-gray-500">
            <p>© {new Date().getFullYear()} COLLABDOCS INC. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* Create Document Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={handleCancelCreate}></div>
          <div className="relative bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tight">New Document</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 mb-6 text-sm font-bold border border-red-200">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label htmlFor="docTitle" className="block text-xs font-bold uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                id="docTitle"
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmCreate()}
                placeholder="Project Name..."
                autoFocus
                className="w-full bg-gray-50 border-2 border-gray-200 p-4 font-bold focus:border-black focus:outline-none focus:ring-0 transition-colors text-lg placeholder:font-normal"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                className="flex-1 py-4 font-bold border-2 border-transparent hover:border-black transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreate}
                disabled={creating || !newDocTitle.trim()}
                className="flex-1 py-4 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {creating ? (
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'CREATE'
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Monochrome Backdrop */}
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" onClick={cancelDelete}></div>

  {/* Modal Window */}
  <div className="relative bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
    
    {/* System Header */}
    <div className="bg-black text-white px-4 py-2 flex justify-between items-center select-none">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest animate-pulse">⚠ SYSTEM: DELETE_PROTOCOL</span>
      </div>
    </div>

    <div className="p-8">
      {/* Title Section */}
      <div className="mb-8">
        <h3 className="text-5xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          Final<br/>Purge?
        </h3>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
          This operation destroys data permanently.
        </p>
      </div>

      {/* Target Document Box */}
      <div className="mb-8 border-2 border-black p-4 bg-gray-50 relative overflow-hidden">
        {/* Striped texture */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Target Resource</p>
          <p className="font-bold text-lg text-black truncate leading-none">
            "{documentToDelete.title}"
          </p>
        </div>
      </div>

      {/* Consequences List */}
      <div className="mb-8">
        <ul className="text-xs font-bold space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">1</div>
            <span className="uppercase">Content will be erased</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">2</div>
            <span className="uppercase">Access revoked for all users</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">3</div>
            <span className="uppercase">Links become invalid</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={confirmDelete}
          className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none group"
        >
          <span className="group-hover:hidden">Confirm Deletion</span>
          <span className="hidden group-hover:inline-block">Execute Delete</span>
        </button>
        <button
          onClick={cancelDelete}
          className="w-full py-4 bg-white text-black font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-100 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
      )}
    </div>
  );
};

export default DocumentsList;