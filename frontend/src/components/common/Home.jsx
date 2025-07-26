import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace, getWorkspaces } from "../../services/auth";
import {
  Plus,
  Building2,
  X,
  Sparkles,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkspacesModal, setShowWorkspacesModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState("");

  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
  ];

  const fetchWorkspaces = async () => {
    try {
      const data = await getWorkspaces();
      // Add a random color and mock metadata
      const enriched = data.map((ws) => ({
        ...ws,
        color: gradients[Math.floor(Math.random() * gradients.length)],
      }));
      setWorkspaces(enriched);
    } catch (err) {
      setError("Failed to fetch workspaces");
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    try {
      const newWs = await createWorkspace(workspaceName.trim());
      const enriched = {
        ...newWs,
        color: gradients[Math.floor(Math.random() * gradients.length)],
      };
      setWorkspaces((prev) => [...prev, enriched]);
      setWorkspaceName("");
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create workspace");
    }
  };

  // [Rest of your original component remains unchanged]
  // Keep all existing layout/JSX you provided – just replace the workspace array and `handleCreateWorkspace` logic

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  WorkSpace Hub
                </h1>
                <p className="text-xs text-gray-400">Collaborative Workspace</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">
              Welcome to your workspace
            </span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">
            Ready to create
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}
              something amazing
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Collaborate with your team, organize your projects, and bring your
            ideas to life in beautiful workspaces.
          </p>

          {/* Create Workspace CTA */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
          >
            <span className="flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <span className="text-lg">Create New Workspace</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </span>
          </button>
        </div>

        {/* Quick Stats - Only Total Workspaces */}
        <div className="flex justify-center mb-16">
          <button
            onClick={() => setShowWorkspacesModal(true)}
            className="group bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-4xl font-bold text-white mb-1">
                  {workspaces.length}
                </p>
                <p className="text-gray-400 text-lg">Total Workspaces</p>
                <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-blue-400 text-sm">
                    View all workspaces
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Workspaces Modal */}
      {showWorkspacesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] border border-gray-700 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b border-gray-700/50">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    My Workspaces
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {workspaces.length} total workspace
                    {workspaces.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowWorkspacesModal(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Workspaces List */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      onClick={() => {
                        setShowWorkspacesModal(false);
                        // Navigate to workspace - you can add navigation logic here
                        
                        navigate(`/workspace/${workspace.id}`)
                      }}
                      className="group relative bg-gray-700/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 hover:border-gray-500/50 hover:bg-gray-700/70 transition-all duration-300 cursor-pointer"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${workspace.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
                      ></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`w-14 h-14 bg-gradient-to-r ${workspace.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Building2 className="w-7 h-7 text-white" />
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                          {workspace.name}
                        </h4>

                        <p className="text-sm text-gray-400 mb-4">
                          {workspace.activity} • {workspace.lastAccessed}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded-full">
                            Click to open
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Create Workspace
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Start your new project
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="workspaceName"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Workspace Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="workspaceName"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateWorkspace(e)
                      }
                      placeholder="Enter workspace name"
                      className="w-full px-4 py-3 pl-12 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-500"
                      autoFocus
                    />
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
