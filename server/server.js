import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import ee from '@google/earthengine';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import NodeCache from 'node-cache';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execPromise = promisify(exec)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cache = new NodeCache({ stdTTL: 300 }); 

const logger = {
    info: (message, data = {}) => {
        console.log({
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            ...data
        });
    },
    error: (message, error) => {
        console.error({
            timestamp: new Date().toISOString(),
            level: 'error',
            message,
            error: error.toString(),
            stack: error.stack
        });
    }
};

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',  
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(bodyParser.json({ limit: '10kb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

const validateLocationInput = [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

let eeInitialized = false;

const initializeEarthEngine = async () => {
    try {
        const privateKeyPath = new URL('./handy-apex-422906-n2-0ec766c895cd.json', import.meta.url);
        const privateKey = JSON.parse(await readFile(privateKeyPath, 'utf8'));

        await new Promise((resolve, reject) => {
            ee.data.authenticateViaPrivateKey(privateKey, () => {
                ee.initialize(null, null, () => {
                    logger.info('Google Earth Engine initialized successfully');
                    eeInitialized = true;
                    resolve();
                }, (err) => {
                    reject(err);
                });
            });
        });
    } catch (error) {
        logger.error('Error initializing Earth Engine', error);
        setTimeout(initializeEarthEngine, 5000); 
    }
};

initializeEarthEngine();

async function fetchWeatherData(lat, lng) {
    const cacheKey = `weather_${lat}_${lng}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        logger.info('Returning cached weather data', { lat, lng });
        return cachedData;
    }

    try {
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
            { timeout: 5000 } 
        );
        
        if (!weatherResponse.ok) {
            throw new Error(`Weather API responded with status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();

        if (!weatherData || !weatherData.main) {
            throw new Error('Invalid weather data structure received');
        }

        const processedData = {
            temperature: weatherData.main.temp,
            feels_like: weatherData.main.feels_like,
            temp_min: weatherData.main.temp_min,
            temp_max: weatherData.main.temp_max,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            wind: {
                speed: weatherData.wind?.speed || 0,
                degree: weatherData.wind?.deg || 0,
                gust: weatherData.wind?.gust || 0
            },
            weather: {
                main: weatherData.weather?.[0]?.main || 'Unknown',
                description: weatherData.weather?.[0]?.description || 'No description available',
                icon: weatherData.weather?.[0]?.icon || '01d'
            },
            visibility: weatherData.visibility || 0,
            location: {
                name: weatherData.name || 'Unknown Location',
                country: weatherData.sys?.country || 'Unknown'
            },
            sunrise: weatherData.sys?.sunrise ? new Date(weatherData.sys.sunrise * 1000).toISOString() : null,
            sunset: weatherData.sys?.sunset ? new Date(weatherData.sys.sunset * 1000).toISOString() : null
        };

        cache.set(cacheKey, processedData);
        return processedData;
    } catch (error) {
        logger.error('Error fetching weather data', error);
        return {
            error: true,
            message: 'Weather data unavailable',
            details: error.message
        };
    }
}

async function getLocationName(lat, lng, retries = 2) {
    if (!lat || !lng || 
        lat < -90 || lat > 90 || 
        lng < -180 || lng > 180) {
        logger.error('Invalid coordinates provided', new Error('Invalid coordinates'), { lat, lng });
        return 'Unknown Location';
    }

    const cacheKey = `location_${lat}_${lng}`;
    const cachedName = cache.get(cacheKey);
    
    if (cachedName) {
        logger.info('Returning cached location name', { lat, lng });
        return cachedName;
    }

    const fetchWithRetry = async (retriesLeft) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); 
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
                { 
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'WildfireMonitoringApp/1.0'
                    }
                }
            );
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Nominatim API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            const locationName = data.display_name || 'Unknown Location';
            cache.set(cacheKey, locationName, 3600); 
            
            logger.info('Successfully fetched location name', { 
                lat, 
                lng, 
                locationName 
            });
            
            return locationName;
        } catch (error) {
            if (retriesLeft > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
                logger.info(`Retrying location fetch, ${retriesLeft} attempts remaining`, {
                    lat,
                    lng,
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, (2 - retriesLeft) * 1000));
                return fetchWithRetry(retriesLeft - 1);
            }
            logger.error('Error fetching location name', error, { lat, lng });
            return 'Unknown Location';
        }
    };

    return fetchWithRetry(retries);
}




