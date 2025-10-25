import DynamicMap from '@/components/DynamicMap'; // Import our new client-side loader

export default function Home() {

  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          AlertNAV
        </h1>
        <button className="mb-6 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
          Report an Incident
        </button>
        <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
          <DynamicMap center={[39.9612, -82.9988]}/>
        </div>
      </div>
    </main>
  );
}