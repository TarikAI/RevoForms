/**
 * PDF Processing Provider
 * Uses pdf-lib for manipulation and pdf-parse for extraction
 * Supports: field extraction, form filling, PDF generation
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, rgb } from 'pdf-lib'
import type { FormField, FieldType } from '@/types/form'

export interface PDFFieldInfo {
  name: string
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'signature' | 'unknown'
  value?: string | boolean
  options?: string[]
  required?: boolean
  rect?: { x: number; y: number; width: number; height: number }
  page: number
}

export interface PDFFormStructure {
  title?: string
  fields: PDFFieldInfo[]
  pageCount: number
  isFlat: boolean  // true if form has no fillable fields
  metadata?: Record<string, string>
}

export interface PDFProcessingResult {
  success: boolean
  structure?: PDFFormStructure
  error?: string
}

export interface PDFFillResult {
  success: boolean
  pdf?: Uint8Array
  error?: string
}

export class PDFProvider {
  /**
   * Extract form structure from a PDF
   */
  async extractFormStructure(pdfBuffer: Buffer | Uint8Array): Promise<PDFProcessingResult> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      const extractedFields: PDFFieldInfo[] = []
      
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
          // Find page index
          const pages = pdfDoc.getPages()
          for (let i = 0; i < pages.length; i++) {
            const pageRef = pages[i].ref
            const widgetPage = firstWidget.P()
            if (widgetPage && pageRef.toString() === widgetPage.toString()) {
              page = i
              break
            }
          }
        }

        if (field instanceof PDFTextField) {
          extractedFields.push({
            name,
            type: 'text',
            value: field.getText() || '',
            rect,
            page
          })
        } else if (field instanceof PDFCheckBox) {
          extractedFields.push({
            name,
            type: 'checkbox',
            value: field.isChecked(),
            rect,
            page
          })
        } else if (field instanceof PDFDropdown) {
          extractedFields.push({
            name,
            type: 'dropdown',
            value: field.getSelected()?.[0] || '',
            options: field.getOptions().map(o => o),
            rect,
            page
          })
        } else if (field instanceof PDFRadioGroup) {
          extractedFields.push({
            name,
            type: 'radio',
            value: field.getSelected() || '',
            options: field.getOptions().map(o => o),
            rect,
            page
          })
        } else {
          extractedFields.push({
            name,
            type: 'unknown',
            rect,
            page
          })
        }
      }

      // Get metadata
      const title = pdfDoc.getTitle()
      const metadata: Record<string, string> = {}
      if (pdfDoc.getAuthor()) metadata.author = pdfDoc.getAuthor()!
      if (pdfDoc.getSubject()) metadata.subject = pdfDoc.getSubject()!
      if (pdfDoc.getCreator()) metadata.creator = pdfDoc.getCreator()!

      return {
        success: true,
        structure: {
          title: title || undefined,
          fields: extractedFields,
          pageCount: pdfDoc.getPageCount(),
          isFlat: extractedFields.length === 0,
          metadata
        }
      }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Fill a PDF form with provided values
   */
  async fillForm(
    pdfBuffer: Buffer | Uint8Array,
    values: Record<string, string | boolean>
  ): Promise<PDFFillResult> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const form = pdfDoc.getForm()

      for (const [fieldName, value] of Object.entries(values)) {
        try {
          const field = form.getField(fieldName)
          
          if (field instanceof PDFTextField && typeof value === 'string') {
            field.setText(value)
          } else if (field instanceof PDFCheckBox && typeof value === 'boolean') {
            if (value) field.check()
            else field.uncheck()
          } else if (field instanceof PDFDropdown && typeof value === 'string') {
            field.select(value)
          } else if (field instanceof PDFRadioGroup && typeof value === 'string') {
            field.select(value)
          }
        } catch (e) {
          console.warn(`Could not fill field "${fieldName}": ${e}`)
        }
      }

      // Flatten form to prevent further editing (optional)
      // form.flatten()

      const filledPdf = await pdfDoc.save()
      return { success: true, pdf: filledPdf }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Convert PDF form structure to RevoForms FormField array
   */
  convertToFormFields(pdfStructure: PDFFormStructure): FormField[] {
    return pdfStructure.fields.map((pdfField, index) => {
      let type: FieldType = 'text'
      
      switch (pdfField.type) {
        case 'checkbox': type = 'checkbox'; break
        case 'dropdown': type = 'select'; break
        case 'radio': type = 'radio'; break
        case 'signature': type = 'text'; break // Will be signature type later
        default: type = 'text'
      }

      const formField: FormField = {
        id: `pdf_${index}_${pdfField.name.replace(/\s+/g, '_')}`,
        type,
        label: this.formatFieldLabel(pdfField.name),
        required: pdfField.required || false,
        placeholder: '',
      }

      if (pdfField.options && pdfField.options.length > 0) {
        formField.options = pdfField.options
      }

      if (pdfField.value !== undefined && pdfField.value !== '') {
        formField.defaultValue = pdfField.value as string
      }

      return formField
    })
  }

  /**
   * Format field name to readable label
   */
  private formatFieldLabel(name: string): string {
    return name
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim()
  }

  /**
   * Create a new PDF from form fields
   */
  async createPDF(options: {
    title: string
    fields: FormField[]
    values?: Record<string, string | boolean>
  }): Promise<PDFFillResult> {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([612, 792]) // Letter size
      const form = pdfDoc.getForm()
      
      const { title, fields, values = {} } = options
      
      // Add title
      page.drawText(title, {
        x: 50,
        y: 750,
        size: 18,
      })

      let yPosition = 700
      const lineHeight = 40

      for (const field of fields) {
        if (yPosition < 100) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([612, 792])
          yPosition = 750
        }

        // Draw label
        page.drawText(field.label + (field.required ? ' *' : ''), {
          x: 50,
          y: yPosition,
          size: 10,
        })

        // Create form field
        const fieldName = field.id
        
        if (field.type === 'checkbox') {
          const checkBox = form.createCheckBox(fieldName)
          checkBox.addToPage(page, {
            x: 50,
            y: yPosition - 20,
            width: 15,
            height: 15,
          })
          if (values[fieldName]) checkBox.check()
        } else if (field.type === 'select' && field.options) {
          const dropdown = form.createDropdown(fieldName)
          dropdown.addToPage(page, {
            x: 50,
            y: yPosition - 25,
            width: 200,
            height: 20,
          })
          dropdown.addOptions(field.options.map(o => typeof o === 'string' ? o : o.label))
          if (values[fieldName]) dropdown.select(values[fieldName] as string)
        } else {
          const textField = form.createTextField(fieldName)
          textField.addToPage(page, {
            x: 50,
            y: yPosition - 25,
            width: 300,
            height: 20,
          })
          if (values[fieldName]) textField.setText(values[fieldName] as string)
        }

        yPosition -= lineHeight
      }

      const pdfBytes = await pdfDoc.save()
      return { success: true, pdf: pdfBytes }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Singleton instance
let pdfProviderInstance: PDFProvider | null = null

export function getPDFProvider(): PDFProvider {
  if (!pdfProviderInstance) {
    pdfProviderInstance = new PDFProvider()
  }
  return pdfProviderInstance
}
