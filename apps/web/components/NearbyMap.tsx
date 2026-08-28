"use client";
import dynamic from "next/dynamic";
import type { NearbyPlace } from "@/hooks/use-nearby-places";

const NearbyMapImpl = dynamic(() => import("./NearbyMapImpl"), { ssr: false });

export interface NearbyMapProps {
  center?: { lat: number; lng: number }; // opcional agora — mapa funciona sem geolocalização
  places: NearbyPlace[];
  onSelectPlace?: (placeId: string) => void;
  height?: number;
}

export function NearbyMap(props: NearbyMapProps) {
  return <NearbyMapImpl {...props} />;
}