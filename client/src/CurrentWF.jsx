import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import MapComponent from './MapComponent';
import ResultsPanel from './ResultPanel';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function CurrentWF() {
  const [data, setData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firePrediction, setFirePrediction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([20, 78]);
  const apiKey = '35b5a4486cfc4b64a00192901242210'; // Replace with your actual API key
  const apiUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/f538dbc81776ce46861573379924324f/MODIS_NRT/world/1/2024-10-12';

  const fetchWeatherData = async (lat, lng) => {
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=2d1e9aa56ae206841c7b402e2ed405e5&units=metric`
      );
      const weatherData = await weatherResponse.json();
      return {
        temperature: weatherData.main.temp,
        humidity: weatherData.main.humidity,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const fetchFireData = async (lat, lng) => {
    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      const rows = data.split('\n');
      const headers = rows[0].split(',');
      const results = [];

      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',');
        if (columns.length > 1 && parseFloat(columns[0]) === lat && parseFloat(columns[1]) === lng) {
          const entry = {};
          headers.forEach((header, index) => {
            entry[header] = columns[index]; 
          });
          results.push(entry);
        }
      }

      if (results.length > 0) {
        const fireData = results[0]; 
        await getFirePrediction({
          latitude: lat,
          longitude: lng,
          brightness: fireData.brightness,
          bright_t31: fireData.bright_t31,
          frp: fireData.frp,
          satellite: fireData.satellite,
          confidence: fireData.confidence,
          daynight: fireData.daynight,
        });
      } else {
        console.log('No matching entries found for coordinates:', lat, lng);
      }
    } catch (error) {
      console.error('Error fetching fire data:', error.response ? error.response.data : error.message);
    }
  };

  const getFirePrediction = async (fireData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/predictFireType', fireData);
      setFirePrediction(response.data.predictedType);
    } catch (error) {
      console.error('Error getting fire prediction:', error);
    }
  };

  const fetchLocationData = async (lat, lng) => {
    try {
      const response = await fetch('http://localhost:5000/api/getLocationData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const result = await response.json();

      const weather = await fetchWeatherData(lat, lng);
      setData({ ...result, weather });

      await fetchHistoricalData(lat, lng);
      await fetchFireData(lat, lng); 
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchHistoricalData = async (lat, lng) => {
    try {
      const today = Math.floor(Date.now() / 1000);
      const pastDays = Array.from({ length: 7 }, (_, i) => today - i * 86400); 
      const dataPromises = pastDays.map((day) =>
        axios.get(
          `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lng}&dt=${new Date(day * 1000).toISOString().split('T')[0]}`
        )
      );

      const responses = await Promise.all(dataPromises);
      const weatherData = responses.map((response) => response.data);

      const fireRiskScores = weatherData.map(data => {
        const maxTemp = data.forecast.forecastday[0].day.maxtemp_c;
        const humidity = data.forecast.forecastday[0].day.avghumidity;
        const windSpeed = data.forecast.forecastday[0].day.maxwind_kph;

        const riskScore = calculateRiskScore(maxTemp, humidity, windSpeed);

        return {
          date: data.forecast.forecastday[0].date,
          maxTemp,
          humidity,
          windSpeed,
          riskScore,
        };
      });

      setHistoricalData(fireRiskScores);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical weather data:', error);
      setLoading(false);
    }
  };

  const calculateRiskScore = (maxTemp, humidity, windSpeed) => {
    let score = 0;

    if (maxTemp > 30) score += (maxTemp - 30) * 2;
    else if (maxTemp > 20) score += (maxTemp - 20);

    if (humidity < 30) score += 3;
    else if (humidity < 50) score += 1;

    if (windSpeed > 20) score += 3;
    else if (windSpeed > 10) score += 1;

    return score;
  };

  const chartData = {
    labels: historicalData.map(data => data.date),
    datasets: [
      {
        label: 'Fire Risk Score',
        data: historicalData.map(data => data.riskScore),
        borderColor: 'rgba(255, 206, 86, 1)',
        fill: false,
      },
      {
        label: 'Max Temperature (°C)',
        data: historicalData.map(data => data.maxTemp),
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
      },
      {
        label: 'Humidity (%)',
        data: historicalData.map(data => data.humidity),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
      {
        label: 'Wind Speed (kph)',
        data: historicalData.map(data => data.windSpeed),
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: false,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Values',
        },
      },
    },
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        fetchLocationData(parseFloat(lat), parseFloat(lon));
      } else {
        console.log('Location not found');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
    }
  };

  return (
    <div className="font-montserrat bg-gray min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-orange-400 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Wildfire Prediction Map</h1>
            <form onSubmit={handleSearch} className="flex">
            <input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search location..."
  className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
/>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>
          <MapComponent onLocationClick={fetchLocationData} center={mapCenter} />
        </div>
        <ResultsPanel 
          data={data} 
          historicalData={historicalData}
          loading={loading}
          firePrediction={firePrediction}
          chartData={chartData}
          chartOptions={chartOptions}
        />
      </div>
    </div>
  );
}