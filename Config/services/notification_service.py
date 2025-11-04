"""
Notification Service
Manages order notifications for tracking updates
"""

from datetime import datetime
from typing import Optional
from Config.db import db
from Config.models.order_tracking import OrderNotification
from Config.google_maps_config import GoogleMapsConfig


class NotificationService:
    """Service for managing order notifications"""
    
    @staticmethod
    def create_notification(user_id: int, order_id: int, 
                          notification_type: str, **kwargs) -> Optional[OrderNotification]:
        """
        Create a new notification for a user
        
        Args:
            user_id: ID of the user to notify
            order_id: ID of the order
            notification_type: Type of notification (see GoogleMapsConfig.NOTIFICATION_TEMPLATES)
            **kwargs: Additional parameters for message template
            
        Returns:
            Created notification or None if error
        """
        try:
            # Get message template
            message = GoogleMapsConfig.get_notification_message(
                notification_type,
                order_id=order_id,
                **kwargs
            )
            
            if not message:
                message = f"Actualización del pedido #{order_id}"
            
            # Create notification
            notification = OrderNotification(
                user_id=user_id,
                order_id=order_id,
                message=message,
                notification_type=notification_type,
                is_read=False
            )
            
            db.session.add(notification)
            db.session.commit()
            
            return notification
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating notification: {str(e)}")
            return None
    
    @staticmethod
    def notify_order_confirmed(user_id: int, order_id: int) -> Optional[OrderNotification]:
        """Notify user that order was confirmed"""
        return NotificationService.create_notification(
            user_id, order_id, 'order_confirmed'
        )
    
    @staticmethod
    def notify_in_preparation(user_id: int, order_id: int) -> Optional[OrderNotification]:
        """Notify user that order is being prepared"""
        return NotificationService.create_notification(
            user_id, order_id, 'in_preparation'
        )
    
    @staticmethod
    def notify_out_for_delivery(user_id: int, order_id: int) -> Optional[OrderNotification]:
        """Notify user that order is out for delivery"""
        return NotificationService.create_notification(
            user_id, order_id, 'out_for_delivery'
        )
    
    @staticmethod
    def notify_near_delivery(user_id: int, order_id: int, minutes: int) -> Optional[OrderNotification]:
        """Notify user that delivery is near"""
        return NotificationService.create_notification(
            user_id, order_id, 'near_delivery', minutes=minutes
        )
    
    @staticmethod
    def notify_delivered(user_id: int, order_id: int) -> Optional[OrderNotification]:
        """Notify user that order was delivered"""
        return NotificationService.create_notification(
            user_id, order_id, 'delivered'
        )
    
    @staticmethod
    def notify_location_update(user_id: int, order_id: int) -> Optional[OrderNotification]:
        """Notify user about location update"""
        return NotificationService.create_notification(
            user_id, order_id, 'location_update'
        )
    
    @staticmethod
    def get_user_notifications(user_id: int, unread_only: bool = False, 
                              limit: int = 50) -> list:
        """
        Get notifications for a user
        
        Args:
            user_id: ID of the user
            unread_only: If True, only return unread notifications
            limit: Maximum number of notifications to return
            
        Returns:
            List of notifications
        """
        try:
            query = OrderNotification.query.filter_by(user_id=user_id)
            
            if unread_only:
                query = query.filter_by(is_read=False)
            
            notifications = query.order_by(
                OrderNotification.created_at.desc()
            ).limit(limit).all()
            
            return notifications
            
        except Exception as e:
            print(f"Error getting notifications: {str(e)}")
            return []
    
    @staticmethod
    def get_order_notifications(order_id: int) -> list:
        """
        Get all notifications for a specific order
        
        Args:
            order_id: ID of the order
            
        Returns:
            List of notifications
        """
        try:
            notifications = OrderNotification.query.filter_by(
                order_id=order_id
            ).order_by(OrderNotification.created_at.desc()).all()
            
            return notifications
            
        except Exception as e:
            print(f"Error getting order notifications: {str(e)}")
            return []
    
    @staticmethod
    def mark_as_read(notification_id: int) -> bool:
        """
        Mark a notification as read
        
        Args:
            notification_id: ID of the notification
            
        Returns:
            True if successful, False otherwise
        """
        try:
            notification = OrderNotification.query.get(notification_id)
            
            if notification:
                notification.is_read = True
                db.session.commit()
                return True
            
            return False
            
        except Exception as e:
            db.session.rollback()
            print(f"Error marking notification as read: {str(e)}")
            return False
    
    @staticmethod
    def mark_all_as_read(user_id: int, order_id: Optional[int] = None) -> bool:
        """
        Mark all notifications as read for a user
        
        Args:
            user_id: ID of the user
            order_id: Optional order ID to filter notifications
            
        Returns:
            True if successful, False otherwise
        """
        try:
            query = OrderNotification.query.filter_by(user_id=user_id, is_read=False)
            
            if order_id:
                query = query.filter_by(order_id=order_id)
            
            notifications = query.all()
            
            for notification in notifications:
                notification.is_read = True
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"Error marking notifications as read: {str(e)}")
            return False
    
    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """
        Get count of unread notifications for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            Count of unread notifications
        """
        try:
            count = OrderNotification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).count()
            
            return count
            
        except Exception as e:
            print(f"Error getting unread count: {str(e)}")
            return 0
    
    @staticmethod
    def delete_notification(notification_id: int) -> bool:
        """
        Delete a notification
        
        Args:
            notification_id: ID of the notification
            
        Returns:
            True if successful, False otherwise
        """
        try:
            notification = OrderNotification.query.get(notification_id)
            
            if notification:
                db.session.delete(notification)
                db.session.commit()
                return True
            
            return False
            
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting notification: {str(e)}")
            return False


# Singleton instance
notification_service = NotificationService()
