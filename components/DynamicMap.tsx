'use client'; 

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Define the props this component will accept
interface DynamicMapProps {
  center: [number, number];
}

export default function DynamicMap({ center }: DynamicMapProps) {
  
  // This is the logic we moved from page.tsx
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'), // The path to your actual map
    { 
      loading: () => <p>Loading map...</p>,
      ssr: false  // This is now allowed because we are in a Client Component
    }
  ), []); // We only need to run this once

  return <Map center={center} />;
}