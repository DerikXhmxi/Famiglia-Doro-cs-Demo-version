"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BadgeCheck, MapPin, Calendar, Loader2, Briefcase, Heart, Link as LinkIcon, 
  Instagram, Linkedin, Twitter, Users, Trash2, 
  Edit3, X, ShieldAlert, Camera, UserPlus, MessageCircle, UserCheck,
  Store, Building2, ArrowRight, Plus
} from 'lucide-react'

// --- SKELETON LOADER COMPONENT ---
function ProfileSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-32 bg-zinc-200 w-full" />
            <div className="px-6 -mt-12">
                <div className="h-24 w-24 bg-zinc-300 rounded-full ring-4 ring-white" />
                <div className="mt-4 space-y-3">
                    <div className="h-6 w-48 bg-zinc-200 rounded" />
                    <div className="h-4 w-32 bg-zinc-100 rounded" />
                    <div className="h-12 w-full bg-zinc-50 rounded mt-4" />
                </div>
            </div>
        </div>
    )
}

export default function ProfileSheet({ 
    isOpen, 
    onClose, 
    session,
    userId, 
    onProfileUpdate 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    session: any,
    userId?: string | null,
    onProfileUpdate?: () => void 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  const [profile, setProfile] = useState<any>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isFriend, setIsFriend] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const targetId = userId || session?.user?.id
  const isOwner = session?.user?.id === targetId

  useEffect(() => {
    if (isOpen && targetId) {
        fetchAllData()
    }
  }, [isOpen, targetId])

  async function fetchAllData() {
    if (!profile) setLoading(true)
    setIsEditing(false) 

    const [
        profileRes,
        friendsRes,
        groupsRes,
        postsRes,
        businessRes,
        friendshipRes,
        requestRes
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', targetId).single(),
        supabase.from('friends').select('*, user_a_profile:user_a(*), user_b_profile:user_b(*)').or(`user_a.eq.${targetId},user_b.eq.${targetId}`),
        supabase.from('group_members').select('*, groups(*)').eq('user_id', targetId),
        supabase.from('posts').select('*').eq('user_id', targetId).order('created_at', { ascending: false }).limit(20),
        supabase.from('businesses').select('*').eq('owner_id', targetId).order('created_at', { ascending: false }),
        !isOwner ? supabase.from('friends').select('*').or(`and(user_a.eq.${session.user.id},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${session.user.id})`).maybeSingle() : Promise.resolve({ data: null }),
        (!isOwner) ? supabase.from('friend_requests').select('*').eq('sender_id', session.user.id).eq('receiver_id', targetId).maybeSingle() : Promise.resolve({ data: null })
    ])

    if (profileRes.data) {
        setProfile(profileRes.data)
        setFormData(profileRes.data)
        setPreviewUrl(profileRes.data.avatar_url)
    }
    
    const processedFriends = friendsRes.data?.map((f: any) => {
        return f.user_a === targetId ? { ...f.user_b_profile, relationId: f.id } : { ...f.user_a_profile, relationId: f.id }
    }) || []

    setFriends(processedFriends)
    setGroups(groupsRes.data?.map((g: any) => ({ ...g.groups, membershipId: g.id })) || [])
    setPosts(postsRes.data || [])
    setBusinesses(businessRes.data || []) 

    if (!isOwner) {
        setIsFriend(!!friendshipRes.data)
        setHasRequested(!!requestRes.data)
    }
    setLoading(false)
  }

  const handleConnect = async () => {
      if (isFriend) return 
      const { error } = await supabase.from('friend_requests').insert({ sender_id: session.user.id, receiver_id: targetId })
      if (!error) { setHasRequested(true); alert("Friend request sent!") }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0]
          setAvatarFile(file)
          setPreviewUrl(URL.createObjectURL(file))
      }
  }

  const handleSave = async () => {
      if (!isOwner) return
      setSaving(true)
      try {
          let finalAvatarUrl = formData.avatar_url
          if (avatarFile) {
              const fileName = `avatars/${session.user.id}_${Date.now()}`
              await supabase.storage.from('uploads').upload(fileName, avatarFile)
              const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
              finalAvatarUrl = data.publicUrl
          }
          const { error } = await supabase.from('profiles').update({
              first_name: formData.first_name,
              last_name: formData.last_name,
              username: formData.username,
              bio: formData.bio,
              profession: formData.profession,
              location: formData.location,
              relationship_status: formData.relationship_status,
              website: formData.website,
              instagram: formData.instagram,
              twitter: formData.twitter,
              linkedin: formData.linkedin,
              avatar_url: finalAvatarUrl
          }).eq('id', session.user.id)
          if (error) throw error
          await supabase.auth.updateUser({ data: { avatar_url: finalAvatarUrl, username: formData.username, full_name: `${formData.first_name} ${formData.last_name}` } })
          setProfile({ ...formData, avatar_url: finalAvatarUrl })
          setIsEditing(false)
          setAvatarFile(null)
          if (onProfileUpdate) onProfileUpdate() 
      } catch (err) { console.error(err); alert("Failed to save changes.") } finally { setSaving(false) }
  }

  const deleteAccount = async () => {
      const confirmation = prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.")
      if (confirmation === 'DELETE') {
          await supabase.from('profiles').delete().eq('id', session.user.id)
          await supabase.auth.signOut()
          window.location.reload()
      }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] overflow-y-auto bg-zinc-50 p-0 border-l border-zinc-200">
        
        {loading && !profile ? (
            <>
                {/* FIX: Accessibility Title for Loading State (Hidden) */}
                <SheetTitle className="sr-only">Loading Profile</SheetTitle>
                <ProfileSkeleton />
            </>
        ) : (
            <>
                {/* HERO SECTION */}
                <div className="relative bg-white pb-6 border-b border-zinc-200">
                    <div className="h-32 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 w-full relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 transition"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="px-6 relative">
                        <div className="absolute -top-16 left-6 group">
                            <div className="relative">
                                <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg bg-white">
                                    <AvatarImage src={previewUrl || profile?.avatar_url} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold bg-zinc-200 text-zinc-500">{profile?.first_name?.[0]}</AvatarFallback>
                                </Avatar>
                                {isOwner && isEditing && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-colors backdrop-blur-sm">
                                        <Camera className="w-8 h-8 text-white" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                )}
                                {profile?.badge_tier === 'premium' && <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full ring-2 ring-white z-10"><BadgeCheck className="w-5 h-5" /></div>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            {isOwner ? (
                                isEditing ? (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setFormData(profile); setPreviewUrl(profile.avatar_url); }}>Cancel</Button>
                                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin w-4 h-4"/> : "Save Changes"}</Button>
                                    </>
                                ) : (
                                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsEditing(true)}><Edit3 className="w-4 h-4 mr-2"/> Edit Profile</Button>
                                )
                            ) : (
                                <>
                                    <Button size="sm" variant="outline" className="rounded-full border-zinc-300"><MessageCircle className="w-4 h-4 mr-2"/> Message</Button>
                                    {isFriend ? (
                                        <Button size="sm" className="rounded-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"><UserCheck className="w-4 h-4 mr-2"/> Friends</Button>
                                    ) : hasRequested ? (
                                        <Button size="sm" disabled className="rounded-full bg-zinc-100 text-zinc-400"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Requested</Button>
                                    ) : (
                                        <Button size="sm" className="rounded-full bg-black text-white hover:bg-zinc-800" onClick={handleConnect}><UserPlus className="w-4 h-4 mr-2"/> Connect</Button>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-4">
                            {/* SheetTitle is required here for accessibility */}
                            <SheetTitle className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                                {profile?.first_name} {profile?.last_name}
                                <span className="text-sm font-normal text-zinc-500">@{profile?.username}</span>
                            </SheetTitle>

                            <p className="text-zinc-500 text-sm mt-1">{profile?.profession || "Famiglia Member"}</p>
                            {!isEditing && profile?.bio && <p className="mt-3 text-zinc-700 text-sm leading-relaxed max-w-md">{profile.bio}</p>}
                        </div>

                        <div className="flex gap-6 mt-6 border-t border-zinc-100 pt-4">
                            <div className="text-center"><div className="font-bold text-lg">{posts.length}</div><div className="text-xs text-zinc-400 uppercase">Posts</div></div>
                            <div className="text-center"><div className="font-bold text-lg">{friends.length}</div><div className="text-xs text-zinc-400 uppercase">Friends</div></div>
                            <div className="text-center"><div className="font-bold text-lg">{businesses.length}</div><div className="text-xs text-zinc-400 uppercase">Pages</div></div>
                        </div>
                    </div>
                </div>

                {/* TABS SECTION */}
                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full grid grid-cols-5 mb-6 h-12 bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="content">Posts</TabsTrigger>
                            <TabsTrigger value="network">Friends</TabsTrigger>
                            <TabsTrigger value="business">Pages</TabsTrigger>
                            <TabsTrigger value="id">ID</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: ABOUT */}
                        <TabsContent value="about" className="space-y-6">
                            {isEditing && isOwner ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">First Name</label><Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Last Name</label><Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
                                    </div>
                                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Username</label><Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Bio</label><Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Profession</label><Input value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Location</label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500">Relationship Status</label>
                                        <Select value={formData.relationship_status} onValueChange={(val) => setFormData({...formData, relationship_status: val})}>
                                            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Complicated">It's Complicated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                                    <div className="grid grid-cols-2 gap-y-6">
                                        <div className="flex items-center gap-3 text-zinc-600"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Briefcase className="w-4 h-4"/></div><div className="text-sm"><span className="block text-xs text-zinc-400">Work</span>{profile?.profession || "Not set"}</div></div>
                                        <div className="flex items-center gap-3 text-zinc-600"><div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MapPin className="w-4 h-4"/></div><div className="text-sm"><span className="block text-xs text-zinc-400">Location</span>{profile?.location || "Global"}</div></div>
                                        <div className="flex items-center gap-3 text-zinc-600"><div className="bg-pink-100 p-2 rounded-lg text-pink-600"><Heart className="w-4 h-4"/></div><div className="text-sm"><span className="block text-xs text-zinc-400">Status</span>{profile?.relationship_status || "Private"}</div></div>
                                        <div className="flex items-center gap-3 text-zinc-600"><div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Calendar className="w-4 h-4"/></div><div className="text-sm"><span className="block text-xs text-zinc-400">Joined</span>{profile ? new Date(profile.created_at).getFullYear() : ''}</div></div>
                                    </div>
                                    {(profile?.website || profile?.instagram || profile?.twitter) && (
                                        <div className="pt-4 border-t border-zinc-100">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Socials</h4>
                                            <div className="flex gap-3">
                                                {profile.instagram && <Button size="icon" variant="outline" className="rounded-full hover:text-pink-600"><Instagram className="w-4 h-4"/></Button>}
                                                {profile.twitter && <Button size="icon" variant="outline" className="rounded-full hover:text-blue-400"><Twitter className="w-4 h-4"/></Button>}
                                                {profile.linkedin && <Button size="icon" variant="outline" className="rounded-full hover:text-blue-700"><Linkedin className="w-4 h-4"/></Button>}
                                                {profile.website && <Button size="icon" variant="outline" className="rounded-full hover:text-green-600"><LinkIcon className="w-4 h-4"/></Button>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB 2: CONTENT */}
                        <TabsContent value="content">
                            <div className="grid grid-cols-3 gap-2">
                                {posts.length === 0 ? <div className="col-span-3 py-10 text-center text-zinc-400"><Camera className="w-10 h-10 mx-auto mb-2 opacity-20"/><p>No posts yet.</p></div> : 
                                    posts.map(post => (
                                        <div key={post.id} className="aspect-square bg-zinc-100 rounded-xl overflow-hidden relative group border border-zinc-200">
                                            {post.media_url ? (
                                                post.media_type === 'video' ? <video src={post.media_url} className="w-full h-full object-cover"/> : <img src={post.media_url} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-white p-3 text-center"><div className="bg-zinc-100 p-2 rounded-full mb-2"><Edit3 className="w-4 h-4 text-zinc-600"/></div><p className="text-xs font-medium text-zinc-700 line-clamp-3">{post.content || "No content"}</p></div>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </TabsContent>

                        {/* TAB 3: NETWORK */}
                        <TabsContent value="network" className="space-y-6">
                            <div>
                                <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Friends ({friends.length})</h3>
                                {friends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100 mb-2">
                                        <div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={friend.avatar_url}/><AvatarFallback>{friend.username?.[0]}</AvatarFallback></Avatar><span className="font-bold text-sm">{friend.username}</span></div>
                                        {isOwner && <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500" onClick={() => {if(confirm("Remove friend?")) {/* Logic here */}}}><X className="w-4 h-4"/></Button>}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* TAB 4: BUSINESSES */}
                        <TabsContent value="business" className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <Store className="w-4 h-4"/> Business Pages
                                </h3>
                                {isOwner && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 text-xs rounded-full border-zinc-200"
                                        onClick={() => router.push('/business/create')}
                                    >
                                        <Plus className="w-3 h-3 mr-1"/> Create
                                    </Button>
                                )}
                            </div>

                            {businesses.length === 0 ? (
                                <div className="py-10 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
                                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                    <p className="text-sm">No business pages yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {businesses.map(biz => (
                                        <div 
                                            key={biz.id} 
                                            onClick={() => {
                                                onClose()
                                                router.push(`/business/${biz.id}`)
                                            }}
                                            className="flex items-center gap-4 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:shadow-md transition-all group"
                                        >
                                            <Avatar className="w-12 h-12 rounded-lg border border-zinc-100">
                                                <AvatarImage src={biz.logo_url} />
                                                <AvatarFallback className="rounded-lg">{biz.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-zinc-900 truncate">{biz.name}</h4>
                                                <p className="text-xs text-zinc-500 truncate">@{biz.handle} • {biz.category}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB 5: ID */}
                        <TabsContent value="id" className="space-y-6">
                            <div className="bg-zinc-900 text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                                <div className="relative z-10 bg-white p-4 rounded-2xl shadow-lg mb-4">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=famigliodoro://user/${targetId}&color=000000`} alt="QR Code" className="w-32 h-32"/>
                                </div>
                                <h3 className="text-xl font-bold text-yellow-400">{profile?.username}</h3>
                                <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Famiglia Doro Member</p>
                            </div>

                            {isOwner && (
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-red-100 p-2 rounded-full"><ShieldAlert className="w-6 h-6 text-red-600"/></div>
                                        <div>
                                            <h4 className="font-bold text-red-900">Danger Zone</h4>
                                            <p className="text-sm text-red-700/80 mb-4">Permanent action.</p>
                                            <Button variant="destructive" onClick={deleteAccount} className="w-full"><Trash2 className="w-4 h-4 mr-2"/> Delete My Account</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </>
        )}
      </SheetContent>
    </Sheet>
  )
}