'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/glass/GlassCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, UserPlus, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const PlayerCard = ({ player }: { player: any }) => {
  const profile = player.profiles || {};
  const name = profile.name || 'Unknown Player';
  const avatar = profile.avatar_url;
  const city = profile.city || 'Unknown City';
  const age = profile.age || 'N/A';
  const badge = player.expertise_badge || 'Unranked';

  const [isCoach, setIsCoach] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [hasInvited, setHasInvited] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (userProfile?.role === 'coach') {
        setIsCoach(true);
        const { data: cData } = await supabase.from('coaches').select('id, team_name').eq('id', user.id).single();
        setCoachData(cData);
      }
    };
    checkUserRole();
  }, []);

  const handleInvite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link from triggering a page navigation
    if (!coachData) return;
    
    setIsInviting(true);

    try {
        // 1. Create a tracking record in team_invitations
        const { data: invite, error: inviteError } = await supabase.from('team_invitations').insert({
            coach_id: coachData.id,
            player_id: player.id,
            status: 'pending'
        }).select().single();

        if (inviteError) throw inviteError;

        // 2. Send the Notification to the Player
        const { error: notifError } = await supabase.from('notifications').insert({
            user_id: player.id, // Send TO the player
            type: 'team_invite',
            message: `${coachData.team_name || 'A Coach'} has invited you to join their roster!`,
            metadata: {
                team_invitation_id: invite.id,
                coach_id: coachData.id
            }
        });

        if (notifError) throw notifError;

        setHasInvited(true);
    } catch (error) {
        console.error("Failed to send invite:", error);
        alert("Failed to send invitation.");
    } finally {
        setIsInviting(false);
    }
  };

  const getInitials = (n: string) => n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Link href={`/user/${player.id}`} className="block group h-full">
      <GlassCard className="p-6 flex flex-col items-center text-center h-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] hover:-translate-y-1 border border-white/5 group-hover:border-primary/30 relative overflow-hidden">
        
        {/* Role Badge - Top Right */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-bold text-primary uppercase tracking-widest z-20 shadow-sm backdrop-blur-md">
          Player
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-primary/20" />

        <Avatar className="w-24 h-24 mt-2 mb-5 border-2 border-primary/20 shadow-xl relative z-10 bg-background">
            <AvatarImage src={avatar} alt={name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{getInitials(name)}</AvatarFallback>
        </Avatar>

        <h3 className="font-bold text-xl mb-1 text-foreground z-10">{name}</h3>
        
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-4 z-10">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {city}</span>
            <span className="opacity-50">•</span>
            <span>Age: {age}</span>
        </div>

        <div className="mt-auto pt-2 z-10 w-full flex flex-col items-center gap-3">
            <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-xs font-bold text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] uppercase tracking-wider">
                {badge}
            </span>

            {/* COACH ACTION BUTTON */}
            {isCoach && (
                <div className="w-full mt-2 border-t border-white/10 pt-4">
                    <Button 
                        onClick={handleInvite} 
                        disabled={isInviting || hasInvited}
                        variant={hasInvited ? "secondary" : "default"}
                        className={`w-full ${hasInvited ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' : 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]'}`}
                    >
                        {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                         hasInvited ? <CheckCircle2 className="w-4 h-4 mr-2" /> : 
                         <UserPlus className="w-4 h-4 mr-2" />}
                        {isInviting ? 'Sending...' : hasInvited ? 'Invite Sent' : 'Invite to Team'}
                    </Button>
                </div>
            )}
        </div>
        
      </GlassCard>
    </Link>
  )
}

export default PlayerCard;