
"use client"

import { useState, useEffect } from "react"
import { 
    ExternalLink, Video, Palette, Map, Globe, Shield, Box, 
    LayoutGrid, X, Maximize, Tv, Film, School, Award, 
    Cpu, Bot, HeartHandshake, Briefcase, DollarSign, 
    Music, Mic, Trophy, HelpCircle, Gamepad2, Navigation, 
    CheckCircle2, Coins, Disc, Headphones, Activity, Search,
    Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase" 
import SubscriptionPlans from "./SubscriptionPlan"

const TIER_LEVELS: Record<string, number> = {
    'free_trial': 1, 'mid_student': 2, 'hs_student': 3,
    'college_student': 4, 'verified_user': 5, 'gold': 6, 'platinum': 7
}

const SUITE_APPS = [
    // FREE (Tier 1)
    { name: "Google", icon: <LayoutGrid className="w-6 h-6"/>, color: "bg-green-500", url: "https://google.com", embed: false, minTier: 1 },
    { name: "Save Schools", icon: <School className="w-6 h-6"/>, color: "bg-black", url: "#", embed: true, minTier: 1 },
    { name: "Beta Club", icon: <Award className="w-6 h-6"/>, color: "bg-black border border-yellow-500", url: "https://www.betaclub.org", embed: true, minTier: 1 },
    { name: "Youth Lab", icon: <span className="font-bold">YL</span>, color: "bg-blue-900", url: "#", embed: true, minTier: 1 },

    // MID STUDENT (Tier 2)
    { name: "Canva", icon: <Palette className="w-6 h-6"/>, color: "bg-cyan-500", url: "https://www.canva.com", embed: false, minTier: 2 },
    { name: "Zoom", icon: <Video className="w-6 h-6"/>, color: "bg-blue-500", url: "https://zoom.us", embed: false, minTier: 2 },
    
    // HS STUDENT (Tier 3)
    { name: "Adobe", icon: <span className="font-bold text-lg">Ae</span>, color: "bg-red-600", url: "https://www.adobe.com", embed: false, minTier: 3 },
    { name: "Submit Film", icon: <Film className="w-6 h-6"/>, color: "bg-yellow-500 text-black", url: "#", embed: false, minTier: 3 },

    // COLLEGE (Tier 4)
    { name: "AI Suite", icon: <Bot className="w-6 h-6"/>, color: "bg-zinc-900 border border-yellow-500/50", url: "#", embed: false, minTier: 4 },
    { name: "Small Biz", icon: <Briefcase className="w-6 h-6"/>, color: "bg-yellow-400 text-black", url: "#", embed: false, minTier: 4 },

    // VERIFIED (Tier 5)
    { name: "Investors", icon: <DollarSign className="w-6 h-6"/>, color: "bg-zinc-200 text-black", url: "#", embed: false, minTier: 5 },
    { name: "Filmmaker", icon: <Film className="w-6 h-6"/>, color: "bg-black", url: "#", embed: false, minTier: 5 },
    { name: "TV Network", icon: <Tv className="w-6 h-6"/>, color: "bg-orange-500", url: "https://famigliadorotv.com", embed: true, minTier: 5 },
    { name: "Music Suite", icon: <Music className="w-6 h-6"/>, color: "bg-black", url: "#", embed: false, minTier: 5 },
    
    // EXTRAS
    { name: "Davis Intel", icon: <Cpu className="w-6 h-6"/>, color: "bg-black", url: "#", embed: false, minTier: 5 },
    { name: "Podcast", icon: <Mic className="w-6 h-6"/>, color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "Prize Suite", icon: <Trophy className="w-6 h-6"/>, color: "bg-zinc-900", url: "#", embed: false, minTier: 5 },
    { name: "Trivia", icon: <HelpCircle className="w-6 h-6"/>, color: "bg-yellow-500", url: "#", embed: false, minTier: 5 },
    { name: "Xtravaganza", icon: <span className="font-mono text-xs font-bold">CARD</span>, color: "bg-yellow-200 text-black", url: "#", embed: false, minTier: 5 },
    { name: "GPS", icon: <Navigation className="w-6 h-6"/>, color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "Coins", icon: <Coins className="w-6 h-6"/>, color: "bg-black border border-yellow-500", url: "#", embed: false, minTier: 5 },
    { name: "Rap Battle", icon: <Mic className="w-6 h-6"/>, color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "Balez", icon: <span className="font-serif font-bold text-xl">B</span>, color: "bg-black border border-yellow-500", url: "#", embed: false, minTier: 5 },
    { name: "Curb", icon: <span className="font-black text-sm">CURB</span>, color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "Artist", icon: <Disc className="w-6 h-6"/>, color: "bg-black", url: "#", embed: false, minTier: 5 },
    { name: "V-RAE", icon: <Headphones className="w-6 h-6"/>, color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "V-RAE Health", icon: <Activity className="w-6 h-6"/>, color: "bg-black", url: "#", embed: false, minTier: 5 },
]

export default function SuiteHub({ session }: { session: any }) {
    const [selectedApp, setSelectedApp] = useState<any>(null)
    const [showPlans, setShowPlans] = useState(false)
    const [search, setSearch] = useState("")
    const [userTierLevel, setUserTierLevel] = useState(0)

    useEffect(() => {
        const fetchTier = async () => {
            if (!session?.user) return
            const { data } = await supabase.from('profiles').select('verified_tier').eq('id', session.user.id).single()
            if (data?.verified_tier) setUserTierLevel(TIER_LEVELS[data.verified_tier] || 1)
            else setUserTierLevel(1)
        }
        fetchTier()
    }, [session])

    const handleAppClick = (app: any) => {
        if (userTierLevel < app.minTier) {
            alert(`🔒 Locked: Upgrade to Level ${app.minTier} to access.`)
            setShowPlans(true)
            return
        }
        if (app.embed) setSelectedApp(app)
        else window.open(app.url, '_blank')
    }

    const filteredApps = SUITE_APPS.filter(app => app.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 pb-20 px-2 md:px-0">
            {/* --- SEPARATE HEADER WITH VERIFY BUTTON --- */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-center text-white shadow-2xl border border-zinc-800">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
                            Creator Suite <span className="bg-zinc-800 text-sm px-2 py-1 rounded-lg text-zinc-400 font-medium">Level {userTierLevel}</span>
                        </h2>
                        <p className="text-zinc-400 text-sm max-w-md">Upgrade your badge to unlock premium tools.</p>
                    </div>
                    
                    {/* BUTTON IS HERE */}
                    <Button 
                        onClick={() => setShowPlans(true)}
                        className="h-14 px-8 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold text-lg rounded-2xl shadow-lg shadow-yellow-500/20 transform hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-6 h-6" /> Get Verified
                    </Button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input placeholder="Search Apps..." className="pl-10 h-12 rounded-2xl bg-white border-zinc-200" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* GRID */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {filteredApps.map((app) => {
                    const isLocked = userTierLevel < app.minTier;
                    return (
                        <div key={app.name} onClick={() => handleAppClick(app)} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                            <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${app.color} ${isLocked ? 'opacity-40 grayscale' : ''}`}>
                                {app.icon}
                                {isLocked && <div className="absolute -top-1 -right-1 bg-zinc-900 text-yellow-500 rounded-full p-1 border-2 border-white"><Lock className="w-3 h-3" /></div>}
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-center leading-tight text-zinc-600 line-clamp-2 w-16">{app.name}</span>
                        </div>
                    )
                })}
            </div>

            <SubscriptionPlans isOpen={showPlans} onClose={() => setShowPlans(false)} session={session} />

            {/* Internal App Viewer */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-6xl h-[90vh] p-0 border-none bg-black flex flex-col overflow-hidden rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between p-4 bg-zinc-900 text-white border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${selectedApp?.color}`}>{selectedApp?.icon}</div>
                            <h3 className="font-bold">{selectedApp?.name}</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedApp(null)}><X className="w-5 h-5" /></Button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {selectedApp && <iframe src={selectedApp.url} className="w-full h-full border-0" title={selectedApp.name} allow="camera; microphone; geolocation; fullscreen" />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}