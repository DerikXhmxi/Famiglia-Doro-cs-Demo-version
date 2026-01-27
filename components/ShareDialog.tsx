"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Globe, Send, Share2, Check, Mail, MessageCircle, Twitter, Facebook, Linkedin, MoreHorizontal, MessageSquare } from 'lucide-react'
import { Input } from "@/components/ui/input"

// Helper for Social Links
const SOCIALS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', url: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black', url: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', url: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', url: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-zinc-500', url: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}` },
]

export default function ShareDialog({ isOpen, onClose, session, item }: { isOpen: boolean, onClose: () => void, session: any, item: { type: string, data: any } | null }) {
    const [friends, setFriends] = useState<any[]>([])
    const [sentIds, setSentIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')
    const [canNativeShare, setCanNativeShare] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setSentIds(new Set())
            setSearch('')
            // Check if browser supports native sharing (mostly mobile)
           if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    setCanNativeShare(true)
}
        }
    }, [isOpen, item])

    useEffect(() => {
        if (isOpen && session) {
            const fetchFriends = async () => {
                const myId = session.user.id
                const { data: rels } = await supabase.from('friends').select('user_a, user_b').or(`user_a.eq.${myId},user_b.eq.${myId}`)
                
                if (rels) {
                    const friendIds = rels.map(r => r.user_a === myId ? r.user_b : r.user_a)
                    if (friendIds.length > 0) {
                        const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds)
                        if (profiles) setFriends(profiles)
                    }
                }
            }
            fetchFriends()
        }
    }, [isOpen, session])

    if (!item) return null

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${item.type}/${item.data.id}` : ''
    const shareText = `Check out this ${item.type} on Famiglia Oro!`

    // --- INTERNAL CHAT SEND ---
    const handleSend = async (targetId: string | null) => {
        const stateKey = targetId || 'global'
        setSentIds(prev => new Set(prev).add(stateKey))

        const payload = {
            sender_id: session.user.id,
            receiver_id: targetId, 
            content: `${shareText}: ${shareUrl}`,
            type: 'text'
        }

        const { error } = await supabase.from('messages').insert(payload)

        if (error) {
            console.error("Share failed:", error)
            setSentIds(prev => { const next = new Set(prev); next.delete(stateKey); return next; })
        }
    }

    // --- EXTERNAL / NATIVE SHARE ---
    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: 'Famiglia Oro',
                text: shareText,
                url: shareUrl,
            })
            onClose()
        } catch (err) {
            console.log('Error sharing:', err)
        }
    }

    const filteredFriends = friends.filter(f => f.username?.toLowerCase().includes(search.toLowerCase()))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl border-zinc-100 p-0 overflow-hidden z-[11000] pointer-events-auto">
                <DialogHeader className="p-6 pb-2 border-b border-zinc-50 flex flex-row items-center justify-between">
                    <DialogTitle className="font-bold text-xl flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-yellow-500"/> Share {item.type}
                    </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 px-6 mb-2">
                        <TabsTrigger value="chat">Famiglia Chat</TabsTrigger>
                        <TabsTrigger value="social">Social Apps</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: INTERNAL FRIENDS */}
                    <TabsContent value="chat" className="p-0 animate-in fade-in slide-in-from-bottom-2">
                        <div className="px-6 py-2">
                            <Input placeholder="Search friends..." className="bg-zinc-50 border-none rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                            <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors border border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><Globe className="w-5 h-5"/></div>
                                    <span className="font-bold text-sm">Global Chat</span>
                                </div>
                                <Button size="sm" className={`rounded-full ${sentIds.has('global') ? 'bg-green-500 hover:bg-green-600' : 'bg-zinc-900 hover:bg-black'} text-white`} onClick={() => handleSend(null)} disabled={sentIds.has('global')}>
                                    {sentIds.has('global') ? <Check className="w-4 h-4"/> : <Send className="w-4 h-4"/>}
                                </Button>
                            </div>

                            {filteredFriends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-zinc-100"><AvatarImage src={friend.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                        <span className="font-bold text-sm">{friend.username}</span>
                                    </div>
                                    <Button size="sm" variant="outline" className={`rounded-full transition-all ${sentIds.has(friend.id) ? 'bg-green-50 text-green-600 border-green-200' : 'hover:bg-zinc-100'}`} onClick={() => handleSend(friend.id)} disabled={sentIds.has(friend.id)}>
                                        {sentIds.has(friend.id) ? <Check className="w-4 h-4"/> : "Send"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* TAB 2: EXTERNAL APPS */}
                    <TabsContent value="social" className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        
                        {/* Native Share Button (Mobile System Sheet) */}
                        {canNativeShare && (
                            <Button onClick={handleNativeShare} className="w-full h-12 bg-zinc-900 text-white hover:bg-black rounded-xl font-bold mb-4 shadow-lg shadow-zinc-200">
                                <MoreHorizontal className="w-4 h-4 mr-2"/> Share via System...
                            </Button>
                        )}

                        {/* Social Icons Grid */}
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Social Networks</p>
                            <div className="grid grid-cols-4 gap-4">
                                {SOCIALS.map((app) => (
                                    <a 
                                        key={app.id}
                                        href={app.url(shareUrl, shareText)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${app.color} text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-active:scale-95`}>
                                            <app.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-medium text-zinc-600">{app.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Copy Link Section */}
                        <div className="pt-4 border-t border-zinc-100">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Or copy link</p>
                            <div className="flex gap-2">
                                <div className="flex-1 p-3 bg-zinc-50 rounded-xl text-xs text-zinc-500 border border-zinc-100 font-mono truncate">
                                    {shareUrl}
                                </div>
                                <Button size="icon" onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Copied!') }} className="h-full w-12 bg-yellow-400 text-black hover:bg-yellow-500 rounded-xl shrink-0">
                                    <Copy className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}