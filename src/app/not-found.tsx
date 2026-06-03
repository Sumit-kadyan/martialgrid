'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { Home, Flag, AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GlassCard from '@/components/glass/GlassCard'

export default function NotFoundPage() {
  const router = useRouter()
  const pathname = usePathname() // Grabs the broken URL path
  
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecking(false)
    }
    checkAuth()
  }, [])

  const handleReportIssue = async () => {
    if (!user) {
      alert("You must be logged in to report an issue.")
      return
    }

    setReporting(true)

    const { error } = await supabase
      .from('error_reports')
      .insert({
        reporter_id: user.id,
        missing_url: pathname || 'Unknown URL'
      })

    setReporting(false)

    if (!error) {
      setReported(true)
    } else {
      alert("Failed to send report. Please try again later.")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <GlassCard className="p-8 sm:p-12 text-center border-white/10 shadow-2xl flex flex-col items-center">
          
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-inner"
          >
            <AlertTriangle className="w-12 h-12 text-primary" />
          </motion.div>

          <h1 className="text-7xl sm:text-9xl font-black font-headline text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 mb-4 tracking-tighter">
            404
          </h1>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Out of Bounds</h2>
          
          <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
            The page you are looking for has been moved, deleted, or never existed in the first place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Button 
              size="lg" 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full sm:w-auto h-14 px-8 border-white/20 hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
            </Button>
            
            <Button 
              size="lg" 
              onClick={() => router.push('/dashboard/overview')} 
              className="w-full sm:w-auto h-14 px-8 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all"
            >
              <Home className="w-5 h-5 mr-2" /> Dashboard
            </Button>
          </div>

          {/* Reporting Widget */}
          <div className="mt-12 pt-8 border-t border-white/10 w-full">
            {authChecking ? (
              <div className="h-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : reported ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-green-400 font-bold bg-green-500/10 py-3 px-6 rounded-lg border border-green-500/20 w-max mx-auto"
              >
                <CheckCircle2 className="w-5 h-5" /> Issue Reported Successfully
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">Think this is a mistake? Let our engineers know.</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReportIssue}
                  disabled={reporting || !user}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  {reporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
                  {reporting ? 'Reporting...' : !user ? 'Log in to Report Broken Link' : 'Report Broken Link'}
                </Button>
              </div>
            )}
          </div>

        </GlassCard>
      </motion.div>
    </div>
  )
}