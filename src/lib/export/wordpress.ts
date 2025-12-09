import type { CanvasForm, FormField, FormStyling, ThemeColors } from '@/types/form'

// WordPress Plugin Types
export type WordPressPlugin = 
  | 'gravity-forms'
  | 'wpforms'
  | 'contact-form-7'
  | 'ninja-forms'
  | 'formidable'

export type WordPressBuilder =
  | 'elementor'
  | 'bricks'
  | 'divi'
  | 'beaver-builder'
  | 'gutenberg'
  | 'none'

interface ExportResult {
  code: string
  instructions: string
  css?: string
  php?: string
  shortcode?: string
}

// Field type mapping for different plugins
const GRAVITY_FIELD_MAP: Record<string, string> = {
  text: 'text',
  email: 'email',
  phone: 'phone',
  number: 'number',
  textarea: 'textarea',
  select: 'select',
  multiselect: 'multiselect',
  radio: 'radio',
  checkbox: 'checkbox',
  date: 'date',
  time: 'time',
  file: 'fileupload',
  url: 'website',
  name: 'name',
  address: 'address',
  hidden: 'hidden',
  html: 'html',
  divider: 'section',
  heading: 'section',
  paragraph: 'html',
}

const WPFORMS_FIELD_MAP: Record<string, string> = {
  text: 'text',
  email: 'email',
  phone: 'phone',
  number: 'number',
  textarea: 'textarea',
  select: 'select',
  radio: 'radio',
  checkbox: 'checkbox',
  date: 'date-time',
  file: 'file-upload',
  url: 'url',
  name: 'name',
  address: 'address',
  hidden: 'hidden',
  html: 'html',
  divider: 'divider',
  rating: 'rating',
}

// Generate Gravity Forms JSON import format
export function exportToGravityForms(form: CanvasForm): ExportResult {
  const gravityForm = {
    title: form.name,
    description: form.description || '',
    labelPlacement: 'top_label',
    descriptionPlacement: 'below',
    button: {
      type: 'text',
      text: form.settings.submitButtonText,
    },
    confirmations: {
      '1': {
        id: '1',
        name: 'Default Confirmation',
        type: 'message',
        message: form.settings.successMessage,
        isDefault: true,
      },
    },
    fields: form.fields.map((field, index) => ({
      id: index + 1,
      type: GRAVITY_FIELD_MAP[field.type] || 'text',
      label: field.label,
      isRequired: field.required,
      placeholder: field.placeholder || '',
      description: field.helpText || '',
      defaultValue: field.defaultValue || '',
      choices: field.options?.map(opt => ({
        text: typeof opt === 'string' ? opt : opt.label,
        value: typeof opt === 'string' ? opt : opt.value,
      })),
      ...(field.validation?.maxLength && { maxLength: field.validation.maxLength }),
      ...(field.validation?.min && { rangeMin: field.validation.min }),
      ...(field.validation?.max && { rangeMax: field.validation.max }),
      cssClass: `revoforms-field revoforms-${field.type}`,
    })),
  }

  const css = generateFormCSS(form.styling, 'gravity-forms')

  return {
    code: JSON.stringify(gravityForm, null, 2),
    css,
    shortcode: `[gravityform id="FORM_ID" title="true" description="true"]`,
    instructions: `
## Gravity Forms Import Instructions

1. **Install Gravity Forms** (if not already installed)
   - Purchase and download from gravityforms.com
   - Go to Plugins > Add New > Upload Plugin

2. **Import the Form**
   - Go to Forms > Import/Export
   - Click "Import Forms"
   - Paste the JSON code below or save as .json file and upload
   - Click "Import"

3. **Add Custom Styling**
   - Go to Appearance > Customize > Additional CSS
   - Paste the CSS code provided below
   - Or add to your theme's style.css

4. **Embed the Form**
   - Use the shortcode: ${`[gravityform id="FORM_ID" title="true"]`}
   - Replace FORM_ID with the actual form ID after import
   - For Elementor: Use Gravity Forms widget
   - For Bricks: Use shortcode element

5. **Optional: Elementor Integration**
   - Install "Gravity Forms Elementor Widget" plugin
   - Drag Gravity Form widget to your page
   - Select your form from dropdown

6. **Optional: Bricks Builder Integration**
   - Use Code element or Shortcode element
   - Paste the shortcode
    `.trim()
  }
}

