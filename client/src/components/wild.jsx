"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import "./wild.css"

function Wildfire() {
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef(null)

  useEffect(() => {
    const handleIframeLoad = () => {
      setIsLoading(false)
    }

    if (iframeRef.current) {
      iframeRef.current.addEventListener("load", handleIframeLoad)
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener("load", handleIframeLoad)
      }
    }
  }, [])

  return (
    <div className="wildfire-container">
      <header className="wildfire-header">
        <div className="header-content">
          <h1>Wildfire Detection Map</h1>
          <div className="location-badge">Location: [-122.09, 41.42]</div>
        </div>
        <nav className="navigation">
          <Link to="/" className="nav-link active">
            Map
          </Link>
          <Link to="/current" className="nav-link">
            Current Fires
          </Link>
          <Link to="/pred" className="nav-link">
            Predictions
          </Link>
          <Link to="/kmean" className="nav-link">
            K-means
          </Link>
        </nav>
      </header>

      <main className="wildfire-main">
        <div className="map-container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <span>Loading map data...</span>
            </div>
          )}
          <iframe ref={iframeRef} src="/clustered_fire.html" className="map-iframe" title="Wildfire Detection Map" />

          <div className="map-legend">
            <h4>Legend</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="color-box green"></div>
                <span>Green (Cluster 0)</span>
              </div>
              <div className="legend-item">
                <div className="color-box yellow"></div>
                <span>Yellow (Cluster 1)</span>
              </div>
              <div className="legend-item">
                <div className="color-box orange"></div>
                <span>Orange (Cluster 2)</span>
              </div>
              <div className="legend-item">
                <div className="color-box red"></div>
                <span>Red (Cluster 3)</span>
              </div>
              <div className="legend-item">
                <div className="color-box black"></div>
                <span>Black (Cluster 4)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-panel">
          <h3>K-means Clustering Analysis</h3>
          <div className="info-content">
            <p>
              <strong>Algorithm:</strong> K-means with 7 clusters
            </p>
            <p>
              <strong>Data Source:</strong> Sentinel-2 (COPERNICUS/S2_HARMONIZED)
            </p>
            <p>
              <strong>Date Range:</strong> Sept 1, 2024 to Dec 10, 2024
            </p>
            <p>
              <strong>Bands Used:</strong> B2, B3, B4, B8, B11, B12
            </p>
            <p>
              <strong>Sample Size:</strong> 1000 pixels
            </p>
          </div>
          <button
            className="run-analysis-btn"
            onClick={() => alert("Analysis functionality would be connected to your Python backend")}
          >
            Run New Analysis
          </button>
        </div>
      </main>
    </div>
  )
}

export default Wildfire

