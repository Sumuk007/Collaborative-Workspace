import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import ShareDocumentDialog from './ShareDocumentDialog';
import ViewCollaboratorsDialog from './ViewCollaboratorsDialog';

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
      
      const totalDocs = docs.length;
      const collaborationsCount = docs.filter(doc => doc.owner_id !== user.id).length;
      let sharedLinksCount = 0;
      
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

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b-2 border-black sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Version 2 Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <div className="w-3 h-3 bg-white"></div>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">CollabDocs_</span>
          </div>

          <div className="relative">
            {/* Modified Profile Button: Removed hover border, added ID text */}
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

      {/* Main Content (Version 1 Layout) */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-8">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
              YOUR <br/> WORKSPACE.
            </h1>
            <p className="text-xl font-medium text-gray-600 max-w-lg">
              Manage your documents, collaborate in real-time, and keep track of your team's progress.
            </p>
          </div>
          
          {/* Stats Box */}
          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Documents</p>
                <p className="text-4xl font-mono font-bold">{stats.totalDocuments}</p>
              </div>
              <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Collabs</p>
                <p className="text-4xl font-mono font-bold">{stats.collaborations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b-2 border-gray-200 pb-8">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Recent Files</h2>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
               <button 
                onClick={handleCreateDocument}
                className="flex-1 md:flex-none px-6 py-3 bg-black text-white font-bold text-sm uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none"
              >
                + Create New
              </button>
            </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="border-2 border-red-600 bg-red-50 text-red-700 p-4 mb-8 font-medium flex items-center gap-3">
            <span className="text-xl">!</span> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm uppercase">Loading Data...</p>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center rounded-full">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No documents found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first entry.</p>
            <button 
              onClick={handleCreateDocument}
              className="text-black font-bold underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              Create Document Now
            </button>
          </div>
        ) : (
          /* Documents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.slice(0, 6).map((doc) => (
              <div 
                key={doc.id}
                onClick={() => handleDocumentClick(doc.id)}
                className="group relative bg-white border-2 border-black p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-gray-100 border border-black flex items-center justify-center text-black">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  {/* Options Menu Trigger */}
                  <div className="flex items-center gap-1">
                     {/* Share Button (Owner Only) */}
                     {doc.owner_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForShare(doc);
                            setShowShareDialog(true);
                          }}
                          className="p-2 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black rounded-sm"
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
                          className={`p-2 transition-colors border border-transparent hover:border-black rounded-sm ${openOptionsMenu === doc.id ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                           </svg>
                        </button>

                         {/* Dropdown Menu */}
                        {openOptionsMenu === doc.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30">
                            <button
                              onClick={(e) => handleViewCollaborators(e, doc)}
                              className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
                            >
                              Collaborators
                            </button>
                            {doc.owner_id === user.id && (
                              <button
                                onClick={(e) => handleDeleteDocument(e, doc)}
                                className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold truncate pr-4">{doc.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className={`${
                      doc.owner_id === user.id ? 'text-black font-bold' : 'text-gray-500'
                    }`}>
                       {doc.owner_id === user.id ? 'OWNER' : (doc.userRole || 'SHARED').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold underline">Open File</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {documents.length > 0 && (
          <div className="mt-12 text-center">
            <button 
              onClick={handleViewAllDocuments}
              className="inline-block border-b-2 border-black pb-1 text-sm font-bold uppercase tracking-widest hover:text-gray-600 hover:border-gray-600 transition-colors"
            >
              View All Archives
            </button>
          </div>
        )}
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
            
            <div>
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
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs text-gray-500">
            <p>© {new Date().getFullYear()} COLLABDOCS INC. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* Create Dialog */}
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

      {/* External Dialogs */}
      <ShareDocumentDialog 
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setSelectedDocForShare(null);
        }}
        doc={selectedDocForShare}
        onShareSuccess={fetchDocuments}
      />

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

export default Home;