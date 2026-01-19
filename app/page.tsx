"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

// --- COMPONENT IMPORTS ---
import AuthPage from '@/components/AuthPage'
import CreatePost from '@/components/CreatePost'
import ProfileSheet from '@/components/ProfileSheet'
import ChatSheet from '@/components/ChatSheet'
import NotificationBell from '@/components/NotificationBell'
import ShortsFeed from '@/components/ShortsFeed'
import StoriesFeed from '@/components/StoriesFeed'
import GroupsFeed from '@/components/GroupsFeed'
import EventsFeed from '@/components/EventsFeed'
import MallFeed from '@/components/Mallfeed'
import LiveDashboard from '@/components/LiveDashboard'
import CallOverlay from '@/components/CallOverlay'
import SettingsPanel from '@/components/SettingsPanel'
import { IncomingRequests, SidebarChatWidget, SuggestedFriends } from '@/components/FriendWidgets'
import ChatDashboard from '@/components/ChatDashboard'

import {
  Home, Users, Zap, Calendar, ShoppingBag,
  Search, MessageSquare, Settings, LogOut,
  Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Film, 
  MapPin, User, Globe, Hash, Lock, Send, Image as ImageIcon, 
  Loader2, MoreVertical, Phone, Video, CheckCircle2, ArrowRight, 
  ChevronLeft, Camera, Upload, Facebook, Check, X,
  Trash2
} from "lucide-react"
import ReactionDock from '@/components/ReactionDock'

// --- BACKGROUND ART COMPONENT (NEW) ---
function BackgroundArt() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Top Right Gold Orb */}
            <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-yellow-400/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow" />
            
            {/* Bottom Left Warm Glow */}
            <div className="absolute -bottom-[10%] -left-[5%] w-[500px] h-[500px] bg-yellow-400/70 rounded-full blur-[120px] mix-blend-multiply" />
            
            {/* Center Geometric Shape (Subtle Polygon) */}
            <svg className="absolute top-1/3 left-1/4 w-[800px] h-[800px] text-yellow-500/5 animate-spin-slower" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.1C93.5,9,82.2,22.3,71.2,33.5C60.2,44.7,49.5,53.8,37.8,61.8C26.1,69.8,13.4,76.7,0.3,76.2C-12.8,75.7,-25.3,67.8,-36.4,59.3C-47.5,50.8,-57.2,41.7,-65.3,30.8C-73.4,19.9,-79.9,7.2,-80.6,-5.9C-81.3,-19,-76.2,-32.5,-67.2,-43.3C-58.2,-54.1,-45.3,-62.2,-32.1,-69.9C-18.9,-77.6,-5.4,-84.9,4.4,-92.5L14.2,-100.1" transform="translate(100 100)" />
            </svg>
            
            {/* Floating Small Circles */}
            <div className="absolute top-[20%] left-[10%] w-24 h-24 border-4 border-yellow-200/80 rounded-full" />
            <div className="absolute bottom-[30%] right-[15%] w-16 h-16 bg-yellow-300/20 rounded-full blur-xl" />
        </div>
    )
}

// --- LOGO COMPONENT ---
function AppLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
    const scales = { sm: "scale-75", md: "scale-100", lg: "scale-125", xl: "scale-150" }
    return (
        <div className={`flex items-center gap-3 ${scales[size]} origin-left select-none`}>
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-yellow-400 rounded-full rounded-tr-none rotate-45 shadow-[0_0_15px_rgba(250,204,21,0.3)]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
            </div>
            <div className="leading-none">
                <span className="block text-[10px] text-zinc-400 font-serif tracking-[0.2em] uppercase">famiglia</span>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 tracking-wide drop-shadow-sm">ORO</span>
                    <div className="bg-gradient-to-br from-zinc-700 to-zinc-900 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] border border-yellow-500/20">CS</div>
                </div>
                <span className="block text-[9px] text-zinc-500 font-medium tracking-tighter">Golden Family Creator Suite</span>
            </div>
        </div>
    )
}

// --- PROFILE REMINDER MODAL ---
function ProfileReminder({ onComplete, onSkip }: { onComplete: () => void, onSkip: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-300">
                <button onClick={onSkip} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5"/></button>
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-yellow-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-zinc-900 mb-2">Complete Your Profile</h2>
                <p className="text-center text-zinc-500 text-sm mb-8 leading-relaxed">
                    You haven't finished setting up your profile yet. Complete it now to get recognized by the community and access all features.
                </p>
                <div className="space-y-3">
                    <Button onClick={onComplete} className="w-full h-12 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold">Continue Setup</Button>
                    <Button variant="ghost" onClick={onSkip} className="w-full h-12 rounded-xl text-zinc-500 hover:text-zinc-900">Skip for Now</Button>
                </div>
            </div>
        </div>
    )
}

