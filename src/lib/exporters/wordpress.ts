/**
 * WordPress Form Exporters
 * Supports: Gravity Forms, WPForms, Contact Form 7, Ninja Forms, Formidable
 */

import type { CanvasForm, FormField, FormStyling } from '@/types/form'

// Gravity Forms field type mapping
const GRAVITY_FIELD_TYPES: Record<string, string> = {
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
  pagebreak: 'page',
  divider: 'section',
  heading: 'section',
}

export function exportToGravityForms(form: CanvasForm): string {
  const gfFields = form.fields.map((field, index) => ({
    id: index + 1,
    type: GRAVITY_FIELD_TYPES[field.type] || 'text',
    label: field.label,
    isRequired: field.required,
    placeholder: field.placeholder || '',
    description: field.helpText || '',
    defaultValue: field.defaultValue || '',
    choices: field.options?.map((opt, i) => ({
      text: typeof opt === 'string' ? opt : opt.label,
      value: typeof opt === 'string' ? opt : opt.value,
      isSelected: false,
    })),
    ...(field.validation && {
      maxLength: field.validation.maxLength,
      minLength: field.validation.minLength,
    }),
    cssClass: `revoform-field revoform-${field.type}`,
    size: field.width === 'half' ? 'medium' : field.width === 'third' ? 'small' : 'large',
  }))

  const gravityForm = {
    title: form.name,
    description: form.description || '',
    labelPlacement: 'top_label',
    descriptionPlacement: 'below',
    button: {
      type: 'text',
      text: form.settings.submitButtonText,
    },
    fields: gfFields,
    confirmations: {
      1: {
        id: 1,
        name: 'Default Confirmation',
        type: 'message',
        message: form.settings.successMessage,
        isDefault: true,
      },
    },
  }

  return JSON.stringify(gravityForm, null, 2)
}

// WPForms field type mapping
const WPFORMS_FIELD_TYPES: Record<string, string> = {
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
  pagebreak: 'pagebreak',
  divider: 'divider',
  rating: 'rating',
}

export function exportToWPForms(form: CanvasForm): string {
  const wpFields: Record<string, any> = {}
  
  form.fields.forEach((field, index) => {
    const fieldId = index + 1
    wpFields[fieldId] = {
      id: fieldId,
      type: WPFORMS_FIELD_TYPES[field.type] || 'text',
      label: field.label,
      required: field.required ? '1' : '0',
      placeholder: field.placeholder || '',
      description: field.helpText || '',
      default_value: field.defaultValue || '',
      choices: field.options?.reduce((acc, opt, i) => {
        acc[i + 1] = {
          label: typeof opt === 'string' ? opt : opt.label,
          value: typeof opt === 'string' ? opt : opt.value,
        }
        return acc
      }, {} as Record<number, any>),
      size: field.width === 'half' ? 'medium' : field.width === 'third' ? 'small' : 'large',
      css: `revoform-field revoform-${field.type}`,
    }
  })

  const wpForm = {
    field_id: form.fields.length,
    fields: wpFields,
    settings: {
      form_title: form.name,
      form_desc: form.description || '',
      submit_text: form.settings.submitButtonText,
      confirmation_type: 'message',
      confirmation_message: form.settings.successMessage,
    },
  }

  return JSON.stringify(wpForm, null, 2)
}

