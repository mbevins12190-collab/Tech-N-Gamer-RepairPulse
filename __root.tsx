import { Outlet, createRootRouteWithContext, Link, useLocation, useNavigate, Meta, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { useState, useEffect } from 'react'
import { LucideLayoutDashboard, LucideClipboardPlus, LucideSearch, LucideShieldAlert, LucideLogOut, LucideChevronLeft, LucideChevronRight, LucideBell, LucideUserCircle } from 'lucide-react'
import { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tech-N-Gamer Management System',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  )
}

function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background-default text-gray-200 min-h-screen">
        <AuthContent>{children}</AuthContent>
        <Scripts />
      </body>
    </html>
  )
}

function AuthContent({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isPublicRoute = location.pathname.startsWith('/status')

  if (isPublicRoute) {
    return <div className="bg-background-default min-h-screen">{children}</div>
  }

  return (
    <>
      <AuthLoading>
        <div className="flex h-screen w-screen items-center justify-center bg-background-default">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LoginForm />
      </Unauthenticated>
      <Authenticated>
        <AppShell>{children}</AppShell>
      </Authenticated>
    </>
  )
}

function LoginForm() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if users exist for first-run
  const { data: usersExist } = useSuspenseQuery(convexQuery(api.users.anyUsersExist, {}))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('flow', usersExist ? flow : 'signUp')
    
    signIn('password', formData)
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-default px-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-background-paper p-8 rounded-2xl shadow-2xl border border-gray-700/50 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Tech-N-Gamer</h1>
          <p className="text-gray-400 mb-8">{!usersExist ? 'First-Run Setup' : 'Electronics Repair Shop Management'}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!usersExist && (
              <input
                name="full_name"
                placeholder="Full Name"
                className="input w-full"
                required
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              className="input w-full"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="input w-full"
              required
            />
            {error && <p className="text-error text-sm text-left">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (!usersExist ? 'Create Admin Account' : (flow === 'signIn' ? 'Sign In' : 'Sign Up'))}
            </button>
          </form>

          {usersExist && (
            <button
              onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
              className="mt-6 text-sm text-secondary hover:underline"
            >
              {flow === 'signIn' ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions()
  const { data: userData } = useSuspenseQuery(convexQuery(api.users.currentUserData, {}))
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { name: 'Dashboard', icon: <LucideLayoutDashboard size={20} />, path: '/' },
    { name: 'New Repair', icon: <LucideClipboardPlus size={20} />, path: '/new-repair' },
    { name: 'Search', icon: <LucideSearch size={20} />, path: '/search' },
    { name: 'Admin Panel', icon: <LucideShieldAlert size={20} />, path: '/admin', adminOnly: true },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  // Barcode Scanner Listener
  useEffect(() => {
    let buffer = ''
    let lastTime = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const diff = now - lastTime
      lastTime = now

      // Rapid input suggestions a scanner
      if (diff < 50) {
        if (e.key === 'Enter') {
          if (buffer.startsWith('RO-')) {
            navigate({ to: '/search', search: { q: buffer } })
          }
          buffer = ''
        } else if (e.key.length === 1) {
          buffer += e.key
        }
      } else {
        if (e.key.length === 1) buffer = e.key
        else buffer = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-background-paper border-r border-gray-700/50 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700/50">
          {!isCollapsed && <span className="text-primary font-bold text-xl truncate">Tech-N-Gamer</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            {isCollapsed ? <LucideChevronRight size={20} /> : <LucideChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.filter(item => !item.adminOnly || userData?.role === 'admin').map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
              }`}
            >
              <span className={isActive(item.path) ? 'text-primary' : ''}>{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700/50">
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-colors"
          >
            <LucideLogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-background-paper border-b border-gray-700/50 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold hidden md:block">
            {navItems.find(i => isActive(i.path))?.name || 'Home'}
          </h2>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <LucideBell size={22} />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full border-2 border-background-paper"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-700/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{userData?.full_name || userData?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{userData?.role || 'User'}</p>
              </div>
              <div className="h-10 w-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                <LucideUserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
