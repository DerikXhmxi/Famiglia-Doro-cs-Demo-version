"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EMOJI_PACKS, EmojiPack } from '@/lib/emojiPacks'

export function useEmojiSystem(userId?: string) {
    const [activePackId, setActivePackId] = useState('classic')
    const [allPacks, setAllPacks] = useState<Record<string, EmojiPack>>(EMOJI_PACKS)
    const [loading, setLoading] = useState(true)

    // Function to re-fetch everything (used on initial load and realtime updates)
    const refreshData = async () => {
        if (!userId) return

        try {
            // 1. Fetch User Preference
            const { data: settings } = await supabase
                .from('user_settings')
                .select('active_emoji_pack')
                .eq('user_id', userId)
                .single()

            if (settings?.active_emoji_pack) {
                // console.log("Updated Active Pack:", settings.active_emoji_pack) 
                setActivePackId(settings.active_emoji_pack)
            }

            // 2. Fetch Custom Packs
            const { data: customPacks } = await supabase
                .from('custom_emoji_packs')
                .select('*')
                .eq('user_id', userId)

            // 3. Merge
            const mergedPacks = { ...EMOJI_PACKS }
            if (customPacks) {
                customPacks.forEach((pack: any) => {
                    mergedPacks[pack.id] = {
                        id: pack.id,
                        name: pack.name,
                        description: pack.description || 'Custom Pack',
                        emojis: pack.emojis
                    }
                })
            }
            setAllPacks(mergedPacks)
        } catch (error) {
            console.error("Error fetching emoji data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!userId) return

        // Initial Fetch
        refreshData()

        // --- REALTIME SUBSCRIPTION ---
        // This listens for changes in the DB and updates the UI instantly
        const channel = supabase.channel('emoji_realtime')
            .on(
                'postgres_changes',
                { 
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public', 
                    table: 'user_settings',
                    filter: `user_id=eq.${userId}` 
                }, 
                (payload) => {
                    // console.log("Realtime Change Detected:", payload)
                    if (payload.new && 'active_emoji_pack' in payload.new) {
                        setActivePackId((payload.new as any).active_emoji_pack)
                    }
                }
            )
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'custom_emoji_packs',
                    filter: `user_id=eq.${userId}` 
                }, 
                () => {
                    // If user creates a new pack, re-fetch the list
                    refreshData()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [userId])

    const currentPack = allPacks[activePackId] || allPacks['classic']

    return { activePackId, allPacks, currentPack, loading }
}