import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';

const DocumentEditor = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const contentEditableRef = useRef(null);
  
  const [currentDocument, setCurrentDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [currentFontSize, setCurrentFontSize] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    blockquote: false,
  });

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    // Listen for selection changes to update format state
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

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
      
      setCurrentDocument(doc);
      setTitle(doc.title);
      setContent(doc.content || '');
      setLastSaved(new Date(doc.updated_at));
      
      // Set contentEditable content
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = doc.content || '';
      }
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
      const htmlContent = contentEditableRef.current?.innerHTML || '';
      const updated = await documentsAPI.update(id, {
        title: title.trim() || 'Untitled Document',
        content: htmlContent
      });
      setCurrentDocument(updated);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save document:', err);
      setError('Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = (command, value = null) => {
    const editor = contentEditableRef.current;
    if (!editor) return;
    
    editor.focus();
    
    try {
      // Special handling for blockquote toggle
      if (command === 'formatBlock' && value === 'blockquote') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node = selection.getRangeAt(0).startContainer;
          let isInBlockquote = false;
          
          // Check if we're already in a blockquote
          while (node && node !== editor) {
            if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BLOCKQUOTE') {
              isInBlockquote = true;
              break;
            }
            node = node.parentNode;
          }
          
          if (isInBlockquote) {
            // Remove blockquote by converting to paragraph
            document.execCommand('formatBlock', false, 'p');
          } else {
            // Apply blockquote
            document.execCommand(command, false, value);
          }
        }
      } else {
        document.execCommand(command, false, value);
      }
      setHasUnsavedChanges(true);
    } catch (err) {
      console.error('Format error:', err);
    }
  };

  const applyFontSize = (size) => {
    const editor = contentEditableRef.current;
    if (!editor) return;
    
    editor.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    try {
      if (selection.isCollapsed) {
        // No text selected - insert a span and place cursor inside it for typing
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        span.innerHTML = '&nbsp;'; // Zero-width space to place cursor
        
        range.insertNode(span);
        
        // Move cursor inside the span
        const newRange = document.createRange();
        newRange.setStart(span.firstChild, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Text is selected - wrap it
        const contents = range.extractContents();
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        span.appendChild(contents);
        range.insertNode(span);
        
        // Select the newly styled text
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      setHasUnsavedChanges(true);
      editor.focus();
    } catch (err) {
      console.error('Font size error:', err);
    }
  };

  const handleContentChange = () => {
    setHasUnsavedChanges(true);
    updateFormatState();
  };

  const updateFormatState = () => {
    const editor = contentEditableRef.current;
    if (!editor) return;

    try {
      // Check if inside blockquote
      let isInBlockquote = false;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node = selection.getRangeAt(0).startContainer;
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BLOCKQUOTE') {
            isInBlockquote = true;
            break;
          }
          node = node.parentNode;
        }
      }

      // Update format button states
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        blockquote: isInBlockquote,
      });

      // Get current font size
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        // Traverse up to find font size
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            const fontSize = window.getComputedStyle(element).fontSize;
            if (fontSize) {
              // Convert to px if needed and extract number
              const sizeMatch = fontSize.match(/(\d+)/);
              if (sizeMatch) {
                setCurrentFontSize(sizeMatch[1]);
                return;
              }
            }
          }
          node = node.parentNode;
        }
      }
      setCurrentFontSize('16'); // Default size
    } catch (err) {
      console.error('Error updating format state:', err);
    }
  };

  const handleSelectionChange = () => {
    updateFormatState();
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/');
      setShowExitDialog(true);
    } else {
      navigate('/');
    }
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const cancelExit = () => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  };

  const saveAndExit = async () => {
    await handleSave();
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await documentsAPI.delete(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm uppercase">Loading Workspace...</p>
      </div>
    );
  }

  if (error && !currentDocument) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center p-6">
        <div className="w-full max-w-md border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 border-2 border-black bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-black">!</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-2">Access Denied</h2>
          <p className="text-gray-600 font-mono text-sm text-center mb-8">{error}</p>
          <button
            onClick={handleBack}
            className="w-full py-3 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentDocument?.owner_id === user?.id;
  const canEdit = userRole === 'owner' || userRole === 'editor';

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

          <div className="flex items-center gap-4">
             {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <span className="hidden md:inline-block px-3 py-1 bg-yellow-300 text-black text-xs font-bold uppercase tracking-wide border border-black animate-pulse">
                Unsaved Changes
              </span>
            )}
            
            {/* Saving Indicator */}
            {saving && (
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <span className="w-2 h-2 bg-black rounded-full animate-ping"></span>
                Saving...
              </span>
            )}

            {/* Save Button */}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-black text-white font-bold text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
              >
                Save
              </button>
            )}

             {/* Delete Button (Owner) */}
             {isOwner && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 font-bold text-xs uppercase tracking-widest border-2 border-transparent hover:bg-red-50 hover:border-red-600 transition-all hidden sm:block"
                >
                  Delete
                </button>
              )}

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="group flex items-center gap-4 pl-4 py-1 pr-1 cursor-pointer"
              >
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all">
                   <span className="font-bold font-mono text-lg">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              </button>

              {/* Profile Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                    <div className="p-4 border-b-2 border-black bg-gray-50">
                      <p className="font-bold text-sm">Signed in as:</p>
                      <p className="font-mono text-xs truncate mt-1">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-between group"
                    >
                      <span>Log Out</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Editor Container */}
      <div className="max-w-5xl mx-auto px-6 py-12 w-full z-10 relative">
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
          <span className="text-sm font-bold uppercase tracking-widest">Return</span>
        </button>

        {error && (
          <div className="bg-red-50 border-2 border-red-600 p-4 mb-8 flex items-center gap-3">
             <span className="font-bold text-red-600">ERROR:</span>
             <span className="font-mono text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          {/* Title Editor */}
          <div className="border-b-2 border-black p-6 bg-white">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="UNTITLED PROJECT..."
              disabled={!canEdit}
              className="w-full text-4xl font-black text-black placeholder-gray-300 outline-none uppercase tracking-tighter bg-transparent"
            />
          </div>

          {/* Formatting Toolbar */}
          {canEdit && (
            <div className="border-b-2 border-black px-4 py-3 bg-gray-50 flex items-center gap-4 flex-wrap sticky top-20 z-20">
              {/* Font Size */}
              <div className="flex items-center gap-2 pr-4 border-r-2 border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Size</span>
                <select
                  value={currentFontSize}
                  onChange={(e) => {
                    const size = e.target.value;
                    if (size) {
                      applyFontSize(size);
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono font-bold border-2 border-black bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                </select>
              </div>

              {/* Font Styles */}
              <div className="flex items-center gap-1 pr-4 border-r-2 border-gray-200">
                 {['bold', 'italic', 'underline'].map((format) => (
                    <button
                      key={format}
                      onClick={() => handleFormat(format)}
                      className={`p-2 border border-transparent hover:border-black transition-all ${activeFormats[format] ? 'bg-black text-white' : 'hover:bg-white text-black'}`}
                      title={format.charAt(0).toUpperCase() + format.slice(1)}
                    >
                        {format === 'bold' && <strong className="font-bold">B</strong>}
                        {format === 'italic' && <em className="italic font-serif">I</em>}
                        {format === 'underline' && <span className="underline">U</span>}
                    </button>
                 ))}
              </div>

              {/* Text Alignment */}
              <div className="flex items-center gap-1 pr-4 border-r-2 border-gray-200">
                 {[
                   { id: 'justifyLeft', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 6h18M3 12h12M3 18h18" /> },
                   { id: 'justifyCenter', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 6h18M6 12h12M3 18h18" /> },
                   { id: 'justifyRight', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 6h18M9 12h12M3 18h18" /> },
                   { id: 'justifyFull', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" /> }
                 ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleFormat(btn.id)}
                      className={`p-2 border border-transparent hover:border-black transition-all ${activeFormats[btn.id] ? 'bg-black text-white' : 'hover:bg-white text-black'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {btn.icon}
                      </svg>
                    </button>
                 ))}
              </div>

              {/* Lists and Quote */}
              <div className="flex items-center gap-1">
                 {[
                   { id: 'insertUnorderedList', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M1 6h.01M1 12h.01M1 18h.01" /> },
                   { id: 'insertOrderedList', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14M2 6h.01M2 12h.01M2 18h.01" /> },
                   { id: 'blockquote', icon: <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />, isBlock: true }
                 ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleFormat(btn.isBlock ? 'formatBlock' : btn.id, btn.isBlock ? 'blockquote' : null)}
                      className={`p-2 border border-transparent hover:border-black transition-all ${activeFormats[btn.id] ? 'bg-black text-white' : 'hover:bg-white text-black'}`}
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {btn.icon}
                      </svg>
                    </button>
                 ))}
              </div>
            </div>
          )}

          {/* Content Editor */}
          <div className="p-8 md:p-12 min-h-[600px] bg-white">
            <style>{`
              [contenteditable] ul { list-style-type: square; margin-left: 20px; padding-left: 20px; }
              [contenteditable] ol { list-style-type: decimal-leading-zero; margin-left: 20px; padding-left: 20px; font-family: monospace; }
              [contenteditable] blockquote { border-left: 4px solid #000; padding-left: 16px; margin-left: 0; font-family: monospace; background-color: #f9fafb; padding: 1rem; }
              [contenteditable] li { margin: 8px 0; }
              [contenteditable]:focus { outline: none; }
            `}</style>
            <div
              ref={contentEditableRef}
              contentEditable={canEdit}
              onInput={handleContentChange}
              className="w-full h-full text-base text-black outline-none font-serif leading-relaxed"
              style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
              suppressContentEditableWarning={true}
            >
            </div>
            {!canEdit && (
              <div className="mt-8 p-4 border border-black bg-gray-50 text-xs font-mono font-bold text-center">
                READ-ONLY MODE ENABLED
              </div>
            )}
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
            <div className="relative bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-0 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-black text-white px-4 py-2 flex justify-between items-center">
                 <span className="font-mono text-xs uppercase tracking-widest">system: confirm_exit</span>
              </div>
              <div className="p-8">
                  <h3 className="text-2xl font-black uppercase mb-4">Unsaved Data</h3>
                  <p className="font-mono text-sm text-gray-600 mb-8">
                    Modifications detected. Aborting now will result in data loss.
                  </p>
                  <div className="flex flex-col gap-3">
                     <button
                      onClick={saveAndExit}
                      className="w-full py-3 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Save & Exit
                    </button>
                    <div className="flex gap-3">
                       <button
                        onClick={cancelExit}
                        className="flex-1 py-3 bg-white text-black font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmExit}
                        className="flex-1 py-3 bg-white text-red-600 font-bold text-sm uppercase tracking-widest border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Info Footer */}
        <div className="mt-12 border-t-2 border-black pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs">
           <div>
             <span className="block text-gray-400 mb-1">CREATED</span>
             <span className="font-bold uppercase">{new Date(currentDocument?.created_at).toLocaleString()}</span>
           </div>
           <div>
             <span className="block text-gray-400 mb-1">LAST MODIFIED</span>
             <span className="font-bold uppercase">{new Date(currentDocument?.updated_at).toLocaleString()}</span>
           </div>
           <div>
             <span className="block text-gray-400 mb-1">OWNER</span>
             <span className="font-bold uppercase">{isOwner ? 'You' : 'External'}</span>
           </div>
           <div>
             <span className="block text-gray-400 mb-1">PERMISSION</span>
             <span className="font-bold uppercase bg-black text-white px-2 py-0.5">
               {userRole || 'Loading...'}
             </span>
           </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Monochrome Backdrop */}
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" onClick={cancelDelete}></div>

  {/* Modal Window */}
  <div className="relative bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
    
    {/* System Header */}
    <div className="bg-black text-white px-4 py-2 flex justify-between items-center select-none">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest animate-pulse">⚠ SYSTEM: DESTRUCTION_MODE</span>
      </div>
    </div>

    <div className="p-8">
      {/* Title Section */}
      <div className="mb-8">
        <h3 className="text-5xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          Delete<br/>File?
        </h3>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
          This operation cannot be reversed.
        </p>
      </div>

      {/* Target Document Box */}
      <div className="mb-8 border-2 border-black p-4 bg-gray-50 relative overflow-hidden">
        {/* Striped background effect */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Target Resource</p>
          <p className="font-bold text-lg text-black truncate leading-none">
            "{title || 'Untitled Document'}"
          </p>
        </div>
      </div>

      {/* Consequences List */}
      <div className="mb-8">
        <ul className="text-xs font-bold space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">1</div>
            <span className="uppercase">Permanently erase content</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">2</div>
            <span className="uppercase">Revoke all share links</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] font-mono">3</div>
            <span className="uppercase">Remove collaborator access</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={confirmDelete}
          className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none group"
        >
          <span className="group-hover:hidden">Confirm Delete</span>
          <span className="hidden group-hover:inline-block">Execute Deletion</span>
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

export default DocumentEditor;