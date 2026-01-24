"use client"

import '@/lib/i18n' 
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next' 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Settings, LogOut, Home, Film, Users, Zap, Calendar, ShoppingBag, Grid, Tv, Phone, Video, Heart, Share2, MessageCircle, Play, Volume2, VolumeX, Trash2, HelpCircle, Briefcase, Gamepad2 } from "lucide-react"

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
import SuiteHub from '@/components/SuiteHub'
import TvEmbed from '@/components/TvEmbed'
import ReactionDock from '@/components/ReactionDock'
import ShareDialog from '@/components/ShareDialog' 
import AppGuide from '@/components/AppGuide'
import WebsiteTour, { TourStep } from '@/components/WebsiteTour'

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'header-left',
        title: 'Home',
        description: 'Click here anytime to return to your main feed.',
        position: 'bottom'
    },
    {
        targetId: 'global-search',
        title: 'Global Search',
        description: 'Find friends, products, events, or groups instantly from here.',
        position: 'bottom'
    },
    {
        targetId: 'nav-sidebar',
        title: 'Main Navigation',
        description: 'Navigate between your Feed, Mall, Events, TV Network, and Creator Tools here.',
        position: 'right' // <--- Set to RIGHT for left sidebar
    },
    {
        targetId: 'app-tabs',
        title: 'App Switcher',
        description: 'Quickly switch between different apps like Shorts, Groups, and Live Streaming.',
        position: 'bottom'
    },
    {
        targetId: 'right-sidebar',
        title: 'Community Hub',
        description: 'See who is online, trending topics, and friend requests.',
        position: 'left' // <--- Set to LEFT for right sidebar
    },
    {
        targetId: 'header-actions',
        title: 'Notifications & Chat',
        description: 'Stay updated with alerts and direct messages.',
        position: 'left'
    }
]


function ComingSoon({ title, icon: Icon, description }: { title: string, icon: any, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-3xl border border-zinc-100 shadow-sm text-center p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 mb-2">{title}</h2>
            <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Coming Soon</span>
            </div>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">{description}</p>
            <div className="mt-8 flex gap-2">
                {/* <Button variant="outline" className="rounded-full border-zinc-200">Notify Me</Button>
                <Button className="rounded-full bg-zinc-900 text-white">Join Waitlist</Button> */}
            </div>
        </div>
    )
}
// --- 1. VIDEO PLAYER HELPER (OUTSIDE) ---
function CustomVideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    const togglePlay = () => { 
        if (!videoRef.current) return; 
        if (isPlaying) { videoRef.current.pause(); setIsPlaying(false) } 
        else { videoRef.current.play(); setIsPlaying(true) } 
    }

    return (
        <div className="relative w-full flex justify-center bg-black cursor-pointer group" onClick={togglePlay}>
            <video ref={videoRef} src={src} className="max-h-[500px] w-full object-contain" loop playsInline muted={isMuted} />
            {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white"><Play className="w-8 h-8 fill-current" /></div></div>}
            <button onClick={(e) => { e.stopPropagation(); if(videoRef.current){ videoRef.current.muted = !isMuted; setIsMuted(!isMuted) }}} className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition">{isMuted ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}</button>
        </div>
    )
}

