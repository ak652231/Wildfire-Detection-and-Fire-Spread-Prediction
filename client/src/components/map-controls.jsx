"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "../hooks/use-toast"

export function MapControls() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)

  useEffect(() => {
    const checkLocationInterval = setInterval(() => {
      if (window.getSelectedLocation) {
        setSelectedLocation(window.getSelectedLocation())
      }
    }, 500)

    return () => clearInterval(checkLocationInterval)
  }, [])

  const handleRunAnalysis = async () => {
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please click on the map to select a location first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      if (window.runWildfireAnalysis) {
        await window.runWildfireAnalysis()
      } else {
        const response = await fetch("http://localhost:5000/api/run-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: selectedLocation,
          }),
        })

        if (response.ok) {
          if (window.setAnalysisComplete) {
            window.setAnalysisComplete(true)
          }

          window.location.reload()
        } else {
          throw new Error("Failed to run analysis")
        }
      }
    } catch (error) {
      console.error("Error running analysis:", error)
      toast({
        title: "Analysis failed",
        description: "There was an error processing your request",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const currentDate = new Date().toISOString().split("T")[0]

  return (
    <Card className="bg-gray-800 border-0 shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">K-means Clustering (7 clusters)</h3>
            <p className="text-xs text-gray-400 mt-1">Using Sentinel-2 data from Sept 1, 2024 to {currentDate}</p>
            <p className="text-xs text-gray-400 mt-1">Bands: B2, B3, B4, B8, B11, B12</p>
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
            onClick={handleRunAnalysis}
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
  )
}

