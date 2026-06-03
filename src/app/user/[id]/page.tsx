'use client'

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
// Added ArrowLeft for the back button
import { MapPin, User, Award, Shield, Mail, UserPlus, Clock, ArrowLeft } from 'lucide-react'; 
// Added useRouter hook
import { notFound, useRouter } from 'next/navigation'; 

// Next.js 15 requires params to be a Promise
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Properly unwrap the params using React.use()
  const { id } = use(params);
  
  // Initialize the Next.js router for the back navigation
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [roleData, setRoleData] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<{ id: string, role: string } | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);

      // A. Get the person looking at this page (to determine what buttons to show)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single();
        setCurrentUserData({ id: authUser.id, role: currentProfile?.role });
      }

      // B. Fetch the Root Profile of the user we are looking at
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return; // Will trigger the not found UI
      }
      setProfile(profileData);

      // C. Fetch their specific Role Data securely
      if (profileData.role === 'player') {
        const { data } = await supabase.from('players').select('*').eq('id', id).single();
        setRoleData(data);
      } else if (profileData.role === 'coach') {
        const { data } = await supabase.from('coaches').select('*').eq('id', id).single();
        setRoleData(data);
      } else if (profileData.role === 'organizer') {
        const { data } = await supabase.from('organizers').select('*').eq('id', id).single();
        setRoleData(data);
      }

      setLoading(false);
    };

    fetchAllData();
  }, [id]); // Safely depends on the unwrapped ID

  const getInitials = (n: string) => n ? n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const isOwnProfile = currentUserData?.id === id;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-3xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground">This profile doesn't exist or may have been deleted.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Added 'relative' to this wrapper so the absolute back button anchors here */}
      <div className="p-4 sm:p-8 max-w-4xl mx-auto relative mt-8 md:mt-4">
        
        {/* MINIMAL FLOATING BACK BUTTON */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.3 }}
          className="absolute -top-12 left-4 sm:-left-4 md:-left-12 z-20"
        >
          <GlassButton 
            onClick={() => router.back()}
            className="p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground hover:text-foreground shadow-lg transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </GlassButton>
        </motion.div>

        {/* HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 overflow-hidden mb-8 border border-white/10 shadow-2xl">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/10 shadow-2xl z-10">
              <AvatarImage src={profile.avatar_url} alt={profile.name} className="object-cover" />
              <AvatarFallback className="bg-white/5 text-4xl font-bold text-foreground">{getInitials(profile.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left z-10">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold font-headline text-foreground tracking-tight">{profile.name}</h1>
                <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-md text-xs font-bold uppercase tracking-widest text-muted-foreground w-fit mx-auto md:mx-0">
                  {profile.role}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary"/> {profile.city || 'Unknown Location'}</span>
                <span className="opacity-50">•</span>
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-primary"/> Age: {profile.age || 'N/A'}</span>
              </div>

              {/* DYNAMIC ACTION BUTTONS */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {currentUserData?.role === 'coach' && profile.role === 'player' && (
                    <GlassButton className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/50">
                      <UserPlus className="w-4 h-4 mr-2" /> Invite to Team
                    </GlassButton>
                  )}
                  {currentUserData?.role === 'player' && profile.role === 'coach' && (
                    <GlassButton className="bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground border-secondary/50">
                      <Mail className="w-4 h-4 mr-2" /> Connect
                    </GlassButton>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PLAYER DETAILS */}
          {profile.role === 'player' && roleData && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <GlassCard className="p-6 h-full">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Player Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-muted-foreground">Sport</span>
                    <span className="font-bold capitalize">{roleData.sport}</span>
                  </div>
                  
                  {roleData.expertise_badge && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-muted-foreground">Expertise Level</span>
                      <span className="font-bold text-primary uppercase tracking-wider text-sm">{roleData.expertise_badge}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-bold">{roleData.experience || 'Not specified'}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* COACH DETAILS */}
          {profile.role === 'coach' && roleData && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <GlassCard className="p-6 h-full">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Credentials</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-muted-foreground">Specialty</span>
                    <span className="font-bold capitalize">{roleData.sport}</span>
                  </div>
                  
                  <div className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-muted-foreground mb-1">Certifications</span>
                    <span className="font-semibold">{roleData.certifications || 'None listed'}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-muted-foreground">Years Active</span>
                    <span className="font-bold">{roleData.experience_years || 'Not specified'}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* RECENT ACTIVITY PLACEHOLDER */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <GlassCard className="p-6 h-full flex flex-col">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Activity</h3>
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 text-center text-muted-foreground">
                Tournament history and match stats will appear here soon.
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
}