'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// --- Custom Icons based on event type ---
const createIcon = (iconUrl: string) => L.icon({
    iconUrl,
    iconSize: [41, 41],
    iconAnchor: [20, 41],
    popupAnchor: [1, -34]
});

const icons = {
    'Blocked Road': createIcon('/road-barrier.png'),
    'Construction': createIcon('/construction.png'),
    'Stop Sign': createIcon('/stop.png'),
    default: createIcon('/pin.png')
};

// Helper function to get the correct icon based on event
const getIconForEvent = (event: string): L.Icon => {
    return icons[event as keyof typeof icons] || icons.default;
};
// --- End Custom Icons ---


interface DeviceData {
    id: number;
    device_id: string;
    latitude: number;
    longitude: number;
    event: string;
    timestamp: string;
}

interface MapComponentProps {
    center: [number, number];
    zoom?: number;
}

const MapComponent = ({ center, zoom = 13 }: MapComponentProps) => {
    const { data, error, isLoading } = useSWR<{ data: DeviceData[] }>("/api/data", fetcher, { 
        refreshInterval: 5000,
        onSuccess: (data) => {
            console.log('Device locations:', data);
        }
    });

    // Show loading state while fetching data
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-700">Loading latest locations...</p>
                </div>
            </div>
        );
    }

    // Show error state if fetch failed
    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center text-red-600">
                    <p className="font-bold">Error loading data</p>
                    <p className="text-sm">{error.message}</p>
                </div>
            </div>
        );
    }

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
                    icon={getIconForEvent(device.event)}
                >
                    <Popup>
                        <div className="font-sans">
                            <h3 className="font-bold mb-2">Device: {device.device_id}</h3>
                            <p className="text-blue-600 font-semibold">Event: {device.event}</p>
                            <p>Latitude: {device.latitude.toFixed(6)}</p>
                            <p>Longitude: {device.longitude.toFixed(6)}</p>
                            <p className="text-sm text-gray-600">
                                Last updated: {new Date(parseInt(device.timestamp) * 1000).toLocaleString()}
                            </p>
                            <Link
                                href={`/edit/${device.id}`}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block no-underline"
                                style={{ color: 'white' }}
                            >
                                Edit
                            </Link>
                        </div>
                    </Popup>
                </Marker>
              ))}
        </MapContainer>
    );
};

export default MapComponent;