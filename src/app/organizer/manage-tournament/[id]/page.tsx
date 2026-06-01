'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Loader2, Edit, Users, ShieldCheck, Trophy, Settings, Clock, ArrowRight, Save, Calendar, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageTournamentPage = () => {
    const router = useRouter();
    const params = useParams();
    const tournamentId = params.id as string;

    const [tournament, setTournament] = useState<any>(null);
    const [initialTournament, setInitialTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [activeTab, setActiveTab] = useState('details');
    
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [matchLoading, setMatchLoading] = useState(false);
    const [participantLoading, setParticipantLoading] = useState(false);

    const fetchTournament = useCallback(async () => {
        setLoading(true);
        // FIX: Removed the non-existent sport_config join. We use the 'rules' JSONB column now.
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (data) {
            setTournament(data);
            setInitialTournament(data);
        } else {
            console.error("Error fetching tournament:", error);
        }
        setLoading(false);
    }, [tournamentId]);

    const fetchParticipants = useCallback(async () => {
        setParticipantLoading(true);
        // FIX: Adjusted to our actual 'teams' table structure
        const { data } = await supabase
            .from('teams')
            .select(`id, name, logo_url, status, coaches:coach_id(profiles(name))`)
            .eq('tournament_id', tournamentId);

        if (data) setParticipants(data);
        setParticipantLoading(false);
    }, [tournamentId]);

    const fetchMatches = useCallback(async () => {
        setMatchLoading(true);
        // FIX: Using the highly optimized match_details view we created in the SQL!
        const { data } = await supabase
            .from('match_details')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: true });

        if (data) setMatches(data);
        setMatchLoading(false);
    }, [tournamentId]);

    useEffect(() => {
        if (tournamentId) {
            fetchTournament();
            fetchParticipants();
            fetchMatches();
        }
    }, [tournamentId, fetchTournament, fetchParticipants, fetchMatches]);

    const handleDetailChange = (field: string, value: any) => {
        setTournament((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleRuleChange = (field: string, value: any) => {
        setTournament((prev: any) => ({
            ...prev,
            rules: { ...prev.rules, [field]: value }
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        
        // We update the core fields + the nested JSONB rules
        const { error } = await supabase
            .from('tournaments')
            .update({
                name: tournament.name,
                location: tournament.location,
                start_date: tournament.start_date,
                end_date: tournament.end_date,
                max_teams: tournament.max_teams,
                registration_mode: tournament.registration_mode,
                additional_rules: tournament.additional_rules,
                prize_pool: tournament.prize_pool,
                rules: tournament.rules // JSONB saves flawlessly
            })
            .eq('id', tournamentId);

        setSaving(false);
        if (!error) {
            setInitialTournament(tournament);
            alert("Changes saved successfully!");
        } else {
            alert(`Error saving: ${error.message}`);
        }
    };

    // --- RENDER BLOCKERS FOR SAFETY ---
    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;
    if (!tournament) return <DashboardLayout><div className="flex justify-center items-center h-screen text-xl font-bold">Tournament not found.</div></DashboardLayout>;

    // --- DYNAMIC SPORT RULES ---
    const renderSportRules = () => {
        const sport = tournament.sport?.toLowerCase();
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {sport === 'cricket' && (
                    <>
                        <div className="space-y-2"><Label>Overs</Label><Input type="number" className="bg-white/5" value={tournament.rules?.overs || ''} onChange={(e) => handleRuleChange('overs', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Ball Type</Label><Input className="bg-white/5" value={tournament.rules?.ball_type || ''} onChange={(e) => handleRuleChange('ball_type', e.target.value)} /></div>
                    </>
                )}
                {sport === 'football' && (
                    <>
                        <div className="space-y-2"><Label>Match Type</Label><Input className="bg-white/5" value={tournament.rules?.match_type || ''} onChange={(e) => handleRuleChange('match_type', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Half Duration (mins)</Label><Input type="number" className="bg-white/5" value={tournament.rules?.half_duration || ''} onChange={(e) => handleRuleChange('half_duration', e.target.value)} /></div>
                    </>
                )}
                {/* Fallback for others or additions */}
                <div className="col-span-full space-y-2">
                    <Label>Additional Rules / Notes</Label>
                    <Textarea className="bg-white/5 min-h-[100px]" value={tournament.additional_rules || ''} onChange={(e) => handleDetailChange('additional_rules', e.target.value)} />
                </div>
            </div>
        );
    };

    const hasChanges = JSON.stringify(tournament) !== JSON.stringify(initialTournament);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/organizer/dashboard')} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-md text-xs font-bold text-primary uppercase tracking-widest">{tournament.sport}</span>
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${tournament.status === 'live' ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' : 'bg-white/10 border border-white/20'}`}>
                                {tournament.status || 'Upcoming'}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tight">{tournament.name}</h1>
                    </div>
                    
                    {/* Floating Save Button visible if changes are made */}
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <Button size="lg" onClick={saveChanges} disabled={saving} className="shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                    Save Changes
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Modern Navigation Tabs */}
                <GlassCard className="p-2 mb-8 flex overflow-x-auto no-scrollbar gap-2 border-white/10">
                    {[
                        { id: 'details', icon: Edit, label: 'Core Details' },
                        { id: 'settings', icon: Settings, label: 'Sport Config' },
                        { id: 'participants', icon: Users, label: `Teams (${participants.length})` },
                        { id: 'matches', icon: Trophy, label: 'Brackets' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </GlassCard>

                {/* Tab Content Area */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    
                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <GlassCard className="p-6 sm:p-10 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Tournament Details</h2>
                                <div className="space-y-6">
                                    <div>
                                        <Label>Tournament Name</Label>
                                        <Input className="bg-white/5 h-12 text-lg" value={tournament.name || ''} onChange={(e) => handleDetailChange('name', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label>Location / Venue</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input className="bg-white/5 h-12 pl-10" value={tournament.location || ''} onChange={(e) => handleDetailChange('location', e.target.value)} /></div></div>
                                        <div className="space-y-2"><Label>Max Teams Allowed</Label><Input type="number" className="bg-white/5 h-12" value={tournament.max_teams || ''} onChange={(e) => handleDetailChange('max_teams', parseInt(e.target.value, 10))} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label>Start Date</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input type="date" className="bg-white/5 h-12 pl-10" value={tournament.start_date || ''} onChange={(e) => handleDetailChange('start_date', e.target.value)} /></div></div>
                                        <div className="space-y-2"><Label>End Date</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input type="date" className="bg-white/5 h-12 pl-10" value={tournament.end_date || ''} onChange={(e) => handleDetailChange('end_date', e.target.value)} /></div></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Registration Mode</Label>
                                            <Select onValueChange={(value) => handleDetailChange('registration_mode', value)} value={tournament.registration_mode}>
                                                <SelectTrigger className="bg-white/5 h-12"><SelectValue placeholder='Select Mode' /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open / Announcement</SelectItem>
                                                    <SelectItem value="invite">Invite Only</SelectItem>
                                                    <SelectItem value="final">Final / Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Total Prize Pool</Label><Input type="number" className="bg-white/5 h-12 font-bold text-green-400" value={tournament.prize_pool || ''} onChange={(e) => handleDetailChange('prize_pool', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <GlassCard className="p-6 sm:p-10">
                            <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 capitalize">{tournament.sport} specific Rules</h2>
                            {renderSportRules()}
                        </GlassCard>
                    )}

                    {/* PARTICIPANTS TAB */}
                    {activeTab === 'participants' && (
                        <GlassCard className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h2 className="text-2xl font-bold">Approved Teams</h2>
                                <Button size="sm" variant="outline" onClick={fetchParticipants} disabled={participantLoading}>
                                    {participantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh List'}
                                </Button>
                            </div>
                            
                            {participantLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : participants.length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                    <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-bold mb-1">No Teams Approved</h3>
                                    <p className="text-muted-foreground text-sm">Teams will appear here once they register or accept your invite.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {participants.map((team) => (
                                        <div key={team.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/30 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <Avatar className="w-12 h-12 border-2 border-white/10"><AvatarImage src={team.logo_url} /><AvatarFallback className="bg-primary/20 text-primary">{team.name?.charAt(0)}</AvatarFallback></Avatar>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-lg truncate">{team.name}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">Coach: {team.coaches?.profiles?.name || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] uppercase font-bold tracking-widest rounded-md shrink-0">Approved</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    )}

                    {/* MATCHES TAB */}
                    {activeTab === 'matches' && (
                        <GlassCard className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Tournament Brackets</h2>
                                    <p className="text-sm text-muted-foreground">Manage and score scheduled matchups.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={fetchMatches} disabled={matchLoading}>
                                        {matchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync'}
                                    </Button>
                                    <Button size="sm" onClick={() => router.push(`/tournament/${tournamentId}/brackets`)}>
                                        Open Bracket Engine <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {matchLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : matches.length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-bold mb-1">Brackets Not Generated</h3>
                                    <p className="text-muted-foreground text-sm mb-6">You need to generate the brackets to schedule matchups.</p>
                                    <Button onClick={() => router.push(`/tournament/${tournamentId}/brackets`)}>Go to Brackets Engine</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {matches.map(match => (
                                        <div key={match.id} className="p-5 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group hover:border-primary/30 transition-colors">
                                            
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-sm">{match.round_name || `Round ${match.round_number}`}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${match.status === 'live' ? 'bg-green-500/10 text-green-400 animate-pulse' : 'bg-white/10 text-muted-foreground'}`}>{match.status}</span>
                                            </div>

                                            <div className="space-y-3 relative z-10">
                                                <div className="flex items-center gap-3"><Avatar className="w-8 h-8"><AvatarImage src={match.team_a_logo}/><AvatarFallback className="text-xs bg-white/10">{match.team_a_name?.charAt(0)}</AvatarFallback></Avatar><span className="font-bold truncate">{match.team_a_name || 'TBA'}</span></div>
                                                <div className="flex items-center gap-3"><Avatar className="w-8 h-8"><AvatarImage src={match.team_b_logo}/><AvatarFallback className="text-xs bg-white/10">{match.team_b_name?.charAt(0)}</AvatarFallback></Avatar><span className="font-bold truncate">{match.team_b_name || 'TBA'}</span></div>
                                            </div>
                                            
                                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                                <GlassButton variant="secondary" size="sm" className="w-full text-xs py-1 h-auto"><Clock className="w-3 h-3 mr-1"/> Reschedule</GlassButton>
                                                <Button size="sm" className="w-full text-xs py-1 h-auto font-bold" onClick={() => router.push(`/organizer/match/${match.id}`)}>Score Match</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    )}

                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default ManageTournamentPage;