import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from 'lucide-react'

export default function StoriesFeed({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [viewStory, setViewStory] = useState<any>(null)

  useEffect(() => {
    fetchStories()

    // --- REALTIME FIX: Listen for new stories ---
    const channel = supabase.channel('stories_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, async (payload) => {
          // Fetch the full profile for the new story so we can display the avatar
          const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single()
          const newStory = { ...payload.new, profiles: profile }
          
          setStories((prev) => [newStory, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchStories = async () => {
    const { data } = await supabase.from('stories').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
    if (data) setStories(data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const fileName = `stories/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('uploads').upload(fileName, file)
    
    if (!error) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
        await supabase.from('stories').insert({
            user_id: user.id,
            media_url: data.publicUrl,
            media_type: file.type.startsWith('video') ? 'video' : 'image'
        })
        // No reload needed! Realtime will catch it.
    }
    setUploading(false)
  }

  return (
    <>
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100 mb-6">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-4">
                <div className="relative flex flex-col items-center gap-2 cursor-pointer group">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center bg-indigo-50 group-hover:bg-indigo-100 transition-colors relative overflow-hidden">
                        {uploading ? <Loader2 className="animate-spin text-indigo-600"/> : <Plus className="text-indigo-600" />}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                    </div>
                    <span className="text-xs font-medium text-zinc-600">Add Story</span>
                </div>

                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setViewStory(story)}>
                        <div className={`p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform`}>
                            <Avatar className="w-16 h-16 border-2 border-white">
                                <AvatarImage src={story.profiles?.avatar_url} />
                                <AvatarFallback>{story.profiles?.username?.[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <span className="text-xs font-medium text-zinc-600 truncate w-16 text-center">{story.profiles?.username}</span>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
    </div>

    <Dialog open={!!viewStory} onOpenChange={() => setViewStory(null)}>
        <DialogContent className="p-0 border-none bg-black text-white overflow-hidden max-w-sm h-[80vh] rounded-3xl flex flex-col justify-center">
            {viewStory && (
                <>
                 <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <Avatar className="w-8 h-8"><AvatarImage src={viewStory.profiles?.avatar_url}/></Avatar>
                    <span className="font-bold drop-shadow-md">{viewStory.profiles?.username}</span>
                 </div>
                 {viewStory.media_type === 'video' ? (
                     <video src={viewStory.media_url} autoPlay controls className="w-full" />
                 ) : (
                     <img src={viewStory.media_url} className="w-full object-contain" />
                 )}
                </>
            )}
        </DialogContent>
    </Dialog>
    </>
  )
}