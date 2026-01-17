import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // You might need: npx shadcn-ui@latest add textarea
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, MapPin, Calendar, Loader2 } from 'lucide-react'

export default function ProfileSheet({ isOpen, onClose, session }: { isOpen: boolean, onClose: () => void, session: any }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit State
  const [newUsername, setNewUsername] = useState('')
  const [newBio, setNewBio] = useState('')

  useEffect(() => {
    if (isOpen && session?.user?.id) {
        fetchProfile()
    }
  }, [isOpen, session])

  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
        setProfile(data)
        setNewUsername(data.username || '')
        setNewBio(data.bio || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.from('profiles').update({
        username: newUsername,
        bio: newBio
    }).eq('id', session.user.id)
    
    if (!error) {
        setProfile({ ...profile, username: newUsername, bio: newBio })
        setIsEditing(false)
    }
    setLoading(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white">
        <SheetHeader className="mb-6">
            <SheetTitle>My Profile</SheetTitle>
        </SheetHeader>

        {loading && !profile ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : profile ? (
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-indigo-50 mb-4">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        {profile.badge_tier === 'premium' && (
                            <div className="absolute bottom-4 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                                <BadgeCheck className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    
                    {isEditing ? (
                        <div className="w-full space-y-3">
                            <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" />
                            <Textarea value={newBio} onChange={e => setNewBio(e.target.value)} placeholder="Bio" />
                            <div className="flex gap-2 justify-center">
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave}>Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold flex items-center gap-2 justify-center">
                                {profile.username}
                                {profile.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                            </h2>
                            <p className="text-zinc-500 mt-2 max-w-xs mx-auto">{profile.bio || "No bio yet."}</p>
                            <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center py-6 border-y border-zinc-100">
                    <div>
                        <div className="font-bold text-xl text-zinc-900">12</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Posts</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl text-zinc-900">1.2k</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Followers</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl text-zinc-900">450</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wide">Following</div>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-zinc-600">
                        <MapPin className="h-4 w-4 text-zinc-400" />
                        <span>Joined from <strong>Earth</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-600">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span>Member since {new Date().getFullYear()}</span>
                    </div>
                </div>

                {/* Upgrade Banner */}
                {profile.badge_tier === 'free' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white text-center">
                        <h3 className="font-bold text-lg mb-1">Upgrade to Premium</h3>
                        <p className="text-indigo-100 text-sm mb-4">Get the Blue Tick and go Live.</p>
                        <Button variant="secondary" className="w-full font-bold">Get Verified ($9.99)</Button>
                    </div>
                )}
            </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}