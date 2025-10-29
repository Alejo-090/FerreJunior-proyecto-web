// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Load dashboard data
function loadDashboardData() {
    // Load stats
    fetch('/client/dashboard-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStats(data.stats);
                updateRecentOrders(data.recent_orders);
            } else {
                showError('Error al cargar datos del dashboard');
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            showError('Error de conexión');
        });
}

function updateStats(stats) {
    const statsContainer = document.getElementById('stats-section');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-title">Total Pedidos</div>
                <div class="stat-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
            </div>
            <div class="stat-value">${stats.total_orders}</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-up"></i>
                Pedidos realizados
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-title">Pedidos Completados</div>
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
            <div class="stat-value">${stats.completed_orders}</div>
            <div class="stat-change positive">
                <i class="fas fa-check"></i>
                Entregados exitosamente
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-title">Total Gastado</div>
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
            </div>
            <div class="stat-value">${typeof formatCOP === 'function' ? formatCOP(stats.total_spent) : '$' + (stats.total_spent || 0).toLocaleString()}</div>
            <div class="stat-change positive">
                <i class="fas fa-chart-line"></i>
                En compras
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-title">Pedidos Pendientes</div>
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="stat-value">${stats.pending_orders}</div>
            <div class="stat-change" style="color: #f59e0b;">
                <i class="fas fa-exclamation-triangle"></i>
                En proceso
            </div>
        </div>
    `;
}

function updateRecentOrders(orders) {
    const ordersContainer = document.getElementById('recent-orders-section');

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <h3 class="section-title">
                <i class="fas fa-clock"></i>
                Pedidos Recientes
            </h3>
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-shopping-cart fa-3x" style="margin-bottom: 16px; opacity: 0.5;"></i>
                <p>Aún no has realizado ningún pedido</p>
                <a href="{{ url_for('client.catalog') }}" style="color: #ff6b35; text-decoration: none; font-weight: 600;">
                    ¡Empieza a comprar ahora!
                </a>
            </div>
        `;
        return;
    }

    const ordersHtml = orders.map(order => {
        const statusClass = getStatusClass(order.status);
        const statusText = order.status_display;
        const orderDate = new Date(order.created_at).toLocaleDateString('es-ES');

        return `
            <div class="order-item">
                <div class="order-info">
                    <h4>Pedido #${order.order_number}</h4>
                    <p>${orderDate}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span class="order-status ${statusClass}">${statusText}</span>
                    <span class="order-amount">${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    ordersContainer.innerHTML = `
        <h3 class="section-title">
            <i class="fas fa-clock"></i>
            Pedidos Recientes
        </h3>
        ${ordersHtml}
        <div style="text-align: center; margin-top: 20px;">
            <a href="{{ url_for('client.client_orders') }}" class="btn-action btn-primary" style="display: inline-flex;">
                <i class="fas fa-list"></i>
                Ver Todos los Pedidos
            </a>
        </div>
    `;
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
    const statsContainer = document.getElementById('stats-section');
    const ordersContainer = document.getElementById('recent-orders-section');

    statsContainer.innerHTML = `<div class="error-message">${message}</div>`;
    ordersContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Close user dropdown when clicking outside
window.onclick = function(event) {
    const userMenu = document.getElementById('userMenu');
    const userBtn = document.querySelector('.user-menu-btn');
    if (!userBtn.contains(event.target) && userMenu.style.display === 'block') {
        userMenu.style.display = 'none';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});