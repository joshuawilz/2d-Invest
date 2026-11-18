import { createClient } from '@supabase/supabase-js'

// Utilisation des variables d'environnement ou des constantes directes fournies
// Pour une précision de 1000%, nous gardons tes accès actuels tout en stabilisant la session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyrbmtiwvowfksxdnhsl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cmJtdGl3dm93ZmtzeGRuaHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTU2NTQsImV4cCI6MjA4NjQ5MTY1NH0.ztdgHWkYlLJvydJfvF9JvqJBJ20MFCEgXq2wZI1g2cw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})