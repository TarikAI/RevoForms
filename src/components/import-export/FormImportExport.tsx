'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Download, FileText, CheckCircle, AlertTriangle, X,
  ArrowRight, ArrowLeft, Settings, Eye, Code, Database, File,
  FolderOpen, Copy, Move, Trash2, Plus, Filter, Search, Calendar,
  BarChart, Globe, Zap, Shield, Clock, ChevronDown, ChevronRight,
  FileJson, FileSpreadsheet, FileCode, FileArchive, HelpCircle
} from 'lucide-react'
import { useFormStore } from '@/store/formStore'

interface ExportFormat {
  id: string
  name: string
  description: string
  extension: string
  icon: React.ReactNode
  supportedFields: string[]
  options: Record<string, any>
}

interface ImportSource {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  requiresAuth: boolean
  supportedFormats: string[]
}

interface ImportedForm {
  id: string
  name: string
  description: string
  fields: number
  responses: number
  lastModified: Date
  source: string
  format: string
  status: 'ready' | 'processing' | 'error' | 'imported'
  preview?: any
}

interface MappingRule {
  sourceField: string
  targetField: string
  transform?: string
}

export function FormImportExport() {
  const { forms, selectedFormId } = useFormStore()
  const currentForm = forms.find(f => f.id === selectedFormId) || null
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [selectedExportFormat, setSelectedExportFormat] = useState('json')
  const [selectedImportSource, setSelectedImportSource] = useState('file')
  const [dragActive, setDragActive] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([])
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [importedForms, setImportedForms] = useState<ImportedForm[]>([
    {
      id: '1',
      name: 'Customer Survey 2024',
      description: 'Annual customer satisfaction survey',
      fields: 25,
      responses: 542,
      lastModified: new Date('2024-01-15'),
      source: 'Google Forms',
      format: 'JSON',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Contact Form Import',
      description: 'Website contact form data',
      fields: 8,
      responses: 1234,
      lastModified: new Date('2024-02-20'),
      source: 'CSV File',
      format: 'CSV',
      status: 'imported'
    }
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportFormats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Native format with all features',
      extension: '.json',
      icon: <FileJson className="w-5 h-5" />,
      supportedFields: ['all'],
      options: {
        includeResponses: true,
        includeAnalytics: true,
        includeSettings: true,
        prettyPrint: true
      }
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Spreadsheet compatible format',
      extension: '.csv',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      supportedFields: ['text', 'email', 'number', 'date', 'select'],
      options: {
        includeHeaders: true,
        delimiter: ',',
        dateFormat: 'ISO'
      }
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel format',
      extension: '.xlsx',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      supportedFields: ['all'],
      options: {
        includeFormulas: false,
        includeCharts: true,
        sheetName: 'Form Data'
      }
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Formatted document export',
      extension: '.pdf',
      icon: <FileText className="w-5 h-5" />,
      supportedFields: ['text', 'select', 'checkbox'],
      options: {
        includeResponses: true,
        layout: 'vertical',
        fontSize: 12,
        includeMetadata: true
      }
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Web page format',
      extension: '.html',
      icon: <FileCode className="w-5 h-5" />,
      supportedFields: ['all'],
      options: {
        includeStyling: true,
        includeScript: false,
        responsive: true
      }
    },
    {
      id: 'xml',
      name: 'XML',
      description: 'Structured data format',
      extension: '.xml',
      icon: <FileCode className="w-5 h-5" />,
      supportedFields: ['all'],
      options: {
        rootElement: 'form',
        includeMetadata: true,
        validation: true
      }
    }
  ]

  const importSources: ImportSource[] = [
    {
      id: 'file',
      name: 'Upload File',
      description: 'Import from a file on your computer',
      icon: <Upload className="w-6 h-6" />,
      requiresAuth: false,
      supportedFormats: ['JSON', 'CSV', 'Excel', 'XML']
    },
    {
      id: 'google-forms',
      name: 'Google Forms',
      description: 'Import from Google Forms',
      icon: <FileText className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['JSON']
    },
    {
      id: 'typeform',
      name: 'Typeform',
      description: 'Import from Typeform',
      icon: <FileText className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['JSON', 'CSV']
    },
    {
      id: 'jotform',
      name: 'JotForm',
      description: 'Import from JotForm',
      icon: <FileText className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['JSON', 'CSV', 'PDF']
    },
    {
      id: 'survey-monkey',
      name: 'SurveyMonkey',
      description: 'Import from SurveyMonkey',
      icon: <BarChart className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['JSON', 'CSV']
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description: 'Import from Airtable base',
      icon: <Database className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['CSV', 'JSON']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Import via Zapier integration',
      icon: <Zap className="w-6 h-6" />,
      requiresAuth: true,
      supportedFormats: ['JSON', 'CSV']
    },
    {
      id: 'webhook',
      name: 'Webhook URL',
      description: 'Import from webhook endpoint',
      icon: <Globe className="w-6 h-6" />,
      requiresAuth: false,
      supportedFormats: ['JSON']
    }
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    const supportedTypes = ['application/json', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

    if (supportedTypes.includes(file.type) || file.name.endsWith('.csv')) {
      setImportFile(file)
    } else {
      alert('Unsupported file format')
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setIsImporting(true)
    setImportProgress(0)

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 500)

    setTimeout(() => {
      setIsImporting(false)
      setImportFile(null)
      setImportProgress(0)

      const newForm: ImportedForm = {
        id: Date.now().toString(),
        name: importFile.name.replace(/\.[^/.]+$/, ''),
        description: `Imported from ${importFile.name}`,
        fields: Math.floor(Math.random() * 30) + 5,
        responses: Math.floor(Math.random() * 1000),
        lastModified: new Date(),
        source: 'File Upload',
        format: importFile.name.split('.').pop()?.toUpperCase() || '',
        status: 'ready'
      }

      setImportedForms(prev => [...prev, newForm])
    }, 5000)
  }

  const handleExport = async () => {
    setIsExporting(true)

    const format = exportFormats.find(f => f.id === selectedExportFormat)
    if (!format) return

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)

      // Create download
      const data = JSON.stringify({
        form: currentForm,
        exportedAt: new Date().toISOString(),
        format: format.name
      }, null, 2)

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `form-export${format.extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 2000)
  }

  const handleImportForm = (formId: string) => {
    setImportedForms(prev => prev.map(form =>
      form.id === formId
        ? { ...form, status: 'imported' as const }
        : form
    ))
  }

  const handleDeleteImportedForm = (formId: string) => {
    setImportedForms(prev => prev.filter(form => form.id !== formId))
  }

  const getStatusColor = (status: ImportedForm['status']) => {
    switch (status) {
      case 'ready': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'imported': return 'text-green-600 bg-green-100'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Database className="w-10 h-10" />
            Form Import & Export
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Seamlessly migrate forms to and from various formats
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Forms</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {forms.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Exports</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">47</p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Imports</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">23</p>
              </div>
              <Upload className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Storage Used</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">2.4GB</p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex space-x-1 p-1">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'import'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Import Forms
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'export'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Download className="w-4 h-4" />
                Export Forms
              </button>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'import' && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Import Sources */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Choose Import Source
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {importSources.map(source => (
                        <button
                          key={source.id}
                          onClick={() => setSelectedImportSource(source.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            selectedImportSource === source.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                              selectedImportSource === source.id
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {source.icon}
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{source.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{source.description}</p>
                            {source.requiresAuth && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 mt-2">Requires auth</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* File Upload Area */}
                  {selectedImportSource === 'file' && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Upload File
                      </h3>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                          dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.csv,.xlsx,.xls,.xml"
                          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                          className="hidden"
                        />
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-900 dark:text-slate-100 font-semibold mb-2">
                          Drag & drop your file here
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          or click to browse from your computer
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Select File
                        </button>
                        <p className="text-xs text-slate-500 mt-4">
                          Supported formats: JSON, CSV, Excel, XML
                        </p>
                      </div>

                      {importFile && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File className="w-8 h-8 text-blue-600" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{importFile.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {(importFile.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setImportFile(null)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>

                          {isImporting && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <span>Importing...</span>
                                <span>{importProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${importProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isImporting ? 'Importing...' : 'Import Form'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Imported Forms */}
                  {importedForms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Imported Forms ({importedForms.length})
                      </h3>
                      <div className="space-y-3">
                        {importedForms.map(form => (
                          <div key={form.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{form.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                                    {form.status}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{form.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span>{form.fields} fields</span>
                                  <span>{form.responses} responses</span>
                                  <span>From {form.source}</span>
                                  <span>{form.format} format</span>
                                  <span>{form.lastModified.toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {form.status === 'ready' && (
                                  <button
                                    onClick={() => handleImportForm(form.id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    Import to Forms
                                  </button>
                                )}
                                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteImportedForm(form.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'export' && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Export Formats */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Choose Export Format
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exportFormats.map(format => (
                        <button
                          key={format.id}
                          onClick={() => setSelectedExportFormat(format.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            selectedExportFormat === format.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${
                              selectedExportFormat === format.id
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {format.icon}
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{format.name}</h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{format.description}</p>
                          <p className="text-xs text-slate-500">
                            {format.supportedFields.includes('all') ? 'All fields' : `${format.supportedFields.length} field types`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Export Options
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                      <div className="space-y-4">
                        {exportFormats.find(f => f.id === selectedExportFormat)?.options && (
                          Object.entries(exportFormats.find(f => f.id === selectedExportFormat)!.options).map(([key, value]) => (
                            <label key={key} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              {typeof value === 'boolean' ? (
                                <input
                                  type="checkbox"
                                  defaultChecked={value}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              ) : typeof value === 'string' ? (
                                <input
                                  type="text"
                                  defaultValue={value}
                                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                />
                              ) : (
                                <input
                                  type="number"
                                  defaultValue={value}
                                  className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                />
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Select Forms to Export
                    </h3>
                    <div className="space-y-3">
                      {forms.map(form => (
                        <label key={form.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <input
                            type="checkbox"
                            defaultChecked={form.id === currentForm?.id}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{form.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {form.fields.length} fields • {(form as any).responses?.length || 0} responses
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Export Forms
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Advanced Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Secure Transfer</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All imports and exports are encrypted end-to-end
              </p>
            </div>
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Bulk Operations</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Import or export multiple forms simultaneously
              </p>
            </div>
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Scheduled Export</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automate regular exports to your preferred storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}