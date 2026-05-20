"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, User, Cake, VenetianMask, Trophy } from "lucide-react"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

const OnboardingPage = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    sport: "",
  })
  const router = useRouter()

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile && profile.onboarding_completed) {
          router.push('/dashboard')
        }
      }
    }

    checkOnboardingStatus()
  }, [router])

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...formData,
        onboarding_completed: true,
      })

      if (error) {
        console.error('Error saving profile:', error)
      } else {
        router.push('/dashboard')
      }
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-8">Tell us about yourself</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-primary" />
                <div className="w-full">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="e.g. John Doe" onChange={handleInputChange} value={formData.name} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Cake className="w-6 h-6 text-primary" />
                <div className="w-full">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" placeholder="e.g. 25" onChange={handleInputChange} value={formData.age} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <VenetianMask className="w-6 h-6 text-primary" />
                <div className="w-full">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({...prev, gender: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Trophy className="w-6 h-6 text-primary" />
                <div className="w-full">
                  <Label htmlFor="sport">Primary Sport</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({...prev, sport: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="kabaddi">Kabaddi</SelectItem>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="wrestling">Wrestling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )
      case 2:
        // Placeholder for the next step
        return <div>Step 2</div>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <GlassCard className="w-full max-w-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-headline font-bold">Setup Your Profile</h1>
          <div className="text-sm font-bold text-primary">Step {step} of 4</div>
        </div>

        {renderStep()}

        <div className="flex justify-end mt-12">
          {step === 1 ? (
            <GlassButton onClick={handleNext} className="group">
              Next <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
          ) : (
            <GlassButton onClick={handleSubmit} className="group">
              Finish <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

export default OnboardingPage
