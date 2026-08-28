"use client";
import dynamic from "next/dynamic";

const PlaceMapImpl = dynamic(() => import("./PlaceMapImpl"), { ssr: false });

export interface PlaceMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

export function PlaceMap(props: PlaceMapProps) {
  return <PlaceMapImpl {...props} />;
}