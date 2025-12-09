import { NextRequest, NextResponse } from 'next/server'
import type { CanvasForm, FormField, FormFieldOption } from '@/types/form'

type ExportFormat = 'react' | 'html' | 'vue' | 'wordpress' | 'json' | 'tailwind'

// Helper to normalize options
function getOptionValue(opt: string | FormFieldOption): string {
  return typeof opt === 'string' ? opt : opt.value
}

function getOptionLabel(opt: string | FormFieldOption): string {
  return typeof opt === 'string' ? opt : opt.label
}

export async function POST(request: NextRequest) {
  try {
    const { form, format } = await request.json() as { form: CanvasForm; format: ExportFormat }

    if (!form || !format) {
      return NextResponse.json({ error: 'Missing form or format' }, { status: 400 })
    }

    let code: string

    switch (format) {
      case 'react':
        code = generateReactCode(form)
        break
      case 'html':
        code = generateHTMLCode(form)
        break
      case 'vue':
        code = generateVueCode(form)
        break
      case 'wordpress':
        code = generateWordPressCode(form)
        break
      case 'tailwind':
        code = generateTailwindCode(form)
        break
      case 'json':
      default:
        code = JSON.stringify(form, null, 2)
    }

    return NextResponse.json({ code, format })
  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

// =====================
// CODE GENERATORS
// =====================

function generateFieldJSX(field: FormField): string {
  const required = field.required ? 'required' : ''
  const baseClass = 'w-full px-4 py-3 rounded-xl border bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-cyan-400 focus:outline-none transition-colors'

  switch (field.type) {
    case 'textarea':
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">${field.label}</label>
        <textarea
          name="${field.id}"
          placeholder="${field.placeholder || ''}"
          ${required}
          rows={4}
          className="${baseClass} resize-none"
        />
      </div>`
    
    case 'select':
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">${field.label}</label>
        <select name="${field.id}" ${required} className="${baseClass}">
          <option value="">${field.placeholder || 'Select...'}</option>
          ${field.options?.map(opt => `<option value="${getOptionValue(opt)}">${getOptionLabel(opt)}</option>`).join('\n          ')}
        </select>
      </div>`
    
    case 'checkbox':
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90 mb-2">${field.label}</label>
        <div className="space-y-2">
          ${field.options?.map(opt => `
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="${field.id}" value="${getOptionValue(opt)}" className="w-4 h-4 rounded text-cyan-400" />
            <span className="text-white/80">${getOptionLabel(opt)}</span>
          </label>`).join('')}
        </div>
      </div>`
    
    case 'radio':
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90 mb-2">${field.label}</label>
        <div className="space-y-2">
          ${field.options?.map(opt => `
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="${field.id}" value="${getOptionValue(opt)}" className="w-4 h-4 text-cyan-400" />
            <span className="text-white/80">${getOptionLabel(opt)}</span>
          </label>`).join('')}
        </div>
      </div>`
    
    case 'rating':
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">${field.label}</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button" className="text-2xl text-white/30 hover:text-yellow-400 transition-colors">★</button>
          ))}
        </div>
      </div>`
    
    default:
      return `
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">${field.label}</label>
        <input
          type="${field.type}"
          name="${field.id}"
          placeholder="${field.placeholder || ''}"
          ${required}
          className="${baseClass}"
        />
      </div>`
  }
}

function generateReactCode(form: CanvasForm): string {
  return `'use client'

import { useState } from 'react'

export function ${toPascalCase(form.name)}() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    // Submit to RevoForms API
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.com'}/api/submit/${form.id}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: data,
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }
      })
    })

    if (response.ok) {
      setIsSubmitting(false)
      setIsSuccess(true)
    } else {
      setIsSubmitting(false)
      alert('Error submitting form. Please try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-white">${form.settings.successMessage}</h3>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">${form.name}</h2>
        ${form.description ? `<p className="text-white/60 mt-2">${form.description}</p>` : ''}
      </div>
      
      ${form.fields.map(field => generateFieldJSX(field)).join('\n      ')}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {isSubmitting ? 'Submitting...' : '${form.settings.submitButtonText}'}
      </button>
    </form>
  )
}
`
}


function generateHTMLCode(form: CanvasForm): string {
  const generateHTMLField = (field: FormField): string => {
    const required = field.required ? 'required' : ''
    
    switch (field.type) {
      case 'textarea':
        return `
    <div class="form-group">
      <label for="${field.id}">${field.label}</label>
      <textarea id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" ${required} rows="4"></textarea>
    </div>`
      case 'select':
        return `
    <div class="form-group">
      <label for="${field.id}">${field.label}</label>
      <select id="${field.id}" name="${field.id}" ${required}>
        <option value="">${field.placeholder || 'Select...'}</option>
        ${field.options?.map(opt => `<option value="${getOptionValue(opt)}">${getOptionLabel(opt)}</option>`).join('\n        ')}
      </select>
    </div>`
      default:
        return `
    <div class="form-group">
      <label for="${field.id}">${field.label}</label>
      <input type="${field.type}" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" ${required} />
    </div>`
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0A0E27; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .form-container { background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 40px; max-width: 480px; width: 100%; }
    .form-title { color: white; font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 8px; }
    .form-desc { color: rgba(255,255,255,0.6); text-align: center; margin-bottom: 32px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; color: rgba(255,255,255,0.9); font-size: 0.875rem; margin-bottom: 8px; }
    input, textarea, select { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; font-size: 1rem; transition: border-color 0.2s; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #00FFFF; }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
    button[type="submit"] { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #00FFFF, #8A2BE2); color: white; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    button[type="submit"]:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="form-container">
    <h1 class="form-title">${form.name}</h1>
    ${form.description ? `<p class="form-desc">${form.description}</p>` : ''}
    <form id="${form.id}Form" onsubmit="handleFormSubmit(event)" method="POST">
      ${form.fields.map(field => generateHTMLField(field)).join('')}
      <button type="submit">${form.settings.submitButtonText}</button>
    </form>
  </div>

  <script>
    async function handleFormSubmit(event) {
      event.preventDefault();

      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Submit to RevoForms API
      const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.com'}/api/submit/${form.id}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          }
        })
      })

      if (response.ok) {
        form.innerHTML = '<div style="text-align: center;"><div style="font-size: 3rem; margin-bottom: 1rem;">✅</div><h3 style="color: white;">${form.settings.successMessage}</h3></div>';
      } else {
        alert('Error submitting form. Please try again.');
      }
    }
  </script>
</body>
</html>`
}

