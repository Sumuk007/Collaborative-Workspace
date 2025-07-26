import React from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Redo,
  Undo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

const Toolbar = ({ editor }) => {
  if (!editor) return null;

  const buttonClasses = (isActive) =>
    `p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
      isActive ? "bg-gray-300 dark:bg-gray-600" : ""
    }`;

  return (
    <div className="flex items-center flex-wrap gap-1 px-4 py-2 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClasses(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClasses(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClasses(editor.isActive("heading", { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>

      {/* Text styles */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClasses(editor.isActive("bold"))}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClasses(editor.isActive("italic"))}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClasses(editor.isActive("underline"))}
        title="Underline"
      >
        <Underline size={18} />
      </button>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClasses(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClasses(editor.isActive("orderedList"))}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>

      {/* Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={buttonClasses(editor.isActive({ textAlign: "left" }))}
        title="Align Left"
      >
        <AlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={buttonClasses(editor.isActive({ textAlign: "center" }))}
        title="Align Center"
      >
        <AlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={buttonClasses(editor.isActive({ textAlign: "right" }))}
        title="Align Right"
      >
        <AlignRight size={18} />
      </button>

      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className={buttonClasses(false)}
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className={buttonClasses(false)}
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export default Toolbar;
