"use client"

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import '@/lib/i18n'
import {
  X, Eye, Bell, Lock, Wifi, CreditCard, Users, FileText,
  ChevronRight, ChevronLeft, Camera, Search, Mic, MapPin,
  PlusCircle, Ban, Check, LogOut, DollarSign,
  ArrowUpRight, ArrowDownLeft, Trash2, Loader2, Globe,
  ShoppingBag, Ticket, Receipt,
  TrendingUp
} from 'lucide-react'

import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from 'react-i18next'

// INTERNAL CUSTOM MODAL ---
function CustomModal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 bg-zinc-50 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

// --- 1. VISIBILITY SETTINGS ---
function VisibilitySettings({ session }: { session: any }) {
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('status').eq('id', session.user.id).single()
      if (data) setIsActive(data.status === 'online')
    }
    load()
  }, [])

  const toggleVisibility = async (checked: boolean) => {
      setIsActive(checked);
      setLoading(true)
      await supabase.from('profiles').update({ status: checked ? 'online' : 'offline' }).eq('id', session.user.id)
      setLoading(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-800 p-5 rounded-2xl flex items-center justify-between text-white shadow-lg border border-zinc-700">
        <div>
          <h3 className="font-bold text-base mb-1">Active Status</h3>
          <p className="text-xs text-zinc-400">
            {isActive ? "You are currently visible to everyone." : "You are hidden. You won't appear in 'Active Now'."}
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={toggleVisibility} disabled={loading} className="data-[state=checked]:bg-green-500 border-2 border-zinc-600" />
      </div>
    </div>
  )
}

