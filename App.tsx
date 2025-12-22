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

// Day 5 固定地點 - 完整英文地址版
const NARITA_AIRPORT_T1: Location = {
  id: 'nrt-t1',
  name: '成田機場 T1',
  address: '1-1 Furugome, Narita, Chiba 282-0004, Japan',  // ✅ 使用完整英文地址
  japaneseName: '成田空港 第1ターミナル',
  japaneseAddress: '〒282-0004 千葉県成田市古込1-1'  // ✅ 加上郵遞區號
};

const JR_NARITA_STATION: Location = {
  id: 'jr-narita',
  name: 'JR 成田站',
  address: '839 Hanazakicho, Narita, Chiba 286-0033, Japan',
  japaneseName: 'JR成田駅',
  japaneseAddress: '〒286-0033 千葉県成田市花崎町839'
};

const CHOMEISEN_RESTAURANT: Location = {
  id: 'chomeisen',
  name: '長命泉 (蔵元直営店)',
  address: '540 Kamicho, Narita, Chiba 286-0011, Japan',
  japaneseName: '長命泉',
  japaneseAddress: '〒286-0011 千葉県成田市上町540'
};

// Data filled with precise Start/End times for seamless transitions
const PRESET_ITINERARY: ItineraryItem[] = [
  // --- Day 1: 12/23 ---
  {
    id: 'd1-arrival', day: 1, date: '12/23 (週二)', type: 'transit',
    location: HOTEL_LOCATION,
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 100 分', lineName: 'N\'EX / 總武線 → 山手線', direction: '往 東京 / 新橋',
      instructions: '【目標 16:30 機場發車】\n1. 14:55 降落 → 預計 16:10 出關\n2. 走到 JR 車站搭 N\'EX 或 總武線快速 → 東京站 (約 17:30 抵達)\n3. 轉 JR山手線 (往品川) → 新橋站 (約 17:40 抵達)\n4. 走「烏森口 (Karasumori Exit)」步行 10 分至飯店'
    },
    startTime: '16:10', endTime: '17:50',
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
    startTime: '18:20', endTime: '19:15',
    notes: '前往淺草晚餐'
  },
  {
    id: 'd1-dinner', day: 1, type: 'visit', startTime: '19:30', endTime: '21:30',
    isReservation: true,
    location: { id: 'otafuku', name: '淺草おden 大多福', address: '東京都台東區千束 1-6-2', japaneseName: '浅草おでん 大多福', japaneseAddress: '東京都台東区千束1-6-2' },
    notes: '★訂位時間 19:30'
  },
  {
    id: 'd1-return', day: 1, type: 'transit',
    location: HOTEL_LOCATION,
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 35 分', lineName: '銀座線', direction: '往 澀谷', lastTrain: '00:08',
      instructions: '1. 從田原町站搭銀座線回新橋站\n2. 走「烏森口」步行 10 分鐘回飯店'
    },
    startTime: '21:30', endTime: '22:05',
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
    startTime: '10:55', endTime: '11:15',
    notes: '移動至早午餐'
  },
  {
    id: 'd2-lunch', day: 2, type: 'visit', startTime: '11:15', endTime: '13:00',
    location: { id: 'buvette', name: 'Buvette Tokyo', address: 'Tokyo Midtown Hibiya 1F', japaneseName: 'Buvette Tokyo', japaneseAddress: '東京都千代田区有楽町1-1-2' },
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
    startTime: '19:00', endTime: '19:20',
    notes: '前往燒肉晚餐'
  },
  {
    id: 'd2-dinner', day: 2, type: 'visit', startTime: '19:30', endTime: '21:30', isReservation: true,
    location: { id: 'serita', name: 'Serita (せりた) 燒肉', address: '東京都目黑區中町 1-35-9' },
    notes: '★訂位時間 19:30'
  },
  {
    id: 'd2-return', day: 2, type: 'transit',
    location: HOTEL_LOCATION,
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
    location: HOTEL_LOCATION,
    transitInfo: {
      mode: TravelMode.WALK, duration: '約 15 分', lastTrain: '00:12',
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
    location: HOTEL_LOCATION,
    transitInfo: {
      mode: TravelMode.TRAIN, duration: '約 25 分', lineName: 'JR 京濱東北線', lastTrain: '00:15',
      instructions: '1. 大森站搭 JR 京濱東北線直達新橋站\n2. 步行回飯店'
    },
    startTime: '23:00', endTime: '23:30',
    notes: '返回飯店'
  },
  { id: 'd4-rest', day: 4, type: 'visit', startTime: '23:30', location: HOTEL_LOCATION, notes: '休息 / 結束 Day 4' },

  // --- Day 5: 12/27 (完全重構版) ---
  {
    id: 'd5-checkout',
    day: 5,
    date: '12/27 (週六)',
    type: 'visit',
    startTime: '07:30',
    endTime: '08:30',
    location: HOTEL_LOCATION,
    notes: '起床 / 打包 / 退房',
    details: '請在 08:30 準時離開飯店，確保不延誤 N\'EX 班次。',
    warningLevel: 'normal'
  },
  {
    id: 'd5-nex-to-airport',
    day: 5,
    type: 'transit',
    startTime: '08:30',
    endTime: '10:15',
    location: NARITA_AIRPORT_T1,
    transitInfo: {
      mode: TravelMode.TRAIN,
      duration: '約 105 分',
      lineName: 'JR 山手線 → N\'EX',
      direction: '往 成田機場',
      instructions: '1. 新橋站搭 JR 山手線至東京站 (約 10 分)\n2. 東京站轉乘 N\'EX 成田特快 (約 60 分)\n3. 抵達成田機場 T1 地下車站 (10:15)',
      cost: '¥3,070'
    },
    notes: '前往成田機場 T1',
    warningLevel: 'normal'
  },
  {
    id: 'd5-luggage-storage',
    day: 5,
    type: 'visit',
    startTime: '10:15',
    endTime: '11:15',
    location: NARITA_AIRPORT_T1,
    notes: '⚠️ 寄放行李（大型置物櫃）',
    details: '**置物櫃攻略：**\n• 位置：T1 地下車站出口附近（B1F）\n• 大型行李櫃：600-700 円 / 日\n• 前 6 小時最划算\n• ⚠️ 記得拍照櫃號與位置！\n• 建議尋找靠近電梯的櫃位，回程取行李較方便',
    warningLevel: 'caution'
  },
  {
    id: 'd5-transit-narita-city',
    day: 5,
    type: 'transit',
    startTime: '11:15',
    endTime: '11:35',
    location: JR_NARITA_STATION,
    transitInfo: {
      mode: TravelMode.TRAIN,
      duration: '約 11-16 分',
      lineName: 'JR 成田線',
      direction: '往 佐倉',
      instructions: '機場 T1 地下車站 → JR 成田站 (僅 1 站)\n月台：B1F 第 5-6 號月台',
      cost: '¥260'
    },
    notes: '前往 JR 成田站',
    warningLevel: 'normal'
  },
  {
    id: 'd5-chomeisen-lunch',
    day: 5,
    type: 'visit',
    startTime: '11:45',
    endTime: '13:20',
    location: CHOMEISEN_RESTAURANT,
    notes: '清酒（13:20 必須離開）',
    details: '**長命泉酒藏直營店：**\n• 地點：成田山表參道（JR 成田站東口徒步 10 分）\n• 推薦：清酒試飲套組 + 鰻魚飯套餐\n• 營業時間：10:00-17:00\n\n⚠️ **絕對撤退時間：13:20**\n• 13:20 必須結帳離開餐廳\n• 13:35 前走回 JR 成田站\n• 逾時將無法趕上 Peach 15:40 關櫃！',
    strictDeadline: '13:20 必須出發',
    warningLevel: 'critical'
  },
  {
    id: 'd5-return-airport',
    day: 5,
    type: 'transit',
    startTime: '13:20',
    endTime: '14:00',
    location: NARITA_AIRPORT_T1,
    transitInfo: {
      mode: TravelMode.TRAIN,
      duration: '約 30-40 分',
      lineName: 'JR 成田線',
      direction: '往 成田空港',
      instructions: '1. 步行回 JR 成田站（15 分內）\n2. 搭乘成田線回機場 T1（11-16 分）\n3. 前往 B1 置物櫃取行李（15 分）\n4. 搭電梯至 T1 國際線 4F 出境大廳\n5. 14:00 前務必抵達 Peach 櫃檯',
      cost: '¥260',
      lastTrain: '13:48'
    },
    notes: '返回機場 T1（14:00 前抵達）',
    details: '**重要提醒：**\n• 最晚搭乘班次：13:48 發車\n• 建議搭乘：13:35-13:40 之間班次\n• 給予取行李 + 移動的緩衝時間',
    strictDeadline: '13:48 最後班車',
    warningLevel: 'critical'
  },
  {
    id: 'd5-peach-checkin',
    day: 5,
    type: 'visit',
    startTime: '14:00',
    endTime: '16:30',
    isReservation: true,
    location: NARITA_AIRPORT_T1,
    notes: '報到 & 登機',
    details: '**Peach MM626 航班資訊：**\n• 航班：MM626 成田 (NRT) → 桃園 (TPE)\n• 報到櫃檯：T1 南翼 4F (Check-in Counter L)\n• 開櫃時間：14:00\n• ⚠️ **關櫃時間：15:40（嚴格執行，逾時無法登機）**\n• 登機時間：16:00\n• 起飛時間：16:30\n\n**建議流程：**\n1. 14:00-14:30：報到 + 託運行李\n2. 14:30-15:00：通過安檢\n3. 15:00-15:30：通過海關 + 逛免稅店\n4. 15:30-16:00：前往登機門候機\n5. 16:00：開始登機\n\n⚠️ **Peach 為廉航，準點要求嚴格！**\n建議 14:30 前完成報到手續。',
    strictDeadline: '15:40 關櫃（嚴格執行）',
    warningLevel: 'critical'
  }
];

