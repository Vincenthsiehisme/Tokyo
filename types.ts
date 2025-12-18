
export enum TravelMode {
  TRAIN = 'TRAIN',
  WALK = 'WALK',
  TAXI = 'TAXI',
  BUS = 'BUS',
}

export interface TransitInfo {
  mode: TravelMode;
  duration: string; // e.g., "15 min"
  lineName?: string; // e.g., "JR Yamanote Line"
  direction?: string; // e.g., "往 澀谷 / 品川 方面"
  cost?: string; // e.g., "¥210"
  instructions: string;
  lastTrain?: string; // e.g., "23:55"
}

export interface Location {
  id: string;
  name: string;
  address?: string; // Optional, simplistic for this demo
  japaneseName?: string;
  japaneseAddress?: string;
}

export interface ItineraryItem {
  id: string;
  day?: number; // 1-based day index
  date?: string; // e.g., "12/23"
  type: 'visit' | 'transit' | 'meetup' | 'split';
  location?: Location; // Target location for visits
  transitInfo?: TransitInfo; // Info to get TO this location
  startTime?: string;
  endTime?: string;
  isReservation?: boolean; // New flag for booked slots
  notes?: string; // Short summary
  details?: string; // Rich details (address, tips, full guide)
  // For split itineraries
  splitGroups?: SplitGroup[]; 
}

export interface SplitGroup {
  id: string;
  name: string; // e.g., "Team Shopping", "Team Shrine"
  itinerary: ItineraryItem[];
}

export interface TripState {
  accommodation: Location | null;
  items: ItineraryItem[];
  isSplitting: boolean; // UI state for split mode builder
}
