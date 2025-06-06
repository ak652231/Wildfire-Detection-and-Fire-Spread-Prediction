
import React from 'react';
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react"

export function TimelineSlider() {
  const [playing, setPlaying] = useState(false)
  const [currentDay, setCurrentDay] = useState(30)
  const startDate = new Date(2024, 8, 1) // Sept 1, 2024

  const formatDate = (daysToAdd) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + daysToAdd)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const togglePlay = () => {
    setPlaying(!playing)
  }

  const handlePrevDay = () => {
    setCurrentDay(Math.max(0, currentDay - 1))
  }

  const handleNextDay = () => {
    setCurrentDay(Math.min(100, currentDay + 1))
  }

  return (
    <Card className="bg-gray-800 border-0 shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-white">Time Period: {formatDate(currentDay)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-gray-700 hover:bg-gray-600"
              onClick={handlePrevDay}
            >
              <SkipBack className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-gray-700 hover:bg-gray-600"
              onClick={togglePlay}
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-gray-700 hover:bg-gray-600"
              onClick={handleNextDay}
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[currentDay]}
          onValueChange={(value) => setCurrentDay(value[0])}
          className="[&_[role=slider]]:bg-orange-500"
        />
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>Sept 1, 2024</span>
          <span>Dec 10, 2024</span>
        </div>
      </CardContent>
    </Card>
  )
}

