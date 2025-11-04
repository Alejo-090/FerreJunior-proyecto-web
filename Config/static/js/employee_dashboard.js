// Employee Dashboard JavaScript
console.log('✅ Employee Dashboard JS loaded successfully');

// Section navigation
function showSection(sectionName) {
    console.log('showSection called with:', sectionName);
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    document.getElementById('section-' + sectionName).style.display = 'block';

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');

    // Update breadcrumb
    document.getElementById('currentSection').textContent = getSectionTitle(sectionName);

    // Load section-specific data
    if (sectionName === 'tasks') {
        loadTasks();
    } else if (sectionName === 'orders') {
        loadOrders();
    } else if (sectionName === 'inventory') {
        loadInventory();
    } else if (sectionName === 'customers') {
        loadCustomers();
    } else if (sectionName === 'tickets') {
        loadTickets();
    } else if (sectionName === 'reports') {
        loadReports();
    } else if (sectionName === 'tracking') {
        loadTracking();
    }
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSectionTitle(sectionName) {
    const titles = {
        'dashboard': 'Dashboard',
        'tasks': 'Mis Tareas',
        'orders': 'Pedidos',
        'inventory': 'Inventario',
        'customers': 'Clientes',
        'tickets': 'Tickets de Soporte',
        'reports': 'Reportes',
        'tracking': 'Rastreo de Entregas'
    };
    return titles[sectionName] || capitalizeFirst(sectionName);
}

// Action functions (placeholders)
function showPendingOrders() {
    alert('Mostrar pedidos pendientes - Funcionalidad en desarrollo');
}

function showCompletedOrders() {
    alert('Mostrar pedidos completados - Funcionalidad en desarrollo');
}

function updateStock() {
    alert('Actualizar stock - Funcionalidad en desarrollo');
}

function showLowStock() {
    alert('Mostrar productos con stock bajo - Funcionalidad en desarrollo');
}

function openChat() {
    alert('Abrir chat en vivo - Funcionalidad en desarrollo');
}

function showTickets() {
    alert('Mostrar tickets de soporte - Funcionalidad en desarrollo');
}

function showFAQ() {
    alert('Mostrar FAQ - Funcionalidad en desarrollo');
}

// Additional action functions for complete functionality
function createNewOrder() {
    alert('Crear nuevo pedido - Funcionalidad en desarrollo');
}

function showInProcessOrders() {
    alert('Mostrar pedidos en proceso - Funcionalidad en desarrollo');
}

function searchOrder() {
    alert('Buscar pedido - Funcionalidad en desarrollo');
}

function generateOrderReport() {
    alert('Generar reporte de pedidos - Funcionalidad en desarrollo');
}

function addProduct() {
    alert('Agregar producto - Funcionalidad en desarrollo');
}

function searchProduct() {
    alert('Buscar producto - Funcionalidad en desarrollo');
}

function generateInventoryReport() {
    alert('Generar reporte de inventario - Funcionalidad en desarrollo');
}

function exportInventory() {
    alert('Exportar inventario - Funcionalidad en desarrollo');
}

function createTicket() {
    alert('Crear ticket de soporte - Funcionalidad en desarrollo');
}

function showGuides() {
    alert('Mostrar guías de usuario - Funcionalidad en desarrollo');
}

function contactSupport() {
    alert('Contactar soporte técnico - Funcionalidad en desarrollo');
}

function generateDailyReport() {
    alert('Generar reporte diario - Funcionalidad en desarrollo');
}

function generateWeeklyReport() {
    alert('Generar reporte semanal - Funcionalidad en desarrollo');
}

function generateMonthlyReport() {
    alert('Generar reporte mensual - Funcionalidad en desarrollo');
}

function exportSalesData() {
    alert('Exportar datos de ventas - Funcionalidad en desarrollo');
}

function exportInventoryData() {
    alert('Exportar datos de inventario - Funcionalidad en desarrollo');
}

function exportCustomerData() {
    alert('Exportar datos de clientes - Funcionalidad en desarrollo');
}

// Task management functions
function loadTasks() {
    fetch('/employee/tasks-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Guardar tareas globalmente para filtros
                window.allTasks = data.tasks || [];
                updateTaskStats(data.stats);
                updateTaskList(window.allTasks);
            } else {
                showTaskError('Error al cargar tareas: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            showTaskError('Error de conexión al cargar tareas');
        });
}

function updateTaskStats(stats) {
    // Actualizar contadores con los IDs correctos
    document.getElementById('tasks-pending-count').textContent = stats.pending || 0;
    document.getElementById('tasks-inprogress-count').textContent = stats.in_progress || 0;
    document.getElementById('tasks-completed-count').textContent = stats.completed || 0;
    document.getElementById('tasks-urgent-count').textContent = stats.urgent || 0;
}

function updateTaskList(tasks) {
    const tasksContainer = document.getElementById('tasks-list');

    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<div class="no-tasks">No hay tareas asignadas</div>';
        return;
    }

    const taskItems = tasks.map(task => {
        const priorityClass = getPriorityClass(task.priority);
        const priorityText = getPriorityText(task.priority);
        const statusText = getStatusText(task.status);
        const statusClass = getStatusClass(task.status);

        return `
            <div class="task-item">
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <span class="task-priority ${priorityClass}">${priorityText}</span>
                    <span class="task-status ${statusClass}">${statusText}</span>
                </div>
                <div class="task-actions">
                    ${getTaskActions(task)}
                </div>
            </div>
        `;
    }).join('');

    tasksContainer.innerHTML = taskItems;
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return 'priority-medium';
    }
}

function getPriorityText(priority) {
    switch (priority) {
        case 'high': return 'Alta';
        case 'medium': return 'Media';
        case 'low': return 'Baja';
        default: return 'Media';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Pendiente';
        case 'in_progress': return 'En Progreso';
        case 'completed': return 'Completada';
        default: return 'Pendiente';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'in_progress': return 'status-in-progress';
        case 'completed': return 'status-completed';
        default: return 'status-pending';
    }
}

function getTaskActions(task) {
    if (task.status === 'completed') {
        return '<span class="task-completed"><i class="fas fa-check"></i> Completada</span>';
    }

    let actions = '';
    if (task.status === 'pending') {
        actions += `<button class="btn btn-sm btn-warning" onclick="startTask(${task.id})">Iniciar</button>`;
    } else if (task.status === 'in_progress') {
        actions += `<button class="btn btn-sm btn-success" onclick="completeTask(${task.id})">Completar</button>`;
    }

    return actions;
}

function startTask(taskId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    fetch(`/employee/task/${taskId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ status: 'in_progress' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Tarea iniciada exitosamente');
            loadTasks(); // Reload tasks
        } else {
            alert('Error al iniciar la tarea: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al iniciar la tarea');
    });
}

function completeTask(taskId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    fetch(`/employee/task/${taskId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('¡Tarea completada exitosamente!');
            loadTasks(); // Reload tasks
        } else {
            alert('Error al completar la tarea: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al completar la tarea');
    });
}

