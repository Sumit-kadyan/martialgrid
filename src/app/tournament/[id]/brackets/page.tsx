'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shuffle, Calendar, Trophy, ChevronLeft, Swords, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BracketsPage = () => {
    const params = useParams();
    const router = useRouter();
    const tournamentId = params.id as string;

    const [tournament, setTournament] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [tournamentId]);

    const fetchData = async () => {
        setLoading(true);
        
        // 1. Fetch Tournament
        const { data: tData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
        if (tData) setTournament(tData);

        // 2. Fetch Approved Teams
        const { data: teamsData } = await supabase.from('teams').select('*').eq('tournament_id', tournamentId).eq('status', 'approved');
        if (teamsData) setTeams(teamsData);

        // 3. Fetch Existing Matches using our SQL View
        const { data: matchData } = await supabase.from('match_details').select('*').eq('tournament_id', tournamentId).order('round_number', { ascending: true });
        if (matchData) setMatches(matchData);

        setLoading(false);
    };

    // --- THE MATCHMAKING ENGINE ---
    const generateBracket = async () => {
        if (teams.length < 2) return alert("You need at least 2 approved teams to generate a bracket.");
        setGenerating(true);

        // 1. Shuffle teams for random matchups
        const shuffled = [...teams].sort(() => 0.5 - Math.random());
        
        // 2. Determine Round Name based on team count
        let roundName = 'Round 1';
        if (shuffled.length <= 2) roundName = 'Finals';
        else if (shuffled.length <= 4) roundName = 'Semi-Finals';
        else if (shuffled.length <= 8) roundName = 'Quarter-Finals';

        const newMatches = [];
        
        // 3. Pair them up
        for (let i = 0; i < shuffled.length; i += 2) {
            // Handle Byes (if odd number of teams)
            if (i + 1 >= shuffled.length) {
                // Team gets a bye to the next round - for now, we'll create a placeholder match
                console.log(`${shuffled[i].name} gets a bye!`);
                continue; 
            }

            newMatches.push({
                tournament_id: tournamentId,
                team_a_id: shuffled[i].id,
                team_b_id: shuffled[i + 1].id,
                round_number: 1,
                round_name: roundName,
                status: 'scheduled'
            });
        }

        // 4. Insert into Database
        const { error } = await supabase.from('matches').insert(newMatches);
        
        setGenerating(false);
        if (!error) {
            fetchData(); // Reload the UI with new matches
        } else {
            console.error("Error generating matches:", error);
            alert("Failed to generate bracket.");
        }
    };

    // Group matches by round for UI rendering
    const matchesByRound = matches.reduce((acc, match) => {
        if (!acc[match.round_number]) acc[match.round_number] = [];
        acc[match.round_number].push(match);
        return acc;
    }, {});

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/overview')} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Button>
                        <h1 className="text-4xl font-extrabold font-headline tracking-tight">{tournament?.name} <span className="text-primary">Brackets</span></h1>
                        <p className="text-muted-foreground mt-1">Manage matchups, schedule timings, and progress teams.</p>
                    </div>
                </div>

                {matches.length === 0 ? (
                    /* EMPTY STATE: AUTO GENERATOR */
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <GlassCard className="p-8 text-center border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
                            
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-primary/50">
                                <Shuffle className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold mb-3 relative z-10">Generate Matchups</h2>
                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto relative z-10">
                                You have {teams.length} approved teams. Our engine will shuffle the teams and automatically generate the Round 1 bracket.
                            </p>
                            
                            <Button 
                                size="lg" 
                                onClick={generateBracket} 
                                disabled={generating || teams.length < 2}
                                className="w-full max-w-sm mx-auto shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.6)] text-lg h-14 relative z-10"
                            >
                                {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Swords className="w-5 h-5 mr-2" />}
                                {generating ? 'Generating Bracket...' : 'Auto-Generate Bracket'}
                            </Button>

                            {teams.length < 2 && (
                                <p className="text-red-400 text-sm mt-4 flex items-center justify-center gap-1 relative z-10">
                                    <AlertCircle className="w-4 h-4" /> Need at least 2 teams to generate.
                                </p>
                            )}
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Approved Teams ({teams.length})</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {teams.map(team => (
                                    <div key={team.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                        <Avatar className="w-10 h-10 border border-white/20">
                                            <AvatarImage src={team.logo_url} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">{team.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold">{team.name}</span>
                                    </div>
                                ))}
                                {teams.length === 0 && <p className="text-muted-foreground text-sm">No teams have been approved yet.</p>}
                            </div>
                        </GlassCard>
                    </motion.div>
                ) : (
                    /* POPULATED BRACKET VIEW */
                    <div className="space-y-12">
                        {Object.keys(matchesByRound).map((roundNum) => {
                            const roundMatches = matchesByRound[roundNum];
                            return (
                                <div key={roundNum} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-bold font-headline mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">{roundNum}</span>
                                        {roundMatches[0].round_name || `Round ${roundNum}`}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {roundMatches.map((match: any) => (
                                            <GlassCard key={match.id} className="p-0 overflow-hidden border-white/10 hover:border-primary/30 transition-colors">
                                                
                                                {/* Top Bar: Date & Status */}
                                                <div className="flex justify-between items-center p-3 bg-white/5 border-b border-white/5">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {match.start_time ? new Date(match.start_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}
                                                    </div>
                                                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${match.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' : match.status === 'live' ? 'bg-green-500/10 text-green-400 animate-pulse' : 'bg-white/10 text-muted-foreground'}`}>
                                                        {match.status}
                                                    </span>
                                                </div>

                                                {/* The Matchup */}
                                                <div className="p-5 space-y-4">
                                                    {/* Team A */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-8 h-8"><AvatarImage src={match.team_a_logo} /><AvatarFallback className="text-xs bg-white/10">{match.team_a_name?.charAt(0)}</AvatarFallback></Avatar>
                                                            <span className="font-bold text-lg">{match.team_a_name}</span>
                                                        </div>
                                                        <span className="text-xl font-mono font-bold text-muted-foreground">-</span>
                                                    </div>
                                                    
                                                    <div className="relative flex justify-center">
                                                        <div className="absolute w-full h-[1px] bg-white/10 top-1/2 -translate-y-1/2" />
                                                        <span className="bg-background px-2 text-xs font-bold text-muted-foreground relative z-10 uppercase tracking-widest">VS</span>
                                                    </div>

                                                    {/* Team B */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-8 h-8"><AvatarImage src={match.team_b_logo} /><AvatarFallback className="text-xs bg-white/10">{match.team_b_name?.charAt(0)}</AvatarFallback></Avatar>
                                                            <span className="font-bold text-lg">{match.team_b_name}</span>
                                                        </div>
                                                        <span className="text-xl font-mono font-bold text-muted-foreground">-</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Actions */}
                                                <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                                                    <GlassButton variant="secondary" size="sm" className="w-full text-xs">
                                                        <Calendar className="w-3.5 h-3.5 mr-2" /> Set Time
                                                    </GlassButton>
                                                    <Button size="sm" className="w-full text-xs font-bold" onClick={() => router.push(`/organizer/match/${match.id}`)}>
                                                        Manage Score
                                                    </Button>
                                                </div>
                                            </GlassCard>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BracketsPage;