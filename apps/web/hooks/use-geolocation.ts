"use client";
import { useEffect, useState } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Permissão negada"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { coords, error };
}