function generateVueCode(form: CanvasForm): string {
  return `<template>
  <div class="form-container">
    <h2>{{ title }}</h2>
    <form @submit.prevent="handleSubmit">
      ${form.fields.map(f => `
      <div class="form-group">
        <label :for="'${f.id}'">${f.label}</label>
        <input 
          v-model="formData.${f.id}" 
          type="${f.type}" 
          id="${f.id}" 
          placeholder="${f.placeholder || ''}"
          ${f.required ? 'required' : ''}
        />
      </div>`).join('')}
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Submitting...' : '${form.settings.submitButtonText}' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const title = '${form.name}'
const isSubmitting = ref(false)

const formData = reactive({
  ${form.fields.map(f => `${f.id}: ''`).join(',\n  ')}
})

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    // Submit to RevoForms API
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.com'}/api/submit/${form.id}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: formData,
      })
    })

    if (response.ok) {
      alert('${form.settings.successMessage}')
    } else {
      alert('Error submitting form. Please try again.')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>`
}

function generateWordPressCode(form: CanvasForm): string {
  return `<?php
/**
 * ${form.name} - Generated by RevoForms
 * 
 * Usage: Add this shortcode to any page/post: [${toSnakeCase(form.name)}]
 */

// Register the shortcode
add_shortcode('${toSnakeCase(form.name)}', 'render_${toSnakeCase(form.name)}');

function render_${toSnakeCase(form.name)}() {
    ob_start();
    ?>
    <div class="revoform-container" style="max-width: 500px; margin: 0 auto;">
        <h2 style="text-align: center; margin-bottom: 20px;"><?php echo esc_html('${form.name}'); ?></h2>
        ${form.description ? `<p style="text-align: center; color: #666; margin-bottom: 30px;"><?php echo esc_html('${form.description}'); ?></p>` : ''}
        
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('${toSnakeCase(form.name)}_submit', '${toSnakeCase(form.name)}_nonce'); ?>
            <input type="hidden" name="action" value="${toSnakeCase(form.name)}_submit">
            
            ${form.fields.map(f => `
            <div style="margin-bottom: 20px;">
                <label for="${f.id}" style="display: block; margin-bottom: 5px; font-weight: 500;">
                    <?php echo esc_html('${f.label}'); ?>
                    ${f.required ? '<span style="color: red;">*</span>' : ''}
                </label>
                <input 
                    type="${f.type}" 
                    name="${f.id}" 
                    id="${f.id}" 
                    placeholder="<?php echo esc_attr('${f.placeholder || ''}'); ?>"
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"
                    ${f.required ? 'required' : ''}
                />
            </div>`).join('')}
            
            <button type="submit" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #00FFFF, #8A2BE2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                <?php echo esc_html('${form.settings.submitButtonText}'); ?>
            </button>
        </form>
    </div>
    <?php
    return ob_get_clean();
}

// Handle form submission
add_action('admin_post_${toSnakeCase(form.name)}_submit', 'handle_${toSnakeCase(form.name)}_submit');
add_action('admin_post_nopriv_${toSnakeCase(form.name)}_submit', 'handle_${toSnakeCase(form.name)}_submit');

function handle_${toSnakeCase(form.name)}_submit() {
    if (!wp_verify_nonce($_POST['${toSnakeCase(form.name)}_nonce'], '${toSnakeCase(form.name)}_submit')) {
        wp_die('Security check failed');
    }
    
    // Process form data
    $form_data = array(
        ${form.fields.map(f => `'${f.id}' => sanitize_text_field($_POST['${f.id}'])`).join(',\n        ')}
    );
    
    // Save to RevoForms API
    $api_url = '${process.env.NEXT_PUBLIC_APP_URL || 'https://revoforms.com'}/api/submit/${form.id}';
    $response = wp_remote_post($api_url, array(
        'body' => json_encode(array(
            'data' => $form_data,
        )),
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
    ));

    if (is_wp_error($response)) {
        wp_die('Error submitting form.');
    }
    
    wp_redirect(add_query_arg('submitted', 'true', wp_get_referer()));
    exit;
}
?>`
}


