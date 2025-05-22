import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to update the map center dynamically
const MapUpdater = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location?.lat && location?.lng) {
      map.setView([location.lat, location.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [location, map]);
  return null;
};

const MapComponent = ({ googleLocation, name = "Ubicació", zoom = 16 }) => {
  const location = {
    lat: googleLocation?.latitude || 40.4168,
    lng: googleLocation?.longitude || -3.7038,
  };

  return (
    <MapContainer
      center={location}
      zoom={zoom}
      style={{ height: "400px", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater location={location} />
      <Marker position={location}>
        <Popup>
          <strong>{name}</strong>
          <br />
          Latitud: {location.lat.toFixed(5)}
          <br />
          Longitud: {location.lng.toFixed(5)}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
