"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Upload, Briefcase, Globe, Mail, Loader2, ArrowLeft, Camera } from 'lucide-react'

export default function CreateBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    category: '',
    description: '',
    email: '',
    website: '',
    logoFile: null as File | null,
    bannerFile: null as File | null
  })

  // --- HANDLERS ---
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files?.[0]) {
        setFormData(prev => ({ ...prev, [type === 'logo' ? 'logoFile' : 'bannerFile']: e.target.files![0] }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.handle || !formData.category) return alert("Please fill required fields.")
    
    setLoading(true)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        // 1. Upload Images (if any)
        let logoUrl = null
        let bannerUrl = null

        if (formData.logoFile) {
            const fileName = `biz_logos/${Date.now()}_${formData.logoFile.name.replace(/\s/g, '')}`
            await supabase.storage.from('uploads').upload(fileName, formData.logoFile)
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
            logoUrl = data.publicUrl
        }

        if (formData.bannerFile) {
            const fileName = `biz_banners/${Date.now()}_${formData.bannerFile.name.replace(/\s/g, '')}`
            await supabase.storage.from('uploads').upload(fileName, formData.bannerFile)
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
            bannerUrl = data.publicUrl
        }

        // 2. Insert Business Record
        const { data, error } = await supabase.from('businesses').insert({
            owner_id: user.id,
            name: formData.name,
            handle: formData.handle.toLowerCase().replace(/\s/g, ''),
            category: formData.category,
            description: formData.description,
            contact_email: formData.email,
            website: formData.website,
            logo_url: logoUrl,
            banner_url: bannerUrl
        }).select().single()

        if (error) throw error

        // 3. Redirect to new Business Page
        router.push(`/business/${data.id}`)

    } catch (err: any) {
        console.error(err)
        alert("Failed to create page: " + err.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5"/></Button>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900">Create Business Page</h1>
                    <p className="text-zinc-500">Establish your commercial presence on Famiglia Oro.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* LEFT COL: VISUALS */}
                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 text-center shadow-sm">
                        <div className="relative w-32 h-32 mx-auto bg-zinc-100 rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden group cursor-pointer mb-4">
                            <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => handleFile(e, 'logo')} accept="image/*" />
                            {formData.logoFile ? (
                                <img src={URL.createObjectURL(formData.logoFile)} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-10 h-10 text-zinc-300"/>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white"/>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Brand Logo</p>
                    </div>

                    {/* Banner Upload */}
                    <div className="bg-white p-1 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden group relative h-40 cursor-pointer">
                        <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => handleFile(e, 'banner')} accept="image/*" />
                        {formData.bannerFile ? (
                            <img src={URL.createObjectURL(formData.bannerFile)} className="w-full h-full object-cover rounded-[20px]" />
                        ) : (
                            <div className="w-full h-full bg-zinc-100 rounded-[20px] flex flex-col items-center justify-center text-zinc-400">
                                <Upload className="w-6 h-6 mb-2"/>
                                <span className="text-xs font-bold">Upload Cover Banner</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: DETAILS FORM */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Business Name</label>
                                <Input placeholder="e.g. Oro Coffee Co." className="h-12 rounded-xl font-bold text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Handle (@)</label>
                                <Input placeholder="orocoffee" className="h-12 rounded-xl" value={formData.handle} onChange={e => setFormData({...formData, handle: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Category</label>
                            <Select onValueChange={(val) => setFormData({...formData, category: val})}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Select Business Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Retail">Retail & Shopping</SelectItem>
                                    <SelectItem value="Food">Food & Beverage</SelectItem>
                                    <SelectItem value="Service">Professional Services</SelectItem>
                                    <SelectItem value="Entertainment">Entertainment & Events</SelectItem>
                                    <SelectItem value="Tech">Technology & Startups</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Description</label>
                            <Textarea placeholder="Tell us about your business..." className="h-32 rounded-xl resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Contact Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400"/>
                                    <Input placeholder="contact@business.com" className="h-11 rounded-xl pl-9" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400"/>
                                    <Input placeholder="https://..." className="h-11 rounded-xl pl-9" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleSubmit} disabled={loading} className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-lg shadow-lg mt-4">
                            {loading ? <Loader2 className="animate-spin mr-2"/> : "Launch Business Page"}
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}