import { Flame } from "lucide-react"
import React from 'react';
export function MapHeader() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center">
          <Flame className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-xl font-bold text-white">Wildfire Detection Map</h1>
          <div className="ml-4 px-2 py-1 bg-gray-700 rounded text-xs">Location: [-122.09, 41.42]</div>
        </div>
      </div>
    </header>
  )
}

