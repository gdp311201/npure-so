import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 mascot-float-glow inline-block">🖤</div>
          <h1 className="text-2xl font-bold text-pink-950 tracking-tight">NPURE SO</h1>
          <p className="text-sm text-pink-800/70 font-medium">Stock Opname System</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
