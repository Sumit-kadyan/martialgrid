'use client'

import GlassCard from '@/components/glass/GlassCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

const PlayerCard = ({ player }: { player: any }) => {
  const profile = player.profiles || {};
  const name = profile.name || 'Unknown Player';
  const avatar = profile.avatar_url;
  const city = profile.city || 'Unknown City';
  const age = profile.age || 'N/A';
  const badge = player.expertise_badge || 'Unranked';

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

        <Avatar className="w-24 h-24 mt-2 mb-5 border-2 border-primary/20 shadow-xl relative z-10">
            <AvatarImage src={avatar} alt={name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{getInitials(name)}</AvatarFallback>
        </Avatar>

        <h3 className="font-bold text-xl mb-1 text-foreground z-10">{name}</h3>
        
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-4 z-10">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {city}</span>
            <span className="opacity-50">•</span>
            <span>Age: {age}</span>
        </div>

        <div className="mt-auto pt-2 z-10">
            <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-xs font-bold text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] uppercase tracking-wider">
                {badge}
            </span>
        </div>
        
      </GlassCard>
    </Link>
  )
}

export default PlayerCard;