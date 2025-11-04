"""
Google Maps Service
Provides integration with Google Maps APIs for order tracking
"""

import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from Config.google_maps_config import GoogleMapsConfig


class GoogleMapsService:
    """Service for interacting with Google Maps APIs"""
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Dict]:
        """
        Convert an address to latitude and longitude coordinates
        
        Args:
            address: Street address to geocode
            
        Returns:
            Dict with 'latitude', 'longitude', 'formatted_address' or None if error
        """
        try:
            params = GoogleMapsConfig.get_geocoding_params(address)
            response = requests.get(
                GoogleMapsConfig.GEOCODING_API_URL, 
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and len(data['results']) > 0:
                    result = data['results'][0]
                    location = result['geometry']['location']
                    
                    return {
                        'latitude': location['lat'],
                        'longitude': location['lng'],
                        'formatted_address': result['formatted_address']
                    }
            
            return None
            
        except Exception as e:
            print(f"Error geocoding address: {str(e)}")
            return None
    
    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
        """
        Convert coordinates to a formatted address
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Formatted address string or None if error
        """
        try:
            params = {
                'latlng': f"{latitude},{longitude}",
                'key': GoogleMapsConfig.API_KEY,
                'language': 'es'
            }
            
            response = requests.get(
                GoogleMapsConfig.GEOCODING_API_URL,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and len(data['results']) > 0:
                    return data['results'][0]['formatted_address']
            
            return None
            
        except Exception as e:
            print(f"Error reverse geocoding: {str(e)}")
            return None
    
    @staticmethod
    def calculate_route(origin_lat: float, origin_lng: float, 
                       dest_lat: float, dest_lng: float) -> Optional[Dict]:
        """
        Calculate route between two points
        
        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            dest_lat: Destination latitude
            dest_lng: Destination longitude
            
        Returns:
            Dict with route information or None if error
        """
        try:
            origin = GoogleMapsConfig.format_latlng(origin_lat, origin_lng)
            destination = GoogleMapsConfig.format_latlng(dest_lat, dest_lng)
            
            params = GoogleMapsConfig.get_directions_params(origin, destination)
            response = requests.get(
                GoogleMapsConfig.DIRECTIONS_API_URL,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and len(data['routes']) > 0:
                    route = data['routes'][0]
                    leg = route['legs'][0]
                    
                    return {
                        'distance_meters': leg['distance']['value'],
                        'distance_km': leg['distance']['value'] / 1000,
                        'distance_text': leg['distance']['text'],
                        'duration_seconds': leg['duration']['value'],
                        'duration_minutes': leg['duration']['value'] / 60,
                        'duration_text': leg['duration']['text'],
                        'start_address': leg['start_address'],
                        'end_address': leg['end_address'],
                        'polyline': route['overview_polyline']['points'],
                        'steps': [
                            {
                                'instruction': step['html_instructions'],
                                'distance': step['distance']['text'],
                                'duration': step['duration']['text']
                            }
                            for step in leg['steps']
                        ]
                    }
            
            return None
            
        except Exception as e:
            print(f"Error calculating route: {str(e)}")
            return None
    
    @staticmethod
    def calculate_distance_and_time(origin_lat: float, origin_lng: float,
                                   dest_lat: float, dest_lng: float) -> Optional[Dict]:
        """
        Calculate distance and time between two points (faster than full route)
        
        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            dest_lat: Destination latitude
            dest_lng: Destination longitude
            
        Returns:
            Dict with distance and duration or None if error
        """
        try:
            origin = GoogleMapsConfig.format_latlng(origin_lat, origin_lng)
            destination = GoogleMapsConfig.format_latlng(dest_lat, dest_lng)
            
            params = GoogleMapsConfig.get_distance_matrix_params([origin], [destination])
            response = requests.get(
                GoogleMapsConfig.DISTANCE_MATRIX_API_URL,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK':
                    element = data['rows'][0]['elements'][0]
                    
                    if element['status'] == 'OK':
                        return {
                            'distance_meters': element['distance']['value'],
                            'distance_km': element['distance']['value'] / 1000,
                            'distance_text': element['distance']['text'],
                            'duration_seconds': element['duration']['value'],
                            'duration_minutes': element['duration']['value'] / 60,
                            'duration_text': element['duration']['text']
                        }
            
            return None
            
        except Exception as e:
            print(f"Error calculating distance: {str(e)}")
            return None
    
    @staticmethod
    def calculate_eta(distance_km: float, current_time: Optional[datetime] = None) -> datetime:
        """
        Calculate estimated time of arrival based on distance
        
        Args:
            distance_km: Distance in kilometers
            current_time: Current time (defaults to now)
            
        Returns:
            Estimated arrival datetime
        """
        if current_time is None:
            current_time = datetime.now()
        
        minutes = GoogleMapsConfig.calculate_eta_minutes(distance_km)
        return current_time + timedelta(minutes=minutes)
    
    @staticmethod
    def is_near_delivery(distance_km: float) -> bool:
        """
        Check if delivery is near (within notification threshold)
        
        Args:
            distance_km: Current distance to destination
            
        Returns:
            True if near enough to notify customer
        """
        return GoogleMapsConfig.should_notify_near_delivery(distance_km)
    
    @staticmethod
    def get_route_polyline(origin_lat: float, origin_lng: float,
                          dest_lat: float, dest_lng: float) -> Optional[str]:
        """
        Get encoded polyline string for route visualization
        
        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            dest_lat: Destination latitude
            dest_lng: Destination longitude
            
        Returns:
            Encoded polyline string or None if error
        """
        route_data = GoogleMapsService.calculate_route(
            origin_lat, origin_lng, dest_lat, dest_lng
        )
        
        if route_data:
            return route_data.get('polyline')
        
        return None


# Singleton instance
google_maps_service = GoogleMapsService()
