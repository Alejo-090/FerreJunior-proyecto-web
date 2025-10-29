// Employee Dashboard JavaScript

// Section navigation
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
    document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');

    // Update breadcrumb
    document.getElementById('currentSection').textContent = capitalizeFirst(sectionName);

    // Load section-specific data
    if (sectionName === 'tasks') {
        loadTasks();
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
                updateTaskStats(data.stats);
                updateTaskList(data.tasks);
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
    const statsContainer = document.getElementById('tasks-stats');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-info">
                <h3>Pendientes</h3>
                <p class="stat-number">${stats.pending}</p>
                <p class="stat-label">Tareas por completar</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
                <h3>Completadas</h3>
                <p class="stat-number">${stats.completed}</p>
                <p class="stat-label">Tareas finalizadas hoy</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
                <h3>En Progreso</h3>
                <p class="stat-number">${stats.in_progress}</p>
                <p class="stat-label">Tareas activas</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-info">
                <h3>Urgentes</h3>
                <p class="stat-number">${stats.urgent}</p>
                <p class="stat-label">Requieren atención inmediata</p>
            </div>
        </div>
    `;
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
    fetch(`/employee/task/${taskId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in_progress' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
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
    fetch(`/employee/task/${taskId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
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

function showTaskError(message) {
    const tasksContainer = document.getElementById('tasks-list');
    tasksContainer.innerHTML = `<div class="error-message">${message}</div>`;
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
});