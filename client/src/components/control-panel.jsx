import React from 'react';
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Filter, RefreshCw } from "lucide-react"

export function ControlPanel() {
  const [detectionThreshold, setDetectionThreshold] = useState(75)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showPredictions, setShowPredictions] = useState(true)

  return (
    <Card className="bg-gray-800 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-orange-700 to-red-700 rounded-t-lg">
        <CardTitle className="text-white flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="threshold" className="text-sm font-medium">
              Detection Threshold
            </Label>
            <span className="text-sm font-bold text-orange-400">{detectionThreshold}%</span>
          </div>
          <Slider
            id="threshold"
            min={0}
            max={100}
            step={1}
            value={[detectionThreshold]}
            onValueChange={(value) => setDetectionThreshold(value[0])}
            className="[&_[role=slider]]:bg-orange-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-refresh" className="text-sm font-medium">
              Auto Refresh
            </Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-predictions" className="text-sm font-medium">
              Show Predictions
            </Label>
            <Switch
              id="show-predictions"
              checked={showPredictions}
              onCheckedChange={setShowPredictions}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data-source" className="text-sm font-medium">
            Data Source
          </Label>
          <Select defaultValue="sentinel2">
            <SelectTrigger id="data-source" className="bg-gray-700 border-gray-600">
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="sentinel2">Sentinel-2</SelectItem>
              <SelectItem value="landsat8">Landsat 8</SelectItem>
              <SelectItem value="modis">MODIS</SelectItem>
              <SelectItem value="viirs">VIIRS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="analysis-type" className="text-sm font-medium">
            Analysis Type
          </Label>
          <Select defaultValue="kmeans">
            <SelectTrigger id="analysis-type" className="bg-gray-700 border-gray-600">
              <SelectValue placeholder="Select analysis type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="kmeans">K-Means Clustering</SelectItem>
              <SelectItem value="supervised">Supervised Classification</SelectItem>
              <SelectItem value="burnindex">Burn Index</SelectItem>
              <SelectItem value="change">Change Detection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 flex space-x-2">
          <Button className="w-full bg-orange-600 hover:bg-orange-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Analysis
          </Button>
          <Button variant="outline" className="w-full border-orange-600 text-orange-400 hover:bg-orange-900/20">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alert Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

