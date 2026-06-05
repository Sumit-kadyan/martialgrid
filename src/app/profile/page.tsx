'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import PlayerProfile from '@/components/profile/PlayerProfile'
import CoachProfile from '@/components/profile/CoachProfile'
import OrganizerProfile from '@/components/profile/OrganizerProfile'
import FanProfile from '@/components/profile/FanProfile' // <-- Added FanProfile
import GlassCard from '@/components/glass/GlassCard'
import DashboardLayout from '@/app/dashboard/layout'

const ProfileSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto">
    <GlassCard>
      <div className="animate-pulse p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-32 h-32 bg-white/10 rounded-full border border-white/5"></div>
          <div>
            <div className="h-8 bg-white/10 rounded w-48 mb-2"></div>
            <div className="h-6 bg-white/10 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-4 mt-10">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/6"></div>
        </div>
      </div>
    </GlassCard>
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError)
        setLoading(false)
        return
      }
      
      let roleSpecificData = null;
      
      // Added 'fan' mapping safely. If you don't have a 'fans' table yet, 
      // it will just silently fail to fetch extra data but keep the core profile.
      const roleToTableMap: { [key: string]: string } = {
          player: 'players',
          coach: 'coaches',
          organizer: 'organizers',
          fan: 'fans' 
      };
      
      const roleTable = roleToTableMap[profileData.role];

      if (roleTable) {
        const { data, error: roleError } = await supabase
          .from(roleTable)
          .select('*')
          .eq('id', user.id)
          .single();
        
        if(roleError && profileData.role !== 'fan') {
            // Fans might not have a dedicated table yet, so we only log errors for core roles
            console.error(`Error fetching ${profileData.role} data:`, roleError);
        }
        roleSpecificData = data;
      }

      setProfile({ ...profileData, ...(roleSpecificData || {}) });
      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const renderProfile = () => {
    if (!profile) {
      return <GlassCard><div className="p-8 text-center text-muted-foreground">Could not load profile. Please try again later.</div></GlassCard>;
    }

    switch (profile.role) {
      case 'player':
        return <PlayerProfile profile={profile} setProfile={setProfile} />
      case 'coach':
        return <CoachProfile profile={profile} setProfile={setProfile} />
      case 'organizer':
        return <OrganizerProfile profile={profile} setProfile={setProfile} />
      case 'fan':
        return <FanProfile profile={profile} setProfile={setProfile} /> // <-- Render Fan Profile
      default:
        return <GlassCard><div className="p-8 text-center">Unknown user role. Please contact support.</div></GlassCard>
    }
  }

  return (
    <DashboardLayout>
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your identity and preferences.</p>
            </div>
            {loading ? <ProfileSkeleton /> : renderProfile()}
        </div>
    </DashboardLayout>
  )
}