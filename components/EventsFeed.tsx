"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, MapPin, Plus, Loader2, Clock, CloudRain, 
  Upload, ArrowRight, Ticket, Minus, AlertCircle, Trash2, Edit, User 
} from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })
const MapViewer = dynamic(() => import('./MapViewer'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded-xl" /> 
})

export default function EventsFeed({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([])
  
  // Dialog & Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [checkoutEvent, setCheckoutEvent] = useState<any>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  
  // Logic States
  const [uploading, setUploading] = useState(false)
  const [ticketQty, setTicketQty] = useState(1)
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', 
    address: '', city: '', state: '', country: '', zip_code: '',
    latitude: null as number | null, longitude: null as number | null,
    start_date: '', start_time: '', end_time: '', 
    rain_date: '', rain_start_time: '', rain_end_time: '',
    imageFile: null as File | null
  })

  useEffect(() => {
    fetchEvents()
    const channel = supabase.channel('events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
        .from('events')
        .select('*, profiles:organizer_id(id, username, avatar_url)')
        .order('created_at', { ascending: false })
    
    if (data) setEvents(data)
  }

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, imageFile: e.target.files![0] }))
    }
  }

  const handleMapSelect = (data: any) => {
      setFormData(prev => ({
          ...prev,
          address: data.address, city: data.city, state: data.state,
          country: data.country, zip_code: data.zip_code,
          latitude: data.lat, longitude: data.lng
      }))
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.imageFile || !formData.start_date) {
        return alert("Please fill in required fields (Title, Image, Date)")
    }
    setUploading(true)

    try {
        const fileName = `events/${Date.now()}_${formData.imageFile.name.replace(/\s/g, '')}`
        await supabase.storage.from('uploads').upload(fileName, formData.imageFile)
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)

        const { error } = await supabase.from('events').insert({
            organizer_id: user.id,
            title: formData.title, description: formData.description,
            ticket_price: parseFloat(formData.price) || 0,
            image_url: urlData.publicUrl,
            address: formData.address, city: formData.city, state: formData.state, country: formData.country, zip_code: formData.zip_code,
            latitude: formData.latitude, longitude: formData.longitude,
            location: `${formData.city}, ${formData.state}`, 
            start_date: formData.start_date, start_time: formData.start_time, end_time: formData.end_time,
            rain_date: formData.rain_date || null
        })

        if (error) throw error

        setIsCreateOpen(false)
        setFormData({
            title: '', description: '', price: '', address: '', city: '', state: '', country: '', zip_code: '',
            latitude: null, longitude: null, start_date: '', start_time: '', end_time: '', rain_date: '', rain_start_time: '', rain_end_time: '',
            imageFile: null
        })
        fetchEvents()

    } catch (error) {
        console.error(error)
        alert("Failed to create event")
    } finally {
        setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure you want to cancel this event? This cannot be undone.")) return;
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) {
          setEvents(prev => prev.filter(e => e.id !== id));
          if(selectedEvent?.id === id) setSelectedEvent(null);
      }
  }

  return (
    <div className="space-y-6">
        
        {checkoutEvent && (
            <PaymentModal 
                isOpen={!!checkoutEvent} 
                onClose={() => setCheckoutEvent(null)} 
                item={checkoutEvent} 
                type="event" 
                session={{ user }} 
            />
        )}

        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2 text-zinc-900">
                <Calendar className="text-orange-600 w-5 h-5"/> Upcoming Events
            </h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                    <Button className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-md">
                        <Plus className="w-4 h-4 mr-2"/> Host Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {!isMapOpen ? (
                        <>
                        <DialogHeader><DialogTitle className="text-2xl font-bold">Host an Event</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-4">
                                <div className="p-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 text-center relative hover:bg-zinc-100 transition-colors">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                                        <Upload className="w-8 h-8"/>
                                        <span className="text-sm font-medium">{formData.imageFile ? formData.imageFile.name : "Upload Cover Image"}</span>
                                    </div>
                                </div>
                                <Input name="title" placeholder="Event Title *" value={formData.title} onChange={handleInputChange} className="font-bold text-lg bg-zinc-50 border-zinc-200" />
                                <Textarea name="description" placeholder="Description..." value={formData.description} onChange={handleInputChange} className="h-32 resize-none bg-zinc-50 border-zinc-200" />
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span>
                                    <Input name="price" type="number" placeholder="Ticket Price (0 for Free)" value={formData.price} onChange={handleInputChange} className="pl-7 bg-zinc-50 border-zinc-200"/>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-zinc-700">Location</h3>
                                        <Button size="sm" variant="outline" onClick={() => setIsMapOpen(true)} className="h-7 text-xs bg-white"><MapPin className="w-3 h-3 mr-1"/> Pick on Map</Button>
                                    </div>
                                    <Input name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} className="bg-white" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="bg-white" />
                                        <Input name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="bg-white" />
                                    </div>
                                </div>
                                <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                    <h3 className="text-sm font-bold text-zinc-700">Schedule</h3>
                                    <Input name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} className="bg-white" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input name="start_time" type="time" value={formData.start_time} onChange={handleInputChange} className="bg-white" />
                                        <Input name="end_time" type="time" value={formData.end_time} onChange={handleInputChange} className="bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleCreate} disabled={uploading} className="w-full mt-6 bg-orange-600 hover:bg-orange-700 font-bold h-12 text-white shadow-lg">
                            {uploading ? <Loader2 className="animate-spin"/> : "Publish Event"}
                        </Button>
                        </>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between mb-4 items-center">
                                <h3 className="font-bold text-lg">Pin Location</h3>
                                <Button size="sm" variant="ghost" onClick={() => setIsMapOpen(false)}>Back</Button>
                            </div>
                            <div className="h-[400px] rounded-xl overflow-hidden border border-zinc-200">
                                <MapPicker onLocationSelect={(data) => { handleMapSelect(data); setIsMapOpen(false); }} onClose={() => setIsMapOpen(false)} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            // SAFE CHECK: Ensure IDs match exactly
            const isOwner = user?.id === event.organizer_id
            
            return (
                <Card key={event.id} className="overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white group flex flex-col">
                    <div className="relative h-60 w-full overflow-hidden">
                        <img src={event.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 text-center min-w-[60px] shadow-sm">
                            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">{event.start_date ? new Date(event.start_date).toLocaleString('default', { month: 'short' }) : 'TBA'}</span>
                            <span className="block text-2xl font-black text-zinc-900 leading-none">{event.start_date ? new Date(event.start_date).getDate() : '--'}</span>
                        </div>
                        
                        <Badge className="absolute top-4 right-4 bg-black/60 text-white backdrop-blur-md border-none px-3 py-1">
                            {event.ticket_price > 0 ? `$${event.ticket_price}` : 'Free'}
                        </Badge>

                        {/* --- OWNER BADGE (FIXED) --- */}
                        {isOwner && (
                            <Badge className="absolute bottom-4 left-4 bg-orange-600 text-white border-none shadow-lg px-3 py-1.5 text-xs font-bold animate-in fade-in">
                                Your Event
                            </Badge>
                        )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-xl text-zinc-900 mb-1 line-clamp-1 leading-tight">{event.title}</h3>
                        
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar className="h-6 w-6 border border-zinc-100">
                                    <AvatarImage src={event.profiles?.avatar_url}/>
                                    <AvatarFallback className="text-[9px] bg-zinc-100 font-bold">{event.profiles?.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-zinc-500 font-medium truncate max-w-[120px]">
                                    {isOwner ? "Hosted by You" : event.profiles?.username || "Unknown Host"}
                                </span>
                            </div>
                            <span className="text-xs text-zinc-400 flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-full"><MapPin className="h-3 w-3" /> {event.city || 'Location TBA'}</span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-zinc-50">
                            {/* --- ACTION LOGIC (FIXED) --- */}
                            {isOwner ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 rounded-xl border-zinc-200 h-10 text-sm" onClick={() => alert("Edit coming soon")}>
                                        <Edit className="w-4 h-4 mr-2"/> Edit
                                    </Button>
                                    <Button variant="destructive" size="icon" className="rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 h-10 w-10" onClick={() => handleDelete(event.id)}>
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={() => { setSelectedEvent(event); setTicketQty(1); }} className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 shadow-sm transition-transform active:scale-95">Get Tickets</Button>
                            )}
                        </div>
                    </div>
                </Card>
            )
          })}
        </div>

        {/* --- FIXED EVENT DETAIL MODAL --- */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            {/* UPDATED: Much Wider Modal (max-w-[90vw] or max-w-7xl) */}
            <DialogContent className="max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden bg-white rounded-3xl border-none h-[90vh] flex flex-col md:flex-row">
                {selectedEvent && (() => {
                    const isOwner = user?.id === selectedEvent.organizer_id
                    return (
                        <>
                            {/* LEFT SIDE: Visuals & Map */}
                            <div className="w-full md:w-5/12 bg-zinc-900 flex flex-col relative h-48 md:h-full">
                                <div className="h-full md:h-1/2 relative overflow-hidden group">
                                    <img src={selectedEvent.image_url} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent flex items-end p-8">
                                        <div>
                                            <Badge className="bg-orange-500 border-none mb-3 px-3 py-1 text-xs">{selectedEvent.ticket_price > 0 ? `$${selectedEvent.ticket_price}` : 'Free Entry'}</Badge>
                                            <h2 className="font-bold text-3xl text-white leading-tight shadow-sm">{selectedEvent.title}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block h-1/2 relative border-t border-white/10 bg-zinc-800">
                                    {selectedEvent.latitude ? (
                                        <MapViewer lat={selectedEvent.latitude} lng={selectedEvent.longitude} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-zinc-500 flex-col">
                                            <MapPin className="w-12 h-12 mb-2 opacity-20"/>
                                            <span className="text-sm font-medium">Map View Unavailable</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT SIDE: Details */}
                            <div className="w-full md:w-7/12 flex flex-col bg-white h-full">
                                <div className="flex-1 p-8 md:p-10 overflow-y-auto">
                                    
                                    {/* Verified Host Header */}
                                    <div className="flex items-center gap-4 mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-white">
                                            <AvatarImage src={selectedEvent.profiles?.avatar_url}/>
                                            <AvatarFallback className="bg-zinc-200 font-bold text-zinc-500">
                                                {selectedEvent.profiles?.username?.[0] || <User className="w-6 h-6"/>}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-base font-bold text-zinc-900">{isOwner ? "You (Organizer)" : selectedEvent.profiles?.username}</p>
                                            <p className="text-xs text-zinc-400 font-medium">Verified Host</p>
                                        </div>
                                        {isOwner && <Badge variant="outline" className="ml-auto border-orange-200 text-orange-600 bg-orange-50">You Own This Event</Badge>}
                                    </div>

                                    {/* Date & Time Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100/50">
                                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Date</p>
                                            <p className="font-bold text-zinc-900 flex items-center gap-2 text-lg">
                                                <Calendar className="w-5 h-5 text-orange-600"/> 
                                                {new Date(selectedEvent.start_date).toDateString()}
                                            </p>
                                        </div>
                                        <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100/50">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Time</p>
                                            <p className="font-bold text-zinc-900 flex items-center gap-2 text-lg">
                                                <Clock className="w-5 h-5 text-indigo-600"/> 
                                                {selectedEvent.start_time?.slice(0,5)}
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-xl mb-3 text-zinc-900">About Event</h3>
                                    <p className="text-zinc-500 leading-relaxed text-sm whitespace-pre-wrap mb-6">
                                        {selectedEvent.description || "No description provided by the organizer."}
                                    </p>

                                    <div className="md:hidden bg-zinc-50 p-4 rounded-2xl mb-6">
                                        <p className="font-bold text-sm text-zinc-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500"/> {selectedEvent.address}</p>
                                        <p className="text-xs text-zinc-500 pl-6">{selectedEvent.city}, {selectedEvent.state}</p>
                                    </div>
                                </div>

                                {/* Sticky Footer */}
                                <div className="p-8 bg-white border-t border-zinc-100 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] z-10">
                                    {isOwner ? (
                                        <div className="flex gap-4">
                                            <Button variant="outline" className="flex-1 h-14 rounded-2xl text-base font-bold border-zinc-200 hover:bg-zinc-50" onClick={() => alert("Edit coming soon")}>
                                                <Edit className="w-5 h-5 mr-2"/> Edit Details
                                            </Button>
                                            <Button variant="destructive" className="flex-1 h-14 rounded-2xl text-base font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all" onClick={() => handleDelete(selectedEvent.id)}>
                                                <Trash2 className="w-5 h-5 mr-2"/> Cancel Event
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-sm" onClick={() => setTicketQty(Math.max(1, ticketQty - 1))}><Minus className="w-4 h-4"/></Button>
                                                    <span className="font-bold w-8 text-center text-lg">{ticketQty}</span>
                                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-sm" onClick={() => setTicketQty(ticketQty + 1)}><Plus className="w-4 h-4"/></Button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Amount</p>
                                                    <p className="text-3xl font-black text-zinc-900 tracking-tight">${(selectedEvent.ticket_price * ticketQty).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                className="w-full h-16 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xl shadow-xl shadow-zinc-200 transition-transform active:scale-[0.98]" 
                                                onClick={() => setCheckoutEvent({ ...selectedEvent, price: selectedEvent.ticket_price * ticketQty, name: `${selectedEvent.title} (${ticketQty} Tix)` })}
                                            >
                                                Proceed to Payment <ArrowRight className="w-6 h-6 ml-2 opacity-50"/>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )
                })()}
            </DialogContent>
        </Dialog>
    </div>
  )
}