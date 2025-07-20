import React, { useRef, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import CorrelationAnalysis from './CorrelationAnalysis'

export default function Component({ data, historicalData, loading, chartData, chartOptions, prediction }) {
  const reportRef = useRef(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    if (data) {
      const images = reportRef.current.querySelectorAll('img')
      let loadedCount = 0
      const totalImages = images.length

      const imageLoaded = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          setImagesLoaded(true)
        }
      }

      images.forEach(img => {
        if (img.complete) {
          imageLoaded()
        } else {
          img.addEventListener('load', imageLoaded)
          img.addEventListener('error', imageLoaded)
        }
      })

      return () => {
        images.forEach(img => {
          img.removeEventListener('load', imageLoaded)
          img.removeEventListener('error', imageLoaded)
        })
      }
    }
  }, [data])

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto my-8 font-sans">
        <p className="text-center text-gray-500">Click on the map to get data for a location.</p>
      </div>
    )
  }

  const getLegendColor = (nbrValue) => {
    if (nbrValue < -0.1) return 'bg-red-500'
    if (nbrValue < 0.2) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const downloadReport = async () => {
    if (!imagesLoaded) {
      alert('Please wait for all images to load before downloading the report.')
      return
    }

    const content = reportRef.current
    const canvas = await html2canvas(content, {
      useCORS: true,
      allowTaint: true,
      logging: true,
      onclone: (clonedDoc) => {
        clonedDoc.querySelector('#reportRef').style.height = 'auto'
        clonedDoc.querySelector('#reportRef').style.width = '1200px'
      }
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 30

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save('fire_risk_report.pdf')
  }

  const showHistoricalComparison = data.riskLevel !== 'Low' && data.historicalImage
  const showCorrelationGraph = data.riskLevel === 'Moderate' || data.riskLevel === 'High'

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-lg p-8 max-w-4xl mx-auto my-12 font-sans">
      <div ref={reportRef} id="reportRef">
        <h2 className="text-3xl font-bold text-orange-800 mb-8 text-center">Fire Risk Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-orange-700 mb-4">Location Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-gray-600 mr-2">Location:</span>
                <span className="text-gray-900">{data.locationName}</span>
              </div>
              <div>
                <span className="font-bold text-gray-600 mr-2">Current NBR:</span>
                <span className="text-gray-900">{data.nbr}</span>
              </div>
              {showHistoricalComparison && (
                <div>
                  <span className="font-bold text-gray-600 mr-2">Historical NBR:</span>
                  <span className="text-gray-900">
                    {data.historicalImage.nbr ? data.historicalImage.nbr : 'N/A'}
                  </span>
                </div>
              )}
              <div>
                <span className="font-bold text-gray-600 mr-2">Fire Risk Level:</span>
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getLegendColor(data.nbr)}`}>
                  {data.riskLevel}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-600 mr-2">Temperature:</span>
                <span className="text-gray-900">{data.weather?.temperature} °C</span>
              </div>
              <div>
                <span className="font-bold text-gray-600 mr-2">Humidity:</span>
                <span className="text-gray-900">{data.weather?.humidity} %</span>
              </div>
              <div>
                <span className="font-bold text-gray-600 mr-2">Predicted Fire Type:</span>
                <span className="text-gray-900">{prediction || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-orange-700 mb-4">Wildfire Map</h3>
            {showHistoricalComparison ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Before Wildfire Risk</h4>
                  <img 
                    src={data.historicalImage.url} 
                    alt="Historical Wildfire Map" 
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                    crossOrigin="anonymous"
                  />
                  <p className="text-center text-gray-500 text-sm mt-2">Date: {data.historicalImage.date}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Current Condition</h4>
                  <img 
                    src={data.mapUrl} 
                    alt="Current Wildfire Map" 
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                    crossOrigin="anonymous"
                  />
                  <p className="text-center text-gray-500 text-sm mt-2">Current</p>
                </div>
              </div>
            ) : (
              <div>
                <img 
                  src={data.mapUrl} 
                  alt="Wildfire Map" 
                  className="w-full h-80 object-cover rounded-lg shadow-sm"
                  crossOrigin="anonymous"
                />
                <p className="text-center text-gray-500 text-sm mt-2">{data.locationName}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-12 bg-orange-100 border-2 border-orange-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-orange-800 mb-6">Analyse the changes</h3>
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-orange-700 mb-4">Fire Risk Indicators for the Past 7 Days</h4>
              {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
            {showCorrelationGraph && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-xl font-semibold text-orange-700 mb-4">Environmental Correlation Analysis</h4>
                <CorrelationAnalysis 
                  currentData={{
                    nbr: data.nbr,
                    temperature: data.weather?.temperature,
                    humidity: data.weather?.humidity
                  }}
                  historicalData={data.historicalImage ? {
                    nbr: data.historicalImage.nbr,
                    temperature: data.historicalWeather?.temperature,
                    humidity: data.historicalWeather?.humidity,
                    date: data.historicalImage.date
                  } : null}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <button 
          onClick={downloadReport} 
          className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105"
          disabled={!imagesLoaded}
        >
          {imagesLoaded ? 'Download Report' : 'Loading Images...'}
        </button>
      </div>
    </div>
  )
}