function filterTasks() {
    const statusFilter = document.getElementById('taskFilterStatus').value;
    const priorityFilter = document.getElementById('taskFilterPriority').value;
    
    if (!window.allTasks) {
        return;
    }
    
    let filteredTasks = window.allTasks.filter(task => {
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
    });
    
    updateTaskList(filteredTasks);
}

function showTaskError(message) {
    const tasksContainer = document.getElementById('tasks-list');
    tasksContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard loaded - Iniciando configuración...');
    
    // Add hover effects
    const cards = document.querySelectorAll('.stat-card, .action-section');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Task priority hover effects
    const priorities = document.querySelectorAll('.priority-high, .priority-medium, .priority-low');
    priorities.forEach(priority => {
        priority.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        priority.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Show dashboard section by default
    showSection('dashboard');
    
    // Iniciar polling para actualizar tickets cada 30 segundos
    startTicketsPolling();
    
    // Cargar badges del sidebar inicialmente (esperar un poco para que todo esté cargado)
    console.log('⏳ Esperando para cargar badges...');
    setTimeout(() => {
        console.log('🚀 Cargando badges del sidebar...');
        updateSidebarBadges();
    }, 500);
    
    // Actualizar badges cada 30 segundos
    setInterval(updateSidebarBadges, 30000);
});
// Orders Management Functions
function loadOrders() {
    fetch('/employee/orders-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.allOrders = data.orders || [];
                updateOrderStats(data.stats);
                updateOrderList(window.allOrders);
            } else {
                showOrderError('Error al cargar pedidos: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            showOrderError('Error de conexión al cargar pedidos');
        });
}

function updateOrderStats(stats) {
    document.getElementById('orders-pending-count').textContent = stats.pending || 0;
    document.getElementById('orders-shipped-count').textContent = stats.shipped || 0;
    document.getElementById('orders-delivered-count').textContent = stats.delivered || 0;
    document.getElementById('orders-total-count').textContent = stats.total || 0;
}

function updateOrderList(orders) {
    const ordersContainer = document.getElementById('orders-list');

    if (orders.length === 0) {
        ordersContainer.innerHTML = '<div class=\"no-tasks\">No hay pedidos registrados</div>';
        return;
    }

    const tableHTML = '<table class=\"orders-table\"><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>' + 
        orders.map(order => {
            const statusClass = getOrderStatusClass(order.status);
            const statusText = getOrderStatusText(order.status);
            
            return '<tr><td><strong>' + order.order_number + '</strong></td><td>' + (order.user_name || 'Cliente #' + order.user_id) + '</td><td>$' + formatNumber(order.total_amount) + '</td><td><span class=\"order-status ' + statusClass + '\">' + statusText + '</span></td><td>' + formatDateShort(order.created_at) + '</td><td>' + getOrderActions(order) + '</td></tr>';
        }).join('') + 
        '</tbody></table>';

    ordersContainer.innerHTML = tableHTML;
}

function getOrderStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

function getOrderStatusText(status) {
    switch (status) {
        case 'pending': return 'Pendiente';
        case 'shipped': return 'Enviado';
        case 'delivered': return 'Entregado';
        case 'cancelled': return 'Cancelado';
        default: return 'Pendiente';
    }
}

function getOrderActions(order) {
    let actions = '<button class=\"btn btn-sm btn-info\" onclick=\"viewOrderDetails(' + order.id + ')\"><i class=\"fas fa-eye\"></i></button> ';
    
    if (order.status === 'pending') {
        actions += '<button class=\"btn btn-sm btn-warning\" onclick=\"shipOrder(' + order.id + ')\"><i class=\"fas fa-truck\"></i></button> ';
    } else if (order.status === 'shipped') {
        actions += '<button class=\"btn btn-sm btn-success\" onclick=\"deliverOrder(' + order.id + ')\"><i class=\"fas fa-check\"></i></button> ';
    }
    
    return actions;
}

function filterOrders() {
    const statusFilter = document.getElementById('orderFilterStatus').value;
    
    if (!window.allOrders) {
        return;
    }
    
    let filteredOrders = window.allOrders.filter(order => {
        return !statusFilter || order.status === statusFilter;
    });
    
    updateOrderList(filteredOrders);
}

function shipOrder(orderId) {
    if (!confirm('¿Marcar este pedido como enviado?')) {
        return;
    }
    
    updateOrderStatus(orderId, 'shipped');
}

function deliverOrder(orderId) {
    if (!confirm('¿Marcar este pedido como entregado?')) {
        return;
    }
    
    updateOrderStatus(orderId, 'delivered');
}

function updateOrderStatus(orderId, newStatus) {
    const csrfToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content');
    
    fetch('/employee/order/' + orderId + '/status', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Estado del pedido actualizado exitosamente');
            loadOrders();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar el pedido');
    });
}

function viewOrderDetails(orderId) {
    fetch('/employee/order/' + orderId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showOrderModal(data.order);
            } else {
                alert('Error al cargar detalles: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar detalles del pedido');
        });
}

function showOrderModal(order) {
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('orderModalBody');
    
    const statusText = getOrderStatusText(order.status);
    
    modalBody.innerHTML = '<div class=\"order-details\"><div class=\"detail-row\"><strong>Número de Pedido:</strong> ' + order.order_number + '</div><div class=\"detail-row\"><strong>Cliente:</strong> ' + (order.user_name || 'Cliente #' + order.user_id) + '</div><div class=\"detail-row\"><strong>Estado:</strong> <span class=\"order-status ' + getOrderStatusClass(order.status) + '\">' + statusText + '</span></div><div class=\"detail-row\"><strong>Subtotal:</strong> $' + formatNumber(order.subtotal) + '</div><div class=\"detail-row\"><strong>Envío:</strong> $' + formatNumber(order.shipping_cost) + '</div><div class=\"detail-row\"><strong>IVA:</strong> $' + formatNumber(order.tax_amount) + '</div><div class=\"detail-row\"><strong>Total:</strong> $' + formatNumber(order.total_amount) + '</div><div class=\"detail-row\"><strong>Dirección de Envío:</strong> ' + (order.shipping_address || 'No especificada') + '</div><div class=\"detail-row\"><strong>Método de Pago:</strong> ' + (order.payment_method || 'No especificado') + '</div><div class=\"detail-row\"><strong>Notas:</strong> <textarea id=\"orderNotes\" class=\"form-control\" rows=\"3\">' + (order.notes || '') + '</textarea></div><div class=\"detail-row\"><strong>Fecha:</strong> ' + formatDate(order.created_at) + '</div></div><div style=\"margin-top: 20px; text-align: right;\"><button class=\"btn btn-primary\" onclick=\"saveOrderNotes(' + order.id + ')\"><i class=\"fas fa-save\"></i> Guardar Notas</button> <button class=\"btn btn-secondary\" onclick=\"closeOrderModal()\">Cerrar</button></div>';
    
    modal.style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function saveOrderNotes(orderId) {
    const notes = document.getElementById('orderNotes').value;
    const csrfToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content');
    
    fetch('/employee/order/' + orderId + '/notes', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ notes: notes })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Notas guardadas exitosamente');
            closeOrderModal();
            loadOrders();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar las notas');
    });
}

