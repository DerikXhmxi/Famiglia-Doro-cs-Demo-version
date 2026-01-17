import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Image as ImageIcon, Smile, Loader2, Send, X } from 'lucide-react'

export default function CreatePost({ user_id }: { user_id: string }) {
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return
    setLoading(true)

    let mediaUrl = null
    let mediaType = 'text'

    if (mediaFile) {
        const fileName = `${Math.random()}.${mediaFile.name.split('.').pop()}`
        const { data } = await supabase.storage.from('uploads').upload(fileName, mediaFile)
        if (data) {
            const { data: publicUrl } = supabase.storage.from('uploads').getPublicUrl(fileName)
            mediaUrl = publicUrl.publicUrl
            mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image'
        }
    }

    await supabase.from('posts').insert({ 
        user_id, 
        content,
        media_url: mediaUrl,
        media_type: mediaType
    })

    setContent('') 
    setMediaFile(null)
    setLoading(false)
    // No reload! The Feed will detect the insert.
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-5 mb-6">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 mt-1"><AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">ME</AvatarFallback></Avatar>
        <div className="flex-1">
            <textarea 
                className="w-full bg-zinc-50 rounded-xl p-3 min-h-[80px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none resize-none text-sm"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            
            {mediaFile && (
                <div className="relative mt-2 rounded-xl overflow-hidden bg-black max-h-60">
                    <button onClick={() => setMediaFile(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black"><X className="w-4 h-4"/></button>
                    {mediaFile.type.startsWith('video') ? (
                        <video src={URL.createObjectURL(mediaFile)} className="w-full h-full object-contain" controls />
                    ) : (
                        <img src={URL.createObjectURL(mediaFile)} className="w-full h-full object-contain" />
                    )}
                </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-indigo-500 transition-colors">
                        <ImageIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setContent(prev => prev + " 😊")} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-yellow-500 transition-colors">
                        <Smile className="h-5 w-5" />
                    </button>
                </div>
                <Button onClick={handlePost} disabled={loading || (!content && !mediaFile)} className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-6">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">Post <Send className="h-3 w-3" /></span>}
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}