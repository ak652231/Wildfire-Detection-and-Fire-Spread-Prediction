from flask import Flask, request, jsonify
import pickle
import numpy as np
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS
import ee
import os
import joblib
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
from queue import Queue
import math
app = Flask(__name__)
CORS(app)
import ee
model = joblib.load("models/linear_regression_model.pkl")
scaler = joblib.load("models/scaler.pkl")

ee.Initialize(project='ee-ak65223167')


@app.route('/earth-engine-analysis', methods=['POST'])
def earth_engine_analysis():
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')
    start_date = data.get('start')
    end_date = data.get('end')

    try:
        point = ee.Geometry.Point([lng, lat])

        region = ee.Geometry.Rectangle([
            lng - 0.2, lat - 0.2,
            lng + 0.2, lat + 0.2
        ])

        collection = ee.ImageCollection("COPERNICUS/S2_HARMONIZED") \
            .filterBounds(region) \
            .filterDate(start_date, end_date)

        image = collection.first()

        if not image:
            return jsonify({"error": "No imagery found for selected location and date range"}), 404

        # Calculate NDVI
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')

        # Calculate NBR
        nbr = image.normalizedDifference(['B8', 'B12']).rename('NBR')

        # Combine NDVI and NBR
        classified = ndvi.addBands(nbr).expression(
            "(b('NDVI') < 0.2 && b('NBR') < 0.1) ? 0"  # Burnt Area
            ": (b('NDVI') > 0.5) ? 1"                  # Healthy Vegetation
            ": 2",                                     # Water or Other
        ).rename('fire_risk_class')

        # 🔥 Clip classified image to the square region
        classified = classified.clip(region)

        # Visualization
        vis_params = {
            'min': 0,
            'max': 2,
            'palette': ['red', 'green', 'blue']
        }

        map_id = classified.getMapId(vis_params)

        return jsonify({
            'tileUrl': map_id['tile_fetcher'].url_format,
            'coordinates': {'lat': lat, 'lng': lng}
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predictFireRisk', methods=['POST'])
def predict_fire_risk():
    try:
        data = request.json
        
        input_features = np.array([
            data['burnDate'],
            data['ndvi'],
            data['observedFlag'],
            data['landCover'],
            data['meanTemperature'],
            data['windComponentU'],
            data['windComponentV']
        ]).reshape(1, -1)
        
        scaled_features = scaler.transform(input_features)
        
        confidence = model.predict(scaled_features)[0]
        
        return jsonify({
            'confidence': float(confidence)
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500



def fetch_gee_data(lon, lat):
    
    point = ee.Geometry.Point(lon, lat)
    
    today = '2025-03-20'  
    fire_dataset = ee.ImageCollection('ESA/CCI/FireCCI/5_1') \
        .filterBounds(point) \
        .filterDate('2025-03-01', today) \
        .select(['BurnDate', 'ObservedFlag', 'LandCover']) \
        .mean()

    era5_dataset = ee.ImageCollection("ECMWF/ERA5/DAILY") \
        .filterBounds(point) \
        .filterDate('2020-01-01', today) \
        .select(['mean_2m_air_temperature', 'u_component_of_wind_10m', 'v_component_of_wind_10m']) \
        .mean()

    sentinel2_dataset = ee.ImageCollection("COPERNICUS/S2") \
        .filterBounds(point) \
        .filterDate('2025-03-01', today) \
        .select(['B8', 'B4']) \
        .map(lambda image: image.normalizedDifference(['B8', 'B4']).rename('NDVI')) \
        .mean()

    all_values = ee.Image.cat([fire_dataset, era5_dataset, sentinel2_dataset]) \
        .reduceRegion(reducer=ee.Reducer.mean(), geometry=point, scale=500) \
        .getInfo()


    return {
        'burnDate': all_values.get('BurnDate', 0),
        'ndvi': all_values.get('NDVI', 0),
        'observedFlag': all_values.get('ObservedFlag', 0),
        'landCover': all_values.get('LandCover', 0),
        'meanTemperature': all_values.get('mean_2m_air_temperature', 0),
        'windU': all_values.get('u_component_of_wind_10m', 0),
        'windV': all_values.get('v_component_of_wind_10m', 0)
    }

def predict_fire_risk(input_features):
    try:
        print("start")
        features = np.array([
            input_features['burnDate'],
            input_features['ndvi'],
            input_features['observedFlag'],
            input_features['landCover'],
            input_features['meanTemperature'],
            input_features['windU'],
            input_features['windV']
        ]).reshape(1, -1)

        scaled_features = scaler.transform(features)
        confidence = model.predict(scaled_features)[0]

        return float(confidence)  

    except Exception as e:
        return 0  



def fire_spread_simulation(start_point, max_distance_km=20, max_iterations=200):
    queue = Queue()
    queue.put(start_point)
    visited = set()
    visited.add(tuple(round(coord, 5) for coord in start_point))

    affected_points = []
    threshold = 3.5
    iteration = 0

    def haversine(x1, y1, x2, y2):
        R = 6371  
        dlat = math.radians(y2 - y1)
        dlon = math.radians(x2 - x1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(y1)) * math.cos(math.radians(y2)) * math.sin(dlon / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))

    while not queue.empty() and iteration < max_iterations:
        x, y = queue.get()
        iteration += 1

        if haversine(start_point[0], start_point[1], x, y) > max_distance_km:
            continue

        env_data = fetch_gee_data(x, y) 
        fire_confidence = predict_fire_risk(env_data) 
        print(f"Fire confidence at ({x:.5f}, {y:.5f}): {fire_confidence:.2f}")

        if fire_confidence >= threshold:
            affected_points.append((x, y, fire_confidence))

            lat_step = 5000 / 111000  
            lon_step = 5000 / (111320 * math.cos(math.radians(y)))

            directions = [
                (lon_step, 0), (-lon_step, 0),
                (0, lat_step), (0, -lat_step)
            ]

            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                rounded_point = tuple(round(c, 5) for c in (nx, ny))
                if rounded_point not in visited:
                    if haversine(start_point[0], start_point[1], nx, ny) <= max_distance_km:
                        queue.put((nx, ny))
                        visited.add(rounded_point)

    return affected_points

@app.route('/predictFireSpread', methods=['POST'])
def predict_fire_spread():
    try:
        data = request.json
        lon, lat = data['lng'], data['lat']
        
        input_features = fetch_gee_data(lon, lat)
        print(input_features)
        affected_area = fire_spread_simulation((lon, lat))
        print("no")
        return jsonify({
            "fireSpreadCoordinates": affected_area,
            "inputFeatures": input_features
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=6000)

   