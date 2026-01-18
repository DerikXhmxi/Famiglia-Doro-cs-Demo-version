import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Lock, AlertCircle } from 'lucide-react'

// --- STRIPE IMPORTS ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- INTERNAL CHECKOUT FORM ---
function CheckoutForm({ item, type, session, onClose }: any) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        // 1. Confirm Payment with Stripe
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is not needed for instant UI handling, but required by Stripe
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`, 
            },
            redirect: "if_required", // Important: Prevents redirect if not 3D secure
        });

        if (error) {
            setMessage(error.message || "An unexpected error occurred.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // 2. PAYMENT SUCCESSFUL -> UPDATE DATABASE
            await handleDatabaseUpdate();
        } else {
            setMessage("Payment failed. Please try again.");
            setIsLoading(false);
        }
    };

    const handleDatabaseUpdate = async () => {
        try {
            const sellerId = type === 'product' ? item.seller_id : item.organizer_id;

            // A. Create Order
            const { error: orderError } = await supabase.from('orders').insert({
                buyer_id: session.user.id,
                seller_id: sellerId,
                item_type: type,
                item_id: item.id,
                item_name: item.name || item.title,
                amount: item.price,
                status: 'paid'
            });

            if (orderError) throw orderError;

            // B. Credit Seller (Revenue)
            if (sellerId) {
                await supabase.from('transactions').insert({
                    user_id: sellerId,
                    title: `Sale: ${item.name || item.title}`,
                    amount: item.price, // Income
                    type: 'in'
                });
            }

            // C. Debit Buyer (History)
            await supabase.from('transactions').insert({
                user_id: session.user.id,
                title: `Purchased: ${item.name || item.title}`,
                amount: -item.price, // Expense
                type: 'out'
            });

            // Trigger Success UI in Parent
            onClose(true); // true = success

        } catch (err) {
            console.error("Database update failed:", err);
            setMessage("Payment succeeded, but order creation failed. Contact support.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-4">
                <h3 className="font-bold text-sm text-zinc-900 mb-1">Order Summary</h3>
                <div className="flex justify-between text-sm">
                    <span>{item.name || item.title}</span>
                    <span className="font-bold">${item.price}</span>
                </div>
            </div>

            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            
            {message && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4"/> {message}
                </div>
            )}

            <Button 
                disabled={isLoading || !stripe || !elements} 
                className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl shadow-lg mt-4"
            >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay $${item.price}`}
            </Button>
            
            <p className="text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3"/> Payments processed securely by Stripe
            </p>
        </form>
    );
}

// --- MAIN MODAL WRAPPER ---
export default function PaymentModal({ 
    isOpen, 
    onClose, 
    item, 
    type, 
    session 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    item: any, 
    type: 'product' | 'event',
    session: any 
}) {
    const [clientSecret, setClientSecret] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // 1. Fetch Client Secret from Backend on Open
    useEffect(() => {
        if (isOpen && item) {
            setIsSuccess(false);
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: item.price, 
                    description: `Purchase of ${item.name || item.title}` 
                }),
            })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret));
        }
    }, [isOpen, item]);

    const handleClose = (success = false) => {
        if (success) {
            setIsSuccess(true);
        } else {
            // Fully close modal
            onClose();
            setTimeout(() => setIsSuccess(false), 300); // Reset state after close
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => !isSuccess && onClose()}>
            <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {isSuccess ? <CheckCircle2 className="text-green-500"/> : <Lock className="w-5 h-5"/>}
                            {isSuccess ? "Payment Successful" : "Secure Checkout"}
                        </DialogTitle>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900">Success!</h3>
                            <p className="text-zinc-500 text-sm mt-2 max-w-[200px]">
                                Your payment has been processed securely.
                            </p>
                            <Button className="mt-8 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-xl" onClick={() => onClose()}>
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            {clientSecret ? (
                                <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                                    <CheckoutForm 
                                        item={item} 
                                        type={type} 
                                        session={session} 
                                        onClose={handleClose} 
                                    />
                                </Elements>
                            ) : (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300"/>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}