let orderData = null;

// Formatear moneda en pesos colombianos
function formatCOP(amount) {
    // Convertir a entero para eliminar decimales
    const intAmount = Math.round(amount || 0);
    // Formatear con separadores de miles
    return '$' + intAmount.toLocaleString('es-CO');
}

// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    const button = document.querySelector('.user-menu-btn');
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        // Calcular posición del botón
        const rect = button.getBoundingClientRect();
        
        // Posicionar el menú justo debajo del botón
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.right - 180) + 'px'; // 180px es el min-width del menú
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

// Load order details
async function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = window.location.pathname.split('/').pop();

    if (!orderId) {
        showError('ID de pedido no encontrado');
        return;
    }

    try {
        const response = await fetch(`/client/order/${orderId}/data`);
        const data = await response.json();

        if (data.success) {
            orderData = data;
            renderOrderDetail(data.order, data.items);
        } else {
            showError(data.error || 'Error al cargar los detalles del pedido');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Error de conexión al cargar los detalles del pedido');
    }
}

function renderOrderDetail(order, items) {
    const container = document.getElementById('order-detail-container');

    const statusClass = getStatusClass(order.status);
    const statusText = order.status_display;
    const orderDate = new Date(order.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHtml = items.map(item => `
        <div class="order-item">
            <div class="item-image">
                <i class="fas fa-box fa-2x"></i>
            </div>
            <div class="item-details">
                <div class="item-name">${item.product_name}</div>
                <div class="item-sku">SKU: ${item.id}</div>
                <div class="item-price-info">
                    <div class="item-quantity">Cantidad: ${item.quantity}</div>
                    <div class="item-price">${formatCOP(item.unit_price_cop || item.unit_price)}</div>
                </div>
            </div>
        </div>
    `).join('');

    const html = `
        <div class="order-detail-card">
            <div class="order-header">
                <div class="order-info">
                    <h1>Pedido #${order.order_number}</h1>
                    <div class="order-meta">
                        <span><i class="fas fa-calendar"></i> ${orderDate}</span>
                        <span><i class="fas fa-credit-card"></i> ${order.payment_method || 'No especificado'}</span>
                    </div>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>

            <div class="order-items-section">
                <h2 class="section-title">Productos</h2>
                <div class="order-items">
                    ${itemsHtml}
                </div>
            </div>

            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${formatCOP(order.subtotal_cop || order.subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Envío:</span>
                    <span>${formatCOP(order.shipping_cost_cop || order.shipping_cost)}</span>
                </div>
                <div class="summary-row">
                    <span>Impuestos:</span>
                    <span>${formatCOP(order.tax_amount_cop || order.tax_amount)}</span>
                </div>
                <div class="summary-total">
                    <span>Total:</span>
                    <span>${formatCOP(order.total_amount_cop || order.total_amount)}</span>
                </div>
            </div>

            ${order.shipping_address ? `
                <div class="order-items-section">
                    <h2 class="section-title">Dirección de Envío</h2>
                    <p style="color: #64748b; line-height: 1.6;">${order.shipping_address.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}

            ${order.notes ? `
                <div class="order-items-section">
                    <h2 class="section-title">Notas del Pedido</h2>
                    <p style="color: #64748b; line-height: 1.6;">${order.notes}</p>
                </div>
            ` : ''}

            <div class="order-actions">
                <a href="/client/orders" class="btn-action btn-secondary">
                    <i class="fas fa-arrow-left"></i> Volver a Pedidos
                </a>
                ${order.status === 'delivered' ? `
                    <button class="btn-action btn-primary" onclick="requestRefund(${order.id})">
                        <i class="fas fa-undo"></i> Solicitar Devolución
                    </button>
                ` : ''}
                ${(order.status === 'shipped' || order.status === 'in_transit') ? `
                    <a href="/client/order/${order.id}/tracking" class="btn-action btn-primary">
                        <i class="fas fa-map-marker-alt"></i> Ver Rastreo en Tiempo Real
                    </a>
                ` : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'shipped': 'status-processing',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

function showError(message) {
    const container = document.getElementById('order-detail-container');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <a href="/client/orders" class="btn-action btn-primary" style="margin-top: 16px;">
                <i class="fas fa-arrow-left"></i> Volver a Pedidos
            </a>
        </div>
    `;
}

function requestRefund(orderId) {
    if (confirm('¿Estás seguro de que quieres solicitar una devolución para este pedido?')) {
        // Implement refund request logic
        alert('Función de devolución en desarrollo');
    }
}

function trackOrder(orderId) {
    alert('Función de rastreo en desarrollo');
}

// Close user dropdown when clicking outside
window.onclick = function(event) {
    const userMenu = document.getElementById('userMenu');
    const userBtn = document.querySelector('.user-menu-btn');
    if (!userBtn.contains(event.target) && userMenu.style.display === 'block') {
        userMenu.style.display = 'none';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderDetails();
});