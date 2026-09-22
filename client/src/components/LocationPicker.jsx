import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Modern animated gold pin marker for restaurant delivery
const DeliveryPinIcon = L.divIcon({
    className: 'custom-delivery-pin',
    html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 180, 0, 0.3); animation: pulsePin 1.8s infinite;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: #FFB400; transform: rotate(-45deg); border: 2px solid #000; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; margin-top: -6px;">
                <span style="transform: rotate(45deg); font-size: 12px; font-weight: 900; color: #000;">🍔</span>
            </div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36]
});

// Reverse geocode lat/lng to a clean, human-readable address
export const reverseGeocodeCoordinates = async (lat, lng) => {
    // 1. Try Nominatim (OpenStreetMap)
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
                const city = a.city || a.town || 'Lahore';
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
        console.warn('Nominatim geocode warning:', err);
    }

    // 2. Try BigDataCloud Client API
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
                    .filter(n => n && !['Pakistan', 'Punjab', 'Asia', 'Lahore Division'].includes(n));
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
        console.warn('BigDataCloud geocode warning:', err);
    }

    // 3. Intelligent localized fallback
    if (lat >= 31.4 && lat <= 31.7 && lng >= 74.2 && lng <= 74.5) {
        const dLat = Math.abs(lat - 31.5812);
        const dLng = Math.abs(lng - 74.3741);
        if (dLat < 0.04 && dLng < 0.04) {
            return 'Pinned Delivery Location, Baghbanpura, Lahore';
        }
        return 'Pinned Delivery Location, Lahore';
    }

    return 'Pinned GPS Location on Map';
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
            map.flyTo(position, map.getZoom(), { duration: 0.8 });
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} icon={DeliveryPinIcon} />
    );
};

// "Locate Me" Button with live GPS
const LocateControl = ({ setPosition, onLocationSelect, setLoading }) => {
    const map = useMap();

    const handleLocate = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.geolocation) {
            if (setLoading) setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(latlng);
                    onLocationSelect(latlng);
                    map.flyTo([latlng.lat, latlng.lng], 16, { duration: 1.2 });
                },
                (err) => {
                    console.warn('Geolocation denied or unavailable:', err);
                    if (setLoading) setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            console.warn('Geolocation is not supported by this browser.');
            if (setLoading) setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleLocate}
            style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 1000,
                padding: '8px 14px',
                backgroundColor: 'var(--color-accent, #FFB400)',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}
        >
            <span>🎯</span>
            <span>Locate My GPS</span>
        </button>
    );
};

const LocationPicker = ({ onAddressSelect }) => {
    // Default center: Fine Burger & Fast Food, Baghbanpura, Lahore
    const [position, setPosition] = useState({ lat: 31.5812, lng: 74.3741 });
    const [loading, setLoading] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState('');
    const [pinnedCoords, setPinnedCoords] = useState(null);

    const handleLocationSelect = async (latlng) => {
        setLoading(true);
        setPinnedCoords(latlng);
        const readableAddress = await reverseGeocodeCoordinates(latlng.lat, latlng.lng);
        setDetectedAddress(readableAddress);
        if (onAddressSelect) {
            onAddressSelect(readableAddress, latlng);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(latlng);
                    handleLocationSelect(latlng);
                },
                () => {},
                { timeout: 5000 }
            );
        }
    }, []);

    return (
        <div style={{ width: '100%', marginBottom: '14px' }}>
            <div style={{
                height: '240px',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid rgba(255, 180, 0, 0.3)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}>
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
                >
                    {/* CartoDB Voyager Clean High-DPI Map Tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        maxZoom={19}
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onLocationSelect={handleLocationSelect}
                    />
                    <LocateControl
                        setPosition={setPosition}
                        onLocationSelect={handleLocationSelect}
                        setLoading={setLoading}
                    />
                </MapContainer>

                {/* Helpful Instruction Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    zIndex: 1000,
                    backgroundColor: 'rgba(12, 14, 20, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#f8fafc',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none'
                }}>
                    👆 Tap map to place exact delivery pin
                </div>

                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 1000,
                        backgroundColor: 'rgba(12, 14, 20, 0.9)',
                        color: 'var(--color-accent, #FFB400)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        border: '1px solid var(--color-accent)'
                    }}>
                        ⏳ Getting street details...
                    </div>
                )}
            </div>

            {/* Pinned Coordinates & Street Banner */}
            {pinnedCoords && (
                <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 700 }}>
                            ✓ Pin Saved for Rider Navigation
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-accent, #FFB400)', fontWeight: 700 }}>
                            {pinnedCoords.lat.toFixed(5)}, {pinnedCoords.lng.toFixed(5)}
                        </span>
                    </div>
                    {detectedAddress && (
                        <div style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: 1.3 }}>
                            {detectedAddress}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
