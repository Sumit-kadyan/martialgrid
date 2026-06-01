'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, BarChart2, Shield, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <GlassCard className="p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-muted-foreground">{title}</h3>
            {icon}
        </div>
        <p className="text-4xl font-bold mt-2">{value}</p>
    </GlassCard>
);

const TournamentCard = ({ tournament, teamCount }: { tournament: any, teamCount: number }) => {
    const getStatus = () => {
        const now = new Date();
        const start = new Date(tournament.start_date);
        const end = new Date(tournament.end_date);
        if (now > end) return { text: 'Completed', color: 'text-gray-400' };
        if (now >= start && now <= end) return { text: 'Live', color: 'text-green-400 animate-pulse' };
        return { text: 'Upcoming', color: 'text-yellow-400' };
    };

    const status = getStatus();

    return (
        <GlassCard className="p-5 flex flex-col justify-between hover:border-primary/50 transition-all duration-300">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-xl mb-1">{tournament.name}</h4>
                    <span className={`font-bold text-sm ${status.color}`}>{status.text}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>{tournament.sport} | {tournament.level}</p>
                    <p>{new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}</p>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Registrations</span>
                    <span>{teamCount} / {tournament.max_teams}</span>
                </div>
                <Progress value={(teamCount / tournament.max_teams) * 100} />
                <div className="mt-4 flex gap-2">
                    <Link href={`/organizer/manage-tournament/${tournament.id}`} className="flex-1"><Button className="w-full">Manage Event</Button></Link>
                    <Link href={`/tournament/${tournament.id}`} className="flex-1"><Button variant="outline" className="w-full">Public Page</Button></Link>
                </div>
            </div>
        </GlassCard>
    );
};


const OverviewPage = () => {
    const [user, setUser] = useState<any>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Upcoming');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            setUser({ ...user, name: profile?.name });

            const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('organizer_id', user.id);
            setTournaments(tournamentData || []);

            if (tournamentData && tournamentData.length > 0) {
                const tournamentIds = tournamentData.map(t => t.id);
                const { data: teamData } = await supabase.from('teams').select('id, tournament_id').in('tournament_id', tournamentIds);
                setTeams(teamData || []);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredTournaments = tournaments.filter(t => {
        const now = new Date();
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        if (activeTab === 'Live') return now >= start && now <= end;
        if (activeTab === 'Completed') return now > end;
        if (activeTab === 'Upcoming') return now < start;
        return true;
    });

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    if (loading) {
        return (
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => <GlassCard key={i} className="h-32 animate-pulse"></GlassCard>)}
                    </div>
                    <div className="mt-8">
                        <GlassCard className="h-96 animate-pulse"></GlassCard>
                    </div>
                </div>
        );
    }
    
    const activeTournaments = tournaments.filter(t => new Date(t.end_date) >= new Date());

    return (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-8">
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.name || 'Organizer'}!</h1>
                    <Link href="/organizer/create-tournament">
                        <Button size="lg" className="mt-4 sm:mt-0 neon-glow-primary"><Plus className="mr-2" /> Create New Tournament</Button>
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Tournaments" value={tournaments.length} icon={<BarChart2 className="text-primary" />} />
                    <StatCard title="Active Events" value={activeTournaments.length} icon={<Shield className="text-green-400" />} />
                    <StatCard title="Total Teams Registered" value={teams.length} icon={<Users className="text-yellow-400" />} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard>
                        <div className="p-4 border-b border-white/10 flex gap-2">
                            {['Upcoming', 'Live', 'Completed'].map(tab => (
                                <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} onClick={() => setActiveTab(tab)}>{tab}</Button>
                            ))}
                        </div>
                        {tournaments.length === 0 ? (
                            <div className="text-center p-20">
                                <h3 className="text-2xl font-bold">No Tournaments Yet</h3>
                                <p className="text-muted-foreground mb-6">It's time to kick things off. Create your first tournament to get started.</p>
                                <Link href="/organizer/create-tournament"><Button>Create First Tournament <ArrowRight className="ml-2" /></Button></Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {filteredTournaments.map(t => (
                                    <TournamentCard key={t.id} tournament={t} teamCount={teams.filter(team => team.tournament_id === t.id).length} />
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </motion.div>
    );
};

export default OverviewPage;
