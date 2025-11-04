// Formatear moneda en pesos colombianos
function formatCOP(amount) {
    const intAmount = Math.round(amount || 0);
    return '$' + intAmount.toLocaleString('es-CO');
}

// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    const button = document.querySelector('.user-menu-btn');
    
    if (menu.style.display === 'block' || menu.classList.contains('show')) {
        menu.style.display = 'none';
        menu.classList.remove('show');
    } else {
        // Calcular posición del botón
        const buttonRect = button.getBoundingClientRect();
        
        // Posicionar el menú justo debajo del botón
        menu.style.top = (buttonRect.bottom + 8) + 'px';
        
        // Alinear el borde derecho del menú con el borde derecho del botón
        menu.style.left = (buttonRect.right - 220) + 'px'; // 220px es el min-width del menú
        
        menu.style.display = 'block';
        menu.classList.add('show');
    }
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
            <div class="stat-value">${formatCOP(stats.total_spent_cop || stats.total_spent)}</div>
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
                <a href="/client/catalog" style="color: #ff6b35; text-decoration: none; font-weight: 600;">
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
                    <span class="order-amount">${formatCOP(order.total_amount_cop || order.total_amount)}</span>
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
            <a href="/client/orders" class="btn-action btn-primary" style="display: inline-flex;">
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
    if (userMenu && userBtn && !userBtn.contains(event.target) && !userMenu.contains(event.target)) {
        if (userMenu.style.display === 'block' || userMenu.classList.contains('show')) {
            userMenu.style.display = 'none';
            userMenu.classList.remove('show');
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});