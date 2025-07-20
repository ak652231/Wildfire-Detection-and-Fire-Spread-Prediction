import { WildfireMap } from "./components/wildfire-map"
import { MapControls } from "./components/map-controls"
import { MapHeader } from "./components/map-header"
import { Toaster } from "@/components/ui/toaster"

export default function Kmeans() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <MapHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
          <WildfireMap />
        </div>
        <div className="mt-4">
        </div>
      </div>
      <Toaster />
    </main>
  )
}

