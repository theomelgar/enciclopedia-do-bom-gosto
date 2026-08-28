interface ShareableRecommendation {
   name: string;
   description: string | null;
   category: { name: string } | null;
  places: {
    place: { name: string; address: string | null; latitude: number | null; longitude: number | null };
    lastPrice: string | null;
  }[];
   purchaseLinks: { label: string; url: string }[];
 }

function mapsUrl(place: { name: string; address: string | null; latitude: number | null; longitude: number | null }) {
  const query =
    place.latitude != null && place.longitude != null
      ? `${place.latitude},${place.longitude}`
      : place.address ?? place.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildShareText(rec: ShareableRecommendation, code?: string): string {
   const lines: string[] = [`📌 ${rec.name}`];

   if (rec.category) lines.push(`Categoria: ${rec.category.name}`);
   if (rec.description) lines.push("", rec.description);

   if (rec.places.length > 0) {
     lines.push("", "Onde encontrar:");
     rec.places.forEach((rp) => {
       const price = rp.lastPrice != null ? (Number(rp.lastPrice) === 0 ? " (Grátis)" : ` (R$ ${rp.lastPrice})`) : "";
       const address = rp.place.address ? ` — ${rp.place.address}` : "";
      lines.push(`• ${rp.place.name}${address}${price}`, `  ${mapsUrl(rp.place)}`);
     });
   }

   if (rec.purchaseLinks.length > 0) {
     lines.push("", "Comprar online:");
     rec.purchaseLinks.forEach((l) => lines.push(`• ${l.label}: ${l.url}`));
   }

   if (code) lines.push("", `Código do app: ${code}`);

   return lines.join("\n");
 }