function showOrderError(message) {
    const ordersContainer = document.getElementById('orders-list');
    ordersContainer.innerHTML = '<div class=\"error-message\">' + message + '</div>';
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Inventory Management Functions
function loadInventory() {
    fetch('/employee/inventory-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.allProducts = data.products || [];
                updateInventoryStats(data.stats);
                updateCategoryFilter(data.products);
                updateInventoryList(window.allProducts);
            } else {
                showInventoryError('Error al cargar inventario: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error loading inventory:', error);
            showInventoryError('Error de conexión al cargar inventario');
        });
}

function updateInventoryStats(stats) {
    document.getElementById('inventory-total-count').textContent = stats.total_products || 0;
    document.getElementById('inventory-lowstock-count').textContent = stats.low_stock || 0;
    document.getElementById('inventory-outofstock-count').textContent = stats.out_of_stock || 0;
    document.getElementById('inventory-totalvalue-count').textContent = '$' + formatNumber(stats.total_value || 0);
}

function updateCategoryFilter(products) {
    const categoryFilter = document.getElementById('inventoryFilterCategory');
    const categories = new Set();
    
    products.forEach(product => {
        if (product.category_name) {
            categories.add(product.category_name);
        }
    });
    
    // Clear existing options except first one
    categoryFilter.innerHTML = '<option value=\"\">Todas las categorías</option>';
    
    // Add category options
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function updateInventoryList(products) {
    const inventoryContainer = document.getElementById('inventory-list');

    if (products.length === 0) {
        inventoryContainer.innerHTML = '<div class=\"no-tasks\">No hay productos registrados</div>';
        return;
    }

    const tableHTML = '<table class=\"inventory-table\"><thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + 
        products.map(product => {
            const stockClass = getStockStatusClass(product);
            const stockText = getStockStatusText(product);
            
            return '<tr><td><strong>' + product.sku + '</strong></td><td>' + product.name + (product.brand ? '<br><small class=\"text-muted\">' + product.brand + '</small>' : '') + '</td><td>' + (product.category_name || '-') + '</td><td>$' + formatNumber(product.price) + '</td><td><strong>' + product.stock_quantity + '</strong></td><td><span class=\"stock-status ' + stockClass + '\">' + stockText + '</span></td><td>' + getInventoryActions(product) + '</td></tr>';
        }).join('') + 
        '</tbody></table>';

    inventoryContainer.innerHTML = tableHTML;
}

function getStockStatusClass(product) {
    if (product.stock_quantity === 0) {
        return 'stock-out';
    } else if (product.stock_quantity <= product.min_stock_level) {
        return 'stock-low';
    } else {
        return 'stock-ok';
    }
}

function getStockStatusText(product) {
    if (product.stock_quantity === 0) {
        return 'Sin Stock';
    } else if (product.stock_quantity <= product.min_stock_level) {
        return 'Stock Bajo';
    } else {
        return 'Disponible';
    }
}

function getInventoryActions(product) {
    let actions = '<button class=\"btn btn-sm btn-info\" onclick=\"viewProductDetails(' + product.id + ')\"><i class=\"fas fa-eye\"></i></button> ';
    actions += '<button class=\"btn btn-sm btn-warning\" onclick=\"editProduct(' + product.id + ')\"><i class=\"fas fa-edit\"></i></button> ';
    actions += '<button class=\"btn btn-sm btn-success\" onclick=\"quickUpdateStock(' + product.id + ', ' + product.stock_quantity + ')\"><i class=\"fas fa-box\"></i></button>';
    
    return actions;
}

function filterInventory() {
    const stockFilter = document.getElementById('inventoryFilterStock').value;
    const categoryFilter = document.getElementById('inventoryFilterCategory').value;
    
    if (!window.allProducts) {
        return;
    }
    
    let filteredProducts = window.allProducts.filter(product => {
        let matchStock = true;
        let matchCategory = true;
        
        // Stock filter
        if (stockFilter === 'in-stock') {
            matchStock = product.stock_quantity > product.min_stock_level;
        } else if (stockFilter === 'low-stock') {
            matchStock = product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_level;
        } else if (stockFilter === 'out-of-stock') {
            matchStock = product.stock_quantity === 0;
        }
        
        // Category filter
        if (categoryFilter) {
            matchCategory = product.category_name === categoryFilter;
        }
        
        return matchStock && matchCategory;
    });
    
    updateInventoryList(filteredProducts);
}

function quickUpdateStock(productId, currentStock) {
    const newStock = prompt('Ingrese la nueva cantidad de stock:', currentStock);
    
    if (newStock === null) {
        return;
    }
    
    const stockValue = parseInt(newStock);
    
    if (isNaN(stockValue) || stockValue < 0) {
        alert('Por favor ingrese un número válido mayor o igual a 0');
        return;
    }
    
    updateStock(productId, stockValue);
}

function updateStock(productId, stockQuantity) {
    const csrfToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content');
    
    fetch('/employee/product/' + productId + '/stock', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ stock_quantity: stockQuantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Stock actualizado exitosamente');
            loadInventory();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar el stock');
    });
}

function viewProductDetails(productId) {
    fetch('/employee/product/' + productId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showProductDetailsModal(data.product);
            } else {
                alert('Error al cargar detalles: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar detalles del producto');
        });
}

function showProductDetailsModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    
    const stockStatus = getStockStatusText(product);
    const stockClass = getStockStatusClass(product);
    
    modalBody.innerHTML = '<div class=\"product-details\"><div class=\"detail-row\"><strong>SKU:</strong> ' + product.sku + '</div><div class=\"detail-row\"><strong>Nombre:</strong> ' + product.name + '</div><div class=\"detail-row\"><strong>Descripción:</strong> ' + (product.description || 'Sin descripción') + '</div><div class=\"detail-row\"><strong>Categoría:</strong> ' + (product.category_name || 'Sin categoría') + '</div><div class=\"detail-row\"><strong>Marca:</strong> ' + (product.brand || 'Sin marca') + '</div><div class=\"detail-row\"><strong>Precio:</strong> $' + formatNumber(product.price) + '</div><div class=\"detail-row\"><strong>Stock Actual:</strong> ' + product.stock_quantity + ' <span class=\"stock-status ' + stockClass + '\">' + stockStatus + '</span></div><div class=\"detail-row\"><strong>Stock Mínimo:</strong> ' + product.min_stock_level + '</div><div class=\"detail-row\"><strong>Activo:</strong> ' + (product.active ? 'Sí' : 'No') + '</div><div class=\"detail-row\"><strong>Última Actualización:</strong> ' + formatDate(product.updated_at) + '</div></div><div style=\"margin-top: 20px; text-align: right;\"><button class=\"btn btn-warning\" onclick=\"editProduct(' + product.id + ')\"><i class=\"fas fa-edit\"></i> Editar</button> <button class=\"btn btn-secondary\" onclick=\"closeProductModal()\">Cerrar</button></div>';
    
    modal.style.display = 'block';
}

function editProduct(productId) {
    fetch('/employee/product/' + productId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showEditProductModal(data.product);
            } else {
                alert('Error al cargar producto: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar producto');
        });
}

function showEditProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    
    modalBody.innerHTML = '<form id=\"editProductForm\" class=\"edit-product-form\"><div class=\"form-group\"><label>Nombre del Producto *</label><input type=\"text\" id=\"edit-name\" class=\"form-control\" value=\"' + (product.name || '') + '\" required></div><div class=\"form-group\"><label>Descripción</label><textarea id=\"edit-description\" class=\"form-control\" rows=\"3\">' + (product.description || '') + '</textarea></div><div class=\"form-row\"><div class=\"form-group\"><label>Precio *</label><input type=\"number\" id=\"edit-price\" class=\"form-control\" value=\"' + (product.price || 0) + '\" step=\"0.01\" min=\"0\" required></div><div class=\"form-group\"><label>Stock Actual *</label><input type=\"number\" id=\"edit-stock\" class=\"form-control\" value=\"' + (product.stock_quantity || 0) + '\" min=\"0\" required></div></div><div class=\"form-row\"><div class=\"form-group\"><label>Stock Mínimo</label><input type=\"number\" id=\"edit-minstock\" class=\"form-control\" value=\"' + (product.min_stock_level || 10) + '\" min=\"0\"></div><div class=\"form-group\"><label>Marca</label><input type=\"text\" id=\"edit-brand\" class=\"form-control\" value=\"' + (product.brand || '') + '\"></div></div><div class=\"form-group\"><label><input type=\"checkbox\" id=\"edit-active\" ' + (product.active ? 'checked' : '') + '> Producto activo</label></div></form><div style=\"margin-top: 20px; text-align: right;\"><button class=\"btn btn-primary\" onclick=\"saveProductChanges(' + product.id + ')\"><i class=\"fas fa-save\"></i> Guardar Cambios</button> <button class=\"btn btn-secondary\" onclick=\"closeProductModal()\">Cancelar</button></div>';
    
    modal.style.display = 'block';
}

function saveProductChanges(productId) {
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    const price = parseFloat(document.getElementById('edit-price').value);
    const stock = parseInt(document.getElementById('edit-stock').value);
    const minStock = parseInt(document.getElementById('edit-minstock').value);
    const brand = document.getElementById('edit-brand').value;
    const active = document.getElementById('edit-active').checked;
    
    if (!name || price < 0 || stock < 0) {
        alert('Por favor complete los campos obligatorios correctamente');
        return;
    }
    
    const csrfToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content');
    
    fetch('/employee/product/' + productId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            name: name,
            description: description,
            price: price,
            stock_quantity: stock,
            min_stock_level: minStock,
            brand: brand,
            active: active
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Producto actualizado exitosamente');
            closeProductModal();
            loadInventory();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar el producto');
    });
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function showInventoryError(message) {
    const inventoryContainer = document.getElementById('inventory-list');
    inventoryContainer.innerHTML = '<div class=\"error-message\">' + message + '</div>';
}

// Customer Management Functions
function loadCustomers() {
    fetch('/employee/customers-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.allCustomers = data.customers || [];
                updateCustomerStats(data.stats);
                updateCustomerList(window.allCustomers);
            } else {
                showCustomerError('Error al cargar clientes: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            showCustomerError('Error de conexión al cargar clientes');
        });
}

function updateCustomerStats(stats) {
    document.getElementById('customers-total-count').textContent = stats.total_customers || 0;
    document.getElementById('customers-active-count').textContent = stats.active_customers || 0;
    document.getElementById('customers-newmonth-count').textContent = stats.new_this_month || 0;
    document.getElementById('customers-inactive-count').textContent = stats.inactive_customers || 0;
}

function updateCustomerList(customers) {
    const customersContainer = document.getElementById('customers-list');

    if (customers.length === 0) {
        customersContainer.innerHTML = '<div class=\"no-tasks\">No hay clientes registrados</div>';
        return;
    }

    const tableHTML = '<table class=\"customers-table\"><thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Pedidos</th><th>Total Gastado</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>' + 
        customers.map(customer => {
            const statusClass = customer.is_active ? 'customer-active' : 'customer-inactive';
            const statusText = customer.is_active ? 'Activo' : 'Inactivo';
            
            return '<tr><td><strong>' + (customer.name || 'Sin nombre') + '</strong></td><td>' + customer.email + '</td><td>' + (customer.phone || '-') + '</td><td>' + customer.order_count + '</td><td>$' + formatNumber(customer.total_spent || 0) + '</td><td><span class=\"customer-status ' + statusClass + '\">' + statusText + '</span></td><td>' + formatDateShort(customer.created_at) + '</td><td>' + getCustomerActions(customer) + '</td></tr>';
        }).join('') + 
        '</tbody></table>';

    customersContainer.innerHTML = tableHTML;
}

function getCustomerActions(customer) {
    let actions = '<button class=\"btn btn-sm btn-info\" onclick=\"viewCustomerDetails(' + customer.id + ')\"><i class=\"fas fa-eye\"></i></button> ';
    actions += '<button class=\"btn btn-sm btn-primary\" onclick=\"viewCustomerOrders(' + customer.id + ')\"><i class=\"fas fa-shopping-cart\"></i></button> ';
    
    if (customer.is_active) {
        actions += '<button class=\"btn btn-sm btn-warning\" onclick=\"toggleCustomerStatus(' + customer.id + ')\"><i class=\"fas fa-ban\"></i></button>';
    } else {
        actions += '<button class=\"btn btn-sm btn-success\" onclick=\"toggleCustomerStatus(' + customer.id + ')\"><i class=\"fas fa-check\"></i></button>';
    }
    
    return actions;
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('customerFilterStatus').value;
    
    if (!window.allCustomers) {
        return;
    }
    
    let filteredCustomers = window.allCustomers.filter(customer => {
        let matchSearch = true;
        let matchStatus = true;
        
        // Search filter
        if (searchTerm) {
            matchSearch = (customer.name && customer.name.toLowerCase().includes(searchTerm)) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm));
        }
        
        // Status filter
        if (statusFilter === 'active') {
            matchStatus = customer.is_active === true;
        } else if (statusFilter === 'inactive') {
            matchStatus = customer.is_active === false;
        }
        
        return matchSearch && matchStatus;
    });
    
    updateCustomerList(filteredCustomers);
}

