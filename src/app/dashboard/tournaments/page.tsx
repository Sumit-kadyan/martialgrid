"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Trophy, 
  Search, 
  Calendar, 
  Users, 
  Filter,
  ArrowUpRight,
  MapPin,
  Loader2,
  IndianRupee
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function TournamentGallery() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true)
      // Fetch tournaments and include the organizer's name
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, profiles:organizer_id(name)')
        .order('start_date', { ascending: true })

      if (!error && data) {
        setTournaments(data)
      }
      setLoading(false)
    }

    fetchTournaments()
  }, [])

  const filteredTournaments = tournaments.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)] animate-pulse'
      case 'completed':
        return 'bg-white/5 text-muted-foreground border-white/10'
      default:
        return 'bg-primary/10 text-primary border-primary/30' // upcoming
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground tracking-tight">Tournament Gallery</h1>
          <p className="text-lg text-muted-foreground mt-2">Discover, follow, and join the most elite athletic events.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sticky top-4 z-20 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, sport, or city..." 
            className="pl-12 h-12 text-base bg-white/5 border-white/10 focus-visible:ring-primary placeholder:text-muted-foreground/60 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <GlassButton variant="secondary" className="h-12 px-6 border-white/10 rounded-xl">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </GlassButton>
      </div>

      {/* Content Section */}
      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center items-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filteredTournaments.length > 0 ? (
          <AnimatePresence>
            {filteredTournaments.map((tournament, i) => (
              <motion.div 
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-0 overflow-hidden group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-stretch p-4 gap-6">
                    
                    {/* Banner Image */}
                    <div className="w-full lg:w-64 h-48 lg:h-auto relative rounded-xl overflow-hidden shrink-0 bg-black">
                      {tournament.banner_url ? (
                        <img 
                          src={tournament.banner_url} 
                          alt={tournament.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-white/5" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <Badge className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-md border-none text-[10px] uppercase tracking-widest font-bold">
                        {tournament.sport}
                      </Badge>
                    </div>

                    {/* Tournament Details */}
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">
                              {tournament.level} Tier
                            </span>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">
                              {tournament.format}
                            </span>
                          </div>
                          <Link href={`/tournament/${tournament.id}`}>
                            <h3 className="text-2xl font-headline font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {tournament.name}
                            </h3>
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(tournament.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <MapPin className="w-4 h-4 text-primary" />
                              {tournament.location || 'Location TBA'}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Users className="w-4 h-4 text-primary" />
                              Max {tournament.max_teams} Teams
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shrink-0 border ${getStatusStyle(tournament.status)}`}>
                          {tournament.status || 'Upcoming'}
                        </div>
                      </div>

                      {/* Bottom Row: Financials & Action */}
                      <div className="pt-6 mt-4 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Prize Pool</p>
                            <p className="font-bold text-green-400 flex items-center gap-1">
                              {tournament.currency === 'INR' ? <IndianRupee className="w-3.5 h-3.5" /> : tournament.currency} {tournament.prize_pool || 'TBA'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Organized By</p>
                            <p className="font-medium text-sm text-foreground">{tournament.profiles?.name || 'Unknown'}</p>
                          </div>
                        </div>
                        
                        <Link href={`/tournament/${tournament.id}`}>
                          <GlassButton variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary font-bold group/btn">
                            View Details <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </GlassButton>
                        </Link>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-24 flex flex-col items-center text-center bg-white/5 rounded-3xl border border-white/10"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-foreground">No tournaments found</h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto mt-2">
              We couldn't find any events matching your search criteria. Try adjusting your filters.
            </p>
            <GlassButton 
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="mt-8"
            >
              Clear Search
            </GlassButton>
          </motion.div>
        )}
      </div>
    </div>
  )
}