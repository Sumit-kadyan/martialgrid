'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from '@/components/community/PlayerCard';
import CoachCard from '@/components/community/CoachCard';
import TournamentCard from '@/components/community/TournamentCard';
import { Search, Loader2, Users } from 'lucide-react';

const CommunityPage = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any>({ players: [], coaches: [], tournaments: [] });
  const [loading, setLoading] = useState(true);
  
  // New state for organizers
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');

  // Effect to initialize user profile and determine which sport context to use
  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase.from('profiles').select('id, city, role').eq('id', user.id).single();
      if (!profile) { setLoading(false); return; }
      
      setUserProfile(profile);

      if (profile.role === 'organizer') {
        const { data: sportsData } = await supabase.from('tournaments').select('sport');
        const uniqueSports = [...new Set(sportsData?.map(t => t.sport).filter(Boolean) || [])];
        setSports(uniqueSports);
        if (uniqueSports.length > 0) {
          setSelectedSport(uniqueSports[0]);
        } else {
          setLoading(false);
        }
      } else {
        let userSport = null;
        if (profile.role === 'player') {
          const { data: pData } = await supabase.from('players').select('sport').eq('id', user.id).single();
          userSport = pData?.sport;
        } else if (profile.role === 'coach') {
          const { data: cData } = await supabase.from('coaches').select('sport').eq('id', user.id).single();
          userSport = cData?.sport;
        }
        
        if (userSport) {
          setSelectedSport(userSport);
          setUserProfile((prev: any) => ({ ...prev, sport: userSport }));
        } else {
          setLoading(false);
        }
      }
    };
    initializePage();
  }, []);

  // Effect to fetch community data whenever the selected sport changes
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!selectedSport) {
        setResults({ players: [], coaches: [], tournaments: [] });
        if (userProfile && userProfile.role !== 'organizer') setLoading(false);
        return;
      }
      
      setLoading(true);
      const [playersRes, coachesRes, tournamentsRes] = await Promise.all([
          supabase.from('players').select('*, profiles!inner(id, name, city, avatar_url, age)').eq('sport', selectedSport),
          supabase.from('coaches').select('*, profiles!inner(id, name, city, avatar_url, age)').eq('sport', selectedSport),
          supabase.from('tournaments').select('*').eq('sport', selectedSport)
      ]);
      
      setResults({ 
          players: playersRes.data || [], 
          coaches: coachesRes.data || [], 
          tournaments: tournamentsRes.data || [] 
      });
      setLoading(false);
    };

    fetchCommunityData();
  }, [selectedSport, userProfile]);

  const getFilteredAndSortedResults = () => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    let filtered: any = { players: [], coaches: [], tournaments: [] };

    const matchSearch = (item: any, type: 'player' | 'coach' | 'tournament') => {
      if (!lowerSearchTerm) return true;

      if (type === 'player') {
        return (
          item.profiles?.name?.toLowerCase().includes(lowerSearchTerm) ||
          item.profiles?.city?.toLowerCase().includes(lowerSearchTerm) ||
          item.expertise_badge?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      if (type === 'coach') {
        return (
          item.profiles?.name?.toLowerCase().includes(lowerSearchTerm) ||
          item.profiles?.city?.toLowerCase().includes(lowerSearchTerm) ||
          item.certifications?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      if (type === 'tournament') {
        return (
          item.name?.toLowerCase().includes(lowerSearchTerm) ||
          item.city?.toLowerCase().includes(lowerSearchTerm) ||
          item.level?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return false;
    };

    if (activeFilter === 'All' || activeFilter === 'Players') {
      filtered.players = results.players.filter((p: any) => matchSearch(p, 'player'));
    }
    if (activeFilter === 'All' || activeFilter === 'Coaches') {
      filtered.coaches = results.coaches.filter((c: any) => matchSearch(c, 'coach'));
    }
    if (activeFilter === 'All' || activeFilter === 'Tournaments') {
      let tournamentList = results.tournaments.filter((t: any) => matchSearch(t, 'tournament'));
      
      tournamentList.sort((a: any, b: any) => {
        const aInCity = a.city?.toLowerCase() === userProfile?.city?.toLowerCase();
        const bInCity = b.city?.toLowerCase() === userProfile?.city?.toLowerCase();
        if (aInCity && !bInCity) return -1;
        if (!aInCity && bInCity) return 1;
        return 0;
      });
      filtered.tournaments = tournamentList;
    }
    
    return filtered;
  }

  const finalResults = getFilteredAndSortedResults();
  const hasResults = finalResults.players.length > 0 || finalResults.coaches.length > 0 || finalResults.tournaments.length > 0;
  const noSportSelected = userProfile?.role === 'organizer' && !selectedSport;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      
      <header className="mb-10">
          <h1 className="text-5xl font-extrabold font-headline mb-3 tracking-tight">Community Hub</h1>
          <p className="text-xl text-muted-foreground">
              Connect with players, coaches, and tournaments in the world of <span className="font-bold text-primary capitalize">{selectedSport || (userProfile?.sport || 'your sport' )}</span>.
          </p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-4 mb-10 sticky top-4 z-20 p-4 rounded-2xl bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search names, cities, or badges..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base bg-white/5 border-white/10 focus-visible:ring-primary placeholder:text-muted-foreground/60"
          />
        </div>

        {userProfile?.role === 'organizer' && sports.length > 0 && (
          <div className="flex-none w-full md:w-48">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="h-12 text-base bg-white/5 border-white/10 focus-visible:ring-primary">
                  <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                  {sports.map(sport => (
                      <SelectItem key={sport} value={sport} className="capitalize">{sport}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 p-1 rounded-xl bg-white/5 overflow-x-auto no-scrollbar">
            {['All', 'Players', 'Coaches', 'Tournaments'].map(filter => (
                <Button 
                  key={filter} 
                  size="sm" 
                  className="h-10 px-6 rounded-lg transition-all shrink-0"
                  variant={activeFilter === filter ? 'default' : 'ghost'} 
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
            ))}
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center items-center py-40">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
      ) : noSportSelected ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-bold mb-2">Select a Sport</h2>
              <p className="text-muted-foreground max-w-md">As an organizer, you can view the community for any sport. Please select one from the filter above to begin.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
              {!hasResults && (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full py-24 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">No Results Found</h2>
                    <p className="text-muted-foreground max-w-md">We couldn't find anyone matching your criteria in the {selectedSport} community. {searchTerm && `Try searching for something else.`}</p>
                </motion.div>
              )}

              {hasResults && finalResults.players.map((p: any, i: number) => (
                  <motion.div layout initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, scale: 0.9}} transition={{delay: i * 0.05}} key={`player-${p.id}`}>
                      <PlayerCard player={p} />
                  </motion.div>
              ))}
              
              {hasResults && finalResults.coaches.map((c: any, i: number) => (
                  <motion.div layout initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, scale: 0.9}} transition={{delay: i * 0.05}} key={`coach-${c.id}`}>
                      <CoachCard coach={c} />
                  </motion.div>
              ))}
              
              {hasResults && finalResults.tournaments.map((t: any, i: number) => (
                  <motion.div layout initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, scale: 0.9}} transition={{delay: i * 0.05}} key={`tourney-${t.id}`}>
                      <TournamentCard tournament={t} />
                  </motion.div>
              ))}
              
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default CommunityPage;