function generateTailwindCode(form: CanvasForm): string {
  return `<!-- ${form.name} - Tailwind CSS Form -->
<!-- Copy this into any HTML file with Tailwind CSS loaded -->

<div class="min-h-screen bg-slate-900 flex items-center justify-center p-6">
  <div class="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
    <h2 class="text-2xl font-bold text-white text-center mb-2">${form.name}</h2>
    ${form.description ? `<p class="text-white/60 text-center mb-8">${form.description}</p>` : '<div class="mb-8"></div>'}
    
    <form class="space-y-5">
      ${form.fields.map(f => {
        const baseInput = 'w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all'
        
        if (f.type === 'textarea') {
          return `
      <div>
        <label class="block text-sm font-medium text-white/90 mb-2">${f.label}${f.required ? ' <span class="text-red-400">*</span>' : ''}</label>
        <textarea name="${f.id}" rows="4" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} class="${baseInput} resize-none"></textarea>
      </div>`
        }
        
        if (f.type === 'select') {
          return `
      <div>
        <label class="block text-sm font-medium text-white/90 mb-2">${f.label}${f.required ? ' <span class="text-red-400">*</span>' : ''}</label>
        <select name="${f.id}" ${f.required ? 'required' : ''} class="${baseInput}">
          <option value="">${f.placeholder || 'Select...'}</option>
          ${f.options?.map(o => `<option value="${getOptionValue(o)}">${getOptionLabel(o)}</option>`).join('\n          ')}
        </select>
      </div>`
        }
        
        return `
      <div>
        <label class="block text-sm font-medium text-white/90 mb-2">${f.label}${f.required ? ' <span class="text-red-400">*</span>' : ''}</label>
        <input type="${f.type}" name="${f.id}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} class="${baseInput}" />
      </div>`
      }).join('')}
      
      <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all">
        ${form.settings.submitButtonText}
      </button>
    </form>
  </div>
</div>`
}

// Helper functions
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toSnakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .join('_')
}
