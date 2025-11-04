// Global variables to store data
let dashboardData = {};
let ordersData = [];
let addressesData = [];
let ticketsData = [];
let currentTicketId = null;
let chatPollingInterval = null;
let ticketsPollingInterval = null;
let lastMessageCount = 0;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadOrdersData();
    loadAddressesData();
    loadUserProfile();
    loadTicketsData();

    // Iniciar polling para actualizar lista de tickets cada 30 segundos
    startTicketsPolling();

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

    // Setup form handlers
    setupTicketFormHandlers();
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
    const tabContent = document.getElementById('tab-' + tabName);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Add active class to clicked tab button
    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.toLowerCase().includes(tabName === 'support' ? 'soporte' : tabName)
    );
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    // Load tickets if support tab
    if (tabName === 'support') {
        loadTicketsData();
    }
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

    // Close modals when clicking outside
    const newTicketModal = document.getElementById('newTicketModal');
    const ticketChatModal = document.getElementById('ticketChatModal');
    
    if (event.target === newTicketModal) {
        closeNewTicketModal();
    }
    if (event.target === ticketChatModal) {
        closeTicketChatModal();
    }
}

// ==================== SUPPORT / TICKETS FUNCTIONS ====================

// Load tickets data
async function loadTicketsData(silent = false) {
    try {
        const response = await fetch('/client/tickets-data');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                ticketsData = data.tickets || [];
                updateTicketsDisplay();
                updateTicketsStats();
            } else if (!silent) {
                console.error('Error loading tickets:', data.error);
                showTicketsError('Error al cargar tickets: ' + (data.error || 'Error desconocido'));
            }
        } else if (response.status === 401) {
            showTicketsError('Sesión expirada. Redirigiendo al login...');
            setTimeout(() => window.location.href = '/auth/login', 2000);
        } else if (!silent) {
            console.error('Error loading tickets:', response.status);
            showTicketsError('Error al cargar tickets');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        if (!silent) {
            showTicketsError('Error de conexión al cargar tickets');
        }
    }
}

// Update tickets statistics
function updateTicketsStats() {
    const total = ticketsData.length;
    const abiertos = ticketsData.filter(t => t.status === 'open').length;
    const enProceso = ticketsData.filter(t => t.status === 'in_progress').length;
    const resueltos = ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    document.getElementById('support-total-tickets').textContent = total;
    document.getElementById('support-open-tickets').textContent = abiertos;
    document.getElementById('support-in-progress-tickets').textContent = enProceso;
    document.getElementById('support-resolved-tickets').textContent = resueltos;
}

