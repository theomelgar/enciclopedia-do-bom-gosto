"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PlaceMapProps } from "./PlaceMap";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"; // água/mata/ruas visíveis, contraste tipo Maps

export default function PlaceMapImpl({ latitude, longitude, height = 320 }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 15.5,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    // canto oposto ao botão de recentralizar — evita sobreposição de clique
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-right");

    const el = document.createElement("div");
    el.style.width = "34px";
    el.style.height = "34px";
    el.style.borderRadius = "50% 50% 50% 0";
    el.style.background = "rgb(var(--primary))";
    el.style.boxShadow = "0 0 0 3px rgb(var(--background)), 0 2px 6px rgba(0,0,0,.4)";
    el.style.transform = "rotate(-45deg)";
    // halo branco duplo — garante contraste em qualquer fundo (água, mata, prédio)
    el.style.boxShadow = "0 0 0 3px #FAF6F1, 0 2px 6px rgba(0,0,0,.4)";
    new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => map.remove();
  }, [latitude, longitude]);

  function recenter() {
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15.5 });
  }

  return (
    <div style={{ height }} className="relative overflow-hidden rounded-xl">
      <div ref={containerRef} className="h-full w-full" />
      <button
        aria-label="Centralizar"
        onClick={recenter}
        className="absolute bottom-3 right-3 z-10 h-9 w-9 rounded-full bg-background/95 shadow-md flex items-center justify-center text-base"
      >
        🎯
      </button>
    </div>
  );
}