// Contact Form 7 shortcode generator
export function exportToContactForm7(form: CanvasForm): string {
  const lines: string[] = []
  
  form.fields.forEach(field => {
    const required = field.required ? '*' : ''
    const name = field.id.replace(/-/g, '_')
    
    switch (field.type) {
      case 'text':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[text${required} ${name} placeholder "${field.placeholder || ''}"]`)
        break
      case 'email':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[email${required} ${name} placeholder "${field.placeholder || ''}"]`)
        break
      case 'phone':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[tel${required} ${name} placeholder "${field.placeholder || ''}"]`)
        break
      case 'textarea':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[textarea${required} ${name} placeholder "${field.placeholder || ''}"]`)
        break
      case 'select':
        const options = field.options?.map(o => typeof o === 'string' ? o : o.label).join(' | ') || ''
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[select${required} ${name} "${options}"]`)
        break
      case 'radio':
        const radioOpts = field.options?.map(o => typeof o === 'string' ? o : o.label).join(' | ') || ''
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[radio ${name} "${radioOpts}"]`)
        break
      case 'checkbox':
        const checkOpts = field.options?.map(o => typeof o === 'string' ? o : o.label).join(' | ') || ''
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[checkbox ${name} "${checkOpts}"]`)
        break
      case 'file':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[file${required} ${name}]`)
        break
      case 'date':
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[date${required} ${name}]`)
        break
      default:
        lines.push(`<label>${field.label}${required ? ' *' : ''}</label>`)
        lines.push(`[text${required} ${name} placeholder "${field.placeholder || ''}"]`)
    }
    lines.push('')
  })
  
  lines.push(`[submit "${form.settings.submitButtonText}"]`)
  
  return lines.join('\n')
}

// Generate CSS from form styling
export function generateCSS(form: CanvasForm): string {
  const { colors, fontFamily, fontSize, spacing, borderRadius, shadows } = form.styling

  return `/* RevoForms Generated CSS */
.revoform {
  font-family: ${fontFamily};
  background: ${colors.background};
  padding: ${spacing.padding};
  border-radius: ${borderRadius.form};
  ${shadows ? 'box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);' : ''}
}

.revoform-title {
  color: ${colors.text};
  font-size: ${fontSize.heading};
  margin-bottom: 8px;
}

.revoform-description {
  color: ${colors.textMuted};
  margin-bottom: 24px;
}

.revoform-field {
  margin-bottom: ${spacing.fieldGap};
}

.revoform-label {
  display: block;
  font-size: ${fontSize.label};
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 6px;
}

.revoform-required {
  color: ${colors.error};
  margin-left: 4px;
}

.revoform-input,
.revoform-textarea,
.revoform-select {
  width: 100%;
  padding: 12px 16px;
  font-size: ${fontSize.input};
  font-family: ${fontFamily};
  color: ${colors.text};
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${borderRadius.input};
  transition: border-color 0.2s, box-shadow 0.2s;
}

.revoform-input:focus,
.revoform-textarea:focus,
.revoform-select:focus {
  outline: none;
  border-color: ${colors.primary};
  box-shadow: 0 0 0 3px ${colors.primary}20;
}

.revoform-input::placeholder {
  color: ${colors.textMuted};
}

.revoform-checkbox-group,
.revoform-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.revoform-checkbox-item,
.revoform-radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.revoform-checkbox,
.revoform-radio {
  width: 18px;
  height: 18px;
  accent-color: ${colors.primary};
}

.revoform-submit {
  width: 100%;
  padding: 14px 24px;
  font-size: ${fontSize.button};
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
  border: none;
  border-radius: ${borderRadius.button};
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

.revoform-submit:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.revoform-error {
  color: ${colors.error};
  font-size: 13px;
  margin-top: 4px;
}

.revoform-help {
  color: ${colors.textMuted};
  font-size: 12px;
  margin-top: 4px;
}

/* Rating stars */
.revoform-rating {
  display: flex;
  gap: 4px;
}

.revoform-star {
  font-size: 24px;
  color: ${colors.border};
  cursor: pointer;
  transition: color 0.2s;
}

.revoform-star.active,
.revoform-star:hover {
  color: #fbbf24;
}

/* Responsive */
@media (max-width: 640px) {
  .revoform {
    padding: 16px;
  }
  
  .revoform-field-half,
  .revoform-field-third {
    width: 100%;
  }
}
`
}

// Generate full HTML form
export function exportToHTML(form: CanvasForm, includeStyles: boolean = true): string {
  const css = includeStyles ? `<style>\n${generateCSS(form)}\n</style>\n\n` : ''
  
  const fieldsHTML = form.fields.map(field => {
    const required = field.required ? '<span class="revoform-required">*</span>' : ''
    const requiredAttr = field.required ? 'required' : ''
    const helpText = field.helpText ? `<p class="revoform-help">${field.helpText}</p>` : ''
    
    switch (field.type) {
      case 'textarea':
        return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <textarea class="revoform-textarea" name="${field.id}" placeholder="${field.placeholder || ''}" rows="${field.rows || 4}" ${requiredAttr}></textarea>
    ${helpText}
  </div>`

      case 'select':
        const options = field.options?.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return `      <option value="${val}">${label}</option>`
        }).join('\n') || ''
        return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <select class="revoform-select" name="${field.id}" ${requiredAttr}>
      <option value="">${field.placeholder || 'Select...'}</option>
