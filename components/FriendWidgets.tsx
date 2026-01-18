import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, UserPlus, Loader2, Check, X, User } from 'lucide-react'

// --- SHARED LIST ITEM ---
const UserListItem = ({ 
    user, 
    subtext, 
    action, 
}: { 
    user: any, 
    subtext: string, 
    action: React.ReactNode,
}) => (
    <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors group w-full">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 border border-zinc-100 bg-white">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">
                        {user.username?.[0]?.toUpperCase() || <User className="w-4 h-4"/>}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-900 leading-none mb-1 truncate block">
                    {user.username || 'Unknown User'}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium truncate block">
                    {subtext}
                </span>
            </div>
        </div>
        <div className="flex-shrink-0 ml-2">
            {action}
        </div>
    </div>
)

// --- 1. SIDEBAR CHAT WIDGET (With Real-Time Updates) ---
export function SidebarChatWidget({ session, onChat }: { session: any, onChat: (target: any) => void }) {
    const [productChats, setProductChats] = useState<any[]>([])
    const [friends, setFriends] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Helper to fetch data
    const refreshData = async () => {
        const myId = session.user.id

        // 1. GET FRIENDS
        const { data: friendsRel } = await supabase.from('friends')
            .select('user_a, user_b')
            .or(`user_a.eq.${myId},user_b.eq.${myId}`)
        
        const friendIds = new Set<string>()
        friendsRel?.forEach(f => friendIds.add(f.user_a === myId ? f.user_b : f.user_a))

        if (friendIds.size > 0) {
            const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', Array.from(friendIds))
            if (friendProfiles) setFriends(friendProfiles)
        } else {
            setFriends([])
        }

        // 2. GET PRODUCT MESSAGES (Chats with Non-Friends)
        const { data: msgs } = await supabase.from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
            .order('created_at', { ascending: false })
            .limit(50)
        
        if (msgs) {
            const chatIds = new Set<string>()
            msgs.forEach(m => {
                const partner = m.sender_id === myId ? m.receiver_id : m.sender_id
                // Only add if NOT a friend
                if (partner && !friendIds.has(partner)) chatIds.add(partner)
            })
            
            if (chatIds.size > 0) {
                const { data: chatProfiles } = await supabase.from('profiles').select('*').in('id', Array.from(chatIds))
                if (chatProfiles) setProductChats(chatProfiles)
            } else {
                setProductChats([])
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        refreshData()

        // LISTEN FOR NEW FRIENDS (Real-time update)
        const channel = supabase.channel('sidebar_friends_update')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
                console.log("Friend list updated, refreshing sidebar...")
                refreshData()
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                refreshData()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [session.user.id])

    return (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-zinc-100">
            <Tabs defaultValue="friends" className="w-full">
                <TabsList className="w-full bg-zinc-100/50 p-1 rounded-xl mb-4 h-10">
                    <TabsTrigger value="messages" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Product Msgs</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">My Friends</TabsTrigger>
                </TabsList>

                {/* TAB 1: PRODUCT / SELLER MESSAGES */}
                <TabsContent value="messages" className="space-y-1 min-h-[200px]">
                    {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-300"/></div> : 
                     productChats.length === 0 ? <p className="text-center text-xs text-zinc-400 py-8">No active chats with sellers.</p> :
                     productChats.map(user => (
                        <UserListItem 
                            key={user.id} 
                            user={user} 
                            subtext="Seller / User" 
                            action={
                                <Button size="icon" variant="ghost" onClick={() => onChat(user)} className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-yellow-400 hover:text-black">
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            }
                        />
                    ))}
                </TabsContent>

                {/* TAB 2: FRIENDS */}
                <TabsContent value="friends" className="space-y-1 min-h-[200px]">
                    {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-300"/></div> : 
                     friends.length === 0 ? <p className="text-center text-xs text-zinc-400 py-8">No friends added yet.</p> :
                     friends.map(user => (
                        <UserListItem 
                            key={user.id} 
                            user={user} 
                            subtext="Friend" 
                            action={
                                <Button size="icon" variant="ghost" onClick={() => onChat(user)} className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-yellow-400 hover:text-black">
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            }
                        />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}

// --- 2. INCOMING REQUESTS ---
export function IncomingRequests({ session }: { session: any }) {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        const { data } = await supabase.from('friend_requests')
            .select('id, sender:sender_id(*)') 
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending')
        if (data) setRequests(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
        const channel = supabase.channel('requests_widget')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${session.user.id}` }, () => fetchRequests())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleAccept = async (reqId: number, senderId: string) => {
        // 1. Insert into Friends
await supabase.from('friends').insert({ user_a: session.user.id, user_b: senderId })        // 2. Remove Request
        await supabase.from('friend_requests').delete().eq('id', reqId)
        // 3. UI Update
        setRequests(prev => prev.filter(r => r.id !== reqId))
    }

    const handleReject = async (reqId: number) => {
        await supabase.from('friend_requests').delete().eq('id', reqId)
        setRequests(prev => prev.filter(r => r.id !== reqId))
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-zinc-900">Requests</h3>
                {requests.length > 0 && <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{requests.length} New</span>}
            </div>

            <div className="space-y-3">
                {loading ? <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-300"/></div> : 
                 requests.length === 0 ? <p className="text-xs text-zinc-400 italic text-center py-4">No pending requests.</p> :
                 requests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-10 w-10 border border-zinc-100 flex-shrink-0">
                                <AvatarImage src={req.sender?.avatar_url} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-zinc-900 truncate block max-w-[120px]">
                                    {req.sender?.username || 'User'}
                                </p>
                                <p className="text-[10px] text-zinc-400 truncate block">Wants to connect</p>
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <Button size="icon" onClick={() => handleAccept(req.id, req.sender.id)} className="h-8 w-8 rounded-full bg-zinc-900 text-white hover:bg-green-600 transition-colors shadow-sm">
                                <Check className="w-4 h-4"/>
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => handleReject(req.id)} className="h-8 w-8 rounded-full border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50">
                                <X className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- 3. SUGGESTED FRIENDS ---
export function SuggestedFriends({ session }: { session: any }) {
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [sentIds, setSentIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchSuggestions = async () => {
            const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id).limit(5)
            if (data) setSuggestions(data)
        }
        fetchSuggestions()
    }, [])

    const sendRequest = async (targetId: string) => {
        setSentIds(prev => new Set(prev).add(targetId))
        await supabase.from('friend_requests').insert({ sender_id: session.user.id, receiver_id: targetId })
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100">
            <h3 className="font-bold text-zinc-900 mb-4">People You May Know</h3>
            <div className="space-y-4">
                {suggestions.map(user => {
                    const isSent = sentIds.has(user.id)
                    return (
                        <UserListItem 
                            key={user.id} 
                            user={user} 
                            subtext="Suggested" 
                            action={
                                <Button 
                                    size="sm" 
                                    variant={isSent ? "ghost" : "outline"}
                                    disabled={isSent}
                                    onClick={() => sendRequest(user.id)}
                                    className={`h-8 rounded-full text-xs transition-colors px-3 ${isSent ? 'text-green-600 bg-green-50' : 'border-zinc-200 hover:bg-zinc-900 hover:text-white'}`}
                                >
                                    {isSent ? <Check className="w-3 h-3 mr-1"/> : <UserPlus className="w-3 h-3 mr-1"/>}
                                    {isSent ? "Sent" : "Add"}
                                </Button>
                            }
                        />
                    )
                })}
            </div>
        </div>
    )
}