import React, { useState, useEffect } from 'react';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import { 
  Plus, 
  FileText,
  Search,
  Filter,
  Star,
  StarOff,
  Trash2,
  Edit3,
  Grid3X3,
  List,
  ArrowLeft,
  Users,
  Share2,
  Clock,
  User
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocuments, updateTitle, createDocument as apiCreateDocument, updateDocument, deleteDocument } from '../../services/auth';


const Workspace = ({ workspaceName = "Marketing Team", workspaceColor = "from-blue-500 to-purple-600" }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [renameDocId, setRenameDocId] = useState(null);
  const [renameDocTitle, setRenameDocTitle] = useState('');
  const [deleteDocId, setDeleteDocId] = useState(null);

  const navigate = useNavigate();
  const { workspaceId } = useParams();

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError('');
      try {
        const docs = await getDocuments(workspaceId);
        setDocuments(docs);
      } catch (err) {
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) fetchDocs();
  }, [workspaceId]);


  const documentTypes = [
    { type: 'document', label: 'Document', icon: FileText, color: 'text-blue-400' }
  ];

  const createDocument = async (type, name) => {
    if (!workspaceId) return;
    setLoading(true);
    setError('');
    try {
      const doc = await apiCreateDocument(workspaceId, name, {});
      setDocuments(prev => [doc, ...prev]);
      setShowCreateMenu(false);
      setShowNameInput(false);
      setNewDocName('');
      setSelectedDocType(null);
    } catch (err) {
      setError('Failed to create document');
    } finally {
      setLoading(false);
    }
  };


  const toggleStar = (id) => {
    setDocuments(docs => docs.map(doc => 
      doc.id === id ? { ...doc, starred: !doc.starred } : doc
    ));
  };

  // Rename logic
  const handleRename = async () => {
    if (!renameDocTitle.trim()) return;
    setLoading(true);
    setError('');
    try {
      await updateTitle(renameDocId, renameDocTitle.trim());
      setDocuments(docs => docs.map(doc => 
        doc.id === renameDocId ? { ...doc, title: renameDocTitle.trim() } : doc
      ));
      setShowRenameModal(false);
    } catch (err) {
      setError('Failed to rename document');
    } finally {
      setLoading(false);
    }
  };

  // Delete logic
  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteDocument(deleteDocId);
      setDocuments(docs => docs.filter(doc => doc.id !== deleteDocId));
      setShowDeleteModal(false);
    } catch (err) {
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocumentIcon = (type) => {
    const docType = documentTypes.find(dt => dt.type === type);
    return docType ? docType.icon : FileText;
  };

  const getDocumentColor = (type) => {
    const docType = documentTypes.find(dt => dt.type === type);
    return docType ? docType.color : 'text-blue-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg"
                onClick={() => navigate('/home')}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${workspaceColor} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-xl font-bold text-white truncate">{workspaceName}</h1>
                  <p className="text-xs text-gray-400">{documents.length} docs</p>
                </div>
              </div>
            </div>
            
            {/* Controls - Always visible */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-32 sm:w-48 lg:w-64 pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-700/50 rounded-lg p-0.5 sm:p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>

              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">JD</span>
              </div>
            </div>
            </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Create Button */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Create</span>
              </button>

              {/* Create Menu Dropdown */}
              {showCreateMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                  <div className="p-1.5 sm:p-2">
                    {documentTypes.map((docType) => {
                      const Icon = docType.icon;
                      return (
                        <button
                          key={docType.type}
                          onClick={() => {
                            setSelectedDocType(docType.type);
                            setShowCreateMenu(false);
                            setShowNameInput(true);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left hover:bg-gray-700/50 rounded-lg sm:rounded-xl transition-colors duration-200 group"
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors duration-200">
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${docType.color}`} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm sm:text-base">Blank {docType.label}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Create a new {docType.label.toLowerCase()}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Name Input Modal (after type selection) */}
              {showNameInput && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-80 max-w-full p-6 relative">
                    <h2 className="text-lg font-semibold text-white mb-3">Enter Document Name</h2>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      placeholder="Document name..."
                      value={newDocName}
                      onChange={e => setNewDocName(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newDocName.trim()) {
                          createDocument(selectedDocType, newDocName);
                        }
                      }}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowNameInput(false);
                          setNewDocName('');
                          setSelectedDocType(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => createDocument(selectedDocType, newDocName)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        disabled={!newDocName.trim()}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button className="text-gray-400 hover:text-white transition-colors duration-200 p-1.5 sm:p-2 hover:bg-gray-700/50 rounded-lg">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="text-xs sm:text-sm text-gray-400">
            {filteredDocuments.length} of {documents.length}
          </div>
        </div>

        {/* Documents Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredDocuments.map((document) => {
              const Icon = getDocumentIcon(document.type);
              return (
                <div
                  onClick={() => navigate(`/workspace/${workspaceId}/document/${document.id}`)}
                  key={document.id}
                  className="group relative bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Document Preview Area - Smaller */}
                  <div className="h-24 sm:h-32 bg-gradient-to-br from-gray-700/30 to-gray-800/30 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${getDocumentColor(document.type)} opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
                    {/* Hover Actions */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(document.id);
                          }}
                          className="p-1 sm:p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-md transition-colors duration-200"
                        >
                          {document.starred ? (
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                          ) : (
                            <StarOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </button>
                        {/* Rename button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameDocId(document.id);
                            setRenameDocTitle(document.title);
                            setShowRenameModal(true);
                          }}
                          className="p-1 sm:p-1.5 bg-gray-800/80 hover:bg-blue-700 rounded-md transition-colors duration-200"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDocId(document.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 sm:p-1.5 bg-gray-800/80 hover:bg-red-700 rounded-md transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {/* Document Type Badge */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
                      <div className="px-1.5 py-1 bg-gray-800/80 rounded-md">
                        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${getDocumentColor(document.type)}`} />
                      </div>
                    </div>
                  </div>
                  {/* Document Info - Compact */}
                  <div className="p-2 sm:p-3">
                    <h3 className="font-semibold text-white text-xs sm:text-sm mb-1 sm:mb-2 truncate group-hover:text-blue-400 transition-colors duration-300">
                      {document.title}
                    </h3>
                    <div className="flex flex-col space-y-1 text-xs text-gray-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 min-w-0">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{document.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{document.lastModified}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {document.starred && (
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          )}
                          {document.shared && (
                            <Share2 className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View - Responsive
          <div className="space-y-2">
            {filteredDocuments.map((document) => {
              const Icon = getDocumentIcon(document.type);
              return (
                <div
                  onClick={() => navigate(`/workspace/${workspaceId}/document/${document.id}`)}
                  key={document.id}
                  className="group relative bg-gray-800/30 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${getDocumentColor(document.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-blue-400 transition-colors duration-300">
                          {document.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 truncate hidden sm:block">{document.preview}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-6 text-xs sm:text-sm text-gray-400">
                      <div className="hidden md:flex items-center space-x-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{document.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{document.lastModified}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {document.starred && (
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                        )}
                        {document.shared && (
                          <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(document.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all duration-200"
                        >
                          <StarOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        </button>
                        {/* Rename button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameDocId(document.id);
                            setRenameDocTitle(document.title);
                            setShowRenameModal(true);
                          }}
                          className="p-1 sm:p-1.5 bg-gray-800/80 hover:bg-blue-700 rounded-md transition-colors duration-200"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDocId(document.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 sm:p-1.5 bg-gray-800/80 hover:bg-red-700 rounded-md transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <FileText className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              {searchTerm ? 'No documents found' : 'Start creating documents'}
            </h3>
            <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {searchTerm 
                ? `No documents match "${searchTerm}". Try a different search term.`
                : 'Create your first document to get started with your workspace.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateMenu(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-5 sm:py-3 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Create Document
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close create menu */}
      {showCreateMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowCreateMenu(false)}
        />
      )}
      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRename}
        value={renameDocTitle}
        setValue={setRenameDocTitle}
      />
      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Workspace;