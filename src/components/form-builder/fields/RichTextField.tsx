'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Image, Code, Quote,
  Type, Palette, Highlighter, Undo, Redo,
  Eye, EyeOff, ChevronDown, Plus, X
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface RichTextFieldProps {
  field: any
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
}

const TOOLBAR_GROUPS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'script': 'sub' }, { 'script': 'super' }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],
  [{ 'align': [] }],
  ['link', 'image', 'video'],
  ['blockquote', 'code-block'],
  ['clean']
]

const CUSTOM_MODULES = {
  toolbar: {
    container: TOOLBAR_GROUPS,
    handlers: {
      image: handleImageUpload
    }
  }
}

function handleImageUpload() {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/*')
  input.click()

  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const range = (window as any).Quill?.getSelection?.()
        if (range && e.target?.result) {
          (window as any).Quill?.insertEmbed(range.index, 'image', e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }
}

export function RichTextField({ field, value = '', onChange, error, disabled }: RichTextFieldProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showSourceCode, setShowSourceCode] = useState(false)
  const [sourceCode, setSourceCode] = useState(value)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showTemplates, setShowTemplates] = useState(false)
  const quillRef = useRef<ReactQuill>(null)

  const {
    enableSpellCheck = true,
    enableMarkdown = false,
    enableTemplates = false,
    maxWords,
    maxChars,
    placeholder = 'Start typing or paste your content here...',
    height = 200,
    theme = 'snow'
  } = field

  useEffect(() => {
    // Count words and characters
    const text = value.replace(/<[^>]*>/g, '')
    setCharCount(text.length)
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
  }, [value])

  useEffect(() => {
    setSourceCode(value)
  }, [value])

  const handleSourceCodeChange = (code: string) => {
    setSourceCode(code)
    onChange?.(code)
  }

  const insertTemplate = (template: string) => {
    const quill = quillRef.current?.getEditor()
    if (quill) {
      const range = quill.getSelection()
      quill.clipboard.dangerouslyPasteHTML(range?.index || 0, template)
      setShowTemplates(false)
    }
  }

  const templates = [
    { name: 'Paragraph', content: '<p>This is a paragraph of text. You can customize it as needed.</p>' },
    { name: 'Heading', content: '<h2>Section Heading</h2>' },
    { name: 'Bullet List', content: '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>' },
    { name: 'Numbered List', content: '<ol><li>First step</li><li>Second step</li><li>Third step</li></ol>' },
    { name: 'Quote', content: '<blockquote><p>This is a quote.</p></blockquote>' },
    { name: 'Call to Action', content: '<div style="padding: 20px; background: #f0f0f0; border-radius: 5px; text-align: center;"><h3>Call to Action</h3><p>Click here to learn more!</p></div>' }
  ]

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ]

  const modules = CUSTOM_MODULES

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/90">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {/* Word/Character Count */}
          <div className="text-xs text-white/50">
            {wordCount} words / {charCount} chars
            {(maxWords && wordCount > maxWords) && <span className="text-red-400 ml-1"> (Max: {maxWords})</span>}
            {(maxChars && charCount > maxChars) && <span className="text-red-400 ml-1"> (Max: {maxChars})</span>}
          </div>

          {/* Toggle View Buttons */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-2 rounded-lg transition-colors ${
              isPreviewMode ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/10 text-white/50 hover:text-white hover:bg-white/20'
            }`}
            title={isPreviewMode ? 'Edit mode' : 'Preview mode'}
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {enableTemplates && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 bg-white/10 text-white/50 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Insert template"
              >
                <Plus className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 p-2 bg-space-light border border-white/20 rounded-xl shadow-xl z-10"
                  >
                    <div className="text-xs text-white/60 mb-2">Templates</div>
                    {templates.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => insertTemplate(template.content)}
                        className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={() => setShowSourceCode(!showSourceCode)}
            className={`p-2 rounded-lg transition-colors ${
              showSourceCode ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/10 text-white/50 hover:text-white hover:bg-white/20'
            }`}
            title={showSourceCode ? 'Visual mode' : 'Source code'}
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="relative">
        {showSourceCode ? (
          <textarea
            value={sourceCode}
            onChange={(e) => handleSourceCodeChange(e.target.value)}
            placeholder="Enter HTML here..."
            className="w-full h-64 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono text-sm placeholder-white/40 focus:outline-none focus:border-neon-cyan/50"
            spellCheck={enableSpellCheck}
          />
        ) : isPreviewMode ? (
          <div
            className="min-h-[200px] p-4 bg-white/5 border border-white/20 rounded-xl text-white prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden">
            <ReactQuill
              ref={quillRef}
              theme={theme}
              value={value}
              onChange={onChange}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              style={{ height: `${height}px` }}
              className="[&_.ql-toolbar]:bg-white/10 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-white/10 [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:text-white/80 [&_.ql-container]:bg-transparent [&_.ql-editor]:text-white [&_.ql-editor]:p-4 [&_.ql-editor]:min-h-[150px] [&_.ql-snow]:border-0"
            />
          </div>
        )}
      </div>

      {/* Toolbar Quick Actions */}
      {!showSourceCode && !isPreviewMode && (
        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
          <button
            onClick={() => quillRef.current?.getEditor().format('bold', !quillRef.current?.getEditor().getFormat().bold)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('italic', !quillRef.current?.getEditor().getFormat().italic)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('underline', !quillRef.current?.getEditor().getFormat().underline)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={() => quillRef.current?.getEditor().format('list', 'ordered')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('list', 'bullet')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={() => quillRef.current?.getEditor().format('align', 'left')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('align', 'center')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('align', 'right')}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={() => quillRef.current?.getEditor().format('blockquote', !quillRef.current?.getEditor().getFormat().blockquote)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => quillRef.current?.getEditor().format('code-block', !quillRef.current?.getEditor().getFormat().code)}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
            title="Code block"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <X className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Help Text */}
      {field.helpText && (
        <p className="text-xs text-white/40">{field.helpText}</p>
      )}
    </div>
  )
}