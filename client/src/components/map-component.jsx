"use client"

import { useEffect } from "react"

export function MapComponent({ onMapReady, onMapError, onMapClick, mapContainerRef }) {
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (!document.getElementById("leaflet-css")) {
          const linkElement = document.createElement("link")
          linkElement.id = "leaflet-css"
          linkElement.rel = "stylesheet"
          linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(linkElement)
        }

        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            script.crossOrigin = ""
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        const L = window.L
        const map = L.map(mapContainerRef.current).setView([41.42, -122.09], 8)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        map.on("click", (e) => {
          const { lat, lng } = e.latlng
          onMapClick(lat, lng, map, L)
        })

        onMapReady()
      } catch (error) {
        console.error("Map initialization error:", error)
        onMapError()
      }
    }

    if (mapContainerRef.current) {
      loadLeaflet()
    }

    return () => {
      if (window.L && mapContainerRef.current?._leaflet_id) {
        window.L.DomEvent.off(mapContainerRef.current)
      }
    }
  }, [mapContainerRef, onMapReady, onMapError, onMapClick])

  return <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />
}

