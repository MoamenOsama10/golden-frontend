import { useEffect, useMemo, useRef, useState } from "react";

// =====================================================================================
// ⚙️ Backend connection
// Local ASP.NET API from Golden-Api/Properties/launchSettings.json
// عند الـ Deployment أضف VITE_API_BASE_URL في ملف .env بدلاً من تعديل الكود.
// =====================================================================================
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5016").replace(/\/$/, "");
const MARKET_API_URL = `${API_BASE_URL}/api/GetAllGramPrices/grams`;
// Google AdSense Auto Ads.
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT;
// النتيجة: "ca-pub-"
// ضع القيمة في .env بهذا الشكل: VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
// لا توجد مقاسات أو أماكن إعلانية ثابتة هنا؛ Google Auto Ads يختار الـ format والـ placement.
const ADSENSE_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT || "").trim();

const API_SYMBOL_TO_METAL_KEY = {
  XAU: "gold",
  XAG: "silver",
  XPT: "platinum",
  XPD: "palladium",
  HG: "copper",
  BTC: "bitcoin",
  ETH: "ethereum",
}
const CURRENCY_META = {
  EGP: { ar: "الجنيه المصري", en: "Egyptian Pound", flag: "🇪🇬" },
  SAR: { ar: "الريال السعودي", en: "Saudi Riyal", flag: "🇸🇦" },
  AED: { ar: "الدرهم الإماراتي", en: "UAE Dirham", flag: "🇦🇪" },
  KWD: { ar: "الدينار الكويتي", en: "Kuwaiti Dinar", flag: "🇰🇼" },
  QAR: { ar: "الريال القطري", en: "Qatari Riyal", flag: "🇶🇦" },
  BHD: { ar: "الدينار البحريني", en: "Bahraini Dinar", flag: "🇧🇭" },
  OMR: { ar: "الريال العماني", en: "Omani Rial", flag: "🇴🇲" },
  JOD: { ar: "الدينار الأردني", en: "Jordanian Dinar", flag: "🇯🇴" },
  LBP: { ar: "الليرة اللبنانية", en: "Lebanese Pound", flag: "🇱🇧" },
  IQD: { ar: "الدينار العراقي", en: "Iraqi Dinar", flag: "🇮🇶" },
  LYD: { ar: "الدينار الليبي", en: "Libyan Dinar", flag: "🇱🇾" },
  TND: { ar: "الدينار التونسي", en: "Tunisian Dinar", flag: "🇹🇳" },
  DZD: { ar: "الدينار الجزائري", en: "Algerian Dinar", flag: "🇩🇿" },
  MAD: { ar: "الدرهم المغربي", en: "Moroccan Dirham", flag: "🇲🇦" },
  SDG: { ar: "الجنيه السوداني", en: "Sudanese Pound", flag: "🇸🇩" },
  SYP: { ar: "الليرة السورية", en: "Syrian Pound", flag: "🇸🇾" },
  USD: { ar: "الدولار الأمريكي", en: "US Dollar", flag: "🇺🇸" },
  EUR: { ar: "اليورو", en: "Euro", flag: "🇪🇺" },
  GBP: { ar: "الجنيه الإسترليني", en: "British Pound", flag: "🇬🇧" },
};

// هذه العملات لا تظهر في الواجهة حسب متطلبات المنتج، حتى لو أعادها الـ API.
const HIDDEN_CURRENCY_CODES = new Set(["SAR", "AED"]);

// بيانات العرض لكل أصل. الأسعار الحية لكل المعادن والعملات الرقمية تأتي الآن من الباك إند.
// mockUsd يظل Fallback بصري فقط لو أصل معيّن لم يرجع من الـ API.
const METALS = {
  gold: {
    ar: "الذهب",
    en: "Gold",
    symbol: "AU",
    apiSymbol: "XAU",
    accent: "#C9A24B",
    accentLight: "#E7CD86",
    bg: "#0F0C09",
    surface: "#1B160F",
    surface2: "#241D14",
    border: "#33291B",
    fromApi: true,
    purities: [
      { ar: "٢٤", en: "24K", factor: 1 },
      { ar: "٢١", en: "21K", factor: 0.875 },
      { ar: "١٨", en: "18K", factor: 0.75 },
    ],
    mockUsd: { gram: 140.7068, ounce: 4376.47 },
  },
  silver: {
    ar: "الفضة",
    en: "Silver",
    symbol: "AG",
    apiSymbol: "XAG",
    accent: "#C7CDD2",
    accentLight: "#F0F3F5",
    bg: "#08090A",
    surface: "#141618",
    surface2: "#1C1F22",
    border: "#2C3033",
    fromApi: false,
    purities: [
      { ar: "٩٩٩", en: "999", factor: 1 },
      { ar: "٩٢٥", en: "925", factor: 0.925 },
    ],
    mockUsd: { gram: 1.6813, ounce: 52.3 },
  },
  platinum: {
    ar: "البلاتين",
    en: "Platinum",
    symbol: "PT",
    apiSymbol: "XPT",
    accent: "#9FB4C7",
    accentLight: "#D9E5EE",
    bg: "#090B0D",
    surface: "#141920",
    surface2: "#1C232B",
    border: "#2B343D",
    fromApi: false,
    purities: [
      { ar: "٩٩٩", en: "999", factor: 1 },
      { ar: "٩٥٠", en: "950", factor: 0.95 },
    ],
    mockUsd: { gram: 47.036, ounce: 1462.8 },
  },
  palladium: {
    ar: "البلاديوم",
    en: "Palladium",
    symbol: "PD",
    apiSymbol: "XPD",
    accent: "#D8B8AE",
    accentLight: "#F2E2DC",
    bg: "#0B0908",
    surface: "#181413",
    surface2: "#211B19",
    border: "#332A26",
    fromApi: false,
    purities: [
      { ar: "٩٩٩", en: "999", factor: 1 },
      { ar: "٩٥٠", en: "950", factor: 0.95 },
    ],
    mockUsd: { gram: 32.15, ounce: 1000.0 },
  },
  copper: {
    ar: "النحاس",
    en: "Copper",
    symbol: "HG",
    apiSymbol: "HG",
    accent: "#C97C4B",
    accentLight: "#E8A97A",
    bg: "#0C0806",
    surface: "#1B120C",
    surface2: "#241811",
    border: "#3A281B",
    fromApi: false,
    purities: null,
    mockUsd: { gram: 0.325, ounce: 10.11 },
  },
  bitcoin: {
    ar: "بيتكوين",
    en: "Bitcoin",
    symbol: "BTC",
    apiSymbol: "BTC",
    accent: "#F2A93B",
    accentLight: "#FFD98C",
    bg: "#0C0805",
    surface: "#1C130A",
    surface2: "#261A0E",
    border: "#3D2A16",
    fromApi: false,
    isCrypto: true,
    purities: null,
    mockUsd: { gram: 96500, ounce: 96500 },
  },
  ethereum: {
    ar: "إيثريوم",
    en: "Ethereum",
    symbol: "ETH",
    apiSymbol: "ETH",
    accent: "#8C9EFF",
    accentLight: "#D3D9FF",
    bg: "#08090D",
    surface: "#131523",
    surface2: "#1B1E30",
    border: "#2B2F4A",
    fromApi: false,
    isCrypto: true,
    purities: null,
    mockUsd: { gram: 3400, ounce: 3400 },
  },
};

// ترتيب دائري مقصود: من الذهب، السحب/السهم يميناً يذهب للفضة، ويساراً يذهب للبلاتين.
// بعد ذلك تكمل العناصر في حلقة دائرية لا نهائية.
const METAL_CAROUSEL_ORDER = [
  "ethereum",
  "bitcoin",
  "palladium",
  "platinum",
  "gold",
  "silver",
  "copper",
];

