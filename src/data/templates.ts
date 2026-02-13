import type { FormField } from '@/types/form'

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: 'contact' | 'survey' | 'application' | 'feedback' | 'registration' | 'order' | 'quiz' | 'event' | 'hr' | 'marketing' | 'other'
  tags: string[]
  fields: Omit<FormField, 'id'>[]
  settings?: {
    submitText?: string
    successMessage?: string
  }
  isPro?: boolean
  isNew?: boolean
  isTrending?: boolean
}

export const FORM_TEMPLATES: FormTemplate[] = [
  // CONTACT FORMS
  {
    id: 'contact-simple',
    name: 'Simple Contact Form',
    description: 'Basic contact form with name, email, and message',
    category: 'contact',
    tags: ['contact', 'simple', 'basic', 'message'],
    isNew: true,
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true }
    ],
    settings: { submitText: 'Send Message', successMessage: 'Thanks! We\'ll get back to you soon.' }
  },
  {
    id: 'contact-detailed',
    name: 'Detailed Contact Form',
    description: 'Contact form with phone, subject, and department selection',
    category: 'contact',
    tags: ['contact', 'detailed', 'support', 'department'],
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: false },
      { type: 'select', label: 'Department', options: ['Sales', 'Support', 'Billing', 'Other'], required: true },
      { type: 'text', label: 'Subject', placeholder: 'What is this about?', required: true },
      { type: 'textarea', label: 'Message', placeholder: 'Tell us more...', required: true }
    ]
  },

  // FEEDBACK FORMS
  {
    id: 'feedback-nps',
    name: 'NPS Survey',
    description: 'Net Promoter Score survey with rating and feedback',
    category: 'feedback',
    tags: ['nps', 'rating', 'customer', 'satisfaction'],
    isTrending: true,
    fields: [
      { type: 'rating', label: 'How likely are you to recommend us to a friend or colleague?', required: true },
      { type: 'radio', label: 'What is the primary reason for your score?', options: ['Product Quality', 'Customer Service', 'Price', 'Ease of Use', 'Other'], required: true },
      { type: 'textarea', label: 'Any additional feedback?', placeholder: 'Tell us more...', required: false }
    ],
    settings: { submitText: 'Submit Feedback', successMessage: 'Thank you for your feedback!' }
  },
  {
    id: 'feedback-product',
    name: 'Product Feedback',
    description: 'Collect detailed product feedback with feature ratings',
    category: 'feedback',
    tags: ['product', 'features', 'improvement', 'review'],
    fields: [
      { type: 'email', label: 'Your Email', placeholder: 'john@example.com', required: false },
      { type: 'select', label: 'Which product are you reviewing?', options: ['Product A', 'Product B', 'Product C'], required: true },
      { type: 'rating', label: 'Overall satisfaction', required: true },
      { type: 'checkbox', label: 'What features do you use most?', options: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'], required: false },
      { type: 'textarea', label: 'What could we improve?', placeholder: 'Your suggestions...', required: false },
      { type: 'radio', label: 'Would you recommend this product?', options: ['Yes, definitely', 'Maybe', 'No'], required: true }
    ]
  },

  // APPLICATION FORMS
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Comprehensive job application with resume upload',
    category: 'application',
    tags: ['job', 'recruitment', 'hr', 'career', 'resume'],
    isTrending: true,
    isPro: true,
    fields: [
      { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: true },
      { type: 'url', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/...', required: false },
      { type: 'select', label: 'Position Applying For', options: ['Software Engineer', 'Product Manager', 'Designer', 'Marketing', 'Sales', 'Other'], required: true },
      { type: 'select', label: 'Years of Experience', options: ['0-1 years', '2-3 years', '4-5 years', '6-10 years', '10+ years'], required: true },
      { type: 'file', label: 'Resume/CV', required: true },
      { type: 'textarea', label: 'Cover Letter', placeholder: 'Tell us why you\'re a great fit...', required: false },
      { type: 'radio', label: 'When can you start?', options: ['Immediately', '2 weeks', '1 month', 'Other'], required: true }
    ]
  },
  {
    id: 'scholarship-application',
    name: 'Scholarship Application',
    description: 'Academic scholarship application form',
    category: 'application',
    tags: ['scholarship', 'education', 'academic', 'student'],
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Email Address', required: true },
      { type: 'date', label: 'Date of Birth', required: true },
      { type: 'text', label: 'Current School/University', required: true },
      { type: 'select', label: 'Current Grade/Year', options: ['High School Senior', 'College Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'], required: true },
      { type: 'number', label: 'GPA', placeholder: '3.5', required: true },
      { type: 'textarea', label: 'Why do you deserve this scholarship?', required: true },
      { type: 'file', label: 'Transcript', required: true }
    ]
  },

  // REGISTRATION FORMS
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees for events with ticket options',
    category: 'registration',
    tags: ['event', 'registration', 'ticket', 'attendee'],
    isNew: true,
    fields: [
      { type: 'text', label: 'First Name', required: true },
      { type: 'text', label: 'Last Name', required: true },
      { type: 'email', label: 'Email Address', required: true },
      { type: 'phone', label: 'Phone Number', required: false },
      { type: 'select', label: 'Ticket Type', options: ['General Admission - $50', 'VIP - $150', 'Student - $25'], required: true },
      { type: 'number', label: 'Number of Tickets', placeholder: '1', required: true },
      { type: 'checkbox', label: 'Dietary Requirements', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'None'], required: false },
      { type: 'textarea', label: 'Special Requests', required: false }
    ]
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    description: 'Simple email newsletter subscription form',
    category: 'registration',
    tags: ['newsletter', 'email', 'subscribe', 'marketing'],
    fields: [
      { type: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true },
      { type: 'text', label: 'First Name', placeholder: 'John', required: false },
      { type: 'checkbox', label: 'I\'m interested in:', options: ['Product Updates', 'Industry News', 'Tips & Tutorials', 'Special Offers'], required: false }
    ],
    settings: { submitText: 'Subscribe', successMessage: 'You\'re subscribed! Check your email.' }
  },
  {
    id: 'webinar-registration',
    name: 'Webinar Registration',
    description: 'Register for online webinars and virtual events',
    category: 'registration',
    tags: ['webinar', 'online', 'virtual', 'training'],
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Work Email', required: true },
      { type: 'text', label: 'Company', required: true },
      { type: 'text', label: 'Job Title', required: true },
      { type: 'select', label: 'How did you hear about this webinar?', options: ['Email', 'Social Media', 'Search Engine', 'Colleague', 'Other'], required: false },
      { type: 'textarea', label: 'Questions for the speaker?', required: false }
    ]
  },

  // ORDER FORMS
  {
    id: 'product-order',
    name: 'Product Order Form',
    description: 'Simple product order form with quantity and shipping',
    category: 'order',
    tags: ['order', 'product', 'ecommerce', 'purchase'],
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Email Address', required: true },
      { type: 'phone', label: 'Phone Number', required: true },
      { type: 'select', label: 'Product', options: ['Product A - $29', 'Product B - $49', 'Product C - $99', 'Bundle - $149'], required: true },
      { type: 'number', label: 'Quantity', placeholder: '1', required: true },
      { type: 'textarea', label: 'Shipping Address', placeholder: '123 Main St, City, State, ZIP', required: true },
      { type: 'textarea', label: 'Special Instructions', required: false }
    ]
  },
  {
    id: 'service-request',
    name: 'Service Request',
    description: 'Request a service or quote',
    category: 'order',
    tags: ['service', 'request', 'quote', 'booking'],
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Email Address', required: true },
      { type: 'phone', label: 'Phone Number', required: true },
      { type: 'select', label: 'Service Type', options: ['Consultation', 'Installation', 'Repair', 'Maintenance', 'Other'], required: true },
      { type: 'date', label: 'Preferred Date', required: true },
      { type: 'select', label: 'Preferred Time', options: ['Morning (9AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-8PM)'], required: true },
      { type: 'textarea', label: 'Describe your needs', required: true }
    ]
  },

  // SURVEYS
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction Survey',
    description: 'Measure customer satisfaction with your service',
    category: 'survey',
    tags: ['csat', 'customer', 'satisfaction', 'service'],
    isTrending: true,
    fields: [
      { type: 'rating', label: 'How satisfied are you with our service?', required: true },
      { type: 'rating', label: 'How likely are you to use our service again?', required: true },
      { type: 'radio', label: 'Was your issue resolved?', options: ['Yes, completely', 'Partially', 'No'], required: true },
      { type: 'radio', label: 'How was the response time?', options: ['Excellent', 'Good', 'Average', 'Poor'], required: true },
      { type: 'textarea', label: 'What could we do better?', required: false },
      { type: 'radio', label: 'Would you recommend us?', options: ['Yes', 'Maybe', 'No'], required: true }
    ]
  },
  {
    id: 'employee-survey',
    name: 'Employee Engagement Survey',
    description: 'Measure employee satisfaction and engagement',
    category: 'survey',
    tags: ['employee', 'hr', 'engagement', 'workplace'],
    isPro: true,
    fields: [
      { type: 'select', label: 'Department', options: ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance', 'Other'], required: true },
      { type: 'select', label: 'Years at Company', options: ['Less than 1', '1-2 years', '3-5 years', '5+ years'], required: true },
      { type: 'rating', label: 'I am satisfied with my job', required: true },
      { type: 'rating', label: 'I feel valued at work', required: true },
      { type: 'rating', label: 'I have opportunities for growth', required: true },
      { type: 'rating', label: 'I would recommend this company', required: true },
      { type: 'textarea', label: 'What would improve your work experience?', required: false }
    ]
  },

  // MARKETING FORMS
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Capture leads for sales follow-up',
    category: 'marketing',
    tags: ['leads', 'sales', 'b2b', 'marketing'],
    isTrending: true,
    fields: [
      { type: 'text', label: 'Full Name', required: true },
      { type: 'email', label: 'Work Email', required: true },
      { type: 'phone', label: 'Phone Number', required: false },
      { type: 'text', label: 'Company Name', required: true },
      { type: 'text', label: 'Job Title', required: true },
      { type: 'select', label: 'Company Size', options: ['1-10', '11-50', '51-200', '201-500', '500+'], required: true },
      { type: 'select', label: 'I\'m interested in', options: ['Product Demo', 'Pricing Info', 'Free Trial', 'Partnership', 'Other'], required: true },
      { type: 'textarea', label: 'Tell us about your needs', required: false }
    ]
  },
  {
    id: 'content-download',
    name: 'Content Download',
    description: 'Gated content form for ebooks, whitepapers, etc.',
    category: 'marketing',
    tags: ['content', 'download', 'ebook', 'whitepaper'],
    fields: [
      { type: 'text', label: 'First Name', required: true },
      { type: 'text', label: 'Last Name', required: true },
      { type: 'email', label: 'Work Email', required: true },
      { type: 'text', label: 'Company', required: true },
      { type: 'checkbox', label: 'I agree to receive marketing communications', options: ['Yes'], required: true }
    ],
    settings: { submitText: 'Download Now', successMessage: 'Check your email for the download link!' }
  },

  // HR FORMS
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'New employee information collection',
    category: 'hr',
    tags: ['hr', 'onboarding', 'employee', 'new hire'],
    isPro: true,
    fields: [
      { type: 'text', label: 'Full Legal Name', required: true },
      { type: 'email', label: 'Personal Email', required: true },
      { type: 'phone', label: 'Phone Number', required: true },
      { type: 'date', label: 'Date of Birth', required: true },
      { type: 'textarea', label: 'Home Address', required: true },
      { type: 'text', label: 'Emergency Contact Name', required: true },
      { type: 'phone', label: 'Emergency Contact Phone', required: true },
      { type: 'select', label: 'T-Shirt Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: false },
      { type: 'textarea', label: 'Dietary Restrictions/Allergies', required: false }
    ]
  },
  {
    id: 'time-off-request',
    name: 'Time Off Request',
    description: 'Employee vacation/PTO request form',
    category: 'hr',
    tags: ['hr', 'pto', 'vacation', 'time off'],
    fields: [
      { type: 'text', label: 'Employee Name', required: true },
      { type: 'email', label: 'Email', required: true },
      { type: 'text', label: 'Department', required: true },
      { type: 'select', label: 'Type of Leave', options: ['Vacation', 'Sick Leave', 'Personal Day', 'Bereavement', 'Other'], required: true },
      { type: 'date', label: 'Start Date', required: true },
      { type: 'date', label: 'End Date', required: true },
      { type: 'textarea', label: 'Reason (optional)', required: false },
      { type: 'text', label: 'Coverage Arranged By', required: false }
    ]
  },

  // QUIZ
  {
    id: 'knowledge-quiz',
    name: 'Knowledge Quiz',
    description: 'Test knowledge with multiple choice questions',
    category: 'quiz',
    tags: ['quiz', 'test', 'assessment', 'education'],
    isNew: true,
    fields: [
      { type: 'text', label: 'Your Name', required: true },
      { type: 'email', label: 'Email (to receive results)', required: true },
      { type: 'radio', label: 'Question 1: What is 2 + 2?', options: ['3', '4', '5', '22'], required: true },
      { type: 'radio', label: 'Question 2: Which is a primary color?', options: ['Green', 'Orange', 'Blue', 'Purple'], required: true },
      { type: 'radio', label: 'Question 3: What year did WW2 end?', options: ['1943', '1944', '1945', '1946'], required: true }
    ],
    settings: { submitText: 'Submit Quiz', successMessage: 'Quiz submitted! Check your email for results.' }
  },

  // EVENT FORMS
  {
    id: 'rsvp',
    name: 'Event RSVP',
    description: 'Simple event RSVP with guest count',
    category: 'event',
    tags: ['rsvp', 'event', 'party', 'invitation'],
    fields: [
      { type: 'text', label: 'Your Name', required: true },
      { type: 'email', label: 'Email Address', required: true },
      { type: 'radio', label: 'Will you attend?', options: ['Yes, I\'ll be there!', 'Sorry, can\'t make it'], required: true },
      { type: 'number', label: 'Number of Guests (including yourself)', placeholder: '1', required: true },
      { type: 'checkbox', label: 'Dietary Requirements', options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut Allergy', 'None'], required: false },
      { type: 'textarea', label: 'Any message for the host?', required: false }
    ],
    settings: { submitText: 'Submit RSVP', successMessage: 'Thanks for your response!' }
  }
]

export const getTemplatesByCategory = (category: string) => 
  category === 'all' ? FORM_TEMPLATES : FORM_TEMPLATES.filter(t => t.category === category)

export const getTemplateById = (id: string) => FORM_TEMPLATES.find(t => t.id === id)

export const searchTemplates = (query: string) => {
  const q = query.toLowerCase()
  return FORM_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  )
}

// Alias for backward compatibility
export const formTemplates = FORM_TEMPLATES

// Get all unique categories with icons
export const getTemplateCategories = () => [
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'feedback', label: 'Feedback', icon: '⭐' },
  { id: 'survey', label: 'Surveys', icon: '📊' },
  { id: 'application', label: 'Applications', icon: '📝' },
  { id: 'registration', label: 'Registration', icon: '✅' },
  { id: 'order', label: 'Orders', icon: '🛒' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'hr', label: 'HR', icon: '👥' },
  { id: 'quiz', label: 'Quizzes', icon: '❓' },
  { id: 'event', label: 'Events', icon: '📅' },
]
