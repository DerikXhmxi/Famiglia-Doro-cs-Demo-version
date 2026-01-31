"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
// Make sure this path matches where you saved the EMOJI_PACKS data from Step 1
import { EMOJI_PACKS, EmojiPack } from '@/lib/emojiPacks' 

export function useEmojiSystem(userId: string | null, isVip: boolean) {
    const [activePackId, setActivePackId] = useState<string>('defaults')
    const [loading, setLoading] = useState(true)

    // 1. FILTER PACKS BASED ON VIP STATUS
    // Convert the Record object to an Array for easier filtering
    const allPacksArray = Object.values(EMOJI_PACKS)

    const accessiblePacks = allPacksArray.filter(pack => {
        if (pack.level === 1) return true; // Level 1 is always free
        if (pack.level === 2 && isVip) return true; // Level 2 requires VIP
        return false;
    })

    const lockedPacks = allPacksArray.filter(pack => {
        return pack.level === 2 && !isVip;
    })

    // 2. FETCH & SYNC ACTIVE PACK FROM DB
    // We still want to remember which pack the user selected last time
    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('user_settings')
                    .select('active_emoji_pack')
                    .eq('user_id', userId)
                    .single()

                if (data?.active_emoji_pack) {
                    // Check if the user is allowed to use this saved pack (e.g. if they lost VIP)
                    const pack = EMOJI_PACKS[data.active_emoji_pack]
                    if (pack && (pack.level === 1 || (pack.level === 2 && isVip))) {
                        setActivePackId(data.active_emoji_pack)
                    } else {
                        // Fallback to default if saved pack is locked/invalid
                        setActivePackId('defaults') 
                    }
                }
            } catch (error) {
                console.error("Error fetching emoji settings:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()

        // Realtime listener for setting changes
        const channel = supabase.channel('emoji_settings_realtime')
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'user_settings',
                    filter: `user_id=eq.${userId}` 
                }, 
                (payload) => {
                    if (payload.new && payload.new.active_emoji_pack) {
                        const newPackId = payload.new.active_emoji_pack
                        // Validate access again in realtime
                        const pack = EMOJI_PACKS[newPackId]
                        if (pack && (pack.level === 1 || (pack.level === 2 && isVip))) {
                            setActivePackId(newPackId)
                        }
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [userId, isVip])

    // 3. DETERMINE CURRENT ACTIVE PACK
    // If the activePackId isn't in accessible packs (edge case), fallback to the first accessible one
    const currentPack = accessiblePacks.find(p => p.id === activePackId) || accessiblePacks[0] || EMOJI_PACKS['defaults']

    return { 
        activePackId, 
        accessiblePacks, 
        lockedPacks, 
        currentPack, 
        loading 
    }
}