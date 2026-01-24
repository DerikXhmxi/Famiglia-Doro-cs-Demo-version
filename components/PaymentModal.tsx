"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Lock, AlertCircle, X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Ensure this key exists. If not, stripePromise will be null.
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

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
            setMessage(error.message || "Payment failed.")
            setIsLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            await handleDatabaseUpdate()
        }
    }

const handleDatabaseUpdate = async () => {
        try {
            // FIX: Changed 'product_name' to 'item_name' to match your DB
            const { error: orderError } = await supabase.from('orders').insert({
                buyer_id: session.user.id,
                seller_id: plan.seller_id || plan.organizer_id,
                amount: plan.price,
                status: 'paid',
                item_name: plan.name, 
                item_id: plan.id,     // Ensure you are passing the ID too if your DB requires it (it is nullable in your screenshot but good practice)
                item_type: 'product'  // Optional: helps you filter later
            })
            
            if (orderError) throw orderError
            onSuccess() 
        } catch (err: any) {
            console.error(err)
            setMessage("Payment succeeded, but DB update failed: " + err.message)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm text-zinc-900">{plan.name}</h3>
                    <p className="text-xs text-zinc-500">Secure transaction</p>
                </div>
                <span className="font-bold text-lg">${plan.price}</span>
            </div>
            
            <PaymentElement />
            
            {message && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/> <span>{message}</span>
                </div>
            )}

            <Button disabled={isLoading || !stripe || !elements} className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay $${plan.price}`}
            </Button>
            
            <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1 pb-2">
                <Lock className="w-3 h-3"/> Encrypted by Stripe
            </p>
        </form>
    )
}

export default function PaymentModal({ isOpen, onClose, plan, session }: any) {
    const [clientSecret, setClientSecret] = useState("")
    const [errorMessage, setErrorMessage] = useState("") 

    useEffect(() => {
        if (isOpen) {
            // 1. Reset State
            setClientSecret("")
            setErrorMessage("")

            // 2. DEBUG CHECK: Is Plan missing?
            if (!plan) {
                console.error("PaymentModal Error: 'plan' prop is missing or null", plan)
                setErrorMessage("Error: No product selected.")
                return
            }

            // 3. DEBUG CHECK: Is Price missing?
            if (!plan.price) {
                console.error("PaymentModal Error: 'plan.price' is missing", plan)
                setErrorMessage("Error: Product has no price.")
                return
            }

            // 4. Fetch Payment Intent
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: plan.price, 
                    description: `Product: ${plan.name}` 
                }),
            })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Server connection failed")
                if (!data.clientSecret) throw new Error("No client secret returned")
                setClientSecret(data.clientSecret)
            })
            .catch((err) => {
                console.error("Payment Init Error:", err)
                setErrorMessage(err.message)
            })
        }
    }, [isOpen, plan])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* FIX: Changed overflow-hidden to overflow-y-auto and added max-h-[90vh] */}
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 rounded-3xl scrollbar-hide">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Lock className="w-5 h-5"/> Secure Checkout
                    </DialogTitle>
                </DialogHeader>

                {errorMessage ? (
                    // ERROR STATE
                    <div className="py-10 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8"/>
                        </div>
                        <h3 className="font-bold text-lg">Unable to Checkout</h3>
                        <p className="text-sm text-zinc-500 mt-2 mb-6 max-w-[200px] mx-auto">{errorMessage}</p>
                        <Button onClick={onClose} variant="outline" className="rounded-full px-6">Close</Button>
                    </div>
                ) : clientSecret && stripePromise ? (
                    // SUCCESS STATE (Form)
                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                        <CheckoutForm plan={plan} session={session} onSuccess={() => window.location.reload()} />
                    </Elements>
                ) : (
                    // LOADING STATE
                    <div className="h-60 flex flex-col items-center justify-center gap-4 text-zinc-400">
                        <Loader2 className="w-10 h-10 animate-spin text-yellow-500"/>
                        <p className="text-xs font-medium">Connecting to secure gateway...</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}