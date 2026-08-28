"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NearbyPlace } from "@/hooks/use-nearby-places";
import type { NearbyMapProps } from "./NearbyMap";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function hasCoords(p: NearbyPlace): p is NearbyPlace & { latitude: number; longitude: number } {
  return p.latitude != null && p.longitude != null;
}

function pinEl() {
   const el = document.createElement("div");
   el.style.width = "30px";
   el.style.height = "30px";
   el.style.borderRadius = "50% 50% 50% 0";
   el.style.background = "rgb(var(--primary))";
   el.style.boxShadow = "0 0 0 3px rgb(var(--background)), 0 2px 6px rgba(0,0,0,.4)";
   el.style.transform = "rotate(-45deg)";
   el.style.cursor = "pointer";
   return el;
 }

function meEl() {
   const el = document.createElement("div");
   el.style.width = "16px";
   el.style.height = "16px";
   el.style.borderRadius = "50%";
   el.style.background = "rgb(var(--success))";
   el.style.border = "2px solid rgb(var(--background))";
   el.style.boxShadow = "0 0 0 4px rgb(var(--success) / .25)";
   return el;
 }

export default function NearbyMapImpl({ center, places, onSelectPlace, height = 320 }: NearbyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const validPlaces = places.filter(hasCoords);

  useEffect(() => {
    if (!containerRef.current) return;
    const fallback =
      center ?? (validPlaces[0] ? { lat: validPlaces[0].latitude, lng: validPlaces[0].longitude } : { lat: 0, lng: 0 });

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [fallback.lng, fallback.lat],
      zoom: 13,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-right");
    if (center) {
      new maplibregl.Marker({ element: meEl() }).setLngLat([center.lng, center.lat]).addTo(map);
    }

    validPlaces.forEach((p) => {
      const el = pinEl(); 
      el.addEventListener("click", () => onSelectPlace?.(p.id));

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.cursor = "pointer";
      wrapper.appendChild(el);

      const label = document.createElement("span");
      label.textContent = p.name;
      label.style.marginTop = "2px";
      label.style.padding = "2px 8px";
      label.style.borderRadius = "999px";
      label.style.fontSize = "11px";
      label.style.fontWeight = "500";
      label.style.whiteSpace = "nowrap";
      label.style.background = "rgb(var(--background) / .95)";
      label.style.color = "rgb(var(--text))";
      label.style.boxShadow = "0 1px 3px rgba(0,0,0,.2)";
      wrapper.appendChild(label);

      wrapper.addEventListener("click", () => onSelectPlace?.(p.id));
      new maplibregl.Marker({ element: wrapper, anchor: "bottom" })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);
     });

    // fit bounds
    const points: [number, number][] = validPlaces.map((p) => [p.longitude, p.latitude]);
    if (center) points.push([center.lng, center.lat]);
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
    } else if (points.length > 1) {
      const bounds = points.reduce(
        (b, pt) => b.extend(pt),
        new maplibregl.LngLatBounds(points[0], points[0]),
      );
      map.fitBounds(bounds, { padding: 48, maxZoom: 16 });
    }

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, center]);

  return (
    <div>
      <div style={{ height }} className="rounded-xl overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {places.length !== validPlaces.length && (
        <p className="text-xs text-neutral mt-1">
          {places.length - validPlaces.length} local(is) sem coordenadas — endereço digitado manualmente.
        </p>
      )}
    </div>
  );
}