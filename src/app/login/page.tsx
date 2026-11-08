import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/npure-assets/logo_app.png`;

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
          <img
            src={LOGO_URL}
            alt="NPURE"
            className="h-16 w-auto mx-auto mb-3 mascot-float-glow"
          />
          <p className="text-sm text-pink-800/70 font-medium">Stock Opname System</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