app.post("/api/earth-engine-analysis", async (req, res) => {
    try {
      const response = await fetch("http://localhost:6000/earth-engine-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
  
      const data = await response.json();
      res.json(data); 
    } catch (error) {
      console.error("Error calling Flask API:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

  app.post('/api/fire-spread', async (req, res) => {
    try {
        const { lng, lat } = req.body;

        if (!lng || !lat) {
            return res.status(400).json({ error: "Longitude and latitude are required" });
        }

        const response = await fetch('http://localhost:6000/predictFireSpread', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lng, lat })
        });

        if (!response.ok) {
            throw new Error(`Flask API error: ${response.statusText}`);
        }

        const flaskData = await response.json();
        res.json(flaskData);

    } catch (error) {
        console.error("Error calling Flask API:", error.message);
        res.status(500).json({ error: "Failed to fetch fire spread data" });
    }
});

app.post('/api/getFirePredictionData', async (req, res) => {
    const { lat, lng } = req.body;
    
    try {
      console.log("done");
      const point = ee.Geometry.Point([lng, lat]);
      const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 2);  
const today = yesterday.toISOString().split('T')[0];


      const fireDataset = ee.ImageCollection('ESA/CCI/FireCCI/5_1')
        .filterBounds(point)
        .filterDate('2025-03-01', today);
  
      const era5Dataset = ee.ImageCollection("ECMWF/ERA5/DAILY")
        .filterBounds(point)
        .filterDate('2020-01-01', today);
  
      const sentinel2Dataset = ee.ImageCollection("COPERNICUS/S2")
        .filterBounds(point)
        .filterDate('2025-03-01', today);
  
      const ndviImage = sentinel2Dataset
        .map(image => image.normalizedDifference(['B8', 'B4']).rename('NDVI'))
        .mean();
  
      const burnDate = fireDataset.select('BurnDate').mean();
      const observedFlag = fireDataset.select('ObservedFlag').mean();
      const landCover = fireDataset.select('LandCover').mean();
  
      const era5Image = era5Dataset.mean().select([
        'mean_2m_air_temperature',
        'u_component_of_wind_10m',
        'v_component_of_wind_10m'
      ]);
  
      const ndviValue = await ndviImage.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 500
      }).getInfo();
  
      const burnDateValue = await burnDate.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 500
      }).getInfo();
  
      const observedFlagValue = await observedFlag.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 500
      }).getInfo();
  
      const landCoverValue = await landCover.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 500
      }).getInfo();
  
      const era5Values = await era5Image.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: point,
        scale: 500
      }).getInfo();
  
      const inputFeatures = {
        burnDate: burnDateValue['BurnDate'] || 0,
        ndvi: ndviValue['NDVI'] || 0,
        observedFlag: observedFlagValue['ObservedFlag'] || 0,
        landCover: landCoverValue['LandCover'] || 0,
        meanTemperature: era5Values['mean_2m_air_temperature'] || 0,
        windComponentU: era5Values['u_component_of_wind_10m'] || 0,
        windComponentV: era5Values['v_component_of_wind_10m'] || 0
      };
  
      const predictionResponse = await fetch('http://localhost:6000/predictFireRisk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputFeatures)
    });
  
      const predictionData = await predictionResponse.json();
        console.log(predictionData);
      res.json({
        locationDetails: {
          lat,
          lng,
          burnDate: burnDateValue['BurnDate'],
          ndvi: ndviValue['NDVI'],
          observedFlag: observedFlagValue['ObservedFlag'],
          landCover: landCoverValue['LandCover'],
          meanTemperature: era5Values['mean_2m_air_temperature'],
          windComponentU: era5Values['u_component_of_wind_10m']
        },
        predictionConfidence: predictionData.confidence
      });
  
    } catch (error) {
      console.error('Error processing fire prediction data:', error);
      res.status(500).json({
        error: 'Failed to process fire prediction data',
        details: error.message
      });
    }
  });

  
