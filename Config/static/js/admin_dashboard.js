// Section navigation with data loading
function showSection(sectionName) {
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
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Update breadcrumb
    document.getElementById('currentSection').textContent = getSectionTitle(sectionName);

    // Load data for specific sections
    loadSectionData(sectionName);
}

// Load data for sections that need it
function loadSectionData(sectionName) {
    if (sectionName === 'products') {
        loadProducts();
    } else if (sectionName === 'orders') {
        loadOrders();
    }
    // No auto-load for main sections, only when buttons are clicked
}

// Get section title for breadcrumb
function getSectionTitle(sectionName) {
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Usuarios',
        'products': 'Productos',
        'orders': 'Pedidos',
        'inventory': 'Inventario',
        'analytics': 'Analytics',
        'reports': 'Reportes',
        'settings': 'Configuración',
        'support': 'Soporte',
        'export-users': 'Exportar Usuarios',
        'low-stock': 'Stock Bajo',
        'pending-orders': 'Pedidos Pendientes',
        'completed-orders': 'Pedidos Completados',
        'report-generated': 'Reporte Generado'
    };
    return titles[sectionName] || capitalizeFirst(sectionName);
}

// Load export users data
function loadExportUsers() {
    const content = document.getElementById('export-users-content');
    content.innerHTML = '<div class="action-section"><p>Cargando datos de usuarios...</p></div>';

    fetch('/admin/export-users-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderExportUsers(data);
            } else {
                content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar datos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
            content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar datos de usuarios: ' + error.message + '</div></div>';
        });
}

// Load low stock products data
function loadLowStockProducts() {
    const content = document.getElementById('low-stock-content');
    content.innerHTML = '<div class="action-section"><p>Cargando productos con stock bajo...</p></div>';

    fetch('/admin/low-stock-products-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderLowStockProducts(data);
            } else {
                content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar productos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading low stock products:', error);
            content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar productos con stock bajo: ' + error.message + '</div></div>';
        });
}

// Load pending orders data
function loadPendingOrders() {
    const content = document.getElementById('pending-orders-content');
    content.innerHTML = '<div class="action-section"><p>Cargando pedidos pendientes...</p></div>';

    fetch('/admin/pending-orders-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderPendingOrders(data);
            } else {
                content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading pending orders:', error);
            content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos pendientes: ' + error.message + '</div></div>';
        });
}

// Load completed orders data
function loadCompletedOrders() {
    const content = document.getElementById('completed-orders-content');
    content.innerHTML = '<div class="action-section"><p>Cargando pedidos completados...</p></div>';

    fetch('/admin/completed-orders-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderCompletedOrders(data);
            } else {
                content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading completed orders:', error);
            content.innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos completados: ' + error.message + '</div></div>';
        });
}

