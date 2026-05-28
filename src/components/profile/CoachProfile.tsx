'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Pencil, Trophy, UserPlus, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression';

// Re-using the EditableField and ExpertiseBadge from PlayerProfile would be ideal
// For this example, they are duplicated for clarity.
const EditableField = ({ value, onSave, label }: { value: string, onSave: (newValue: string) => Promise<void>, label: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = async () => {
    await onSave(currentValue);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-4 group">
      <motion.div layout className="flex-1">
        {isEditing ? (
          <input 
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="bg-transparent border-b-2 border-primary/50 focus:outline-none w-full text-lg"
            autoFocus
          />
        ) : (
          <p className="text-lg text-foreground/80">{label}: <span className="font-bold">{value}</span></p>
        )}
      </motion.div>
      <button onClick={() => setIsEditing(!isEditing)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-4 h-4 text-primary" />
      </button>
    </div>
  )
}

export default function CoachProfile({ profile, setProfile }: { profile: any, setProfile: (newProfile: any) => void}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (field: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id).select().single();
      if(error) {
        console.error(`Error updating ${field}:`, error);
      } else {
        setProfile(data);
      }
    }
  }
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    }

    try {
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await handleSave('avatar_url', publicUrl);
      setAvatarUrl(publicUrl);

    } catch (error) {
      console.error('Error uploading avatar: ', error);
    } finally {
      setUploading(false);
    }
  }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    }

  return (
    <GlassCard className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="relative">
            <label htmlFor="avatar-upload" className="cursor-pointer">
                <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><div className="loader"></div></div>}
            </label>
            <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{profile.name}</h1>
          <p className="text-xl text-primary/80">Coach</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary/20 pb-2">Personal Info</h2>
              <div className="space-y-4">
                  <EditableField label="Name" value={profile.name} onSave={(newValue) => handleSave('name', newValue)} />
                  <EditableField label="Age" value={profile.age.toString()} onSave={async (newValue) => {await handleSave('age', parseInt(newValue, 10))}} />
                  <EditableField label="Gender" value={profile.gender} onSave={(newValue) => handleSave('gender', newValue)} />
              </div>
          </div>
          <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary/20 pb-2">Professional Info</h2>
              <div className="space-y-4">
                  <EditableField label="Certifications" value={profile.certifications || 'N/A'} onSave={(newValue) => handleSave('certifications', newValue)} />
              </div>
          </div>
      </div>

      <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary/20 pb-2 flex items-center gap-2"><Trophy /> Trained Players</h2>
          {/* Grid of players here */}
      </div>

      <div className="flex justify-between items-center mt-12">
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2" /> Log Out</Button>
          <Button><UserPlus className="mr-2" /> Add New Player</Button>
      </div>
    </GlassCard>
  )
}
