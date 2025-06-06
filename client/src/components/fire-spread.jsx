"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function WildfireMap() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const [useTestMode, setUseTestMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const locationMarkerRef = useRef(null)
  const fireOverlayRef = useRef(null)
  const searchControlRef = useRef(null)

  const toast = ({ title, description, variant = "default" }) => {
    console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initMap = async () => {
      try {
        const linkElement = document.createElement("link")
        linkElement.rel = "stylesheet"
        linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(linkElement)

        await new Promise((resolve) => setTimeout(resolve, 300))

        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.crossOrigin = ""

        script.onload = () => {
          const L = window.L

          const map = L.map(mapContainerRef.current).setView([37.7749, -122.4194], 6)

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map)

          map.on("click", (e) => {
            const { lat, lng } = e.latlng
            handleMapClick(lat, lng, L)
          })

          // Load the Nominatim geocoding script
          const geocoderScript = document.createElement("script")
          geocoderScript.src = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"
          document.head.appendChild(geocoderScript)

          // Add the geocoder CSS
          const geocoderCss = document.createElement("link")
          geocoderCss.rel = "stylesheet"
          geocoderCss.href = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css"
          document.head.appendChild(geocoderCss)

          // Wait for the geocoder script to load
          

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

  const handleMapClick = (lat, lng, L) => {
    setSelectedLocation({ lat, lng })
    setIsAnalysisComplete(false)
    setAnalysisResult(null)
    setError(null)

    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove()
    }

    if (fireOverlayRef.current) {
      fireOverlayRef.current.remove()
      fireOverlayRef.current = null
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
    }).addTo(mapRef.current)

    locationMarkerRef.current = marker

    toast({
      title: "Location selected",
      description: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    })
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 5) {
      return { color: "red", fillColor: "#ff0000" };
    } else if (confidence >= 4) {
      return { color: "orange", fillColor: "#ff7800" };
    } else if (confidence >= 3.5) {
      return { color: "yellow", fillColor: "#ffff00" };
    } else {
      return { color: "green", fillColor: "#00ff00" };
    }
  };

  const runAnalysis = async () => {
    if (!selectedLocation) return

    setIsProcessing(true)
    setIsAnalysisComplete(false)
    setError(null)

    const apiUrl = "http://localhost:5000/api/fire-spread"

    console.log(`Sending request to: ${apiUrl}`)
    console.log("With data:", {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    })

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lng: selectedLocation.lng,
          lat: selectedLocation.lat,
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If we can't parse JSON, use the default error message
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Analysis result:", result)

      if (result.fireSpreadCoordinates && result.fireSpreadCoordinates.length > 0 && mapRef.current) {
        const L = window.L

        // Remove previous fire overlay if it exists
        if (fireOverlayRef.current) {
          fireOverlayRef.current.remove()
          fireOverlayRef.current = null
        }

        // Group coordinates by confidence level
        const confidenceLevels = {
          high: [], // > 5
          medium: [], // 4-5
          low: [], // 3.5-4
          minimal: [] // < 3.5
        };

        result.fireSpreadCoordinates.forEach(coord => {
          const confidence = coord[2] || 0;
          const latLng = [coord[1], coord[0]]; // [lat, lng]
          
          if (confidence >= 5) {
            confidenceLevels.high.push(latLng);
          } else if (confidence >= 4) {
            confidenceLevels.medium.push(latLng);
          } else if (confidence >= 3.5) {
            confidenceLevels.low.push(latLng);
          } else {
            confidenceLevels.minimal.push(latLng);
          }
        });

        // Create layer groups for each confidence level
        const fireMarkers = L.layerGroup();
        const firePolygons = L.layerGroup();

        // Create polygons and markers for each confidence level
        if (confidenceLevels.high.length > 0) {
          const highPolygon = L.polygon(confidenceLevels.high, {
            color: "red",
            fillColor: "#ff0000",
            fillOpacity: 0.5,
            weight: 2,
          }).addTo(firePolygons);
          
          confidenceLevels.high.forEach(latLng => {
            L.circleMarker(latLng, {
              radius: 4,
              color: "red",
              fillColor: "#ff0000",
              fillOpacity: 0.8,
              weight: 1,
            }).addTo(fireMarkers);
          });
        }
        
        if (confidenceLevels.medium.length > 0) {
          const mediumPolygon = L.polygon(confidenceLevels.medium, {
            color: "orange",
            fillColor: "#ff7800",
            fillOpacity: 0.5,
            weight: 2,
          }).addTo(firePolygons);
          
          confidenceLevels.medium.forEach(latLng => {
            L.circleMarker(latLng, {
              radius: 4,
              color: "orange",
              fillColor: "#ff7800",
              fillOpacity: 0.8,
              weight: 1,
            }).addTo(fireMarkers);
          });
        }
        
        if (confidenceLevels.low.length > 0) {
          const lowPolygon = L.polygon(confidenceLevels.low, {
            color: "yellow",
            fillColor: "#ffff00",
            fillOpacity: 0.5,
            weight: 2,
          }).addTo(firePolygons);
          
          confidenceLevels.low.forEach(latLng => {
            L.circleMarker(latLng, {
              radius: 4,
              color: "yellow",
              fillColor: "#ffff00",
              fillOpacity: 0.8,
              weight: 1,
            }).addTo(fireMarkers);
          });
        }
        
        if (confidenceLevels.minimal.length > 0) {
          const minimalPolygon = L.polygon(confidenceLevels.minimal, {
            color: "green",
            fillColor: "#00ff00",
            fillOpacity: 0.5,
            weight: 2,
          }).addTo(firePolygons);
          
          confidenceLevels.minimal.forEach(latLng => {
            L.circleMarker(latLng, {
              radius: 4,
              color: "green",
              fillColor: "#00ff00",
              fillOpacity: 0.8,
              weight: 1,
            }).addTo(fireMarkers);
          });
        }

        // Add all layers to the map
        firePolygons.addTo(mapRef.current);
        fireMarkers.addTo(mapRef.current);

        // Store references to remove later
        fireOverlayRef.current = L.layerGroup([firePolygons, fireMarkers]);

        // Fit the map to show all the affected area
        const allPoints = [
          ...confidenceLevels.high,
          ...confidenceLevels.medium,
          ...confidenceLevels.low,
          ...confidenceLevels.minimal
        ];
        
        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        // Update the analysis result to include fire spread information
        setAnalysisResult({
          ...result,
          fire_detected: true,
          risk_level: "High",
          affected_area_size: result.fireSpreadCoordinates.length,
        })
      }

      setAnalysisResult(result)
      setIsAnalysisComplete(true)

      toast({
        title: result.fire_detected ? "Fire Detected!" : "Analysis Complete",
        description: `Risk level: ${result.risk_level || "Unknown"}`,
        variant: result.fire_detected ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Analysis Error:", error)
      setError(`Analysis failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Use the OpenStreetMap Nominatim API directly
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then(response => response.json())
      .then(data => {
        setIsSearching(false);
        
        if (data && data.length > 0) {
          const result = data[0];
          const lat = Number.parseFloat(result.lat);
          const lng = Number.parseFloat(result.lon);
          
          if (mapRef.current && window.L) {
            handleMapClick(lat, lng, window.L);
            mapRef.current.setView([lat, lng], 10);
            
            toast({
              title: "Location found",
              description: `Found: ${result.display_name}`,
            });
          }
        } else {
          toast({
            title: "Location not found",
            description: "Try a different search term",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        console.error("Search error:", error);
        setIsSearching(false);
        toast({
          title: "Search failed",
          description: "Please try again later",
          variant: "destructive",
        });
      });
  };

  const getImageBounds = (center) => {
    const offsetDegrees = 5 / 111

    return [
      [center.lat - offsetDegrees, center.lng - offsetDegrees],
      [center.lat + offsetDegrees, center.lng + offsetDegrees],
    ]
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

        {/* Manual Search Bar */}
        <div className="absolute top-4 left-4 z-30 bg-gray-800 bg-opacity-90 p-3 rounded-md w-72">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search location (e.g., 'San Francisco')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
            <Button type="submit" size="sm" disabled={isSearching} className="h-9 px-3">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        {/* Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-gray-800 bg-opacity-80 p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Fire Confidence Legend</h4>
          <div className="grid grid-cols-1 gap-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>High (5)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Medium (4-5)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Low (3.5-4)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Minimal (3.5)</span>
            </div>
          </div>
        </div>

        {selectedLocation && !isAnalysisComplete && (
          <div className="absolute top-16 right-4 z-20 bg-gray-800 bg-opacity-80 p-3 rounded-md">
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
      {isAnalysisComplete && analysisResult && (
        <Card className="bg-gray-800 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className={analysisResult.fire_detected ? "text-red-500" : "text-green-500"}>
              {analysisResult.fire_detected ? "🔥 Fire Detected!" : "No Active Fire Detected"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              Risk Level:{" "}
              <span className={`font-bold ${analysisResult.risk_level === "High" ? "text-red-500" : "text-green-500"}`}>
                {analysisResult.risk_level}
              </span>
            </p>
            <p className="mb-2">Analysis Date: {analysisResult.analysis_date || currentDate}</p>
            <p className="mb-2">
              Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </p>
            {analysisResult.fire_detected && (
              <p className="text-yellow-400 text-sm mt-4">
                ⚠️ This is a simulation. In case of real fire danger, contact local emergency services.
              </p>
            )}
            {useTestMode && (
              <p className="text-blue-400 text-xs mt-2">Running in test mode - fire detection is simulated.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Controls */}
      <Card className="bg-gray-800 border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Wildfire Risk Analysis</h3>
              <p className="text-xs text-gray-400 mt-1">Using VIIRS Active Fire Data</p>
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
        
        /* Leaflet Geocoder Styles */
        .leaflet-control-geocoder {
          border-radius: 4px;
          background: white;
          min-width: 26px;
          min-height: 26px;
        }
        
        .leaflet-control-geocoder-form input {
          font-size: 14px;
          border: 0;
          background-color: transparent;
          width: 246px;
          padding: 0 8px;
          height: 26px;
          outline: none;
        }
      `}</style>
    </div>
  )
}
