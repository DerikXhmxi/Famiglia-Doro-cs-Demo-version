"use client"

import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

// Common Internet Languages List
const LANGUAGES = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
    { code: 'pt', name: 'Português (Portuguese)', flag: '🇧🇷' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
]

export default function SettingsPage() {
    const { i18n, t } = useTranslation();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        // Optional: Handle RTL for Arabic
        document.dir = lng === 'ar' ? 'rtl' : 'ltr';
        setShowLangMenu(false);
    }

    if (showLangMenu) {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setShowLangMenu(false)} className="text-sm text-zinc-500 hover:text-black font-bold flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4"/> Back
                    </button>
                    <h2 className="text-xl font-bold">Select Language</h2>
                </div>
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 max-h-[70vh] overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 border-b border-zinc-50 last:border-none transition-colors"
                        >
                            <span className="flex items-center gap-3 text-lg">
                                <span className="text-2xl shadow-sm rounded-full">{lang.flag}</span> 
                                <span className="font-medium text-zinc-900">{lang.name}</span>
                            </span>
                            {i18n.language === lang.code && <Check className="w-5 h-5 text-yellow-500" />}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 p-2">
            <button 
                onClick={() => setShowLangMenu(true)} 
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <span className="text-xl">🌐</span>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-zinc-900">Language</p>
                        <p className="text-xs text-zinc-500">
                            {LANGUAGES.find(l => l.code === i18n.language)?.name || "Select Language"}
                        </p>
                    </div>
                </div>
                <span className="text-zinc-300">Change</span>
            </button>
        </div>
    )
}