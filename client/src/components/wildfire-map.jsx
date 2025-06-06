"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import L from "leaflet"
import { Input } from "@/components/ui/input"

export function WildfireMap() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const locationMarkerRef = useRef(null)
  const wildfireLayerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const toast = ({ title, description, variant = "default" }) => {
    console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)
  }

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (mapContainerRef.current && !mapRef.current) {
          const map = L.map(mapContainerRef.current).setView([41.42, -122.09], 8)

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map)

          map.on("click", (e) => {
            const { lat, lng } = e.latlng
            handleMapClick(map, lat, lng)
          })

          mapRef.current = map
          setIsLoading(false)
        }
      } catch (error) {
        setLoadError(true)
        console.error(error)
        toast({
          title: "Map Initialization Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    }

    initializeMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const handleMapClick = (map, lat, lng) => {
    setSelectedLocation({ lat, lng })
    setIsAnalysisComplete(false)
    setAnalysisResult(null)

    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove()
    }

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "custom-map-pin",
        html: `<div class="pin-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="map-pin">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div class="pin-label">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
              </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    }).addTo(map)

    locationMarkerRef.current = marker

    toast({
      title: "Location selected",
      description: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then((response) => response.json())
      .then((data) => {
        setIsSearching(false)

        if (data && data.length > 0) {
          const result = data[0]
          const lat = Number.parseFloat(result.lat)
          const lng = Number.parseFloat(result.lon)

          if (mapRef.current && window.L) {
            handleMapClick(mapRef.current, lat, lng)
            mapRef.current.setView([lat, lng], 10)

            toast({
              title: "Location found",
              description: `Found: ${result.display_name}`,
            })
          }
        } else {
          toast({
            title: "Location not found",
            description: "Try a different search term",
            variant: "destructive",
          })
        }
      })
      .catch((error) => {
        console.error("Search error:", error)
        setIsSearching(false)
        toast({
          title: "Search failed",
          description: "Please try again later",
          variant: "destructive",
        })
      })
  }

  const runAnalysis = async () => {
    if (!selectedLocation) return

    setIsProcessing(true)
    setIsAnalysisComplete(false)

    try {
      const response = await fetch("http://localhost:5000/api/earth-engine-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          start: "2024-01-01",
          end: new Date().toISOString().split("T")[0],
        }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const result = await response.json()
      console.log("Analysis result:", result)

      if (mapRef.current && result.tileUrl) {
        if (wildfireLayerRef.current) {
          mapRef.current.removeLayer(wildfireLayerRef.current)
        }

        const newLayer = L.tileLayer(result.tileUrl, {
          attribution: "Google Earth Engine",
        })
        newLayer.addTo(mapRef.current)
        wildfireLayerRef.current = newLayer

        mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 10)
      }

      setAnalysisResult(result)
      setIsAnalysisComplete(true)

      toast({
        title: "Analysis Complete",
        description: "Satellite imagery clustered successfully",
      })
    } catch (error) {
      console.error("Analysis Error:", error)
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const currentDate = new Date().toISOString().split("T")[0]

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-800 text-red-500">
        <div className="text-center">
          <h3 className="text-xl font-bold">Failed to Load Map</h3>
          <p>Please check your network connection.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative h-[600px] bg-gray-800 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 z-50">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            <span className="ml-2 text-lg text-orange-500">Loading map data...</span>
          </div>
        )}

        {/* Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />

        {/* Search Bar - Right Corner */}
        <div className="absolute top-4 right-4 z-30 bg-gray-800 bg-opacity-90 p-3 rounded-md w-72">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
            <Button type="submit" size="sm" disabled={isSearching} className="h-9 px-3">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-gray-800 bg-opacity-80 p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Legend</h4>
          <div className="grid grid-cols-1 gap-y-1 text-xs">
            {[
              { color: "green", label: "Vegetation" },
              { color: "red", label: "Active fire" },
              { color: "blue", label: "Land or water" },
            ].map((cluster) => (
              <div key={cluster.color} className="flex items-center">
                <div className={`w-3 h-3 bg-${cluster.color}-500 rounded-full mr-2`}></div>
                <span>{cluster.label}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedLocation && !isAnalysisComplete && (
          <div className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-80 p-3 rounded-md">
            <p className="text-sm">Location selected! Click "Run Analysis" to process this area.</p>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <Card className="bg-gray-800 border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mt-1">Using Sentinel-2 data from Sept 1, 2024 to {currentDate}</p>
              {selectedLocation && (
                <p className="text-xs text-green-400 mt-1">
                  Selected coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              )}
              {!selectedLocation && (
                <p className="text-xs text-yellow-400 mt-1">Click on the map to select a location for analysis</p>
              )}
            </div>
            <Button
              onClick={runAnalysis}
              disabled={isProcessing || !selectedLocation}
              className={`${!selectedLocation ? "bg-gray-600" : "bg-orange-600 hover:bg-orange-700"}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Run Analysis"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSS for map pin */}
      <style jsx global>{`
        .custom-map-pin {
          background: transparent;
          border: none;
        }
        
        .pin-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .map-pin {
          color: #ef4444;
          width: 32px;
          height: 32px;
          animation: bounce 1s infinite alternate;
        }
        
        .pin-label {
          background-color: rgba(17, 24, 39, 0.75);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-top: 2px;
        }
        
        @keyframes bounce {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  )
}

export default WildfireMap
