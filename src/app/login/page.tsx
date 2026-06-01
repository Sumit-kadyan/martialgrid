"use client"

import GlassCard from "@/components/glass/GlassCard"
import SupabaseAuth from "@/components/auth/SupabaseAuth"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <nav className="h-20 border-b border-black/5 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg neon-glow-blue flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground">MARTIAL GRID</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Explore</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Coach Dashboard</Link>
          <Link href="/portal" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Player Portal</Link>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl text-center"
        >
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-foreground mb-8 leading-tight tracking-tighter">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-body">
            Continue with your Google account to access your dashboard.
          </p>
          <div className="flex justify-center">
            <SupabaseAuth />
          </div>
        </motion.div>
      </div>
    </div>
  )
}