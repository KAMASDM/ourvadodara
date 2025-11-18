// =============================================
// src/components/Common/RichTextEditor.jsx
// TipTap Rich Text Editor Component
// =============================================
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2,
  Quote,
  Undo,
  Redo,
  Code
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive) => `
    p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
    ${isActive ? 'bg-gray-300 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
  `;

  const handleButtonClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleHeading = (level) => {
    const { from, to } = editor.state.selection;
    const isSelection = from !== to;

    if (isSelection) {
      // If there's a selection, split the text and make only selected part a heading
      const selectedText = editor.state.doc.textBetween(from, to);
      
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent([
          { type: 'heading', attrs: { level }, content: [{ type: 'text', text: selectedText }] },
          { type: 'paragraph' }
        ])
        .run();
    } else {
      // If no selection, toggle heading for the current block
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBold().run())}
        className={buttonClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleItalic().run())}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => handleHeading(1))}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => handleHeading(2))}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBulletList().run())}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleOrderedList().run())}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBlockquote().run())}
        className={buttonClass(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().toggleCodeBlock().run())}
        className={buttonClass(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().undo().run())}
        disabled={!editor.can().undo()}
        className={buttonClass(false)}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => handleButtonClick(e, () => editor.chain().focus().redo().run())}
        disabled={!editor.can().redo()}
        className={buttonClass(false)}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className = '',
  minHeight = '200px'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none px-4 py-3 ${className}`,
      },
    },
  });

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-content .ProseMirror {
            min-height: ${minHeight};
          }
          .rich-text-content .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .rich-text-content .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          .rich-text-content .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          .rich-text-content .ProseMirror ul,
          .rich-text-content .ProseMirror ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }
          .rich-text-content .ProseMirror blockquote {
            border-left: 3px solid #cbd5e0;
            padding-left: 1em;
            margin: 1em 0;
            color: #4a5568;
          }
          .rich-text-content .ProseMirror code {
            background-color: #f7fafc;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: monospace;
          }
          .rich-text-content .ProseMirror pre {
            background-color: #1a202c;
            color: #e2e8f0;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1em 0;
          }
          .rich-text-content .ProseMirror pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
          }
        `
      }} />
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        style={{ minHeight }}
        className="rich-text-content"
      />
    </div>
  );
};

export default RichTextEditor;