// Render functions
function renderExportUsers(data) {
    const content = document.getElementById('export-users-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #fff0eb; color: #ff6b35;">
                    <i class="fas fa-users"></i>
                </div>
                <h3 class="section-title">Lista de Usuarios (${data.users.length})</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn secondary" onclick="showSection('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Regresar al Dashboard
                </button>
                <button class="action-btn primary" onclick="downloadUsersCSV()">
                    <i class="fas fa-download"></i>
                    Descargar CSV
                </button>
            </div>
        </div>
        <div class="action-section">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Registro</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.role || ''}</td>
                <td><span class="badge ${user.active ? 'bg-success' : 'bg-danger'}">${user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    content.innerHTML = html;
}

function renderLowStockProducts(data) {
    const content = document.getElementById('low-stock-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #fff3cd; color: #856404;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="section-title">Productos con Stock Bajo (${data.products.length})</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn secondary" onclick="showSection('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Regresar al Dashboard
                </button>
            </div>
        </div>
    `;

    if (data.products.length === 0) {
        html += `
            <div class="action-section">
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    ¡Excelente! Todos los productos tienen stock suficiente.
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="action-section">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.products.forEach(product => {
            const status = product.stock_quantity <= product.min_stock_level ? 'Crítico' : 'Bajo';
            const statusClass = status === 'Crítico' ? 'bg-danger' : 'bg-warning';

            html += `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.sku}</td>
                    <td><span class="text-danger font-weight-bold">${product.stock_quantity}</span></td>
                    <td>${product.min_stock_level}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    content.innerHTML = html;
}

function renderPendingOrders(data) {
    const content = document.getElementById('pending-orders-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #fff3cd; color: #856404;">
                    <i class="fas fa-clock"></i>
                </div>
                <h3 class="section-title">Pedidos Pendientes (${data.orders.length})</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn secondary" onclick="showSection('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Regresar al Dashboard
                </button>
            </div>
        </div>
    `;

    if (data.orders.length === 0) {
        html += `
            <div class="action-section">
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    ¡Excelente! No hay pedidos pendientes.
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="action-section">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.orders.forEach(order => {
            html += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.order_number}</td>
                    <td>${order.user_name || 'N/A'}</td>
                    <td>${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</td>
                    <td><span class="badge bg-warning">${order.status}</span></td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    content.innerHTML = html;
}

function renderCompletedOrders(data) {
    const content = document.getElementById('completed-orders-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #d4edda; color: #155724;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 class="section-title">Pedidos Completados (${data.orders.length})</h3>
        </div>
        <div class="action-buttons">
            <button class="action-btn secondary" onclick="showSection('dashboard')">
                <i class="fas fa-arrow-left"></i>
                Regresar al Dashboard
            </button>
        </div>
    </div>
`;

    if (data.orders.length === 0) {
        html += `
            <div class="action-section">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Aún no hay pedidos completados.
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="action-section">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Completado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.orders.forEach(order => {
            html += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.order_number}</td>
                    <td>${order.user_name || 'N/A'}</td>
                    <td>${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</td>
                    <td><span class="badge bg-success">${order.status}</span></td>
                    <td>${order.updated_at ? new Date(order.updated_at).toLocaleDateString() : ''}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    content.innerHTML = html;
}

// Modal functionality
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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

// Action functions for main sections
function showExportUsers() {
    showSection('export-users');
    loadExportUsers();
}

function showLowStock() {
    showSection('low-stock');
    loadLowStockProducts();
}

function showPendingOrders() {
    showSection('orders');
    // Filter will be applied after orders are loaded
    setTimeout(() => filterOrdersByStatus('pending'), 1000);
}

function showCompletedOrders() {
    showSection('orders');
    // Filter will be applied after orders are loaded
    setTimeout(() => filterOrdersByStatus('delivered'), 1000);
}

function filterOrdersByStatus(status) {
    const rows = document.querySelectorAll('#orders-list-content tbody tr');
    rows.forEach(row => {
        if (!status) {
            // Show all orders
            row.style.display = '';
            return;
        }

        const statusBadge = row.querySelector('.badge');
        if (!statusBadge) return;

        const rowStatus = statusBadge.textContent.toLowerCase().trim();

        if (status === 'pending') {
            // Show pending orders
            if (rowStatus === 'pendiente') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } else if (status === 'delivered') {
            // Show delivered and shipped orders as completed
            if (rowStatus === 'entregado' || rowStatus === 'enviado') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        } else {
            // Show all orders
            row.style.display = '';
        }
    });
}

function downloadUsersCSV() {
    window.location.href = '/admin/export-users';
}

function generateReport(type) {
    const content = document.getElementById('report-generated-content');
    content.innerHTML = '<div class="action-section"><p>Generando reporte...</p></div>';

    fetch(`/admin/generate-report/${type}`)
        .then(response => response.json())
        .then(data => {
            renderReportGenerated(data);
            showSection('report-generated');
            document.getElementById('report-title').textContent = `Reporte ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        })
        .catch(error => {
            content.innerHTML = '<div class="action-section"><p>Error al generar reporte</p></div>';
        });
}

function renderReportGenerated(data) {
    const content = document.getElementById('report-generated-content');
    const report = data.report;

    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #e7f3ff; color: #0066cc;">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <h3 class="section-title">Resumen Ejecutivo</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn secondary" onclick="showSection('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Regresar al Dashboard
                </button>
                <button class="action-btn primary" onclick="downloadReportPDF('${report.type}')">
                    <i class="fas fa-file-pdf"></i>
                    Descargar PDF
                </button>
                <button class="action-btn secondary" onclick="downloadReportExcel('${report.type}')">
                    <i class="fas fa-file-excel"></i>
                    Descargar Excel
                </button>
            </div>
        </div>

        <div class="stats-overview">
            <div class="stat-card">
                <div class="stat-content">
                    <h3>${report.total_users}</h3>
                    <p>Total de Usuarios</p>
                </div>
                <div class="stat-icon" style="background: #fff0eb; color: #ff6b35;">
                    <i class="fas fa-users"></i>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-content">
                    <h3>${report.total_products}</h3>
                    <p>Total de Productos</p>
                </div>
                <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
                    <i class="fas fa-box"></i>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-content">
                    <h3>${report.low_stock_products}</h3>
                    <p>Productos con Stock Bajo</p>
                </div>
                <div class="stat-icon" style="background: #fff3cd; color: #856404;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-content">
                    <h3>${typeof formatCOP === 'function' ? formatCOP(report.total_revenue) : '$' + (report.total_revenue || 0).toLocaleString()}</h3>
                    <p>Ingresos Totales</p>
                </div>
                <div class="stat-icon" style="background: #d4edda; color: #155724;">
                    <i class="fas fa-dollar-sign"></i>
                </div>
            </div>
        </div>

        <div class="action-section">
            <h4>Detalles del Reporte</h4>
            <p><strong>Generado el:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
            <p><strong>Pedidos Pendientes:</strong> ${report.pending_orders}</p>
            <p><strong>Pedidos Completados:</strong> ${report.completed_orders}</p>
        </div>
    `;

    content.innerHTML = html;
}

function downloadReportPDF(type) {
    window.location.href = `/admin/export-report/${type}/pdf`;
}

function downloadReportExcel(type) {
    window.location.href = `/admin/export-report/${type}/excel`;
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close user dropdown when clicking outside
    const userDropdown = document.getElementById('userDropdown');
    if (!event.target.closest('.user-info') && userDropdown.style.display === 'block') {
        userDropdown.style.display = 'none';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
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

    // Add form event listeners
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', submitProductForm);
    }

    const categoryFormElement = document.getElementById('categoryForm');
    if (categoryFormElement) {
        categoryFormElement.addEventListener('submit', submitCategoryForm);
    }

    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', submitInventoryForm);
    }

    const adjustmentForm = document.getElementById('adjustmentForm');
    if (adjustmentForm) {
        adjustmentForm.addEventListener('submit', submitAdjustmentForm);
    }

    const updateOrderStatusForm = document.getElementById('updateOrderStatusForm');
    if (updateOrderStatusForm) {
        updateOrderStatusForm.addEventListener('submit', submitOrderStatusForm);
    }

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', submitCategoryForm);
    }

    // Show dashboard section by default
    showSection('dashboard');
});

// Product management functions
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('productSubmitText');

    // Reset form
    form.reset();
    document.getElementById('productId').value = '';

    // Load categories first
    loadCategoriesForSelect().then(() => {
        if (productId) {
            // Edit mode
            title.textContent = 'Editar Producto';
            submitBtn.textContent = 'Actualizar Producto';

            // Load product data
            fetch(`/admin/product/${productId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const product = data.product;
                        document.getElementById('productId').value = product.id;
                        document.getElementById('productName').value = product.name;
                        document.getElementById('productSKU').value = product.sku;
                        document.getElementById('productPrice').value = product.price;
                        document.getElementById('productStock').value = product.stock_quantity;
                        document.getElementById('productCategory').value = product.category_id || '';
                        document.getElementById('productBrand').value = product.brand || '';
                        document.getElementById('productMinStock').value = product.min_stock_level;
                        document.getElementById('productDescription').value = product.description || '';
                    } else {
                        alert('Error al cargar datos del producto: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error loading product:', error);
                    alert('Error al cargar datos del producto');
                });
        } else {
            // Create mode
            title.textContent = 'Crear Nuevo Producto';
            submitBtn.textContent = 'Crear Producto';
        }

        modal.style.display = 'flex';
    });
}

function submitProductForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    const isEdit = productId !== '';

    const productData = {
        name: formData.get('name'),
        sku: formData.get('sku'),
        price: parseFloat(formData.get('price')),
        stock_quantity: parseInt(formData.get('stock_quantity') || 0),
        category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
        brand: formData.get('brand') || '',
        min_stock_level: parseInt(formData.get('min_stock_level') || 10),
        description: formData.get('description') || ''
    };

    const submitBtn = document.getElementById('productSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    const url = isEdit ? `/admin/product/${productId}` : '/admin/product';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal('productModal');

            // Reload products if we're in the products section
            if (document.getElementById('section-products').style.display !== 'none') {
                loadProducts();
            }

            // Update dashboard stats if needed
            updateDashboardStats();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error saving product:', error);
        alert('Error al guardar el producto');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function loadProducts() {
    const content = document.getElementById('section-products');
    // Find the content area within the products section
    const existingContent = content.querySelector('.products-list-content');
    if (existingContent) {
        existingContent.innerHTML = '<div class="action-section"><p>Cargando productos...</p></div>';
    } else {
        // Add content area if it doesn't exist
        const productsContent = document.createElement('div');
        productsContent.id = 'products-list-content';
        productsContent.className = 'products-list-content';
        productsContent.innerHTML = '<div class="action-section"><p>Cargando productos...</p></div>';
        content.appendChild(productsContent);
    }

    fetch('/admin/products-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderProductsList(data);
            } else {
                document.getElementById('products-list-content').innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar productos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            document.getElementById('products-list-content').innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar productos: ' + error.message + '</div></div>';
        });
}

function renderProductsList(data) {
    const content = document.getElementById('products-list-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #e6f7ff; color: #1890ff;">
                    <i class="fas fa-box"></i>
                </div>
                <h3 class="section-title">Lista de Productos (${data.products.length})</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn primary" onclick="openProductModal()">
                    <i class="fas fa-plus"></i>
                    Nuevo Producto
                </button>
                <button class="action-btn secondary" onclick="showLowStock()">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ver Stock Bajo
                </button>
                <button class="action-btn secondary" onclick="exportProducts()">
                    <i class="fas fa-download"></i>
                    Exportar
                </button>
            </div>
        </div>
    `;

    if (data.products.length === 0) {
        html += `
            <div class="action-section">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay productos registrados aún. <a href="#" onclick="openProductModal()">Crear el primer producto</a>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="action-section">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>SKU</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        data.products.forEach(product => {
            const stockStatus = product.is_low_stock ? 'bg-warning' : 'bg-success';
            const stockText = product.is_low_stock ? 'Stock Bajo' : 'Normal';

            html += `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <strong>${product.name}</strong>
                        ${product.brand ? `<br><small class="text-muted">${product.brand}</small>` : ''}
                    </td>
                    <td><code>${product.sku}</code></td>
                    <td>${typeof formatCOP === 'function' ? formatCOP(product.price) : '$' + (product.price || 0).toLocaleString()}</td>
                    <td>
                        <span class="badge ${stockStatus}">${product.stock_quantity}</span>
                        ${product.is_low_stock ? '<i class="fas fa-exclamation-triangle text-warning ml-1"></i>' : ''}
                    </td>
                    <td>${product.category_name || '-'}</td>
                    <td><span class="badge bg-success">Activo</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="openProductModal(${product.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteProduct(${product.id}, '${product.name}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="adjustStock(${product.id}, '${product.name}', ${product.stock_quantity})" title="Ajustar Stock">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}

function deleteProduct(productId, productName) {
    if (confirm(`¿Está seguro de que desea eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`)) {
        fetch(`/admin/product/${productId}`, {
            method: 'DELETE'
        })
        .then(async response => {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || data.message || `HTTP ${response.status}`);
                return data;
            } else {
                // non-json response (likely an HTML error page) - read as text for diagnostics
                const text = await response.text();
                throw new Error(text || `HTTP ${response.status}`);
            }
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadProducts(); // Reload the products list
                updateDashboardStats(); // Update dashboard stats
            } else {
                alert('Error: ' + (data.error || data.message || 'Respuesta inesperada'));
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            // If the error message looks like HTML, give a friendly hint
            if (typeof error.message === 'string' && error.message.trim().startsWith('<')) {
                alert('Error al eliminar el producto: el servidor devolvió una página HTML (ver consola para más detalles). Posible causa: sesión expirada o error en el servidor.');
            } else {
                alert('Error al eliminar el producto: ' + (error.message || 'Error desconocido'));
            }
        });
    }
}

function adjustStock(productId, productName, currentStock) {
    const newStock = prompt(`Ajustar stock para "${productName}"\n\nStock actual: ${currentStock}\n\nNuevo stock:`, currentStock);

    if (newStock !== null && newStock !== '') {
        const stockValue = parseInt(newStock);
        if (isNaN(stockValue) || stockValue < 0) {
            alert('Por favor ingrese un número válido mayor o igual a 0');
            return;
        }

        fetch(`/admin/product/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stock_quantity: stockValue })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadProducts(); // Reload products
                updateDashboardStats(); // Update stats
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error adjusting stock:', error);
            alert('Error al ajustar el stock');
        });
    }
}

