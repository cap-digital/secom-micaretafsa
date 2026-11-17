"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { PracaMapa } from "@/lib/tipos";
import { fmtInt, fmtPct } from "@/lib/formato";

// Feira de Santana — centro da praça
const CENTRO: [number, number] = [-12.2664, -38.9663];

export default function MapaLeaflet({ pracas }: { pracas: PracaMapa[] }) {
  const max = Math.max(1, ...pracas.map((p) => p.impressoes));
  return (
    <MapContainer
      center={CENTRO}
      zoom={7.5}
      zoomSnap={0.25}
      scrollWheelZoom={false}
      attributionControl
      className="h-full w-full rounded-lg"
    >
      {/* tiles claros sem chave de API (Esri World Light Gray) + camada de nomes */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap"
        maxZoom={16}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      {[...pracas]
        .sort((a, b) => b.impressoes - a.impressoes)
        .map((p) => (
          <CircleMarker
            key={p.chave}
            center={[p.lat, p.lng]}
            radius={3 + 22 * Math.sqrt(p.impressoes / max)}
            pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: "#b70097", fillOpacity: 0.55 }}
          >
            <Tooltip className="tooltip-praca" direction="top" offset={[0, -4]}>
              <strong>
                {p.nome} · {p.uf}
              </strong>
              <br />
              {fmtInt(p.impressoes)} impressões ({fmtPct(p.pct)})
            </Tooltip>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
