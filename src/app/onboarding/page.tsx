'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, ArrowLeft, User, Cake, VenetianMask, Trophy, Briefcase, Users, Camera, Upload, Loader2, Eye } from 'lucide-react'

import GlassCard from '@/components/glass/GlassCard'
import GlassButton from '@/components/glass/GlassButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const OnboardingPage = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<any>({
    name: '',
    age: '',
    gender: '',
    avatar_url: '',
    role: '',
    sport: '',
    sportSpecifics: {}, 
    experience: '',
    team: '', 
    team_logo: '', 
    team_members: '', 
    organization: '',
    eventTypes: '',
    certifications: '',
  })
  
  const router = useRouter()

  useEffect(() => {
    const checkOnboardingStatus = async (user: any) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
        checkOnboardingStatus(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        checkOnboardingStatus(session?.user);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [router]);

  const handleNext = () => setStep(step + 1)
  const handlePrevious = () => setStep(step - 1)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'sport' ? { sportSpecifics: {} } : {}) 
    }))
  }
  
  const handleSportSpecificsChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ 
      ...prev, 
      sportSpecifics: {
        ...prev.sportSpecifics,
        [name]: value
      }
    }))
  }

  // --- SUPABASE STORAGE LOGIC ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'avatar_url' | 'team_logo') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(fieldName);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      setFormData((prev: any) => ({ ...prev, [fieldName]: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(null);
    }
  };

  // --- DATABASE LOGIC ---
  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 1. Core Profile Identity (Updated with Avatar)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: formData.name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        avatar_url: formData.avatar_url,
        role: formData.role, 
        onboarding_completed: true,
      })
    
      if (profileError) {
        console.error('Error saving profile:', profileError)
        setLoading(false);
        return;
      }
    
      // 2. Role-Specific Relational Data
      if (formData.role === 'player') {
        const { error: playerError } = await supabase.from('players').upsert({
          id: user.id,
          sport: formData.sport,
          sport_specifics: formData.sportSpecifics, 
          experience: formData.experience,
          team: formData.team, 
        })
        if (playerError) console.error('Error saving player profile:', playerError)
      }
    
      if (formData.role === 'coach') {
        const parsedMembers = formData.team_members
            ? formData.team_members.split(',').map((name: string) => name.trim()).filter(Boolean)
            : [];

        const { error: coachError } = await supabase.from('coaches').upsert({
          id: user.id,
          sport: formData.sport,
          team_name: formData.team,
          team_logo: formData.team_logo,
          team_members: parsedMembers, 
        })
        if (coachError) console.error('Error saving coach profile:', coachError)
      }
    
      if (formData.role === 'organizer') {
        const { error: organizerError } = await supabase.from('organizers').upsert({
          id: user.id,
          organization_name: formData.organization,
        })
        if (organizerError) console.error('Error saving organizer profile:', organizerError)
      }
    
      // Fans don't need additional tables. Their data is fully stored in `profiles`.
      // We push them directly to the global discovery page (or dashboard based on your routing).
      router.push(formData.role === 'fan' ? '/tournaments/dashboard' : '/dashboard')
    }
    setLoading(false);
  }

  // Dynamic Step Calculator
  let totalSteps = 2; // Default to 2 for Fans
  if (formData.role === 'player' || formData.role === 'coach') totalSteps = 4;
  else if (formData.role === 'organizer') totalSteps = 3;
  
  // --- VALIDATION ENGINE ---
  const isStepValid = (() => {
    switch (step) {
      case 1: {
        const ageNum = parseInt(formData.age, 10);
        const isAgeValid = !isNaN(ageNum) && ageNum >= 5 && ageNum <= 120;
        return !!(formData.name && formData.age && isAgeValid && formData.gender);
      }
      case 2:
        return !!formData.role;
      case 3:
        if (formData.role === 'player' || formData.role === 'coach') return !!formData.sport;
        if (formData.role === 'organizer') return !!formData.organization;
        return false;
      case 4:
        if (formData.role === 'player') {
            const specifics = formData.sportSpecifics as any;
            const isValidWeight = (w: string) => {
              const num = parseInt(w, 10);
              return !isNaN(num) && num > 10 && num < 250;
            };

            switch (formData.sport) {
                case 'cricket':
                    if (!specifics.role) return false;
                    if (specifics.role === 'batsman' || specifics.role === 'wicket_keeper') return !!specifics.batting_style;
                    if (specifics.role === 'bowler') return !!specifics.bowling_style;
                    if (specifics.role === 'all_rounder') return !!(specifics.batting_style && specifics.bowling_style);
                    return false;
                case 'kabaddi':
                    return !!(specifics.position && specifics.specialty);
                case 'badminton':
                    return !!(specifics.playing_style && specifics.strong_hand);
                case 'football':
                    return !!(specifics.position && specifics.foot);
                case 'wrestling':
                    return !!(specifics.style && specifics.weight_class && isValidWeight(specifics.weight_class));
                case 'karate':
                    return !!(specifics.style && specifics.belt && specifics.weight_category && isValidWeight(specifics.weight_category));
                case 'judo':
                    return !!(specifics.belt && specifics.weight_category && isValidWeight(specifics.weight_category) && specifics.preferred_technique);
                case 'tennis':
                    return !!(specifics.playing_style && specifics.strong_hand && specifics.backhand);
                case 'basketball':
                    return !!specifics.position;
                case 'volleyball':
                    return !!specifics.position;
                default:
                    return true;
            }
        }
        if (formData.role === 'coach') {
            return !!formData.team;
        }
        return true;
      default:
        return false;
    }
  })();

  const renderStep = () => {
     switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
            <h2 className='text-3xl font-bold text-foreground'>Tell us about yourself</h2>
            
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative group cursor-pointer">
                    <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-lg">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {uploadingImage === 'avatar_url' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'avatar_url')} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage !== null}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wider font-semibold">Profile Photo (Optional)</p>
            </div>

            <div className='flex items-center gap-4'>
              <User className='w-6 h-6 text-primary shrink-0' />
              <div className='w-full'>
                <Label htmlFor='name'>Full Name</Label>
                <Input id='name' name='name' placeholder='e.g. John Doe' onChange={handleInputChange} value={formData.name} />
              </div>
            </div>
            
            <div className='flex items-center gap-4'>
              <Cake className='w-6 h-6 text-primary shrink-0' />
              <div className='w-full'>
                <Label htmlFor='age'>Age</Label>
                <Input id='age' name='age' type='number' placeholder='e.g. 25' onChange={handleInputChange} value={formData.age} />
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <VenetianMask className='w-6 h-6 text-primary shrink-0' />
              <div className='w-full'>
                <Label htmlFor='gender'>Gender</Label>
                <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
                  <SelectTrigger><SelectValue placeholder='Select your gender' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
            <h2 className='text-3xl font-bold text-foreground'>What is your role?</h2>
            <div className='flex items-center gap-4'>
              <Users className='w-6 h-6 text-primary shrink-0' />
              <div className='w-full'>
                <Label htmlFor='role'>Role</Label>
                <Select onValueChange={(value) => handleSelectChange('role', value)} value={formData.role}>
                  <SelectTrigger><SelectValue placeholder='Select your role' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='fan'>Fan (View Only)</SelectItem>
                    <SelectItem value='player'>Player</SelectItem>
                    <SelectItem value='coach'>Coach</SelectItem>
                    <SelectItem value='organizer'>Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.role === 'fan' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 mt-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                    <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">As a Fan, you're all set! You will have view-only access to browse live brackets, follow your favorite teams, and monitor real-time score updates across all sports.</p>
                </motion.div>
            )}
          </motion.div>
        )
      case 3:
        if (formData.role === 'player' || formData.role === 'coach') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Select your Sport</h2>
                    <div className='flex items-center gap-4'>
                    <Trophy className='w-6 h-6 text-primary shrink-0' />
                    <div className='w-full'>
                        <Label htmlFor='sport'>Primary Sport</Label>
                        <Select onValueChange={(value) => handleSelectChange('sport', value)} value={formData.sport}>
                        <SelectTrigger><SelectValue placeholder='Select your sport' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='cricket'>Cricket</SelectItem>
                            <SelectItem value='kabaddi'>Kabaddi</SelectItem>
                            <SelectItem value='badminton'>Badminton</SelectItem>
                            <SelectItem value='football'>Football</SelectItem>
                            <SelectItem value='wrestling'>Wrestling</SelectItem>
                            <SelectItem value='karate'>Karate</SelectItem>
                            <SelectItem value='judo'>Judo</SelectItem>
                            <SelectItem value='tennis'>Tennis</SelectItem>
                            <SelectItem value='basketball'>Basketball</SelectItem>
                            <SelectItem value='volleyball'>Volleyball</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>
                </motion.div>
            )
        }
        if (formData.role === 'organizer') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Organization Details</h2>
                    <div className='flex items-center gap-4'>
                        <Briefcase className='w-6 h-6 text-primary shrink-0' />
                        <div className='w-full'>
                            <Label htmlFor='organization'>Organization Name</Label>
                            <Input id='organization' name='organization' placeholder='e.g. Elite Sports Management' onChange={handleInputChange} value={formData.organization} />
                        </div>
                    </div>
                </motion.div>
            )
        }
        return null;
      case 4:
        if (formData.role === 'player') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Sport Specifics</h2>
                    {renderSportSpecificStep()}
                </motion.div>
            )
        }
        if (formData.role === 'coach') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground mb-2'>Team Identity</h2>
                    <p className="text-muted-foreground text-sm mb-6">Setup your base team profile. You can update this roster later for specific tournaments.</p>
                    
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative group cursor-pointer">
                            <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-md rounded-lg">
                                <AvatarImage src={formData.team_logo} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                                    {uploadingImage === 'team_logo' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, 'team_logo')} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploadingImage !== null}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wider font-semibold">Team Logo (Optional)</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="team">Team Name <span className="text-red-500">*</span></Label>
                            <Input id="team" name="team" placeholder="e.g. The Spartans" onChange={handleInputChange} value={formData.team} />
                        </div>
                        
                        <div>
                            <Label htmlFor="team_members">Team Members (Roster)</Label>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Separate names with commas</p>
                            <Textarea 
                                id="team_members" 
                                name="team_members" 
                                placeholder="e.g. John Doe, Mike Smith, Alex Johnson..." 
                                className="min-h-[100px]"
                                onChange={handleInputChange} 
                                value={formData.team_members} 
                            />
                        </div>
                    </div>
                </motion.div>
            )
        }
        return null;
      default:
        return null
    }
  }
  
  const renderSportSpecificStep = () => {
    const specifics = formData.sportSpecifics as any;
     switch (formData.sport) {
      case 'cricket':
        return (
          <div className='space-y-4'>
            <Label>Role</Label>
            <Select onValueChange={(value) => handleSportSpecificsChange('role', value)} value={specifics.role}>
                <SelectTrigger><SelectValue placeholder='Select your role' /></SelectTrigger>
                <SelectContent>
                    <SelectItem value='batsman'>Batsman</SelectItem>
                    <SelectItem value='bowler'>Bowler</SelectItem>
                    <SelectItem value='all_rounder'>All-rounder</SelectItem>
                    <SelectItem value='wicket_keeper'>Wicket Keeper</SelectItem>
                </SelectContent>
            </Select>

            {(specifics.role === 'batsman' || specifics.role === 'all_rounder' || specifics.role === 'wicket_keeper') && (<>
                <Label>Batting Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('batting_style', value)} value={specifics.batting_style}><SelectTrigger><SelectValue placeholder='Select batting style' /></SelectTrigger><SelectContent><SelectItem value='right_handed'>Right-handed</SelectItem><SelectItem value='left_handed'>Left-handed</SelectItem></SelectContent></Select>
            </>)}

            {(specifics.role === 'bowler' || specifics.role === 'all_rounder') && (<>
                <Label>Bowling Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('bowling_style', value)} value={specifics.bowling_style}><SelectTrigger><SelectValue placeholder='Select bowling style' /></SelectTrigger><SelectContent><SelectItem value='right_arm'>Right-arm Pace</SelectItem><SelectItem value='left_arm'>Left-arm Pace</SelectItem><SelectItem value='right_arm_spin'>Right-arm Spin</SelectItem><SelectItem value='left_arm_spin'>Left-arm Spin</SelectItem></SelectContent></Select>
            </>)}
          </div>
        )
      case 'kabaddi':
        return (
            <div className='space-y-4'>
                <Label>Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select your position' /></SelectTrigger><SelectContent><SelectItem value='raider'>Raider</SelectItem><SelectItem value='defender'>Defender</SelectItem></SelectContent></Select>
                <Label>Specialty</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('specialty', value)} value={specifics.specialty}><SelectTrigger><SelectValue placeholder='Select your specialty' /></SelectTrigger><SelectContent><SelectItem value='toe_touch'>Toe Touch</SelectItem><SelectItem value='hand_touch'>Hand Touch</SelectItem><SelectItem value='ankle_hold'>Ankle Hold</SelectItem><SelectItem value='thigh_hold'>Thigh Hold</SelectItem></SelectContent></Select>
            </div>
        )
      case 'badminton':
        return (
            <div className='space-y-4'>
                <Label>Playing Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('playing_style', value)} value={specifics.playing_style}><SelectTrigger><SelectValue placeholder='Select playing style' /></SelectTrigger><SelectContent><SelectItem value='singles'>Singles</SelectItem><SelectItem value='doubles'>Doubles</SelectItem><SelectItem value='mixed_doubles'>Mixed Doubles</SelectItem></SelectContent></Select>
                <Label>Strong Hand</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('strong_hand', value)} value={specifics.strong_hand}><SelectTrigger><SelectValue placeholder='Select strong hand' /></SelectTrigger><SelectContent><SelectItem value='right'>Right</SelectItem><SelectItem value='left'>Left</SelectItem></SelectContent></Select>
            </div>
        )
      case 'football':
        return (
            <div className='space-y-4'>
                <Label>Preferred Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select preferred position' /></SelectTrigger><SelectContent><SelectItem value='goalkeeper'>Goalkeeper</SelectItem><SelectItem value='defender'>Defender</SelectItem><SelectItem value='midfielder'>Midfielder</SelectItem><SelectItem value='forward'>Forward</SelectItem></SelectContent></Select>
                <Label>Preferred Foot</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('foot', value)} value={specifics.foot}><SelectTrigger><SelectValue placeholder='Select preferred foot' /></SelectTrigger><SelectContent><SelectItem value='right'>Right</SelectItem><SelectItem value='left'>Left</SelectItem><SelectItem value='both'>Both</SelectItem></SelectContent></Select>
            </div>
        )
      case 'wrestling':
        return (
            <div className='space-y-4'>
                <Label>Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('style', value)} value={specifics.style}><SelectTrigger><SelectValue placeholder='Select wrestling style' /></SelectTrigger><SelectContent><SelectItem value='freestyle'>Freestyle</SelectItem><SelectItem value='greco_roman'>Greco-Roman</SelectItem></SelectContent></Select>
                <Label>Weight Class (kg)</Label>
                <Input name='weight_class' type='number' placeholder='e.g. 74' value={specifics.weight_class || ''} onChange={(e) => handleSportSpecificsChange(e.target.name, e.target.value)} />
            </div>
        )
      case 'karate':
        return (
            <div className='space-y-4'>
                <Label>Karate Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('style', value)} value={specifics.style}><SelectTrigger><SelectValue placeholder='Select style' /></SelectTrigger><SelectContent><SelectItem value='shotokan'>Shotokan</SelectItem><SelectItem value='goju_ryu'>Goju-ryu</SelectItem><SelectItem value='wado_ryu'>Wado-ryu</SelectItem><SelectItem value='shito_ryu'>Shito-ryu</SelectItem></SelectContent></Select>
                <Label>Current Belt</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('belt', value)} value={specifics.belt}><SelectTrigger><SelectValue placeholder='Select belt color' /></SelectTrigger><SelectContent><SelectItem value='white'>White</SelectItem><SelectItem value='yellow'>Yellow</SelectItem><SelectItem value='orange'>Orange</SelectItem><SelectItem value='green'>Green</SelectItem><SelectItem value='blue'>Blue</SelectItem><SelectItem value='brown'>Brown</SelectItem><SelectItem value='black'>Black</SelectItem></SelectContent></Select>
                <Label>Weight Category (kg)</Label>
                <Input name='weight_category' type='number' placeholder='e.g. 67' value={specifics.weight_category || ''} onChange={(e) => handleSportSpecificsChange(e.target.name, e.target.value)} />
            </div>
        )
      case 'judo':
        return (
            <div className='space-y-4'>
                <Label>Belt Level (Kyu / Dan)</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('belt', value)} value={specifics.belt}><SelectTrigger><SelectValue placeholder='Select level' /></SelectTrigger><SelectContent><SelectItem value='white'>White (6th Kyu)</SelectItem><SelectItem value='yellow'>Yellow (5th Kyu)</SelectItem><SelectItem value='orange'>Orange (4th Kyu)</SelectItem><SelectItem value='green'>Green (3rd Kyu)</SelectItem><SelectItem value='blue'>Blue (2nd Kyu)</SelectItem><SelectItem value='brown'>Brown (1st Kyu)</SelectItem><SelectItem value='black'>Black (Dan)</SelectItem></SelectContent></Select>
                <Label>Preferred Technique</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('preferred_technique', value)} value={specifics.preferred_technique}><SelectTrigger><SelectValue placeholder='Select primary focus' /></SelectTrigger><SelectContent><SelectItem value='nage_waza'>Throwing (Nage-waza)</SelectItem><SelectItem value='katame_waza'>Grappling (Katame-waza)</SelectItem></SelectContent></Select>
                <Label>Weight Category (kg)</Label>
                <Input name='weight_category' type='number' placeholder='e.g. 73' value={specifics.weight_category || ''} onChange={(e) => handleSportSpecificsChange(e.target.name, e.target.value)} />
            </div>
        )
      case 'tennis':
        return (
            <div className='space-y-4'>
                <Label>Playing Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('playing_style', value)} value={specifics.playing_style}><SelectTrigger><SelectValue placeholder='Select playing style' /></SelectTrigger><SelectContent><SelectItem value='singles'>Singles</SelectItem><SelectItem value='doubles'>Doubles</SelectItem><SelectItem value='both'>Both</SelectItem></SelectContent></Select>
                <Label>Strong Hand</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('strong_hand', value)} value={specifics.strong_hand}><SelectTrigger><SelectValue placeholder='Select strong hand' /></SelectTrigger><SelectContent><SelectItem value='right'>Right</SelectItem><SelectItem value='left'>Left</SelectItem></SelectContent></Select>
                <Label>Backhand Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('backhand', value)} value={specifics.backhand}><SelectTrigger><SelectValue placeholder='Select backhand style' /></SelectTrigger><SelectContent><SelectItem value='one_handed'>One-handed</SelectItem><SelectItem value='two_handed'>Two-handed</SelectItem></SelectContent></Select>
            </div>
        )
      case 'basketball':
        return (
            <div className='space-y-4'>
                <Label>Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select court position' /></SelectTrigger><SelectContent><SelectItem value='point_guard'>Point Guard</SelectItem><SelectItem value='shooting_guard'>Shooting Guard</SelectItem><SelectItem value='small_forward'>Small Forward</SelectItem><SelectItem value='power_forward'>Power Forward</SelectItem><SelectItem value='center'>Center</SelectItem></SelectContent></Select>
            </div>
        )
      case 'volleyball':
        return (
            <div className='space-y-4'>
                <Label>Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select court position' /></SelectTrigger><SelectContent><SelectItem value='setter'>Setter</SelectItem><SelectItem value='outside_hitter'>Outside Hitter</SelectItem><SelectItem value='opposite_hitter'>Opposite Hitter</SelectItem><SelectItem value='middle_blocker'>Middle Blocker</SelectItem><SelectItem value='libero'>Libero</SelectItem></SelectContent></Select>
            </div>
        )
      default:
        return <p className='text-muted-foreground'>Please select a sport in the previous step to see more options.</p>
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gray-100'>
      <GlassCard className='w-full max-w-2xl p-8 relative overflow-hidden'>
        
        <div className='flex justify-between items-center mb-8 relative z-10'>
          <h1 className='text-4xl font-headline font-bold text-foreground'>Setup Your Profile</h1>
          <div className='text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full'>Step {step} of {totalSteps}</div>
        </div>

        <AnimatePresence mode="wait">
            <motion.div key={step} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} className="relative z-10">
                {renderStep()}
            </motion.div>
        </AnimatePresence>

        <div className='flex justify-between mt-12 relative z-10 border-t border-black/5 pt-6'>
          {step > 1 ? (
            <GlassButton onClick={handlePrevious} variant='outline' className='group text-foreground border-foreground/20 hover:bg-foreground/5'>
              <ArrowLeft className='mr-2 group-hover:-translate-x-1 transition-transform w-4 h-4' /> Previous
            </GlassButton>
          ) : <div />} 

          {step < totalSteps ? (
            <GlassButton onClick={handleNext} disabled={!isStepValid} className='group bg-primary text-primary-foreground hover:bg-primary/90'>
              Next <ArrowRight className='ml-2 group-hover:translate-x-1 transition-transform w-4 h-4' />
            </GlassButton>
          ) : (
            <GlassButton onClick={handleSubmit} disabled={!isStepValid || loading} className='group bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]'>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? 'Saving Profile...' : 'Finish Setup'}
              {!loading && <ArrowRight className='ml-2 group-hover:translate-x-1 transition-transform w-4 h-4' />}
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

export default OnboardingPage