function filterCustomers() {
    searchCustomers();
}

function viewCustomerDetails(customerId) {
    fetch('/employee/customer/' + customerId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showCustomerDetailsModal(data.customer);
            } else {
                alert('Error al cargar detalles: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar detalles del cliente');
        });
}

function showCustomerDetailsModal(customer) {
    const modal = document.getElementById('customerModal');
    const modalBody = document.getElementById('customerModalBody');
    
    const statusText = customer.is_active ? 'Activo' : 'Inactivo';
    const statusClass = customer.is_active ? 'customer-active' : 'customer-inactive';
    
    modalBody.innerHTML = '<div class=\"customer-details\"><div class=\"detail-row\"><strong>Nombre:</strong> ' + (customer.name || 'Sin nombre') + '</div><div class=\"detail-row\"><strong>Email:</strong> ' + customer.email + '</div><div class=\"detail-row\"><strong>Teléfono:</strong> ' + (customer.phone || 'No especificado') + '</div><div class=\"detail-row\"><strong>Estado:</strong> <span class=\"customer-status ' + statusClass + '\">' + statusText + '</span></div><div class=\"detail-row\"><strong>Total de Pedidos:</strong> ' + customer.order_count + '</div><div class=\"detail-row\"><strong>Total Gastado:</strong> $' + formatNumber(customer.total_spent || 0) + '</div><div class=\"detail-row\"><strong>Fecha de Registro:</strong> ' + formatDate(customer.created_at) + '</div></div><div style=\"margin-top: 20px; text-align: right;\"><button class=\"btn btn-primary\" onclick=\"viewCustomerOrders(' + customer.id + ')\"><i class=\"fas fa-shopping-cart\"></i> Ver Pedidos</button> <button class=\"btn btn-secondary\" onclick=\"closeCustomerModal()\">Cerrar</button></div>';
    
    modal.style.display = 'block';
}

function viewCustomerOrders(customerId) {
    fetch('/employee/customer/' + customerId + '/orders')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showCustomerOrdersModal(data.customer, data.orders);
            } else {
                alert('Error al cargar pedidos: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar pedidos del cliente');
        });
}

function showCustomerOrdersModal(customer, orders) {
    const modal = document.getElementById('customerModal');
    const modalBody = document.getElementById('customerModalBody');
    
    let ordersHTML = '';
    
    if (orders.length === 0) {
        ordersHTML = '<p style=\"text-align: center; padding: 20px; color: #999;\">Este cliente no tiene pedidos registrados</p>';
    } else {
        ordersHTML = '<table class=\"orders-table\" style=\"width: 100%; margin-top: 15px;\"><thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' + 
            orders.map(order => {
                const statusClass = getOrderStatusClass(order.status);
                const statusText = getOrderStatusText(order.status);
                
                return '<tr><td><strong>' + order.order_number + '</strong></td><td>' + formatDateShort(order.created_at) + '</td><td>$' + formatNumber(order.total_amount) + '</td><td><span class=\"order-status ' + statusClass + '\">' + statusText + '</span></td><td><button class=\"btn btn-sm btn-info\" onclick=\"viewOrderDetailsFromCustomer(' + order.id + ')\"><i class=\"fas fa-eye\"></i></button></td></tr>';
            }).join('') + 
            '</tbody></table>';
    }
    
    modalBody.innerHTML = '<div class=\"customer-details\"><h4 style=\"margin-bottom: 15px; color: #ff6b35;\"><i class=\"fas fa-user\"></i> ' + (customer.name || 'Cliente') + '</h4><div class=\"detail-row\"><strong>Email:</strong> ' + customer.email + '</div><div class=\"detail-row\"><strong>Total de Pedidos:</strong> ' + orders.length + '</div><div class=\"detail-row\"><strong>Total Gastado:</strong> $' + formatNumber(orders.reduce((sum, order) => sum + order.total_amount, 0)) + '</div></div><div style=\"margin-top: 20px;\"><h4 style=\"margin-bottom: 10px;\"><i class=\"fas fa-shopping-cart\"></i> Historial de Pedidos</h4>' + ordersHTML + '</div><div style=\"margin-top: 20px; text-align: right;\"><button class=\"btn btn-secondary\" onclick=\"closeCustomerModal()\">Cerrar</button></div>';
    
    modal.style.display = 'block';
}

function viewOrderDetailsFromCustomer(orderId) {
    closeCustomerModal();
    showSection('orders');
    
    // Small delay to ensure orders are loaded
    setTimeout(() => {
        viewOrderDetails(orderId);
    }, 500);
}

function toggleCustomerStatus(customerId) {
    if (!confirm('¿Está seguro de cambiar el estado de este cliente?')) {
        return;
    }
    
    const csrfToken = document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content');
    
    fetch('/employee/customer/' + customerId + '/toggle-status', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Estado del cliente actualizado exitosamente');
            loadCustomers();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar el estado del cliente');
    });
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function showCustomerError(message) {
    const customersContainer = document.getElementById('customers-list');
    customersContainer.innerHTML = '<div class=\"error-message\">' + message + '</div>';
}

// Reports Management Functions
function loadReports() {
    const days = document.getElementById('reportsPeriodFilter').value;
    
    fetch('/employee/reports-data?days=' + days)
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateReportsStats(data.stats);
                updateTopProducts(data.top_products);
                updateSalesChart(data.sales_timeline);
            } else {
                alert('Error al cargar reportes: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error loading reports:', error);
            alert('Error de conexión al cargar reportes');
        });
}

function updateReportsStats(stats) {
    document.getElementById('reports-totalsales').textContent = '$' + formatNumber(stats.total_sales || 0);
    document.getElementById('reports-totalorders').textContent = stats.total_orders || 0;
    document.getElementById('reports-avgorder').textContent = '$' + formatNumber(stats.avg_order_value || 0);
    document.getElementById('reports-completed').textContent = stats.completed_orders || 0;
}

function updateTopProducts(products) {
    const container = document.getElementById('top-products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p style=\"text-align: center; padding: 20px; color: #999;\">No hay datos de productos en este período</p>';
        return;
    }
    
    const tableHTML = '<table class=\"top-products-table\" style=\"width: 100%; margin-top: 10px;\"><thead><tr><th>Producto</th><th>Cantidad</th><th>Ingresos</th></tr></thead><tbody>' + 
        products.map((product, index) => {
            return '<tr><td><span class=\"rank-badge\">' + (index + 1) + '</span> ' + product.name + '</td><td>' + product.quantity + ' unidades</td><td><strong>$' + formatNumber(product.revenue) + '</strong></td></tr>';
        }).join('') + 
        '</tbody></table>';
    
    container.innerHTML = tableHTML;
}

