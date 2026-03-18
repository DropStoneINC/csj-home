'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto grid-pattern">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
