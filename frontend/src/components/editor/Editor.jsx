import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useParams, useNavigate } from "react-router-dom";
import { getDocument, updateDocument, updateTitle } from "../../services/auth";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  ArrowLeft,
} from "lucide-react";

const Editor = () => {
  const { workspaceId, documentId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectionState, setSelectionState] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
        heading: { levels: [1, 2, 3] },
        underline: false,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[500px] px-12 py-8",
      },
    },
    autofocus: false,
    onUpdate: ({ editor }) => {
      setSelectionState((s) => s + 1);
    },
    onSelectionUpdate: ({ editor }) => {
      setSelectionState((s) => s + 1);
    },
    onFocus: ({ editor }) => {
      setSelectionState((s) => s + 1);
    },
  });

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const doc = await getDocument(documentId);
        setTitle(doc.title);
        
        // Set editor content directly - no intermediate state needed
        const tiptapContent = doc.content.content;
        if (editor && !editor.isDestroyed && tiptapContent && tiptapContent.type === "doc") {
          console.log("Setting editor content:", tiptapContent);
          editor.commands.setContent(tiptapContent);
        } else if (editor && !editor.isDestroyed) {
          // Fallback for invalid content
          editor.commands.setContent({ type: "doc", content: [] });
        }
      } catch (err) {
        console.error("Failed to load document:", err);
        setTitle("Failed to load");
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent({ type: "doc", content: [] });
        }
      } finally {
        setLoading(false);
      }
    };

    if (documentId && editor) { // Wait for both documentId AND editor
      fetchDoc();
    }
  }, [documentId, editor]); // Include editor in dependencies

  // Update your ToolbarButton component to ensure proper active state detection
  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? "bg-blue-100 text-blue-600" : "text-gray-600"
      }`}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
  );

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    setSaveMsg("");
    try {
        await updateTitle(documentId, title);
      await updateDocument(documentId, {
        title,
        content: editor.getJSON(),
      });
      setSaveMsg("Document saved!");
    } catch (err) {
      setSaveMsg("Failed to save document");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2000);
    }
  };

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}`);
  };

  if (loading || !editor) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
              title="Back to workspace"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Type className="w-6 h-6 text-blue-600" />
              <input
                className="text-lg font-medium text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                style={{ minWidth: 0, width: "auto" }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {saveMsg && (
              <span className="text-sm text-gray-500 ml-2">{saveMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center py-2 space-x-1 overflow-x-auto">
            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleBold().run();
                // Force a state update to ensure immediate visual feedback
                setSelectionState((s) => s + 1);
              }}
              isActive={editor?.isActive("bold") || false}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleItalic().run();
                setSelectionState((s) => s + 1);
              }}
              isActive={editor?.isActive("italic") || false}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleUnderline().run();
                setSelectionState((s) => s + 1);
              }}
              isActive={editor?.isActive("underline") || false}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Headings */}
            <select
              onChange={(e) => {
                if (!editor) return;
                const level = parseInt(e.target.value);
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().setHeading({ level }).run();
                }
              }}
              value={(() => {
                if (!editor) return 0;
                if (editor.isActive('heading')) {
                  const level = editor.getAttributes('heading').level;
                  return level || 1;
                }
                if (editor.isActive('paragraph')) {
                  return 0;
                }
                return 0;
              })()}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Normal text</option>
              <option value={1}>Heading 1</option>
              <option value={2}>Heading 2</option>
              <option value={3}>Heading 3</option>
            </select>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Blockquote */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="max-w-5xl mx-auto bg-white mt-6 mb-8 shadow-sm border border-gray-200 min-h-[700px]">
        <EditorContent
          editor={editor}
          className="min-h-[700px] focus-within:outline-none"
        />
      </div>

      {/* Custom Styles for Editor Content */}
      <style>{`
        .ProseMirror {
          outline: none;
          line-height: 1.6;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          color: #1f2937;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          color: #1f2937;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #1f2937;
        }

        .ProseMirror p {
          margin: 0.75rem 0;
          color: #374151;
        }

        .ProseMirror ul {
          margin: 0.75rem 0;
          padding-left: 2rem;
          list-style-type: disc;
        }

        .ProseMirror ol {
          margin: 0.75rem 0;
          padding-left: 2rem;
          list-style-type: decimal;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
          color: #374151;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .ProseMirror blockquote p {
          color: #6b7280;
        }

        .ProseMirror strong {
          font-weight: 600;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
          text-decoration: underline;
        }

        /* Selection styles */
        .ProseMirror ::selection {
          background-color: #dbeafe;
        }

        /* Focus styles */
        .ProseMirror:focus {
          outline: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ProseMirror {
            padding: 1rem 1.5rem;
            font-size: 0.95rem;
          }
          .ProseMirror h1 {
            font-size: 1.75rem;
          }
          .ProseMirror h2 {
            font-size: 1.375rem;
          }
          .ProseMirror h3 {
            font-size: 1.125rem;
          }
        }

        @media (max-width: 640px) {
          .ProseMirror {
            padding: 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Editor;