// Version control for storage
const DATA_VERSION = 'v21';  // ✅ 版本號更新（從 v20 → v21）
const STORAGE_KEY = 'tokyo_sync_data_master'; 

export default function App() {
  const [items, setItems] = useState<ItineraryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.version === DATA_VERSION && parsed.items && parsed.items.length > 0) {
          return parsed.items;
        }
      } catch (e) {
        console.error("Failed to parse saved itinerary", e);
      }
    }
    return PRESET_ITINERARY;
  });

  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSplitTabs, setActiveSplitTabs] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  const openDirections = (origin: Location, destination: Location) => {
    const start = origin.japaneseAddress || origin.address || origin.name;
    const end = destination.japaneseAddress || destination.address || destination.name;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&travelmode=transit`;
    window.open(url, '_blank');
  };

  const findPreviousLocation = (currentIndex: number, currentList: ItineraryItem[], parentSplitPrevious?: Location): Location => {
    if (currentIndex === 0) return parentSplitPrevious || HOTEL_LOCATION;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = currentList[i];
      if (item.location) return item.location;
    }
    return parentSplitPrevious || HOTEL_LOCATION;
  };

  // Warning Level 視覺樣式
  const getWarningStyle = (level?: 'normal' | 'caution' | 'critical') => {
    switch(level) {
      case 'critical':
        return {
          cardClass: 'bg-red-50 border-red-300 shadow-md',
          iconBgClass: 'bg-red-100 text-red-600',
          dotClass: 'bg-red-500 animate-pulse w-4 h-4 left-[8px] top-5'
        };
      case 'caution':
        return {
          cardClass: 'bg-yellow-50 border-yellow-300 shadow-sm',
          iconBgClass: 'bg-yellow-100 text-yellow-700',
          dotClass: 'bg-yellow-500 w-3.5 h-3.5 left-[9px] top-6'
        };
      default:
        return {
          cardClass: 'bg-white border-gray-100 shadow-sm hover:shadow-md',
          iconBgClass: 'bg-blue-50 text-tokyo-blue',
          dotClass: 'bg-tokyo-blue w-3.5 h-3.5 left-[9px] top-6'
        };
    }
  };

  // 計算距離死線還有多久
  const getTimeUntilDeadline = (deadlineTime: string) => {
    const [h, m] = deadlineTime.split(':').map(Number);
    const deadline = new Date();
    deadline.setHours(h, m, 0);
    
    const now = new Date();
    const diffMinutes = Math.floor((deadline.getTime() - now.getTime()) / 60000);
    
    if (diffMinutes < 0) return { text: '已超過截止時間！', level: 'critical' };
    if (diffMinutes < 30) return { text: `⚠️ 僅剩 ${diffMinutes} 分鐘！`, level: 'critical' };
    if (diffMinutes < 60) return { text: `還有 ${diffMinutes} 分鐘`, level: 'caution' };
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return { text: `還有 ${hours} 小時 ${mins} 分`, level: 'normal' };
  };

  const currentDayLabel = filteredItems.find(i => i.date)?.date || `Day ${activeDay}`;

  const getDayStatus = (items: ItineraryItem[]) => {
    const dateItem = items.find(i => i.date);
    if (!dateItem || !dateItem.date) return 'TODAY';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const match = dateItem.date.match(/(\d+)\/(\d+)/);
    
    if (!match) return 'TODAY';
    
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
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
    let isPast = false;
    let isActive = false;

    if (currentDayStatus === 'PAST') {
      isPast = true;
    } else if (currentDayStatus === 'FUTURE') {
      isPast = false;
    } else {
      if (item.startTime) {
        const startPassed = isTimeInPast(item.startTime);
        let endPassed = false;
        
        if (item.endTime) {
           endPassed = isTimeInPast(item.endTime);
        } else {
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

    const warningStyles = getWarningStyle(item.warningLevel);
    let dotClass = warningStyles.dotClass;
    let cardClass = warningStyles.cardClass;
    let iconBgClass = warningStyles.iconBgClass;
    
    if (theme === 'purple') {
      dotClass = 'bg-purple-500 w-3.5 h-3.5 left-[9px] top-6';
      iconBgClass = 'bg-purple-50 text-purple-600';
    } else if (theme === 'indigo') {
      dotClass = 'bg-indigo-500 w-3.5 h-3.5 left-[9px] top-6';
      iconBgClass = 'bg-indigo-50 text-indigo-600';
    }

    if (item.type === 'transit') dotClass = 'bg-slate-300 w-2 h-2 left-[11px] top-4 ring-2 ring-white';
    else if (item.isReservation) {
      dotClass = 'bg-amber-500 w-4 h-4 left-[8px] top-5';
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
        <div className={`absolute left-[0px] rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 z-20 ${dotClass} ${isActive ? 'animate-pulse scale-110 ring-4 ring-blue-100' : ''}`}></div>
        
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
                       className="shrink-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-tokyo-blue hover:border-tokyo-blue shadow-sm transition-colors z-30"
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
            {item.strictDeadline && (
              <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 flex items-center gap-1 justify-center z-20">
                <ShieldAlert className="w-3 h-3" />
                {item.strictDeadline}
              </div>
            )}
            
            {item.isReservation && !item.strictDeadline && (
              <div className="absolute top-0 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-b shadow-sm z-10">RESERVED</div>
            )}
            
            <div className={`p-4 flex gap-3 ${item.isReservation || item.strictDeadline ? 'pt-6' : ''} ${item.isReservation && !item.strictDeadline ? 'pr-20' : ''}`}>
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${iconBgClass}`}>
                 {item.isReservation ? <Ticket className="w-5 h-5" /> : item.type === 'meetup' ? <Users className="w-5 h-5" /> : item.location?.id?.includes('hotel') ? <Hotel className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold mb-0.5 flex flex-wrap items-center gap-1 ${isActive ? 'text-tokyo-blue' : item.warningLevel === 'critical' ? 'text-red-700' : item.isReservation ? 'text-amber-700' : 'text-slate-400'}`}>
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
                <h3 className={`font-bold text-lg leading-tight truncate ${item.warningLevel === 'critical' ? 'text-red-900' : item.isReservation ? 'text-amber-900' : 'text-slate-800'}`}>
                  {item.location?.name || '未命名行程'}
                </h3>
                <p className={`text-sm mt-1 truncate ${item.warningLevel === 'critical' ? 'text-red-800/70' : item.isReservation ? 'text-amber-800/70' : 'text-slate-500'}`}>{item.notes}</p>
              </div>
            </div>
            
            {item.location && (
               <div className="absolute bottom-3 right-3 flex gap-2 z-30">
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
            <div className="absolute left-4 top-2 bottom-4 w-[1.5px] bg-slate-200/80 -z-10"></div>
            
            {filteredItems.map((item, index) => {
              if (item.type === 'split') {
                const parentPrevLocation = findPreviousLocation(index, filteredItems);
                const activeTab = activeSplitTabs[item.id] || 0;
                const activeGroup = item.splitGroups?.[activeTab];
                
                if (!activeGroup) return null;

                return (
                  <div key={item.id} className="relative z-10 pl-0 mt-6 mb-8 bg-slate-100/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-200/40 p-3 border-b border-slate-200 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm"><Split className="w-4 h-4 text-gray-500" /></div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">分頭行動</span>
                       </div>
                    </div>

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
                                  {group.name.split('：')[0]}
                               </button>
                             );
                          })}
                       </div>
                    </div>
                    
                    <div className="relative pb-6 px-2">
                       <div className={`absolute left-[18px] top-2 bottom-4 w-[1.5px] -z-10 ${activeTab === 0 ? 'bg-purple-200' : 'bg-indigo-200'}`}></div>
                       
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
            <div className={`p-5 text-white shrink-0 ${selectedItem.warningLevel === 'critical' ? 'bg-red-600' : selectedItem.isReservation ? 'bg-amber-500' : selectedItem.type === 'transit' ? 'bg-slate-700' : selectedItem.type === 'meetup' ? 'bg-orange-500' : selectedItem.type === 'split' ? 'bg-purple-600' : 'bg-tokyo-blue'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="opacity-80 text-xs font-semibold tracking-wider mb-1 uppercase">
                    {selectedItem.warningLevel === 'critical' ? '⚠️ 關鍵行程' : selectedItem.isReservation ? '預約行程' : selectedItem.type === 'transit' ? '交通行程' : '行程詳細'}
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
              {selectedItem.strictDeadline && selectedItem.endTime && (
                <div className="mb-6 bg-red-50 border-2 border-red-300 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-red-900 font-bold text-sm mb-1">絕對死線警告</h4>
                      <p className="text-red-700 text-xs mb-2">{selectedItem.strictDeadline}</p>
                      {(() => {
                        const countdown = getTimeUntilDeadline(selectedItem.endTime!);
                        return (
                          <div className={`text-sm font-bold ${countdown.level === 'critical' ? 'text-red-600' : countdown.level === 'caution' ? 'text-yellow-700' : 'text-gray-700'}`}>
                            {countdown.text}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.transitInfo?.lastTrain && (
                <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-red-900 font-bold text-sm">末班車安全預警</h4>
                    <p className="text-red-700 text-xs mt-1">末班車預計為 <span className="font-bold underline">{selectedItem.transitInfo.lastTrain}</span>，建議提早抵達月台。</p>
                  </div>
                </div>
              )}

              {selectedItem.location && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">A to B 智慧導航</h4>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 mb-3">
                      <span className="bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">起點</span>
                      <ArrowRight className="w-3 h-3 text-blue-300" />
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">目的地</span>
                    </div>
                    {(() => {
                        let idx = filteredItems.findIndex(i => i.id === selectedItem.id);
                        let prev = HOTEL_LOCATION;
                        if (idx !== -1) {
                            prev = findPreviousLocation(idx, filteredItems);
                        } else {
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
                    <p className="font-semibold">{selectedItem.location.japaneseName || selectedItem.location.name}</p>
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