const MOCK_GOLD_DATA = {
  pricePerOunceUSD: 4376.47,
  pricePerGramUSD: 140.7068,
  fetchedAtUtc: new Date().toISOString(),
  rates: [
    { currencyCode: "EGP", pricePerGram: 6823.95, pricePerOunce: 212277.4 },
    { currencyCode: "SAR", pricePerGram: 527.63, pricePerOunce: 16413.3 },
    { currencyCode: "AED", pricePerGram: 516.37, pricePerOunce: 16063.6 },
    { currencyCode: "KWD", pricePerGram: 43.28, pricePerOunce: 1346.9 },
    { currencyCode: "QAR", pricePerGram: 512.14, pricePerOunce: 15932.1 },
    { currencyCode: "BHD", pricePerGram: 53.09, pricePerOunce: 1652.1 },
    { currencyCode: "OMR", pricePerGram: 54.17, pricePerOunce: 1685.7 },
    { currencyCode: "JOD", pricePerGram: 99.83, pricePerOunce: 3106.6 },
    { currencyCode: "MAD", pricePerGram: 1401.2, pricePerOunce: 43597.5 },
    { currencyCode: "TND", pricePerGram: 434.9, pricePerOunce: 13533.4 },
    { currencyCode: "DZD", pricePerGram: 18904.6, pricePerOunce: 588292.0 },
    { currencyCode: "IQD", pricePerGram: 184305.0, pricePerOunce: 5735040.0 },
    { currencyCode: "LYD", pricePerGram: 683.4, pricePerOunce: 21266.0 },
    { currencyCode: "LBP", pricePerGram: 12599870.0, pricePerOunce: 391975000.0 },
    { currencyCode: "SDG", pricePerGram: 84500.0, pricePerOunce: 2629000.0 },
    { currencyCode: "SYP", pricePerGram: 1830000.0, pricePerOunce: 56940000.0 },
    { currencyCode: "EUR", pricePerGram: 129.44, pricePerOunce: 4026.3 },
    { currencyCode: "GBP", pricePerGram: 111.15, pricePerOunce: 3457.2 },
    { currencyCode: "USD", pricePerGram: 140.7068, pricePerOunce: 4376.47 },
  ],
};

