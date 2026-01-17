"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthPage from '@/components/AuthPage'
import CreatePost from '@/components/CreatePost'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// --- IMPORTS FOR FEATURES ---
import ProfileSheet from '@/components/ProfileSheet'
import ChatSheet from '@/components/ChatSheet'
import NotificationBell from '@/components/NotificationBell'
import ShortsFeed from '@/components/ShortsFeed'
import StoriesFeed from '@/components/StoriesFeed'

// We use the "Smart" components we built earlier (which handle Fetching + Creating)
import GroupsFeed from '@/components/GroupsFeed'
import EventsFeed from '@/components/EventsFeed'
import MallFeed from '@/components/Mallfeed'
import LiveDashboard from '@/components/LiveDashboard'
import { IncomingRequests, SidebarChatWidget, SuggestedFriends } from '@/components/FriendWidgets'
import {
  Home, Users, Zap, Calendar, ShoppingBag,
  Search, MessageSquare, Settings, LogOut,
  MoreHorizontal, Heart, MessageCircle, Share2
} from "lucide-react"

// --- 1. ENTRY POINT --- 
export default function Page() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-400 animate-pulse">Loading SuitHub...</div>
  if (!session) return <AuthPage onLogin={() => { }} />

  return <ModernDashboard session={session} />
}

// --- 2. THE MODERN DASHBOARD ---
function ModernDashboard({ session }: { session: any }) {
  const user = session.user.user_metadata

  // STATE MANAGEMENT
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatReceiver, setChatReceiver] = useState<any>(null) // Private Chat Target
  const [chatGroup, setChatGroup] = useState<any>(null)       // Group Chat Target
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // --- CHAT HELPERS ---
  const openGlobalChat = () => {
    setChatGroup(null)
    setChatReceiver(null)
    setIsChatOpen(true)
  }

  const openGroupChat = (group: any) => {
    setChatGroup(group)
    setChatReceiver(null)
    setIsChatOpen(true)
  }

  const openPrivateChat = (targetUser: any) => {
    setChatReceiver(targetUser)
    setChatGroup(null)
    setIsChatOpen(true)
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-indigo-100 relative">

      {/* --- GLASS HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo Area */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <span className="font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 hidden sm:block">SuitHub</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex max-w-md flex-1 items-center px-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                placeholder="Search everything..."
                className="w-full rounded-full bg-zinc-100 py-2 pl-10 pr-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* 1. Notification Bell (FIXED: No outer Button) */}
            <NotificationBell userId={session.user.id} />

            {/* 2. Global Chat Trigger */}
            <Button variant="ghost" size="icon" onClick={openGlobalChat} className="text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </Button>

            <div className="ml-2 h-8 w-px bg-zinc-200"></div>

            {/* 3. Profile Trigger */}
            <Avatar
              className="ml-2 h-9 w-9 cursor-pointer ring-2 ring-white shadow-sm hover:ring-indigo-200 transition-all"
              onClick={() => setIsProfileOpen(true)}
            >
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                {session.user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24 space-y-1">
              <NavItem icon={<Home />} label="Home Feed" active />
              <NavItem icon={<Users />} label="Communities" />
              <NavItem icon={<Zap />} label="Live & Stories" />
              <NavItem icon={<Calendar />} label="Events" />
              <NavItem icon={<ShoppingBag />} label="Marketplace" />

              <div className="pt-8">
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Settings</h3>
                <div className="mt-2 space-y-1">
                  <NavItem icon={<Settings />} label="Preferences" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                    <LogOut className="h-5 w-5" /> Logout
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          {/* CENTER FEED */}
          <main className="lg:col-span-6 space-y-6">
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="w-full bg-white p-1 rounded-2xl shadow-sm border border-zinc-100 h-14 grid grid-cols-6 mb-6">
                <ModernTabTrigger value="feed">Feed</ModernTabTrigger>
                <ModernTabTrigger value="shorts">Shorts</ModernTabTrigger>
                <ModernTabTrigger value="groups">Groups</ModernTabTrigger>
                <ModernTabTrigger value="live">Live</ModernTabTrigger>
                <ModernTabTrigger value="events">Events</ModernTabTrigger>
                <ModernTabTrigger value="mall">Mall</ModernTabTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6 focus-visible:outline-none">
                {/* STORIES & POSTS */}
                <StoriesFeed user={session.user} />
                <CreatePost user_id={session.user.id} />
                <RealPostsFeed session={session} />
              </TabsContent>

              <TabsContent value="shorts">
                <ShortsFeed session={session} />
              </TabsContent>

              <TabsContent value="groups">
                <GroupsFeed session={session} onChat={openGroupChat} />
              </TabsContent>

              <TabsContent value="live">
                <LiveDashboard session={session} />
              </TabsContent>

              <TabsContent value="events">
                <EventsFeed user={session.user} />
              </TabsContent>

              <TabsContent value="mall">
                <MallFeed onChat={openPrivateChat} session={session} />     
                         </TabsContent>
            </Tabs>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">

            {/* 1. Requests */}
            <IncomingRequests session={session} />

            {/* 2. My Friends */}
            <SidebarChatWidget
              session={session}
              onChat={openPrivateChat}
            />

            {/* 3. Suggestions */}
            <SuggestedFriends session={session} />

            {/* 4. Trending */}
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
              <h3 className="font-bold text-zinc-900 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {['#SuitHubLaunch', '#WebDesign', '#TechTrends'].map((tag) => (
                  <div key={tag} className="flex justify-between items-center group cursor-pointer">
                    <span className="text-sm text-zinc-600 group-hover:text-indigo-600 transition-colors">{tag}</span>
                    <span className="text-xs text-zinc-400">2.5k posts</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* --- SIDE SHEETS --- */}
      <ChatSheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        session={session}
        receiver={chatReceiver}
        group={chatGroup}
      />
      <ProfileSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} session={session} />
    </div>
  )
}

