"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const REACTION_EMOJIS = [
  { id: 'laugh', icon: '😆' },
  { id: 'sus', icon: '🤨' },
  { id: 'neutral', icon: '😐' },
  { id: 'kiss', icon: '😘' },
  { id: 'love_hands', icon: '🫶' },
  { id: 'fire', icon: '🔥' },
  { id: 'angry', icon: '🤬' },
  { id: 'love', icon: '😍' },
  { id: 'party', icon: '🥳' },
  { id: 'zipper', icon: '🤐' },
  { id: 'salute', icon: '🫡' },
  { id: 'hug', icon: '🫂' },
  { id: 'shock', icon: '😱' },
]

export default function ReactionDock({ onReact, variant = "floating" }: { onReact: (emoji: string) => void, variant?: "floating" | "inline" }) {
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null)

  const handleReact = (emoji: string) => {
    setActiveEmoji(emoji)
    onReact(emoji)
    setTimeout(() => setActiveEmoji(null), 1000)
  }

  return (
    <div className={`relative z-50 ${variant === 'floating' ? 'w-full flex justify-center mb-4' : 'my-2'}`}>
      
      {/* Flying Particle Animation */}
      <AnimatePresence>
        {activeEmoji && (
          <motion.div
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -100, opacity: 0, scale: 3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none text-6xl"
          >
            {activeEmoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Dock Bar */}
      <div className={`
        flex items-center gap-1 overflow-x-auto py-2 px-3 scrollbar-hide
        ${variant === 'floating' 
          ? 'bg-black/60 backdrop-blur-xl rounded-full border border-white/10 max-w-[90%] mx-auto shadow-2xl' 
          : 'bg-transparent w-full'}
      `}>
        {REACTION_EMOJIS.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.5, translateY: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handleReact(item.icon); }}
            className="text-2xl min-w-[36px] h-[36px] flex items-center justify-center cursor-pointer select-none hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            {item.icon}
          </motion.button>
        ))}
      </div>
    </div>
  )
}