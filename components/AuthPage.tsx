import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chrome, Facebook, AlertCircle, Eye, EyeOff } from 'lucide-react'
import StatusDialog from '@/components/StatusDialog'

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  // State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  // Toggle State for Password Visibility
  const [showPassword, setShowPassword] = useState(false)
  
  // Validation Errors
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({})

  // Modal State
  const [modal, setModal] = useState<{ open: boolean; type: "success" | "error" | "loading"; title: string; message: string }>({
    open: false, type: 'loading', title: '', message: ''
  })

  // --- VALIDATION LOGIC ---
  const validate = (type: 'login' | 'signup') => {
    let isValid = true
    let newErrors: any = {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address."
      isValid = false
    }

    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters."
      isValid = false
    }

    if (type === 'signup') {
      if (!username || username.length < 3) {
        newErrors.username = "Username must be at least 3 characters."
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  // --- AUTH HANDLER ---
  const handleAuth = async (type: 'login' | 'signup') => {
    if (!validate(type)) return

    setModal({ open: true, type: 'loading', title: type === 'login' ? 'Signing In...' : 'Creating Account...', message: 'Please wait a moment.' })

    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        setModal({ open: true, type: 'success', title: 'Welcome Back!', message: 'You are now logged in.' })
        setTimeout(() => window.location.reload(), 1500)

      } else {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { username, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` } }
        })
        if (error) throw error

        if (data.user) {
            await supabase.from('profiles').insert({
                id: data.user.id, username, bio: 'New member', badge_tier: 'free',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            })
            setModal({ open: true, type: 'success', title: 'Account Created!', message: 'Welcome to SuitHub.' })
            setTimeout(() => window.location.reload(), 1500)
        }
      }
    } catch (err: any) {
      setModal({ open: true, type: 'error', title: 'Authentication Failed', message: err.message || 'Something went wrong.' })
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      
      {/* LEFT: Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10">
             <div className="flex items-center gap-2 mb-8">
                <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">S</div>
                <span className="text-xl font-bold tracking-tight">SuitHub</span>
             </div>
             <h1 className="text-5xl font-bold leading-tight mb-6">Connect, Explore, <br/>and <span className="text-indigo-400">Go Live.</span></h1>
         </div>
         <div className="relative z-10 text-sm text-zinc-600">© 2025 SuitHub Platform</div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Get Started</h2>
                <p className="text-zinc-500 mt-2 text-sm">Enter your credentials to access your account.</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-100 p-1 rounded-xl">
                    <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
                </TabsList>

                {/* LOGIN TAB */}
                <TabsContent value="login" className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-11 ${errors.email ? 'border-red-500' : ''}`} 
                                placeholder="name@example.com" 
                                value={email} onChange={(e) => setEmail(e.target.value)} 
                             />
                             {errors.email && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                             
                             {/* Password Field Inline */}
                             <div className="relative">
                                <Input 
                                    className={`bg-zinc-50 border-zinc-200 h-11 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password" 
                                    value={password} onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                             </div>
                             {errors.password && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.password}</p>}
                        </div>
                        <Button className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl" onClick={() => handleAuth('login')}>
                            Sign In
                        </Button>
                    </div>
                </TabsContent>

                {/* SIGNUP TAB */}
                <TabsContent value="signup" className="space-y-4">
                     <div className="space-y-4">
                        <div className="space-y-2">
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-11 ${errors.username ? 'border-red-500' : ''}`} 
                                placeholder="Choose Username" 
                                value={username} onChange={(e) => setUsername(e.target.value)} 
                             />
                             {errors.username && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.username}</p>}
                             
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-11 ${errors.email ? 'border-red-500' : ''}`} 
                                placeholder="name@example.com" 
                                value={email} onChange={(e) => setEmail(e.target.value)} 
                             />
                             {errors.email && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                             
                             {/* Password Field Inline */}
                             <div className="relative">
                                <Input 
                                    className={`bg-zinc-50 border-zinc-200 h-11 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Create Password (Min 6 chars)" 
                                    value={password} onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                             </div>
                             {errors.password && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.password}</p>}
                        </div>
                        <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" onClick={() => handleAuth('signup')}>
                            Create Account
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">Or continue with</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="outline" className="h-11 rounded-xl border-zinc-200"><Chrome className="mr-2 h-4 w-4" /> Google</Button>
                <Button variant="outline" className="h-11 rounded-xl border-zinc-200"><Facebook className="mr-2 h-4 w-4" /> Facebook</Button>
            </div>
        </div>
      </div>

      {/* MODAL */}
      <StatusDialog 
        isOpen={modal.open} 
        type={modal.type} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal(prev => ({ ...prev, open: false }))} 
      />
    </div>
  )
}