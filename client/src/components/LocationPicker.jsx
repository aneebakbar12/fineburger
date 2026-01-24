import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} />
    );
};

// Component to handle "Locate Me"
const LocateControl = ({ setPosition, onLocationSelect }) => {
    const map = useMap();

    const handleLocate = (e) => {
        e.preventDefault(); // Prevent form submission if inside form
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng);
            map.flyTo(e.latlng, 16);
        });
    };

    return (
        <button
            onClick={handleLocate}
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                padding: '8px 12px',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-black)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
        >
            📍 Use My Location
        </button>
    );
};

const LocationPicker = ({ onAddressSelect }) => {
    // Default to a central location (e.g., Lahore since the user mentioned "baghbanpura lahore")
    const [position, setPosition] = useState([31.5204, 74.3587]);
    const [loading, setLoading] = useState(false);

    // Initial geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                    // We don't auto-reverse geocode on initial load to avoid spamming usage
                },
                (err) => {
                    console.log("Geolocation blocked or failed", err);
                }
            );
        }
    }, []);

    const handleLocationSelect = async (latlng) => {
        setLoading(true);
        try {
            // Reverse geocoding using Nominatim (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await response.json();

            if (data && data.display_name) {
                onAddressSelect(data.display_name, latlng);
            } else {
                onAddressSelect(`Lat: ${latlng.lat.toFixed(5)}, Lng: ${latlng.lng.toFixed(5)}`, latlng);
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            onAddressSelect(`Lat: ${latlng.lat.toFixed(5)}, Lng: ${latlng.lng.toFixed(5)}`, latlng);
        }
        setLoading(false);
    };

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative', border: '2px solid var(--color-medium-gray)' }}>
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationSelect={handleLocationSelect}
                />
                <LocateControl setPosition={setPosition} onLocationSelect={handleLocationSelect} />
            </MapContainer>
            {loading && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                }}>
                    Detecting address...
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