function exportProducts() {
    // For now, just show an alert. In a real implementation, you'd create an export endpoint
    alert('Funcionalidad de exportación de productos próximamente disponible');
}

function updateDashboardStats() {
    // Update the product count in the sidebar badge
    fetch('/admin/products-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const badge = document.querySelector('[href="#products"] .badge');
                if (badge) {
                    badge.textContent = data.products.length;
                }
            }
        })
        .catch(error => console.error('Error updating stats:', error));
}

function loadCategoriesForSelect() {
    return fetch('/admin/categories-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('productCategory');
                // Clear existing options except the first one
                select.innerHTML = '<option value="">Seleccionar categoría...</option>';

                // Add categories
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            } else {
                console.error('Error loading categories:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const title = document.getElementById('categoryModalTitle');
    const submitBtn = document.getElementById('categorySubmitText');

    // Reset form
    form.reset();
    document.getElementById('categoryId').value = '';

    // Load categories for parent select
    loadCategoriesForParentSelect().then(() => {
        if (categoryId) {
            // Edit mode
            title.textContent = 'Editar Categoría';
            submitBtn.textContent = 'Actualizar Categoría';

            // Load category data
            fetch(`/admin/category/${categoryId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const category = data.category;
                        document.getElementById('categoryId').value = category.id;
                        document.getElementById('categoryName').value = category.name;
                        document.getElementById('categoryParent').value = category.parent_id || '';
                        document.getElementById('categoryDescription').value = category.description || '';
                    } else {
                        alert('Error al cargar datos de la categoría: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error loading category:', error);
                    alert('Error al cargar datos de la categoría');
                });
        } else {
            // Create mode
            title.textContent = 'Crear Nueva Categoría';
            submitBtn.textContent = 'Crear Categoría';
        }

        modal.style.display = 'flex';
    });
}

function submitCategoryForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const categoryId = formData.get('categoryId');
    const isEdit = categoryId !== '';

    const categoryData = {
        name: formData.get('name'),
        parent_id: formData.get('parent_id') ? parseInt(formData.get('parent_id')) : null,
        description: formData.get('description') || ''
    };

    const submitBtn = document.getElementById('categorySubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    const url = isEdit ? `/admin/category/${categoryId}` : '/admin/category';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal('categoryModal');

            // Reload categories in product form if needed
            if (document.getElementById('productModal').style.display !== 'none') {
                loadCategoriesForSelect();
            }
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error saving category:', error);
        alert('Error al guardar la categoría');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function loadCategoriesForParentSelect() {
    return fetch('/admin/categories-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('categoryParent');
                // Clear existing options except the first one
                select.innerHTML = '<option value="">Ninguna (Categoría principal)</option>';

                // Add categories
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            } else {
                console.error('Error loading categories for parent select:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading categories for parent select:', error);
        });
}

function openInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryForm');
    const title = document.getElementById('inventoryModalTitle');

    // Reset form
    form.reset();

    // Load products for select
    loadProductsForInventorySelect().then(() => {
        modal.style.display = 'flex';
    });
}

function openAdjustmentModal() {
    const modal = document.getElementById('adjustmentModal');
    const form = document.getElementById('adjustmentForm');
    const title = document.getElementById('adjustmentModalTitle');

    // Reset form
    form.reset();

    // Load products for select
    loadProductsForAdjustmentSelect().then(() => {
        modal.style.display = 'flex';
    });
}

function submitInventoryForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    const quantity = parseInt(formData.get('quantity'));

    if (!productId || quantity <= 0) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    const submitBtn = document.getElementById('inventorySubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    // Get current stock first
    fetch(`/admin/product/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const currentStock = data.product.stock_quantity;
                const newStock = currentStock + quantity;

                // Update stock
                return fetch(`/admin/product/${productId}/stock`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ stock_quantity: newStock })
                });
            } else {
                throw new Error(data.error);
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Stock agregado exitosamente. Nuevo stock: ${data.product.stock_quantity}`);
                closeModal('inventoryModal');

                // Reload products if we're in the products section
                if (document.getElementById('section-products').style.display !== 'none') {
                    loadProducts();
                }

                updateDashboardStats();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error adding inventory:', error);
            alert('Error al agregar stock al inventario');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function submitAdjustmentForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    const newStock = parseInt(formData.get('newStock'));
    const reason = formData.get('reason');
    const notes = formData.get('notes');

    if (!productId || newStock < 0 || !reason || !notes.trim()) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    const submitBtn = document.getElementById('adjustmentSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;

    // Update stock
    fetch(`/admin/product/${productId}/stock`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock_quantity: newStock })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Ajuste de inventario aplicado exitosamente. Nuevo stock: ${data.product.stock_quantity}`);
            closeModal('adjustmentModal');

            // Reload products if we're in the products section
            if (document.getElementById('section-products').style.display !== 'none') {
                loadProducts();
            }

            updateDashboardStats();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error adjusting inventory:', error);
        alert('Error al aplicar ajuste de inventario');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function loadProductsForInventorySelect() {
    return fetch('/admin/products-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('inventoryProductSelect');
                select.innerHTML = '<option value="">Seleccionar producto...</option>';

                data.products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (Stock actual: ${product.stock_quantity})`;
                    select.appendChild(option);
                });

                // Add event listener for product selection
                select.addEventListener('change', function() {
                    const productId = this.value;
                    if (productId) {
                        fetch(`/admin/product/${productId}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    document.getElementById('inventoryCurrentStock').value = data.product.stock_quantity;
                                }
                            })
                            .catch(error => console.error('Error loading product stock:', error));
                    } else {
                        document.getElementById('inventoryCurrentStock').value = '';
                    }
                });
            } else {
                console.error('Error loading products for inventory:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading products for inventory:', error);
        });
}