// --- HELPER COMPONENTS ---

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${active
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
      : 'text-zinc-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
      }`}>
      <div className={`h-5 w-5 ${active ? 'text-white' : 'text-zinc-400'}`}>{icon}</div>
      {label}
    </button>
  )
}

function ModernTabTrigger({ value, children }: { value: string, children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="rounded-xl data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none text-zinc-500 font-medium">
      {children}
    </TabsTrigger>
  )
}

// --- REAL POSTS FEED (With Comments & Likes) ---
function RealPostsFeed({ session }: { session: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    fetchPosts()
    // Listen for new posts
    const channel = supabase.channel('posts_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        const { data: newPostData } = await supabase.from('posts')
          .select(`*, profiles(username, avatar_url, badge_tier), post_likes(user_id), post_comments(count)`)
          .eq('id', payload.new.id)
          .single()

        if (newPostData) {
          const processed = { ...newPostData, isLiked: false, likeCount: 0, commentCount: 0 }
          setPosts(prev => [processed, ...prev])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles(username, avatar_url, badge_tier), post_likes(user_id), post_comments(count)`)
      .order('created_at', { ascending: false })

    if (data) {
      const processed = data.map(p => ({
        ...p,
        isLiked: p.post_likes.some((l: any) => l.user_id === session.user.id),
        likeCount: p.post_likes.length,
        commentCount: p.post_comments[0].count
      }))
      setPosts(processed)
    }
  }

  const toggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
    } else {
      setExpandedPostId(postId)
      const { data } = await supabase.from('post_comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true })
      if (data) setComments(data)
    }
  }

  const handleLike = async (post: any) => {
    const isLiked = post.isLiked
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !isLiked, likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p))

    if (isLiked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: session.user.id })
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: session.user.id })
      if (post.user_id !== session.user.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, sender_id: session.user.id, type: 'like', content: 'liked your post.' })
      }
    }
  }

  const handleComment = async (post: any) => {
    if (!commentText.trim()) return
    const { data } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: session.user.id, content: commentText }).select('*, profiles(username, avatar_url)').single()

    if (post.user_id !== session.user.id) {
      await supabase.from('notifications').insert({ user_id: post.user_id, sender_id: session.user.id, type: 'comment', content: 'commented on your post.' })
    }

    setCommentText('')
    if (data) setComments(prev => [...prev, data])
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <Avatar><AvatarImage src={post.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
              <div>
                <span className="font-bold text-sm block">{post.profiles?.username}</span>
                <span className="text-xs text-zinc-400">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="px-5 pb-3"><p className="text-zinc-700">{post.content}</p></div>
          {post.media_url && (
            <div className="w-full bg-black flex justify-center">
              {post.media_type === 'video' ? <video src={post.media_url} controls className="max-h-[500px]" /> : <img src={post.media_url} className="max-h-[500px] object-contain" />}
            </div>
          )}
          <div className="px-5 py-4 border-t border-zinc-50 flex items-center justify-between">
            <div className="flex gap-4">
              <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}>
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} /> {post.likeCount}
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 text-sm font-medium">
                <MessageCircle className="h-5 w-5" /> {post.commentCount}
              </button>
            </div>
            <button className="text-zinc-400 hover:text-zinc-600"><Share2 className="h-5 w-5" /></button>
          </div>
          {expandedPostId === post.id && (
            <div className="bg-zinc-50 p-4 border-t border-zinc-100">
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-zinc-400 text-center">No comments yet.</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="h-6 w-6"><AvatarImage src={c.profiles?.avatar_url} /></Avatar>
                    <div className="bg-white p-2 rounded-xl text-xs shadow-sm">
                      <span className="font-bold mr-1">{c.profiles?.username}</span>
                      {c.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment(post)}
                />
                <Button size="sm" onClick={() => handleComment(post)} className="rounded-full bg-indigo-600">Post</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}