${options}
    </select>
    ${helpText}
  </div>`

      case 'radio':
        const radioOptions = field.options?.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return `      <label class="revoform-radio-item">
        <input type="radio" class="revoform-radio" name="${field.id}" value="${val}" ${requiredAttr}>
        <span>${label}</span>
      </label>`
        }).join('\n') || ''
        return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <div class="revoform-radio-group">
${radioOptions}
    </div>
    ${helpText}
  </div>`

      case 'checkbox':
        if (field.options && field.options.length > 0) {
          const checkOptions = field.options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value
            const label = typeof opt === 'string' ? opt : opt.label
            return `      <label class="revoform-checkbox-item">
        <input type="checkbox" class="revoform-checkbox" name="${field.id}[]" value="${val}">
        <span>${label}</span>
      </label>`
          }).join('\n')
          return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <div class="revoform-checkbox-group">
${checkOptions}
    </div>
    ${helpText}
  </div>`
        }
        return `  <div class="revoform-field">
    <label class="revoform-checkbox-item">
      <input type="checkbox" class="revoform-checkbox" name="${field.id}" ${requiredAttr}>
      <span>${field.label}</span>
    </label>
    ${helpText}
  </div>`

      case 'rating':
        const stars = Array.from({ length: field.maxStars || 5 }, (_, i) => 
          `<span class="revoform-star" data-value="${i + 1}">★</span>`
        ).join('')
        return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <div class="revoform-rating" data-name="${field.id}">
      ${stars}
    </div>
    <input type="hidden" name="${field.id}" class="revoform-rating-value">
    ${helpText}
  </div>`

      case 'divider':
        return `  <hr class="revoform-divider">`

      case 'heading':
        const tag = field.headingLevel || 'h3'
        return `  <${tag} class="revoform-heading">${field.label}</${tag}>`

      case 'paragraph':
      case 'html':
        return `  <div class="revoform-content">${field.content || ''}</div>`

      default:
        return `  <div class="revoform-field">
    <label class="revoform-label">${field.label}${required}</label>
    <input type="${field.type}" class="revoform-input" name="${field.id}" placeholder="${field.placeholder || ''}" ${requiredAttr}>
    ${helpText}
  </div>`
    }
  }).join('\n\n')

  return `${css}<form class="revoform" id="${form.id}">
  <h2 class="revoform-title">${form.name}</h2>
  ${form.description ? `<p class="revoform-description">${form.description}</p>` : ''}

${fieldsHTML}

  <button type="submit" class="revoform-submit">${form.settings.submitButtonText}</button>
</form>

<script>
// Rating functionality
document.querySelectorAll('.revoform-rating').forEach(rating => {
  const stars = rating.querySelectorAll('.revoform-star');
  const input = rating.nextElementSibling;
  
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      input.value = index + 1;
      stars.forEach((s, i) => s.classList.toggle('active', i <= index));
    });
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, i) => s.style.color = i <= index ? '#fbbf24' : '');
    });
  });
  
  rating.addEventListener('mouseleave', () => {
    stars.forEach((s, i) => s.style.color = i < input.value ? '#fbbf24' : '');
  });
});
</script>`
}

// Elementor widget export (HTML widget compatible)
export function exportToElementor(form: CanvasForm): string {
  const html = exportToHTML(form, true)
  
  return `<!-- 
  ELEMENTOR INTEGRATION INSTRUCTIONS:
  ==================================
  1. Add an HTML widget to your page
  2. Paste this entire code block
  3. The form will render with full styling
  
  For Gravity Forms integration:
  - Use the Gravity Forms widget instead
  - Import the JSON from "Export > Gravity Forms"
-->

${html}`
}