// --- 2. LANGUAGE SETTINGS ---
function LanguageSettings() {
    const { i18n, t } = useTranslation(); // Use the hook
    
    // Fallback if i18n isn't ready yet
    if (!i18n) return null;

    const currentLang = i18n.language || 'en';
    
    const LANGUAGES = [
      { code: 'en', name: 'English (US)', flag: '🇺🇸' },
      { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'ur', name: 'اردو', flag: '🇵🇰' },
      { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
      { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
      { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
    ];

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
        // Handle Right-to-Left for Arabic/Urdu
        document.dir = (code === 'ar' || code === 'ur') ? 'rtl' : 'ltr';
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Translated Header */}
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 mb-2">{t('app_language') || 'App Language'}</h3>
            <div className="bg-zinc-800 rounded-2xl overflow-hidden text-white divide-y divide-zinc-700/50 shadow-lg border border-zinc-700">
                {LANGUAGES.map((lang) => (
                    <div 
                        key={lang.code} 
                        onClick={() => handleLanguageChange(lang.code)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-medium text-sm">{lang.name}</span>
                        </div>
                        {currentLang === lang.code && <Check className="w-5 h-5 text-green-500" />}
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- 3. NOTIFICATION SETTINGS ---
function NotificationSettings({ session }: { session: any }) {
  const [settings, setSettings] = useState({ messages: false, activity: true, offers: false, sounds: true })
  
  useEffect(() => {
      const load = async () => {
          const { data, error } = await supabase.from('user_settings').select('notifications').eq('user_id', session.user.id).single()
          if (data?.notifications) setSettings(data.notifications)
          else if (error && error.code === 'PGRST116') await supabase.from('user_settings').insert({ user_id: session.user.id })
      }
      load()
  }, [])

  const toggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    await supabase.from('user_settings').update({ notifications: newSettings }).eq('user_id', session.user.id)
  }

  return (
    <div className="bg-zinc-800 rounded-2xl overflow-hidden text-white divide-y divide-zinc-700/50 shadow-lg border border-zinc-700 animate-in fade-in">
      {Object.keys(settings).map((key) => (
        <div key={key} className="p-5 flex items-center justify-between capitalize">
          <span className="text-sm font-medium">{key.replace(/_/g, ' ')}</span>
          <Switch checked={settings[key as keyof typeof settings]} onCheckedChange={() => toggle(key as any)} className="data-[state=checked]:bg-green-500" />
        </div>
      ))}
    </div>
  )
}

// --- 4. PERMISSIONS ---
function PermissionsSettings({ session }: { session: any }) {
  const [perms, setPerms] = useState({ location: false, contacts: false, camera: false, mic: false })

  useEffect(() => {
      const load = async () => {
          const { data } = await supabase.from('user_settings').select('permissions').eq('user_id', session.user.id).single()
          if (data?.permissions) setPerms(data.permissions)
      }
      load()
  }, [])

  const toggle = async (key: string) => {
      const newPerms = { ...perms, [key as keyof typeof perms]: !perms[key as keyof typeof perms] }
      setPerms(newPerms)
      await supabase.from('user_settings').update({ permissions: newPerms }).eq('user_id', session.user.id)
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-zinc-800 rounded-2xl overflow-hidden text-white divide-y divide-zinc-700/50 shadow-lg border border-zinc-700">
        {Object.keys(perms).map((key) => (
            <div key={key} className="p-5 flex items-center justify-between capitalize">
            <div className="flex items-center gap-3">
                {key === 'camera' && <Camera className="w-4 h-4 text-zinc-400"/>}
                {key === 'mic' && <Mic className="w-4 h-4 text-zinc-400"/>}
                {key === 'location' && <MapPin className="w-4 h-4 text-zinc-400"/>}
                {key === 'contacts' && <Users className="w-4 h-4 text-zinc-400"/>}
                <span className="text-sm font-medium">{key} Access</span>
            </div>
            <Switch checked={perms[key as keyof typeof perms]} onCheckedChange={() => toggle(key)} className="data-[state=checked]:bg-green-500" />
            </div>
        ))}
        </div>
    </div>
  )
}

// --- 5. MEDIA PREFERENCES ---
function MediaPreferences({ session }: { session: any }) {
  const [prefs, setPrefs] = useState({ autoplay: "wifi_mobile", photo_quality: "high", video_quality: "optimized" })

  useEffect(() => {
      supabase.from('user_settings').select('media_prefs').eq('user_id', session.user.id).single().then(({ data }) => {
          if (data?.media_prefs) setPrefs(data.media_prefs)
      })
  }, [])

  const updatePref = async (category: string, value: string) => {
      const newPrefs = { ...prefs, [category]: value }
      setPrefs(newPrefs)
      await supabase.from('user_settings').update({ media_prefs: newPrefs }).eq('user_id', session.user.id)
  }

  const OptionGroup = ({ title, cat, options }: any) => (
    <div className="mb-8">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 ml-1">{title}</h3>
        <div className="bg-zinc-800 rounded-2xl overflow-hidden text-white divide-y divide-zinc-700/50 shadow-sm border border-zinc-700">
            {options.map((opt: any) => (
                <div key={opt.val} onClick={() => updatePref(cat, opt.val)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-700/50 transition-colors">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {prefs[cat as keyof typeof prefs] === opt.val && <Check className="w-4 h-4 text-yellow-400" />}
                </div>
            ))}
        </div>
    </div>
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
        <OptionGroup title="Autoplay Options" cat="autoplay" options={[{ label: "On Wi-fi and mobile data", val: "wifi_mobile" }, { label: "On Wi-Fi only", val: "wifi" }, { label: "Never autoplay", val: "never" }]} />
        <OptionGroup title="Photo Quality" cat="photo_quality" options={[{ label: "High", val: "high" }, { label: "Medium", val: "medium" }, { label: "Low", val: "low" }]} />
        <OptionGroup title="Video Quality" cat="video_quality" options={[{ label: "Optimized quality", val: "optimized" }, { label: "Lowest-quality video", val: "lowest" }]} />
    </div>
  )
}

// --- 6. MANAGE REVENUE ---
 function ManageRevenue({ session }: { session: any }) {
    const [balance, setBalance] = useState(0.00)
    const [transactions, setTransactions] = useState<any[]>([])
    const [isWithdrawing, setIsWithdrawing] = useState(false)

    useEffect(() => {
        if (session?.user?.id) fetchFinancials()
    }, [session?.user?.id])

    const fetchFinancials = async () => {
        // 1. Get Income (Sales where I am the seller)
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('seller_id', session.user.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })

        // 2. Get Expenses (Withdrawals where I am the user)
        const { data: payouts } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('type', 'out')
            .order('created_at', { ascending: false })

        // 3. Format & Merge Data
        const incomeItems = orders?.map(o => ({
            id: `sale-${o.id}`,
            title: `Sold: ${o.item_name || 'Product'}`,
            amount: parseFloat(o.amount),
            date: o.created_at,
            type: 'in'
        })) || []

        const expenseItems = payouts?.map(p => ({
            id: `payout-${p.id}`,
            title: p.title || 'Withdrawal',
            amount: -Math.abs(parseFloat(p.amount)),
            date: p.created_at,
            type: 'out'
        })) || []

        // Combine and Sort by Date (Newest First)
        const allActivity = [...incomeItems, ...expenseItems].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setTransactions(allActivity)

        // 4. Calculate Total Balance
        const total = allActivity.reduce((acc, curr) => acc + curr.amount, 0)
        setBalance(total)
    }

    const handleWithdraw = async () => {
        if (balance <= 0) return
        setIsWithdrawing(true)
        
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 1500)) 

        // Insert Withdrawal Record
        const { data, error } = await supabase.from('transactions')
            .insert({ 
                user_id: session.user.id, 
                title: "Payout to Bank", 
                amount: -balance, 
                type: 'out' 
            })
            .select()
            .single()

        if (!error && data) { 
            await fetchFinancials() // Refresh list
            alert("Funds withdrawn successfully!") 
        } else {
            alert("Withdrawal failed")
        }
        setIsWithdrawing(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-8 text-zinc-900 shadow-xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 bg-white/20 w-40 h-40 rounded-full blur-3xl group-hover:bg-white/30 transition-all"/>
                
                <div className="relative z-10">
                    <p className="text-sm font-bold opacity-80 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4"/> Available Balance
                    </p>
                    <h2 className="text-6xl font-black tracking-tighter mb-8">
                        ${balance.toFixed(2)}
                    </h2>
                    <Button 
                        onClick={handleWithdraw} 
                        disabled={balance <= 0 || isWithdrawing} 
                        className="bg-zinc-900/90 hover:bg-black text-white rounded-xl w-full h-14 text-lg font-bold shadow-lg transition-transform active:scale-[0.98]"
                    >
                        {isWithdrawing ? <Loader2 className="animate-spin mr-2"/> : "Withdraw Funds"}
                    </Button>
                </div>
            </div>

            {/* Transactions List */}
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-zinc-900">Recent Activity</h3>
                    <span className="text-xs text-zinc-400">{transactions.length} transactions</span>
                </div>
                
                <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm min-h-[200px]">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-sm">
                            <TrendingUp className="w-8 h-8 mb-2 opacity-20"/>
                            No sales or withdrawals yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-50">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${tx.type === 'in' ? 'bg-green-100 text-green-600 group-hover:bg-green-200' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                                            {tx.type === 'in' ? <ArrowDownLeft className="w-6 h-6"/> : <ArrowUpRight className="w-6 h-6"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 text-sm">{tx.title}</p>
                                            <p className="text-xs text-zinc-400 font-medium">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold font-mono ${tx.type === 'in' ? 'text-green-600' : 'text-zinc-900'}`}>
                                        {tx.type === 'in' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// --- 7. MY CARDS ---
function MyCards({ session }: { session: any }) {
  const [cards, setCards] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVC, setCardCVC] = useState('')
  const [cardType, setCardType] = useState<'Visa' | 'Mastercard'>('Visa')

  useEffect(() => {
      const fetchCards = async () => {
          const { data } = await supabase.from('cards').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
          if (data) setCards(data)
      }
      fetchCards()
  }, [])

  useEffect(() => {
      if (cardNumber.startsWith('4')) setCardType('Visa')
      else if (cardNumber.startsWith('5')) setCardType('Mastercard')
  }, [cardNumber])

  const formatCardNumber = (val: string) => val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 19)
  const formatExpiry = (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').slice(0, 5)

  const addCard = async () => {
      if(cardNumber.length < 16 || !cardName || !cardExpiry || !cardCVC) return alert("Please fill all details")
      
      const { data, error } = await supabase.from('cards').insert({
          user_id: session.user.id,
          card_type: cardType,
          last_4: cardNumber.replace(/\s/g, '').slice(-4),
          card_color: cards.length % 2 === 0 ? 'black' : 'white'
      }).select().single()

      if (data) {
          setCards([data, ...cards])
          setIsDialogOpen(false)
          setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCVC('')
      }
  }

  const deleteCard = async (id: number) => {
      if(confirm("Remove this payment method?")) {
          await supabase.from('cards').delete().eq('id', id)
          setCards(cards.filter(c => c.id !== id))
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CustomModal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Add Payment Method">
            <div className="mb-6 w-full aspect-[1.58/1] rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between bg-zinc-900 text-white transition-all">
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <span className="font-bold tracking-wider">{cardType}</span>
                    <Wifi className="w-6 h-6 rotate-90 text-white/50" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="font-mono text-xl tracking-widest drop-shadow-md">{cardNumber || '0000 0000 0000 0000'}</div>
                    <div className="flex justify-between items-end">
                        <div><div className="text-[8px] uppercase opacity-50 tracking-wider">Card Holder</div><div className="font-bold text-sm tracking-wide uppercase truncate max-w-[150px]">{cardName || 'YOUR NAME'}</div></div>
                        <div><div className="text-[8px] uppercase opacity-50 tracking-wider">Expires</div><div className="font-bold text-sm tracking-wide">{cardExpiry || 'MM/YY'}</div></div>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="bg-white h-11 font-mono border-zinc-200" maxLength={19} />
                <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Full Name" className="bg-white h-11 border-zinc-200" />
                <div className="flex gap-3">
                    <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="bg-white h-11 text-center border-zinc-200" maxLength={5} />
                    <Input value={cardCVC} onChange={e => setCardCVC(e.target.value.replace(/\D/g, ''))} placeholder="CVC" className="bg-white h-11 text-center border-zinc-200" maxLength={3} type="password" />
                </div>
                <Button className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl mt-2" onClick={addCard}>Save Securely</Button>
            </div>
      </CustomModal>

      <button onClick={() => setIsDialogOpen(true)} className="w-full h-20 border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-400 hover:text-zinc-800 transition-all font-bold group">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-yellow-400 transition-colors"><PlusCircle className="w-5 h-5 text-zinc-500 group-hover:text-black" /></div>
          <span>Add New Payment Method</span>
      </button>

      {cards.map((card) => (
          <div key={card.id} className="group w-full bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className="w-14 h-10 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                    {card.card_type === 'Visa' ? <span className="font-black italic text-blue-600 text-xs">VISA</span> : <div className="flex -space-x-2"><div className="w-4 h-4 bg-red-500 rounded-full"/><div className="w-4 h-4 bg-yellow-500 rounded-full mix-blend-multiply"/></div>}
                </div>
                <div><p className="font-bold text-sm text-zinc-900">{card.card_type} ending in {card.last_4}</p><p className="text-xs text-zinc-400">Expires 12/28</p></div>
            </div>
            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50" onClick={() => deleteCard(card.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
      ))}
    </div>
  )
}

// --- 8. PURCHASE HISTORY ---
function PurchaseHistory({ session }: { session: any }) {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase.from('orders').select('*').eq('buyer_id', session.user.id).order('created_at', { ascending: false })
            if (data) setOrders(data)
            setLoading(false)
        }
        fetchOrders()
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
                <div><h3 className="font-bold text-lg">My Orders</h3><p className="text-xs text-zinc-400">Track all your purchases and tickets.</p></div>
                <div className="bg-white/10 p-3 rounded-full"><Receipt className="w-6 h-6"/></div>
            </div>
            <div className="space-y-4">
                {loading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400"/></div>}
                {!loading && orders.length === 0 && <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-zinc-100"><ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-2"/><p className="text-sm font-bold text-zinc-500">No purchases yet</p></div>}
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-yellow-200 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${order.item_type === 'product' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                {order.item_type === 'product' ? <ShoppingBag className="w-6 h-6"/> : <Ticket className="w-6 h-6"/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-zinc-900">{order.item_name}</h4>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5"><span className="capitalize bg-zinc-100 px-1.5 py-0.5 rounded">{order.item_type}</span><span>•</span><span>{new Date(order.created_at).toLocaleDateString()}</span></div>
                            </div>
                        </div>
                        <div className="text-right"><p className="font-black text-zinc-900">${order.amount}</p><span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wide">Paid</span></div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- 9. BLOCKED USERS ---
function BlockedUsers({ session }: { session: any }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [blockedList, setBlockedList] = useState<any[]>([])

    useEffect(() => {
        const fetchBlocked = async () => {
            const { data } = await supabase.from('blocked_users').select(`id, blocked_id, profiles:blocked_id ( username, avatar_url )`).eq('blocker_id', session.user.id)
            if (data) setBlockedList(data.map((item: any) => ({ id: item.id, name: item.profiles?.username || "Unknown", avatar: item.profiles?.avatar_url })))
        }
        fetchBlocked()
    }, [])

    const unblock = async (id: number) => {
        if(confirm("Unblock this user?")) {
            await supabase.from('blocked_users').delete().eq('id', id)
            setBlockedList(blockedList.filter(u => u.id !== id))
        }
    }

    const filtered = blockedList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400"/>
                <Input placeholder="Search blocked users..." className="pl-10 bg-zinc-800 border-none text-white h-11 rounded-xl focus-visible:ring-yellow-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="bg-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-700/50 shadow-lg border border-zinc-700">
                {filtered.length === 0 && <div className="p-8 text-center text-zinc-500 text-sm">No blocked users found.</div>}
                {filtered.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between text-white group hover:bg-zinc-700/30">
                        <div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={user.avatar}/><AvatarFallback>{user.name[0]}</AvatarFallback></Avatar><span className="text-sm font-medium">{user.name}</span></div>
                        <Button size="icon" variant="ghost" onClick={() => unblock(user.id)} className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-full"><Ban className="w-4 h-4" /></Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* =======================================================
   MAIN SETTINGS PANEL
======================================================= */

export default function SettingsPanel({
  onClose,
  onLogout
}: {
  onClose: () => void
  onLogout: () => void
}) {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState("visibility")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  /* 🔑 IMPORTANT FIX — menuItems MUST be memoized */
  const menuItems = useMemo(() => [
    { id: 'visibility', label: t('set_visibility'), icon: Eye, component: () => <VisibilitySettings session={session} /> },
    { id: 'language', label: t('set_language'), icon: Globe, component: () => <LanguageSettings /> },
    { id: 'notifications', label: t('set_notifications'), icon: Bell, component: () => <NotificationSettings session={session} /> },
    { id: 'permissions', label: t('set_permissions'), icon: Lock, component: () => <PermissionsSettings session={session} /> },
    { id: 'media', label: t('set_media'), icon: Wifi, component: () => <MediaPreferences session={session} /> },
    { id: 'revenue', label: t('set_revenue'), icon: DollarSign, component: () => <ManageRevenue session={session} /> },
    { id: 'history', label: t('set_history'), icon: Receipt, component: () => <PurchaseHistory session={session} /> },
    { id: 'cards', label: t('set_cards'), icon: CreditCard, component: () => <MyCards session={session} /> },
    { id: 'privacy', label: t('set_privacy'), icon: Lock, component: () => <div className="p-10 text-center text-zinc-400">Privacy Policy</div> },
    { id: 'licenses', label: t('set_licenses'), icon: FileText, component: () => <div className="p-10 text-center text-zinc-400">MIT License</div> },
    { id: 'blocked', label: t('set_blocked'), icon: Users, component: () => <BlockedUsers session={session} /> },
  ], [t, i18n.language, session])

  const ActiveComponent =
    menuItems.find(i => i.id === activeTab)?.component || (() => null)

  const activeLabel =
    menuItems.find(i => i.id === activeTab)?.label

  if (!session) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className={`w-full md:w-80 bg-zinc-950 text-white ${!isMobileMenuOpen ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <h2 className="text-xl font-bold text-yellow-500">
            {t('nav_settings')}
          </h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false) }}
              className={`w-full flex items-center justify-between p-3 rounded-xl ${
                activeTab === item.id
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-zinc-900 text-red-500 rounded-xl font-bold"
          >
            {t('nav_logout')}
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className={`flex-1 bg-white ${isMobileMenuOpen ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold">{activeLabel}</h1>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
          <div className="max-w-2xl mx-auto">
            <ActiveComponent />
          </div>
        </div>
      </main>
    </div>
  )
}
