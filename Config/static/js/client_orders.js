let currentPage = 1;
let currentFilters = {};

// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Load orders
function loadOrders(page = 1, filters = {}) {
    currentPage = page;
    currentFilters = filters;

    const ordersSection = document.getElementById('orders-section');
    ordersSection.innerHTML = `
        <div class="orders-header">
            <div>
                <h2 class="orders-title">Historial de Pedidos</h2>
                <div class="orders-count">Cargando pedidos...</div>
            </div>
        </div>
        <div class="loading">Cargando pedidos...</div>
    `;

    const params = new URLSearchParams({
        page: page,
        per_page: 10,
        ...filters
    });

    fetch(`/client/orders-data?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderOrders(data.orders, data.pagination);
            } else {
                showError('Error al cargar pedidos');
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            showError('Error de conexión');
        });
}

function renderOrders(orders, pagination) {
    const ordersSection = document.getElementById('orders-section');

    if (orders.length === 0) {
        ordersSection.innerHTML = `
            <div class="orders-header">
                <div>
                    <h2 class="orders-title">Historial de Pedidos</h2>
                    <div class="orders-count">No se encontraron pedidos</div>
                </div>
            </div>
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>No tienes pedidos aún</h3>
                <p>¡Empieza a comprar en nuestro catálogo!</p>
                <a href="/client/catalog" class="btn-action btn-primary">
                    <i class="fas fa-store"></i> Ver Catálogo
                </a>
            </div>
        `;
        return;
    }

    const ordersHtml = orders.map(order => {
        const statusClass = getStatusClass(order.status);
        const statusText = order.status_display;
        const orderDate = new Date(order.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const itemsHtml = order.items.map(item => `
            <div class="order-item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-price">${typeof formatCOP === 'function' ? formatCOP(item.price) : '$' + (item.price || 0).toLocaleString()}</div>
            </div>
        `).join('');

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Pedido #${order.order_number}</h3>
                        <div class="order-date">${orderDate}</div>
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>

                <div class="order-details">
                    <div class="order-items">
                        ${itemsHtml}
                    </div>

                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>${typeof formatCOP === 'function' ? formatCOP(order.subtotal) : '$' + (order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Envío:</span>
                            <span>${typeof formatCOP === 'function' ? formatCOP(order.shipping_cost) : '$' + (order.shipping_cost || 0).toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Impuestos:</span>
                            <span>${typeof formatCOP === 'function' ? formatCOP(order.tax_amount) : '$' + (order.tax_amount || 0).toLocaleString()}</span>
                        </div>
                        <div class="summary-total">
                            <span>Total:</span>
                            <span>${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="order-actions">
                        <a href="/client/order/${order.id}" class="btn-action btn-primary">
                            <i class="fas fa-eye"></i> Ver Detalle
                        </a>
                        ${order.status === 'delivered' ? `
                            <button class="btn-action btn-secondary" onclick="requestRefund(${order.id})">
                                <i class="fas fa-undo"></i> Devolución
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const paginationHtml = renderPagination(pagination);

    ordersSection.innerHTML = `
        <div class="orders-header">
            <div>
                <h2 class="orders-title">Historial de Pedidos</h2>
                <div class="orders-count">${pagination.total} pedidos encontrados</div>
            </div>
        </div>
        ${ordersHtml}
        ${paginationHtml}
    `;
}

function renderPagination(pagination) {
    if (pagination.pages <= 1) return '';

    let paginationHtml = '<div class="pagination">';

    // Previous button
    if (pagination.has_prev) {
        paginationHtml += `<button class="page-btn" onclick="loadOrders(${pagination.page - 1}, currentFilters)">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    } else {
        paginationHtml += `<button class="page-btn disabled">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === pagination.page ? ' active' : '';
        paginationHtml += `<button class="page-btn${activeClass}" onclick="loadOrders(${i}, currentFilters)">${i}</button>`;
    }

    // Next button
    if (pagination.has_next) {
        paginationHtml += `<button class="page-btn" onclick="loadOrders(${pagination.page + 1}, currentFilters)">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    } else {
        paginationHtml += `<button class="page-btn disabled">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }

    paginationHtml += '</div>';
    return paginationHtml;
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
    const ordersSection = document.getElementById('orders-section');
    ordersSection.innerHTML = `
        <div class="orders-header">
            <div>
                <h2 class="orders-title">Historial de Pedidos</h2>
                <div class="orders-count">Error al cargar</div>
            </div>
        </div>
        <div class="error-message">${message}</div>
    `;
}

function requestRefund(orderId) {
    if (confirm('¿Estás seguro de que quieres solicitar una devolución para este pedido?')) {
        // Implement refund request logic
        alert('Función de devolución en desarrollo');
    }
}

// Filter form submission
document.getElementById('filtersForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const filters = {};

    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            filters[key] = value;
        }
    }

    loadOrders(1, filters);
});

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
    loadOrders();
});