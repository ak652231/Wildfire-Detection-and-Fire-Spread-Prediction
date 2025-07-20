import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 10);
  }, [center, map]);
  return null;
}

export default function MapComponent({ onLocationClick, center = [20, 78] }) {
  const [markerPosition, setMarkerPosition] = useState(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        onLocationClick(lat, lng);
      },
    });
    return null;
  };

  return (
    <MapContainer center={center} zoom={5} style={{ height: '500px', width: '100%' }} className="rounded-lg shadow-md">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler />
      <ChangeView center={center} />
      {markerPosition && (
        <Marker position={markerPosition}>
          <Popup>
            Selected location<br />
            Lat: {markerPosition[0].toFixed(4)}, Lng: {markerPosition[1].toFixed(4)}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}