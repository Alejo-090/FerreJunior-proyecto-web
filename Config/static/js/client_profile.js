// Global variables to store data
let dashboardData = {};
let ordersData = [];
let addressesData = [];

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadOrdersData();
    loadAddressesData();
    loadUserProfile();

    // Add hover effects
    const cards = document.querySelectorAll('.stat-item, .security-item, .metric-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch('/client/dashboard-data');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                dashboardData = data;
                updateDashboardStats();
            } else {
                console.error('Error en respuesta del dashboard:', data.error);
                showErrorMessage('Error al cargar estadísticas: ' + (data.error || 'Error desconocido'));
            }
        } else if (response.status === 401) {
            showErrorMessage('Sesión expirada. Redirigiendo al login...');
            setTimeout(() => window.location.href = '/auth/login', 2000);
        } else {
            console.error('Error loading dashboard data:', response.status, response.statusText);
            showErrorMessage('Error al cargar estadísticas del dashboard');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Error de conexión al cargar estadísticas');
    }
}

// Load orders data
async function loadOrdersData() {
    try {
        const response = await fetch('/client/orders-data');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                ordersData = data.orders || [];
                updateOrdersDisplay();
                updateActivityFeed();
            } else {
                console.error('Error en respuesta de pedidos:', data.error);
                showOrdersError('Error al cargar pedidos: ' + (data.error || 'Error desconocido'));
            }
        } else if (response.status === 401) {
            showOrdersError('Sesión expirada. Redirigiendo al login...');
            setTimeout(() => window.location.href = '/auth/login', 2000);
        } else {
            console.error('Error loading orders data:', response.status, response.statusText);
            showOrdersError('Error al cargar el historial de pedidos');
        }
    } catch (error) {
        console.error('Error loading orders data:', error);
        showOrdersError('Error de conexión al cargar pedidos');
    }
}

