"use client"

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- TRANSLATION RESOURCES (Top 12 Internet Languages) ---
const resources = {
  en: {
    translation: {
      nav_home: "Home Feed",
      nav_messages: "Messages",
      nav_shorts: "Shorts",
      nav_groups: "Communities",
      nav_live: "Live",
      nav_events: "Events",
      nav_mall: "Marketplace",
      nav_settings: "Settings",
      search_placeholder: "Search products, people, events...",
      section_trending: "Trending Topics",
      btn_verified: "Get Verified"
    }
  },
  es: { // Spanish
    translation: {
      nav_home: "Inicio",
      nav_messages: "Mensajes",
      nav_shorts: "Cortos",
      nav_groups: "Comunidades",
      nav_live: "En Vivo",
      nav_events: "Eventos",
      nav_mall: "Mercado",
      nav_settings: "Ajustes",
      search_placeholder: "Buscar productos, personas...",
      section_trending: "Tendencias",
      btn_verified: "Verificarse"
    }
  },
  zh: { // Chinese (Simplified)
    translation: {
      nav_home: "首页",
      nav_messages: "消息",
      nav_shorts: "短视频",
      nav_groups: "社区",
      nav_live: "直播",
      nav_events: "活动",
      nav_mall: "市场",
      nav_settings: "设置",
      search_placeholder: "搜索产品、用户、活动...",
      section_trending: "热门话题",
      btn_verified: "获得认证"
    }
  },
  ar: { // Arabic
    translation: {
      nav_home: "الرئيسية",
      nav_messages: "الرسائل",
      nav_shorts: "فيديوهات قصيرة",
      nav_groups: "المجتمعات",
      nav_live: "بث مباشر",
      nav_events: "الفعاليات",
      nav_mall: "المتجر",
      nav_settings: "الإعدادات",
      search_placeholder: "البحث عن منتجات، أشخاص...",
      section_trending: "المواضيع الشائعة",
      btn_verified: "توثيق الحساب"
    }
  },
  pt: { // Portuguese
    translation: {
      nav_home: "Início",
      nav_messages: "Mensagens",
      nav_shorts: "Shorts",
      nav_groups: "Comunidades",
      nav_live: "Ao Vivo",
      nav_events: "Eventos",
      nav_mall: "Loja",
      nav_settings: "Configurações",
      search_placeholder: "Pesquisar produtos, pessoas...",
      section_trending: "Em Alta",
      btn_verified: "Seja Verificado"
    }
  },
  id: { // Indonesian
    translation: {
      nav_home: "Beranda",
      nav_messages: "Pesan",
      nav_shorts: "Shorts",
      nav_groups: "Komunitas",
      nav_live: "Langsung",
      nav_events: "Acara",
      nav_mall: "Pasar",
      nav_settings: "Pengaturan",
      search_placeholder: "Cari produk, orang...",
      section_trending: "Topik Populer",
      btn_verified: "Dapatkan Verifikasi"
    }
  },
  fr: { // French
    translation: {
      nav_home: "Accueil",
      nav_messages: "Messages",
      nav_shorts: "Shorts",
      nav_groups: "Communautés",
      nav_live: "En Direct",
      nav_events: "Événements",
      nav_mall: "Marché",
      nav_settings: "Paramètres",
      search_placeholder: "Rechercher...",
      section_trending: "Tendances",
      btn_verified: "Être Vérifié"
    }
  },
  ja: { // Japanese
    translation: {
      nav_home: "ホーム",
      nav_messages: "メッセージ",
      nav_shorts: "ショート",
      nav_groups: "コミュニティ",
      nav_live: "ライブ",
      nav_events: "イベント",
      nav_mall: "マーケット",
      nav_settings: "設定",
      search_placeholder: "検索...",
      section_trending: "トレンド",
      btn_verified: "認証を取得"
    }
  },
  ru: { // Russian
    translation: {
      nav_home: "Главная",
      nav_messages: "Сообщения",
      nav_shorts: "Shorts",
      nav_groups: "Сообщества",
      nav_live: "Эфир",
      nav_events: "События",
      nav_mall: "Маркет",
      nav_settings: "Настройки",
      search_placeholder: "Поиск...",
      section_trending: "Актуальное",
      btn_verified: "Верификация"
    }
  },
  de: { // German
    translation: {
      nav_home: "Startseite",
      nav_messages: "Nachrichten",
      nav_shorts: "Shorts",
      nav_groups: "Gruppen",
      nav_live: "Live",
      nav_events: "Events",
      nav_mall: "Marktplatz",
      nav_settings: "Einstellungen",
      search_placeholder: "Suchen...",
      section_trending: "Trends",
      btn_verified: "Verifiziert werden"
    }
  },
  hi: { // Hindi
    translation: {
      nav_home: "होम फीड",
      nav_messages: "संदेश",
      nav_shorts: "शॉर्ट्स",
      nav_groups: "समुदाय",
      nav_live: "लाइव",
      nav_events: "कार्यक्रम",
      nav_mall: "बाज़ार",
      nav_settings: "सेटिंग्स",
      search_placeholder: "खोजें...",
      section_trending: "ट्रेंडिंग विषय",
      btn_verified: "सत्यापित हों"
    }
  },
  it: { // Italian
    translation: {
      nav_home: "Home",
      nav_messages: "Messaggi",
      nav_shorts: "Shorts",
      nav_groups: "Comunità",
      nav_live: "Dal Vivo",
      nav_events: "Eventi",
      nav_mall: "Mercato",
      nav_settings: "Impostazioni",
      search_placeholder: "Cerca...",
      section_trending: "Di Tendenza",
      btn_verified: "Ottieni Verifica"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;