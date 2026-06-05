'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  LogOut,
  Activity,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Notifications } from "@/components/Notifications"

// --- USER PROFILE NAV (Now receives data as props) ---
const UserProfileNav = ({ profile, loading }: { profile: any, loading: boolean }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getInitials = (name: string) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('')
  }

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-black/10 animate-pulse"></div>
  }

  return (
    <div className="flex items-center gap-4">
        <Notifications />
        <Popover>
        <PopoverTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105">
            <Avatar className="border border-black/10 shadow-sm">
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(profile?.name || 'User')}</AvatarFallback>
            </Avatar>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
            <div className="p-3 mb-2 border-b border-black/5 bg-black/5 rounded-t-md">
              <p className="font-bold text-sm truncate">{profile?.name || 'Loading...'}</p>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-0.5">{profile?.role || 'User'}</p>
            </div>
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start font-normal">My Profile</Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start font-normal">Settings</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start font-normal text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
        </PopoverContent>
        </Popover>
    </div>
  )
}

// --- MAIN DASHBOARD LAYOUT ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Lifted Auth State
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch User & Role for RBAC (Role-Based Access Control)
  useEffect(() => {
    const checkAuthAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)

      // 🚨 SECURITY REDIRECT: If a Fan tries to load the Organizer Overview, bounce them to Pulse.
      if (profileData?.role === 'fan' && pathname === '/dashboard/overview') {
        router.replace('/dashboard/pulse')
      } else {
        setLoading(false)
      }
    }

    checkAuthAndRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = '/login'
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  // 2. Dynamic Navigation Array
  const navItems = [
    // The hideFor property allows us to dynamically remove this from the Fan's sidebar
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard, hideFor: ['fan'] },
    { name: 'Live Pulse', href: '/dashboard/pulse', icon: Activity },
    { name: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Community', href: '/dashboard/community', icon: Globe },
  ]

  // Filter out items the current user role shouldn't see
  const filteredNavItems = navItems.filter(item => !item.hideFor?.includes(profile?.role))

  // Block rendering until we know their role to prevent layout flashes
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Mobile Overlay Background */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed h-screen z-50 border-r border-black/5 glass-surface flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-20" : "w-64"
        )}
      >
        {/* Desktop Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 bg-white border border-black/10 shadow-sm rounded-full p-1 z-50 hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo Area */}
        <div className={cn("flex items-center mb-7 pt-6", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
          <Link href="/" className="flex items-center justify-center">
            <img 
              src={isCollapsed ? "/icon.png" : "/logo.webp"} 
              alt="Platform Logo" 
              className={cn("transition-all duration-300 object-contain", isCollapsed ? "h-10 w-10" : "h-20 w-auto")} 
            />
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-black/5 text-muted-foreground"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 px-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined} 
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all group overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                  isActive 
                    ? "bg-primary text-white neon-glow-blue shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 translate-x-10 hidden" : "opacity-100 w-auto translate-x-0 block"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <header className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger Button */}
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 text-muted-foreground transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-headline font-bold text-foreground uppercase tracking-widest line-clamp-1">
              {profile?.role === 'fan' ? 'Fan Zone' : 'Command Center'}
            </h1>
          </div>
          
          {/* We pass the fetched profile and loading state directly to the Nav */}
          <UserProfileNav profile={profile} loading={loading} />
        </header>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}