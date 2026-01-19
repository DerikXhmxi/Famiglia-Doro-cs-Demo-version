import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BadgeCheck, MapPin, Calendar, Loader2, Briefcase, Heart, Link as LinkIcon, 
  Instagram, Linkedin, Twitter, Grid, Film, Users, Trash2, QrCode, 
  Edit3, Save, X, ShieldAlert, Camera, Upload
} from 'lucide-react'

// ADDED: onProfileUpdate prop to trigger parent refresh
export default function ProfileSheet({ 
    isOpen, 
    onClose, 
    session,
    onProfileUpdate 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    session: any,
    onProfileUpdate?: () => void 
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  // --- DATA STATES ---
  const [profile, setProfile] = useState<any>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  
  // --- FORM STATE ---
  const [formData, setFormData] = useState<any>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && session?.user?.id) {
        fetchAllData()
    }
  }, [isOpen, session])

  async function fetchAllData() {
    setLoading(true)
    const userId = session.user.id

    // 1. Fetch Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
    
    // 2. Fetch Friends
    const { data: friendsData } = await supabase.from('friends')
        .select('*, user_a_profile:user_a(*), user_b_profile:user_b(*)')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    
    // 3. Fetch Groups
    const { data: groupsData } = await supabase.from('group_members')
        .select('*, groups(*)')
        .eq('user_id', userId)

    // 4. Fetch Content
    const { data: postsData } = await supabase.from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (profileData) {
        setProfile(profileData)
        setFormData(profileData)
        setPreviewUrl(profileData.avatar_url)
    }
    
    // Process Friends
    const processedFriends = friendsData?.map((f: any) => {
        return f.user_a === userId ? { ...f.user_b_profile, relationId: f.id } : { ...f.user_a_profile, relationId: f.id }
    }) || []

    setFriends(processedFriends)
    setGroups(groupsData?.map((g: any) => ({ ...g.groups, membershipId: g.id })) || [])
    setPosts(postsData || [])
    
    setLoading(false)
  }

  // --- HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0]
          setAvatarFile(file)
          setPreviewUrl(URL.createObjectURL(file)) // Show immediate preview
      }
  }

  const handleSave = async () => {
      setSaving(true)
      try {
          let finalAvatarUrl = formData.avatar_url

          // 1. Upload new image if selected
          if (avatarFile) {
              const fileName = `avatars/${session.user.id}_${Date.now()}`
              const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, avatarFile)
              if (uploadError) throw uploadError
              
              const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
              finalAvatarUrl = data.publicUrl
          }

          // 2. Update Public Profile Table
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

          // 3. IMPORTANT: Update Auth Metadata (Syncs with Header/Sidebar)
          const { error: authError } = await supabase.auth.updateUser({
            data: { 
                avatar_url: finalAvatarUrl,
                username: formData.username,
                full_name: `${formData.first_name} ${formData.last_name}`
            }
          })

          if (authError) throw authError

          // 4. Update Local & Parent State
          setProfile({ ...formData, avatar_url: finalAvatarUrl })
          setIsEditing(false)
          setAvatarFile(null)
          
          if (onProfileUpdate) onProfileUpdate() // Trigger Global Refresh

      } catch (err) {
          console.error("Error saving profile:", err)
          alert("Failed to save changes.")
      } finally {
          setSaving(false)
      }
  }

  const removeFriend = async (relationId: number) => {
      if(!confirm("Remove this friend?")) return
      await supabase.from('friends').delete().eq('id', relationId)
      setFriends(prev => prev.filter(f => f.relationId !== relationId))
  }

  const leaveGroup = async (membershipId: number) => {
      if(!confirm("Leave this group?")) return
      await supabase.from('group_members').delete().eq('id', membershipId)
      setGroups(prev => prev.filter(g => g.membershipId !== membershipId))
  }

  const deleteAccount = async () => {
      const confirmation = prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.")
      if (confirmation === 'DELETE') {
          await supabase.from('profiles').delete().eq('id', session.user.id)
          await supabase.auth.signOut()
          window.location.reload()
      }
  }

  if (!profile && loading) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] overflow-y-auto bg-zinc-50 p-0 border-l border-zinc-200">
        
        {/* --- HERO SECTION --- */}
        <div className="relative bg-white pb-6 border-b border-zinc-200">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 w-full relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>
            
            <div className="px-6 relative">
                {/* Avatar with Edit Overlay */}
                <div className="absolute -top-16 left-6 group">
                    <div className="relative">
                        <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg bg-white">
                            <AvatarImage src={previewUrl || profile?.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-zinc-200 text-zinc-500">
                                {profile?.first_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        
                        {/* Camera Overlay (Only in Edit Mode) */}
                        {isEditing && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}

                        {profile?.badge_tier === 'premium' && (
                            <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full ring-2 ring-white z-10" title="Verified Premium">
                                <BadgeCheck className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex justify-end pt-4 gap-2">
                    {isEditing ? (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setFormData(profile); setPreviewUrl(profile.avatar_url); setAvatarFile(null); }}>Cancel</Button>
                            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4 mr-2"/> Save</>}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsEditing(true)}>
                            <Edit3 className="w-4 h-4 mr-2"/> Edit Profile
                        </Button>
                    )}
                </div>

                {/* Name & Bio */}
                <div className="mt-4">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        {profile?.first_name} {profile?.last_name}
                        <span className="text-sm font-normal text-zinc-500">@{profile?.username}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">{profile?.profession || "Member"}</p>
                    
                    {!isEditing && profile?.bio && (
                        <p className="mt-3 text-zinc-700 text-sm leading-relaxed max-w-md">{profile.bio}</p>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6 mt-6 border-t border-zinc-100 pt-4">
                    <div className="text-center"><div className="font-bold text-lg">{posts.length}</div><div className="text-xs text-zinc-400 uppercase">Posts</div></div>
                    <div className="text-center"><div className="font-bold text-lg">{friends.length}</div><div className="text-xs text-zinc-400 uppercase">Friends</div></div>
                    <div className="text-center"><div className="font-bold text-lg">{groups.length}</div><div className="text-xs text-zinc-400 uppercase">Groups</div></div>
                </div>
            </div>
        </div>

        {/* --- TABS SECTION --- */}
        <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-6 h-12 bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="id">QR Code</TabsTrigger>
                </TabsList>

                {/* TAB 1: ABOUT (View & Edit) */}
                <TabsContent value="about" className="space-y-6">
                    {isEditing ? (
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

                            <div className="pt-4 border-t border-zinc-200">
                                <h4 className="text-sm font-bold text-zinc-900 mb-3">Social Links</h4>
                                <div className="space-y-3">
                                    <div className="relative"><Instagram className="absolute left-3 top-3 w-4 h-4 text-zinc-400"/><Input className="pl-10" placeholder="Instagram Username" value={formData.instagram || ''} onChange={e => setFormData({...formData, instagram: e.target.value})}/></div>
                                    <div className="relative"><Twitter className="absolute left-3 top-3 w-4 h-4 text-zinc-400"/><Input className="pl-10" placeholder="Twitter Username" value={formData.twitter || ''} onChange={e => setFormData({...formData, twitter: e.target.value})}/></div>
                                    <div className="relative"><LinkIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400"/><Input className="pl-10" placeholder="Website URL" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})}/></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div className="flex items-center gap-3 text-zinc-600">
                                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Briefcase className="w-4 h-4"/></div>
                                    <div className="text-sm"><span className="block text-xs text-zinc-400">Work</span>{profile.profession || "Not set"}</div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MapPin className="w-4 h-4"/></div>
                                    <div className="text-sm"><span className="block text-xs text-zinc-400">Location</span>{profile.location || "Earth"}</div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600">
                                    <div className="bg-pink-100 p-2 rounded-lg text-pink-600"><Heart className="w-4 h-4"/></div>
                                    <div className="text-sm"><span className="block text-xs text-zinc-400">Status</span>{profile.relationship_status || "Private"}</div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-600">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Calendar className="w-4 h-4"/></div>
                                    <div className="text-sm"><span className="block text-xs text-zinc-400">Joined</span>{new Date(profile.created_at).getFullYear()}</div>
                                </div>
                            </div>

                            {(profile.website || profile.instagram || profile.twitter) && (
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

                {/* TAB 2: CONTENT GRID */}
                <TabsContent value="content">
                    <div className="grid grid-cols-3 gap-2">
                        {posts.length === 0 ? (
                            <div className="col-span-3 py-10 text-center text-zinc-400">
                                <Film className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                <p>No posts yet.</p>
                            </div>
                        ) : (
                            posts.map(post => (
    <div key={post.id} className="aspect-square bg-zinc-100 rounded-xl overflow-hidden relative group border border-zinc-200">
        {post.media_url ? (
            // MEDIA POST
            post.media_type === 'video' ? (
                <video src={post.media_url} className="w-full border-black h-full object-cover"/>
            ) : (
                <img src={post.media_url} className="w-full border-black h-full object-cover"/>
            )
        ) : (
            // TEXT-ONLY POST (Updated Styling)
            <div className="w-full h-full flex border-black flex-col items-center justify-center bg-white p-3 text-center">
                <div className="bg-zinc-100 p-2 rounded-full mb-2">
                    <Edit3 className="w-4 h-4 text-zinc-600"/> 
                </div>
                <p className="text-xs font-medium  text-zinc-700 line-clamp-3">
                    {post.content || "No content"}
                </p>
            </div>
        )}
        
        {/* Icons Overlay */}
        {post.media_type === 'video' && <div className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><Film className="w-3 h-3 text-white"/></div>}
    </div>
))
                        )}
                    </div>
                </TabsContent>

                {/* TAB 3: NETWORK */}
                <TabsContent value="network" className="space-y-6">
                    <div>
                        <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Friends ({friends.length})</h3>
                        <div className="space-y-2">
                            {friends.length === 0 && <p className="text-sm text-zinc-400 italic">No friends added yet.</p>}
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10"><AvatarImage src={friend.avatar_url}/><AvatarFallback>{friend.username?.[0]}</AvatarFallback></Avatar>
                                        <span className="font-bold text-sm">{friend.username}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500" onClick={() => removeFriend(friend.relationId)}><X className="w-4 h-4"/></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2"><Grid className="w-4 h-4"/> Groups ({groups.length})</h3>
                        <div className="space-y-2">
                            {groups.length === 0 && <p className="text-sm text-zinc-400 italic">Not a member of any groups.</p>}
                            {groups.map(group => (
                                <div key={group.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <img src={group.image_url} className="w-10 h-10 rounded-lg bg-zinc-200 object-cover"/>
                                        <span className="font-bold text-sm">{group.name}</span>
                                    </div>
                                    <Button  variant="outline" className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => leaveGroup(group.membershipId)}>Leave</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 4: ID CARD (QR & SETTINGS) */}
                <TabsContent value="id" className="space-y-6">
                    <div className="bg-zinc-900 text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10 bg-white p-4 rounded-2xl shadow-lg mb-4">
                            {/* QR Code */}
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=famigliodoro://user/${profile.id}&color=000000`} 
                                alt="My QR Code" 
                                className="w-32 h-32"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-yellow-400">{profile.username}</h3>
                        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Famiglia Doro Member</p>
                        <p className="text-zinc-500 text-xs max-w-xs mx-auto">Scan this code to instantly add me as a friend.</p>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-100 p-2 rounded-full"><ShieldAlert className="w-6 h-6 text-red-600"/></div>
                            <div>
                                <h4 className="font-bold text-red-900">Danger Zone</h4>
                                <p className="text-sm text-red-700/80 mb-4">Deleting your account is permanent. All your data, posts, and friendships will be wiped.</p>
                                <Button variant="destructive" onClick={deleteAccount} className="w-full">
                                    <Trash2 className="w-4 h-4 mr-2"/> Delete My Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}