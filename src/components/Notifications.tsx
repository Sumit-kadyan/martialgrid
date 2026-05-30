'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Bell, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NotificationItem = ({ notification, onUpdate }: { notification: any, onUpdate: () => void }) => {

  const handleAccept = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !notification.metadata?.team_invitation_id || !notification.metadata?.coach_id) return;

    // 1. Update team_invitations
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', notification.metadata.team_invitation_id);

    // 2. Update player's coach_id
    const { error: playerError } = await supabase
      .from('players')
      .update({ coach_id: notification.metadata.coach_id })
      .eq('id', user.id);

    // 3. Mark notification as read
    const { error: notifError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
      
    if (inviteError || playerError || notifError) {
        console.error('Error accepting invite:', inviteError || playerError || notifError);
    } else {
        onUpdate();
    }
  };

  const handleDecline = async () => {
     const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
     if(error) console.error('Error declining', error); 
     else onUpdate();
  };

  return (
    <div className="p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors">
      <p className="text-sm text-gray-200 mb-2">{notification.message}</p>
      {notification.type === 'team_invite' && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleAccept}><Check className="w-3 h-3 mr-1"/> Accept</Button>
          <Button size="sm" variant="outline" onClick={handleDecline}><X className="w-3 h-3 mr-1"/> Decline</Button>
        </div>
      )}
    </div>
  )
}

export const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
          console.error("Failed to fetch notifications", error);
      } else {
          setNotifications(data || []);
          setUnreadCount(count || 0);
      }
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-700 transition-colors">
        <Bell className="text-gray-300 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold text-white">{unreadCount}</div>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 z-20"
          >
            <div className="rounded-lg shadow-lg border border-gray-700 bg-gray-800/95 backdrop-blur-sm">
                <div className="p-3 border-b border-gray-700">
                    <h3 className="font-bold text-white">Notifications</h3>
                </div>
                {notifications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map(n => <NotificationItem key={n.id} notification={n} onUpdate={fetchNotifications} />)}
                    </div>
                ) : (
                    <p className="p-4 text-center text-sm text-gray-400">No new notifications.</p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
