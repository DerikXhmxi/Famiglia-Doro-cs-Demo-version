import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area" 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Lock, Globe, Users, Image as ImageIcon } from 'lucide-react'

export default function ChatSheet({ 
  isOpen, 
  onClose, 
  session, 
  receiver,
  group 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  session: any,
  receiver?: any,
  group?: any
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch & Subscribe
  useEffect(() => {
    if (!isOpen) return

    setMessages([])
    setLoading(true)

    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, profiles:sender_id(username, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(50)

      if (group?.id) {
          query = query.eq('group_id', group.id)
      } else if (receiver?.id) {
          query = query.or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${session.user.id})`)
      } else {
          query = query.is('receiver_id', null).is('group_id', null)
      }

      const { data } = await query
      if (data) setMessages(data)
      setLoading(false)
    }
    fetchMessages()

    const channelName = group?.id ? `group_${group.id}` : receiver?.id ? `private_${receiver.id}` : 'public_chat'
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const newMsg = payload.new
          
          let isRelevant = false
          if (group?.id) isRelevant = newMsg.group_id === group.id
          else if (receiver?.id) isRelevant = (newMsg.sender_id === session.user.id && newMsg.receiver_id === receiver.id) || (newMsg.sender_id === receiver.id && newMsg.receiver_id === session.user.id)
          else isRelevant = !newMsg.receiver_id && !newMsg.group_id

          if (isRelevant) {
             const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMsg.sender_id).single()
             setMessages((prev) => [...prev, { ...newMsg, profiles: data }])
          }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOpen, receiver?.id, group?.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    await supabase.from('messages').insert({
      content: newMessage,
      sender_id: session.user.id,
      receiver_id: receiver?.id || null,
      group_id: group?.id || null
    })
    setNewMessage('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      const fileName = `chat/${Date.now()}_${file.name}`
      await supabase.storage.from('uploads').upload(fileName, file)
      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
      
      await supabase.from('messages').insert({
          content: "Sent an attachment",
          media_url: data.publicUrl, // Ensure you added media_url to messages table (Step 1)
          sender_id: session.user.id,
          receiver_id: receiver?.id || null,
          group_id: group?.id || null
      })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[100vw] sm:w-[540px] flex flex-col p-0 bg-white border-l border-zinc-200">
        
        {/* Header */}
        <SheetHeader className="p-4 border-b border-zinc-100 bg-white flex flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
                {group ? (
                   <>
                    <Avatar className="h-8 w-8"><AvatarImage src={group.image_url} /><AvatarFallback>G</AvatarFallback></Avatar>
                    <div className="flex flex-col items-start"><span>{group.name}</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Users className="w-3 h-3"/> Group Chat</span></div>
                   </>
                ) : receiver ? (
                  <>
                    <Avatar className="h-8 w-8"><AvatarImage src={receiver.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex flex-col items-start"><span>{receiver.username}</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Lock className="w-3 h-3"/> Private Chat</span></div>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <div className="flex flex-col items-start"><span>Global Live Chat</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Globe className="w-3 h-3"/> Public Room</span></div>
                  </>
                )}
            </SheetTitle>
        </SheetHeader>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50" ref={scrollRef}>
             {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-400" /></div>}
             {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                        <Avatar className="h-8 w-8 ring-2 ring-white"><AvatarImage src={msg.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none'}`}>
                            {!isMe && <p className="text-[10px] text-zinc-400 font-bold mb-1">{msg.profiles?.username}</p>}
                            {msg.content}
                            {msg.media_url && <img src={msg.media_url} className="mt-2 rounded-lg max-h-40" />}
                        </div>
                    </div>
                )
             })}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-zinc-100 flex gap-2 items-center">
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
            <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-zinc-400"/></Button>
            
            <Input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-zinc-100 border-none rounded-full h-11 focus-visible:ring-indigo-500"
            />
            <Button size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-11 w-11 shrink-0" onClick={handleSend}><Send className="h-4 w-4" /></Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}