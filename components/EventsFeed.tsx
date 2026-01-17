import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, Plus, Loader2 } from 'lucide-react'

export default function EventsFeed({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form State
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchEvents()
    
    // Realtime Listener
    const channel = supabase.channel('events_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
          console.log("New Event Received:", payload.new) // DEBUG LOG
          setEvents(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchEvents() {
    console.log("Fetching events...") // DEBUG LOG
    const { data, error } = await supabase.from('events').select('*')
    
    if (error) {
        console.error("Supabase Error:", error) // THIS WILL SHOW YOU THE ERROR
        alert("Error fetching events: " + error.message)
    } else {
        console.log("Events Data:", data) // THIS WILL SHOW YOU THE DATA
        if (data) setEvents(data)
    }
  }

  const handleCreate = async () => {
    if (!title || !imageFile) return
    setUploading(true)

    const fileName = `events/${Date.now()}_${imageFile.name}`
    const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, imageFile)
    
    if (uploadError) {
        alert("Upload Error: " + uploadError.message)
        setUploading(false)
        return
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
    
    const { error: insertError } = await supabase.from('events').insert({
        title,
        location,
        ticket_price: parseFloat(price) || 0,
        date: date || new Date().toISOString(),
        image_url: urlData.publicUrl
    })

    if (insertError) {
        alert("Insert Error: " + insertError.message)
    } else {
        setIsDialogOpen(false)
        setTitle(''); setLocation(''); setPrice(''); setImageFile(null);
        fetchEvents() // Force refresh
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2"><Calendar className="text-orange-600"/> Upcoming Events</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="rounded-full bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-2"/> Add Event</Button></DialogTrigger>
                <DialogContent>
                    <DialogTitle>Host an Event</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <Input placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} />
                        <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        <Input type="number" placeholder="Price ($)" value={price} onChange={e => setPrice(e.target.value)} />
                        <div className="flex items-center gap-2 border rounded-xl p-3 bg-zinc-50">
                             <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button onClick={handleCreate} disabled={uploading} className="w-full bg-orange-600 hover:bg-orange-700">
                            {uploading ? <Loader2 className="animate-spin mr-2"/> : "Publish Event"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {events.length === 0 && <div className="p-10 text-center text-zinc-400">No events found in database.</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-lg transition-all group bg-white">
                <div className="relative h-48">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1 text-center min-w-[60px]">
                        <span className="block text-xs font-bold text-red-500 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="block text-xl font-black text-zinc-900">{new Date(event.date).getDate()}</span>
                    </div>
                </div>
                <div className="p-5">
                    <h3 className="font-bold text-lg text-zinc-900 mb-1">{event.title}</h3>
                    <div className="flex items-center text-zinc-500 text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1" /> {event.location}
                    </div>
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                            {event.ticket_price > 0 ? `$${event.ticket_price}` : 'Free Entry'}
                        </Badge>
                        <Button className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white">Get Tickets</Button>
                    </div>
                </div>
            </Card>
          ))}
        </div>
    </div>
  )
}