async function getHistoricalImagery(point, currentNBR) {
    try {
        if (!eeInitialized) {
            throw new Error('Earth Engine not initialized');
        }

        if (currentNBR >= 0.3) {
            logger.info('Current NBR indicates no fire risk, skipping historical imagery');
            return null;
        }

        const threeYearsAgo = ee.Date(Date.now()).advance(-3, 'year');
        const now = ee.Date(Date.now());

        const addNBR = (image) => {
            const nbr = image.normalizedDifference(['SR_B5', 'SR_B7']).rename('nbr');
            return image.addBands(nbr);
        };

        const addNBRSentinel = (image) => {
            const nbr = image.normalizedDifference(['B8', 'B12']).rename('nbr');
            return image.addBands(nbr);
        };

        let collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            .filterDate(threeYearsAgo, now)
            .filterBounds(point)
            .map(addNBR);

        let nbrValues = collection.select('nbr').map(img => {
            const nbrValue = img.reduceRegion({
                reducer: ee.Reducer.mean(),
                geometry: point,
                scale: 30
            });
            return img.set('nbr_value', nbrValue.get('nbr'));
        });

        let filteredCollection = nbrValues
            .filter(ee.Filter.gt('nbr_value', 0.3))
            .sort('system:time_start', false);

        let preFireImage = filteredCollection.first();
        let count = await filteredCollection.size().getInfo();

        if (count === 0) {
            collection = ee.ImageCollection('COPERNICUS/S2')
                .filterDate(threeYearsAgo, now)
                .filterBounds(point)
                .map(addNBRSentinel);

            nbrValues = collection.select('nbr').map(img => {
                const nbrValue = img.reduceRegion({
                    reducer: ee.Reducer.mean(),
                    geometry: point,
                    scale: 30
                });
                return img.set('nbr_value', nbrValue.get('nbr'));
            });

            filteredCollection = nbrValues
                .filter(ee.Filter.gt('nbr_value', 0.3))
                .sort('system:time_start', false);

            preFireImage = filteredCollection.first();
            count = await filteredCollection.size().getInfo();
        }

        if (count === 0) {
            logger.info('No suitable pre-fire image found (NBR > 0.3)');
            return null;
        }

        const imageProperties = await preFireImage.get('nbr_value').getInfo();
        const timestamp = await preFireImage.get('system:time_start').getInfo();
        
        const visParams = {
            min: -1,
            max: 1,
            palette: ['red', 'white', 'blue']
        };

        const visualizedNBR = preFireImage.select('nbr').visualize(visParams);
        const region = point.buffer(50000).bounds();
        const mapParams = {
            dimensions: '600x400',
            region: region.getInfo(),
            format: 'png'
        };

        const historicalMapUrl = await visualizedNBR.getThumbURL(mapParams);
        const imageDate = ee.Date(timestamp);
        const historicalDate = await imageDate.format('YYYY-MM-dd').getInfo();

        logger.info('Successfully found pre-fire imagery', {
            date: historicalDate,
            nbr: imageProperties
        });

        return {
            url: historicalMapUrl,
            date: historicalDate,
            nbr: imageProperties,
            daysBeforeCurrent: Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
        };

    } catch (error) {
        logger.error('Error in getHistoricalImagery', error);
        return null;
    }
}

app.post('/api/predictFireType', [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('brightness').isFloat(),
    body('bright_t31').isFloat(),
    body('frp').isFloat(),
    body('satellite').isString(),
    body('confidence').isFloat({ min: 0, max: 100 }),
    body('daynight').isIn(['day', 'night'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, brightness, bright_t31, frp, satellite, confidence, daynight } = req.body;

    const inputFeatures = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        brightness: parseFloat(brightness),
        bright_t31: parseFloat(bright_t31),
        frp: parseFloat(frp),
        satellite,
        confidence: parseFloat(confidence),
        daynight: daynight === 'day' ? 1 : 0,
    };

    try {
        const response = await fetch('http://localhost:5000/api/predictFireType', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputFeatures),
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error(`Prediction API responded with status: ${response.status}`);
        }

        const predictionData = await response.json();
        res.json({ predictedType: predictionData.predictedType });
    } catch (error) {
        logger.error('Error making prediction', error);
        res.status(500).json({ error: 'Error making prediction', details: error.message });
    }
});