function updateSalesChart(timeline) {
    const canvas = document.getElementById('salesChart');
    const ctx = canvas.getContext('2d');
    
    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }
    
    if (timeline.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos de ventas en este período', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const labels = timeline.map(t => {
        const date = new Date(t.date);
        return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    });
    
    const data = timeline.map(t => t.total);
    
    window.salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas ($)',
                data: data,
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Ventas: $' + formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// Support Functions
function showFAQ() {
    const faqContent = document.getElementById('faqContent');
    if (faqContent.style.display === 'none') {
        faqContent.style.display = 'block';
        faqContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        faqContent.style.display = 'none';
    }
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.className = 'fas fa-chevron-right';
    } else {
        answer.style.display = 'block';
        icon.className = 'fas fa-chevron-down';
    }
}

function showGuides() {
    alert('Las guías de usuario se abrirán en una nueva ventana.\\n\\nPróximamente: Manual completo del sistema FerreJunior.');
}

function contactSupport() {
    const message = 'Información de Contacto:\\n\\n' +
                   'Email: soporte@ferrejunior.com\\n' +
                   'Teléfono: +57 (604) 123-4567\\n' +
                   'Horario: Lunes a Viernes, 8:00 AM - 6:00 PM\\n\\n' +
                   '¿Deseas enviar un email ahora?';
    
    if (confirm(message)) {
        window.location.href = 'mailto:soporte@ferrejunior.com?subject=Soporte FerreJunior - Portal Empleado';
    }
}

// Este es el código correcto para reemplazar la sección de tickets

// ============================
// TICKET MANAGEMENT FUNCTIONS
// ============================

let allTickets = [];
let currentTicketId = null;
let chatPollingInterval = null;
let ticketsPollingInterval = null;
let lastMessageCount = 0;