// Load addresses data
async function loadAddressesData() {
    try {
        const response = await fetch('/client/addresses-data');
        if (response.ok) {
            const data = await response.json();
            addressesData = data.addresses || [];
            updateAddressesDisplay();
        } else {
            console.error('Error loading addresses data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading addresses data:', error);
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await fetch('/client/profile-data');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile) {
                populateProfileForm(data.profile);
            }
        } else {
            console.error('Error loading profile data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Update dashboard statistics in sidebar
function updateDashboardStats() {
    if (dashboardData.stats) {
        const stats = dashboardData.stats;

        // Update sidebar stats
        document.getElementById('total-orders').textContent = stats.total_orders || 0;
        document.getElementById('total-spent').textContent = typeof formatCOP === 'function' ? formatCOP(stats.total_spent || 0) : '$' + (stats.total_spent || 0).toLocaleString();
        document.getElementById('rating').textContent = stats.rating || 'N/A';
        document.getElementById('days-active').textContent = stats.days_active || 0;

        // Update sidebar orders badge
        const ordersBadge = document.getElementById('orders-badge');
        if (ordersBadge) {
            ordersBadge.textContent = stats.total_orders || 0;
        }

        // Update purchases tab metrics
        document.getElementById('metric-total-orders').textContent = stats.total_orders || 0;
        document.getElementById('metric-total-spent').textContent = typeof formatCOP === 'function' ? formatCOP(stats.total_spent || 0) : '$' + (stats.total_spent || 0).toLocaleString();
        document.getElementById('metric-rating').textContent = stats.rating || 'N/A';
        document.getElementById('metric-satisfaction').textContent = `${stats.satisfaction || 0}%`;
    }
}

// Update orders display in purchases tab
function updateOrdersDisplay() {
    const ordersContainer = document.getElementById('recent-orders-container');
    if (!ordersContainer) return;

    let ordersHtml = '<h4 style="margin-bottom: 20px;">Últimos Pedidos</h4>';

    if (ordersData.length === 0) {
        ordersHtml += '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; color: #64748b;">No tienes pedidos registrados aún.</div>';
    } else {
        const recentOrders = ordersData.slice(0, 5); // Show last 5 orders

        recentOrders.forEach(order => {
            const statusColor = getStatusColor(order.status);
            const formattedDate = new Date(order.created_at).toLocaleDateString('es-ES');

            ordersHtml += `
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600;">Pedido #${order.id} - ${order.items_count || 0} productos</span>
                        <span style="color: ${statusColor}; font-weight: 600;">${order.status}</span>
                    </div>
                    <div style="color: #64748b; font-size: 14px;">
                        Fecha: ${formattedDate} | Total: ${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}
                    </div>
                </div>
            `;
        });
    }

    ordersContainer.innerHTML = ordersHtml;
}

// Update activity feed based on orders
function updateActivityFeed() {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;

    let activityHtml = '';

    if (ordersData.length === 0) {
        // Default welcome activity
        activityHtml = `
            <div class="activity-item">
                <div class="activity-icon" style="background: #f3e8ff; color: #8b5cf6;">
                    <i class="fas fa-user-edit"></i>
                </div>
                <div class="activity-content">
                    <h4>Bienvenido a FerreJunior</h4>
                    <p>Tu cuenta ha sido creada exitosamente</p>
                    <span class="activity-time">Recientemente</span>
                </div>
            </div>
        `;
    } else {
        // Create activities from recent orders
        const recentOrders = ordersData.slice(0, 5);

        recentOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            const timeAgo = getTimeAgo(orderDate);

            let iconClass = 'fas fa-shopping-cart';
            let iconBg = '#f0fdf4';
            let iconColor = '#22c55e';
            let activityTitle = 'Pedido realizado';
                let activityDesc = `Realizaste un pedido por ${typeof formatCOP === 'function' ? formatCOP(order.total_amount) : '$' + (order.total_amount || 0).toLocaleString()}`;

            if (order.status === 'delivered') {
                iconClass = 'fas fa-truck';
                iconBg = '#fff7ed';
                iconColor = '#f59e0b';
                activityTitle = 'Pedido entregado';
                activityDesc = `Tu pedido #${order.id} ha sido entregado exitosamente`;
            } else if (order.status === 'shipped') {
                iconClass = 'fas fa-truck';
                iconBg = '#fff7ed';
                iconColor = '#f59e0b';
                activityTitle = 'Pedido enviado';
                activityDesc = `Tu pedido #${order.id} está en camino`;
            } else if (order.status === 'confirmed') {
                iconClass = 'fas fa-check-circle';
                iconBg = '#f0fdf4';
                iconColor = '#22c55e';
                activityTitle = 'Pedido confirmado';
                activityDesc = `Tu pedido #${order.id} ha sido confirmado`;
            }

            activityHtml += `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${iconBg}; color: ${iconColor};">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activityTitle}</h4>
                        <p>${activityDesc}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        });
    }

    activityFeed.innerHTML = activityHtml;
}

// Update addresses display
function updateAddressesDisplay() {
    // This would be used if we add an addresses tab or section
    // For now, addresses are handled in the separate addresses template
}

// Populate profile form with user data
function populateProfileForm(profileData) {
    const form = document.getElementById('profileForm');
    if (!form || !profileData) return;

    // Populate form fields with available data
    const fields = ['name', 'email'];
    fields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && profileData[field]) {
            input.value = profileData[field];
        }
    });

    // Set role (readonly field)
    const roleInput = form.querySelector('input[readonly]');
    if (roleInput && profileData.role) {
        roleInput.value = profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1);
    }

    // Set registration date
    const dateInput = form.querySelector('input[type="text"][readonly]');
    if (dateInput && profileData.created_at) {
        const date = new Date(profileData.created_at);
        dateInput.value = date.toLocaleDateString('es-ES');
    }

    // Note: Additional fields like phone, address, etc. would need to be stored in user profile
    // For now, they remain empty and can be filled by the user
}

// Helper function to get status color
function getStatusColor(status) {
    const statusColors = {
        'pending': '#f59e0b',
        'confirmed': '#3b82f6',
        'shipped': '#f59e0b',
        'delivered': '#10b981',
        'cancelled': '#ef4444'
    };
    return statusColors[status] || '#64748b';
}

// Helper function to show error messages
function showErrorMessage(message) {
    // You can implement a toast notification system here
    console.warn('Error:', message);
    // For now, we'll just log to console, but you could show a toast or alert
}

// Helper function to show orders error
function showOrdersError(message) {
    const ordersContainer = document.getElementById('recent-orders-container');
    if (ordersContainer) {
        ordersContainer.innerHTML = `
            <h4 style="margin-bottom: 20px;">Últimos Pedidos</h4>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; text-align: center; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>
                ${message}
                <br><small style="color: #7f1d1d; margin-top: 10px; display: block;">
                    Verifica tu conexión a internet o intenta recargar la página.
                </small>
            </div>
        `;
    }
}

// Helper function to get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('es-ES');
    }
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById('tab-' + tabName).classList.add('active');

    // Add active class to clicked tab button
    event.target.classList.add('active');
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Profile actions
function changePassword() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'block';
}

function enable2FA() {
    if (confirm('¿Está seguro de que desea habilitar la autenticación de dos factores?')) {
        fetch('/client/profile/toggle-2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => {
            if (response.ok) {
                location.reload();
            }
        });
    }
}

function managePaymentMethods() {
    alert('Funcionalidad de gestión de métodos de pago próximamente disponible');
}

// Form submission with validation
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Basic validation
    const name = this.querySelector('[name="name"]').value.trim();
    const email = this.querySelector('[name="email"]').value.trim();

    if (!name) {
        alert('Por favor ingresa tu nombre completo');
        return;
    }

    if (!email) {
        alert('Por favor ingresa tu email');
        return;
    }

    // Collect form data
    const formData = {
        name: name,
        email: email
    };

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    try {
        // Send data to server
        const response = await fetch('/client/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Perfil actualizado exitosamente');
            // Reload profile data
            loadUserProfile();
        } else {
            alert('Error al actualizar el perfil: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el perfil. Por favor intenta nuevamente.');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Password form submission
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const currentPassword = this.querySelector('#current_password').value;
    const newPassword = this.querySelector('#new_password').value;
    const confirmPassword = this.querySelector('#confirm_password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    if (newPassword.length < 6) {
        alert('La nueva contraseña debe tener al menos 6 caracteres');
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
    submitBtn.disabled = true;

    try {
        // Send data to server
        const response = await fetch('/client/profile/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Contraseña cambiada exitosamente');
            this.reset();
            document.getElementById('passwordModal').style.display = 'none';
        } else {
            alert('Error al cambiar la contraseña: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar la contraseña. Por favor intenta nuevamente.');
    } finally {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
    });
}

// Close user dropdown when clicking outside
window.onclick = function(event) {
    const userDropdown = document.getElementById('userDropdown');
    if (!event.target.closest('.user-info') && userDropdown.style.display === 'block') {
        userDropdown.style.display = 'none';
    }
}