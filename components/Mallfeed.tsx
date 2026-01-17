import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ShoppingBag, MessageCircle, Plus, Loader2 } from 'lucide-react'

// Updated Interface: onChat now expects a User object, not void
export default function MallFeed({ onChat, session }: { onChat: (seller: any) => void, session: any }) {
  const [products, setProducts] = useState<any[]>([])
  
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
    
    // Realtime Listener
    const channel = supabase.channel('mall_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, async (payload) => {
          // Fetch the seller details for the new product immediately
          const { data } = await supabase.from('products').select('*, profiles:seller_id(id, username, avatar_url)').eq('id', payload.new.id).single()
          if (data) setProducts(prev => [data, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchProducts() {
    // JOIN QUERY: Fetch Product + Seller Profile info (username, avatar)
    const { data, error } = await supabase
        .from('products')
        .select('*, profiles:seller_id(id, username, avatar_url)')
        .order('created_at', { ascending: false })
    
    if (data) setProducts(data)
  }

  const handleCreateProduct = async () => {
    if (!newName || !newPrice || !imageFile) return
    setUploading(true)

    const fileName = `products/${Date.now()}_${imageFile.name}`
    const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, imageFile)
    
    if (uploadError) {
        alert("Upload Error: " + uploadError.message)
        setUploading(false)
        return
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
        
    await supabase.from('products').insert({
        name: newName,
        price: parseFloat(newPrice),
        image_url: urlData.publicUrl,
        seller_id: session.user.id
    })

    setIsDialogOpen(false)
    setNewName('')
    setNewPrice('')
    setImageFile(null)
    // No need to fetch, realtime handles it
    setUploading(false)
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="text-pink-600"/> Marketplace</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="rounded-full bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4 mr-2"/> Sell Item</Button></DialogTrigger>
                <DialogContent>
                    <DialogTitle>List Item for Sale</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <Input placeholder="Product Name" value={newName} onChange={e => setNewName(e.target.value)} />
                        <Input type="number" placeholder="Price ($)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                        <div className="flex items-center gap-2 border rounded-xl p-3 bg-zinc-50">
                             <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button onClick={handleCreateProduct} disabled={uploading} className="w-full bg-pink-600 hover:bg-pink-700">
                            {uploading ? <Loader2 className="animate-spin mr-2"/> : "List Item"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {products.length === 0 && (
            <div className="p-10 text-center text-zinc-400 bg-white rounded-3xl border border-dashed border-zinc-200">
                No products found. Be the first to sell something!
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-lg transition-all bg-white">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className="absolute top-3 right-3 bg-white text-zinc-900 shadow-sm hover:bg-white">${product.price}</Badge>
                </div>
                
                <div className="p-5">
                    <h3 className="font-bold text-zinc-900 truncate">{product.name}</h3>
                    <p className="text-xs text-zinc-500 mb-4 flex items-center gap-1">
                        Seller: <span className="font-bold">{product.profiles?.username || 'Unknown'}</span>
                    </p>
                    
                    <div className="flex gap-2">
                        <Button className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white">
                            Buy Now
                        </Button>
                        {/* FIX: Pass the Seller Profile to onChat */}
                        {product.seller_id !== session.user.id && (
                            <Button variant="outline" size="icon" className="rounded-xl border-zinc-200" onClick={() => onChat(product.profiles)}>
                                <MessageCircle className="h-4 w-4 text-zinc-600" />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        ))}
        </div>
    </div>
  )
}