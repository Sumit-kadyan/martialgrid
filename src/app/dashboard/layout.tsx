'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Zap, 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Settings, 
  LogOut,
  BrainCircuit,
  Activity,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Notifications } from "@/components/Notifications"

// This component contains the dynamic user avatar and popover menu.
const UserProfileNav = () => {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false)
    }

    getSessionAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getInitials = (name: string) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('')
  }

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-gray-500/30 animate-pulse"></div>
  }

  return (
    <div className="flex items-center gap-4">
        <Notifications />
        <Popover>
        <PopoverTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar>
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback>{getInitials(profile?.name || 'User')}</AvatarFallback>
            </Avatar>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
            <div className="p-2 mb-2 border-b border-black/5">
            <p className="font-bold text-sm truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start font-normal">My Profile</Button>
            </Link>
            <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start font-normal">Settings</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start font-normal text-red-500 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
            </Button>
        </PopoverContent>
        </Popover>
    </div>
  )
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Community', href: '/community', icon: Globe },
    { name: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
    { name: 'Smart Seeding', href: '/dashboard/seeding', icon: BrainCircuit },
    { name: 'Live Pulse', href: '/dashboard/pulse', icon: Activity },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-black/5 glass-surface p-6 flex flex-col fixed h-screen z-50">
        <div className="flex items-center gap-2 mb-12">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="text-primary w-6 h-6" />
            <span className="font-headline font-bold text-foreground text-xl tracking-tighter">MARTIAL GRID</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary text-white neon-glow-blue" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-black/5 flex flex-col gap-2">
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <header className="h-20 px-8 flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-0 z-40">
          <h1 className="text-lg font-headline font-bold text-foreground uppercase tracking-widest">Command Center</h1>
          <UserProfileNav />
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
