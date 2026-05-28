'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import PlayerProfile from '@/components/profile/PlayerProfile'
import CoachProfile from '@/components/profile/CoachProfile'
import OrganizerProfile from '@/components/profile/OrganizerProfile'
import GlassCard from '@/components/glass/GlassCard'
import DashboardLayout from '@/app/dashboard/layout' // Import the layout

const ProfileSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto">
    <GlassCard>
      <div className="animate-pulse p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-32 h-32 bg-gray-500/30 rounded-full"></div>
          <div>
            <div className="h-8 bg-gray-500/30 rounded w-48 mb-2"></div>
            <div className="h-6 bg-gray-500/30 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-4 mt-10">
          <div className="h-4 bg-gray-500/30 rounded w-full"></div>
          <div className="h-4 bg-gray-500/30 rounded w-5/6"></div>
          <div className="h-4 bg-gray-500/30 rounded w-4/6"></div>
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
      const roleToTableMap: { [key: string]: string } = {
          player: 'players',
          coach: 'coaches',
          organizer: 'organizers'
      };
      
      const roleTable = roleToTableMap[profileData.role];

      if (roleTable) {
        const { data, error: roleError } = await supabase
          .from(roleTable)
          .select('*')
          .eq('id', user.id)
          .single();
        
        if(roleError) {
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
      return <GlassCard><div className="p-8">Could not load profile. Please try again later.</div></GlassCard>;
    }

    switch (profile.role) {
      case 'player':
        return <PlayerProfile profile={profile} setProfile={setProfile} />
      case 'coach':
        return <CoachProfile profile={profile} setProfile={setProfile} />
      case 'organizer':
        return <OrganizerProfile profile={profile} setProfile={setProfile} />
      default:
        return <GlassCard><div className="p-8">Unknown user role. Please contact support.</div></GlassCard>
    }
  }

  return (
    <DashboardLayout>
        <div className="max-w-6xl mx-auto">
            {loading ? <ProfileSkeleton /> : renderProfile()}
        </div>
    </DashboardLayout>
  )
}
