import React from 'react';
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Flame, TrendingUp, AlertTriangle } from "lucide-react"

const mockData = [
  { name: "Mon", active: 12, contained: 5 },
  { name: "Tue", active: 19, contained: 8 },
  { name: "Wed", active: 15, contained: 10 },
  { name: "Thu", active: 25, contained: 12 },
  { name: "Fri", active: 30, contained: 15 },
  { name: "Sat", active: 22, contained: 18 },
  { name: "Sun", active: 18, contained: 20 },
]

export function FireStatistics() {
  const [data, setData] = useState(mockData)
  const [totalActive, setTotalActive] = useState(0)
  const [totalContained, setTotalContained] = useState(0)
  const [highRiskAreas, setHighRiskAreas] = useState(0)

  useEffect(() => {
    // Calculate totals from the data
    const active = data.reduce((sum, item) => sum + item.active, 0)
    const contained = data.reduce((sum, item) => sum + item.contained, 0)

    setTotalActive(active)
    setTotalContained(contained)
    setHighRiskAreas(Math.floor(Math.random() * 10) + 5) // Random number for demo
  }, [data])

  return (
    <Card className="bg-gray-800 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-red-700 to-orange-700 rounded-t-lg">
        <CardTitle className="text-white flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Fire Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Active Fires</div>
              <Flame className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500 mt-1">{totalActive}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Contained</div>
              <Flame className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500 mt-1">{totalContained}</div>
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">High Risk Areas</div>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">{highRiskAreas}</div>
        </div>

        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                itemStyle={{ color: "#f9fafb" }}
                labelStyle={{ color: "#f9fafb" }}
              />
              <Bar dataKey="active" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contained" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