// --- 2. REAL POSTS FEED (OUTSIDE PAGE COMPONENT - CRITICAL FIX) ---
function RealPostsFeed({ session, onShare, deepLink ,onViewProfile }: { session: any, onShare: (post: any) => void, deepLink?: string | null,onViewProfile: (id: string) => void  }) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<any[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')

  // Scroll Logic
  useEffect(() => {
      if (!deepLink) return

      // Function to try finding and scrolling to the post
      const tryScroll = () => {
          const element = document.getElementById(`post-${deepLink}`)
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              element.classList.add('ring-4', 'ring-yellow-400', 'transition-all', 'duration-1000')
              setTimeout(() => element.classList.remove('ring-4', 'ring-yellow-400'), 2500)
              return true // Found
          }
          return false // Not found
      }

      // If post exists, scroll immediately
      if (tryScroll()) return

      // If not, fetch it specifically
      const fetchSpecificPost = async () => {
          const { data } = await supabase.from('posts').select(`*, profiles(username, avatar_url), post_likes(user_id), post_comments(count)`).eq('id', deepLink).single()
          if (data) {
              // Add to top of list
              const formatted = { ...data, isLiked: data.post_likes?.some((l: any) => l.user_id === session.user.id), likeCount: data.post_likes?.length, commentCount: data.post_comments[0].count }
              setPosts(prev => {
                  // Prevent duplicates
                  if (prev.some(p => p.id === formatted.id)) return prev
                  return [formatted, ...prev]
              })
          }
      }
      fetchSpecificPost()

      // Retry scrolling for 2 seconds (in case it's rendering)
      const interval = setInterval(() => {
          if (tryScroll()) clearInterval(interval)
      }, 500)
      
      // Cleanup interval after 3 seconds
      const timeout = setTimeout(() => clearInterval(interval), 3000)

      return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [deepLink])

  useEffect(() => {
    fetchPosts()
    const channel = supabase.channel('posts_feed').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPosts() {
    const { data } = await supabase.from('posts').select(`*, profiles(username, avatar_url), post_likes(user_id), post_comments(count)`).order('created_at', { ascending: false }).limit(20)
    if (data) setPosts(data.map(p => ({ ...p, isLiked: p.post_likes.some((l: any) => l.user_id === session.user.id), likeCount: p.post_likes.length, commentCount: p.post_comments[0].count })))
  }

  const handleDeletePost = async (postId: number) => {
      if(!confirm("Delete post?")) return
      await supabase.from('posts').delete().eq('id', postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
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
 const formatTimeAgo = (date: string) => {
      const d = new Date(date); const now = new Date();
      const diff = (now.getTime() - d.getTime()) / 1000;
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      return d.toLocaleDateString();
  }
  const handleComment = async (post: any) => {
      if (!commentText.trim()) return
      const { data } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: session.user.id, content: commentText }).select('*, profiles(username, avatar_url)').single()
      if (data) setComments(prev => [...prev, data])
      setCommentText(''); setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
  }

  const handleReaction = async (emoji: string, postId: number) => {
      await supabase.from('post_reactions').insert({ post_id: postId, user_id: session.user.id, emoji: emoji })
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden relative group scroll-mt-24">
          <div className="flex items-center gap-3 p-5">
              <Avatar onClick={() => onViewProfile(post.user_id)} className="cursor-pointer"><AvatarImage src={post.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
              <div><span className="font-bold text-sm block">{post.profiles?.username}</span><span className="text-xs text-zinc-400 flex items-center gap-1">{formatTimeAgo(post.created_at)}</span></div>
              {session.user.id === post.user_id && <button onClick={() => handleDeletePost(post.id)} className="absolute top-5 right-5 text-zinc-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>}
          </div>
          <div className="px-5 pb-3"><p className="text-zinc-700">{post.content}</p></div>
          {post.media_url && <div className="w-full bg-black flex justify-center">{post.media_type === 'video' ? <CustomVideoPlayer src={post.media_url} /> : <img src={post.media_url} className="max-h-[500px] object-contain" />}</div>}
          <div className="px-4 pb-2"><ReactionDock onReact={(emoji) => handleReaction(emoji, post.id)} variant="inline" /></div>
          <div className="px-5 py-4 border-t border-zinc-50 flex justify-between">
              <div className="flex gap-4">
                  <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-sm font-medium ${post.isLiked ? 'text-red-500' : 'text-zinc-500'}`}><Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} /> {t('post_like')}</button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-zinc-500 text-sm font-medium"><MessageCircle className="h-5 w-5" /> {t('post_comment')}</button>
              </div>
              <button onClick={() => onShare(post)} className="text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1"><Share2 className="h-5 w-5" /> {t('post_share')}</button>
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

// --- 3. BACKGROUND COMPONENTS ---
function BackgroundArt() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-yellow-400/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow" />
            <div className="absolute -bottom-[10%] -left-[5%] w-[500px] h-[500px] bg-yellow-400/70 rounded-full blur-[120px] mix-blend-multiply" />
        </div>
    )
}

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

// --- 4. MAIN PAGE COMPONENT ---
export default function Page() {
  const { t } = useTranslation()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("feed")
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any>({ products: [], events: [], people: [], groups: [] })
  const [showDropdown, setShowDropdown] = useState(false)
  
  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatReceiver, setChatReceiver] = useState<any>(null)
  const [chatGroup, setChatGroup] = useState<any>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeCall, setActiveCall] = useState<any>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [isGuideOpen, setIsGuideOpen] = useState(false) // <--- 2. GUIDE STATE
  // Inside Page() function:
const [viewProfileId, setViewProfileId] = useState<string | null>(null) // New State
  // Share & Deep Link State
  const [shareData, setShareData] = useState<{type: string, data: any} | null>(null)
  const [deepLink, setDeepLink] = useState<{type: string, id: string} | null>(null)
const [isTourOpen, setIsTourOpen] = useState(false) // <--- TOUR STATE
  const refreshSession = async () => { const { data } = await supabase.auth.refreshSession(); if (data.session) setSession(data.session) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session) {
            setSession(session)
            // Auth check logic (omitted for brevity, keep your existing logic here)
            setLoading(false)
        } else { setLoading(false) }
    })
  }, [])
const handleViewProfile = (id: string) => {
    setViewProfileId(id)
}
  const handleOpenShare = (type: string, data: any) => { setShareData({ type, data }) }
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload() }
  const startCall = (target: any, isVideo: boolean) => { /* call logic */ }
  const openGlobalChat = () => { setChatGroup(null); setChatReceiver(null); setIsChatOpen(true) }
  const openGroupChat = (group: any) => { setChatGroup(group); setChatReceiver(null); setIsChatOpen(true) }
  const openPrivateChat = (targetUser: any) => { setChatReceiver(targetUser); setChatGroup(null); setIsChatOpen(true) }

  // --- DEEP LINK NAVIGATION ---
  const handleDeepLinkNavigation = (type: string, id: string) => {
      console.log("Navigating to:", type, id)
      if (type === 'product') setActiveTab('mall')
      else if (type === 'event') setActiveTab('events')
      else if (type === 'short') setActiveTab('shorts')
      else if (type === 'post') setActiveTab('feed')
      
      setDeepLink({ type, id })
      setTimeout(() => setDeepLink(null), 3000)
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-400 animate-pulse">Loading App...</div>
  if (!session) return <AuthPage onLogin={() => {}} />

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-yellow-100 relative">
      <BackgroundArt />
{/* <FeatureTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        steps={TOUR_STEPS} 
      />    */} 
       <ShareDialog 
          isOpen={!!shareData} 
          onClose={() => setShareData(null)} 
          item={shareData} 
          session={session} 
      /> 
      <WebsiteTour 
        steps={TOUR_STEPS} 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
      />

      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} onLogout={handleLogout} />}
      {activeCall && <CallOverlay session={session} activeCall={activeCall} onEndCall={() => setActiveCall(null)} />}

      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}><AppLogo /></div>
          <div className="hidden md:flex max-w-md flex-1 items-center px-8 relative">
<div id="global-search" className="relative w-full z-50">              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input placeholder={t('search_placeholder')} className="w-full rounded-full bg-zinc-100 py-2 pl-10 pr-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
            </div>
          </div>
<div id="header-actions" className="flex items-center gap-2">            <NotificationBell userId={session.user.id} />
           <Button variant="ghost" size="icon" onClick={() => setIsTourOpen(true)} className="text-zinc-500 hover:bg-zinc-100 hover:text-yellow-600 rounded-full">
                  <HelpCircle className="h-5 w-5" />
              </Button>
            <Button variant="ghost" size="icon" onClick={openGlobalChat} className="text-zinc-500 hover:bg-zinc-100 hover:text-yellow-600 rounded-full">
                <MessageSquare className="h-5 w-5" />
                </Button><div className="ml-2 h-8 w-px bg-zinc-200"></div>
                <Avatar className="ml-2 h-9 w-9 cursor-pointer ring-2 ring-white shadow-sm hover:ring-yellow-200 transition-all" onClick={() => setIsProfileOpen(true)}><AvatarImage src={session.user.user_metadata?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
<aside id="nav-sidebar" className="hidden lg:block lg:col-span-3">            <nav className="sticky top-24 space-y-1">
              <NavItem icon={<Home />} label={t('nav_home')} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
              <NavItem icon={<MessageSquare />} label={t('nav_messages')} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <NavItem icon={<Film />} label={t('nav_shorts')} active={activeTab === 'shorts'} onClick={() => setActiveTab('shorts')} />
              <NavItem icon={<Users />} label={t('nav_groups')} active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
              <NavItem icon={<Zap />} label={t('nav_live')} active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
              <NavItem icon={<Calendar />} label={t('nav_events')} active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
              <NavItem icon={<ShoppingBag />} label={t('nav_mall')} active={activeTab === 'mall'} onClick={() => setActiveTab('mall')} />
              <NavItem icon={<Grid />} label={t('nav_suite')} active={activeTab === 'suite'} onClick={() => setActiveTab('suite')} />
              <NavItem icon={<Tv />} label={t('nav_tv')} active={activeTab === 'tv'} onClick={() => setActiveTab('tv')} />
<div className="my-4 h-px bg-zinc-200/50 mx-4"></div>
              <NavItem icon={<Briefcase />} label="Biz Networx" active={activeTab === 'biz'} onClick={() => setActiveTab('biz')} />
              <NavItem icon={<Gamepad2 />} label="Kidz HQ" active={activeTab === 'kidz'} onClick={() => setActiveTab('kidz')} />
              <div className="pt-8">
                  <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('nav_settings')}</h3>
                  <div className="mt-2 space-y-1">
                      <NavItem icon={<Settings />} label={t('nav_preferences')} onClick={() => setIsSettingsOpen(true)} />
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-5 w-5" /> {t('nav_logout')}</button>
                  </div>
              </div>
            </nav>
          </aside>

          <main className={activeTab === 'chat' ? "lg:col-span-9" : "lg:col-span-6 space-y-6"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {activeTab !== 'chat' && (
             <TabsList id="app-tabs" className="w-full bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 min-h-[3.5rem] h-auto flex flex-wrap items-center justify-center gap-2 mb-6">
                    <TabsTrigger value="feed" className="flex-1 min-w-[100px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_home')}</TabsTrigger>
                    <TabsTrigger value="shorts" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_shorts')}</TabsTrigger>
                    <TabsTrigger value="groups" className="flex-1 min-w-[100px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_groups')}</TabsTrigger>
                    <TabsTrigger value="live" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_live')}</TabsTrigger>
                    <TabsTrigger value="events" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_events')}</TabsTrigger>
                    <TabsTrigger value="mall" className="flex-1 min-w-[100px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_mall')}</TabsTrigger>
                    <TabsTrigger value="suite" className="flex-1 min-w-[100px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_suite')}</TabsTrigger>
                    <TabsTrigger value="tv" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all">{t('nav_tv')}</TabsTrigger>
                 <TabsTrigger value="biz" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Biz</TabsTrigger>
                    <TabsTrigger value="kidz" className="flex-1 min-w-[80px] data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Kidz</TabsTrigger>
                  </TabsList>
              )}

              <TabsContent value="feed" className="space-y-6 focus-visible:outline-none">
                  <StoriesFeed user={session.user} />
                  <CreatePost user_id={session.user.id} />
                  <RealPostsFeed 
                    session={session} 
                    onShare={(post) => handleOpenShare('post', post)} 
                    deepLink={deepLink?.type === 'post' ? deepLink.id : null}
                    onViewProfile={handleViewProfile}
                  />
              </TabsContent>
              
              <TabsContent value="mall">
                  <MallFeed 
                    session={session} 
                    onChat={openPrivateChat} 
                    globalSearch={globalSearch} 
                    onShare={(item) => handleOpenShare('product', item)} 
                    deepLink={deepLink?.type === 'product' ? deepLink.id : null}
                  />
              </TabsContent>

              <TabsContent value="events">
                  <EventsFeed 
                    user={session.user} 
                    onShare={(event) => handleOpenShare('event', event)} 
                    deepLink={deepLink?.type === 'event' ? deepLink.id : null}
                  />
              </TabsContent>

              <TabsContent value="shorts">
                  <ShortsFeed 
                    session={session} 
                    onShare={(short) => handleOpenShare('short', short)} 
                    deepLink={deepLink?.type === 'short' ? deepLink.id : null}
                  />
              </TabsContent>

              <TabsContent value="groups"><GroupsFeed session={session} onChat={openGroupChat} /></TabsContent>
              <TabsContent value="live"><LiveDashboard session={session} /></TabsContent>
              <TabsContent value="chat"><ChatDashboard session={session} onCall={startCall} onNavigate={handleDeepLinkNavigation}/></TabsContent>
              <TabsContent value="suite"><SuiteHub session ={session} /></TabsContent>
              <TabsContent value="tv"><TvEmbed /></TabsContent>
              <TabsContent value="biz">
                  <ComingSoon 
                    title="Biz Networx" 
                    icon={Briefcase} 
                    description="The ultimate professional network for Famiglia Oro creators. Connect with brands, find sponsorships, and manage your business portfolio." 
                  />
              </TabsContent>

              <TabsContent value="kidz">
                  <ComingSoon 
                    title="Kidz HQ" 
                    icon={Gamepad2} 
                    description="A safe, fun, and interactive space for the younger generation. Games, educational content, and family-friendly entertainment." 
                  />
              </TabsContent>
            </Tabs>
          </main>

          {activeTab !== 'chat' && (
<aside id="right-sidebar" className="hidden lg:block lg:col-span-3 space-y-6">              <IncomingRequests session={session} />
              <SidebarChatWidget session={session} onChat={openPrivateChat} />
              <SuggestedFriends session={session} onViewProfile={handleViewProfile} />
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
                  <h3 className="font-bold text-zinc-900 mb-4">{t('widget_trending')}</h3>
                  <div className="space-y-3">{['#FamigliaDoro', '#GoldStandard', '#CreatorEconomy'].map((tag) => (<div key={tag} className="flex justify-between items-center group cursor-pointer"><span className="text-sm text-zinc-600 group-hover:text-yellow-600 transition-colors">{tag}</span><span className="text-xs text-zinc-400">2.5k posts</span></div>))}</div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <ChatSheet 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        session={session} 
        receiver={chatReceiver} 
        group={chatGroup} 
        onCall={startCall} 
        onNavigate={handleDeepLinkNavigation}
      />
{/* Replace the old ProfileSheet line with this: */}
<ProfileSheet 
    isOpen={!!viewProfileId || isProfileOpen} // Open if viewing someone OR editing self
    onClose={() => {
        setViewProfileId(null)
        setIsProfileOpen(false)
    }} 
    session={session} 
    userId={viewProfileId || session.user.id} // If viewId exists, show them. Else show me.
    onProfileUpdate={refreshSession} 
/>    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-zinc-900 text-yellow-400 shadow-lg shadow-zinc-300' : 'text-zinc-600 hover:bg-white hover:text-yellow-600 hover:shadow-sm'}`}><div className={`h-5 w-5 ${active ? 'text-yellow-400' : 'text-zinc-400'}`}>{icon}</div>{label}</button>
}