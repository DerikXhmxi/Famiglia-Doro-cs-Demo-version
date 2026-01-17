import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Radio, Video, User, Loader2 } from 'lucide-react'
import LiveSession from './LiveSession' // The broadcaster (your camera)
import LiveViewer from './LiveViewer'   // The viewer (watching others)

export default function LiveDashboard({ session }: { session: any }) {
  const [activeStreams, setActiveStreams] = useState<any[]>([])
  const [mode, setMode] = useState<'lobby' | 'broadcasting' | 'watching'>('lobby')
  const [selectedStream, setSelectedStream] = useState<any>(null)

  // Listen for active streams
  useEffect(() => {
    fetchStreams()
    
    // Realtime listener for new streams
    const channel = supabase.channel('live_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
          fetchStreams()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchStreams() {
    // Get sessions and the profile info of the host
    const { data } = await supabase
        .from('live_sessions')
        .select('*, profiles(username, avatar_url)')
        .neq('user_id', session.user.id) // Don't show myself in the list
    
    if (data) setActiveStreams(data)
  }

  // MODES
  if (mode === 'broadcasting') {
      return (
          <div className="relative">
              <Button variant="outline" className="absolute top-4 left-4 z-10 bg-white/10 text-white border-none hover:bg-white/20" onClick={() => setMode('lobby')}>
                  ← Back to Lobby
              </Button>
              <LiveSession session={session} />
          </div>
      )
  }

  if (mode === 'watching' && selectedStream) {
      return <LiveViewer session={session} stream={selectedStream} onClose={() => { setMode('lobby'); setSelectedStream(null); }} />
  }

  // LOBBY MODE
  return (
    <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-lg shadow-indigo-200">
            <div>
                <h2 className="text-3xl font-bold mb-2">Go Live to the World</h2>
                <p className="text-indigo-100 mb-6 max-w-md">Share your moments, host events, or just hang out with friends in real-time.</p>
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-full px-8" onClick={() => setMode('broadcasting')}>
                    <Video className="w-5 h-5 mr-2" /> Start Streaming
                </Button>
            </div>
            <div className="hidden md:block">
                <Radio className="w-32 h-32 opacity-20" />
            </div>
        </div>

        {/* Active Streams Grid */}
        <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Now
            </h3>
            
            {activeStreams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <Radio className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500">No one is live right now.</p>
                    <p className="text-zinc-400 text-sm">Be the first to start the party!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeStreams.map((stream) => (
                        <Card 
                            key={stream.id} 
                            className="group cursor-pointer overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-300"
                            onClick={() => { setSelectedStream(stream); setMode('watching'); }}
                        >
                            {/* Fake Thumbnail (Uses Avatar bg) */}
                            <div className="h-40 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                                <img src={stream.profiles?.avatar_url} className="w-full h-full object-cover opacity-50 blur-sm group-hover:scale-110 transition-transform duration-700" />
                                <Avatar className="w-16 h-16 absolute ring-4 ring-white/20 z-10">
                                    <AvatarImage src={stream.profiles?.avatar_url} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 animate-pulse">
                                    LIVE
                                </div>
                            </div>
                            <div className="p-4 bg-white">
                                <h4 className="font-bold text-zinc-900 truncate">{stream.profiles?.username}</h4>
                                <p className="text-xs text-zinc-500">Click to join stream</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}