// --- PROFILE SETUP WIZARD ---
// --- PROFILE SETUP WIZARD (Fixed Type Error) ---
function ProfileSetup({ session, onComplete, onSkip }: { session: any, onComplete: () => void, onSkip?: () => void }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    
    // FIX: Ensure avatarFile is strictly File | null. Do not put a string URL here.
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        bio: '', 
        age: '', 
        gender: '',
        goals: [] as string[], 
        profession: '', 
        acceptedTos: false,
        avatarFile: null as File | null 
    })

    const goalsList = ["Enhance my Skills", "Join a Club", "Pursuit a Career/Skill", "Start a Business", "Promote My Brand", "Network"]
    const professionList = ["Content Creators", "Filmmakers", "Beta Club", "Small Business", "Educator", "Student", "Music Artist", "Non Profit", "TV Network", "Social User"]

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)
    const toggleGoal = (goal: string) => { setFormData(prev => prev.goals.includes(goal) ? { ...prev, goals: prev.goals.filter(g => g !== goal) } : { ...prev, goals: [...prev.goals, goal] }) }

    const handleFinalSubmit = async () => {
        setLoading(true)
        try {
            let avatarUrl = session.user.user_metadata.avatar_url
            
            // Only upload if a NEW file was selected
            if (formData.avatarFile) {
                const fileName = `avatars/${session.user.id}_${Date.now()}`
                await supabase.storage.from('uploads').upload(fileName, formData.avatarFile)
                const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
                avatarUrl = data.publicUrl
            }

            await supabase.from('profiles').update({
                first_name: formData.firstName, 
                last_name: formData.lastName, 
                bio: formData.bio,
                age: parseInt(formData.age), 
                gender: formData.gender, 
                goals: formData.goals,
                profession: formData.profession, 
                accepted_tos: true, 
                is_onboarded: true,
                avatar_url: avatarUrl
            }).eq('id', session.user.id)
            
            setTimeout(() => { setLoading(false); onComplete() }, 2000)
        } catch (error) { 
            console.error(error); 
            alert("Error saving profile"); 
            setLoading(false) 
        }
    }

    // Helper to determine which image to show
    const getDisplayImage = () => {
        if (formData.avatarFile) {
            // If user picked a new file, show preview
            return URL.createObjectURL(formData.avatarFile)
        }
        // Otherwise show existing avatar from session, or null
        return session.user.user_metadata.avatar_url || null
    }

    useEffect(() => {
        if (step === 8) { const timer = setTimeout(() => { handleFinalSubmit() }, 100); return () => clearTimeout(timer) }
    }, [step])

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative border border-yellow-500/20">
                <div className="p-6 flex items-center justify-between border-b border-zinc-50">
                    {step > 1 ? <button onClick={handleBack}><ChevronLeft className="w-6 h-6 text-zinc-400 hover:text-zinc-900"/></button> : <div className="w-6"/>}
                    <div className="flex-1 flex justify-center"><AppLogo size="sm"/></div>
                    {onSkip && step === 1 ? <button onClick={onSkip} className="text-xs text-zinc-400">Skip</button> : <div className="w-6"/>}
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {step === 1 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h2 className="text-2xl font-bold text-center">Profile</h2><p className="text-center text-zinc-500 text-sm mb-4">Create a profile name and bio</p><div className="grid grid-cols-2 gap-4"><Input placeholder="First Name" className="bg-zinc-100 border-none h-12 rounded-xl" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /><Input placeholder="Last Name" className="bg-zinc-100 border-none h-12 rounded-xl" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div><div><label className="text-xs font-bold text-zinc-400 uppercase ml-1 mb-2 block">Bio</label><Textarea placeholder="Create a short bio..." className="bg-zinc-800 text-white border-none h-32 rounded-xl resize-none placeholder:text-zinc-500" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div></div>)}
                    {step === 2 && (<div className="space-y-10 animate-in slide-in-from-right duration-300 text-center flex flex-col justify-center h-full pb-20"><h2 className="text-4xl font-black text-zinc-900">My age is</h2><div className="h-40 flex items-center justify-center relative"><Input type="number" className="text-8xl font-black text-center border-none bg-transparent focus-visible:ring-0 w-60 h-32 text-yellow-500 placeholder:text-yellow-200/50" placeholder="00" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} autoFocus /></div><span className="text-zinc-400 font-bold tracking-widest uppercase">Years Old</span></div>)}
                    {step === 3 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h2 className="text-2xl font-bold text-center">I am a</h2><div className="grid grid-cols-2 gap-4">{['Man', 'Woman', 'LGBTQIA+', 'Non-binary'].map((g) => (<button key={g} onClick={() => setFormData({...formData, gender: g})} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${formData.gender === g ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-100 hover:border-yellow-200'}`}><User className={`w-8 h-8 mb-2 ${formData.gender === g ? 'text-yellow-600' : 'text-zinc-400'}`} /><span className={`font-bold ${formData.gender === g ? 'text-zinc-900' : 'text-zinc-500'}`}>{g}</span></button>))}</div></div>)}
                    {step === 4 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h2 className="text-xl font-bold text-center leading-tight">What you need <br/> Famiglia Doro TV <br/> Creator Suite for</h2><div className="space-y-3">{goalsList.map((goal) => (<button key={goal} onClick={() => toggleGoal(goal)} className={`w-full py-4 rounded-xl font-medium text-sm transition-all ${formData.goals.includes(goal) ? 'bg-zinc-800 text-white shadow-lg' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>{goal}</button>))}</div></div>)}
                    {step === 5 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h2 className="text-xl font-bold text-center">Profession / Pursuit / Clubs</h2><div className="space-y-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">{professionList.map((prof) => (<button key={prof} onClick={() => setFormData({...formData, profession: prof})} className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all ${formData.profession === prof ? 'bg-zinc-800 text-white shadow-lg' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{prof}</button>))}</div></div>)}
                    {step === 6 && (<div className="space-y-4 animate-in slide-in-from-right duration-300 flex flex-col h-full"><h2 className="text-xl font-bold text-center">Terms of Service</h2><div className="bg-zinc-50 p-4 rounded-xl text-xs text-zinc-500 leading-relaxed flex-1 overflow-y-auto border border-zinc-100 text-justify"><p className="mb-2"><strong>Famiglia Doro Creator Suite TERMS AND CONDITIONS</strong></p><p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions...</p></div><div className="flex items-center space-x-2 pt-2"><Checkbox id="terms" checked={formData.acceptedTos} onCheckedChange={(c) => setFormData({...formData, acceptedTos: c as boolean})} /><label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">I accept the terms and conditions</label></div></div>)}
                    
                    {/* STEP 7: IMAGE UPLOAD (FIXED) */}
                    {step === 7 && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300 flex flex-col items-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-zinc-100 border-4 border-yellow-400 overflow-hidden flex items-center justify-center">
                                    {getDisplayImage() ? (
                                        <img src={getDisplayImage()} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-zinc-300" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-zinc-900 p-2 rounded-full text-white cursor-pointer"><Camera className="w-4 h-4"/></div>
                            </div>
                            <h2 className="text-2xl font-bold text-center">Add your photo</h2>
                            <div className="w-full space-y-3">
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                        onChange={(e) => setFormData({...formData, avatarFile: e.target.files?.[0] || null})} 
                                    />
                                    <Button className="w-full h-12 bg-zinc-900 hover:bg-black text-white rounded-xl">
                                        <Camera className="w-4 h-4 mr-2"/> Upload Photo
                                    </Button>
                                </div>
                                <Button variant="outline" className="w-full h-12 rounded-xl">
                                    <Facebook className="w-4 h-4 mr-2 text-blue-600"/> Import from Facebook
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 8 && (<div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-500"><div className="relative w-40 h-40 flex items-center justify-center"><div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div><div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div><img src={session.user.user_metadata.avatar_url} className="w-20 h-20 rounded-full opacity-50" /></div><h2 className="text-4xl font-black mt-8">50%</h2><p className="text-zinc-500 font-medium">Creating Profile...</p></div>)}
                </div>
                {step < 8 && (<div className="p-6 bg-white border-t border-zinc-50"><Button onClick={step === 7 ? () => setStep(8) : handleNext} disabled={(step === 1 && (!formData.firstName || !formData.lastName)) || (step === 2 && !formData.age) || (step === 6 && !formData.acceptedTos)} className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold rounded-2xl text-lg shadow-lg shadow-yellow-200/50">{step === 7 ? "Complete Profile" : "Continue"}</Button>{step === 7 && <button onClick={() => setStep(8)} className="w-full text-center text-zinc-400 text-xs mt-3 hover:text-zinc-600">Skip for now</button>}</div>)}
            </div>
        </div>
    )
}

// --- INTRO SEQUENCE ---
function IntroSequence({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0)
    const slides = [
        { title: "Creator Suite", desc: "Take your skillset to the next level with our comprehensive suite of professional tools designed for the modern creator economy.", icon: "🎨" },
        { title: "Live Chat", desc: "Create seamless group chats and connect instantly. Our real-time messaging platform ensures you never miss a beat.", icon: "💬" },
        { title: "TV Streaming", desc: "The ultimate hub for Famiglia Doro TV content. Stream exclusive shows, live events, and community broadcasts in one place.", icon: "📺" },
        { title: "Social Network", desc: "A bot-free sanctuary. Socialize, network, and build genuine connections with verified members of the Golden Family.", icon: "🤝" },
        { title: "Coming Soon", desc: "This is just the beginning. We are constantly evolving to bring you the future of digital interaction.", icon: "🚀" }
    ]
    const handleNext = () => { if (step < slides.length - 1) setStep(step + 1); else onComplete(); }

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]" /><div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" /></div>
            <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in zoom-in-95 duration-500 border border-zinc-100">
                <div className="md:w-5/12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 relative flex flex-col justify-between p-10 text-zinc-900 overflow-hidden">
                    <div className="relative z-10"><div className="bg-black/10 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-black/5 mb-6">FAMIGLIA ORO CS</div><h1 className="text-4xl font-serif font-bold leading-tight">Welcome to the <br/> <span className="text-white drop-shadow-md">Golden Era</span></h1></div>
                    <div className="relative z-10 flex-1 flex items-center justify-center"><div className="text-[120px] drop-shadow-2xl animate-bounce-slow">{slides[step].icon}</div></div>
                    <div className="relative z-10 text-xs font-medium opacity-60">© 2026 Famiglia Doro Inc.</div>
                </div>
                <div className="md:w-7/12 p-10 md:p-14 flex flex-col justify-between bg-white relative">
                    <div className="flex justify-between items-center mb-8"><div className="flex gap-2">{slides.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-zinc-900' : 'w-2 bg-zinc-200'}`}/>))}</div><button onClick={onComplete} className="text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors">Skip Intro</button></div>
                    <div className="flex-1 flex flex-col justify-center"><span className="text-yellow-600 font-bold text-sm tracking-widest uppercase mb-4 block">Step {step + 1} of {slides.length}</span><h2 className="text-4xl font-bold text-zinc-900 mb-6 tracking-tight">{slides[step].title}</h2><p className="text-lg text-zinc-500 leading-relaxed max-w-md">{slides[step].desc}</p></div>
                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-zinc-50"><button onClick={() => setStep(Math.max(0, step - 1))} className={`flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-opacity ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}><ChevronLeft className="w-5 h-5"/> Back</button><button onClick={handleNext} className="group flex items-center gap-3 bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-zinc-200 hover:shadow-2xl hover:scale-[1.02]">{step === slides.length - 1 ? "Get Started" : "Continue"}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-yellow-400" /></button></div>
                </div>
            </div>
        </div>
    )
}

// --- VIDEO PLAYER HELPER ---


// ADD THIS ABOVE YOUR RealPostsFeed FUNCTION
function CustomVideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    const togglePlay = () => { 
        if (!videoRef.current) return; 
        if (isPlaying) { 
            videoRef.current.pause(); 
            setIsPlaying(false) 
        } else { 
            videoRef.current.play(); 
            setIsPlaying(true) 
        } 
    }

    return (
        <div className="relative w-full flex justify-center bg-black cursor-pointer group" onClick={togglePlay}>
            <video ref={videoRef} src={src} className="max-h-[500px] w-full object-contain" loop playsInline muted={isMuted} />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white">
                        <Play className="w-8 h-8 fill-current" />
                    </div>
                </div>
            )}
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if(videoRef.current){ 
                        videoRef.current.muted = !isMuted; 
                        setIsMuted(!isMuted) 
                    }
                }} 
                className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
                {isMuted ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
            </button>
        </div>
    )
}
// --- REAL POSTS FEED ---
// --- REAL POSTS FEED (With Delete & Time Ago) ---
// ADD this inside your Page.tsx or wherever RealPostsFeed is defined