// Generate WPForms JSON import format
export function exportToWPForms(form: CanvasForm): ExportResult {
  const wpForm = {
    field_id: form.fields.length + 1,
    settings: {
      form_title: form.name,
      form_desc: form.description || '',
      submit_text: form.settings.submitButtonText,
      confirmation_message: form.settings.successMessage,
      notification_enable: form.settings.notification?.enabled ? '1' : '0',
    },
    fields: Object.fromEntries(
      form.fields.map((field, index) => [
        String(index + 1),
        {
          id: String(index + 1),
          type: WPFORMS_FIELD_MAP[field.type] || 'text',
          label: field.label,
          required: field.required ? '1' : '0',
          placeholder: field.placeholder || '',
          description: field.helpText || '',
          default_value: field.defaultValue || '',
          choices: field.options?.map((opt, i) => ({
            label: typeof opt === 'string' ? opt : opt.label,
            value: typeof opt === 'string' ? opt : opt.value,
          })),
          css: `revoforms-field revoforms-${field.type}`,
        },
      ])
    ),
  }

  const css = generateFormCSS(form.styling, 'wpforms')

  return {
    code: JSON.stringify(wpForm, null, 2),
    css,
    shortcode: `[wpforms id="FORM_ID"]`,
    instructions: `
## WPForms Import Instructions

1. **Install WPForms** 
   - Go to Plugins > Add New
   - Search for "WPForms" and install
   - Activate the plugin

2. **Import the Form**
   - Go to WPForms > Tools > Import
   - Paste the JSON or upload .json file
   - Click "Import"

3. **Add Custom Styling**
   - Go to Appearance > Customize > Additional CSS
   - Paste the CSS code below

4. **Embed the Form**
   - Use shortcode: [wpforms id="FORM_ID"]
   - For Elementor: Use WPForms widget
   - For Bricks: Use shortcode element
    `.trim()
  }
}

