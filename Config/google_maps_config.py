"""
Google Maps API Configuration
Manages Google Maps API settings and constants for order tracking
"""

import os
from typing import Dict, Optional

class GoogleMapsConfig:
    """Configuration for Google Maps integration"""
    
    # API Key from environment
    API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    
    # API Endpoints
    GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
    DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json'
    DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'
    PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    
    # Tracking Settings
    TRACKING_UPDATE_INTERVAL = 30  # seconds - how often to update location
    NEAR_DELIVERY_DISTANCE = 1.0   # km - distance to trigger "near delivery" notification
    AVERAGE_SPEED = 30             # km/h - average delivery vehicle speed for ETA calculation
    
    # Map Display Settings
    DEFAULT_ZOOM_LEVEL = 13
    DELIVERY_ZOOM_LEVEL = 15
    
    # Default coordinates (center of your city/region)
    DEFAULT_CENTER = {
        'lat': 4.60971,    # Bogotá, Colombia (cambiar según tu ubicación)
        'lng': -74.08175
    }
    
    # Marker Icons (can be customized)
    MARKER_ICONS = {
        'store': 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        'delivery': 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        'customer': 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    }
    
    # Status Colors for Map Display
    STATUS_COLORS = {
        'pending': '#FFA500',      # Orange
        'processing': '#2196F3',   # Blue
        'in_transit': '#4CAF50',   # Green
        'delivered': '#8BC34A',    # Light Green
        'cancelled': '#F44336'     # Red
    }
    
    # Notification Messages
    NOTIFICATION_TEMPLATES = {
        'order_confirmed': 'Tu pedido #{order_id} ha sido confirmado',
        'in_preparation': 'Tu pedido #{order_id} está siendo preparado',
        'out_for_delivery': 'Tu pedido #{order_id} está en camino',
        'near_delivery': '¡Tu pedido #{order_id} está cerca! Llegará en {minutes} minutos',
        'delivered': 'Tu pedido #{order_id} ha sido entregado',
        'location_update': 'Ubicación actualizada para el pedido #{order_id}'
    }
    
    @classmethod
    def is_configured(cls) -> bool:
        """Check if Google Maps API is properly configured"""
        return bool(cls.API_KEY and cls.API_KEY.strip())
    
    @classmethod
    def get_geocoding_params(cls, address: str) -> Dict:
        """Get parameters for Geocoding API request"""
        return {
            'address': address,
            'key': cls.API_KEY
        }
    
    @classmethod
    def get_directions_params(cls, origin: str, destination: str, mode: str = 'driving') -> Dict:
        """Get parameters for Directions API request"""
        return {
            'origin': origin,
            'destination': destination,
            'mode': mode,  # driving, walking, bicycling, transit
            'key': cls.API_KEY,
            'language': 'es'  # Spanish
        }
    
    @classmethod
    def get_distance_matrix_params(cls, origins: list, destinations: list) -> Dict:
        """Get parameters for Distance Matrix API request"""
        return {
            'origins': '|'.join(origins),
            'destinations': '|'.join(destinations),
            'mode': 'driving',
            'key': cls.API_KEY,
            'language': 'es'
        }
    
    @classmethod
    def format_latlng(cls, latitude: float, longitude: float) -> str:
        """Format latitude and longitude for API requests"""
        return f"{latitude},{longitude}"
    
    @classmethod
    def calculate_eta_minutes(cls, distance_km: float, speed_kmh: Optional[float] = None) -> int:
        """Calculate estimated time of arrival in minutes"""
        if speed_kmh is None:
            speed_kmh = cls.AVERAGE_SPEED
        
        # Time = Distance / Speed (in hours), convert to minutes
        hours = distance_km / speed_kmh
        minutes = int(hours * 60)
        return max(1, minutes)  # At least 1 minute
    
    @classmethod
    def should_notify_near_delivery(cls, distance_km: float) -> bool:
        """Check if delivery is near enough to send notification"""
        return distance_km <= cls.NEAR_DELIVERY_DISTANCE
    
    @classmethod
    def get_notification_message(cls, template_key: str, **kwargs) -> str:
        """Get formatted notification message"""
        template = cls.NOTIFICATION_TEMPLATES.get(template_key, '')
        return template.format(**kwargs)


# Create a singleton instance
google_maps_config = GoogleMapsConfig()


# Helper functions for easy access
def get_api_key() -> str:
    """Get Google Maps API key"""
    return GoogleMapsConfig.API_KEY

def is_maps_configured() -> bool:
    """Check if Google Maps is configured"""
    return GoogleMapsConfig.is_configured()

def get_tracking_interval() -> int:
    """Get tracking update interval in seconds"""
    return GoogleMapsConfig.TRACKING_UPDATE_INTERVAL