const TEXT = {
  ar: {
    dir: "rtl",
    locale: "ar-EG",
    brand: "MGolden",
    about: "حول",
    aboutTitle: "عن MGolden",
    aboutBody:
      "MGolden منصة بترصد أسعار المعادن الثمينة لحظة بلحظة، وبتحوّلها تلقائياً لأكتر من عملة عربية وعالمية، عشان تعرف سعر الجرام والأونصة من غير ما تدوّر في مكان تاني.",
    aboutClose: "إغلاق",
    loading: "بيتحمّل...",
    liveUpdated: (t) => `آخر تحديث ${t}`,
    mock: "بيانات تجريبية",
    error: "تعذّر الاتصال",
    now: "الآن",
    minutesAgo: (n) => `منذ ${n} دقيقة`,
    hoursAgo: (n) => `منذ ${n} ساعة`,
    eyebrow: "السعر لحظة بلحظة",
    seoHeading: "أسعار الذهب اليوم في مصر",
    seoDescription: "تابع أسعار الذهب اليوم في مصر وسعر جرام الذهب عيار 24 و21 و18 بالجنيه المصري لحظة بلحظة.",
    purityPrefix: "عيار",
    gramOf: "سعر الجرام بـ",
    ounceLabel: "الأونصة",
    usdBannerLabel: "السعر الآن بالدولار الأمريكي",
    usdOunce: "الأونصة",
    calculatorTitle: "حاسبة الجرامات",
    calculatorHint: "أدخل الوزن لمعرفة السعر الإجمالي",
    gramsLabel: "عدد الجرامات",
    gramsUnit: "جم",
    totalLabel: "الإجمالي التقريبي",
    perGramLabel: "سعر الجرام",
    usdGram: "الجرام",
    sectionTitle: "كل العملات",
    sectionSub: "سعر الجرام",
    perGram: "/جم",
    disclaimer: "الأسعار للاسترشاد فقط وقد تختلف عن أسعار محلات الصاغة",
    langToggle: "English",
  },
  en: {
    dir: "ltr",
    locale: "en-US",
    brand: "MGolden",
    about: "About",
    aboutTitle: "About MGolden",
    aboutBody:
      "MGolden tracks live precious metal prices and converts them automatically into major Arab and world currencies, so you get the gram and ounce price in one place.",
    aboutClose: "Close",
    loading: "Loading...",
    liveUpdated: (t) => `Updated ${t}`,
    mock: "Sample data",
    error: "Connection failed",
    now: "just now",
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n}h ago`,
    eyebrow: "Live price, every second",
    seoHeading: "Gold prices today in Egypt",
    seoDescription: "Follow live gold prices in Egypt, including 24K, 21K and 18K gram prices in Egyptian Pounds.",
    purityPrefix: "",
    gramOf: "Gram price in ",
    ounceLabel: "Ounce",
    usdBannerLabel: "Price right now in US Dollars",
    usdOunce: "Ounce",
    calculatorTitle: "Gram calculator",
    calculatorHint: "Enter the weight to see the estimated total",
    gramsLabel: "Number of grams",
    gramsUnit: "g",
    totalLabel: "Estimated total",
    perGramLabel: "Price per gram",
    usdGram: "Gram",
    sectionTitle: "All currencies",
    sectionSub: "gram price",
    perGram: "/g",
    disclaimer: "Prices are indicative and may differ from local jewelers",
    langToggle: "العربية",
  },
};

function formatNumber(value, locale, maxDigits = 2) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function useFlowParticles(count) {
  return useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      delay: (Math.random() * 12).toFixed(2),
      duration: (10 + Math.random() * 10).toFixed(2),
      size: (2 + Math.random() * 3).toFixed(1),
      drift: Math.round(Math.random() * 60 - 30),
    }));
  }, [count]);
}

export default function GoldenLanding() {
  const [marketData, setMarketData] = useState({});
  const [status, setStatus] = useState("loading");
  const [selectedCurrency, setSelectedCurrency] = useState("EGP");
  const [metalKey, setMetalKey] = useState("gold");
  const [tappedKey, setTappedKey] = useState(null);
  const [navDirection, setNavDirection] = useState("right");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [purityIndex, setPurityIndex] = useState(0);
  const [lang, setLang] = useState("ar");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [grams, setGrams] = useState("1");
  const [displayPrice, setDisplayPrice] = useState(null);
  const [flashDir, setFlashDir] = useState(null); // "up" | "down" | null
  const rafRef = useRef(null);
  const prevTargetRef = useRef(null);
  const dragStartRef = useRef(null);
  const didSwipeRef = useRef(false);
  const dragRafRef = useRef(null);
  const pendingDragXRef = useRef(0);

  const t = TEXT[lang];
  const metal = METALS[metalKey];
  const sparks = useFlowParticles(16);

  const activeMetalIndex = METAL_CAROUSEL_ORDER.indexOf(metalKey);
  const carouselLength = METAL_CAROUSEL_ORDER.length;

  function carouselOffsetForKey(key) {
    const index = METAL_CAROUSEL_ORDER.indexOf(key);
    let diff = index - activeMetalIndex;

    if (diff > carouselLength / 2) diff -= carouselLength;
    if (diff < -carouselLength / 2) diff += carouselLength;

    return diff;
  }

  function handleMetalTap(key, forcedDirection = null) {
    const offset = carouselOffsetForKey(key);

    if (key !== metalKey) {
      setNavDirection(forcedDirection || (offset >= 0 ? "right" : "left"));
      setMetalKey(key);
    }

    setTappedKey(key);
    setTimeout(() => setTappedKey((cur) => (cur === key ? null : cur)), 500);
  }

  function rotateMetal(step) {
    const nextIndex = (activeMetalIndex + step + carouselLength) % carouselLength;
    handleMetalTap(METAL_CAROUSEL_ORDER[nextIndex], step > 0 ? "right" : "left");
  }

  function handleCarouselPointerDown(e) {
    if (typeof e.button === "number" && e.button !== 0) return;

    dragStartRef.current = e.clientX;
    didSwipeRef.current = false;
    if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = null;
    setIsDragging(true);
    setDragX(0);

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  function handleCarouselPointerMove(e) {
    if (dragStartRef.current == null) return;

    const delta = e.clientX - dragStartRef.current;
    pendingDragXRef.current = Math.max(-110, Math.min(110, delta));

    if (dragRafRef.current) return;
    dragRafRef.current = requestAnimationFrame(() => {
      setDragX(pendingDragXRef.current);
      dragRafRef.current = null;
    });
  }

  function finishCarouselSwipe(e) {
    if (dragStartRef.current == null) return;

    const delta = e.clientX - dragStartRef.current;
    const threshold = 52;

    if (Math.abs(delta) >= threshold) {
      didSwipeRef.current = true;
      rotateMetal(delta > 0 ? 1 : -1);
      setTimeout(() => {
        didSwipeRef.current = false;
      }, 0);
    }

    dragStartRef.current = null;
    if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = null;
    setDragX(0);
    setIsDragging(false);
  }

  function handleMetalButtonClick(key) {
    if (didSwipeRef.current) return;
    handleMetalTap(key);
  }

  function handleCarouselKeyDown(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      rotateMetal(1);
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      rotateMetal(-1);
    }
  }

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_CLIENT.startsWith("ca-pub-")) return;

    const scriptId = "mgolden-adsense-auto";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(MARKET_API_URL, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Unexpected API payload");

        const nextMarketData = {};

        json.forEach((item) => {
          const symbol = String(item?.symbol || "").toUpperCase();
          const key = API_SYMBOL_TO_METAL_KEY[symbol];
          if (key && item?.data) nextMarketData[key] = item.data;
        });

        if (Object.keys(nextMarketData).length === 0) {
          throw new Error("API returned no supported assets");
        }

        if (!cancelled) {
          setMarketData(nextMarketData);
          setStatus("live");
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error("Golden API connection failed:", e);
        if (!cancelled) {
          setMarketData({ gold: MOCK_GOLD_DATA });
          setStatus("mock");
        }
      }
    }

    load();
    const interval = setInterval(load, 30 * 1000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") setAboutOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.title = lang === "ar" ? "أسعار الذهب اليوم في مصر | MGolden" : "Gold prices today in Egypt | MGolden";

    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = t.seoDescription;
  }, [lang, t.seoDescription]);

  useEffect(() => {
    setPurityIndex(0);
  }, [metalKey]);

  useEffect(() => {
    prevTargetRef.current = null;
  }, [metalKey, selectedCurrency, purityIndex]);

  const goldData = marketData.gold || (status === "mock" ? MOCK_GOLD_DATA : null);
  const activeData = marketData[metalKey] || null;

  const goldRateMap = useMemo(() => {
    const map = {};
    (goldData?.rates || []).forEach((r) => (map[r.currencyCode] = r));
    return map;
  }, [goldData]);

  const activeRateMap = useMemo(() => {
    const map = {};
    (activeData?.rates || []).forEach((r) => (map[r.currencyCode] = r));
    return map;
  }, [activeData]);

  function impliedFxRate(currencyCode) {
    const goldRate = goldRateMap[currencyCode];
    if (!goldRate || !goldData?.pricePerGramUSD) return null;
    return goldRate.pricePerGram / goldData.pricePerGramUSD;
  }

  function timeAgo(isoString) {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.max(0, Math.round(diffMs / 60000));
    if (mins < 1) return t.now;
    if (mins < 60) return t.minutesAgo(mins);
    return t.hoursAgo(Math.round(mins / 60));
  }

  const metalUsd = activeData
    ? { gram: activeData.pricePerGramUSD, ounce: activeData.pricePerOunceUSD }
    : metal.mockUsd;

  const purity = metal.purities ? metal.purities[purityIndex] : { ar: "", en: "", factor: 1 };
  const activeCurrencyRate = activeRateMap[selectedCurrency];
  const selectedFx = impliedFxRate(selectedCurrency);

  const heroGramPrice = activeCurrencyRate
    ? activeCurrencyRate.pricePerGram * purity.factor
    : metalUsd?.gram && selectedFx && purity
      ? metalUsd.gram * selectedFx * purity.factor
      : null;

  const heroOuncePrice = activeCurrencyRate
    ? activeCurrencyRate.pricePerOunce * purity.factor
    : metalUsd?.ounce && selectedFx && purity
      ? metalUsd.ounce * selectedFx * purity.factor
      : null;

  const gramAmount = Number(grams);
  const calculatorTotal = Number.isFinite(gramAmount) && gramAmount > 0 && heroGramPrice != null
    ? gramAmount * heroGramPrice
    : null;

  const orderedCurrencies = (activeData?.rates?.length
    ? activeData.rates.map((r) => r.currencyCode)
    : Object.keys(goldRateMap)
  ).filter((code, index, arr) =>
    CURRENCY_META[code] && !HIDDEN_CURRENCY_CODES.has(code) && arr.indexOf(code) === index
  );

  const usdGram = metalUsd?.gram && purity ? metalUsd.gram * purity.factor : null;
  const usdOunce = metalUsd?.ounce && purity ? metalUsd.ounce * purity.factor : null;

  const previousMetalKey =
    METAL_CAROUSEL_ORDER[(activeMetalIndex - 1 + carouselLength) % carouselLength];
  const nextMetalKey = METAL_CAROUSEL_ORDER[(activeMetalIndex + 1) % carouselLength];
  const previousMetal = METALS[previousMetalKey];
  const nextMetal = METALS[nextMetalKey];

  function getPreviewLocalPrice(key) {
    const item = METALS[key];
    if (!item) return null;

    const data = marketData[key];
    const defaultFactor = item.purities?.[0]?.factor ?? 1;

    if (data) {
      const rate = (data.rates || []).find((r) => r.currencyCode === selectedCurrency);
      if (rate) return rate.pricePerGram * defaultFactor;
      if (data.pricePerGramUSD && selectedFx) {
        return data.pricePerGramUSD * selectedFx * defaultFactor;
      }
    }

    if (!item.mockUsd?.gram || !selectedFx) return null;
    return item.mockUsd.gram * selectedFx * defaultFactor;
  }

  const previousPreviewPrice = getPreviewLocalPrice(previousMetalKey);
  const nextPreviewPrice = getPreviewLocalPrice(nextMetalKey);

  useEffect(() => {
    if (heroGramPrice == null) return;

    const from = prevTargetRef.current ?? heroGramPrice;
    const to = heroGramPrice;
    prevTargetRef.current = to;

    if (from === to) {
      setDisplayPrice(to);
      return;
    }

    setFlashDir(to > from ? "up" : "down");
    const flashTimeout = setTimeout(() => setFlashDir(null), 1100);

    const duration = 700;
    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(flashTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroGramPrice]);

  return (
    <div
      dir={t.dir}
      className={`golden-root ${isDragging ? "is-dragging" : ""}`}
      style={{
        "--accent": metal.accent,
        "--accent-light": metal.accentLight,
        "--bg": metal.bg,
        "--surface": metal.surface,
        "--surface-2": metal.surface2,
        "--border": metal.border,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Inter:wght@400;500;600;700;900&display=swap');

        html, body, #root { min-width: 100%; min-height: 100%; margin: 0; background: #0F0C09; }
        .golden-root {
          --bg: #0F0C09;
          --surface: #1B160F;
          --surface-2: #241D14;
          --border: #33291B;
          --cream: #F4EBDA;
          --muted: #A6957A;
          --rise: #5FA97B;

          background: var(--bg);
          color: var(--cream);
          font-family: ${lang === "ar" ? "'IBM Plex Sans Arabic'" : "'Inter'"}, sans-serif;
          min-height: 100vh;
          width: 100vw;
          min-height: 100svh;
          position: relative;
          left: 50%;
          margin-left: -50vw;
          overflow-x: hidden;
          isolation: isolate;
          transition: color 0.3s ease, background-color 0.4s ease;
        }

        .card, .metal-tab, .purity-tab, .chip, .status-pill, .lang-btn, .modal-box {
          transition: background-color 0.35s ease, border-color 0.35s ease, color 0.2s ease, transform 0.15s ease;
        }

        .golden-root * { box-sizing: border-box; }
        .golden-root .display {
          font-family: ${lang === "ar" ? "'Tajawal'" : "'Inter'"}, sans-serif;
        }

        .bg-flow { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .bg-flow::before {
          content: '';
          position: absolute; inset: -10%;
          background:
            radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 42%),
            radial-gradient(circle at 88% 4%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 40%),
            radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 45%);
          transition: background 0.4s ease;
        }
        .streak {
          position: absolute; top: var(--top); left: -30%; width: 60%; height: var(--h);
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 55%, transparent), transparent);
          filter: blur(6px); transform: rotate(-8deg);
          animation: flowMove var(--dur) linear infinite; animation-delay: var(--delay);
        }
        @keyframes flowMove {
          0% { transform: rotate(-8deg) translateX(0); }
          100% { transform: rotate(-8deg) translateX(220vw); }
        }
        .spark {
          position: absolute; bottom: -5%; left: var(--left); width: var(--size); height: var(--size);
          border-radius: 50%; background: var(--accent-light);
          box-shadow: 0 0 6px 1px color-mix(in srgb, var(--accent-light) 70%, transparent);
          opacity: 0; animation: sparkRise var(--dur) ease-in var(--delay) infinite;
        }
        @keyframes sparkRise {
          0% { opacity: 0; transform: translate(0, 0); }
          10% { opacity: 0.9; } 90% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(var(--drift), -110vh); }
        }

        .container { max-width: 1280px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

        button:focus-visible, [tabindex="0"]:focus-visible {
          outline: 2px solid var(--accent-light);
          outline-offset: 3px;
        }

        header.top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 26px 0 10px; gap: 12px; flex-wrap: wrap;
        }
        .nav-group { display: flex; align-items: center; gap: 16px; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-mark {
          width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px;
          color: var(--accent-light); background: linear-gradient(145deg, #2A2115, #100C07);
          border: 1px solid color-mix(in srgb, var(--accent) 52%, transparent);
          box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.08);
          flex-shrink: 0; transition: border-color 0.4s ease, color 0.4s ease;
        }
        .brand-mark svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
        .brand-name { font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 900; font-size: 19px; letter-spacing: 0.3px; }
        .nav-link { background: none; border: none; color: var(--muted); font-size: 14px; cursor: pointer; font-family: inherit; transition: color 0.2s ease; }
        .nav-link:hover { color: var(--accent-light); }

        .status-pill {
          font-size: 12px; color: var(--muted); border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 999px; display: flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--rise); box-shadow: 0 0 8px var(--rise); }
        .status-dot.mock { background: var(--accent); box-shadow: 0 0 8px var(--accent); }

        .lang-btn {
          border: 1px solid var(--border); background: var(--surface); color: var(--cream);
          padding: 6px 14px; border-radius: 999px; font-size: 13px; cursor: pointer; font-family: inherit;
          transition: border-color 0.2s ease;
        }
        .lang-btn:hover { border-color: var(--accent); }

        /* ======================================================================
           Circular metal carousel
           الذهب في المنتصف، والفضة يمينه، والبلاتين يساره عند البداية.
           يدعم Click + Mouse Drag + Touch Swipe + Keyboard arrows.
           ====================================================================== */
        .metal-carousel-shell {
          position: relative;
          max-width: 980px;
          height: 126px;
          margin: 24px auto 12px;
          direction: ltr;
          user-select: none;
        }

        .metal-carousel-track {
          position: absolute;
          inset: 0 72px;
          perspective: 1050px;
          transform-style: preserve-3d;
          cursor: grab;
          touch-action: pan-y;
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
          outline: none;
        }
        .metal-carousel-track.dragging {
          cursor: grabbing;
          transition: none;
        }
        .golden-root.is-dragging .spark,
        .golden-root.is-dragging .streak,
        .golden-root.is-dragging .orbit-dot,
        .golden-root.is-dragging .hero-card {
          animation-play-state: paused;
        }
        .golden-root.is-dragging .metal-preview-card,
        .golden-root.is-dragging .hero-card { transition: none; }
        .metal-carousel-track:focus-visible::after {
          content: '';
          position: absolute;
          inset: 12px 0;
          border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
          border-radius: 999px;
          pointer-events: none;
        }

        .carousel-orbit {
          position: absolute;
          left: 50%; top: 50%;
          width: min(790px, 92%);
          height: 94px;
          transform: translate(-50%, -48%);
          border-top: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          border-radius: 50%;
          opacity: 0.72;
          pointer-events: none;
          filter: drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 18%, transparent));
        }
        .carousel-orbit::after {
          content: '';
          position: absolute;
          inset: 12px 7%;
          border-top: 1px dashed color-mix(in srgb, var(--accent) 16%, transparent);
          border-radius: 50%;
        }

        .metal-tab {
          --item-accent: var(--accent);
          --item-accent-light: var(--accent-light);
          position: absolute;
          left: 50%; top: 50%;
          min-width: 154px;
          height: 58px;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          border: 1px solid color-mix(in srgb, var(--item-accent) 32%, var(--border));
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--item-accent) 8%, var(--surface)), var(--surface));
          color: color-mix(in srgb, var(--item-accent-light) 66%, var(--muted));
          padding: 10px 20px;
          border-radius: 19px;
          font-size: 15px;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transform-style: preserve-3d;
          transform-origin: center;
          backface-visibility: hidden;
          transition:
            transform 0.58s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.45s ease,
            filter 0.45s ease,
            border-color 0.4s ease,
            background 0.4s ease,
            box-shadow 0.4s ease,
            color 0.35s ease;
          will-change: transform, opacity;
        }
        .metal-tab .dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--item-accent);
          box-shadow: 0 0 10px color-mix(in srgb, var(--item-accent) 50%, transparent);
          opacity: 0.72;
          flex: 0 0 auto;
        }
        .metal-tab .badge {
          font-size: 9px;
          border: 1px solid color-mix(in srgb, var(--item-accent) 24%, var(--border));
          border-radius: 999px;
          padding: 1px 6px;
          color: var(--muted);
        }

        .metal-tab.pos-0 {
          z-index: 8;
          min-width: 202px;
          height: 70px;
          transform: translate(-50%, -50%) translateX(0) translateZ(72px) scale(1.05);
          opacity: 1;
          color: var(--item-accent-light);
          border-color: var(--item-accent);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--item-accent) 22%, var(--surface)), color-mix(in srgb, var(--item-accent) 9%, var(--surface-2)));
          box-shadow:
            0 16px 42px -18px color-mix(in srgb, var(--item-accent) 74%, transparent),
            0 0 0 1px color-mix(in srgb, var(--item-accent-light) 11%, transparent) inset,
            0 0 28px color-mix(in srgb, var(--item-accent) 18%, transparent);
          font-size: 18px;
          font-weight: 700;
        }
        .metal-tab.pos-0 .dot { opacity: 1; }

        .metal-tab.pos-m1 {
          z-index: 6; opacity: 0.9; filter: saturate(0.86) brightness(0.92);
          transform: translate(-50%, -50%) translateX(-194px) translateZ(24px) rotateY(12deg) scale(0.92);
        }
        .metal-tab.pos-p1 {
          z-index: 6; opacity: 0.9; filter: saturate(0.86) brightness(0.92);
          transform: translate(-50%, -50%) translateX(194px) translateZ(24px) rotateY(-12deg) scale(0.92);
        }
        .metal-tab.pos-m2 {
          z-index: 4; opacity: 0.58; filter: saturate(0.7) brightness(0.76);
          transform: translate(-50%, -50%) translateX(-335px) translateZ(-30px) rotateY(20deg) scale(0.8);
        }
        .metal-tab.pos-p2 {
          z-index: 4; opacity: 0.58; filter: saturate(0.7) brightness(0.76);
          transform: translate(-50%, -50%) translateX(335px) translateZ(-30px) rotateY(-20deg) scale(0.8);
        }
        .metal-tab.pos-m3 {
          z-index: 2; opacity: 0.25; filter: saturate(0.55) brightness(0.62);
          transform: translate(-50%, -50%) translateX(-438px) translateZ(-70px) rotateY(26deg) scale(0.66);
        }
        .metal-tab.pos-p3 {
          z-index: 2; opacity: 0.25; filter: saturate(0.55) brightness(0.62);
          transform: translate(-50%, -50%) translateX(438px) translateZ(-70px) rotateY(-26deg) scale(0.66);
        }
        .metal-tab.carousel-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.45);
        }
        .metal-tab.soon { opacity: 0.38; }
        .metal-tab:not(.pos-0):hover {
          opacity: 1;
          filter: saturate(1) brightness(1.06);
          border-color: color-mix(in srgb, var(--item-accent) 72%, var(--border));
        }
        .metal-tab.tapped { animation: tabTap 0.48s ease; }
        @keyframes tabTap {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--item-accent) 0%, transparent); }
          42% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--item-accent) 10%, transparent); }
        }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          width: 48px; height: 48px;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--accent) 68%, var(--border));
          background: color-mix(in srgb, var(--accent) 6%, var(--surface));
          color: var(--accent-light);
          display: grid; place-items: center;
          font-size: 25px; line-height: 1;
          cursor: pointer;
          z-index: 12;
          transform: translateY(-50%);
          box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 14%, transparent);
          transition: transform 0.2s ease, background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .carousel-arrow:hover {
          transform: translateY(-50%) scale(1.08);
          background: color-mix(in srgb, var(--accent) 14%, var(--surface));
          box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 28%, transparent);
        }
        .carousel-arrow:active { transform: translateY(-50%) scale(0.94); }
        .carousel-arrow.left { left: 6px; }
        .carousel-arrow.right { right: 6px; }

        .carousel-direction-label {
          position: absolute;
          bottom: -3px;
          font-size: 11px;
          color: color-mix(in srgb, var(--muted) 86%, transparent);
          letter-spacing: 0.2px;
          pointer-events: none;
          white-space: nowrap;
        }
        .carousel-direction-label.left { left: 0; }
        .carousel-direction-label.right { right: 0; }

        .hero-card-in {
          animation: heroCardIn 0.68s cubic-bezier(0.22, 1, 0.36, 1);
          transform-style: preserve-3d;
        }
        .hero-card.slide-right { --entry-x: 90px; --entry-rotate: 8deg; --entry-shadow: 42px; --settle-x: -5px; --settle-rotate: -1deg; }
        .hero-card.slide-left { --entry-x: -90px; --entry-rotate: -8deg; --entry-shadow: -42px; --settle-x: 5px; --settle-rotate: 1deg; }
        @keyframes heroCardIn {
          0% {
            opacity: 0;
            filter: blur(5px) brightness(1.35);
            transform: translateX(var(--entry-x, 0px)) translateY(12px) rotateY(var(--entry-rotate, 0deg)) scale(0.94);
            box-shadow: var(--entry-shadow, 0px) 0 55px -22px color-mix(in srgb, var(--accent) 70%, transparent);
          }
          62% {
            opacity: 1;
            filter: blur(0) brightness(1.08);
            transform: translateX(var(--settle-x, 0px)) translateY(-2px) rotateY(var(--settle-rotate, 0deg)) scale(1.012);
          }
          100% { opacity: 1; filter: blur(0) brightness(1); transform: translateX(0) translateY(0) rotateY(0) scale(1); }
        }
        @keyframes cardPopIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hero { padding: 20px 0 26px; text-align: center; }
        .eyebrow { font-size: 13px; color: var(--accent-light); letter-spacing: 3px; margin-bottom: 5px; transition: color 0.4s ease; }
        .page-title { margin-top: 0; font: 900 26px 'Tajawal', 'Inter', sans-serif; letter-spacing: 0; }
        .page-intro { margin: 0 0 14px; color: var(--muted); font-size: 13px; }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spinBorder { to { --angle: 360deg; } }
        @keyframes breatheShadow {
          0%, 100% { box-shadow: 0 24px 60px -30px color-mix(in srgb, var(--accent) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.04); }
          50% { box-shadow: 0 24px 70px -22px color-mix(in srgb, var(--accent) 65%, transparent), inset 0 1px 0 rgba(255,255,255,0.06); }
        }

        .hero-stage {
          position: relative;
          max-width: 930px;
          margin: 18px auto 0;
          display: flex;
          justify-content: center;
          align-items: stretch;
          min-height: 100%;
          perspective: 1200px;
          will-change: transform;
        }
        .hero-stage.stage-slide-right { animation: stageSlideRight 0.52s cubic-bezier(0.22, 1, 0.36, 1); }
        .hero-stage.stage-slide-left { animation: stageSlideLeft 0.52s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes stageSlideRight {
          from { transform: translateX(-74px); }
          72% { transform: translateX(5px); }
          to { transform: translateX(0); }
        }
        @keyframes stageSlideLeft {
          from { transform: translateX(74px); }
          72% { transform: translateX(-5px); }
          to { transform: translateX(0); }
        }

        .metal-preview-card {
          --preview-accent: var(--accent);
          --preview-accent-light: var(--accent-light);
          --preview-surface: var(--surface);
          position: absolute;
          top: 50%;
          width: 292px;
          min-height: 330px;
          padding: 26px 22px;
          border-radius: 20px;
          border: 1px solid color-mix(in srgb, var(--preview-accent) 34%, var(--border));
          background:
            radial-gradient(circle at 50% 16%, color-mix(in srgb, var(--preview-accent) 15%, transparent), transparent 38%),
            linear-gradient(180deg, color-mix(in srgb, var(--preview-accent) 5%, var(--preview-surface)), color-mix(in srgb, var(--preview-surface) 92%, black));
          color: var(--cream);
          font-family: inherit;
          cursor: pointer;
          overflow: hidden;
          opacity: 0.42;
          filter: saturate(0.72) brightness(0.8);
          box-shadow: 0 22px 50px -34px color-mix(in srgb, var(--preview-accent) 62%, transparent);
          transition:
            opacity 0.35s ease, filter 0.35s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease, box-shadow 0.35s ease;
          z-index: 1;
          text-align: center;
        }
        .metal-preview-card.preview-left {
          left: 6px;
          transform: translateY(-50%) rotateY(9deg) scale(0.9);
          transform-origin: right center;
        }
        .metal-preview-card.preview-right {
          right: 6px;
          transform: translateY(-50%) rotateY(-9deg) scale(0.9);
          transform-origin: left center;
        }
        .metal-preview-card:hover {
          opacity: 0.68;
          filter: saturate(0.95) brightness(0.96);
          border-color: color-mix(in srgb, var(--preview-accent) 72%, var(--border));
          box-shadow: 0 24px 62px -30px color-mix(in srgb, var(--preview-accent) 70%, transparent);
        }
        .metal-preview-card.preview-left:hover { transform: translateY(-50%) rotateY(5deg) scale(0.93); }
        .metal-preview-card.preview-right:hover { transform: translateY(-50%) rotateY(-5deg) scale(0.93); }
        .preview-kicker {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--preview-accent-light);
          font-size: 13px;
          margin-bottom: 18px;
        }
        .preview-kicker::before {
          content: '';
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--preview-accent);
          box-shadow: 0 0 9px color-mix(in srgb, var(--preview-accent) 60%, transparent);
        }
        .preview-ingot {
          width: 126px; height: 68px;
          margin: 0 auto 22px;
          border-radius: 9px;
          display: grid; place-items: center;
          background: linear-gradient(155deg, var(--preview-accent-light), var(--preview-accent) 48%, color-mix(in srgb, var(--preview-accent) 64%, black));
          color: rgba(20, 20, 20, 0.54);
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 1.8px;
          box-shadow: 0 16px 34px -20px color-mix(in srgb, var(--preview-accent) 78%, transparent), inset 0 1px 0 rgba(255,255,255,0.4);
          transform: perspective(420px) rotateX(8deg);
        }
        .preview-price {
          font-size: 38px;
          font-weight: 900;
          line-height: 1.05;
          color: var(--preview-accent-light);
          margin: 8px 0 12px;
          text-shadow: 0 0 24px color-mix(in srgb, var(--preview-accent) 20%, transparent);
        }
        .preview-caption { color: var(--muted); font-size: 12px; line-height: 1.7; }
        .preview-soon {
          margin-top: 28px;
          color: var(--preview-accent-light);
          font-size: 14px;
          font-weight: 600;
        }

        .hero-card {
          --angle: 0deg;
          --entry-x: 0px;
          position: relative;
          z-index: 3;
          width: min(440px, 100%);
          max-width: 440px;
          margin: 0 auto;
          padding: 30px 26px 26px;
          border-radius: 22px;
          border: 1.5px solid transparent;
          background:
            linear-gradient(180deg, var(--surface), var(--surface-2)) padding-box,
            conic-gradient(from var(--angle), transparent 0%, var(--accent) 18%, transparent 38%, transparent 62%, var(--accent) 82%, transparent 100%) border-box;
          overflow: hidden;
          animation: spinBorder 7s linear infinite,
                     breatheShadow 3.2s ease-in-out infinite;
          transition: background 0.4s ease;
        }
        .hero-card:hover { transform: translateY(-2px); }
        .hero-card .card-spark {
          position: absolute;
          bottom: -6%;
          left: var(--left);
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: var(--accent-light);
          box-shadow: 0 0 5px 1px color-mix(in srgb, var(--accent-light) 70%, transparent);
          opacity: 0;
          animation: sparkRise var(--dur) ease-in var(--delay) infinite;
          pointer-events: none;
        }

        .ingot-wrap {
          position: relative;
          width: 168px;
          margin: 0 auto 28px;
        }
        .ingot-halo {
          position: absolute;
          left: 50%; top: 50%;
          width: 260px; height: 260px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 68%);
          animation: haloPulse 3.4s ease-in-out infinite;
          pointer-events: none;
          transition: background 0.4s ease;
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(0.92); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
        .orbit-dot {
          position: absolute;
          left: 50%; top: 50%;
          width: 5px; height: 5px;
          margin-left: -2.5px; margin-top: -2.5px;
          border-radius: 50%;
          background: var(--accent-light);
          box-shadow: 0 0 8px 2px color-mix(in srgb, var(--accent-light) 80%, transparent);
          animation: orbit var(--orbit-dur) linear infinite;
          transform-origin: 0 0;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
        }

        .ingot {
          width: 168px; height: 92px; position: relative; border-radius: 10px;
          background: linear-gradient(155deg, var(--accent-light) 0%, var(--accent) 35%, var(--accent) 70%, color-mix(in srgb, var(--accent) 60%, black) 100%);
          box-shadow: 0 20px 50px -18px color-mix(in srgb, var(--accent) 55%, transparent), inset 0 2px 0 rgba(255,255,255,0.35);
          overflow: hidden; transform: perspective(500px) rotateX(8deg); transition: background 0.4s ease, transform 0.4s ease;
        }
        .hero-card:hover .ingot { transform: perspective(500px) rotateX(14deg) rotateY(-6deg) scale(1.03); }
        .ingot::before {
          content: ''; position: absolute; top: 0; bottom: 0; right: -60%; width: 45%;
          background: linear-gradient(75deg, transparent, rgba(255,255,255,0.65), transparent);
          animation: shimmer 3.2s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { right: 110%; } 55% { right: -60%; } 100% { right: -60%; } }
        .ingot-label {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 900; font-size: 13px;
          color: rgba(30, 24, 10, 0.55); letter-spacing: 2px;
        }

        .purity-tabs {
          display: inline-flex; gap: 6px; background: var(--surface); border: 1px solid var(--border);
          padding: 5px; border-radius: 999px; margin-bottom: 20px;
        }
        .purity-tab {
          padding: 7px 16px; border-radius: 999px; font-size: 13px; color: var(--muted);
          background: transparent; border: none; cursor: pointer; font-family: inherit; transition: all 0.2s ease;
        }
        .purity-tab.active { background: var(--accent); color: #1A1610; font-weight: 600; }
        .purity-tab:active { transform: scale(0.92); }

        .price-hero {
          font-weight: 900; font-size: clamp(46px, 10vw, 84px); line-height: 1; margin: 6px 0;
          background: linear-gradient(180deg, var(--accent-light), var(--accent));
          -webkit-background-clip: text; background-clip: text; color: transparent; transition: background 0.4s ease;
          display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-width: 0;
          white-space: nowrap; font-variant-numeric: tabular-nums;
          position: relative;
        }
        .price-hero.crypto-price { font-size: clamp(34px, 6vw, 62px); letter-spacing: -0.045em; }
        .price-hero.flash-up { animation: flashUp 1.1s ease; }
        .price-hero.flash-down { animation: flashDown 1.1s ease; }
        @keyframes flashUp {
          0% { filter: drop-shadow(0 0 0 var(--rise)); }
          25% { filter: drop-shadow(0 0 14px var(--rise)); }
          100% { filter: drop-shadow(0 0 0 transparent); }
        }
        @keyframes flashDown {
          0% { filter: drop-shadow(0 0 0 #C0685A); }
          25% { filter: drop-shadow(0 0 14px #C0685A); }
          100% { filter: drop-shadow(0 0 0 transparent); }
        }
        .price-arrow {
          font-size: clamp(20px, 3.2vw, 30px);
          -webkit-text-fill-color: initial;
          background: none;
          display: inline-block;
          animation: arrowPop 1.1s ease;
        }
        .price-arrow.up { color: var(--rise); }
        .price-arrow.down { color: #C0685A; }
        @keyframes arrowPop {
          0% { opacity: 0; transform: translateY(6px) scale(0.6); }
          20% { opacity: 1; transform: translateY(-2px) scale(1.15); }
          40% { transform: translateY(0) scale(1); }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        .price-sub { color: var(--muted); font-size: 15px; margin-bottom: 6px; }
        .price-sub b { color: var(--cream); font-weight: 600; }

        .currency-picker { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; max-width: 640px; margin: 18px auto 0; }
        .chip {
          border: 1px solid var(--border); background: var(--surface); color: var(--muted);
          padding: 7px 14px; border-radius: 999px; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; font-family: inherit;
        }
        .chip:hover { border-color: var(--accent); color: var(--cream); }
        .chip.active { background: color-mix(in srgb, var(--accent) 14%, transparent); border-color: var(--accent); color: var(--accent-light); }
        .chip:active { transform: scale(0.93); }

        .usd-banner {
          margin: 34px 0 10px; border: 1px solid var(--border);
          background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--accent) 2%, transparent));
          border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 14px; transition: background 0.4s ease;
        }
        .usd-banner-label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
        .usd-banner-label .flag { font-size: 20px; }
        .usd-banner-values { display: flex; gap: 26px; flex-wrap: wrap; }
        .usd-value-block { text-align: center; }
        .usd-value-block .label { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
        .usd-value-block .value { font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 700; font-size: 22px; color: var(--accent-light); }

        .gram-calculator {
          margin-top: 16px; padding: 18px 22px; border: 1px solid var(--border); border-radius: 16px;
          background: linear-gradient(110deg, color-mix(in srgb, var(--accent) 10%, transparent), var(--surface));
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 22px;
        }
        .calculator-copy p { margin: 0; color: var(--cream); font-size: 15px; line-height: 1.7; font-weight: 600; }
        .calculator-input-wrap { display: flex; align-items: center; gap: 7px; }
        .calculator-input {
          width: 120px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px;
          background: color-mix(in srgb, var(--surface-2) 88%, black); color: var(--cream); font: 700 18px 'Tajawal', sans-serif;
          text-align: center; outline: none;
        }
        .calculator-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent); }
        .calculator-unit { color: var(--muted); font-size: 13px; }
        .calculator-quick { display: flex; gap: 6px; margin-top: 8px; }
        .calculator-quick button { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 999px; padding: 4px 9px; cursor: pointer; font: inherit; font-size: 11px; }
        .calculator-quick button:hover { border-color: var(--accent); color: var(--accent-light); }
        .calculator-result { text-align: end; }
        .calculator-result span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
        .calculator-result strong { display: block; color: var(--accent-light); font: 900 28px 'Tajawal', 'Inter', sans-serif; }

        .section-title {
          font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 700; font-size: 20px; margin: 40px 0 18px;
          display: flex; align-items: baseline; gap: 10px;
        }
        .section-title span { font-size: 13px; color: var(--muted); font-weight: 400; font-family: inherit; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; padding-bottom: 50px; }

        .card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px;
          cursor: pointer; transition: border-color 0.2s ease, transform 0.15s ease; position: relative;
        }
        .card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--accent) 50%, transparent); }
        .card:active { transform: translateY(-1px) scale(0.98); }
        .card.active { border-color: var(--accent); background: var(--surface-2); }
        .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .card-flag { font-size: 20px; }
        .card-code { font-size: 11px; color: var(--muted); letter-spacing: 1px; }
        .card-name { font-size: 13px; color: var(--muted); margin-bottom: 6px; }
        .card-price { font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 700; font-size: 22px; color: var(--cream); }
        .card-price small { font-size: 12px; color: var(--muted); font-weight: 400; margin-inline-start: 4px; }

        footer { border-top: 1px solid var(--border); padding: 20px 0 32px; text-align: center; color: var(--muted); font-size: 12px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(6,4,2,0.72); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 20px; }
        .modal-box { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; max-width: 420px; width: 100%; padding: 28px; text-align: center; }
        .modal-box h3 { font-family: 'Tajawal', 'Inter', sans-serif; font-weight: 900; font-size: 20px; color: var(--accent-light); margin: 0 0 12px; }
        .modal-box p { color: var(--muted); font-size: 14px; line-height: 1.9; margin: 0 0 20px; }
        .about-social-links { display: flex; justify-content: center; gap: 10px; margin: -2px 0 22px; }
        .about-social-link {
          width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--border); border-radius: 11px; color: var(--muted); background: var(--surface-2);
          transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .about-social-link:hover { color: var(--accent-light); border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 20px -12px color-mix(in srgb, var(--accent) 70%, transparent); }
        .about-social-link svg { width: 19px; height: 19px; fill: currentColor; }
        .modal-close { border: 1px solid var(--accent); background: transparent; color: var(--accent-light); padding: 9px 22px; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 13px; }
        .modal-close:hover { background: color-mix(in srgb, var(--accent) 12%, transparent); }

        @media (max-width: 940px) {
          .metal-preview-card { display: none; }
          .hero-stage { max-width: 520px; }
          .metal-tab.pos-m3, .metal-tab.pos-p3 { opacity: 0; pointer-events: none; }
        }

        @media (max-width: 700px) {
          .spark:nth-of-type(n + 11) { display: none; }
          .streak { animation-duration: 32s; opacity: 0.45; }
          .orbit-dot { animation: none; }
          .hero-card { animation: none; box-shadow: 0 18px 42px -28px color-mix(in srgb, var(--accent) 42%, transparent); }
          .metal-carousel-shell { height: 112px; margin-top: 18px; }
          .metal-carousel-track { inset-inline: 46px; }
          .carousel-arrow { width: 40px; height: 40px; font-size: 21px; }
          .carousel-arrow.left { left: 0; }
          .carousel-arrow.right { right: 0; }
          .metal-tab { min-width: 132px; height: 52px; padding: 8px 15px; font-size: 13px; border-radius: 17px; }
          .metal-tab.pos-0 { min-width: 164px; height: 62px; font-size: 16px; }
          .metal-tab.pos-m1 { transform: translate(-50%, -50%) translateX(-142px) translateZ(18px) rotateY(10deg) scale(0.86); }
          .metal-tab.pos-p1 { transform: translate(-50%, -50%) translateX(142px) translateZ(18px) rotateY(-10deg) scale(0.86); }
          .metal-tab.pos-m2 { transform: translate(-50%, -50%) translateX(-232px) translateZ(-30px) rotateY(18deg) scale(0.67); opacity: 0.28; }
          .metal-tab.pos-p2 { transform: translate(-50%, -50%) translateX(232px) translateZ(-30px) rotateY(-18deg) scale(0.67); opacity: 0.28; }
          .metal-tab.pos-m3, .metal-tab.pos-p3 { display: none; }
          .carousel-direction-label { font-size: 10px; }
        }

        @media (max-width: 480px) {
          .container { padding-inline: 14px; }
          header.top { padding-top: 18px; }
          .nav-group { gap: 9px; }
          .status-pill { font-size: 10px; padding-inline: 9px; }
          .grid { grid-template-columns: repeat(2, 1fr); }
          .usd-banner { flex-direction: column; align-items: flex-start; }
          .gram-calculator { grid-template-columns: 1fr; gap: 14px; }
          .calculator-result { text-align: start; }
          .carousel-direction-label { display: none; }
          .metal-carousel-shell { margin-bottom: 0; }
          .hero { padding-top: 14px; }
          .hero-card { padding-inline: 18px; border-radius: 19px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-card, .hero-card-in, .hero-stage, .metal-tab, .metal-preview-card { animation-duration: 0.01ms !important; }
        }
      `}</style>

      <div className="bg-flow">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="streak"
            style={{
              "--top": `${18 + i * 30}%`,
              "--h": `${2 + i}px`,
              "--dur": `${16 + i * 5}s`,
              "--delay": `${i * 3}s`,
            }}
          />
        ))}
        {sparks.map((s) => (
          <span
            key={s.id}
            className="spark"
            style={{
              "--left": `${s.left}%`,
              "--size": `${s.size}px`,
              "--dur": `${s.duration}s`,
              "--delay": `${s.delay}s`,
              "--drift": `${s.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Google AdSense Auto Ads is loaded globally from the head; no fixed ad containers. */}

      <div className="container">
        <header className="top">
          <div className="nav-group">
            <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 9.5 8.2 5h7.6L19 9.5v7.8A1.7 1.7 0 0 1 17.3 19H6.7A1.7 1.7 0 0 1 5 17.3V9.5Z" />
                <path d="M5 9.5h14M8.2 5 10 9.5m5.8-4.5L14 9.5M9 14h6" />
              </svg>
            </div>
              <span className="brand-name">{t.brand}</span>
            </div>
            <button className="nav-link" onClick={() => setAboutOpen(true)}>
              {t.about}
            </button>
          </div>

          <div className="nav-group">
            <div className="status-pill">
              <span className={`status-dot ${status === "mock" ? "mock" : ""}`} />
              {status === "loading" && t.loading}
              {status === "live" && t.liveUpdated(timeAgo(activeData?.fetchedAtUtc || goldData?.fetchedAtUtc))}
              {status === "mock" && t.mock}
              {status === "error" && t.error}
            </div>
            <button className="lang-btn" onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}>
              {t.langToggle}
            </button>
          </div>
        </header>

        <section className="hero">
          <h1 className="eyebrow page-title">{t.seoHeading}</h1>
          <p className="page-intro">{t.seoDescription}</p>

          <div className="metal-carousel-shell">
            <button
              type="button"
              className="carousel-arrow left"
              onClick={() => rotateMetal(-1)}
              aria-label={lang === "ar" ? `السابق: ${previousMetal.ar}` : `Previous: ${previousMetal.en}`}
            >
              ←
            </button>

            <div
              className={`metal-carousel-track ${isDragging ? "dragging" : ""}`}
              style={{ transform: `translateX(${dragX * 0.18}px)` }}
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={finishCarouselSwipe}
              onPointerCancel={finishCarouselSwipe}
              onKeyDown={handleCarouselKeyDown}
              role="group"
              tabIndex={0}
              aria-label={lang === "ar" ? "اختيار المعدن بالسحب يميناً ويساراً" : "Choose a metal by swiping left or right"}
            >
              <div className="carousel-orbit" />

              {METAL_CAROUSEL_ORDER.map((key) => {
                const m = METALS[key];
                const offset = carouselOffsetForKey(key);
                const visible = Math.abs(offset) <= 3;
                const posClass =
                  offset === 0
                    ? "pos-0"
                    : offset < 0
                      ? `pos-m${Math.abs(offset)}`
                      : `pos-p${offset}`;

                return (
                  <button
                    type="button"
                    key={key}
                    dir={t.dir}
                    className={`metal-tab ${posClass} ${!visible ? "carousel-hidden" : ""} ${
                      tappedKey === key ? "tapped" : ""
                    }`}
                    style={{
                      "--item-accent": m.accent,
                      "--item-accent-light": m.accentLight,
                    }}
                    onClick={() => handleMetalButtonClick(key)}
                    aria-current={metalKey === key ? "true" : undefined}
                  >
                    <span className="dot" />
                    {m[lang]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="carousel-arrow right"
              onClick={() => rotateMetal(1)}
              aria-label={lang === "ar" ? `التالي: ${nextMetal.ar}` : `Next: ${nextMetal.en}`}
            >
              →
            </button>

            <div className="carousel-direction-label left" dir={t.dir}>
              {lang === "ar" ? `اسحب يساراً · ${previousMetal.ar}` : `Swipe left · ${previousMetal.en}`}
            </div>
            <div className="carousel-direction-label right" dir={t.dir}>
              {lang === "ar" ? `اسحب يميناً · ${nextMetal.ar}` : `Swipe right · ${nextMetal.en}`}
            </div>
          </div>

          <div className={`hero-stage stage-slide-${navDirection}`} key={metalKey}>
            <button
              type="button"
              className="metal-preview-card preview-left"
              style={{
                "--preview-accent": previousMetal.accent,
                "--preview-accent-light": previousMetal.accentLight,
                "--preview-surface": previousMetal.surface,
              }}
              onClick={() => handleMetalTap(previousMetalKey, "left")}
              aria-label={lang === "ar" ? `الانتقال إلى ${previousMetal.ar}` : `Go to ${previousMetal.en}`}
            >
              <span className="preview-kicker">{previousMetal[lang]}</span>
              <div className="preview-ingot">
                {previousMetal.symbol} 999.9
              </div>
              <div className="preview-price display">
                {previousPreviewPrice != null ? formatNumber(previousPreviewPrice, t.locale) : "—"}
              </div>
              <div className="preview-caption">
                {t.gramOf}{CURRENCY_META[selectedCurrency]?.[lang] || selectedCurrency}
              </div>
            </button>

            <button
              type="button"
              className="metal-preview-card preview-right"
              style={{
                "--preview-accent": nextMetal.accent,
                "--preview-accent-light": nextMetal.accentLight,
                "--preview-surface": nextMetal.surface,
              }}
              onClick={() => handleMetalTap(nextMetalKey, "right")}
              aria-label={lang === "ar" ? `الانتقال إلى ${nextMetal.ar}` : `Go to ${nextMetal.en}`}
            >
              <span className="preview-kicker">{nextMetal[lang]}</span>
              <div className="preview-ingot">
                {nextMetal.symbol} 999.9
              </div>
              <div className="preview-price display">
                {nextPreviewPrice != null ? formatNumber(nextPreviewPrice, t.locale) : "—"}
              </div>
              <div className="preview-caption">
                {t.gramOf}{CURRENCY_META[selectedCurrency]?.[lang] || selectedCurrency}
              </div>
            </button>

            <div className="hero-card">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="card-spark"
                  style={{
                    "--left": `${15 + i * 22}%`,
                    "--size": `${2 + (i % 2)}px`,
                    "--dur": `${4 + i * 1.3}s`,
                    "--delay": `${i * 0.8}s`,
                  }}
                />
              ))}
              <div className="ingot-wrap">
                <div className="ingot-halo" />
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="orbit-dot"
                    style={{
                      "--orbit-r": `${95 + i * 18}px`,
                      "--orbit-dur": `${9 + i * 4}s`,
                      animationDelay: `${i * -3}s`,
                    }}
                  />
                ))}
                <div className="ingot">
                  <div className="ingot-label">
                    {metal.symbol} 999.9
                  </div>
                </div>
              </div>

              {metal.purities && (
                <div className="purity-tabs">
                  {metal.purities.map((p, i) => (
                    <button
                      key={p.en}
                      className={`purity-tab ${i === purityIndex ? "active" : ""}`}
                      onClick={() => setPurityIndex(i)}
                    >
                      {t.purityPrefix} {lang === "ar" ? p.ar : p.en}
                    </button>
                  ))}
                </div>
              )}

              <div className={`price-hero display ${metal.isCrypto ? "crypto-price" : ""} ${flashDir ? `flash-${flashDir}` : ""}`}>
                {displayPrice != null ? formatNumber(displayPrice, t.locale) : "—"}
                {flashDir && (
                  <span className={`price-arrow ${flashDir}`}>
                    {flashDir === "up" ? "▲" : "▼"}
                  </span>
                )}
              </div>
              <div className="price-sub">
                {t.gramOf}
                <b>{CURRENCY_META[selectedCurrency]?.[lang] || selectedCurrency}</b>
              </div>
              {!metal.isCrypto && (
                <div className="price-sub">
                  {t.ounceLabel} <b>{heroOuncePrice ? formatNumber(heroOuncePrice, t.locale, 0) : "—"}</b>
                </div>
              )}

              <div className="currency-picker">
                {["EGP", "USD", "EUR", "GBP"]
                  .filter((c) => goldRateMap[c])
                  .map((code) => (
                    <button
                      key={code}
                      className={`chip ${selectedCurrency === code ? "active" : ""}`}
                      onClick={() => setSelectedCurrency(code)}
                    >
                      <span>{CURRENCY_META[code].flag}</span>
                      {code}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <div className="usd-banner">
          <div className="usd-banner-label">
            <span className="flag">🇺🇸</span>
            {t.usdBannerLabel} — {metal[lang]}
          </div>
          <div className="usd-banner-values">
            <div className="usd-value-block">
              <div className="label">{metal.isCrypto ? (lang === "ar" ? "السعر" : "Price") : t.usdGram}</div>
              <div className="value">${usdGram ? formatNumber(usdGram, t.locale) : "—"}</div>
            </div>
            {!metal.isCrypto && (
              <div className="usd-value-block">
                <div className="label">{t.usdOunce}</div>
                <div className="value">${usdOunce ? formatNumber(usdOunce, t.locale, 0) : "—"}</div>
              </div>
            )}
          </div>
        </div>

        {!metal.isCrypto && (
          <section className="gram-calculator" aria-label={t.calculatorTitle}>
            <div className="calculator-copy">
              <p>{t.calculatorHint}</p>
            </div>

            <div>
              <div className="calculator-input-wrap">
                <input
                  className="calculator-input"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                  aria-label={t.gramsLabel}
                />
                <span className="calculator-unit">{t.gramsUnit}</span>
              </div>
              <div className="calculator-quick" aria-label={t.gramsLabel}>
                {[1, 5, 10, 50].map((amount) => (
                  <button key={amount} type="button" onClick={() => setGrams(String(amount))}>
                    {amount} {t.gramsUnit}
                  </button>
                ))}
              </div>
            </div>

            <div className="calculator-result">
              <span>{t.totalLabel}</span>
              <strong>
                {calculatorTotal != null ? formatNumber(calculatorTotal, t.locale) : "—"} {selectedCurrency}
              </strong>
            </div>
          </section>
        )}

        <div className="section-title">
          {t.sectionTitle} <span>{metal[lang]} · {metal.isCrypto ? (lang === "ar" ? "السعر لكل عملة" : "price per coin") : t.sectionSub}</span>
        </div>

        <div className="grid" key={metalKey}>
          {orderedCurrencies.map((code, idx) => {
            const liveRate = activeRateMap[code];
            const fallbackFx = impliedFxRate(code);
            const localGram = liveRate
              ? liveRate.pricePerGram * purity.factor
              : metalUsd?.gram && fallbackFx && purity
                ? metalUsd.gram * fallbackFx * purity.factor
                : null;
            const meta = CURRENCY_META[code];
            return (
              <div
                key={code}
                className={`card ${selectedCurrency === code ? "active" : ""}`}
                style={{ animation: `cardPopIn 0.45s cubic-bezier(0.22,1,0.36,1) ${idx * 0.03}s both` }}
                onClick={() => setSelectedCurrency(code)}
              >
                <div className="card-top">
                  <span className="card-flag">{meta.flag}</span>
                  <span className="card-code">{code}</span>
                </div>
                <div className="card-name">{meta[lang]}</div>
                <div className="card-price">
                  {localGram ? formatNumber(localGram, t.locale) : "—"}
                  {!metal.isCrypto && <small>{t.perGram}</small>}
                </div>
              </div>
            );
          })}
        </div>

        <footer>
          {t.disclaimer} · {t.brand} © 2026
        </footer>
      </div>

      {aboutOpen && (
        <div className="modal-overlay" onClick={() => setAboutOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t.aboutTitle}</h3>
            <p>{t.aboutBody}</p>
            <div className="about-social-links" aria-label="Social links">
              <a className="about-social-link" href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.1 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.06A9.25 9.25 0 0 1 12 6.9c.85 0 1.7.12 2.5.35 1.9-1.34 2.74-1.06 2.74-1.06.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.77 0 3.96-2.34 4.83-4.57 5.09.36.32.68.93.68 1.88 0 1.36-.01 2.45-.01 2.79 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" /></svg>
              </a>
              <a className="about-social-link" href="https://www.linkedin.com/in/moamenosama10" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.4 3.5A2.4 2.4 0 1 1 5.4 8.3a2.4 2.4 0 0 1 0-4.8ZM3.3 9.9h4.2V21H3.3V9.9Zm6.8 0h4v1.52h.06c.56-1.06 1.92-2.18 3.95-2.18 4.22 0 5 2.84 5 6.53V21h-4.18v-4.64c0-1.1-.02-2.52-1.5-2.52-1.51 0-1.74 1.2-1.74 2.44V21H10.1V9.9Z" /></svg>
              </a>
              <a className="about-social-link" href="https://www.instagram.com/moamen_osama_10?igsh=ZXVuYW02cnZlMnl5" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.17 2A3.03 3.03 0 0 0 4 7.03v9.94A3.03 3.03 0 0 0 7.03 20h9.94A3.03 3.03 0 0 0 20 16.97V7.03A3.03 3.03 0 0 0 16.97 4H7.03ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" /></svg>
              </a>
              <a className="about-social-link" href="https://moamenosama10.github.io/" target="_blank" rel="noreferrer" aria-label="Personal website" title="Personal website">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.7 9h-3.15a15.7 15.7 0 0 0-1.3-5.05A8.05 8.05 0 0 1 18.7 11ZM12 4.05c.88 1.27 1.55 3.2 1.72 5.95h-3.44C10.45 7.25 11.12 5.32 12 4.05ZM9.75 5.95A15.7 15.7 0 0 0 8.45 11H5.3a8.05 8.05 0 0 1 4.45-5.05ZM5.3 13h3.15a15.7 15.7 0 0 0 1.3 5.05A8.05 8.05 0 0 1 5.3 13Zm6.7 6.95c-.88-1.27-1.55-3.2-1.72-5.95h3.44c-.17 2.75-.84 4.68-1.72 5.95Zm2.25-1.9A15.7 15.7 0 0 0 15.55 13h3.15a8.05 8.05 0 0 1-4.45 5.05Z" /></svg>
              </a>
            </div>
            <button className="modal-close" onClick={() => setAboutOpen(false)}>
              {t.aboutClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}