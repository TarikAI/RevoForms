// PDF Processing Utilities using pdf-lib
// Supports: reading, extracting fields, filling, and creating PDFs

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, rgb } from 'pdf-lib'

export interface PDFFieldInfo {
  name: string
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'signature' | 'button' | 'unknown'
  value?: string | boolean
  options?: string[]
  required: boolean
  readOnly: boolean
  position?: {
    page: number
    x: number
    y: number
    width: number
    height: number
  }
}

export interface PDFFormStructure {
  title?: string
  pageCount: number
  fields: PDFFieldInfo[]
  hasAcroForm: boolean
  metadata?: {
    author?: string
    subject?: string
    creator?: string
    creationDate?: Date
  }
}

export interface FillPDFRequest {
  pdfBytes: Uint8Array | ArrayBuffer
  fieldValues: Record<string, string | boolean>
  flatten?: boolean // Convert to non-editable
}

export interface FillPDFResult {
  success: boolean
  pdfBytes?: Uint8Array
  error?: string
}

// Extract form structure from PDF
export async function extractPDFStructure(pdfBytes: Uint8Array | ArrayBuffer): Promise<PDFFormStructure> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    
    const extractedFields: PDFFieldInfo[] = fields.map(field => {
      const name = field.getName()
      let type: PDFFieldInfo['type'] = 'unknown'
      let value: string | boolean | undefined
      let options: string[] | undefined

      if (field instanceof PDFTextField) {
        type = 'text'
        value = field.getText() || ''
      } else if (field instanceof PDFCheckBox) {
        type = 'checkbox'
        value = field.isChecked()
      } else if (field instanceof PDFDropdown) {
        type = 'dropdown'
        value = field.getSelected()?.[0] || ''
        options = field.getOptions()
      } else if (field instanceof PDFRadioGroup) {
        type = 'radio'
        value = field.getSelected() || ''
        options = field.getOptions()
      }

      // Try to get field position (widget annotation)
      let position: PDFFieldInfo['position'] | undefined
      try {
        const widgets = field.acroField.getWidgets()
        if (widgets.length > 0) {
          const widget = widgets[0]
          const rect = widget.getRectangle()
          const pageRef = widget.P()
          const pages = pdfDoc.getPages()
          const pageIndex = pageRef ? pages.findIndex(p => p.ref === pageRef) : 0
          
          position = {
            page: pageIndex >= 0 ? pageIndex : 0,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }
        }
      } catch (e) {
        // Position extraction failed, continue without it
      }

      return {
        name,
        type,
        value,
        options,
        required: false, // pdf-lib doesn't expose this directly
        readOnly: field.isReadOnly(),
        position,
      }
    })

    return {
      title: pdfDoc.getTitle() || undefined,
      pageCount: pdfDoc.getPageCount(),
      fields: extractedFields,
      hasAcroForm: fields.length > 0,
      metadata: {
        author: pdfDoc.getAuthor() || undefined,
        subject: pdfDoc.getSubject() || undefined,
        creator: pdfDoc.getCreator() || undefined,
        creationDate: pdfDoc.getCreationDate() || undefined,
      }
    }
  } catch (error: any) {
    console.error('PDF extraction error:', error)
    return {
      pageCount: 0,
      fields: [],
      hasAcroForm: false,
    }
  }
}

// Fill PDF form fields
export async function fillPDFForm(request: FillPDFRequest): Promise<FillPDFResult> {
  try {
    const pdfDoc = await PDFDocument.load(request.pdfBytes)
    const form = pdfDoc.getForm()
    
    // Fill each field
    for (const [fieldName, value] of Object.entries(request.fieldValues)) {
      try {
        const field = form.getField(fieldName)
        
        if (field instanceof PDFTextField) {
          field.setText(String(value))
        } else if (field instanceof PDFCheckBox) {
          if (value === true || value === 'true' || value === 'yes' || value === '1') {
            field.check()
          } else {
            field.uncheck()
          }
        } else if (field instanceof PDFDropdown) {
          field.select(String(value))
        } else if (field instanceof PDFRadioGroup) {
          field.select(String(value))
        }
      } catch (fieldError) {
        console.warn(`Could not fill field "${fieldName}":`, fieldError)
      }
    }

    // Flatten if requested (makes form non-editable)
    if (request.flatten) {
      form.flatten()
    }

    const pdfBytes = await pdfDoc.save()
    return { success: true, pdfBytes }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create a new PDF with form fields
export async function createPDFWithFields(
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'checkbox' | 'dropdown'
    options?: string[]
    page?: number
    x: number
    y: number
    width: number
    height: number
  }>,
  title?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  
  // Set metadata
  if (title) pdfDoc.setTitle(title)
  pdfDoc.setCreator('RevoForms')
  pdfDoc.setProducer('RevoForms PDF Generator')
  
  // Create page
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const form = pdfDoc.getForm()
  
  // Add fields
  for (const field of fields) {
    const targetPage = pdfDoc.getPage(field.page || 0) || page
    
    // Draw label
    targetPage.drawText(field.label, {
      x: field.x,
      y: field.y + field.height + 5,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    })
    
    if (field.type === 'text') {
      const textField = form.createTextField(field.name)
      textField.addToPage(targetPage, {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
      })
    } else if (field.type === 'checkbox') {
      const checkbox = form.createCheckBox(field.name)
      checkbox.addToPage(targetPage, {
        x: field.x,
        y: field.y,
        width: field.height, // Square
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
      })
    } else if (field.type === 'dropdown' && field.options) {
      const dropdown = form.createDropdown(field.name)
      dropdown.addOptions(field.options)
      dropdown.addToPage(targetPage, {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
      })
    }
  }

  return pdfDoc.save()
}

// Convert image to PDF (for image form processing)
export async function imageToPDF(
  imageBytes: Uint8Array,
  imageType: 'png' | 'jpg'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  
  let image
  if (imageType === 'png') {
    image = await pdfDoc.embedPng(imageBytes)
  } else {
    image = await pdfDoc.embedJpg(imageBytes)
  }
  
  const { width, height } = image.scale(1)
  const page = pdfDoc.addPage([width, height])
  
  page.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  })

  return pdfDoc.save()
}

// Merge multiple PDFs
export async function mergePDFs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()
  
  for (const pdfBytes of pdfBytesArray) {
    const pdf = await PDFDocument.load(pdfBytes)
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(page => mergedPdf.addPage(page))
  }

  return mergedPdf.save()
}

// Extract text content from PDF (basic - for non-form PDFs)
export async function extractPDFText(pdfBytes: Uint8Array): Promise<string> {
  // Note: pdf-lib doesn't have built-in text extraction
  // For full text extraction, we'd need pdf-parse or pdfjs-dist
  // This is a placeholder that returns basic info
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const title = pdfDoc.getTitle() || ''
    const subject = pdfDoc.getSubject() || ''
    const pageCount = pdfDoc.getPageCount()
    
    return `PDF Document: ${title}\nSubject: ${subject}\nPages: ${pageCount}\n\n[Full text extraction requires additional processing]`
  } catch (error) {
    return '[Could not extract PDF content]'
  }
}