// Inside src/app/page.tsx

// Inside src/app/page.tsx

function RealPostsFeed({ session }: { session: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')

  const formatTimeAgo = (date: string) => {
      const d = new Date(date); const now = new Date();
      const diff = (now.getTime() - d.getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      return d.toLocaleDateString();
  }

  const handleShare = async (post: any) => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
        try { await navigator.share({ title: `Post by ${post.profiles?.username}`, url }) } catch (e) { console.log('Share canceled') }
    } else {
        navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
    }
  }

  // --- NEW: Handle Reaction Save ---
  const handleReaction = async (emoji: string, postId: number) => {
      // Optimistic UI: The animation plays in ReactionDock, we just save to DB here
      const { error } = await supabase.from('post_reactions').insert({
          post_id: postId,
          user_id: session.user.id,
          emoji: emoji
      })
      if (error) console.error('Error reacting:', error)
  }

  useEffect(() => {
    fetchPosts()
    const channel = supabase.channel('posts_feed').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPosts() {
    const { data } = await supabase.from('posts').select(`*, profiles(username, avatar_url), post_likes(user_id), post_comments(count)`).order('created_at', { ascending: false })
    if (data) setPosts(data.map(p => ({ ...p, isLiked: p.post_likes.some((l: any) => l.user_id === session.user.id), likeCount: p.post_likes.length, commentCount: p.post_comments[0].count })))
  }

  const handleDeletePost = async (postId: number) => {
      if(!confirm("Are you sure you want to delete this post?")) return
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleLike = async (post: any) => {
    const isLiked = post.isLiked
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !isLiked, likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p))
    if (isLiked) await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: session.user.id })
    else await supabase.from('post_likes').insert({ post_id: post.id, user_id: session.user.id })
  }

  const toggleComments = async (postId: number) => {
    if (expandedPostId === postId) setExpandedPostId(null)
    else {
        setExpandedPostId(postId)
        const { data } = await supabase.from('post_comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true })
        if(data) setComments(data)
    }
  }

  const handleComment = async (post: any) => {
      if (!commentText.trim()) return
      const { data } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: session.user.id, content: commentText }).select('*, profiles(username, avatar_url)').single()
      if (data) setComments(prev => [...prev, data])
      setCommentText(''); setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden relative group">
          <div className="flex items-center gap-3 p-5">
              <Avatar><AvatarImage src={post.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
              <div><span className="font-bold text-sm block">{post.profiles?.username}</span><span className="text-xs text-zinc-400 flex items-center gap-1">{formatTimeAgo(post.created_at)}</span></div>
              {session.user.id === post.user_id && <button onClick={() => handleDeletePost(post.id)} className="absolute top-5 right-5 text-zinc-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>}
          </div>
          <div className="px-5 pb-3"><p className="text-zinc-700">{post.content}</p></div>
          {post.media_url && <div className="w-full bg-black flex justify-center">{post.media_type === 'video' ? <CustomVideoPlayer src={post.media_url} /> : <img src={post.media_url} className="max-h-[500px] object-contain" />}</div>}
          
          {/* REACTION DOCK - SAVES TO DB */}
          <div className="px-4 pb-2">
              <ReactionDock onReact={(emoji) => handleReaction(emoji, post.id)} variant="inline" />
          </div>

          <div className="px-5 py-4 border-t border-zinc-50 flex justify-between">
              <div className="flex gap-4">
                  <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-sm font-medium ${post.isLiked ? 'text-red-500' : 'text-zinc-500'}`}><Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} /> {post.likeCount}</button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-zinc-500 text-sm font-medium"><MessageCircle className="h-5 w-5" /> {post.commentCount}</button>
              </div>
              <button onClick={() => handleShare(post)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><Share2 className="h-5 w-5" /></button>
          </div>
          {expandedPostId === post.id && (
              <div className="bg-zinc-50 p-4 border-t border-zinc-100">
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {comments.map(c => (<div key={c.id} className="flex gap-2"><Avatar className="h-6 w-6"><AvatarImage src={c.profiles?.avatar_url}/></Avatar><div className="bg-white p-2 rounded-xl text-xs shadow-sm"><span className="font-bold mr-1">{c.profiles?.username}</span>{c.content}</div></div>))}
                  </div>
                  <div className="flex gap-2"><input className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment(post)} /><Button size="sm" onClick={() => handleComment(post)} className="rounded-full bg-zinc-900 text-white hover:bg-black">Post</Button></div>
              </div>
          )}
        </div>
      ))}
    </div>
  )
}
// --- MAIN PAGE COMPONENT ---
export default function Page() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("feed")
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ products: any[], events: any[], people: any[], groups: any[] }>({ products: [], events: [], people: [], groups: [] })
  const [showDropdown, setShowDropdown] = useState(false)
  
  // FLOW STATES
  const [showIntro, setShowIntro] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false) // <--- NEW STATE

  // CHAT & CALL STATES
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatReceiver, setChatReceiver] = useState<any>(null)
  const [chatGroup, setChatGroup] = useState<any>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const [activeCall, setActiveCall] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)

  const refreshSession = async () => {
      // Force refresh of the session from Supabase
      const { data } = await supabase.auth.refreshSession()
      if (data.session) {
          setSession(data.session) // Now it can find 'setSession'
      }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session) {
            setSession(session)
            checkOnboarding(session)
            
            // Listen for Incoming Calls
            const myChannel = supabase.channel(`user_presence_${session.user.id}`)
            myChannel.on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
                if (!activeCall) setIncomingCall(payload) // Only show if not busy
            }).subscribe()
        } else {
            setLoading(false)
        }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session) checkOnboarding(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkOnboarding = async (session: any) => {
      const { data } = await supabase.from('profiles').select('is_onboarded').eq('id', session.user.id).single()
      if (data && !data.is_onboarded) {
          const createdAt = new Date(session.user.created_at).getTime()
          const now = new Date().getTime()
          const diffMinutes = (now - createdAt) / 1000 / 60
          if (diffMinutes < 5) setShowIntro(true)
          else setShowReminder(true)
      }
      setLoading(false)
  }

  // SEARCH LOGIC
  useEffect(() => {
      if (globalSearch.length < 2) { setSearchResults({ products: [], events: [], people: [], groups: [] }); setShowDropdown(false); return }
      const fetchResults = async () => {
          const q = `%${globalSearch}%`
          const [products, events, people, groups] = await Promise.all([
              supabase.from('products').select('id, name, image_url, price').ilike('name', q).limit(3),
              supabase.from('events').select('id, title, image_url, date:start_date').ilike('title', q).limit(3),
              supabase.from('profiles').select('id, username, avatar_url').ilike('username', q).limit(3),
              supabase.from('groups').select('id, name, image_url').ilike('name', q).limit(3)
          ])
          if (products.data || events.data || people.data || groups.data) {
              setSearchResults({ products: products.data || [], events: events.data || [], people: people.data || [], groups: groups.data || [] })
              setShowDropdown(true)
          }
      }
      const timer = setTimeout(fetchResults, 300)
      return () => clearTimeout(timer)
  }, [globalSearch])

  const handleSearchResultClick = (type: string, item: any) => {
      setShowDropdown(false); setGlobalSearch(item.name || item.title || item.username)
      if (type === 'product') setActiveTab('mall')
      else if (type === 'event') setActiveTab('events')
      else if (type === 'person') openPrivateChat(item)
      else if (type === 'group') setActiveTab('groups')
  }

  // CALL HANDLERS
  const startCall = (target: any, isVideo: boolean) => {
      const callId = `${session.user.id}_${target.id}_${Date.now()}`
      setActiveCall({ id: callId, target, isCaller: true, isVideo })
      supabase.channel(`user_presence_${target.id}`).send({ type: 'broadcast', event: 'incoming_call', payload: { senderId: session.user.id, senderName: session.user.user_metadata?.username || 'User', senderAvatar: session.user.user_metadata?.avatar_url, callId: callId, isVideo } })
  }

  const answerCall = () => {
      if (!incomingCall) return
      setActiveCall({ id: incomingCall.callId, target: { id: incomingCall.senderId, username: incomingCall.senderName, avatar_url: incomingCall.senderAvatar }, isCaller: false, isVideo: incomingCall.isVideo })
      setIncomingCall(null)
  }

  const rejectCall = () => setIncomingCall(null)

  const handleLogout = async () => {
      await supabase.auth.signOut()
      window.location.reload()
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-400 animate-pulse">Loading App...</div>
  if (!session) return <AuthPage onLogin={() => {}} />

  if(showIntro) return <IntroSequence onComplete={() => { setShowIntro(false); setShowProfileSetup(true) }} />
  if(showProfileSetup) return <ProfileSetup session={session} onComplete={() => setShowProfileSetup(false)} onSkip={showReminder ? () => setShowProfileSetup(false) : undefined} />

  const openGlobalChat = () => { setChatGroup(null); setChatReceiver(null); setIsChatOpen(true) }
  const openGroupChat = (group: any) => { setChatGroup(group); setChatReceiver(null); setIsChatOpen(true) }
  const openPrivateChat = (targetUser: any) => { setChatReceiver(targetUser); setChatGroup(null); setIsChatOpen(true) }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-yellow-100 relative">
      
      {/* BACKGROUND ART (Fixed Layer) */}
      <BackgroundArt />

      {showReminder && <ProfileReminder onComplete={() => { setShowReminder(false); setShowProfileSetup(true) }} onSkip={() => setShowReminder(false)} />}
      
      {/* SETTINGS PANEL OVERLAY */}
      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} onLogout={handleLogout} />}

      {/* INCOMING CALL MODAL */}
      {incomingCall && (
          <div className="fixed top-4 right-4 z-[300] bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 border border-yellow-500/30">
              <Avatar className="h-12 w-12 border-2 border-yellow-400"><AvatarImage src={incomingCall.senderAvatar} /><AvatarFallback>C</AvatarFallback></Avatar>
              <div><p className="font-bold text-lg">{incomingCall.senderName}</p><p className="text-xs text-zinc-400 flex items-center gap-1">{incomingCall.isVideo ? <Video className="w-3 h-3"/> : <Phone className="w-3 h-3"/>} Incoming Call...</p></div>
              <div className="flex gap-2 ml-4"><Button size="icon" onClick={rejectCall} className="rounded-full bg-red-500 hover:bg-red-600"><Phone className="w-5 h-5 rotate-[135deg]"/></Button><Button size="icon" onClick={answerCall} className="rounded-full bg-green-500 hover:bg-green-600 animate-pulse"><Phone className="w-5 h-5"/></Button></div>
          </div>
      )}

      {/* ACTIVE CALL OVERLAY */}
      {activeCall && <CallOverlay session={session} activeCall={activeCall} onEndCall={() => setActiveCall(null)} />}

      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}><AppLogo /></div>
          <div className="hidden md:flex max-w-md flex-1 items-center px-8 relative">
            <div className="relative w-full z-50">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input placeholder="Search products, people, events..." className="w-full rounded-full bg-zinc-100 py-2 pl-10 pr-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onFocus={() => globalSearch.length > 1 && setShowDropdown(true)} />
              {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      {searchResults.products.length > 0 && <div className="p-2"><h4 className="px-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Marketplace</h4>{searchResults.products.map(p => (<div key={p.id} onClick={() => handleSearchResultClick('product', p)} className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl cursor-pointer"><img src={p.image_url} className="w-8 h-8 rounded-lg object-cover bg-zinc-100" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-zinc-900 truncate">{p.name}</p><p className="text-xs text-yellow-600 font-bold">${p.price}</p></div></div>))}</div>}
                      {searchResults.people.length > 0 && <div className="p-2 border-t border-zinc-50"><h4 className="px-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">People</h4>{searchResults.people.map(p => (<div key={p.id} onClick={() => handleSearchResultClick('person', p)} className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl cursor-pointer"><Avatar className="h-8 w-8"><AvatarImage src={p.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar><div><p className="text-sm font-bold text-zinc-900">{p.username}</p></div></div>))}</div>}
                      {searchResults.events.length > 0 && <div className="p-2 border-t border-zinc-50"><h4 className="px-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Events</h4>{searchResults.events.map(e => (<div key={e.id} onClick={() => handleSearchResultClick('event', e)} className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl cursor-pointer"><div className="h-8 w-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center"><Calendar className="w-4 h-4"/></div><div><p className="text-sm font-bold text-zinc-900">{e.title}</p><p className="text-xs text-zinc-400">{e.date}</p></div></div>))}</div>}
                      {searchResults.products.length === 0 && searchResults.people.length === 0 && searchResults.events.length === 0 && <div className="p-4 text-center text-sm text-zinc-400">No results found.</div>}
                  </div>
              )}
            </div>
            {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}
          </div>
          <div className="flex items-center gap-2"><NotificationBell userId={session.user.id} /><Button variant="ghost" size="icon" onClick={openGlobalChat} className="text-zinc-500 hover:bg-zinc-100 hover:text-yellow-600 rounded-full"><MessageSquare className="h-5 w-5" /></Button><div className="ml-2 h-8 w-px bg-zinc-200"></div><Avatar className="ml-2 h-9 w-9 cursor-pointer ring-2 ring-white shadow-sm hover:ring-yellow-200 transition-all" onClick={() => setIsProfileOpen(true)}><AvatarImage src={session.user.user_metadata?.avatar_url} /><AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">{session.user.email?.[0].toUpperCase()}</AvatarFallback></Avatar></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          <aside className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24 space-y-1">
              <NavItem icon={<Home />} label="Home Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
              <NavItem icon={<MessageSquare />} label="Messages" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <NavItem icon={<Film />} label="Shorts" active={activeTab === 'shorts'} onClick={() => setActiveTab('shorts')} />
              <NavItem icon={<Users />} label="Communities" active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
              <NavItem icon={<Zap />} label="Live" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
              <NavItem icon={<Calendar />} label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
              <NavItem icon={<ShoppingBag />} label="Marketplace" active={activeTab === 'mall'} onClick={() => setActiveTab('mall')} />
              <div className="pt-8"><h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Settings</h3><div className="mt-2 space-y-1"><NavItem icon={<Settings />} label="Preferences" onClick={() => setIsSettingsOpen(true)} /><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-5 w-5" /> Logout</button></div></div>
            </nav>
          </aside>

          {/* DYNAMIC LAYOUT: Full Width if Chat, else 6 cols */}
          <main className={activeTab === 'chat' ? "lg:col-span-9" : "lg:col-span-6 space-y-6"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {activeTab !== 'chat' && (
                  <TabsList className="w-full bg-white p-1 rounded-2xl shadow-sm border border-zinc-100 h-14 grid grid-cols-6 mb-6 overflow-x-auto">
                    <TabsTrigger value="feed">Feed</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                    <TabsTrigger value="live">Live</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="mall">Mall</TabsTrigger>
                  </TabsList>
              )}

              <TabsContent value="feed" className="space-y-6 focus-visible:outline-none"><StoriesFeed user={session.user} /><CreatePost user_id={session.user.id} /><RealPostsFeed session={session} /></TabsContent>
              <TabsContent value="shorts"><ShortsFeed session={session} /></TabsContent>
              <TabsContent value="groups"><GroupsFeed session={session} onChat={openGroupChat} /></TabsContent>
              <TabsContent value="live"><LiveDashboard session={session} /></TabsContent>
              <TabsContent value="events"><EventsFeed user={session.user} /></TabsContent>
              <TabsContent value="mall"><MallFeed session={session} onChat={openPrivateChat} globalSearch={globalSearch} /></TabsContent>
              <TabsContent value="chat"><ChatDashboard session={session} onCall={startCall} /></TabsContent>
            </Tabs>
          </main>

          {/* RIGHT SIDEBAR (Hidden if Chat) */}
          {activeTab !== 'chat' && (
            <aside className="hidden lg:block lg:col-span-3 space-y-6">
              <IncomingRequests session={session} />
              <SidebarChatWidget session={session} onChat={openPrivateChat} />
              <SuggestedFriends session={session} />
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100"><h3 className="font-bold text-zinc-900 mb-4">Trending Topics</h3><div className="space-y-3">{['#FamigliaDoro', '#GoldStandard', '#CreatorEconomy'].map((tag) => (<div key={tag} className="flex justify-between items-center group cursor-pointer"><span className="text-sm text-zinc-600 group-hover:text-yellow-600 transition-colors">{tag}</span><span className="text-xs text-zinc-400">2.5k posts</span></div>))}</div></div>
            </aside>
          )}
        </div>
      </div>

      <ChatSheet isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} session={session} receiver={chatReceiver} group={chatGroup} onCall={startCall} />
<ProfileSheet 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        session={session}
        onProfileUpdate={refreshSession}  // <--- ADD THIS PROP
    />    </div>
  )

  
}

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-zinc-900 text-yellow-400 shadow-lg shadow-zinc-300' : 'text-zinc-600 hover:bg-white hover:text-yellow-600 hover:shadow-sm'}`}><div className={`h-5 w-5 ${active ? 'text-yellow-400' : 'text-zinc-400'}`}>{icon}</div>{label}</button>
}

// const refreshSession = async () => {
//       // Force refresh of the session from Supabase
//       const { data } = await supabase.auth.refreshSession()
//       if (data.session) {
//           setSession(data.session)
//       }
//   }