async function fetchHistoricalWeather(lat, lng, date) {
    if (!lat || !lng || !date || 
        lat < -90 || lat > 90 || 
        lng < -180 || lng > 180) {
        logger.error('Invalid parameters provided', new Error('Invalid parameters'), {
            lat,
            lng,
            date
        });
        return null;
    }

    const cacheKey = `historical_weather_${lat}_${lng}_${date}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        logger.info('Returning cached historical weather data', { lat, lng, date });
        return cachedData;
    }

    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date format');
        }

        if (dateObj > new Date()) {
            throw new Error('Future date provided');
        }

        const weatherApiKey = '35b5a4486cfc4b64a00192901242210'; 
        const url = `https://api.weatherapi.com/v1/history.json?key=${weatherApiKey}&q=${lat},${lng}&dt=${date}`;

        const weatherResponse = await fetch(url, { 
            timeout: 15000,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!weatherResponse.ok) {
            throw new Error(`Historical weather API responded with status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        
        if (!weatherData.forecast?.forecastday?.[0]?.day) {
            throw new Error('Invalid weather data structure received');
        }

        const dayData = weatherData.forecast.forecastday[0].day;

        const processedData = {
            temperature: dayData.avgtemp_c,
            max_temp: dayData.maxtemp_c,
            min_temp: dayData.mintemp_c,
            humidity: dayData.avghumidity,
            wind_speed: dayData.maxwind_kph,
            precipitation: dayData.totalprecip_mm,
            condition: {
                text: dayData.condition?.text || 'Unknown',
                icon: dayData.condition?.icon || ''
            },
            date: date,
            uv: dayData.uv
        };

        if (!processedData.temperature || !processedData.humidity) {
            throw new Error('Missing critical weather data');
        }

        cache.set(cacheKey, processedData, 3600); 
        
        logger.info('Successfully fetched historical weather data', {
            lat,
            lng,
            date,
            temperature: processedData.temperature
        });

        return processedData;
    } catch (error) {
        logger.error('Error fetching historical weather data', error, {
            lat,
            lng,
            date
        });
        return null;
    }
}

app.post('/api/getLocationData', async (req, res) => {
    const { lat, lng } = req.body;
    console.log(`Processing request for lat: ${lat}, lng: ${lng}`);
    
    try {
        const point = ee.Geometry.Point([lng, lat]);
        const image = ee.ImageCollection('MODIS/006/MOD13A1')
            .filterBounds(point)
            .sort('system:time_start', false)
            .first();

        if (!image) {
            throw new Error('No image data available for the specified location');
        }

        const nbr = image.normalizedDifference(['sur_refl_b02', 'sur_refl_b01'])
            .rename('nbr');

        const nbrValue = await nbr.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 500,
        }).getInfo();

        console.log('Current NBR Value:', nbrValue);

        const riskLevel = nbrValue['nbr'] < -0.1 ? 'High' : 
                         nbrValue['nbr'] < 0.2 ? 'Moderate' : 'Low';

        const visParams = {
            min: -1,
            max: 1,
            palette: ['red', 'white', 'blue']
        };

        const visualizedNbr = nbr.visualize(visParams);
        const marker = ee.FeatureCollection([ee.Feature(point)]);
        const pinIcon = ee.Image('srtm90_v4').multiply(0).add(1).clip(point.buffer(500));
        const pinImage = pinIcon.visualize({palette: ['#FF0000'], opacity: 0.9});
        const finalImage = visualizedNbr.blend(pinImage);

        const mapParams = {
            dimensions: '600x400',
            region: point.buffer(50000).bounds().getInfo(),
            format: 'png'
        };

        const mapUrl = await finalImage.getThumbURL(mapParams);
        const historicalImage = await getHistoricalImagery(point, nbrValue['nbr']);
        let historicalWeather = null;
        
        if (historicalImage && historicalImage.date) {
            historicalWeather = await fetchHistoricalWeather(lat, lng, historicalImage.date);
        }

        const locationName = await getLocationName(lat, lng);
        const currentWeather = await fetchWeatherData(lat, lng);

        res.json({
            lat,
            lng,
            nbr: nbrValue['nbr'],
            riskLevel,
            mapUrl,
            historicalImage,
            historicalWeather,
            locationName,
            weather: currentWeather
        });

    } catch (error) {
        console.error('Error processing location data:', error);
        res.status(500).json({
            error: 'Failed to process location data',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});