// Update tickets display
function updateTicketsDisplay() {
    const container = document.getElementById('tickets-list-container');
    if (!container) return;

    if (ticketsData.length === 0) {
        container.innerHTML = `
            <div style="background: #f8fafc; padding: 40px; border-radius: 8px; text-align: center; color: #64748b;">
                <i class="fas fa-ticket-alt" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <h4 style="margin-bottom: 10px; color: #1e293b;">No tienes tickets aún</h4>
                <p>Crea tu primer ticket para contactar con soporte</p>
                <button class="profile-btn primary" onclick="openNewTicketModal()" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Crear Ticket
                </button>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';

    // Apply filters
    const statusFilter = document.getElementById('ticket-status-filter')?.value || '';
    const categoryFilter = document.getElementById('ticket-category-filter')?.value || '';

    const filteredTickets = ticketsData.filter(ticket => {
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
        return matchesStatus && matchesCategory;
    });

    if (filteredTickets.length === 0) {
        html += `
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center; color: #64748b;">
                <i class="fas fa-filter" style="font-size: 36px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No se encontraron tickets con los filtros aplicados</p>
            </div>
        `;
    } else {
        filteredTickets.forEach(ticket => {
            const statusBadge = getTicketStatusBadge(ticket.status);
            const priorityBadge = getTicketPriorityBadge(ticket.priority);
            const categoryIcon = getTicketCategoryIcon(ticket.category);
            const formattedDate = formatDateTime(ticket.created_at);
            
            // Usar 'message' en lugar de 'description' porque el modelo usa ese campo
            const description = ticket.message || '';

            html += `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.3s;" 
                     onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='#ff8559';" 
                     onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e2e8f0';"
                     onclick="openTicketChat(${ticket.id})">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="color: #ff8559; font-weight: 600; font-size: 14px;">
                                    <i class="${categoryIcon}"></i> Ticket #${ticket.id}
                                </span>
                                ${statusBadge}
                                ${priorityBadge}
                            </div>
                            <h4 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">${ticket.subject}</h4>
                            <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                        <div style="display: flex; gap: 20px; font-size: 13px; color: #64748b;">
                            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                            <span><i class="fas fa-tag"></i> ${getCategoryName(ticket.category)}</span>
                            ${ticket.assigned_employee_name ? `<span><i class="fas fa-user"></i> ${ticket.assigned_employee_name}</span>` : ''}
                        </div>
                        <button class="profile-btn secondary" style="padding: 6px 12px; font-size: 13px;" onclick="event.stopPropagation(); openTicketChat(${ticket.id})">
                            <i class="fas fa-comments"></i> Ver Chat
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

// Filter tickets
function filterTickets() {
    updateTicketsDisplay();
}

// Show tickets error
function showTicketsError(message) {
    const container = document.getElementById('tickets-list-container');
    if (container) {
        container.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; text-align: center; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>
                ${message}
            </div>
        `;
    }
}

// Open new ticket modal
function openNewTicketModal() {
    const modal = document.getElementById('newTicketModal');
    modal.style.display = 'block';
    // Reset form
    document.getElementById('newTicketForm').reset();
}

// Close new ticket modal
function closeNewTicketModal() {
    const modal = document.getElementById('newTicketModal');
    modal.style.display = 'none';
}

// Get CSRF token
async function getCSRFToken() {
    // Try to get from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        const token = metaTag.getAttribute('content');
        if (token) {
            console.log('CSRF Token: Found from meta tag');
            return token;
        }
    }
    
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            console.log('CSRF Token: Found from cookie');
            return decodeURIComponent(value);
        }
    }
    
    // Get from server
    try {
        console.log('CSRF Token: Fetching from server...');
        const response = await fetch('/client/get-csrf-token');
        const data = await response.json();
        if (data.csrf_token) {
            console.log('CSRF Token: Retrieved from server');
            return data.csrf_token;
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
    
    console.log('CSRF Token: NOT FOUND');
    return '';
}

// Setup ticket form handlers
function setupTicketFormHandlers() {
    // New ticket form
    const newTicketForm = document.getElementById('newTicketForm');
    if (newTicketForm) {
        newTicketForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const subject = document.getElementById('ticket-subject').value.trim();
            const category = document.getElementById('ticket-category').value;
            const priority = document.getElementById('ticket-priority').value;
            const description = document.getElementById('ticket-description').value.trim();

            console.log('Creating ticket:', { subject, category, priority, description });

            if (!subject || !category || !description) {
                alert('Por favor completa todos los campos requeridos');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
            submitBtn.disabled = true;

            try {
                const csrfToken = await getCSRFToken();
                console.log('Sending request to /client/tickets/create');
                
                const response = await fetch('/client/tickets/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        subject: subject,
                        category: category,
                        priority: priority,
                        description: description
                    })
                });

                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Response data:', result);

                if (result.success) {
                    closeNewTicketModal();
                    loadTicketsData();
                    showNotification('Ticket creado exitosamente', 'success');
                } else {
                    alert('Error al crear ticket: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al crear el ticket. Por favor intenta nuevamente.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // New message form
    const newMessageForm = document.getElementById('newMessageForm');
    if (newMessageForm) {
        newMessageForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const content = document.getElementById('message-content').value.trim();

            if (!content || !currentTicketId) {
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const csrfToken = await getCSRFToken();
                const response = await fetch(`/client/tickets/${currentTicketId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        content: content
                    })
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('message-content').value = '';
                    loadTicketMessages(currentTicketId);
                } else {
                    alert('Error al enviar mensaje: ' + (result.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Open ticket chat
async function openTicketChat(ticketId) {
    currentTicketId = ticketId;
    const modal = document.getElementById('ticketChatModal');
    modal.style.display = 'block';

    // Find ticket data
    const ticket = ticketsData.find(t => t.id === ticketId);
    if (ticket) {
        document.getElementById('chat-ticket-id').textContent = ticket.id;
        document.getElementById('chat-ticket-subject').innerHTML = `Ticket #${ticket.id}: ${ticket.subject}`;
        document.getElementById('chat-ticket-status').innerHTML = `${getTicketStatusBadge(ticket.status)} ${getTicketPriorityBadge(ticket.priority)}`;
    }

    // Load messages
    await loadTicketMessages(ticketId);
    
    // Iniciar polling para nuevos mensajes cada 3 segundos
    startChatPolling();
}

// Close ticket chat modal
function closeTicketChatModal() {
    const modal = document.getElementById('ticketChatModal');
    modal.style.display = 'none';
    currentTicketId = null;
    
    // Detener polling cuando se cierra el chat
    stopChatPolling();
}

// Load ticket messages
async function loadTicketMessages(ticketId, silent = false) {
    const container = document.getElementById('ticket-messages-container');
    if (!container) return;

    // Solo mostrar "Cargando..." en la primera carga, no en polling
    if (!silent) {
        container.innerHTML = '<div style="text-align: center; color: #64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes...</div>';
    }

    try {
        const response = await fetch(`/client/tickets/${ticketId}/messages`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const newMessageCount = data.messages ? data.messages.length : 0;
                const hadPreviousMessages = lastMessageCount > 0;
                
                // Solo actualizar si hay cambios o es la primera carga
                if (!silent || newMessageCount !== lastMessageCount) {
                    displayTicketMessages(data.messages || []);
                    
                    // Mostrar notificación solo si hay nuevos mensajes en polling
                    if (silent && hadPreviousMessages && newMessageCount > lastMessageCount) {
                        showNewMessageIndicator();
                    }
                    
                    lastMessageCount = newMessageCount;
                    
                    // Auto-scroll al último mensaje
                    setTimeout(() => {
                        const messagesContainer = document.getElementById('ticket-messages-container');
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    }, 100);
                }
            } else if (!silent) {
                container.innerHTML = '<div style="text-align: center; color: #dc2626;">Error al cargar mensajes</div>';
            }
        } else if (!silent) {
            container.innerHTML = '<div style="text-align: center; color: #dc2626;">Error al cargar mensajes</div>';
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        if (!silent) {
            container.innerHTML = '<div style="text-align: center; color: #dc2626;">Error de conexión</div>';
        }
    }
}

// Display ticket messages
function displayTicketMessages(messages) {
    const container = document.getElementById('ticket-messages-container');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 40px;">
                <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No hay mensajes aún. Envía el primer mensaje.</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';

    messages.forEach(msg => {
        const isClient = msg.user_role === 'client' || msg.user_role === 'cliente';
        const alignStyle = isClient ? 'flex-end' : 'flex-start';
        const bgColor = isClient ? '#ff8559' : '#f1f5f9';
        const textColor = isClient ? 'white' : '#1e293b';
        const formattedDate = formatDateTime(msg.created_at);

        html += `
            <div style="display: flex; justify-content: ${alignStyle};">
                <div style="max-width: 70%; background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 12px; ${isClient ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                    <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px; ${isClient ? 'color: rgba(255,255,255,0.9);' : 'color: #64748b;'}">
                        ${msg.user_name || (isClient ? 'Tú' : 'Soporte')}
                    </div>
                    <div style="line-height: 1.5; white-space: pre-wrap;">${msg.message}</div>
                    <div style="font-size: 11px; margin-top: 6px; ${isClient ? 'color: rgba(255,255,255,0.7);' : 'color: #94a3b8;'}">
                        ${formattedDate}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Helper functions for tickets
function getTicketStatusBadge(status) {
    const badges = {
        'open': '<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Abierto</span>',
        'in_progress': '<span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">En Proceso</span>',
        'resolved': '<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Resuelto</span>',
        'closed': '<span style="background: #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Cerrado</span>'
    };
    return badges[status] || badges['open'];
}

function getTicketPriorityBadge(priority) {
    const badges = {
        'low': '<span style="background: #f3f4f6; color: #6b7280; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Baja</span>',
        'medium': '<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Media</span>',
        'high': '<span style="background: #fed7aa; color: #9a3412; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Alta</span>',
        'urgent': '<span style="background: #fecaca; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Urgente</span>'
    };
    return badges[priority] || badges['medium'];
}

function getTicketCategoryIcon(category) {
    const icons = {
        'pedido': 'fas fa-shopping-cart',
        'producto': 'fas fa-box',
        'pago': 'fas fa-credit-card',
        'envio': 'fas fa-truck',
        'devolucion': 'fas fa-undo',
        'tecnico': 'fas fa-wrench',
        'otro': 'fas fa-question-circle'
    };
    return icons[category] || icons['otro'];
}

function getCategoryName(category) {
    const names = {
        'pedido': 'Pedido',
        'producto': 'Producto',
        'pago': 'Pago',
        'envio': 'Envío',
        'devolucion': 'Devolución',
        'tecnico': 'Técnico',
        'otro': 'Otro'
    };
    return names[category] || category;
}

function formatDateTime(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Ahora';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} min`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours}h`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days}d`;
    } else {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}

function showNotification(message, type = 'success') {
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ==================== FUNCIONES DE POLLING EN TIEMPO REAL ====================

// Iniciar polling para actualizar mensajes del chat en tiempo real
function startChatPolling() {
    // Detener cualquier polling anterior
    stopChatPolling();
    
    // Actualizar cada 3 segundos
    chatPollingInterval = setInterval(async () => {
        if (currentTicketId) {
            await loadTicketMessages(currentTicketId, true);
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
        await loadTicketsData(true);
    }, 30000);
}

// Detener polling de tickets
function stopTicketsPolling() {
    if (ticketsPollingInterval) {
        clearInterval(ticketsPollingInterval);
        ticketsPollingInterval = null;
    }
}

// Mostrar indicador sutil de nuevo mensaje
function showNewMessageIndicator() {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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