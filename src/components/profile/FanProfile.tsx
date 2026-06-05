'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, MapPin, User, Camera, Heart } from 'lucide-react'

export default function FanProfile({ profile, setProfile }: { profile: any, setProfile: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    city: profile.city || '',
    bio: profile.bio || '',
  })

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        city: formData.city,
        bio: formData.bio
      })
      .eq('id', profile.id)

    setSaving(false)
    if (!error) {
      setProfile({ ...profile, ...formData })
      setIsEditing(false)
    } else {
      alert("Failed to save profile updates.")
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
      setProfile({ ...profile, avatar_url: data.publicUrl })
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert("Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white">
        <div className="h-32 bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent relative" />
        
        <div className="px-6 sm:px-10 pb-10 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white bg-slate-50 shadow-xl">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="text-4xl font-black text-primary bg-primary/10">{profile.name?.charAt(0) || 'F'}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            <div className="text-center sm:text-left flex-1 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-bold tracking-widest mb-3">
                <Heart className="w-3 h-3" /> Fan / Spectator
              </div>
              <h2 className="text-3xl font-black font-headline tracking-tight text-slate-900">{profile.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4" /> {profile.city || 'City not set'}
              </div>
            </div>

            <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving} className="w-full sm:w-auto shadow-md">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isEditing ? <Save className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Short Bio</Label>
                <Input value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="Huge fan of local tournaments..." className="bg-white border-slate-200" />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl text-slate-600 leading-relaxed">
              {profile.bio || "This fan hasn't added a bio yet."}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}