import { useState, useEffect, useMemo } from 'react';
import { documentsAPI } from '../services/api';

const ViewCollaboratorsDialog = ({ document, onClose }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  useEffect(() => {
    fetchCollaborators();

    // Close on Escape key
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [document?.id, onClose]);

  const fetchCollaborators = async () => {
    if (!document?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await documentsAPI.getCollaborators(document.id);
      setCollaborators(data);
    } catch (err) {
      console.error('Failed to fetch collaborators:', err);
      setError('Failed to load collaborators. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : '??';
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner': return 'bg-black text-white border-black';
      case 'editor': return 'bg-white text-black border-black';
      case 'reader': return 'bg-gray-100 text-gray-500 border-gray-300';
      default: return 'bg-white text-black border-black';
    }
  };

  const filteredCollaborators = useMemo(() => {
    if (!searchTerm) return collaborators;
    const lowerTerm = searchTerm.toLowerCase();
    return collaborators.filter(c => 
      c.username.toLowerCase().includes(lowerTerm) || 
      c.email.toLowerCase().includes(lowerTerm)
    );
  }, [collaborators, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/90 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Window */}
      <div 
        className="relative bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* System Header Bar */}
        <div className="bg-black text-white px-4 py-2 flex justify-between items-center select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest">system: access_control</span>
          </div>
          <button 
            onClick={onClose} 
            className="hover:text-gray-300 font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Header Content */}
        <div className="px-8 py-6 border-b-2 border-black shrink-0">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-1 truncate">{document?.title}</h2>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Collaborator Registry</p>
        </div>

        {/* Search Bar */}
        {!loading && !error && collaborators.length > 0 && (
          <div className="px-8 py-4 bg-gray-50 border-b-2 border-black shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="FILTER BY NAME OR ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-white border-2 border-black text-sm font-bold placeholder:text-gray-400 placeholder:font-mono focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {error && (
            <div className="bg-red-50 border-2 border-red-600 p-4 mb-4 flex items-center gap-3">
              <span className="font-bold text-red-600 text-xl">!</span>
              <span className="font-mono text-xs font-bold text-red-700 uppercase">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-2 border-gray-100 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 w-1/3"></div>
                    <div className="h-3 bg-gray-200 w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-black font-bold uppercase tracking-wide">
                {searchTerm ? 'No matches found' : 'Registry Empty'}
              </p>
              <p className="text-xs font-mono text-gray-500 mt-2">
                {searchTerm ? 'Adjust filter parameters.' : 'Share document to populate list.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCollaborators.map((collaborator) => (
                <div
                  key={collaborator.user_id}
                  className="group flex items-center gap-4 p-4 border-2 border-black hover:bg-black hover:text-white transition-all duration-200"
                >
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 border-2 border-black bg-white text-black flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:border-white">
                    {getInitials(collaborator.username)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold uppercase tracking-wide truncate">
                        {collaborator.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono truncate opacity-60 group-hover:opacity-80">{collaborator.email}</p>
                      <button 
                        onClick={() => handleCopyEmail(collaborator.email)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
                        title="Copy Email"
                      >
                         {copiedEmail === collaborator.email ? (
                           <span className="text-[10px] font-bold text-green-400">COPIED</span>
                         ) : (
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                         )}
                      </button>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-2 ${getRoleBadgeStyle(collaborator.role)} group-hover:bg-white group-hover:text-black group-hover:border-white`}>
                    {collaborator.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t-2 border-black bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${!loading && filteredCollaborators.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
             <p className="font-mono text-xs font-bold text-gray-500 uppercase">
                {!loading && filteredCollaborators.length > 0 && (
                  <>{filteredCollaborators.length} Active User{filteredCollaborators.length !== 1 ? 's' : ''}</>
                )}
             </p>
          </div>
          
          <button
            onClick={onClose}
            className="px-8 py-3 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCollaboratorsDialog;