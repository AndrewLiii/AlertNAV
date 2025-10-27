import DynamicMap from '@/components/DynamicMap'; // Import our new client-side loader

export default function Home() {

  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          AlertNAV
        </h1>
        <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
          <DynamicMap center={[39.9612, -82.9988]}/>
        </div>
      </div>
    </main>
  );
}