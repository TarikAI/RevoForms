// ============================================
// PDF PROCESSOR
// Uses pdf-lib for manipulation, pdf-parse for extraction
// ============================================

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib'

export interface ExtractedField {
  id: string
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'signature' | 'date' | 'unknown'
  label: string
  required: boolean
  options?: string[]
  value?: string
  rect?: { x: number; y: number; width: number; height: number }
  page: number
}

export interface ExtractedForm {
  title: string
  pageCount: number
  fields: ExtractedField[]
  metadata: {
    author?: string
    subject?: string
    creator?: string
  }
  hasAcroForm: boolean
}

export interface FillData {
  [fieldName: string]: string | boolean | string[]
}

// Extract form structure from PDF
export async function extractPDFForm(pdfBuffer: ArrayBuffer): Promise<ExtractedForm> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  
  const extractedFields: ExtractedField[] = []
  
  for (const field of fields) {
    const name = field.getName()
    const widgets = field.acroField.getWidgets()
    const firstWidget = widgets[0]
    
    let rect = undefined
    let page = 0
    
    if (firstWidget) {
      const rectArray = firstWidget.getRectangle()
      rect = {
        x: rectArray.x,
        y: rectArray.y,
        width: rectArray.width,
        height: rectArray.height
      }
      // Find page number
      const pages = pdfDoc.getPages()
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].ref === firstWidget.P()) {
          page = i
          break
        }
      }
    }

    let fieldData: ExtractedField = {
      id: `pdf_${name.replace(/\s+/g, '_').toLowerCase()}`,
      name,
      type: 'unknown',
      label: name.replace(/[_-]/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      required: false,
      page,
      rect
    }

    // Detect field type
    if (field instanceof PDFTextField) {
      fieldData.type = 'text'
      fieldData.value = field.getText() || ''
    } else if (field instanceof PDFCheckBox) {
      fieldData.type = 'checkbox'
      fieldData.value = field.isChecked() ? 'true' : 'false'
    } else if (field instanceof PDFDropdown) {
      fieldData.type = 'select'
      fieldData.options = field.getOptions()
      fieldData.value = field.getSelected()[0] || ''
    } else if (field instanceof PDFRadioGroup) {
      fieldData.type = 'radio'
      fieldData.options = field.getOptions()
      fieldData.value = field.getSelected() || ''
    }

    extractedFields.push(fieldData)
  }

  return {
    title: pdfDoc.getTitle() || 'Untitled Form',
    pageCount: pdfDoc.getPageCount(),
    fields: extractedFields,
    metadata: {
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      creator: pdfDoc.getCreator() || undefined
    },
    hasAcroForm: fields.length > 0
  }
}

// Fill PDF form with data
export async function fillPDFForm(
  pdfBuffer: ArrayBuffer, 
  fillData: FillData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const form = pdfDoc.getForm()
  
  for (const [fieldName, value] of Object.entries(fillData)) {
    try {
      const field = form.getField(fieldName)
      
      if (field instanceof PDFTextField) {
        field.setText(String(value))
      } else if (field instanceof PDFCheckBox) {
        if (value === true || value === 'true' || value === 'yes') {
          field.check()
        } else {
          field.uncheck()
        }
      } else if (field instanceof PDFDropdown) {
        field.select(String(value))
      } else if (field instanceof PDFRadioGroup) {
        field.select(String(value))
      }
    } catch (e) {
      console.warn(`Could not fill field ${fieldName}:`, e)
    }
  }
  
  // Flatten form to prevent further editing (optional)
  // form.flatten()
  
  return pdfDoc.save()
}

// Create a new PDF from form data
export async function createPDFFromForm(
  formTitle: string,
  fields: ExtractedField[],
  fillData?: FillData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const form = pdfDoc.getForm()
  
  const { height } = page.getSize()
  let yPosition = height - 50
  const leftMargin = 50
  const fieldWidth = 250
  const fieldHeight = 20
  const lineHeight = 40
  
  // Add title
  page.drawText(formTitle, {
    x: leftMargin,
    y: yPosition,
    size: 18,
  })
  yPosition -= 40
  
  // Add fields
  for (const field of fields) {
    if (yPosition < 50) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([612, 792])
      yPosition = newPage.getHeight() - 50
    }
    
    // Draw label
    page.drawText(field.label + (field.required ? ' *' : ''), {
      x: leftMargin,
      y: yPosition,
      size: 10,
    })
    yPosition -= 15
    
    // Create form field
    if (field.type === 'text' || field.type === 'date') {
      const textField = form.createTextField(field.name)
      textField.addToPage(page, {
        x: leftMargin,
        y: yPosition - fieldHeight,
        width: fieldWidth,
        height: fieldHeight,
      })
      if (fillData?.[field.name]) {
        textField.setText(String(fillData[field.name]))
      }
    } else if (field.type === 'checkbox') {
      const checkBox = form.createCheckBox(field.name)
      checkBox.addToPage(page, {
        x: leftMargin,
        y: yPosition - 15,
        width: 15,
        height: 15,
      })
      if (fillData?.[field.name] === true || fillData?.[field.name] === 'true') {
        checkBox.check()
      }
    } else if (field.type === 'select' && field.options) {
      const dropdown = form.createDropdown(field.name)
      dropdown.addOptions(field.options)
      dropdown.addToPage(page, {
        x: leftMargin,
        y: yPosition - fieldHeight,
        width: fieldWidth,
        height: fieldHeight,
      })
      if (fillData?.[field.name]) {
        dropdown.select(String(fillData[field.name]))
      }
    }
    
    yPosition -= lineHeight
  }
  
  return pdfDoc.save()
}

// Convert image to PDF
export async function imageToPDF(imageBuffer: ArrayBuffer, mimeType: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  
  let image
  if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(imageBuffer)
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBuffer)
  } else {
    throw new Error(`Unsupported image type: ${mimeType}`)
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
