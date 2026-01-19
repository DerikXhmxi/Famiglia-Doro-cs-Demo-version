"use client"

import { useState } from "react"
import { Check, ShieldCheck, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import PaymentModal from "./PaymentModal" // <--- Import the new modal

const PLANS = [
    {
        name: "Free Trial",
        price: "0.00",
        duration: "90 Days",
        features: ["Global Mall Seller", "Business Page Creation", "Freedom Of Emoji Speech", "Level 2 Emoji Access"],
        color: "bg-zinc-900 text-white",
        tierId: "free_trial"
    },
    {
        name: "Verified Mid Student",
        price: "0.99",
        duration: "/mo",
        features: ["Global Mall Seller", "Freedom of Speech", "Limited Hub Access"],
        color: "bg-orange-400 text-white",
        tierId: "mid_student"
    },
    {
        name: "Verified HS Student",
        price: "1.99",
        duration: "/mo",
        features: ["Global Mall Speech", "Freedom of Emoji Speech", "Limited Hub Access"],
        color: "bg-zinc-300 text-zinc-900",
        tierId: "hs_student"
    },
    {
        name: "Verified College Student",
        price: "2.99",
        duration: "/mo",
        features: ["All Previous Features", "Private Group Access", "Business Page Creation"],
        color: "bg-yellow-400 text-black",
        tierId: "college_student"
    },
    {
        name: "Verified User",
        price: "3.99",
        duration: "/mo",
        features: ["Private Group Access", "Business Page Creation", "Level 2 Emoji Access", "Full Suite Hub Access"],
        color: "bg-zinc-800 text-white border border-yellow-500/50",
        tierId: "verified_user"
    }
]

export default function SubscriptionPlans({ isOpen, onClose, session }: { isOpen: boolean, onClose: () => void, session: any }) {
    const [selectedPlan, setSelectedPlan] = useState<any>(null)

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md h-[85vh] p-0 border-none bg-zinc-50 rounded-3xl overflow-hidden flex flex-col">
                    <div className="bg-white p-6 text-center border-b border-zinc-100 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-black"><X className="w-6 h-6" /></button>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-4 relative">
                            <ShieldCheck className="w-10 h-10 text-yellow-600" />
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white"><Check className="w-3 h-3" /></div>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900">Get Verified</h2>
                        <p className="text-sm text-zinc-500 mt-1">Choose a plan to unlock exclusive features</p>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4 pb-8">
                            {PLANS.map((plan) => (
                                <div 
                                    key={plan.name} 
                                    onClick={() => setSelectedPlan(plan)} // <--- Open Payment Modal
                                    className={`relative group p-5 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer shadow-sm border border-transparent hover:border-black/10 ${plan.color}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg">{plan.name}</h3>
                                            <p className="text-[10px] opacity-80 font-medium uppercase tracking-wider">{plan.duration}</p>
                                        </div>
                                        <div className="text-xl font-black">${plan.price}</div>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="text-xs flex items-center gap-2 opacity-90"><Check className="w-3 h-3 shrink-0" /> {feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* PAYMENT MODAL OVERLAY */}
            <PaymentModal 
                isOpen={!!selectedPlan} 
                onClose={() => setSelectedPlan(null)} 
                plan={selectedPlan} 
                session={session} 
            />
        </>
    )
}