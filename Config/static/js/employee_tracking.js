/**
 * Employee Tracking Functions
 * Gestión de rastreo de entregas para empleados
 */

let currentTrackingOrderId = null;
let locationUpdateInterval = null;

// Load tracking data
async function loadTracking() {
    try {
        // Cargar lista de pedidos que pueden ser rastreados
        const response = await fetch('/employee/orders-data');
        
        if (!response.ok) {
            throw new Error('Error al cargar datos de pedidos');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateTrackingStats(data.stats, data.orders);
            updateTrackingList(data.orders);
        }
    } catch (error) {
        console.error('Error loading tracking:', error);
        showError('Error al cargar información de rastreo');
    }
}

// Update tracking stats
function updateTrackingStats(stats, orders) {
    // Count active tracking (orders with in_transit status)
    const activeCount = orders.filter(o => o.status === 'in_transit').length;
    document.getElementById('tracking-active-count').textContent = activeCount;
    
    // Count pending shipments (shipped status)
    const pendingCount = orders.filter(o => o.status === 'shipped').length;
    document.getElementById('tracking-pending-count').textContent = pendingCount;
    
    // Count completed today (delivered today)
    const today = new Date().toDateString();
    const completedCount = orders.filter(o => {
        if (o.status === 'delivered' && o.updated_at) {
            const orderDate = new Date(o.updated_at).toDateString();
            return orderDate === today;
        }
        return false;
    }).length;
    document.getElementById('tracking-completed-count').textContent = completedCount;
    
    // Update tracking badge
    if (typeof updateBadgeById === 'function') {
        updateBadgeById('tracking-badge', activeCount);
    }
}

// Update tracking list
function updateTrackingList(orders) {
    const listContainer = document.getElementById('tracking-list');
    
    // Filter trackable orders (shipped, in_transit, delivered)
    const trackableOrders = orders.filter(o => 
        ['shipped', 'in_transit', 'delivered'].includes(o.status)
    );
    
    if (!trackableOrders || trackableOrders.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt" style="font-size: 48px; color: #cbd5e0; margin-bottom: 16px;"></i>
                <p style="color: #64748b;">No hay pedidos para rastrear</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="tracking-table">
            <thead>
                <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Dirección</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    trackableOrders.forEach(order => {
        const statusClass = getOrderStatusClass(order.status);
        const statusText = getOrderStatusText(order.status);
        const orderDate = new Date(order.created_at).toLocaleDateString('es-ES');
        
        html += `
            <tr>
                <td>#${order.order_number || order.id}</td>
                <td>${order.customer_name || 'N/A'}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${order.shipping_address || 'N/A'}</td>
                <td>${orderDate}</td>
                <td>
        `;
        
        if (order.status === 'shipped') {
            html += `
                <button class="btn btn-sm btn-primary" onclick="openTrackingModal(${order.id}, '${(order.shipping_address || '').replace(/'/g, "\\'")}')">
                    <i class="fas fa-play"></i> Iniciar Rastreo
                </button>
            `;
        } else if (order.status === 'in_transit') {
            html += `
                <button class="btn btn-sm btn-success" onclick="updateOrderLocation(${order.id})">
                    <i class="fas fa-map-marker-alt"></i> Actualizar Ubicación
                </button>
                <button class="btn btn-sm btn-info" onclick="completeDelivery(${order.id})">
                    <i class="fas fa-check"></i> Completar
                </button>
            `;
        } else if (order.status === 'delivered') {
            html += `
                <button class="btn btn-sm btn-secondary" onclick="viewOrderTracking(${order.id})">
                    <i class="fas fa-history"></i> Ver Historial
                </button>
            `;
        }
        
        html += `
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    listContainer.innerHTML = html;
}

// Filter tracking by status
function filterTracking() {
    const filterValue = document.getElementById('trackingFilterStatus').value;
    const rows = document.querySelectorAll('.tracking-table tbody tr');
    
    rows.forEach(row => {
        const statusBadge = row.querySelector('.badge');
        const status = statusBadge.textContent.toLowerCase();
        
        if (filterValue === 'all') {
            row.style.display = '';
        } else if (filterValue === 'active' && status.includes('en camino')) {
            row.style.display = '';
        } else if (filterValue === 'pending' && status.includes('enviado')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Open tracking modal
function openTrackingModal(orderId, shippingAddress) {
    currentTrackingOrderId = orderId;
    
    document.getElementById('trackingOrderId').value = orderId;
    document.getElementById('destinationAddress').value = shippingAddress || '';
    document.getElementById('driverName').value = '';
    document.getElementById('driverPhone').value = '';
    document.getElementById('vehicleInfo').value = '';
    
    document.getElementById('trackingModal').style.display = 'flex';
}

// Close tracking modal
function closeTrackingModal() {
    document.getElementById('trackingModal').style.display = 'none';
    currentTrackingOrderId = null;
}

// Handle tracking form submission
document.addEventListener('DOMContentLoaded', function() {
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        trackingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const orderId = document.getElementById('trackingOrderId').value;
            const destinationAddress = document.getElementById('destinationAddress').value;
            const driverName = document.getElementById('driverName').value;
            const driverPhone = document.getElementById('driverPhone').value;
            const vehicleInfo = document.getElementById('vehicleInfo').value;
            
            try {
                const response = await fetch(`/tracking/order/${orderId}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({
                        destination_address: destinationAddress,
                        driver_name: driverName,
                        driver_phone: driverPhone,
                        vehicle_info: vehicleInfo
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showSuccess('Rastreo iniciado correctamente');
                    closeTrackingModal();
                    loadTracking();
                } else {
                    showError(data.error || 'Error al iniciar rastreo');
                }
            } catch (error) {
                console.error('Error starting tracking:', error);
                showError('Error al iniciar rastreo');
            }
        });
    }
});

