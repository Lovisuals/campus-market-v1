"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SUPPORTED_SCHOOLS } from "@/lib/constants/schools";
import L from "leaflet";
import { useEffect } from "react";

// Fix Leaflet generic icon issue in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function CampusMap() {
    // Default center (Nigeria)
    const center: [number, number] = [9.0820, 8.6753];

    return (
        <div className="w-full h-[60vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
            <MapContainer center={center} zoom={6} scrollWheelZoom={false} className="w-full h-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {SUPPORTED_SCHOOLS.map((school) => (
                    <Marker
                        key={school.id}
                        position={[school.location.lat, school.location.lng]}
                        icon={customIcon}
                    >
                        <Popup className="neo-glass text-black">
                            <b>{school.shortName}</b><br />
                            {school.name}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 z-[1000]">
                <p className="text-xs text-center text-gray-400">
                    Select a pin to explore campus listings.
                </p>
            </div>
        </div>
    );
}
