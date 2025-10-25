// components/MapComponent.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// --- Icon Fix ---
// Make sure you have a file named 'pin.png' in your /public folder
const defaultIcon = L.icon({
    iconUrl: '/pin.png', 
    iconSize: [41, 41],
    iconAnchor: [20, 41],   // Points the icon tip to the correct map location
    popupAnchor: [1, -34]    // Positions the popup relative to the icon
});

L.Marker.prototype.options.icon = defaultIcon;
// --- End Icon Fix ---


interface DeviceData {
    device_id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface MapComponentProps {
    center: [number, number];
    zoom?: number;
}

const MapComponent = ({ center, zoom = 13 }: MapComponentProps) => {
    const { data, error } = useSWR<{ data: DeviceData[] }>("/api/data", fetcher, { 
        refreshInterval: 5000,
        onSuccess: (data) => {
            console.log('Device locations:', data);
        }
    });

    // Calculate the center based on the first device, or use provided center as fallback
    const mapCenter = data?.data?.[0] 
        ? [data.data[0].latitude, data.data[0].longitude] as [number, number]
        : center;

    return (
        <MapContainer 
            center={mapCenter}
            zoom={zoom} 
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {data?.data?.filter(device => 
                typeof device.latitude === 'number' && 
                typeof device.longitude === 'number' &&
                !isNaN(device.latitude) && 
                !isNaN(device.longitude)
              ).map((device) => (
                <Marker 
                    key={device.device_id}
                    position={[device.latitude, device.longitude] as [number, number]}
                >
                    <Popup>
                        <div className="font-sans">
                            <h3 className="font-bold mb-2">Device: {device.device_id}</h3>
                            <p>Latitude: {device.latitude.toFixed(6)}</p>
                            <p>Longitude: {device.longitude.toFixed(6)}</p>
                            <p className="text-sm text-gray-600">
                                Last updated: {new Date(device.timestamp).toLocaleString()}
                            </p>
                            <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Edit
                            </button>
                        </div>
                    </Popup>
                </Marker>
              ))}
        </MapContainer>
    );
};

export default MapComponent;