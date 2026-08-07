const SUPABASE_URL =
  "https://artezujucthxedsgvfcf.supabase.co"

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydGV6dWp1Y3RoeGVkc2d2ZmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjA1MTMsImV4cCI6MjA5MTU5NjUxM30.zJsfmKJwl3vXERUjSulGKr2I77AC8z3WJt-Zv5IgTrI"

const banco =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  )