// Update order location
function updateOrderLocation(orderId) {
    currentTrackingOrderId = orderId;
    
    // Show update location modal
    const modal = document.getElementById('updateLocationModal');
    const statusDiv = document.getElementById('locationStatus');
    const infoDiv = document.getElementById('locationInfo');
    
    statusDiv.style.display = 'block';
    infoDiv.style.display = 'none';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación actual...';
    
    modal.style.display = 'flex';
    
    // Get current location using browser geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                document.getElementById('currentLat').value = lat;
                document.getElementById('currentLng').value = lng;
                
                statusDiv.style.display = 'none';
                infoDiv.style.display = 'block';
                
                showSuccess('Ubicación obtenida correctamente');
            },
            function(error) {
                statusDiv.className = 'alert alert-danger';
                statusDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al obtener ubicación: ${error.message}<br>
                    Por favor, permite el acceso a tu ubicación.
                `;
                console.error('Geolocation error:', error);
            }
        );
    } else {
        statusDiv.className = 'alert alert-danger';
        statusDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            Tu navegador no soporta geolocalización
        `;
    }
}

// Close update location modal
function closeUpdateLocationModal() {
    document.getElementById('updateLocationModal').style.display = 'none';
    currentTrackingOrderId = null;
}

// Confirm update location
async function confirmUpdateLocation() {
    const lat = document.getElementById('currentLat').value;
    const lng = document.getElementById('currentLng').value;
    
    if (!lat || !lng || !currentTrackingOrderId) {
        showError('Ubicación no disponible');
        return;
    }
    
    try {
        const response = await fetch(`/tracking/order/${currentTrackingOrderId}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Ubicación actualizada correctamente');
            closeUpdateLocationModal();
            loadTracking();
        } else {
            showError(data.error || 'Error al actualizar ubicación');
        }
    } catch (error) {
        console.error('Error updating location:', error);
        showError('Error al actualizar ubicación');
    }
}

// Complete delivery
async function completeDelivery(orderId) {
    if (!confirm('¿Confirmar que el pedido ha sido entregado?')) {
        return;
    }
    
    try {
        const response = await fetch(`/tracking/order/${orderId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Entrega completada correctamente');
            loadTracking();
        } else {
            showError(data.error || 'Error al completar entrega');
        }
    } catch (error) {
        console.error('Error completing delivery:', error);
        showError('Error al completar entrega');
    }
}

// View order tracking history
async function viewOrderTracking(orderId) {
    try {
        const response = await fetch(`/tracking/order/${orderId}/history`);
        const data = await response.json();
        
        if (response.ok) {
            showTrackingHistoryModal(orderId, data.history);
        } else {
            showError('Error al cargar historial');
        }
    } catch (error) {
        console.error('Error loading tracking history:', error);
        showError('Error al cargar historial');
    }
}

// Show tracking history modal
function showTrackingHistoryModal(orderId, history) {
    const modal = document.getElementById('orderModal');
    const modalTitle = document.getElementById('orderModalTitle');
    const modalBody = document.getElementById('orderModalBody');
    
    modalTitle.textContent = `Historial de Rastreo - Pedido #${orderId}`;
    
    let html = '<div class="tracking-history">';
    
    if (!history || history.length === 0) {
        html += '<p>No hay historial disponible</p>';
    } else {
        history.forEach(item => {
            const date = new Date(item.created_at).toLocaleString('es-ES');
            html += `
                <div class="history-item">
                    <div class="history-status"><strong>${getOrderStatusText(item.status)}</strong></div>
                    <div class="history-time">${date}</div>
                    ${item.notes ? `<div class="history-notes">${item.notes}</div>` : ''}
                    ${item.address ? `<div class="history-location"><i class="fas fa-map-pin"></i> ${item.address}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += '</div>';
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
}

// Helper functions for tracking
function getOrderStatusClass(status) {
    const classes = {
        'pending': 'badge-warning',
        'shipped': 'badge-info',
        'in_transit': 'badge-primary',
        'delivered': 'badge-success',
        'cancelled': 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
}

function getOrderStatusText(status) {
    const texts = {
        'pending': 'Pendiente',
        'processing': 'En Preparación',
        'shipped': 'Enviado',
        'in_transit': 'En Camino',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return texts[status] || status;
}
