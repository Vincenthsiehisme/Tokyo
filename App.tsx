
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ItineraryItem, Location, TravelMode } from './types';
import RouteCard from './components/RouteCard';
import { MapPin, Clock, ArrowRight, X, Hotel, Calendar, Users, ExternalLink, ModeIcon, Ticket, ChevronRight, Navigation, Split, AlertTriangle, ShieldAlert, Route } from './components/Icons';

const HOTEL_LOCATION: Location = { 
  id: 'hotel-1899', 
  name: 'HOTEL 1899 TOKYO', 
  address: '東京都港区新橋6-4-1', 
  japaneseName: 'ホテル1899東京', 
  japaneseAddress: '東京都港区新橋6-4-1' 
};

// Data filled with precise Start/End times for seamless transitions
const PRESET_ITINERARY: ItineraryItem[] = [
  // --- Day 1: 12/23 ---
  {
    id: 'd1-arrival', day: 1, date: '12/23 (週二)', type: 'transit',
    location: HOTEL_LOCATION, // Added location for navigation
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 100 分', lineName: 'N\'EX / 總武線 → 山手線', direction: '往 東京 / 新橋',
      instructions: '【目標 16:30 機場發車】\n1. 14:55 降落 → 預計 16:10 出關\n2. 走到 JR 車站搭 N\'EX 或 總武線快速 → 東京站 (約 17:30 抵達)\n3. 轉 JR山手線 (往品川) → 新橋站 (約 17:40 抵達)\n4. 走「烏森口 (Karasumori Exit)」步行 10 分至飯店'
    },
    startTime: '16:10', endTime: '17:50', // Fixed
    notes: '出關 → 前往飯店'
  },
  {
    id: 'd1-hotel-arrival', day: 1, type: 'visit', startTime: '17:50', endTime: '18:20',
    location: HOTEL_LOCATION,
    notes: 'Check-in & 休息整理',
    details: '17:50 抵達大廳 Check-in\n18:20 準時出發前往晚餐。'
  },
  {
    id: 'd1-transit-dinner', day: 1, type: 'transit',
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 55 分', lineName: '銀座線', direction: '往 淺草',
      instructions: '1. 18:20 飯店出發 → 走回新橋站 (10分)\n2. 18:35 搭 Metro 銀座線 → 田原町站\n3. 步行 15-20 分至大多福'
    },
    startTime: '18:20', endTime: '19:15', // Fixed
    notes: '前往淺草晚餐'
  },
  {
    id: 'd1-dinner', day: 1, type: 'visit', startTime: '19:30', endTime: '21:30', // Fixed End Time
    isReservation: true,
    location: { id: 'otafuku', name: '淺草おden 大多福', address: '東京都台東區千束 1-6-2', japaneseName: '浅草おでん 大多福', japaneseAddress: '東京都台東区千束1-6-2' },
    notes: '★訂位時間 19:30'
  },
  {
    id: 'd1-return', day: 1, type: 'transit',
    location: HOTEL_LOCATION, // Added location for navigation
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 35 分', lineName: '銀座線', direction: '往 澀谷', lastTrain: '00:08',
      instructions: '1. 從田原町站搭銀座線回新橋站\n2. 走「烏森口」步行 10 分鐘回飯店'
    },
    startTime: '21:30', endTime: '22:05', // Fixed
    notes: '返回飯店'
  },
  { id: 'd1-rest', day: 1, type: 'visit', startTime: '22:05', location: HOTEL_LOCATION, notes: '休息 / 結束 Day 1' },

  // --- Day 2: 12/24 ---
  {
    id: 'd2-transit-lunch', day: 2, date: '12/24 (週三)', type: 'transit',
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 20 分', lineName: 'JR 山手線', direction: '往 東京',
      instructions: '新橋站 → JR山手線 (內回) → 有樂町站 → 步行至 Tokyo Midtown Hibiya'
    },
    startTime: '10:55', endTime: '11:15', // Fixed
    notes: '移動至早午餐'
  },
  {
    id: 'd2-lunch', day: 2, type: 'visit', startTime: '11:15', endTime: '13:00',
    location: { id: 'buvette', name: 'Buvette Tokyo', address: '東京 Midtown Hibiya 1F', japaneseName: 'Buvette Tokyo', japaneseAddress: '東京都千代田区有楽町1-1-2' },
    notes: '法式鄉村料理'
  },
  {
    id: 'd2-split', day: 2, type: 'split', startTime: '13:00', endTime: '16:50',
    notes: '分頭行動',
    splitGroups: [
      {
        id: 'g-shibuya', name: 'A組：澀谷',
        itinerary: [
          { 
            id: 's1', type: 'transit', startTime: '13:00', endTime: '13:20',
            transitInfo: { mode: TravelMode.TRAIN, duration: '約20分', lineName: 'JR 山手線', instructions: '有樂町站 → 澀谷站 (山手線 12分)' },
            notes: '前往澀谷'
          },
          { id: 's2', type: 'visit', startTime: '13:20', endTime: '16:30', location: { name: '澀谷 (Shibuya)', id: 'shibuya-area' }, notes: 'Shibuya Sky / Parco / 逛街' },
          { 
            id: 's5', type: 'transit', startTime: '16:30', endTime: '16:45',
            transitInfo: { mode: TravelMode.TRAIN, duration: '約10分', lineName: '東橫線', instructions: '澀谷 → 中目黑 (東橫線 2站)' },
            notes: '前往中目黑'
          }
        ]
      },
      {
        id: 'g-nakano', name: 'B組：中野',
        itinerary: [
          { 
             id: 'n0', type: 'transit', startTime: '13:00', endTime: '13:40',
             transitInfo: { mode: TravelMode.TRAIN, duration: '約40分', lineName: '中央線快速', instructions: '有樂町 → 新宿 (轉中央線) → 中野' }
          },
          { id: 'n1', type: 'visit', startTime: '13:40', endTime: '16:20', location: { name: '中野 Broadway', id: 'broadway' }, notes: '動漫挖寶' },
          { 
            id: 'n2', type: 'transit', startTime: '16:20', endTime: '17:00',
            transitInfo: { mode: TravelMode.TRAIN, duration: '約40分', lineName: '東西線/東橫線', instructions: '中野 → 中目黑' }
          }
        ]
      }
    ]
  },
  {
    id: 'd2-meetup', day: 2, type: 'meetup', startTime: '17:00', endTime: '18:30',
    location: { name: '中目黑站 (正面改札)', id: 'nakame' },
    notes: '會合 & 目黑川散步'
  },
  {
    id: 'd2-transit-dinner', day: 2, type: 'transit',
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 15 分', lineName: '東橫線', instructions: '中目黑 → 祐天寺 (1站) → 步行 10 分'
    },
    startTime: '19:00', endTime: '19:20', // Buffer for 19:30 Res
    notes: '前往燒肉晚餐'
  },
  {
    id: 'd2-dinner', day: 2, type: 'visit', startTime: '19:30', endTime: '21:30', isReservation: true,
    location: { id: 'serita', name: 'Serita (せりた) 燒肉', address: '東京都目黑區中町 1-35-9' },
    notes: '★訂位時間 19:30'
  },
  {
    id: 'd2-return', day: 2, type: 'transit',
    location: HOTEL_LOCATION, // Added location for navigation
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 45 分', lineName: '東橫線 → 山手線', lastTrain: '00:27',
      instructions: '1. 步行回祐天寺站搭東橫線至澀谷\n2. 澀谷轉 JR 山手線至新橋站\n3. 步行回飯店'
    },
    startTime: '21:30', endTime: '22:15',
    notes: '返回飯店'
  },
  { id: 'd2-rest', day: 2, type: 'visit', startTime: '22:15', location: HOTEL_LOCATION, notes: '休息 / 結束 Day 2' },

  // --- Day 3: 12/25 ---
  {
    id: 'd3-transit-shinjuku', day: 3, date: '12/25 (週四)', type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 30 分', lineName: 'JR 山手線', instructions: '新橋站 → 新宿站' },
    startTime: '10:40', endTime: '11:10',
    notes: '前往新宿'
  },
  { 
    id: 'd3-shinjuku', day: 3, type: 'visit', startTime: '11:10', endTime: '14:00', 
    location: { name: '新宿逛街', id: 'shinjuku-shopping', address: '新宿東口 / Lumine' },
    notes: 'Lumine / 伊勢丹 / 紐約早餐女王' 
  },
  {
    id: 'd3-transit-ginza', day: 3, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 30 分', lineName: 'JR 山手線', instructions: '新宿 → 有樂町 → 步行至銀座' },
    startTime: '14:00', endTime: '14:30',
    notes: '移動至銀座'
  },
  { 
    id: 'd3-ginza', day: 3, type: 'visit', startTime: '14:30', endTime: '18:00', 
    location: { name: '銀座百貨巡禮', id: 'ginza-shopping', address: '銀座中央通' },
    notes: 'Ginza Six / 三越 / Uniqlo旗艦店' 
  },
  {
    id: 'd3-transit-dinner', day: 3, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 20 分', lineName: '日比谷線', instructions: '銀座站 → 神谷町站 (Exit 5) → Janu Tokyo' },
    startTime: '18:00', endTime: '18:25',
    notes: '前往麻布台 Hills'
  },
  {
    id: 'd3-dinner', day: 3, type: 'visit', startTime: '18:30', endTime: '20:30', isReservation: true,
    location: { id: 'sumi', name: 'SUMI (Janu Tokyo)', address: '東京都港區麻布台 1-2-2' },
    notes: '★訂位時間 18:30'
  },
  {
    id: 'd3-transit-bar', day: 3, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 20 分', lineName: '日比谷線', instructions: '神谷町 → 銀座站 (C2 出口)' },
    startTime: '20:30', endTime: '20:50',
    notes: '前往銀座酒吧'
  },
  {
    id: 'd3-bar', day: 3, type: 'visit', startTime: '21:00', endTime: '23:00',
    location: { id: 'tender-bar', name: 'Ginza Tender Bar' },
    notes: '上田和男 硬搖盪'
  },
  {
    id: 'd3-return', day: 3, type: 'transit',
    location: HOTEL_LOCATION, // Added location for navigation
    transitInfo: {
      mode: TravelMode.WALK, duration: '約 15 分', lastTrain: '00:12', // Ginzaline last train as reference
      instructions: '從銀座 6 丁目步行回新橋飯店，或搭一站銀座線。'
    },
    startTime: '23:00', endTime: '23:15',
    notes: '返回飯店'
  },
  { id: 'd3-rest', day: 3, type: 'visit', startTime: '23:15', location: HOTEL_LOCATION, notes: '休息 / 結束 Day 3' },

  // --- Day 4: 12/26 ---
  {
    id: 'd4-transit-lunch', day: 4, date: '12/26 (週五)', type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 35 分', lineName: '三田線 → 大江戶線', instructions: '御成門站 → 三田 (轉) → 六本木' },
    startTime: '10:50', endTime: '11:25',
    notes: '前往六本木'
  },
  {
    id: 'd4-lunch', day: 4, type: 'visit', startTime: '11:30', endTime: '13:30', isReservation: true,
    location: { id: 'jiro', name: 'すきやばし次郎 六本木', address: '六本木 6-12-2 Residence B棟 3F' },
    notes: '★訂位時間 11:30'
  },
  {
    id: 'd4-transit-takanawa', day: 4, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 20 分', lineName: '大江戶線/山手線', instructions: '六本木 → 大門/濱松町 → 高輪Gateway' },
    startTime: '13:50', endTime: '14:15',
    notes: '前往高輪'
  },
  { 
    id: 'd4-takanawa', day: 4, type: 'visit', startTime: '14:30', endTime: '17:00', 
    location: { 
      id: 'takanawa-gateway', 
      name: '高輪 Gateway City', 
      address: '東京都港区港南2', 
      japaneseName: '高輪ゲートウェイシティ', 
      japaneseAddress: '東京都港区港南2' 
    },
    notes: '隈研吾設計新站體 / 參觀周邊開發區' 
  },
  {
    id: 'd4-transit-yokohama', day: 4, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 45 分', lineName: 'JR京濱東北線', instructions: '高輪Gateway → 橫濱 (轉港未來線) → 馬車道' },
    startTime: '17:00', endTime: '17:50',
    notes: '前往橫濱'
  },
  { 
    id: 'd4-yokohama', day: 4, type: 'visit', startTime: '18:00', endTime: '20:15', 
    location: { 
      id: 'yokohama-red-brick', 
      name: '橫濱紅磚倉庫 & chano-ma', 
      address: '神奈川県横浜市中区新港1-1 (2號館 3F)', 
      japaneseName: '横浜赤レンガ倉庫 / chano-ma', 
      japaneseAddress: '神奈川県横浜市中区新港1-1 横浜赤レンガ倉庫2号館 3F' 
    },
    notes: '紅磚倉庫夜景 / 躺著喝茶喝酒 (chano-ma)',
    details: '位於紅磚倉庫 2 號館 3F 的 chano-ma，特色是有像床一樣的白色臥榻座位，可以舒適地躺著享受音樂與餐飲。'
  },
  {
    id: 'd4-transit-bar', day: 4, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 40 分', lineName: 'JR京濱東北線', instructions: '馬車道 → 橫濱 → 大森' },
    startTime: '20:15', endTime: '20:55',
    notes: '移動至大森'
  },
  {
    id: 'd4-bar', day: 4, type: 'visit', startTime: '21:00', endTime: '23:00',
    location: { id: 'tenderly', name: 'Tenderly Bar (大森)' },
    notes: '大森經典酒吧'
  },
  {
    id: 'd4-return', day: 4, type: 'transit',
    location: HOTEL_LOCATION, // Added location for navigation
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 25 分', lineName: 'JR 京濱東北線', lastTrain: '00:15',
      instructions: '1. 大森站搭 JR 京濱東北線直達新橋站\n2. 步行回飯店'
    },
    startTime: '23:00', endTime: '23:30',
    notes: '返回飯店'
  },
  { id: 'd4-rest', day: 4, type: 'visit', startTime: '23:30', location: HOTEL_LOCATION, notes: '休息 / 結束 Day 4' },

  // --- Day 5: 12/27 ---
  {
    id: 'd5-checkout', day: 5, date: '12/27 (週六)', type: 'visit', startTime: '07:30', endTime: '09:00',
    location: { id: 'hotel-checkout', name: '飯店退房準備', address: 'HOTEL 1899' },
    notes: '起床 / 打包 / 退房'
  },
  {
    id: 'd5-transit-narita', day: 5, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 100 分', lineName: '山手線 → 總武線快速', instructions: '新橋 → 東京 → JR 成田站' },
    startTime: '09:00', endTime: '10:40',
    notes: '前往成田市區'
  },
  { 
    id: 'd5-narita-city', day: 5, type: 'visit', startTime: '10:50', endTime: '13:00',
    location: {
      id: 'chomeisen',
      name: '長命泉 (Sake store CYOUMEISEN)',
      address: '千葉県成田市上町540',
      japaneseName: '長命泉 (蔵元直営店)',
      japaneseAddress: '千葉県成田市上町540'
    },
    notes: '清酒試飲 & 鰻魚飯午餐',
    details: '成田山表參道上的知名酒造，提供清酒試飲與鰻魚飯。'
  },
  { 
    id: 'd5-transit-airport', day: 5, type: 'transit',
    transitInfo: { mode: TravelMode.TRAIN, duration: '約 30 分', lineName: 'JR/京成', instructions: '成田站 → 成田機場' },
    startTime: '13:00', endTime: '13:30',
  },
  { 
    id: 'd5-airport', day: 5, type: 'visit', startTime: '13:30',
    location: {
      id: 'nrt-airport',
      name: '成田國際機場 (NRT)',
      address: 'Narita International Airport',
      japaneseName: '成田国際空港',
    },
    notes: '辦理登機 (16:30 起飛)',
    details: '建議於起飛前 3 小時抵達機場。逛免稅店、最後採買。'
  }
];

