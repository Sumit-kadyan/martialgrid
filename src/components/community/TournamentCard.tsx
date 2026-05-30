'use client'

import GlassCard from '@/components/glass/GlassCard'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Trophy } from 'lucide-react'

const TournamentCard = ({ tournament }: { tournament: any }) => {

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return "bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
      case 'completed':
        return "bg-white/5 text-muted-foreground border-white/10";
      default:
        return "bg-primary/10 text-primary border-primary/30"; // upcoming
    }
  }

  // Safe date parsing
  const formattedDate = tournament.start_date 
    ? new Date(tournament.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'TBA';

  return (
    <GlassCard className="p-6 flex flex-col justify-between h-full border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
      
      {/* Decorative Icon */}
      <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

      <div className="z-10 relative">
        <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="font-bold text-xl leading-tight text-foreground">{tournament.name}</h3>
        </div>

        <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{tournament.city || 'Location TBA'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>{formattedDate}</span>
            </div>
        </div>
      </div>

       <div className="mt-auto flex items-center justify-between z-10 relative pt-4 border-t border-white/5">
         <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tournament.level || 'Open'} Level
         </span>
         <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusStyle(tournament.status)}`}>
            {tournament.status || 'Upcoming'}
         </div>
       </div>
    </GlassCard>
  )
}

export default TournamentCard;