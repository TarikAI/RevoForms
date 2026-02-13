import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'

// Check if Supabase credentials are properly configured
const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-') &&
  process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20

// Only create Supabase client if properly configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // If Supabase isn't configured, allow demo login
        if (!supabase) {
          console.warn('Supabase not configured - using demo mode')
          // Demo mode: accept any login for development
          if (credentials?.email && credentials?.password) {
            return {
              id: 'demo-user-' + Date.now(),
              email: credentials.email as string,
              name: 'Demo User',
            }
          }
          return null
        }

        if (!credentials?.email || !credentials?.password) return null

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (error || !data.user) return null

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email,
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    // Note: NextAuth doesn't have a signUp page option - signup is handled separately
    newUser: '/auth/signup',
  },
  session: {
    strategy: 'jwt',
  },
  // Disable debug in production
  debug: process.env.NODE_ENV === 'development',
  // Trust the host header
  trustHost: true,
})
