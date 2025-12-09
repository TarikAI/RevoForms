import type { FormField, FormStyling } from '@/types/form'

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: 'business' | 'feedback' | 'registration' | 'hr' | 'marketing' | 'other'
  icon: string
  fields: Omit<FormField, 'id'>[]
  settings: {
    submitButtonText: string
    successMessage: string
  }
  styling?: Partial<FormStyling>
}

const defaultStyling: Partial<FormStyling> = {
  theme: 'glassmorphism',
  colors: {
    primary: '#06b6d4',
    secondary: '#a855f7',
    background: 'rgba(15, 15, 26, 0.9)',
    surface: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    error: '#f87171',
    success: '#4ade80',
    accent: '#a855f7'
  },
  borderRadius: { input: '12px', button: '12px', form: '20px' },
  shadows: true,
  animation: true
}

export const formTemplates: FormTemplate[] = [
  // 1. Contact Form
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Simple contact form for customer inquiries',
    category: 'business',
    icon: '📧',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567' },
      { type: 'select', label: 'Subject', placeholder: 'Select a topic', required: true, options: ['General Inquiry', 'Support', 'Sales', 'Partnership', 'Other'] },
      { type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true, rows: 4 }
    ],
    settings: { submitButtonText: 'Send Message', successMessage: 'Thank you for reaching out! We\'ll get back to you within 24 hours.' },
    styling: defaultStyling
  },

  // 2. Customer Feedback Survey
  {
    id: 'feedback-survey',
    name: 'Customer Feedback',
    description: 'Collect valuable feedback from your customers',
    category: 'feedback',
    icon: '⭐',
    fields: [
      { type: 'heading', label: 'We value your feedback!', headingLevel: 'h2' },
      { type: 'paragraph', label: '', content: 'Help us improve by sharing your experience.' },
      { type: 'rating', label: 'Overall Satisfaction', required: true, maxStars: 5 },
      { type: 'select', label: 'How did you hear about us?', options: ['Search Engine', 'Social Media', 'Friend/Family', 'Advertisement', 'Other'] },
      { type: 'radio', label: 'Would you recommend us?', required: true, options: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'Probably No', 'Definitely No'] },
      { type: 'checkbox', label: 'What did you like?', options: ['Product Quality', 'Customer Service', 'Pricing', 'User Experience', 'Delivery Speed'] },
      { type: 'textarea', label: 'Additional Comments', placeholder: 'Tell us more about your experience...', rows: 3 }
    ],
    settings: { submitButtonText: 'Submit Feedback', successMessage: 'Thank you for your feedback! Your input helps us improve.' },
    styling: defaultStyling
  },

  // 3. Event Registration
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees for events and workshops',
    category: 'registration',
    icon: '🎟️',
    fields: [
      { type: 'text', label: 'First Name', placeholder: 'John', required: true },
      { type: 'text', label: 'Last Name', placeholder: 'Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@company.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'text', label: 'Company', placeholder: 'Acme Inc.' },
      { type: 'select', label: 'Ticket Type', required: true, options: ['General Admission - $50', 'VIP Access - $150', 'Student - $25'] },
      { type: 'checkbox', label: 'Dietary Requirements', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'No Restrictions'] }
    ],
    settings: { submitButtonText: 'Register Now', successMessage: 'You\'re registered! Check your email for confirmation.' },
    styling: defaultStyling
  },

  // 4. Job Application
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Collect job applications with resume upload',
    category: 'hr',
    icon: '💼',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'url', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/johndoe' },
      { type: 'select', label: 'Years of Experience', required: true, options: ['0-1 years', '2-3 years', '4-5 years', '6-10 years', '10+ years'] },
      { type: 'file', label: 'Upload Resume', accept: '.pdf,.doc,.docx', required: true },
      { type: 'date', label: 'Earliest Start Date', required: true },
      { type: 'textarea', label: 'Why do you want to join us?', placeholder: 'Tell us about your motivation...', required: true, rows: 4 }
    ],
    settings: { submitButtonText: 'Submit Application', successMessage: 'Application received! We\'ll review it and get back to you.' },
    styling: defaultStyling
  },

  // 5. Newsletter Signup
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Grow your email list with this simple signup form',
    category: 'marketing',
    icon: '📬',
    fields: [
      { type: 'heading', label: 'Stay Updated!', headingLevel: 'h2' },
      { type: 'paragraph', label: '', content: 'Subscribe for the latest news and exclusive offers.' },
      { type: 'text', label: 'First Name', placeholder: 'John', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'checkbox', label: 'I\'m interested in:', options: ['Product Updates', 'Industry News', 'Tips & Tutorials', 'Special Offers'] }
    ],
    settings: { submitButtonText: 'Subscribe', successMessage: 'Welcome! Check your inbox to confirm.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#10b981', secondary: '#06b6d4' } }
  },

  // 6. Support Ticket
  {
    id: 'support-ticket',
    name: 'Support Ticket',
    description: 'Allow customers to submit support requests',
    category: 'business',
    icon: '🎫',
    fields: [
      { type: 'text', label: 'Your Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'text', label: 'Order/Account ID', placeholder: 'e.g., ORD-12345' },
      { type: 'select', label: 'Issue Category', required: true, options: ['Technical Issue', 'Billing Question', 'Account Access', 'Bug Report', 'Other'] },
      { type: 'select', label: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { type: 'text', label: 'Subject', placeholder: 'Brief description', required: true },
      { type: 'textarea', label: 'Describe the Issue', placeholder: 'Please provide details...', required: true, rows: 5 },
      { type: 'file', label: 'Attach Screenshots', accept: 'image/*', multiple: true }
    ],
    settings: { submitButtonText: 'Submit Ticket', successMessage: 'Ticket submitted! Check your email for ticket number.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#f59e0b', secondary: '#ef4444' } }
  },

  // 7. Appointment Booking
  {
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Let clients book appointments or consultations',
    category: 'business',
    icon: '📅',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'select', label: 'Service Type', required: true, options: ['Consultation - 30 min', 'Full Session - 60 min', 'Follow-up - 15 min'] },
      { type: 'date', label: 'Preferred Date', required: true },
      { type: 'select', label: 'Preferred Time', required: true, options: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] },
      { type: 'radio', label: 'Appointment Type', required: true, options: ['In-Person', 'Video Call', 'Phone Call'] },
      { type: 'textarea', label: 'Notes', placeholder: 'Anything we should know?', rows: 3 }
    ],
    settings: { submitButtonText: 'Book Appointment', successMessage: 'Booking request received! We\'ll confirm via email.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#8b5cf6', secondary: '#ec4899' } }
  },

  // 8. Product Order Form
  {
    id: 'order-form',
    name: 'Product Order',
    description: 'Simple order form for products or services',
    category: 'business',
    icon: '🛒',
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'text', label: 'Street Address', placeholder: '123 Main St', required: true },
      { type: 'text', label: 'City', placeholder: 'New York', required: true },
      { type: 'text', label: 'ZIP Code', placeholder: '10001', required: true },
      { type: 'select', label: 'Product', required: true, options: ['Basic - $29', 'Standard - $49', 'Premium - $99'] },
      { type: 'number', label: 'Quantity', placeholder: '1', required: true },
      { type: 'textarea', label: 'Special Instructions', placeholder: 'Any customization?', rows: 2 }
    ],
    settings: { submitButtonText: 'Place Order', successMessage: 'Order placed! Check your email for confirmation.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#22c55e', secondary: '#10b981' } }
  },

  // 9. Quiz/Assessment
  {
    id: 'quiz-assessment',
    name: 'Quiz / Assessment',
    description: 'Create quizzes or self-assessment forms',
    category: 'other',
    icon: '📝',
    fields: [
      { type: 'heading', label: 'Knowledge Assessment', headingLevel: 'h2' },
      { type: 'text', label: 'Your Name', placeholder: 'Enter your name', required: true },
      { type: 'email', label: 'Email (for results)', placeholder: 'john@example.com', required: true },
      { type: 'radio', label: 'Q1: What year was the company founded?', required: true, options: ['2018', '2019', '2020', '2021'] },
      { type: 'radio', label: 'Q2: Which is our core value?', required: true, options: ['Speed', 'Innovation', 'Tradition', 'Competition'] },
      { type: 'checkbox', label: 'Q3: Select all that apply:', options: ['Cloud-based', 'AI-powered', 'Open source', 'Mobile-first'] },
      { type: 'textarea', label: 'Bonus: Share your thoughts', placeholder: 'Optional...', rows: 3 }
    ],
    settings: { submitButtonText: 'Submit Answers', successMessage: 'Assessment complete! Results will be emailed.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#3b82f6', secondary: '#6366f1' } }
  },

  // 10. Employee Onboarding
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Collect new employee information',
    category: 'hr',
    icon: '👋',
    fields: [
      { type: 'heading', label: 'Welcome to the Team!', headingLevel: 'h2' },
      { type: 'text', label: 'Full Legal Name', placeholder: 'As it appears on ID', required: true },
      { type: 'text', label: 'Preferred Name', placeholder: 'What should we call you?' },
      { type: 'email', label: 'Personal Email', placeholder: 'For backup communication', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'date', label: 'Date of Birth', required: true },
      { type: 'divider', label: 'Emergency Contact' },
      { type: 'text', label: 'Emergency Contact Name', placeholder: 'Full name', required: true },
      { type: 'phone', label: 'Emergency Contact Phone', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'select', label: 'T-Shirt Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { type: 'select', label: 'Preferred Setup', options: ['Mac', 'Windows', 'Linux'] },
      { type: 'checkbox', label: 'Equipment Needed', options: ['External Monitor', 'Keyboard', 'Mouse', 'Headset'] }
    ],
    settings: { submitButtonText: 'Complete Onboarding', successMessage: 'Welcome aboard! HR will reach out with next steps.' },
    styling: { ...defaultStyling, colors: { ...defaultStyling.colors!, primary: '#14b8a6', secondary: '#0ea5e9' } }
  }
]

// Helper to get templates by category
export function getTemplatesByCategory(category: FormTemplate['category']): FormTemplate[] {
  return formTemplates.filter(t => t.category === category)
}

// Helper to get all categories
export function getTemplateCategories(): { id: FormTemplate['category']; label: string; icon: string }[] {
  return [
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'registration', label: 'Registration', icon: '📝' },
    { id: 'hr', label: 'HR', icon: '👥' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'other', label: 'Other', icon: '📦' }
  ]
}
