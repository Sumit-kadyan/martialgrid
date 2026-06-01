'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Loader2, Calendar, Users, Share2, Trophy, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link'; // Import Link component

// Assuming TournamentCard component is in '@/components/TournamentCard'
// You might need to adjust this import path based on your project structure
import TournamentCard from '@/components/community/TournamentCard'; // This is a placeholder, adjust as needed

const TournamentsListPage = () => {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('status', 'upcoming') // Fetch only upcoming tournaments
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching tournaments:", error);
                // Handle error, e.g., show an error message to the user
            } else {
                setTournaments(data || []);
            }
            setLoading(false);
        };

        fetchTournaments();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-8">
                <motion.h1 variants={itemVariants} className="text-3xl font-bold font-headline mb-8">Upcoming Tournaments</motion.h1>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <GlassCard key={i} className="p-5 h-64 animate-pulse bg-gray-800/50"></GlassCard>
                        ))}
                    </div>
                ) : tournaments.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center p-20">
                        <h3 className="text-2xl font-bold">No tournaments scheduled right now</h3>
                        <p className="text-muted-foreground mb-6">Check back soon for exciting upcoming events!</p>
                        {/* You might want to add a button to create a tournament here if applicable */}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map(tournament => (
                            <motion.div variants={itemVariants} key={tournament.id} className="relative group">
                                <Link href={`/tournament/${tournament.id}`} className="block">
                                    <TournamentCard
                                        tournament={tournament}
                                        // You might need to fetch or derive team count if TournamentCard expects it
                                        // For now, passing a placeholder or 0
                                        
                                    />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
};

export default TournamentsListPage;
