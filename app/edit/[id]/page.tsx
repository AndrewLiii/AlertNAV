'use client';

import { DeviceData } from '@/types/data';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [data, setData] = useState<DeviceData | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        setDeviceId(resolvedParams.id);
        
        const response = await fetch(`/api/data/${resolvedParams.id}`);
        const result = await response.json();
        
        if (result.data) {
          setData(result.data);
        } else {
          alert('Device not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!data || !deviceId) return;

    try {
      const response = await fetch(`/api/data/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to update data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Error updating data');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center">Loading...</div></div>;
  if (!data) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center">Device not found</div></div>;

  return (
    <div className="min-h-screen bg-white py-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-[10px]">
        <h1 className="text-2xl font-bold mb-4 text-gray-700">Edit Device Data</h1>
      
      <div className="mb-4">
        <label className="block mb-2 text-gray-700">Device ID:</label>
        <input
          type="text"
          value={data.device_id}
          className="w-full p-2 border rounded bg-gray-100 text-gray-600"
          disabled
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-gray-700">Latitude:</label>
        <input
          type="number"
          step="any"
          value={data.lat}
          className="w-full p-2 border rounded bg-gray-100 text-gray-700"
          disabled
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-gray-700">Longitude:</label>
        <input
          type="number"
          step="any"
          value={data.lon}
          className="w-full p-2 border rounded bg-gray-100 text-gray-700"
          disabled
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-gray-700">Event:</label>
        <select
          value={data.event}
          onChange={(e) => setData({ ...data, event: e.target.value })}
          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-gray-700 bg-white"
          required
        >
          <option value="" disabled>Select an event</option>
          <option value="Construction">Construction</option>
          <option value="Blocked Road">Blocked Road</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-gray-700">Group:</label>
        <input
          type="text"
          value={data.group}
          onChange={(e) => setData({ ...data, group: e.target.value })}
          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-gray-700"
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
      </form>
    </div>
  );
}