// Load all tickets
async function loadTickets(silent = false) {
    try {
        const response = await fetch('/employee/tickets-data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            allTickets = data.tickets;
            updateTicketStats(data.stats);
            updateTicketList(allTickets);
            updateTicketsBadge(data.stats.open_tickets);
        } else if (!silent) {
            showError('Error al cargar tickets: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        if (!silent) {
            showError('Error al cargar los tickets');
        }
    }
}

// Update ticket stats
function updateTicketStats(stats) {
    document.getElementById('tickets-total-count').textContent = stats.total_tickets || 0;
    document.getElementById('tickets-open-count').textContent = stats.open_tickets || 0;
    document.getElementById('tickets-inprogress-count').textContent = stats.in_progress || 0;
    document.getElementById('tickets-resolved-count').textContent = stats.resolved || 0;
}

// Update tickets badge in navigation
function updateTicketsBadge(count) {
    const badge = document.getElementById('tickets-badge');
    if (badge) {
        badge.textContent = count || 0;
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Update ticket list
function updateTicketList(tickets) {
    const listContainer = document.getElementById('tickets-list');
    
    if (!tickets || tickets.length === 0) {
        listContainer.innerHTML = '<div class="no-data-message"><i class="fas fa-inbox"></i><p>No hay tickets disponibles</p></div>';
        return;
    }

    let html = '<table class="tickets-table"><thead><tr>';
    html += '<th>ID</th>';
    html += '<th>Cliente</th>';
    html += '<th>Asunto</th>';
    html += '<th>Categoria</th>';
    html += '<th>Prioridad</th>';
    html += '<th>Estado</th>';
    html += '<th>Fecha</th>';
    html += '<th>Acciones</th>';
    html += '</tr></thead><tbody>';

    tickets.forEach(ticket => {
        html += '<tr>';
        html += `<td>#${ticket.id}</td>`;
        html += `<td>${ticket.user_name || 'N/A'}</td>`;
        html += `<td>${ticket.subject}</td>`;
        html += `<td>${getCategoryLabel(ticket.category)}</td>`;
        html += `<td>${getPriorityBadge(ticket.priority)}</td>`;
        html += `<td>${getStatusBadge(ticket.status)}</td>`;
        html += `<td>${formatDateTime(ticket.created_at)}</td>`;
        html += `<td class="ticket-actions">`;
        html += `<button class="btn-icon" onclick="viewTicketChat(${ticket.id})" title="Ver chat"><i class="fas fa-comments"></i></button>`;
        if (!ticket.assigned_to) {
            html += `<button class="btn-icon" onclick="assignTicketToMe(${ticket.id})" title="Asignar a mi"><i class="fas fa-user-check"></i></button>`;
        }
        html += `</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    listContainer.innerHTML = html;
}

// Filter tickets
function filterTickets() {
    const statusFilter = document.getElementById('ticketsFilterStatus').value;
    const categoryFilter = document.getElementById('ticketsFilterCategory').value;

    let filtered = allTickets;

    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (categoryFilter) {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    updateTicketList(filtered);
}

// View ticket chat
async function viewTicketChat(ticketId) {
    currentTicketId = ticketId;
    lastMessageCount = 0; // Reset counter
    
    try {
        const response = await fetch(`/employee/ticket/${ticketId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showTicketChatModal(data.ticket, data.messages);
            // Iniciar polling para nuevos mensajes cada 3 segundos
            startChatPolling();
        } else {
            showError('Error al cargar el ticket: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        showError('Error al cargar el ticket');
    }
}

// Show ticket chat modal
function showTicketChatModal(ticket, messages) {
    const modal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('ticketModalBody');
    
    document.getElementById('ticketModalTitle').innerHTML = `Ticket #${ticket.id} - ${ticket.subject}`;
    
    let html = '<div class="ticket-chat-container">';
    
    // Ticket info header
    html += '<div class="ticket-info">';
    html += `<div><strong>Cliente:</strong> ${ticket.user_name || 'N/A'}</div>`;
    html += `<div><strong>Categoria:</strong> ${getCategoryLabel(ticket.category)}</div>`;
    html += `<div><strong>Prioridad:</strong> ${getPriorityBadge(ticket.priority)}</div>`;
    html += `<div><strong>Estado:</strong> ${getStatusBadge(ticket.status)}</div>`;
    html += `<div><strong>Fecha:</strong> ${formatDateTime(ticket.created_at)}</div>`;
    if (ticket.assigned_employee_name) {
        html += `<div><strong>Asignado a:</strong> ${ticket.assigned_employee_name}</div>`;
    }
    html += '</div>';
    
    // Status update section
    html += '<div class="ticket-status-controls" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">';
    html += '<div style="display: flex; gap: 10px; align-items: center;">';
    html += '<strong>Cambiar estado:</strong>';
    html += `<select id="ticketStatusSelect" class="form-control" style="width: 200px;">`;
    html += `<option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Abierto</option>`;
    html += `<option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>En Proceso</option>`;
    html += `<option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resuelto</option>`;
    html += `<option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Cerrado</option>`;
    html += '</select>';
    html += `<button class="btn btn-primary" onclick="updateTicketStatus()">Actualizar</button>`;
    if (!ticket.assigned_to) {
        html += `<button class="btn btn-success" onclick="assignTicketToMe(${ticket.id}, true)">Asignar a mi</button>`;
    }
    html += '</div></div>';
    
    // Messages thread
    html += '<div class="chat-messages" id="chatMessages" style="margin-top: 20px;">';
    
    // Initial ticket message
    html += '<div class="chat-message client-message">';
    html += `<div class="message-header"><strong>${ticket.user_name || 'Cliente'}</strong> <span class="message-time">${formatDateTime(ticket.created_at)}</span></div>`;
    html += `<div class="message-body">${ticket.message}</div>`;
    html += '</div>';
    
    // Subsequent messages
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const isEmployee = msg.user_id !== ticket.user_id;
            const messageClass = isEmployee ? 'employee-message' : 'client-message';
            const internalBadge = msg.is_internal ? '<span class="internal-badge">Nota interna</span>' : '';
            
            html += `<div class="chat-message ${messageClass}">`;
            html += `<div class="message-header"><strong>${msg.user_name || 'Usuario'}</strong> ${internalBadge} <span class="message-time">${formatDateTime(msg.created_at)}</span></div>`;
            html += `<div class="message-body">${msg.message}</div>`;
            html += '</div>';
        });
    }
    
    html += '</div>';
    
    // Message input
    html += '<div class="chat-input-container" style="margin-top: 20px;">';
    html += '<textarea id="ticketMessageInput" class="form-control" placeholder="Escribe tu respuesta..." rows="3"></textarea>';
    html += '<div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">';
    html += '<label style="margin: 0;"><input type="checkbox" id="isInternalNote"> Nota interna (solo empleados)</label>';
    html += '<button class="btn btn-primary" onclick="sendTicketMessage()" style="margin-left: auto;"><i class="fas fa-paper-plane"></i> Enviar</button>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    
    // Scroll to bottom of messages
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 100);
}

// Close ticket modal
function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
    currentTicketId = null;
    lastMessageCount = 0;
    
    // Detener polling cuando se cierra el chat
    stopChatPolling();
}

// Send ticket message
async function sendTicketMessage() {
    const messageInput = document.getElementById('ticketMessageInput');
    const isInternalCheckbox = document.getElementById('isInternalNote');
    const message = messageInput.value.trim();
    
    if (!message) {
        showError('Por favor escribe un mensaje');
        return;
    }
    
    if (!currentTicketId) {
        showError('Error: Ticket no identificado');
        return;
    }
    
    try {
        const response = await fetch(`/employee/ticket/${currentTicketId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                message: message,
                is_internal: isInternalCheckbox.checked
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Mensaje enviado');
            messageInput.value = '';
            isInternalCheckbox.checked = false;
            // Reload ticket chat
            viewTicketChat(currentTicketId);
        } else {
            showError('Error al enviar mensaje: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Error al enviar el mensaje');
    }
}

// Assign ticket to current employee
async function assignTicketToMe(ticketId, fromModal = false) {
    try {
        const response = await fetch(`/employee/ticket/${ticketId}/assign`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Ticket asignado correctamente');
            if (fromModal) {
                viewTicketChat(ticketId);
            } else {
                loadTickets();
            }
        } else {
            showError('Error al asignar ticket: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error assigning ticket:', error);
        showError('Error al asignar el ticket');
    }
}

// Update ticket status
async function updateTicketStatus() {
    const statusSelect = document.getElementById('ticketStatusSelect');
    const newStatus = statusSelect.value;
    
    if (!currentTicketId) {
        showError('Error: Ticket no identificado');
        return;
    }
    
    try {
        const response = await fetch(`/employee/ticket/${currentTicketId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Estado actualizado correctamente');
            loadTickets();
            viewTicketChat(currentTicketId);
        } else {
            showError('Error al actualizar estado: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Error al actualizar el estado');
    }
}

// Helper functions for tickets
function getCategoryLabel(category) {
    const labels = {
        'consulta': 'Consulta',
        'soporte_tecnico': 'Soporte Tecnico',
        'reclamo': 'Reclamo',
        'sugerencia': 'Sugerencia'
    };
    return labels[category] || category;
}

function getPriorityBadge(priority) {
    const badges = {
        'low': '<span class="badge badge-priority-low">Baja</span>',
        'medium': '<span class="badge badge-priority-medium">Media</span>',
        'high': '<span class="badge badge-priority-high">Alta</span>',
        'urgent': '<span class="badge badge-priority-urgent">Urgente</span>'
    };
    return badges[priority] || priority;
}

function getStatusBadge(status) {
    const badges = {
        'open': '<span class="badge badge-status-open">Abierto</span>',
        'in_progress': '<span class="badge badge-status-inprogress">En Proceso</span>',
        'resolved': '<span class="badge badge-status-resolved">Resuelto</span>',
        'closed': '<span class="badge badge-status-closed">Cerrado</span>'
    };
    return badges[status] || status;
}
// GLOBAL HELPER FUNCTIONS
// ============================

function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    // Crear notificación de éxito
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    // Crear notificación de error
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== FUNCIONES DE POLLING EN TIEMPO REAL ====================

// Iniciar polling para actualizar mensajes del chat en tiempo real
function startChatPolling() {
    // Detener cualquier polling anterior
    stopChatPolling();
    
    // Actualizar cada 3 segundos
    chatPollingInterval = setInterval(async () => {
        if (currentTicketId) {
            await loadTicketMessagesUpdate(currentTicketId);
        }
    }, 3000);
}

// Detener polling de mensajes
function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// Iniciar polling para actualizar lista de tickets
function startTicketsPolling() {
    // Actualizar cada 30 segundos
    ticketsPollingInterval = setInterval(async () => {
        // Solo actualizar si estamos en la sección de tickets
        const ticketsSection = document.getElementById('section-tickets');
        if (ticketsSection && ticketsSection.style.display !== 'none') {
            await loadTickets(true);
        }
    }, 30000);
}

// Detener polling de tickets
function stopTicketsPolling() {
    if (ticketsPollingInterval) {
        clearInterval(ticketsPollingInterval);
        ticketsPollingInterval = null;
    }
}

// Cargar mensajes del ticket (para polling silencioso)
async function loadTicketMessagesUpdate(ticketId) {
    try {
        const response = await fetch(`/employee/ticket/${ticketId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            const newMessageCount = data.messages ? data.messages.length + 1 : 1; // +1 for initial ticket message
            
            // Solo actualizar si hay nuevos mensajes
            if (lastMessageCount > 0 && newMessageCount > lastMessageCount) {
                // Actualizar el modal con los nuevos mensajes
                updateChatMessages(data.ticket, data.messages);
                showNewMessageIndicator();
            }
            
            lastMessageCount = newMessageCount;
        }
    } catch (error) {
        console.error('Error loading ticket messages:', error);
    }
}

// Actualizar solo los mensajes del chat (sin recargar todo el modal)
function updateChatMessages(ticket, messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    let html = '';
    
    // Initial ticket message
    html += '<div class="chat-message client-message">';
    html += `<div class="message-header"><strong>${ticket.user_name || 'Cliente'}</strong> <span class="message-time">${formatDateTime(ticket.created_at)}</span></div>`;
    html += `<div class="message-body">${ticket.message}</div>`;
    html += '</div>';
    
    // Subsequent messages
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const isEmployee = msg.user_id !== ticket.user_id;
            const messageClass = isEmployee ? 'employee-message' : 'client-message';
            const internalBadge = msg.is_internal ? '<span class="internal-badge">Nota interna</span>' : '';
            
            html += `<div class="chat-message ${messageClass}">`;
            html += `<div class="message-header"><strong>${msg.user_name || 'Usuario'}</strong> ${internalBadge} <span class="message-time">${formatDateTime(msg.created_at)}</span></div>`;
            html += `<div class="message-body">${msg.message}</div>`;
            html += '</div>';
        });
    }
    
    chatMessages.innerHTML = html;
    
    // Auto-scroll al último mensaje
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Mostrar indicador sutil de nuevo mensaje
function showNewMessageIndicator() {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        z-index: 9999;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease-out;
    `;
    indicator.innerHTML = '<i class="fas fa-comment-dots"></i> Nuevo mensaje recibido';
    
    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => indicator.remove(), 300);
    }, 3000);
}

// Agregar animaciones para el indicador
const newMessageStyle = document.createElement('style');
newMessageStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(newMessageStyle);

// ==================== ACTUALIZACIÓN DE BADGES DEL SIDEBAR ====================

// Actualizar todos los badges del sidebar con datos reales
async function updateSidebarBadges() {
    console.log('🔄 Actualizando badges del sidebar...');
    try {
        // Cargar datos de tareas
        const tasksResponse = await fetch('/employee/tasks-data');
        if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            console.log('📋 Tasks data:', tasksData);
            if (tasksData.success && tasksData.stats) {
                // Mostrar solo tareas pendientes
                console.log('✅ Tareas pendientes:', tasksData.stats.pending);
                updateBadgeById('tasks-badge', tasksData.stats.pending || 0);
            }
        }

        // Cargar datos de pedidos
        const ordersResponse = await fetch('/employee/orders-data');
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            console.log('🛒 Orders data:', ordersData);
            if (ordersData.success && ordersData.stats) {
                // Mostrar solo pedidos pendientes
                console.log('✅ Pedidos pendientes:', ordersData.stats.pending);
                updateBadgeById('orders-badge', ordersData.stats.pending || 0);
            }
        }

        // Cargar datos de clientes
        const customersResponse = await fetch('/employee/customers-data');
        if (customersResponse.ok) {
            const customersData = await customersResponse.json();
            console.log('👥 Customers data:', customersData);
            if (customersData.success && customersData.stats) {
                // Mostrar total de clientes
                console.log('✅ Total clientes:', customersData.stats.total_customers);
                updateBadgeById('customers-badge', customersData.stats.total_customers || 0);
            }
        }

        // Cargar datos de tickets
        const ticketsResponse = await fetch('/employee/tickets-data');
        if (ticketsResponse.ok) {
            const ticketsData = await ticketsResponse.json();
            console.log('🎧 Tickets data:', ticketsData);
            if (ticketsData.success && ticketsData.stats) {
                // Mostrar solo tickets abiertos (usa open_tickets, no open)
                console.log('✅ Tickets abiertos:', ticketsData.stats.open_tickets);
                updateBadgeById('tickets-badge', ticketsData.stats.open_tickets || 0);
            }
        }
        
        console.log('✅ Badges actualizados correctamente');
    } catch (error) {
        console.error('❌ Error updating sidebar badges:', error);
    }
}

