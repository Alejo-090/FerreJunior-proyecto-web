/**
 * Client Order Tracking with Google Maps
 * Real-time delivery tracking for customers
 */

let map;
let markers = {
    current: null,
    destination: null
};
let routePolyline = null;
let trackingData = null;
let updateInterval = null;
let updateCounter = 0;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadTrackingData();
    startAutoUpdate();
});

/**
 * Initialize Google Maps
 */
function initMap() {
    // Default center (Bogotá)
    const defaultCenter = { lat: 4.60971, lng: -74.08175 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
}

/**
 * Load tracking data from API
 */
async function loadTrackingData() {
    try {
        const response = await fetch(`/tracking/order/${ORDER_ID}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar datos de rastreo');
        }
        
        const data = await response.json();
        
        // Check if tracking is available
        if (!data.has_tracking || !data.tracking) {
            showNoTrackingMessage();
            return;
        }
        
        trackingData = data.tracking;
        
        updateMap();
        updateDriverInfo();
        updateETA();
        loadHistory();
        updateCounter++;
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Error loading tracking:', error);
        showNoTrackingMessage();
    }
}

/**
 * Update map with current location and route
 */
function updateMap() {
    if (!trackingData) return;
    
    // Clear existing markers and route
    clearMapElements();
    
    const hasCurrentLocation = trackingData.current_location && 
                               trackingData.current_location.latitude && 
                               trackingData.current_location.longitude;
    const hasDestination = trackingData.destination && 
                          trackingData.destination.latitude && 
                          trackingData.destination.longitude;
    
    // Add destination marker
    if (hasDestination) {
        markers.destination = new google.maps.Marker({
            position: {
                lat: trackingData.destination.latitude,
                lng: trackingData.destination.longitude
            },
            map: map,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'Destino',
            animation: google.maps.Animation.DROP
        });
        
        // Info window for destination
        const destInfoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px;">
                <strong>Destino</strong><br>
                ${trackingData.destination.address || 'Tu dirección de entrega'}
            </div>`
        });
        
        markers.destination.addListener('click', () => {
            destInfoWindow.open(map, markers.destination);
        });
    }
    
    // Add current location marker (delivery vehicle)
    if (hasCurrentLocation) {
        markers.current = new google.maps.Marker({
            position: {
                lat: trackingData.current_location.latitude,
                lng: trackingData.current_location.longitude
            },
            map: map,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'Conductor',
            animation: google.maps.Animation.BOUNCE,
            zIndex: 1000
        });
        
        // Info window for current location
        const currentInfoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px;">
                <strong>${trackingData.driver.name || 'Conductor'}</strong><br>
                ${trackingData.current_location.address || 'Ubicación actual'}
            </div>`
        });
        
        markers.current.addListener('click', () => {
            currentInfoWindow.open(map, markers.current);
        });
        
        // Stop bounce after 3 seconds
        setTimeout(() => {
            if (markers.current) {
                markers.current.setAnimation(null);
            }
        }, 3000);
    }
    
    // Draw route if both locations exist
    if (hasCurrentLocation && hasDestination) {
        drawRoute();
    }
    
    // Fit map to show all markers
    fitMapToMarkers();
}

/**
 * Draw route between current location and destination
 */
async function drawRoute() {
    try {
        const response = await fetch(`/tracking/order/${ORDER_ID}/route`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        const route = data.route;
        
        // Decode polyline
        const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline);
        
        // Draw polyline
        routePolyline = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: '#4285F4',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: map
        });
        
    } catch (error) {
        console.error('Error drawing route:', error);
    }
}

/**
 * Clear all map elements (markers and routes)
 */
function clearMapElements() {
    if (markers.current) {
        markers.current.setMap(null);
        markers.current = null;
    }
    if (markers.destination) {
        markers.destination.setMap(null);
        markers.destination = null;
    }
    if (routePolyline) {
        routePolyline.setMap(null);
        routePolyline = null;
    }
}

/**
 * Fit map to show all markers
 */
function fitMapToMarkers() {
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    if (markers.current) {
        bounds.extend(markers.current.getPosition());
        hasMarkers = true;
    }
    if (markers.destination) {
        bounds.extend(markers.destination.getPosition());
        hasMarkers = true;
    }
    
    if (hasMarkers) {
        map.fitBounds(bounds);
        
        // Don't zoom in too much
        google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
            if (map.getZoom() > 15) {
                map.setZoom(15);
            }
        });
    }
}

/**
 * Update driver information
 */
function updateDriverInfo() {
    const driverInfoDiv = document.getElementById('driverInfo');
    
    if (!trackingData || !trackingData.driver || !trackingData.driver.name) {
        driverInfoDiv.innerHTML = `
            <div class="no-driver-info">
                <i class="fas fa-info-circle"></i>
                <p>Información del conductor no disponible aún</p>
            </div>
        `;
        return;
    }
    
    driverInfoDiv.innerHTML = `
        <div class="driver-details">
            <div class="driver-item">
                <i class="fas fa-user"></i>
                <div>
                    <div class="driver-label">Nombre</div>
                    <div class="driver-value">${trackingData.driver.name}</div>
                </div>
            </div>
            ${trackingData.driver.phone ? `
                <div class="driver-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <div class="driver-label">Teléfono</div>
                        <div class="driver-value">
                            <a href="tel:${trackingData.driver.phone}">${trackingData.driver.phone}</a>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${trackingData.driver.vehicle ? `
                <div class="driver-item">
                    <i class="fas fa-motorcycle"></i>
                    <div>
                        <div class="driver-label">Vehículo</div>
                        <div class="driver-value">${trackingData.driver.vehicle}</div>
                    </div>
                </div>
            ` : ''}
            ${trackingData.current_location && trackingData.current_location.address ? `
                <div class="driver-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <div class="driver-label">Ubicación Actual</div>
                        <div class="driver-value">${trackingData.current_location.address}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Update ETA information
 */
function updateETA() {
    const etaTimeDiv = document.getElementById('etaTime');
    const etaDistanceDiv = document.getElementById('etaDistance');
    
    if (!trackingData || !trackingData.estimates || !trackingData.estimates.distance_km) {
        etaTimeDiv.textContent = 'No disponible';
        etaDistanceDiv.textContent = 'Calculando ruta...';
        return;
    }
    
    // Format ETA
    if (trackingData.estimates.time_minutes) {
        const minutes = Math.round(trackingData.estimates.time_minutes);
        if (minutes < 60) {
            etaTimeDiv.textContent = `${minutes} minutos`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            etaTimeDiv.textContent = `${hours}h ${mins}m`;
        }
    } else {
        etaTimeDiv.textContent = 'Calculando...';
    }
    
    // Format distance
    const distance = trackingData.estimates.distance_km;
    if (distance < 1) {
        etaDistanceDiv.textContent = `${(distance * 1000).toFixed(0)} metros restantes`;
    } else {
        etaDistanceDiv.textContent = `${distance.toFixed(1)} km restantes`;
    }
    
    // Check if near delivery
    if (distance < 1) {
        document.getElementById('etaCard').classList.add('near-delivery');
    }
}

/**
 * Load order history
 */
async function loadHistory() {
    try {
        const response = await fetch(`/tracking/order/${ORDER_ID}/history`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        const history = data.history;
        
        const timelineDiv = document.getElementById('statusTimeline');
        
        if (!history || history.length === 0) {
            timelineDiv.innerHTML = '<p class="no-history">No hay historial disponible</p>';
            return;
        }
        
        let timelineHTML = '';
        
        history.forEach((item, index) => {
            const isActive = index === 0;
            const statusIcons = {
                'pending': 'fas fa-clock',
                'processing': 'fas fa-cog',
                'in_transit': 'fas fa-shipping-fast',
                'delivered': 'fas fa-check-circle',
                'cancelled': 'fas fa-times-circle'
            };
            
            const icon = statusIcons[item.status] || 'fas fa-circle';
            const time = new Date(item.created_at).toLocaleString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            timelineHTML += `
                <div class="timeline-item ${isActive ? 'active' : ''}">
                    <div class="timeline-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-status">${getStatusLabel(item.status)}</div>
                        ${item.notes ? `<div class="timeline-notes">${item.notes}</div>` : ''}
                        <div class="timeline-time">${time}</div>
                        ${item.address ? `<div class="timeline-location"><i class="fas fa-map-pin"></i> ${item.address}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        timelineDiv.innerHTML = timelineHTML;
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status) {
    const labels = {
        'pending': 'Pendiente',
        'processing': 'En preparación',
        'in_transit': 'En camino',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

/**
 * Show message when no tracking is available
 */
function showNoTrackingMessage() {
    document.querySelector('.map-section').innerHTML = `
        <div class="no-tracking-message">
            <i class="fas fa-info-circle"></i>
            <h3>Rastreo no disponible</h3>
            <p>El rastreo de este pedido aún no ha sido iniciado.</p>
            <p>Te notificaremos cuando tu pedido esté en camino.</p>
        </div>
    `;
    
    document.getElementById('driverInfo').innerHTML = `
        <div class="no-driver-info">
            <p>El rastreo se activará cuando tu pedido esté en camino</p>
        </div>
    `;
}

/**
 * Start auto-update
 */
function startAutoUpdate() {
    // Update every 30 seconds
    updateInterval = setInterval(() => {
        loadTrackingData();
    }, 30000);
}

/**
 * Stop auto-update
 */
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
    const lastUpdateSpan = document.getElementById('lastUpdate');
    const now = new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdateSpan.textContent = `Última actualización: ${now}`;
}

/**
 * Show error message
 */
function showError(message) {
    // You can implement a toast notification here
    console.error(message);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopAutoUpdate();
});
