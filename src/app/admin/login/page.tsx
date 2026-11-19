import { googleLoginEnabled, passwordLoginEnabled, allowedDomains } from '@/lib/server/adminAuth'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginForm google={googleLoginEnabled()} password={passwordLoginEnabled()} domains={allowedDomains()} />
    </div>
  )
}
