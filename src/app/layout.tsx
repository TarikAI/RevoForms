import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RevoForms - AI-Powered Form Platform',
  description: 'Build forms with AI conversation, voice input, and an intelligent avatar assistant',
  keywords: ['forms', 'AI', 'form builder', 'voice input', 'no-code'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 27, 66, 0.95)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  )
}
