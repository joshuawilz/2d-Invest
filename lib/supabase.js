import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gyrbmtiwvowfksxdnhsl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cmJtdGl3dm93ZmtzeGRuaHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTU2NTQsImV4cCI6MjA4NjQ5MTY1NH0.ztdgHWkYlLJvydJfvF9JvqJBJ20MFCEgXq2wZI1g2cw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)