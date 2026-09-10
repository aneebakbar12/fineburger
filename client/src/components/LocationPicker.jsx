import React, { useState, useEffect } from 'react';
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

// Reverse geocode lat/lng to a clean, human-readable address
export const reverseGeocodeCoordinates = async (lat, lng) => {
    // 1. Try Nominatim (OpenStreetMap) with English locale & clean fallback
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (res.ok) {
            const data = await res.json();
            if (data?.address) {
                const a = data.address;
                const road = a.road || a.pedestrian || a.street || a.residential;
                const area = a.suburb || a.neighbourhood || a.town || a.quarter || a.city_district;
                const city = a.city || a.town || a.county || 'Lahore';
                const parts = [road, area, city].filter(Boolean);
                const uniqueParts = [...new Set(parts)];
                if (uniqueParts.length >= 2) {
                    return uniqueParts.join(', ');
                }
            }
            if (data?.display_name) {
                return data.display_name.split(',').slice(0, 3).map(s => s.trim()).join(', ');
            }
        }
    } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
    }

    // 2. Try BigDataCloud (Fast, reliable, CORS-friendly client-side geocoding)
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (res.ok) {
            const data = await res.json();
            const parts = [];
            const locality = data.locality;
            if (locality && !['Pakistan', 'Punjab'].includes(locality)) {
                parts.push(locality);
            }
            if (data.localityInfo?.administrative) {
                const adminNames = data.localityInfo.administrative
                    .map(item => item.name)
                    .filter(n => n && !['Pakistan', 'Punjab', 'Asia', 'Indian subcontinent', 'Lahore Division'].includes(n));
                for (const name of adminNames.slice().reverse()) {
                    if (!parts.includes(name)) parts.push(name);
                }
            }
            if (!parts.includes('Lahore')) {
                parts.push('Lahore');
            }
            if (parts.length > 0) {
                return parts.slice(0, 3).join(', ');
            }
        }
    } catch (err) {
        console.warn('BigDataCloud reverse geocode error:', err);
    }

    // 3. Try Photon Komoot API
    try {
        const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
        if (res.ok) {
            const data = await res.json();
            const p = data?.features?.[0]?.properties;
            if (p) {
                const parts = [p.name, p.district, p.city || 'Lahore'].filter(Boolean);
                const unique = [...new Set(parts)];
                if (unique.length > 0) {
                    return unique.join(', ');
                }
            }
        }
    } catch (err) {
        console.warn('Photon reverse geocode error:', err);
    }

    // 4. Intelligent localized fallback — never display raw coordinates!
    if (lat >= 31.4 && lat <= 31.7 && lng >= 74.2 && lng <= 74.5) {
        const dLat = Math.abs(lat - 31.5812);
        const dLng = Math.abs(lng - 74.3741);
        if (dLat < 0.04 && dLng < 0.04) {
            return 'Pinned Delivery Location, Baghbanpura, Lahore';
        }
        return 'Pinned Delivery Location, Lahore';
    }

    return 'Pinned Location on Map';
};

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
        e.preventDefault();
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng);
            map.flyTo(e.latlng, 16);
        });
    };

    return (
        <button
            type="button"
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}
        >
            <span>📍</span> Use My Location
        </button>
    );
};

const LocationPicker = ({ onAddressSelect }) => {
    // Default to Fine Burger & Fast Food coordinates in Baghbanpura, Lahore
    const [position, setPosition] = useState([31.5812, 74.3741]);
    const [loading, setLoading] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState('');

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    // Geolocation unavailable — silently fall back to default center
                }
            );
        }
    }, []);

    const handleLocationSelect = async (latlng) => {
        setLoading(true);
        const readableAddress = await reverseGeocodeCoordinates(latlng.lat, latlng.lng);
        setDetectedAddress(readableAddress);
        onAddressSelect(readableAddress, latlng);
        setLoading(false);
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{
                height: '280px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid var(--color-medium-gray)'
            }}>
                <MapContainer
                    center={position}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        color: 'var(--color-accent)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>⏳</span> Finding location name...
                    </div>
                )}
            </div>

            {detectedAddress && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 180, 0, 0.1)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span>📍</span>
                    <strong style={{ color: 'var(--color-white)' }}>Selected:</strong>
                    <span>{detectedAddress}</span>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