// Generate Contact Form 7 format
export function exportToContactForm7(form: CanvasForm): ExportResult {
  let formTemplate = ''
  let mailTemplate = ''

  form.fields.forEach(field => {
    const required = field.required ? '*' : ''
    const name = field.id.replace(/-/g, '_')
    
    switch (field.type) {
      case 'email':
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [email${required} ${name} placeholder "${field.placeholder || ''}"]</label>\n\n`
        break
      case 'textarea':
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [textarea${required} ${name} placeholder "${field.placeholder || ''}"]</label>\n\n`
        break
      case 'select':
        const options = field.options?.map(o => typeof o === 'string' ? o : o.label).join(' | ') || ''
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [select${required} ${name} "${options}"]</label>\n\n`
        break
      case 'checkbox':
        const checkOpts = field.options?.map(o => typeof o === 'string' ? o : o.label).join('" "') || ''
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [checkbox${required} ${name} "${checkOpts}"]</label>\n\n`
        break
      case 'radio':
        const radioOpts = field.options?.map(o => typeof o === 'string' ? o : o.label).join('" "') || ''
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [radio ${name} "${radioOpts}"]</label>\n\n`
        break
      case 'file':
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [file${required} ${name} limit:10mb]</label>\n\n`
        break
      case 'date':
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [date${required} ${name}]</label>\n\n`
        break
      default:
        formTemplate += `<label>${field.label}${field.required ? ' *' : ''}\n    [text${required} ${name} placeholder "${field.placeholder || ''}"]</label>\n\n`
    }
    
    mailTemplate += `${field.label}: [${name}]\n`
  })

  formTemplate += `[submit "${form.settings.submitButtonText}"]`

  const css = generateFormCSS(form.styling, 'contact-form-7')

  return {
    code: formTemplate,
    css,
    shortcode: `[contact-form-7 id="FORM_ID" title="${form.name}"]`,
    instructions: `
## Contact Form 7 Instructions

1. **Install Contact Form 7**
   - Plugins > Add New > Search "Contact Form 7"
   - Install and activate

2. **Create Form**
   - Go to Contact > Add New
   - Name: "${form.name}"
   - Paste the form template code below
   - Configure Mail tab with the mail template

3. **Add Styling**
   - Appearance > Customize > Additional CSS
   - Paste the CSS code

4. **Embed**
   - Copy the shortcode from the form edit page
   - Paste into any page/post
    `.trim()
  }
}

// Generate CSS for WordPress plugins
export function generateFormCSS(styling: FormStyling, plugin: string): string {
  const c = styling.colors
  const prefix = plugin === 'gravity-forms' ? '.gform_wrapper' 
    : plugin === 'wpforms' ? '.wpforms-container' 
    : plugin === 'contact-form-7' ? '.wpcf7' 
    : '.revoforms'

  return `
/* RevoForms Generated Styles - ${styling.theme} Theme */
${prefix} {
  font-family: ${styling.fontFamily};
  background: ${c.background};
  padding: ${styling.spacing.padding};
  border-radius: ${styling.borderRadius.form};
  ${styling.shadows ? 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);' : ''}
}

${prefix} label,
${prefix} .gfield_label,
${prefix} .wpforms-field-label {
  color: ${c.text};
  font-size: ${styling.fontSize.label};
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
}

${prefix} input[type="text"],
${prefix} input[type="email"],
${prefix} input[type="tel"],
${prefix} input[type="url"],
${prefix} input[type="number"],
${prefix} input[type="date"],
${prefix} textarea,
${prefix} select {
  width: 100%;
  padding: 12px 16px;
  background: ${c.surface};
  border: 1px solid ${c.border};
  border-radius: ${styling.borderRadius.input};
  color: ${c.text};
  font-size: ${styling.fontSize.input};
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

${prefix} input:focus,
${prefix} textarea:focus,
${prefix} select:focus {
  outline: none;
  border-color: ${c.primary};
  box-shadow: 0 0 0 3px ${c.primary}33;
}

${prefix} input::placeholder,
${prefix} textarea::placeholder {
  color: ${c.textMuted};
}

${prefix} .gfield,
${prefix} .wpforms-field,
${prefix} .wpcf7-form-control-wrap {
  margin-bottom: ${styling.spacing.fieldGap};
}

${prefix} input[type="submit"],
${prefix} button[type="submit"],
${prefix} .gform_button,
${prefix} .wpforms-submit {
  background: linear-gradient(135deg, ${c.primary}, ${c.secondary});
  color: white;
  border: none;
  padding: 14px 28px;
  font-size: ${styling.fontSize.button};
  font-weight: 600;
  border-radius: ${styling.borderRadius.button};
  cursor: pointer;
  width: 100%;
  transition: opacity 0.2s, transform 0.2s;
}

${prefix} input[type="submit"]:hover,
${prefix} button[type="submit"]:hover {
  opacity: 0.9;
  ${styling.animation ? 'transform: translateY(-1px);' : ''}
}

${prefix} .gfield_required,
${prefix} .wpforms-required-label {
  color: ${c.error};
}

${prefix} .gfield_description,
${prefix} .wpforms-field-description {
  color: ${c.textMuted};
  font-size: 13px;
  margin-top: 4px;
}

${prefix} .validation_error,
${prefix} .wpforms-error {
  color: ${c.error};
  font-size: 13px;
  margin-top: 4px;
}

/* Checkbox & Radio Styles */
${prefix} input[type="checkbox"],
${prefix} input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: ${c.primary};
}

${prefix} .gfield_checkbox label,
${prefix} .gfield_radio label,
${prefix} .wpforms-field-checkbox li,
${prefix} .wpforms-field-radio li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

/* Rating Stars (if supported) */
${prefix} .revoforms-rating {
  display: flex;
  gap: 4px;
}

${prefix} .revoforms-rating button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${c.border};
  transition: color 0.2s;
}

${prefix} .revoforms-rating button.active,
${prefix} .revoforms-rating button:hover {
  color: #fbbf24;
}
`.trim()
}

// Generate standalone HTML export
export function exportToHTML(form: CanvasForm): ExportResult {
  const c = form.styling.colors
  const s = form.styling
  
  const fieldsHTML = form.fields.map(field => {
    const required = field.required ? 'required' : ''
    const asterisk = field.required ? '<span class="required">*</span>' : ''
    
    let inputHTML = ''
    switch (field.type) {
      case 'textarea':
        inputHTML = `<textarea name="${field.id}" placeholder="${field.placeholder || ''}" rows="${field.rows || 4}" ${required}></textarea>`
        break
      case 'select':
        const options = field.options?.map(o => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return `<option value="${val}">${label}</option>`
        }).join('\n          ') || ''
        inputHTML = `<select name="${field.id}" ${required}>
          <option value="">${field.placeholder || 'Select...'}</option>
          ${options}
        </select>`
        break
      case 'radio':
        inputHTML = field.options?.map((o, i) => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return `<label class="radio-option">
          <input type="radio" name="${field.id}" value="${val}" ${i === 0 && field.required ? 'required' : ''}>
          <span>${label}</span>
        </label>`
        }).join('\n        ') || ''
        break
      case 'checkbox':
        inputHTML = field.options?.map(o => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return `<label class="checkbox-option">
          <input type="checkbox" name="${field.id}[]" value="${val}">
          <span>${label}</span>
        </label>`
        }).join('\n        ') || ''
        break
      case 'rating':
        const stars = Array.from({ length: field.maxStars || 5 }, (_, i) => 
          `<button type="button" class="star" data-value="${i + 1}">★</button>`
        ).join('')
        inputHTML = `<div class="rating-field" data-name="${field.id}">${stars}<input type="hidden" name="${field.id}" ${required}></div>`
        break
      case 'file':
        inputHTML = `<input type="file" name="${field.id}" accept="${field.accept || '*/*'}" ${field.multiple ? 'multiple' : ''} ${required}>`
        break
      case 'date':
        inputHTML = `<input type="date" name="${field.id}" ${required}>`
        break
      case 'time':
        inputHTML = `<input type="time" name="${field.id}" ${required}>`
        break
      case 'number':
        inputHTML = `<input type="number" name="${field.id}" placeholder="${field.placeholder || ''}" 
          ${field.validation?.min !== undefined ? `min="${field.validation.min}"` : ''} 
          ${field.validation?.max !== undefined ? `max="${field.validation.max}"` : ''} 
          ${field.step ? `step="${field.step}"` : ''} ${required}>`
        break
      case 'divider':
        return `<hr class="form-divider">`
      case 'heading':
        return `<${field.headingLevel || 'h3'} class="form-heading">${field.label}</${field.headingLevel || 'h3'}>`
      case 'paragraph':
        return `<p class="form-paragraph">${field.content || field.label}</p>`
      default:
        inputHTML = `<input type="${field.type}" name="${field.id}" placeholder="${field.placeholder || ''}" ${required}>`
    }
    
    if (['divider', 'heading', 'paragraph'].includes(field.type)) return inputHTML
    
    return `
      <div class="form-field">
        <label>${field.label}${asterisk}</label>
        ${inputHTML}
        ${field.helpText ? `<span class="help-text">${field.helpText}</span>` : ''}
      </div>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: ${s.fontFamily}; 
      background: ${c.background}; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .form-container {
      background: ${c.surface};
      padding: ${s.spacing.padding};
      border-radius: ${s.borderRadius.form};
      width: 100%;
      max-width: 500px;
      ${s.shadows ? 'box-shadow: 0 4px 20px rgba(0,0,0,0.15);' : ''}
    }
    .form-title {
      color: ${c.text};
      font-size: ${s.fontSize.heading};
      margin-bottom: 8px;
      text-align: center;
    }
    .form-description {
      color: ${c.textMuted};
      text-align: center;
      margin-bottom: 24px;
    }
    .form-field {
      margin-bottom: ${s.spacing.fieldGap};
    }
    label {
      display: block;
      color: ${c.text};
      font-size: ${s.fontSize.label};
      font-weight: 500;
      margin-bottom: 6px;
    }
    .required { color: ${c.error}; margin-left: 2px; }
    input, textarea, select {
      width: 100%;
      padding: 12px 16px;
      background: ${c.background};
      border: 1px solid ${c.border};
      border-radius: ${s.borderRadius.input};
      color: ${c.text};
      font-size: ${s.fontSize.input};
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: ${c.primary};
      box-shadow: 0 0 0 3px ${c.primary}33;
    }
    textarea { resize: vertical; min-height: 100px; }
    .radio-option, .checkbox-option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      cursor: pointer;
    }
    .radio-option input, .checkbox-option input {
      width: 18px;
      height: 18px;
      accent-color: ${c.primary};
    }
    .rating-field {
      display: flex;
      gap: 4px;
    }
    .rating-field .star {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: ${c.border};
      transition: color 0.2s;
    }
    .rating-field .star.active,
    .rating-field .star:hover { color: #fbbf24; }
    .help-text {
      display: block;
      color: ${c.textMuted};
      font-size: 13px;
      margin-top: 4px;
    }
    button[type="submit"] {
      width: 100%;
      padding: 14px 28px;
      background: linear-gradient(135deg, ${c.primary}, ${c.secondary});
      color: white;
      border: none;
      border-radius: ${s.borderRadius.button};
      font-size: ${s.fontSize.button};
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }
    button[type="submit"]:hover {
      opacity: 0.9;
      ${s.animation ? 'transform: translateY(-1px);' : ''}
    }
    .form-divider {
      border: none;
      border-top: 1px solid ${c.border};
      margin: 24px 0;
    }
    .form-heading {
      color: ${c.text};
      margin: 20px 0 12px;
    }
    .success-message {
      text-align: center;
      padding: 40px;
      color: ${c.success};
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h1 class="form-title">${form.name}</h1>
    ${form.description ? `<p class="form-description">${form.description}</p>` : ''}
    
    <form id="revoform" onsubmit="handleSubmit(event)">
      ${fieldsHTML}
      <button type="submit">${form.settings.submitButtonText}</button>
    </form>
  </div>

  <script>
    // Rating functionality
    document.querySelectorAll('.rating-field').forEach(field => {
      const stars = field.querySelectorAll('.star');
      const input = field.querySelector('input[type="hidden"]');
      
      stars.forEach((star, index) => {
        star.addEventListener('click', () => {
          input.value = index + 1;
          stars.forEach((s, i) => {
            s.classList.toggle('active', i <= index);
          });
        });
        star.addEventListener('mouseenter', () => {
          stars.forEach((s, i) => {
            s.style.color = i <= index ? '#fbbf24' : '';
          });
        });
      });
      
      field.addEventListener('mouseleave', () => {
        const val = parseInt(input.value) || 0;
        stars.forEach((s, i) => {
          s.style.color = '';
          s.classList.toggle('active', i < val);
        });
      });
    });

    function handleSubmit(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
            
      // Show success message
      document.querySelector('.form-container').innerHTML = \`
        <div class="success-message">
          <h2>✓</h2>
          <p>${form.settings.successMessage}</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`

  return {
    code: html,
    instructions: `
## Standalone HTML Form

This is a complete, self-contained HTML form that can be:
- Hosted on any web server
- Embedded in any website
- Used as a starting point for customization

**To use:**
1. Save as .html file
2. Open in browser or upload to hosting
3. Customize the form action to submit to your backend
    `.trim()
  }
}

// Main export function
export function exportForm(
  form: CanvasForm, 
  platform: WordPressPlugin | 'html' | 'react' | 'json',
  builder?: WordPressBuilder
): ExportResult {
  switch (platform) {
    case 'gravity-forms':
      return exportToGravityForms(form)
    case 'wpforms':
      return exportToWPForms(form)
    case 'contact-form-7':
      return exportToContactForm7(form)
    case 'html':
      return exportToHTML(form)
    case 'json':
      return {
        code: JSON.stringify(form, null, 2),
        instructions: 'JSON export of the form configuration. Can be re-imported into RevoForms.'
      }
    case 'react':
      return exportToReact(form)
    default:
      return exportToHTML(form)
  }
}

// React/Next.js export
export function exportToReact(form: CanvasForm): ExportResult {
  const componentName = form.name.replace(/[^a-zA-Z0-9]/g, '') || 'Form'
  const c = form.styling.colors
  const s = form.styling

  const fieldsJSX = form.fields.map(field => {
    const required = field.required ? 'required' : ''
    
    switch (field.type) {
      case 'textarea':
        return `        <div className="form-field">
          <label>{${JSON.stringify(field.label)}}${field.required ? ' <span className="required">*</span>' : ''}</label>
          <textarea
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            rows={${field.rows || 4}}
            value={formData.${field.id} || ''}
            onChange={handleChange}
            ${required}
          />
        </div>`
      case 'select':
        const options = field.options?.map(o => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return `<option value="${val}">${label}</option>`
        }).join('\n            ') || ''
        return `        <div className="form-field">
          <label>{${JSON.stringify(field.label)}}${field.required ? ' <span className="required">*</span>' : ''}</label>
          <select name="${field.id}" value={formData.${field.id} || ''} onChange={handleChange} ${required}>
            <option value="">${field.placeholder || 'Select...'}</option>
            ${options}
          </select>
        </div>`
      case 'rating':
        return `        <div className="form-field">
          <label>{${JSON.stringify(field.label)}}${field.required ? ' <span className="required">*</span>' : ''}</label>
          <div className="rating-field">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                type="button"
                className={\`star \${(formData.${field.id} || 0) >= star ? 'active' : ''}\`}
                onClick={() => setFormData(prev => ({...prev, ${field.id}: star}))}
              >★</button>
            ))}
          </div>
        </div>`
      default:
        return `        <div className="form-field">
          <label>{${JSON.stringify(field.label)}}${field.required ? ' <span className="required">*</span>' : ''}</label>
          <input
            type="${field.type}"
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            value={formData.${field.id} || ''}
            onChange={handleChange}
            ${required}
          />
        </div>`
    }
  }).join('\n\n')

  const code = `'use client'

import { useState } from 'react'
import './form-styles.css'

export default function ${componentName}() {
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
        setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="form-container">
        <div className="success-message">
          <h2>✓</h2>
          <p>${form.settings.successMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-container">
      <h1 className="form-title">${form.name}</h1>
      ${form.description ? `<p className="form-description">${form.description}</p>` : ''}
      
      <form onSubmit={handleSubmit}>
${fieldsJSX}

        <button type="submit">${form.settings.submitButtonText}</button>
      </form>
    </div>
  )
}`

  const css = generateFormCSS(form.styling, 'react')

  return {
    code,
    css,
    instructions: `
## React Component Export

**Files created:**
1. \`${componentName}.jsx\` - The React component
2. \`form-styles.css\` - Styling

**Usage:**
\`\`\`jsx
import ${componentName} from './${componentName}'

function App() {
  return <${componentName} />
}
\`\`\`

**For Next.js App Router:**
- Place component in \`components/\` folder
- Import and use in any page
    `.trim()
  }
}

export default exportForm
