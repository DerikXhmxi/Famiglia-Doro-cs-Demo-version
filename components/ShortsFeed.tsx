import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Heart, MessageCircle, Share2, Loader2, X, Video, Send } from 'lucide-react'

// --- HELPER: VIDEO ITEM ---
function ShortItem({ short, session, isActive }: { short: any, session: any, isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [commentsOpen, setCommentsOpen] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.currentTime = 0
                videoRef.current.play().catch(e => console.log("Autoplay blocked", e))
            } else {
                videoRef.current.pause()
            }
        }
    }, [isActive])

    useEffect(() => {
        async function fetchInteractions() {
            const { data: likeData } = await supabase.from('short_likes').select('id').eq('user_id', session.user.id).eq('short_id', short.id).single()
            if (likeData) setLiked(true)
            const { count } = await supabase.from('short_likes').select('id', { count: 'exact', head: true }).eq('short_id', short.id)
            setLikeCount(count || 0)
        }
        fetchInteractions()
    }, [])

    const toggleLike = async () => {
        if (liked) {
            setLiked(false); setLikeCount(prev => prev - 1)
            await supabase.from('short_likes').delete().eq('user_id', session.user.id).eq('short_id', short.id)
        } else {
            setLiked(true); setLikeCount(prev => prev + 1)
            await supabase.from('short_likes').insert({ user_id: session.user.id, short_id: short.id })
        }
    }

    const loadComments = async () => {
        const { data } = await supabase.from('short_comments').select('*, profiles(username, avatar_url)').eq('short_id', short.id).order('created_at', { ascending: false })
        if (data) setComments(data)
    }

    const postComment = async () => {
        if (!newComment.trim()) return
        const tempComment = { id: Date.now(), content: newComment, profiles: { username: 'Me', avatar_url: '' } }
        setComments([tempComment, ...comments]); setNewComment('')
        await supabase.from('short_comments').insert({ user_id: session.user.id, short_id: short.id, content: newComment })
        loadComments()
    }

    const handleShare = async () => {
        const url = short.video_url
        if (navigator.share) { try { await navigator.share({ title: 'Check this out!', url }) } catch (err) {} } 
        else { navigator.clipboard.writeText(url); alert("Link copied to clipboard!") }
    }

    return (
        <div className="snap-center relative w-full h-full bg-black group flex-shrink-0 border-x border-zinc-900">
            <video ref={videoRef} src={short.video_url} className="w-full h-full object-cover" loop playsInline onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}/>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />
            
            <div className="absolute bottom-24 right-4 flex flex-col gap-6 items-center z-20">
                <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={toggleLike}>
                    <div className={`p-3 rounded-full transition-all ${liked ? 'bg-yellow-400 text-black' : 'bg-zinc-800/80 text-white backdrop-blur-md'}`}><Heart className={`w-7 h-7 ${liked ? 'fill-current' : ''}`} /></div>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{likeCount}</span>
                </div>
                <Dialog open={commentsOpen} onOpenChange={(open) => { setCommentsOpen(open); if(open) loadComments(); }}>
                    <DialogTrigger asChild>
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                            <div className="p-3 bg-zinc-800/80 rounded-full text-white backdrop-blur-md"><MessageCircle className="w-7 h-7" /></div>
                            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Chat</span>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md h-[500px] flex flex-col border-yellow-500/20">
                        <DialogHeader><DialogTitle>Comments</DialogTitle></DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                            {comments.length === 0 && <p className="text-center text-zinc-400 mt-10">No comments yet.</p>}
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8"><AvatarImage src={c.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                    <div className="bg-zinc-50 p-3 rounded-r-xl rounded-bl-xl text-sm border border-zinc-100">
                                        <p className="font-bold text-xs text-zinc-900 mb-1">{c.profiles?.username}</p>
                                        <p className="text-zinc-600">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-zinc-100">
                            <Input placeholder="Add a comment..." className="border-zinc-200 focus-visible:ring-yellow-400" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()} />
                            <Button size="icon" onClick={postComment} className="bg-yellow-400 hover:bg-yellow-500 text-black"><Send className="w-4 h-4"/></Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={handleShare}>
                    <div className="p-3 bg-zinc-800/80 rounded-full text-white backdrop-blur-md"><Share2 className="w-7 h-7" /></div>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
                </div>
            </div>

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 pointer-events-none">
                <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                    <Avatar className="h-10 w-10 ring-2 ring-yellow-400"><AvatarImage src={short.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                    <span className="font-bold text-shadow-sm text-yellow-400">{short.profiles?.username}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed drop-shadow-md text-zinc-100">{short.caption}</p>
            </div>
        </div>
    )
}

// --- MAIN COMPONENT ---
export default function ShortsFeed({ session }: { session: any }) {
  const [shorts, setShorts] = useState<any[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => { fetchShorts() }, [])

  async function fetchShorts() {
    const { data } = await supabase.from('shorts').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
    if (data) setShorts(data)
  }

  useEffect(() => {
      const container = containerRef.current; if (!container) return
      const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { const index = Number(entry.target.getAttribute('data-index')); setActiveIndex(index) } }) }, { root: container, threshold: 0.6 })
      const children = container.querySelectorAll('.video-wrapper'); children.forEach(child => observer.observe(child))
      return () => observer.disconnect()
  }, [shorts])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadFile(file); setPreviewUrl(URL.createObjectURL(file))
  }

  const handlePost = async () => {
    if (!uploadFile) return; setUploading(true)
    const fileName = `shorts/${Date.now()}_${uploadFile.name}`
    await supabase.storage.from('uploads').upload(fileName, uploadFile)
    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
    await supabase.from('shorts').insert({ user_id: session.user.id, video_url: data.publicUrl, caption: caption })
    setUploading(false); setIsUploadOpen(false); setUploadFile(null); setPreviewUrl(null); setCaption(''); fetchShorts()
  }

  return (
    <div className="space-y-8 pb-10">
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-8 rounded-[2rem] text-zinc-900 flex items-center justify-between shadow-xl shadow-yellow-200/50 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="font-black text-3xl mb-1 tracking-tight">Create Shorts</h2>
                <p className="text-zinc-800 font-bold opacity-80">Share your vibes with the Famiglia.</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-full font-bold shadow-lg relative z-10"><Plus className="w-5 h-5 mr-2 text-yellow-400" /> Upload Reel</Button></DialogTrigger>
                <DialogContent className="border-yellow-500/20">
                    <DialogHeader><DialogTitle>Create Reel</DialogTitle></DialogHeader>
                    {!uploadFile ? (
                        <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer relative hover:bg-zinc-50 transition">
                             <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} />
                             <Video className="w-10 h-10 text-yellow-500 mb-2" />
                             <p className="text-zinc-500 font-medium">Select Video</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <video src={previewUrl!} className="w-full h-64 object-cover rounded-xl" controls />
                            <Textarea placeholder="Write a caption..." value={caption} onChange={e => setCaption(e.target.value)} className="focus-visible:ring-yellow-400" />
                            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold" onClick={handlePost} disabled={uploading}>{uploading ? "Uploading..." : "Post Reel"}</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>

        <div className="h-[80vh] w-full max-w-md mx-auto bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-zinc-900 ring-1 ring-zinc-800">
             <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
                {shorts.length === 0 && <div className="text-zinc-500 text-center pt-40">No shorts yet.<br/>Be the first!</div>}
                {shorts.map((short, index) => (<div key={short.id} data-index={index} className="video-wrapper snap-center w-full h-full"><ShortItem short={short} session={session} isActive={activeIndex === index} /></div>))}
            </div>
        </div>
    </div>
  )
}