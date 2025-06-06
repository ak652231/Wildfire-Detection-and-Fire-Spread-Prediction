import React from 'react';
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Thermometer, Wind, Droplets } from "lucide-react"

export function FireRiskIndicator() {
  const [riskLevel, setRiskLevel] = useState(78)
  const [temperature, setTemperature] = useState(32)
  const [humidity, setHumidity] = useState(15)
  const [windSpeed, setWindSpeed] = useState(12)

  useEffect(() => {
    const interval = setInterval(() => {
      setRiskLevel(Math.floor(Math.random() * 20) + 70) 
      setTemperature(Math.floor(Math.random() * 5) + 30) 
      setHumidity(Math.floor(Math.random() * 10) + 10) 
      setWindSpeed(Math.floor(Math.random() * 8) + 8) 
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getRiskColor = (level) => {
    if (level < 30) return "bg-green-500"
    if (level < 60) return "bg-yellow-500"
    if (level < 80) return "bg-orange-500"
    return "bg-red-500"
  }

  const getRiskText = (level) => {
    if (level < 30) return "Low"
    if (level < 60) return "Moderate"
    if (level < 80) return "High"
    return "Extreme"
  }

  return (
    <Card className="bg-gray-800 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-yellow-700 to-red-700 rounded-t-lg">
        <CardTitle className="text-white flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Fire Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Current Risk Level</span>
            <span
              className={`text-sm font-bold ${riskLevel >= 80 ? "text-red-500" : riskLevel >= 60 ? "text-orange-500" : riskLevel >= 30 ? "text-yellow-500" : "text-green-500"}`}
            >
              {getRiskText(riskLevel)}
            </span>
          </div>
          <Progress value={riskLevel} className="h-2" indicatorClassName={getRiskColor(riskLevel)} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Thermometer className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-sm">Temperature</span>
            </div>
            <span className="text-sm font-bold">{temperature}°C</span>
          </div>

          <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Droplets className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-sm">Humidity</span>
            </div>
            <span className="text-sm font-bold">{humidity}%</span>
          </div>

          <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Wind className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">Wind Speed</span>
            </div>
            <span className="text-sm font-bold">{windSpeed} km/h</span>
          </div>
        </div>

        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mt-2">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-400">Warning</h4>
              <p className="text-xs text-gray-300 mt-1">
                Current conditions indicate extreme fire risk. Vegetation is very dry and winds are increasing.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

