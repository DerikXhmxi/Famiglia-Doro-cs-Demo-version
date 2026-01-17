import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Heart, MessageCircle, Share2, Play } from 'lucide-react'

export default function ShortsFeed({ session }: { session: any }) {
  const [shorts, setShorts] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchShorts() {
      const { data } = await supabase.from('shorts').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
      if (data) setShorts(data)
    }
    fetchShorts()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    // Upload
    const fileName = `shorts/${Date.now()}_${file.name}`
    await supabase.storage.from('uploads').upload(fileName, file)
    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)

    // Save DB
    await supabase.from('shorts').insert({ user_id: session.user.id, video_url: data.publicUrl, caption: 'New Short' })
    setUploading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
        {/* Create Short Button */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 rounded-3xl text-white flex items-center justify-between shadow-lg">
            <div>
                <h2 className="font-bold text-xl">Create Shorts</h2>
                <p className="text-white/80 text-sm">Share your moments in vertical video.</p>
            </div>
            <div className="relative">
                <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploading} />
                <Button className="bg-white text-orange-600 hover:bg-zinc-100 rounded-full font-bold">
                    {uploading ? "Uploading..." : "+ Upload Reel"}
                </Button>
            </div>
        </div>

        {/* Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shorts.map((short) => (
                <div key={short.id} className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-md group">
                    <video src={short.video_url} className="w-full h-full object-cover" controls playsInline loop />
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8 ring-1 ring-white"><AvatarImage src={short.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                            <span className="font-bold text-sm">{short.profiles?.username}</span>
                        </div>
                        <p className="text-xs line-clamp-2 text-white/90">{short.caption}</p>
                    </div>

                    {/* Side Actions */}
                    <div className="absolute bottom-20 right-2 flex flex-col gap-4 items-center">
                        <button className="bg-black/40 p-3 rounded-full backdrop-blur-md text-white hover:bg-pink-600 transition"><Heart className="w-6 h-6"/></button>
                        <button className="bg-black/40 p-3 rounded-full backdrop-blur-md text-white hover:bg-blue-600 transition"><MessageCircle className="w-6 h-6"/></button>
                        <button className="bg-black/40 p-3 rounded-full backdrop-blur-md text-white hover:bg-green-600 transition"><Share2 className="w-6 h-6"/></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )
}