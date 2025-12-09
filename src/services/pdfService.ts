/**
 * PDF Processing Service
 * Uses pdf-lib for manipulation and pdf-parse for text extraction
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib'
import type { PDFAnalysis, PDFField, PDFFillRequest, PDFFillResponse } from '@/types/upload'

export class PDFService {
  /**
   * Analyze a PDF to extract form fields and text
   */
  static async analyze(pdfData: ArrayBuffer): Promise<PDFAnalysis> {
    try {
      const pdfDoc = await PDFDocument.load(pdfData)
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      const extractedFields: PDFField[] = fields.map(field => {
        const name = field.getName()
        let type: PDFField['type'] = 'text'
        let value: string | undefined
        let options: string[] | undefined

        if (field instanceof PDFTextField) {
          type = 'text'
          value = field.getText() || undefined
        } else if (field instanceof PDFCheckBox) {
          type = 'checkbox'
          value = field.isChecked() ? 'true' : 'false'
        } else if (field instanceof PDFDropdown) {
          type = 'dropdown'
          options = field.getOptions()
          value = field.getSelected()[0]
        } else if (field instanceof PDFRadioGroup) {
          type = 'radio'
          options = field.getOptions()
          value = field.getSelected()
        }

        return { name, type, value, options }
      })

      // Extract text content for analysis
      const pages = pdfDoc.getPages()
      let textContent = ''
      
      // Note: pdf-lib doesn't extract text directly, we'd need pdf-parse for that
      // For now, we'll use the form fields and metadata
      
      const metadata = {
        title: pdfDoc.getTitle() || undefined,
        author: pdfDoc.getAuthor() || undefined,
        subject: pdfDoc.getSubject() || undefined,
      }

      return {
        pageCount: pages.length,
        hasFormFields: fields.length > 0,
        fields: extractedFields,
        text: textContent,
        metadata
      }
    } catch (error) {
      console.error('PDF analysis error:', error)
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from PDF using pdf-parse (server-side only)
   */
  static async extractText(pdfData: ArrayBuffer): Promise<string> {
    // This will be called server-side where pdf-parse is available
    try {
      const pdfParse = await import('pdf-parse')
      const buffer = Buffer.from(pdfData)
      const data = await pdfParse.default(buffer)
      return data.text
    } catch (error) {
      console.error('PDF text extraction error:', error)
      return ''
    }
  }

  /**
   * Fill PDF form fields with provided values
   */
  static async fill(request: PDFFillRequest): Promise<PDFFillResponse> {
    try {
      const pdfDoc = await PDFDocument.load(request.pdfData)
      const form = pdfDoc.getForm()

      // Fill each field
      for (const [fieldName, value] of Object.entries(request.fieldValues)) {
        try {
          const field = form.getField(fieldName)
          
          if (field instanceof PDFTextField) {
            field.setText(String(value))
          } else if (field instanceof PDFCheckBox) {
            if (value === true || value === 'true') {
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

      // Optionally flatten the form (makes it non-editable)
      if (request.flattenAfterFill) {
        form.flatten()
      }

      const filledPdfBytes = await pdfDoc.save()
      
      return {
        success: true,
        filledPdf: filledPdfBytes.buffer as ArrayBuffer
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Create a new PDF from form data (for export)
   */
  static async createFromForm(formData: {
    title: string
    fields: Array<{ label: string; value: string; type: string }>
  }): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    
    const { height } = page.getSize()
    let yPosition = height - 50

    // Add title
    page.drawText(formData.title, {
      x: 50,
      y: yPosition,
      size: 20,
    })
    yPosition -= 40

    // Add fields
    for (const field of formData.fields) {
      page.drawText(`${field.label}: ${field.value}`, {
        x: 50,
        y: yPosition,
        size: 12,
      })
      yPosition -= 25

      if (yPosition < 50) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792])
        yPosition = newPage.getSize().height - 50
      }
    }

    const pdfBytes = await pdfDoc.save()
    return pdfBytes.buffer as ArrayBuffer
  }

  /**
   * Convert ArrayBuffer to base64 for display/download
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
}