// Version control for storage
const DATA_VERSION = 'v16'; 
const STORAGE_KEY = 'tokyo_sync_data_master'; 

export default function App() {
  const [items, setItems] = useState<ItineraryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Compare version number. If it matches, use stored data.
        // If mismatch (new code version), we skip this and fall through to return PRESET_ITINERARY
        if (parsed.version === DATA_VERSION && parsed.items && parsed.items.length > 0) {
          return parsed.items;
        }
      } catch (e) {
        console.error("Failed to parse saved itinerary", e);
      }
    }
    // Default fallback (uses new preset data)
    return PRESET_ITINERARY;
  });

  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Stores the active tab index for each split item by ID
  const [activeSplitTabs, setActiveSplitTabs] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Save items WITH version number
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      version: DATA_VERSION,
      items 
    }));
  }, [items]);

  const uniqueDays = useMemo(() => {
    const days = new Set(items.map(item => item.day || 1));
    return Array.from(days).sort((a: number, b: number) => a - b);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => (item.day || 1) === activeDay);
  }, [items, activeDay]);

  const openMap = (locationName: string, address?: string) => {
    const query = address ? `${locationName} ${address}` : locationName;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  /**
   * Generates a Google Maps Direction URL from origin to destination
   */
  const openDirections = (origin: Location, destination: Location) => {
    const start = origin.japaneseAddress || origin.address || origin.name;
    const end = destination.japaneseAddress || destination.address || destination.name;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&travelmode=transit`;
    window.open(url, '_blank');
  };

  /**
   * Finding the previous logical location for A-to-B navigation
   */
  const findPreviousLocation = (currentIndex: number, currentList: ItineraryItem[], parentSplitPrevious?: Location): Location => {
    // If it's the first item of the day, origin is Hotel
    if (currentIndex === 0) return parentSplitPrevious || HOTEL_LOCATION;

    // Search backwards for the nearest visit/meetup/split location
    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = currentList[i];
      if (item.location) return item.location;
    }

    return parentSplitPrevious || HOTEL_LOCATION;
  };

  const currentDayLabel = filteredItems.find(i => i.date)?.date || `Day ${activeDay}`;

  // Helper to calculate status of the day relative to Today (ignoring time)
  const getDayStatus = (items: ItineraryItem[]) => {
    const dateItem = items.find(i => i.date);
    if (!dateItem || !dateItem.date) return 'TODAY'; // Fallback
    
    const now = new Date();
    const currentYear = now.getFullYear(); // Uses system year
    const match = dateItem.date.match(/(\d+)\/(\d+)/);
    
    if (!match) return 'TODAY';
    
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
    // Create dates at midnight for comparison
    const targetDate = new Date(currentYear, month - 1, day);
    const today = new Date(currentYear, now.getMonth(), now.getDate());
    
    if (targetDate.getTime() < today.getTime()) return 'PAST';
    if (targetDate.getTime() > today.getTime()) return 'FUTURE';
    return 'TODAY';
  };

  const currentDayStatus = useMemo(() => getDayStatus(filteredItems), [filteredItems, currentTime.getDate()]); 

  const isTimeInPast = (timeStr: string) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    return nowH > h || (nowH === h && nowM >= m);
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const renderTimelineItem = (item: ItineraryItem, index: number, currentList: ItineraryItem[], theme: 'default' | 'purple' | 'indigo' = 'default', parentSplitPrevious?: Location) => {
    // Date-aware Status Logic
    let isPast = false;
    let isActive = false;

    if (currentDayStatus === 'PAST') {
      isPast = true;
    } else if (currentDayStatus === 'FUTURE') {
      isPast = false;
    } else {
      // TODAY: Use strict time logic
      if (item.startTime) {
        const startPassed = isTimeInPast(item.startTime);
        let endPassed = false;
        
        if (item.endTime) {
           endPassed = isTimeInPast(item.endTime);
        } else {
           // Implicit 30 min duration
           const startMins = timeToMinutes(item.startTime);
           const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
           endPassed = nowMins >= (startMins + 30);
        }
        
        if (startPassed && !endPassed) {
          isActive = true;
        } else if (endPassed) {
          isPast = true;
        }
      }
    }

    let dotClass = 'bg-tokyo-blue';
    let cardClass = 'bg-white border-gray-100 shadow-sm hover:shadow-md'; // Increased standard card shadow
    let iconBgClass = 'bg-blue-50 text-tokyo-blue';
    
    if (theme === 'purple') {
      dotClass = 'bg-purple-500';
      iconBgClass = 'bg-purple-50 text-purple-600';
    } else if (theme === 'indigo') {
      dotClass = 'bg-indigo-500';
      iconBgClass = 'bg-indigo-50 text-indigo-600';
    }

    if (item.type === 'transit') dotClass = 'bg-slate-300 w-2 h-2 left-[11px] top-4 ring-2 ring-white'; // Smaller dot
    else if (item.isReservation) dotClass = 'bg-amber-500 w-4 h-4 left-[8px] top-5';
    else if (item.type === 'meetup') dotClass = 'bg-orange-500';
    else {
      if (theme === 'default') dotClass = 'bg-tokyo-blue w-3.5 h-3.5 left-[9px] top-6';
      else dotClass = `${dotClass} w-3.5 h-3.5 left-[9px] top-6`;
    }

    if (item.isReservation) {
      cardClass = 'bg-amber-50 border-amber-300 shadow-sm';
      iconBgClass = 'bg-amber-100 text-amber-600';
    } else if (item.type === 'meetup') {
      iconBgClass = 'bg-orange-100 text-orange-600';
    }

    const prevLocation = findPreviousLocation(index, currentList, parentSplitPrevious);

    return (
      <div 
        key={item.id} 
        className={`relative pl-8 group transition-opacity duration-500 ${isPast && !isActive ? 'opacity-50' : 'opacity-100'}`} 
        onClick={() => setSelectedItem(item)}
      >
        <div className={`absolute left-[0px] rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${dotClass} ${isActive ? 'animate-pulse scale-110 ring-4 ring-blue-100' : ''}`}></div>
        
        {item.type === 'transit' && item.transitInfo ? (
           <div className="relative mb-2">
              <div 
                className="cursor-pointer active:opacity-70 transition-opacity flex items-center gap-2" 
                onClick={() => setSelectedItem(item)}
              >
                  <div className="flex-1 min-w-0">
                     <RouteCard info={item.transitInfo} startTime={item.startTime} />
                  </div>
                  {item.location && (
                     <button 
                       className="shrink-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-tokyo-blue hover:border-tokyo-blue shadow-sm transition-colors z-10"
                       onClick={(e) => {
                         e.stopPropagation();
                         openDirections(prevLocation, item.location!);
                       }}
                       title="導航至此"
                     >
                        <Route className="w-3.5 h-3.5" />
                     </button>
                  )}
              </div>
           </div>
        ) : (
          <div className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${cardClass} ${isActive ? 'border-tokyo-blue ring-2 ring-tokyo-blue/10' : ''}`}>
            {item.isReservation && (
              <div className="absolute top-0 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-b shadow-sm z-10">RESERVED</div>
            )}
            <div className={`p-4 flex gap-3 ${item.isReservation ? 'pr-20' : ''}`}>
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${iconBgClass}`}>
                 {item.isReservation ? <Ticket className="w-5 h-5" /> : item.type === 'meetup' ? <Users className="w-5 h-5" /> : item.location?.id?.includes('hotel') ? <Hotel className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold mb-0.5 flex flex-wrap items-center gap-1 ${isActive ? 'text-tokyo-blue' : item.isReservation ? 'text-amber-700' : 'text-slate-400'}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{item.startTime} <span className="text-[10px] opacity-80 uppercase">抵達</span></span>
                  {item.endTime && (
                    <>
                      <ArrowRight className="w-3 h-3 mx-1 opacity-50" />
                      <span>{item.endTime} <span className="text-[10px] opacity-80 uppercase">預計離開</span></span>
                    </>
                  )}
                  {isActive && <span className="ml-2 bg-tokyo-blue text-white px-1.5 py-0.5 rounded-full text-[9px] animate-pulse">LIVE</span>}
                </div>
                <h3 className={`font-bold text-lg leading-tight truncate ${item.isReservation ? 'text-amber-900' : 'text-slate-800'}`}>
                  {item.location?.name || '未命名行程'}
                </h3>
                <p className={`text-sm mt-1 truncate ${item.isReservation ? 'text-amber-800/70' : 'text-slate-500'}`}>{item.notes}</p>
              </div>
            </div>
            
            {/* Contextual Smart Buttons */}
            {item.location && (
               <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                 {/* Route Button (A to B) */}
                 <button 
                   className="w-8 h-8 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all" 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     if(item.location) openDirections(prevLocation, item.location); 
                   }}
                   title={`從 ${prevLocation.name} 導航至此`}
                 >
                   <Route className="w-4 h-4" />
                 </button>
                 {/* Map Button (Just B) */}
                 <button 
                   className="w-8 h-8 bg-blue-50 text-tokyo-blue rounded-full flex items-center justify-center shadow-sm border border-blue-100 hover:bg-blue-100 active:scale-90 transition-all" 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     if(item.location) openMap(item.location.name, item.location.address); 
                   }}
                 >
                   <Navigation className="w-4 h-4" />
                 </button>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-8 relative overflow-x-hidden">
      <header className="bg-tokyo-red text-white p-5 shadow-lg sticky top-0 z-30">
        <h1 className="text-xl font-bold tracking-wider">東京智慧旅遊規劃</h1>
      </header>

      <div className="bg-white shadow-sm border-b sticky top-[68px] z-20 overflow-x-auto scrollbar-hide">
        <div className="flex px-2 py-2 space-x-2 min-w-max">
          {uniqueDays.map(day => (
            <button key={day} onClick={() => setActiveDay(day)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeDay === day ? 'bg-tokyo-blue text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              Day {day}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center text-tokyo-blue font-semibold">
        <Calendar className="w-4 h-4 mr-2" />
        {currentDayLabel}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 relative">
        {filteredItems.length === 0 ? <div className="text-center py-12 text-gray-400"><p>這一天沒有行程</p></div> : (
          <div className="relative pl-4 space-y-6">
            <div className="absolute left-4 top-2 bottom-4 w-[1.5px] bg-slate-200/80 z-0"></div>
            
            {filteredItems.map((item, index) => {
              if (item.type === 'split') {
                const parentPrevLocation = findPreviousLocation(index, filteredItems);
                const activeTab = activeSplitTabs[item.id] || 0;
                const activeGroup = item.splitGroups?.[activeTab];
                
                if (!activeGroup) return null;

                return (
                  <div key={item.id} className="relative z-10 pl-0 mt-6 mb-8 bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Split Card Header - Adjusted background for grouping */}
                    <div className="bg-slate-200/40 p-3 border-b border-slate-200 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm"><Split className="w-4 h-4 text-gray-500" /></div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">分頭行動</span>
                       </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="p-3">
                       <div className="flex bg-white/50 p-1 rounded-xl border border-slate-100">
                          {item.splitGroups?.map((group, idx) => {
                             const isActive = idx === activeTab;
                             return (
                               <button 
                                 key={group.id}
                                 onClick={() => setActiveSplitTabs(prev => ({ ...prev, [item.id]: idx }))}
                                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-white shadow-sm text-tokyo-blue ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                               >
                                  <Users className={`w-3 h-3 ${isActive ? 'text-tokyo-blue' : 'text-gray-400'}`} />
                                  {group.name.split('：')[0]} {/* Simplified Name */}
                               </button>
                             );
                          })}
                       </div>
                    </div>
                    
                    {/* Active Itinerary Content */}
                    <div className="relative pb-6 px-2">
                       {/* Timeline Guide - Independent within split group */}
                       <div className={`absolute left-[18px] top-2 bottom-4 w-[1.5px] z-0 ${activeTab === 0 ? 'bg-purple-200' : 'bg-indigo-200'}`}></div>
                       
                       <div className="space-y-6 mt-2">
                           <div className={`relative z-10 text-xs font-bold px-3 py-1.5 mx-auto rounded-lg w-fit flex items-center shadow-sm border ${activeTab === 0 ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                             {activeGroup.name}
                           </div>

                           {activeGroup.itinerary.map((subItem, subIdx) => 
                             renderTimelineItem(subItem, subIdx, activeGroup.itinerary, activeTab === 0 ? 'purple' : 'indigo', parentPrevLocation)
                           )}
                       </div>
                    </div>
                  </div>
                );
              }
              return renderTimelineItem(item, index, filteredItems);
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`p-5 text-white shrink-0 ${selectedItem.isReservation ? 'bg-amber-500' : selectedItem.type === 'transit' ? 'bg-slate-700' : selectedItem.type === 'meetup' ? 'bg-orange-500' : selectedItem.type === 'split' ? 'bg-purple-600' : 'bg-tokyo-blue'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="opacity-80 text-xs font-semibold tracking-wider mb-1 uppercase">
                    {selectedItem.isReservation ? '預約行程' : selectedItem.type === 'transit' ? '交通行程' : '行程詳細'}
                  </div>
                  <h2 className="text-xl font-bold">{selectedItem.location?.name || selectedItem.transitInfo?.lineName || '行程'}</h2>
                </div>
                <button onClick={() => setSelectedItem(null)} className="bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="mt-3 flex items-center text-sm font-medium bg-black/10 w-fit px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 mr-1.5" />{selectedItem.startTime} {selectedItem.endTime && ` - ${selectedItem.endTime}`}
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Last Train Warning */}
              {selectedItem.transitInfo?.lastTrain && (
                <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-red-900 font-bold text-sm">末班車安全預警</h4>
                    <p className="text-red-700 text-xs mt-1">末班車預計為 <span className="font-bold underline">{selectedItem.transitInfo.lastTrain}</span>，建議提早抵達月台。</p>
                  </div>
                </div>
              )}

              {/* A to B Navigation Section (Smart Suggestion) */}
              {selectedItem.location && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">A to B 智慧導航</h4>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 mb-3">
                      <span className="bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">起點</span>
                      <ArrowRight className="w-3 h-3 text-blue-300" />
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">目的地</span>
                    </div>
                    {/* Compute prev location for this modal specifically */}
                    {(() => {
                        // Finding where selectedItem is in the overall items for directions
                        let idx = filteredItems.findIndex(i => i.id === selectedItem.id);
                        let prev = HOTEL_LOCATION;
                        if (idx !== -1) {
                            prev = findPreviousLocation(idx, filteredItems);
                        } else {
                            // Might be in a split
                            for (const split of filteredItems.filter(i => i.type === 'split')) {
                                for (const group of split.splitGroups || []) {
                                    const subIdx = group.itinerary.findIndex(i => i.id === selectedItem.id);
                                    if (subIdx !== -1) {
                                        const parentIdx = filteredItems.findIndex(i => i.id === split.id);
                                        const parentPrev = findPreviousLocation(parentIdx, filteredItems);
                                        prev = findPreviousLocation(subIdx, group.itinerary, parentPrev);
                                        break;
                                    }
                                }
                            }
                        }
                        
                        return (
                          <div className="space-y-4">
                            <div className="text-sm text-slate-700 flex flex-col gap-1">
                               <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>從：{prev.name}</p>
                               <p className="flex items-center gap-2 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>到：{selectedItem.location.name}</p>
                            </div>
                            <button 
                              onClick={() => selectedItem.location && openDirections(prev, selectedItem.location)} 
                              className="w-full py-3 bg-tokyo-blue text-white rounded-xl font-bold flex items-center justify-center shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                            >
                              <Route className="w-5 h-5 mr-2" /> 啟動大眾運輸導航
                            </button>
                          </div>
                        );
                    })()}
                  </div>
                </div>
              )}

              {selectedItem.location && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">景點地址</h4>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="font-semibold">{selectedItem.location.japaneseName}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedItem.location.japaneseAddress || selectedItem.location.address}</p>
                  </div>
                </div>
              )}

              {(selectedItem.transitInfo || selectedItem.details || selectedItem.notes) && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">更多細節</h4>
                  {selectedItem.transitInfo && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
                      {selectedItem.transitInfo.instructions}
                    </div>
                  )}
                  {(selectedItem.details || selectedItem.notes) && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {selectedItem.details || selectedItem.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
               <button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
