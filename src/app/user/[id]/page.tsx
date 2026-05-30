'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// This is the new, combined action button that handles all connection/invitation logic
const ActionButton = ({ targetProfile, currentUserProfile }: { targetProfile: any, currentUserProfile: any }) => {

    const handleInvite = async () => {
        if (!currentUserProfile || !targetProfile) return;
        const { data: invitation, error } = await supabase
            .from('team_invitations')
            .insert({ player_id: targetProfile.id, coach_id: currentUserProfile.id, status: 'pending' })
            .select().single();
        
        if (error) { console.error('Error inviting player:', error); return; }
        
        await supabase.from('notifications').insert({
            user_id: targetProfile.id,
            message: `You have been invited to a team by ${currentUserProfile.name}`,
            type: 'team_invite',
            metadata: { team_invitation_id: invitation.id, coach_id: currentUserProfile.id, coach_name: currentUserProfile.name }
        });
        alert('Invitation Sent!');
    };

    const handleConnect = () => {
        window.location.href = `mailto:${targetProfile.email}`;
    };

    if (!currentUserProfile || !targetProfile || currentUserProfile.id === targetProfile.id) {
        return null; // Don't show button if no logged-in user, no target, or it's your own profile
    }

    if (currentUserProfile.role === 'coach' && targetProfile.role === 'player') {
        return <Button onClick={handleInvite} className="w-full sm:w-auto">Invite to Team</Button>
    }

    if (currentUserProfile.role === 'player' && targetProfile.role === 'coach') {
        return <Button onClick={handleConnect} className="w-full sm:w-auto">Connect</Button>
    }

    return null;
}

// Main Profile Page Component
const UserProfilePage = ({ params }: { params: { id: string } }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            // Fetch the profile being viewed
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*, players(*), coaches(*)')
                .eq('id', params.id)
                .single();

            if (profileError || !profileData) {
                console.error('Error fetching profile:', profileError);
                notFound();
                return;
            }
            setProfile(profileData);

            // Fetch the currently logged-in user's profile for the action button
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: loggedInProfile } = await supabase.from('profiles').select('*, players(*), coaches(*)').eq('id', user.id).single();
                setCurrentUserProfile(loggedInProfile);
            }
            
            setLoading(false);
        };

        fetchProfile();
    }, [params.id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div></div>;
    }

    if (!profile) {
        return notFound();
    }

    const age = profile.players?.date_of_birth ? new Date().getFullYear() - new Date(profile.players.date_of_birth).getFullYear() : (profile.coaches?.date_of_birth ? new Date().getFullYear() - new Date(profile.coaches.date_of_birth).getFullYear() : 'N/A');
    const details = profile.role === 'player' ? profile.players : profile.coaches;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader />
            <main className="p-4 sm:p-8 max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {/* --- HEADER SECTION --- */}
                    <GlassCard className="p-6 sm:p-8 mb-8">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback>{profile.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left flex-1">
                                <h1 className="text-3xl sm:text-4xl font-bold font-headline">{profile.name}</h1>
                                <p className="text-muted-foreground text-lg">{profile.city} | Age: {age} | {profile.sport}</p>
                                {profile.role === 'player' && details?.expertise_badge && (
                                    <div className="mt-3 inline-block px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-md font-bold text-primary neon-glow-blue">
                                        {details.expertise_badge}
                                    </div>
                                )}
                            </div>
                            <div className="w-full sm:w-auto mt-4 sm:mt-0">
                                <ActionButton targetProfile={profile} currentUserProfile={currentUserProfile} />
                            </div>
                        </div>
                    </GlassCard>

                    {/* --- DETAILS GRID --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        <GlassCard className="md:col-span-1 p-6">
                            <h3 className="font-bold text-xl mb-4">About</h3>
                            <p className="text-muted-foreground">{details?.experience || 'No experience details provided.'}</p>
                        </GlassCard>

                        <GlassCard className="md:col-span-2 p-6">
                            <h3 className="font-bold text-xl mb-4">Sport-Specific Details</h3>
                            {details?.sport_specific_data ? (
                                <pre className="bg-black/20 p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(details.sport_specific_data, null, 2)}</pre>
                            ) : (
                                <p className="text-muted-foreground">No sport-specific data available.</p>
                            )}
                        </GlassCard>

                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default UserProfilePage;
