"""
Tracking Routes
Endpoints for order tracking with Google Maps integration
"""

from flask import jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from Config.blueprints.tracking import tracking_bp
from Config.db import db
from Config.models.order import Order
from Config.models.order_tracking import OrderStatusHistory, DeliveryTracking, OrderNotification
from Config.services.google_maps_service import google_maps_service
from Config.services.notification_service import notification_service
from Config.decorators import admin_required, employee_required


@tracking_bp.route('/order/<int:order_id>/start', methods=['POST'])
@login_required
@employee_required
def start_tracking(order_id):
    """
    Start tracking for an order
    
    Request JSON:
    {
        "destination_address": "Calle 123, Bogotá",
        "driver_id": 5,
        "driver_name": "Juan Pérez",
        "driver_phone": "3001234567",
        "vehicle_info": "Moto - ABC123"
    }
    """
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        data = request.get_json()
        destination_address = data.get('destination_address')
        
        if not destination_address:
            return jsonify({'error': 'Dirección de destino requerida'}), 400
        
        # Geocode destination address
        dest_coords = google_maps_service.geocode_address(destination_address)
        if not dest_coords:
            return jsonify({'error': 'No se pudo geocodificar la dirección'}), 400
        
        # Check if tracking already exists
        existing_tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        
        if existing_tracking:
            # Update existing tracking
            tracking = existing_tracking
            tracking.is_active = True
        else:
            # Create new tracking
            tracking = DeliveryTracking(order_id=order_id)
            db.session.add(tracking)
        
        # Set destination
        tracking.destination_latitude = dest_coords['latitude']
        tracking.destination_longitude = dest_coords['longitude']
        tracking.destination_address = dest_coords['formatted_address']
        
        # Set driver info
        tracking.driver_id = data.get('driver_id')
        tracking.driver_name = data.get('driver_name')
        tracking.driver_phone = data.get('driver_phone')
        tracking.vehicle_info = data.get('vehicle_info')
        
        # Create status history entry
        status_history = OrderStatusHistory(
            order_id=order_id,
            status='in_transit',
            changed_by=current_user.id,
            notes='Pedido en camino'
        )
        db.session.add(status_history)
        
        # Update order status
        order.status = 'in_transit'
        
        db.session.commit()
        
        # Send notification
        notification_service.notify_out_for_delivery(order.user_id, order_id)
        
        return jsonify({
            'message': 'Rastreo iniciado exitosamente',
            'tracking': tracking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>/location', methods=['PUT'])
@login_required
@employee_required
def update_location(order_id):
    """
    Update current delivery location
    
    Request JSON:
    {
        "latitude": 4.6097,
        "longitude": -74.0817
    }
    """
    try:
        tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        if not tracking:
            return jsonify({'error': 'Rastreo no encontrado'}), 404
        
        if not tracking.is_active:
            return jsonify({'error': 'Rastreo no está activo'}), 400
        
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({'error': 'Coordenadas requeridas'}), 400
        
        # Update current location
        tracking.current_latitude = latitude
        tracking.current_longitude = longitude
        
        # Reverse geocode to get address
        address = google_maps_service.reverse_geocode(latitude, longitude)
        if address:
            tracking.current_address = address
        
        # Calculate distance and time to destination
        if tracking.destination_latitude and tracking.destination_longitude:
            distance_data = google_maps_service.calculate_distance_and_time(
                latitude, longitude,
                tracking.destination_latitude, tracking.destination_longitude
            )
            
            if distance_data:
                tracking.distance_km = distance_data['distance_km']
                tracking.time_minutes = int(distance_data['duration_minutes'])
                tracking.eta = google_maps_service.calculate_eta(
                    distance_data['distance_km']
                )
                
                # Check if near delivery
                if google_maps_service.is_near_delivery(distance_data['distance_km']):
                    order = Order.query.get(order_id)
                    if order:
                        notification_service.notify_near_delivery(
                            order.user_id, 
                            order_id, 
                            int(distance_data['duration_minutes'])
                        )
        
        tracking.last_updated = datetime.now()
        
        # Add to status history
        status_history = OrderStatusHistory(
            order_id=order_id,
            status='in_transit',
            changed_by=current_user.id,
            latitude=latitude,
            longitude=longitude,
            address=tracking.current_address,
            notes='Ubicación actualizada'
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ubicación actualizada',
            'tracking': tracking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>', methods=['GET'])
@login_required
def get_tracking(order_id):
    """Get tracking information for an order"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Check permissions
        if not (current_user.role in ['admin', 'employee'] or order.user_id == current_user.id):
            return jsonify({'error': 'No autorizado'}), 403
        
        tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        
        if not tracking or not tracking.is_active:
            return jsonify({
                'has_tracking': False,
                'message': 'No hay información de rastreo disponible',
                'order': {
                    'id': order.id,
                    'status': order.status,
                    'total': float(order.total_amount) if order.total_amount else 0
                }
            }), 200
        
        return jsonify({
            'has_tracking': True,
            'tracking': tracking.to_dict(),
            'order': {
                'id': order.id,
                'status': order.status,
                'total': float(order.total_amount) if order.total_amount else 0
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_tracking: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>/route', methods=['GET'])
@login_required
def get_route(order_id):
    """Get route information with polyline for map visualization"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Check permissions
        if not (current_user.role in ['admin', 'employee'] or order.user_id == current_user.id):
            return jsonify({'error': 'No autorizado'}), 403
        
        tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        
        if not tracking:
            return jsonify({'error': 'No hay información de rastreo'}), 404
        
        # Check if we have both current location and destination
        if not (tracking.current_latitude and tracking.destination_latitude):
            return jsonify({'error': 'Información de ubicación incompleta'}), 400
        
        # Calculate full route
        route_data = google_maps_service.calculate_route(
            tracking.current_latitude, tracking.current_longitude,
            tracking.destination_latitude, tracking.destination_longitude
        )
        
        if not route_data:
            return jsonify({'error': 'No se pudo calcular la ruta'}), 500
        
        return jsonify({
            'route': route_data,
            'current_location': {
                'latitude': tracking.current_latitude,
                'longitude': tracking.current_longitude,
                'address': tracking.current_address
            },
            'destination': {
                'latitude': tracking.destination_latitude,
                'longitude': tracking.destination_longitude,
                'address': tracking.destination_address
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>/history', methods=['GET'])
@login_required
def get_tracking_history(order_id):
    """Get tracking history for an order"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Check permissions
        if not (current_user.role in ['admin', 'employee'] or order.user_id == current_user.id):
            return jsonify({'error': 'No autorizado'}), 403
        
        history = OrderStatusHistory.query.filter_by(
            order_id=order_id
        ).order_by(OrderStatusHistory.created_at.desc()).all()
        
        return jsonify({
            'history': [h.to_dict() for h in history]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>/complete', methods=['POST'])
@login_required
@employee_required
def complete_delivery(order_id):
    """Mark delivery as completed"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        
        if tracking:
            tracking.is_active = False
        
        # Update order status
        order.status = 'delivered'
        
        # Create status history
        status_history = OrderStatusHistory(
            order_id=order_id,
            status='delivered',
            changed_by=current_user.id,
            notes='Pedido entregado'
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        # Send notification
        notification_service.notify_delivered(order.user_id, order_id)
        
        return jsonify({
            'message': 'Entrega completada',
            'order': {
                'id': order.id,
                'status': order.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/order/<int:order_id>/cancel', methods=['POST'])
@login_required
@employee_required
def cancel_tracking(order_id):
    """Cancel active tracking"""
    try:
        tracking = DeliveryTracking.query.filter_by(order_id=order_id).first()
        
        if not tracking:
            return jsonify({'error': 'Rastreo no encontrado'}), 404
        
        tracking.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Rastreo cancelado'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Notification endpoints
@tracking_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get notifications for current user"""
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        notifications = notification_service.get_user_notifications(
            current_user.id,
            unread_only=unread_only,
            limit=limit
        )
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'unread_count': notification_service.get_unread_count(current_user.id)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        notification = OrderNotification.query.get(notification_id)
        
        if not notification:
            return jsonify({'error': 'Notificación no encontrada'}), 404
        
        if notification.user_id != current_user.id:
            return jsonify({'error': 'No autorizado'}), 403
        
        success = notification_service.mark_as_read(notification_id)
        
        if success:
            return jsonify({'message': 'Notificación marcada como leída'}), 200
        else:
            return jsonify({'error': 'Error al marcar notificación'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tracking_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        order_id = request.args.get('order_id', type=int)
        
        success = notification_service.mark_all_as_read(
            current_user.id,
            order_id=order_id
        )
        
        if success:
            return jsonify({'message': 'Notificaciones marcadas como leídas'}), 200
        else:
            return jsonify({'error': 'Error al marcar notificaciones'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
