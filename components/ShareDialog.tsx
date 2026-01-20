"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Globe, Send, Share2, Check, User, X } from 'lucide-react'
import { Input } from "@/components/ui/input"

export default function ShareDialog({ isOpen, onClose, session, item }: { isOpen: boolean, onClose: () => void, session: any, item: { type: string, data: any } | null }) {
    const [friends, setFriends] = useState<any[]>([])
    const [sentIds, setSentIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (isOpen) {
            setSentIds(new Set())
            setSearch('')
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

    const handleSend = async (targetId: string | null) => {
        const stateKey = targetId || 'global'
        setSentIds(prev => new Set(prev).add(stateKey))

        const payload = {
            sender_id: session.user.id,
            receiver_id: targetId, 
            content: `Check out this ${item.type}: ${shareUrl}`,
            type: 'text'
        }

        const { error } = await supabase.from('messages').insert(payload)

        if (error) {
            console.error("Share failed:", error)
            setSentIds(prev => { const next = new Set(prev); next.delete(stateKey); return next; })
        }
    }

    const filteredFriends = friends.filter(f => f.username?.toLowerCase().includes(search.toLowerCase()))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* FORCE Z-INDEX TO BE ABOVE THE TOUR OVERLAY */}
            <DialogContent className="sm:max-w-md bg-white rounded-3xl border-zinc-100 p-0 overflow-hidden z-[11000] pointer-events-auto">
                <DialogHeader className="p-6 pb-2 border-b border-zinc-50 flex flex-row items-center justify-between">
                    <DialogTitle className="font-bold text-xl flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-yellow-500"/> Share {item.type}
                    </DialogTitle>
                    {/* <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 pointer-events-auto"><X className="w-5 h-5"/></button> */}
                </DialogHeader>
                
                <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 px-6 ">
                        <TabsTrigger value="chat">Send in Chat</TabsTrigger>
                        <TabsTrigger value="native">Copy Link</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="p-0">
                        <div className="px-6 py-2">
                            <Input placeholder="Search friends..." className="bg-zinc-50 border-none rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2 scrollbar-hide">
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

                    <TabsContent value="native" className="p-6 space-y-4">
                        <div className="p-4 bg-zinc-50 rounded-2xl break-all text-xs text-zinc-500 border border-zinc-100 font-mono select-all">
                            {shareUrl}
                        </div>
                        <Button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Link copied to clipboard!') }} className="w-full h-12 bg-yellow-400 text-black hover:bg-yellow-500 rounded-xl font-bold">
                            <Copy className="w-4 h-4 mr-2"/> Copy Link
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}