// Bricks Builder export (code block compatible)
export function exportToBricks(form: CanvasForm): string {
  const html = exportToHTML(form, true)
  
  return `<!-- 
  BRICKS BUILDER INTEGRATION:
  ===========================
  1. Add a Code element to your page
  2. Paste this entire code block
  3. The form will render with full styling
  
  Alternative - Use Bricks' native form element:
  - Copy field configuration from JSON export
-->

${html}`
}

// Ninja Forms export
export function exportToNinjaForms(form: CanvasForm): string {
  const fields = form.fields.map((field, index) => ({
    id: index + 1,
    type: field.type === 'textarea' ? 'textarea' : 
          field.type === 'select' ? 'listselect' :
          field.type === 'checkbox' ? 'checkbox' :
          field.type === 'radio' ? 'listradio' :
          field.type === 'email' ? 'email' :
          field.type === 'phone' ? 'phone' :
          field.type === 'date' ? 'date' :
          field.type === 'file' ? 'file_upload' : 'textbox',
    label: field.label,
    required: field.required,
    placeholder: field.placeholder || '',
    desc_text: field.helpText || '',
    options: field.options?.map(opt => ({
      label: typeof opt === 'string' ? opt : opt.label,
      value: typeof opt === 'string' ? opt : opt.value,
    })),
  }))

  return JSON.stringify({
    settings: {
      title: form.name,
      show_title: 1,
      clear_complete: 1,
      hide_complete: 1,
    },
    fields,
  }, null, 2)
}

// Master export function
export function exportForm(form: CanvasForm, platform: string): { code: string; filename: string; instructions: string } {
  switch (platform) {
    case 'wordpress-gravity':
      return {
        code: exportToGravityForms(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-gravity-forms.json`,
        instructions: `
1. Go to Forms > Import/Export in WordPress admin
2. Click "Import Forms"  
3. Upload this JSON file
4. The form will appear in your Gravity Forms list
5. Add custom CSS in Appearance > Customize > Additional CSS`
      }
    
    case 'wordpress-wpforms':
      return {
        code: exportToWPForms(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-wpforms.json`,
        instructions: `
1. Go to WPForms > Tools > Import in WordPress admin
2. Upload this JSON file
3. The form will be imported to your forms list
4. Customize styling in WPForms > Settings`
      }
    
    case 'wordpress-contact7':
      return {
        code: exportToContactForm7(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-cf7.txt`,
        instructions: `
1. Go to Contact > Add New in WordPress admin
2. Paste the shortcode content in the form editor
3. Configure mail settings in the Mail tab
4. Copy the generated shortcode to use on your page`
      }
    
    case 'wordpress-ninja':
      return {
        code: exportToNinjaForms(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-ninja-forms.json`,
        instructions: `
1. Go to Ninja Forms > Import/Export
2. Click "Import a Form"
3. Upload this JSON file
4. The form will appear in your forms list`
      }
    
    case 'elementor':
      return {
        code: exportToElementor(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-elementor.html`,
        instructions: `
1. Edit your page with Elementor
2. Add an HTML widget
3. Paste the code in the HTML content area
4. Update the page to see your form`
      }
    
    case 'bricks':
      return {
        code: exportToBricks(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}-bricks.html`,
        instructions: `
1. Edit your page with Bricks
2. Add a Code element
3. Paste the code in the code content area
4. Save to see your form`
      }
    
    case 'html':
      return {
        code: exportToHTML(form, true),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}.html`,
        instructions: `
1. Copy this HTML code
2. Paste it into your website's HTML
3. The form includes all styles inline
4. Customize the CSS as needed`
      }
    
    case 'css':
      return {
        code: generateCSS(form),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}.css`,
        instructions: `
1. Copy this CSS code
2. Add it to your stylesheet
3. Make sure your form has class "revoform"
4. Customize colors and styles as needed`
      }
    
    default:
      return {
        code: JSON.stringify(form, null, 2),
        filename: `${form.name.toLowerCase().replace(/\s+/g, '-')}.json`,
        instructions: 'Raw JSON export of the form data'
      }
  }
}
