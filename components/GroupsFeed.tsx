import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, MessageCircle } from 'lucide-react'

export default function GroupsFeed({ session, onChat }: { session: any, onChat: (group: any) => void }) {
  const [groups, setGroups] = useState<any[]>([])
  const [myGroupIds, setMyGroupIds] = useState<Set<number>>(new Set())
  const [newGroupName, setNewGroupName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => { 
    fetchGroups() 
    const channel = supabase.channel('groups_realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, (payload) => { setGroups((prev) => [...prev, payload.new]) }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchGroups() {
    const { data: allGroups } = await supabase.from('groups').select('*')
    if (allGroups) setGroups(allGroups)
    const { data: members } = await supabase.from('group_members').select('group_id').eq('user_id', session.user.id)
    if (members) setMyGroupIds(new Set(members.map(m => m.group_id)))
  }

  const createGroup = async () => {
    if (!newGroupName) return
    const { data } = await supabase.from('groups').insert({ name: newGroupName, image_url: `https://ui-avatars.com/api/?name=${newGroupName}&background=FACC15&color=000` }).select().single()
    if (data) { await joinGroup(data.id); setNewGroupName(''); setIsDialogOpen(false) }
  }

  const joinGroup = async (groupId: number) => {
    setMyGroupIds(prev => new Set(prev).add(groupId))
    await supabase.from('group_members').insert({ group_id: groupId, user_id: session.user.id })
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2 text-zinc-800"><Users className="text-yellow-500"/> Communities</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="rounded-full bg-zinc-900 hover:bg-black text-white"><Plus className="w-4 h-4 mr-2 text-yellow-400"/> Create Group</Button></DialogTrigger>
                <DialogContent>
                    <DialogTitle>Create New Group</DialogTitle>
                    <Input placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="focus-visible:ring-yellow-400"/>
                    <Button onClick={createGroup} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold">Create</Button>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
                const isMember = myGroupIds.has(group.id)
                return (
                    <Card key={group.id} className="p-5 flex items-center gap-4 rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow group-hover:ring-1 ring-yellow-400/50 bg-white">
                        <img src={group.image_url} className="w-16 h-16 rounded-2xl object-cover border border-zinc-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-zinc-900">{group.name}</h3>
                            <p className="text-xs text-zinc-500">{isMember ? "Member" : "Public Community"}</p>
                        </div>
                        {isMember ? (
                            <Button variant="secondary" className="rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700" onClick={() => onChat(group)}>
                                <MessageCircle className="w-4 h-4 mr-2"/> Chat
                            </Button>
                        ) : (
                            <Button variant="outline" className="rounded-full border-zinc-200 text-zinc-600 hover:border-yellow-400 hover:text-black" onClick={() => joinGroup(group.id)}>
                                Join
                            </Button>
                        )}
                    </Card>
                )
            })}
        </div>
    </div>
  )
}