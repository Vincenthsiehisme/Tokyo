
import React from 'react';
import { Train, Navigation, Footprints, Car, Bus, MapPin, Hotel, Users, Split, Clock, ArrowRight, Trash2, X, Calendar, ExternalLink, Ticket, ChevronRight, AlertTriangle, ShieldAlert, Route } from 'lucide-react';
import { TravelMode } from '../types';

export const ModeIcon: React.FC<{ mode: TravelMode; className?: string }> = ({ mode, className }) => {
  switch (mode) {
    case TravelMode.TRAIN: return <Train className={className} />;
    case TravelMode.WALK: return <Footprints className={className} />;
    case TravelMode.TAXI: return <Car className={className} />;
    case TravelMode.BUS: return <Bus className={className} />;
    default: return <Navigation className={className} />;
  }
};

export { MapPin, Hotel, Users, Split, Clock, ArrowRight, Navigation, Trash2, X, Calendar, ExternalLink, Ticket, ChevronRight, AlertTriangle, ShieldAlert, Route };