// Actualizar un badge por su ID
function updateBadgeById(badgeId, count) {
    console.log(`🏷️ Intentando actualizar badge: ${badgeId} con valor: ${count}`);
    let badgeElement = document.getElementById(badgeId);
    
    // Si no se encuentra por ID, buscar por posición como fallback
    if (!badgeElement) {
        console.warn(`⚠️ Badge ${badgeId} no encontrado por ID, buscando alternativa...`);
        
        // Buscar badges por posición en el sidebar
        const allBadges = document.querySelectorAll('.sidebar .badge');
        console.log(`🔍 Badges encontrados en sidebar:`, allBadges.length);
        
        if (badgeId === 'tasks-badge' && allBadges[0]) {
            badgeElement = allBadges[0];
            badgeElement.id = 'tasks-badge'; // Asignar ID
            console.log('📌 Asignado ID a tasks-badge');
        } else if (badgeId === 'orders-badge' && allBadges[1]) {
            badgeElement = allBadges[1];
            badgeElement.id = 'orders-badge'; // Asignar ID
            console.log('📌 Asignado ID a orders-badge');
        } else if (badgeId === 'customers-badge' && allBadges[2]) {
            badgeElement = allBadges[2];
            badgeElement.id = 'customers-badge'; // Asignar ID
            console.log('📌 Asignado ID a customers-badge');
        } else if (badgeId === 'tickets-badge' && allBadges[3]) {
            badgeElement = allBadges[3];
            badgeElement.id = 'tickets-badge'; // Asignar ID
            console.log('📌 Asignado ID a tickets-badge');
        }
    }
    
    if (badgeElement) {
        console.log(`✅ Badge ${badgeId} encontrado, actualizando...`);
        badgeElement.textContent = count;
        // Mostrar badge solo si count > 0
        if (count > 0) {
            badgeElement.style.display = 'inline-block';
            badgeElement.style.visibility = 'visible';
            console.log(`👁️ Badge ${badgeId} visible con valor: ${count}`);
        } else {
            badgeElement.style.display = 'none';
            console.log(`🙈 Badge ${badgeId} oculto (count = 0)`);
        }
    } else {
        console.error(`❌ ERROR: Badge element NO encontrado: ${badgeId}`);
        console.log('🔍 Todos los elementos con clase "badge":', document.querySelectorAll('.badge'));
    }
}