function loadProductsForAdjustmentSelect() {
    return fetch('/admin/products-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('adjustmentProductSelect');
                select.innerHTML = '<option value="">Seleccionar producto...</option>';

                data.products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (Stock actual: ${product.stock_quantity})`;
                    select.appendChild(option);
                });

                // Add event listener for product selection
                select.addEventListener('change', function() {
                    const productId = this.value;
                    if (productId) {
                        fetch(`/admin/product/${productId}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    document.getElementById('adjustmentCurrentStock').value = data.product.stock_quantity;
                                }
                            })
                            .catch(error => console.error('Error loading product stock:', error));
                    } else {
                        document.getElementById('adjustmentCurrentStock').value = '';
                    }
                });
            } else {
                console.error('Error loading products for adjustment:', data.error);
            }
        })
        .catch(error => {
            console.error('Error loading products for adjustment:', error);
        });
}

function openOrderModal(orderId = null) {
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderModalTitle');
    const detailsContent = document.getElementById('orderDetailsContent');
    const statusForm = document.getElementById('orderStatusForm');

    if (orderId) {
        // View/edit existing order
        title.textContent = 'Detalles del Pedido';
        detailsContent.style.display = 'block';
        statusForm.style.display = 'none';

        // Load order details
        fetch(`/admin/order/${orderId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderOrderDetails(data.order);
                } else {
                    detailsContent.innerHTML = '<div class="alert alert-danger">Error al cargar detalles del pedido: ' + data.error + '</div>';
                }
            })
            .catch(error => {
                console.error('Error loading order:', error);
                detailsContent.innerHTML = '<div class="alert alert-danger">Error al cargar detalles del pedido</div>';
            });
    } else {
        // Create new order - not implemented yet
        title.textContent = 'Crear Nuevo Pedido';
        detailsContent.innerHTML = '<div class="alert alert-info">Funcionalidad de creación de pedidos próximamente disponible</div>';
        statusForm.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function renderOrderDetails(order) {
    const content = document.getElementById('orderDetailsContent');

    const statusClasses = {
        'pending': 'badge-warning',
        'processing': 'badge-info',
        'shipped': 'badge-primary',
        'delivered': 'badge-success',
        'cancelled': 'badge-danger'
    };

    const statusLabels = {
        'pending': 'Pendiente',
        'processing': 'En Proceso',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };

    html = `
        <div class="order-details">
            <div class="order-header">
                <h4>Pedido #${order.order_number}</h4>
                <span class="badge ${statusClasses[order.status] || 'badge-secondary'}">${statusLabels[order.status] || order.status}</span>
            </div>

            <div class="order-info">
                <div class="info-section">
                    <h5><i class="fas fa-user"></i> Información del Cliente</h5>
                    <p><strong>Nombre:</strong> ${order.user_name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.user_email || 'N/A'}</p>
                </div>

                <div class="info-section">
                    <h5><i class="fas fa-dollar-sign"></i> Información del Pedido</h5>
                    <p><strong>Total:</strong> ${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</p>
                    <p><strong>Método de Pago:</strong> ${order.payment_method || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
                </div>

                <div class="info-section">
                    <h5><i class="fas fa-map-marker-alt"></i> Dirección de Envío</h5>
                    <p>${order.shipping_address || 'No especificada'}</p>
                </div>

                ${order.notes ? `
                <div class="info-section">
                    <h5><i class="fas fa-sticky-note"></i> Notas</h5>
                    <p>${order.notes}</p>
                </div>
                ` : ''}
            </div>

            <div class="order-actions">
                <button class="btn btn-primary" onclick="showOrderStatusForm(${order.id}, '${order.status}')">
                    <i class="fas fa-edit"></i>
                    Cambiar Estado
                </button>
                ${order.status === 'pending' ? `
                <button class="btn btn-danger" onclick="deleteOrder(${order.id}, '${order.order_number}')">
                    <i class="fas fa-trash"></i>
                    Eliminar Pedido
                </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="closeModal('orderModal')">
                    <i class="fas fa-times"></i>
                    Cerrar
                </button>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

function showOrderStatusForm(orderId, currentStatus) {
    document.getElementById('orderDetailsContent').style.display = 'none';
    document.getElementById('orderStatusForm').style.display = 'block';
    document.getElementById('statusOrderId').value = orderId;
    document.getElementById('orderStatus').value = currentStatus;
}

function cancelOrderStatusUpdate() {
    document.getElementById('orderDetailsContent').style.display = 'block';
    document.getElementById('orderStatusForm').style.display = 'none';
}

function submitOrderStatusForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const orderId = formData.get('orderId');
    const newStatus = formData.get('status');

    const submitBtn = document.getElementById('orderStatusSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;

    fetch(`/admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            // Reload order details
            openOrderModal(orderId);
            // Reload orders if we're in the orders section
            if (document.getElementById('section-orders').style.display !== 'none') {
                loadOrders();
            }
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        alert('Error al actualizar el estado del pedido');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function deleteOrder(orderId, orderNumber) {
    if (confirm(`¿Está seguro de que desea eliminar el pedido "${orderNumber}"?\n\nEsta acción no se puede deshacer.`)) {
        fetch(`/admin/order/${orderId}`, {
            method: 'DELETE'
        })
        .then(async response => {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || data.message || `HTTP ${response.status}`);
                return data;
            } else {
                const text = await response.text();
                throw new Error(text || `HTTP ${response.status}`);
            }
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                closeModal('orderModal');
                // Reload orders if we're in the orders section
                if (document.getElementById('section-orders').style.display !== 'none') {
                    loadOrders();
                }
                updateDashboardStats();
            } else {
                alert('Error: ' + (data.error || data.message || 'Respuesta inesperada'));
            }
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            if (typeof error.message === 'string' && error.message.trim().startsWith('<')) {
                alert('Error al eliminar el pedido: el servidor devolvió una página HTML (ver consola para más detalles). Posible causa: sesión expirada o error en el servidor.');
            } else {
                alert('Error al eliminar el pedido: ' + (error.message || 'Error desconocido'));
            }
        });
    }
}

function loadOrders() {
    const content = document.getElementById('section-orders');
    // Find the content area within the orders section
    const existingContent = content.querySelector('.orders-list-content');
    if (existingContent) {
        existingContent.innerHTML = '<div class="action-section"><p>Cargando pedidos...</p></div>';
    } else {
        // Add content area if it doesn't exist
        const ordersContent = document.createElement('div');
        ordersContent.id = 'orders-list-content';
        ordersContent.className = 'orders-list-content';
        ordersContent.innerHTML = '<div class="action-section"><p>Cargando pedidos...</p></div>';
        content.appendChild(ordersContent);
    }

    fetch('/admin/orders-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                renderOrdersList(data);
            } else {
                document.getElementById('orders-list-content').innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos: ' + data.error + '</div></div>';
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            document.getElementById('orders-list-content').innerHTML = '<div class="action-section"><div class="alert alert-danger">Error al cargar pedidos: ' + error.message + '</div></div>';
        });
}

function renderOrdersList(data) {
    const content = document.getElementById('orders-list-content');
    let html = `
        <div class="action-section">
            <div class="section-header">
                <div class="section-icon" style="background: #f0f9ff; color: #0ea5e9;">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3 class="section-title">Lista de Pedidos (${data.orders.length})</h3>
            </div>
            <div class="action-buttons">
                <button class="action-btn primary" onclick="loadOrders()">
                    <i class="fas fa-list"></i>
                    Ver Todos
                </button>
                <button class="action-btn secondary" onclick="showPendingOrders()">
                    <i class="fas fa-clock"></i>
                    Ver Pendientes
                </button>
                <button class="action-btn secondary" onclick="showCompletedOrders()">
                    <i class="fas fa-check"></i>
                    Ver Completados
                </button>
            </div>
        </div>
    `;

    if (data.orders.length === 0) {
        html += `
            <div class="action-section">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay pedidos registrados aún.
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="action-section">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        data.orders.forEach(order => {
            const statusClasses = {
                'pending': 'bg-warning',
                'processing': 'bg-info',
                'shipped': 'bg-primary',
                'delivered': 'bg-success',
                'cancelled': 'bg-danger'
            };

            const statusLabels = {
                'pending': 'Pendiente',
                'processing': 'En Proceso',
                'shipped': 'Enviado',
                'delivered': 'Entregado',
                'cancelled': 'Cancelado'
            };

            html += `
                <tr>
                    <td>${order.id}</td>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.user_name || 'N/A'}</td>
                    <td>${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}</td>
                    <td><span class="badge ${statusClasses[order.status] || 'bg-secondary'}">${statusLabels[order.status] || order.status}</span></td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="openOrderModal(${order.id})" title="Ver Detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="showOrderStatusForm(${order.id}, '${order.status}')" title="Cambiar Estado">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}