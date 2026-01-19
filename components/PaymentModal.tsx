"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ plan, session, onSuccess }: any) {
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setIsLoading(true)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        })

        if (error) {
            setMessage(error.message || "An unexpected error occurred.")
            setIsLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            await handleDatabaseUpdate()
        } else {
            setMessage("Payment failed. Please try again.")
            setIsLoading(false)
        }
    }

    const handleDatabaseUpdate = async () => {
        try {
            // 1. Record Subscription
            const { error: subError } = await supabase.from('subscriptions').insert({
                user_id: session.user.id,
                plan_name: plan.name,
                price: plan.price,
                status: 'active'
            })
            if (subError) throw subError

            // 2. Update Profile Tier
            const { error: profileError } = await supabase.from('profiles').update({
                verified_tier: plan.tierId
            }).eq('id', session.user.id)
            if (profileError) throw profileError

            onSuccess() 
        } catch (err) {
            console.error(err)
            setMessage("Payment succeeded but database update failed. Contact support.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-2"> {/* Added padding bottom */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-4">
                <h3 className="font-bold text-sm text-zinc-900 mb-1">Subscription</h3>
                <div className="flex justify-between text-sm">
                    <span>{plan.name}</span>
                    <span className="font-bold">${plan.price}</span>
                </div>
            </div>
            
            {/* Stripe Element */}
            <PaymentElement />
            
            {message && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4"/> {message}
                </div>
            )}

            <Button 
                disabled={isLoading || !stripe || !elements} 
                className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl mt-4"
            >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay $${plan.price}`}
            </Button>
            
            <div className="text-center">
                <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3"/> Secured by Stripe
                </p>
            </div>
        </form>
    )
}

export default function PaymentModal({ isOpen, onClose, plan, session }: any) {
    const [clientSecret, setClientSecret] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        if (isOpen && plan) {
            setIsSuccess(false)
            // Skip payment for free trial (Price is 0 or "Free")
            if (plan.price === "0.00" || plan.price === "Free") {
                handleFreeTrial()
            } else {
                // Fetch Payment Intent
                fetch("/api/create-payment-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        amount: parseFloat(plan.price), 
                        description: `Subscription: ${plan.name}` 
                    }),
                })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret))
            }
        }
    }, [isOpen, plan])

    const handleFreeTrial = async () => {
        await supabase.from('profiles').update({ verified_tier: plan.tierId }).eq('id', session.user.id)
        setIsSuccess(true)
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => !isSuccess && onClose()}>
            {/* FIX: Added max-h-[85vh] and overflow-y-auto to fix size issue */}
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white p-6 scrollbar-hide rounded-3xl">
                
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {isSuccess ? <CheckCircle2 className="text-green-500"/> : <Lock className="w-5 h-5"/>}
                        {isSuccess ? "Success!" : "Secure Checkout"}
                    </DialogTitle>
                </DialogHeader>

                {isSuccess ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900">You are Verified!</h3>
                        <p className="text-zinc-500 text-sm mt-2 max-w-[200px]">
                            Your <strong>{plan?.name}</strong> plan has been activated successfully.
                        </p>
                        <Button className="mt-8 w-full bg-zinc-900 text-white rounded-xl h-12 font-bold" onClick={() => window.location.reload()}>
                            Continue to App
                        </Button>
                    </div>
                ) : (
                    <>
                        {clientSecret ? (
                            <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                                <CheckoutForm plan={plan} session={session} onSuccess={() => setIsSuccess(true)} />
                            </Elements>
                        ) : (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-zinc-300"/>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}