import { GoogleGenAI } from "@google/genai";
import { TravelMode } from '../types';

// Support both build-time and runtime environment variables
const getApiKey = () => {
  // @ts-ignore - Vite injects import.meta.env at build time
  if (typeof import !== 'undefined' && import.meta?.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // Fallback to process.env for SSR/build
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_API_KEY || process.env.API_KEY || '';
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey && apiKey !== 'DUMMY_KEY_FOR_BUILD' ? new GoogleGenAI({ apiKey }) : null;

const modelName = 'gemini-3-flash-preview';

const cleanJson = (text: string) => {
  return text.replace(/```json\s*|\s*```/g, '').trim();
};

export const getRouteInfo = async (
  origin: string,
  destination: string,
  time: string
) => {
  try {
    if (!ai || !apiKey || apiKey === 'DUMMY_KEY_FOR_BUILD') {
      console.warn("API Key is missing or invalid, returning mock data.");
      return {
        transitInfo: {
          mode: TravelMode.TRAIN,
          duration: "需設定API Key",
          lineName: "API Key 未設定",
          instructions: "請在 Vercel 環境變數中設定 VITE_API_KEY 以啟用即時規劃功能。",
          cost: "---"
        },
        notes: "系統偵測到 API Key 遺失。"
      };
    }

    const prompt = `
      你是專業的東京導遊。請規劃從東京的 "${origin}" 到 "${destination}" 的最佳交通路線。
      假設當前時間：${time}。
      
      請遵循以下規則：
      1. 優先考慮效率高的電車（JR, Metro）。
      2. 請以繁體中文 (Traditional Chinese) 回答。
      3. 務必回傳純 JSON 格式，不要包含其他文字。
      
      JSON 格式結構如下：
      {
        "transitInfo": {
          "mode": "TRAIN" | "WALK" | "TAXI" | "BUS",
          "duration": "例如：15分鐘",
          "lineName": "例如：JR山手線",
          "cost": "例如：¥200",
          "instructions": "簡短的轉乘或步行指示"
        },
        "estimatedArrivalTime": "預計到達時間",
        "notes": "關於此路線的簡短備註（例如：最快路線、換乘較少）"
      }
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(cleanJson(response.text));
  } catch (error) {
    console.error("Gemini Route Error:", error);
    return {
      transitInfo: {
        mode: TravelMode.TRAIN,
        duration: "未知",
        lineName: "請查詢地圖",
        instructions: "無法取得路線資訊，請檢查網路連線或 API 設定。",
        cost: "---"
      },
      notes: "暫時無法規劃路線。"
    };
  }
};

export const suggestSplitPlan = async (
  origin: string,
  groupAInterest: string,
  groupBInterest: string,
  availableTime: string
) => {
  try {
    if (!ai || !apiKey || apiKey === 'DUMMY_KEY_FOR_BUILD') {
      throw new Error("API Key is missing");
    }

    const prompt = `
      我們現在在東京的 "${origin}"。我們有 ${availableTime} 小時的時間。
      請規劃分頭行動的行程：
      - A組興趣：${groupAInterest}
      - B組興趣：${groupBInterest}
      
      請建議雙方分頭行動的簡短行程，並建議一個對雙方都方便的會合地點和時間。
      請以繁體中文 (Traditional Chinese) 回答。
      務必回傳純 JSON 格式，不要包含其他文字。
      
      JSON 格式結構如下：
      {
        "groupA_Plan": ["A組活動1", "A組活動2"],
        "groupB_Plan": ["B組活動1", "B組活動2"],
        "meetupRecommendation": {
          "locationName": "會合地點名稱",
          "reason": "選擇此地點的原因",
          "time": "建議會合時間"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(cleanJson(response.text));
  } catch (error) {
    console.error("Gemini Split Error:", error);
    throw new Error("無法生成分頭行程,請稍後再試。");
  }
};
