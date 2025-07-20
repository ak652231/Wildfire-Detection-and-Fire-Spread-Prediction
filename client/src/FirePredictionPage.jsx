"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Thermometer, Wind, MapPin, Calendar, Layers, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export default function WildfireMap() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [locationData, setLocationData] = useState(null)
  const [predictionConfidence, setPredictionConfidence] = useState(null)
  const [error, setError] = useState(null)
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const locationMarkerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initMap = async () => {
      try {
        // Load Leaflet CSS
        const linkElement = document.createElement("link")
        linkElement.rel = "stylesheet"
        linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(linkElement)

        // Wait for CSS to load
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Load Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.crossOrigin = ""

        script.onload = () => {
          const L = window.L

          // Create map
          const map = L.map(mapContainerRef.current).setView([20, 78], 5) // Default to India

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map)

          // Map click event handler
          map.on("click", (e) => {
            const { lat, lng } = e.latlng
            handleMapClick(lat, lng, L)
          })

          mapRef.current = map
          setIsLoading(false)
        }

        script.onerror = () => {
          console.error("Failed to load Leaflet")
          setLoadError(true)
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Map initialization error:", error)
        setLoadError(true)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Handle map click
  const handleMapClick = (lat, lng, L) => {
    setSelectedLocation({ lat, lng })
    setIsAnalysisComplete(false)
    setLocationData(null)
    setPredictionConfidence(null)
    setError(null)

    // Remove existing marker
    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove()
    }

    // Create marker with custom icon
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
    }).addTo(mapRef.current)

    locationMarkerRef.current = marker

    console.log(`Location selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Use the OpenStreetMap Nominatim API directly
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then((response) => response.json())
      .then((data) => {
        setIsSearching(false)

        if (data && data.length > 0) {
          const result = data[0]
          const lat = Number.parseFloat(result.lat)
          const lng = Number.parseFloat(result.lon)

          if (mapRef.current && window.L) {
            handleMapClick(lat, lng, window.L)
            mapRef.current.setView([lat, lng], 10)

            console.log(`Location found: ${result.display_name}`)
          }
        } else {
          console.error("Location not found")
        }
      })
      .catch((error) => {
        console.error("Search error:", error)
        setIsSearching(false)
      })
  }

  // Fetch location details from the API
  const fetchLocationDetails = async (lat, lng) => {
    setIsProcessing(true)
    try {
      const response = await fetch("http://localhost:5000/api/getFirePredictionData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()
      setLocationData(data.locationDetails)
      setPredictionConfidence(data.predictionConfidence)
      setIsAnalysisComplete(true)
    } catch (error) {
      console.error("Error fetching location details:", error)
      setError(`Analysis failed: ${error.message}`)
      setLocationData(null)
      setPredictionConfidence(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Run analysis when the button is clicked
  const runAnalysis = () => {
    if (!selectedLocation) return
    fetchLocationDetails(selectedLocation.lat, selectedLocation.lng)
  }

  // Helper function to get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence > 5.5) return "text-red-600"
    if (confidence > 3.5) return "text-orange-600"
    return "text-green-600"
  }

  // Helper function to get progress bar color
  const getProgressColor = (confidence) => {
    if (confidence > 5.5) return "bg-red-600"
    if (confidence > 3.5) return "bg-orange-600"
    return "bg-green-600"
  }

  // Helper function to get risk level text
  const getRiskLevel = (confidence) => {
    if (confidence > 5.5) return "High"
    if (confidence > 3.5) return "Medium"
    return "Low"
  }

  // Helper function to calculate percentage
  const calculatePercentage = (confidence) => {
    return (confidence / 8) * 100
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
      {/* Page Title */}
      <div className="bg-orange-600 rounded-lg shadow-lg p-6 mb-4">
        <h1 className="text-3xl font-bold text-white">Wildfire Prediction Map</h1>
        <p className="text-white/80 mt-2">Click on the map to analyze wildfire risk and get prediction confidence</p>
      </div>

      {/* Map Container */}
      <div className="relative h-[500px] bg-gray-800 rounded-lg overflow-hidden">
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
              placeholder="Search location (e.g., 'New Delhi')"
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
          <h4 className="text-sm font-medium mb-2">Risk Legend</h4>
          <div className="grid grid-cols-1 gap-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>High Fire Risk (&gt;5.5)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Medium Fire Risk (3.5-5.5)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Low Fire Risk (3.5)</span>
            </div>
          </div>
        </div>

        {selectedLocation && !isAnalysisComplete && (
          <div className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-80 p-3 rounded-md">
            <p className="text-sm">Location selected! Click "Run Analysis" to check for fire risk.</p>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Details */}
        {isAnalysisComplete && locationData && (
          <Card className="bg-gray-800 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">
                <MapPin className="inline-block mr-2 h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-2">
                    <span className="font-semibold text-gray-400">Latitude:</span>{" "}
                    <span className="text-white">{locationData.lat.toFixed(4)}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold text-gray-400">Longitude:</span>{" "}
                    <span className="text-white">{locationData.lng.toFixed(4)}</span>
                  </p>
                  <p className="mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-semibold text-gray-400">Burn Date:</span>{" "}
                    <span className="text-white ml-1">{locationData.burnDate || "N/A"}</span>
                  </p>
                  <p className="mb-2 flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-semibold text-gray-400">Land Cover:</span>{" "}
                    <span className="text-white ml-1">{locationData.landCover || "N/A"}</span>
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    <span className="font-semibold text-gray-400">NDVI:</span>{" "}
                    <span className="text-white">{locationData.ndvi?.toFixed(4) || "N/A"}</span>
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold text-gray-400">Observed Flag:</span>{" "}
                    <span className="text-white">{locationData.observedFlag || "N/A"}</span>
                  </p>
                  <p className="mb-2 flex items-center">
                    <Thermometer className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-semibold text-gray-400">Mean Temperature:</span>{" "}
                    <span className="text-white ml-1">{locationData.meanTemperature?.toFixed(2) || "N/A"}K</span>
                  </p>
                  <p className="mb-2 flex items-center">
                    <Wind className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-semibold text-gray-400">Wind Component (U):</span>{" "}
                    <span className="text-white ml-1">{locationData.windComponentU?.toFixed(2) || "N/A"}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fire Prediction Confidence */}
        {isAnalysisComplete && predictionConfidence !== null && (
          <Card className="bg-gray-800 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className={getConfidenceColor(predictionConfidence)}>Fire Prediction Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Fire Prediction Confidence</h3>
                <div className="flex justify-between items-center">
                  <div className={`text-3xl font-extrabold ${getConfidenceColor(predictionConfidence)}`}>
                    {calculatePercentage(predictionConfidence).toFixed(1)}%
                  </div>
                  <div className="text-sm bg-gray-600 px-2 py-1 rounded">
                    Raw value: {predictionConfidence.toFixed(2)}/8
                  </div>
                </div>
                <div className="mt-2">
                  <Progress
                    value={calculatePercentage(predictionConfidence)}
                    className="h-2"
                    indicatorClassName={getProgressColor(predictionConfidence)}
                  />
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Risk Level: </span>
                  <span className={getConfidenceColor(predictionConfidence)}>{getRiskLevel(predictionConfidence)}</span>
                  <span className="text-gray-400 ml-2">(Threshold: 3.5/8)</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2">Analysis Date: {currentDate}</p>
                {predictionConfidence >= 3.5 && (
                  <p className="text-yellow-400 text-sm mt-4">
                    ⚠️ This area shows elevated fire risk. Take appropriate precautions.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map Controls */}
      <Card className="bg-gray-800 border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Wildfire Risk Analysis</h3>
              <p className="text-xs text-gray-400 mt-1">Using Earth Engine data for fire prediction</p>
              <p className="text-xs text-gray-400 mt-1">For demonstration and educational purposes only</p>
              {selectedLocation && (
                <p className="text-xs text-green-400 mt-1">
                  Selected coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              )}
              {!selectedLocation && (
                <p className="text-xs text-yellow-400 mt-1">Click on the map to select a location for analysis</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
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
