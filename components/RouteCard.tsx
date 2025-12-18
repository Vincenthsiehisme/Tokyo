
import React from 'react';
import { TransitInfo, TravelMode } from '../types';
import { ModeIcon, Clock, AlertTriangle } from './Icons';

interface RouteCardProps {
  info: TransitInfo;
  startTime?: string; // New: Explicit departure time
  className?: string;
}

const getModeName = (mode: string) => {
  switch(mode) {
    case TravelMode.TRAIN: return '電車';
    case TravelMode.WALK: return '步行';
    case TravelMode.TAXI: return '計程車';
    case TravelMode.BUS: return '巴士';
    default: return mode;
  }
}

const RouteCard: React.FC<RouteCardProps> = ({ info, startTime, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 py-1.5 ${className}`}>
      
      {/* Visual Hierarchy: Time is secondary info for transit, lighter weight */}
      {startTime && (
        <div className="shrink-0 flex flex-col items-end justify-center min-w-[45px] pr-2 border-r-2 border-slate-200/60 mr-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Dep</span>
          <span className="text-sm font-bold text-slate-600 leading-none font-mono">{startTime}</span>
        </div>
      )}

      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        {/* Mode Icon - Smaller and lighter */}
        <div className="shrink-0 text-slate-500 bg-slate-100 p-1 rounded-md z-10">
          <ModeIcon mode={info.mode} className="w-3.5 h-3.5" />
        </div>

        {/* Info Chips - More compact, less "badge-like" */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Line Name - Simple Text */}
          <div className="text-xs font-bold text-slate-700 truncate max-w-[160px]">
            {info.lineName || getModeName(info.mode)}
          </div>

          {/* Duration - Subtle Tag */}
          <div className="flex items-center text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap">
            <Clock className="w-2.5 h-2.5 mr-1 opacity-50" />
            {info.duration}
          </div>

           {/* Direction Badge - Very compact */}
           {info.direction && (
             <div className="hidden sm:flex items-center text-[10px] text-slate-400 truncate">
               <span className="opacity-50 mr-0.5">往</span>
               {info.direction}
             </div>
          )}

          {/* Last Train Badge - Integrated into flow, no bounce, softer colors */}
          {info.lastTrain && (
             <div className="flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 whitespace-nowrap ml-auto sm:ml-0">
               <AlertTriangle className="w-2.5 h-2.5 mr-1" />
               末班 {info.lastTrain}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteCard;
