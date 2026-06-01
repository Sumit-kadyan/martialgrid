'use client'

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import GlassButton from '@/components/glass/GlassButton';
import { Zap, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Notifications } from '@/components/Notifications';

export default function AppHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, roles(*)')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        getSessionAndProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <header className="h-20 border-b border-black/5 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg neon-glow-blue flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-foreground">Martial Grid</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {loading ? (
           <div className="w-10 h-10 rounded-full bg-gray-500/30 animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-4">
            <Notifications />
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-full">
                    <Avatar>
                        <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                        <AvatarFallback>{profile ? getInitials(profile.name) : 'U'}</AvatarFallback>
                    </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                  <div className="p-2">
                      <p className="font-bold text-sm">{profile?.name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.role}</p>
                  </div>
                  <div className="p-1">
                      <Link href="/profile"><Button variant="ghost" className="w-full justify-start">My Profile</Button></Link>
                      <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start">Dashboard</Button></Link>
                  </div>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-red-500">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                  </Button>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <Link href="/login">
            <GlassButton>Get Started</GlassButton>
          </Link>
        )}
      </div>
    </header>
  );
}
