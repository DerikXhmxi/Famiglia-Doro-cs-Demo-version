import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, UserPlus, MessageCircle, ShoppingBag } from 'lucide-react'

// --- WIDGET 1: INCOMING REQUESTS (Keep as is) ---
export function IncomingRequests({ session }: { session: any }) {
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    fetchRequests()
    const channel = supabase.channel('friend_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${session.user.id}` }, 
      () => fetchRequests())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchRequests() {
    const { data } = await supabase.from('friendships').select('*, profiles:requester_id(*)').eq('receiver_id', session.user.id).eq('status', 'pending')
    if (data) setRequests(data)
  }

  const handleResponse = async (id: number, accept: boolean) => {
    if (accept) await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    else await supabase.from('friendships').delete().eq('id', id)
    window.location.reload()
  }

  if (requests.length === 0) return null

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100 mb-6">
       <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Friend Requests</h3>
       <div className="space-y-4">
         {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={req.profiles.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div><p className="text-sm font-bold">{req.profiles.username}</p><p className="text-xs text-zinc-500">Wants to connect</p></div>
                </div>
                <div className="flex gap-1">
                    <Button size="icon" className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600" onClick={() => handleResponse(req.id, true)}><Check className="h-4 w-4 text-white" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleResponse(req.id, false)}><X className="h-4 w-4" /></Button>
                </div>
            </div>
         ))}
       </div>
    </div>
  )
}

// --- WIDGET 2: UNIFIED CHAT & FRIENDS (The Fix) ---
export function SidebarChatWidget({ session, onChat }: { session: any, onChat: (u: any) => void }) {
  const [friends, setFriends] = useState<any[]>([])
  const [inbox, setInbox] = useState<any[]>([])

  useEffect(() => {
    fetchFriends()
    fetchInbox()
    
    // Subscribe to new messages to update Inbox order
    const channel = supabase.channel('inbox_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchInbox())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchFriends() {
      const { data } = await supabase.from('friendships').select(`requester:requester_id(id, username, avatar_url), receiver:receiver_id(id, username, avatar_url)`).eq('status', 'accepted').or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      if (data) {
          const list = data.map((f: any) => f.requester.id === session.user.id ? f.receiver : f.requester)
          const unique = list.filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i)
          setFriends(unique)
      }
  }

  async function fetchInbox() {
      // 1. Get all messages where I am sender OR receiver
      const { data } = await supabase.from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
      
      if (!data) return

      // 2. Extract unique User IDs I've talked to
      const talkerIds = new Set<string>()
      data.forEach(msg => {
          if (msg.sender_id && msg.sender_id !== session.user.id) talkerIds.add(msg.sender_id)
          if (msg.receiver_id && msg.receiver_id !== session.user.id) talkerIds.add(msg.receiver_id)
      })

      // 3. Fetch Profile Details for these IDs
      if (talkerIds.size > 0) {
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(talkerIds))
          if (profiles) setInbox(profiles)
      }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100 mb-6">
      <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-100 p-1 rounded-xl">
              <TabsTrigger value="inbox" className="rounded-lg text-xs font-bold">Product Messages</TabsTrigger>
              <TabsTrigger value="friends" className="rounded-lg text-xs font-bold">My Friends</TabsTrigger>
          </TabsList>

          {/* INBOX TAB (Includes Mall Sellers/Buyers) */}
          <TabsContent value="inbox" className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {inbox.length === 0 && <p className="text-xs text-zinc-400 text-center py-4">No messages yet.</p>}
            {inbox.map((user) => (
                <div key={user.id} className="flex items-center justify-between group cursor-pointer hover:bg-zinc-50 p-2 rounded-xl transition-colors" onClick={() => onChat(user)}>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10"><AvatarImage src={user.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-900">{user.username}</span>
                            <span className="text-[10px] text-zinc-400">Click to reply</span>
                        </div>
                    </div>
                    <MessageCircle className="h-4 w-4 text-indigo-500" />
                </div>
            ))}
          </TabsContent>

          {/* FRIENDS TAB */}
          <TabsContent value="friends" className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {friends.length === 0 && <p className="text-xs text-zinc-400 text-center py-4">No friends added.</p>}
            {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between group cursor-pointer hover:bg-zinc-50 p-2 rounded-xl transition-colors" onClick={() => onChat(friend)}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10"><AvatarImage src={friend.avatar_url} /><AvatarFallback>F</AvatarFallback></Avatar>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <span className="text-sm font-medium">{friend.username}</span>
                    </div>
                </div>
            ))}
          </TabsContent>
      </Tabs>
    </div>
  )
}

// --- WIDGET 3: SUGGESTIONS (Keep as is) ---
export function SuggestedFriends({ session }: { session: any }) {
    const [users, setUsers] = useState<any[]>([])
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  
    useEffect(() => {
      async function fetchSuggestions() {
        // Simple fetch for demo (in real app, filter out existing friends)
        const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id).limit(5)
        if (data) setUsers(data)
      }
      fetchSuggestions()
    }, [])
  
    const sendRequest = async (targetId: string) => {
      await supabase.from('friendships').insert({ requester_id: session.user.id, receiver_id: targetId, status: 'pending' })
      setSentRequests(prev => new Set(prev).add(targetId))
    }
  
   return (
  <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
    <h3 className="font-bold text-zinc-900 mb-4">People You May Know</h3>

    {users.map((u) => (
      <div key={u.id} className="flex items-center justify-between mb-4">
        
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={u.avatar_url} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <span className="text-sm font-bold block break-all leading-tight">
              {u.username}
            </span>
            <span className="text-xs  text-zinc-500">Suggested</span>
          </div>
        </div>

        {/* BUTTON */}
        {sentRequests.has(u.id) ? (
          <Button size="sm" variant="outline" disabled className="h-8 text-xs shrink-0">
            Sent
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 bg-zinc-900 text-white shrink-0"
            onClick={() => sendRequest(u.id)}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>
    ))}
  </div>
)

}