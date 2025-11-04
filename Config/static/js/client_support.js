// Client Support JavaScript

let allMyTickets = [];
let currentChatTicketId = null;

// Load tickets on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMyTickets();
});

// Load my tickets
async function loadMyTickets() {
    try {
        const response = await fetch('/client/my-tickets', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            allMyTickets = data.tickets;
            displayMyTickets(allMyTickets);
        } else {
            showError('Error al cargar tickets: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showError('Error al cargar los tickets');
    }
}

// Display my tickets
function displayMyTickets(tickets) {
    const listContainer = document.getElementById('myTicketsList');
    
    if (!tickets || tickets.length === 0) {
        listContainer.innerHTML = `
            <div class="no-tickets">
                <i class="fas fa-inbox"></i>
                <p>No tienes tickets creados</p>
                <button class="btn btn-primary" onclick="showCreateTicketModal()">Crear tu primer ticket</button>
            </div>
        `;
        return;
    }

    let html = '<div class="tickets-grid">';
    
    tickets.forEach(ticket => {
        const statusBadge = getClientStatusBadge(ticket.status);
        const priorityBadge = getClientPriorityBadge(ticket.priority);
        const categoryLabel = getClientCategoryLabel(ticket.category);
        
        html += `
            <div class="ticket-card" onclick="viewTicketChat(${ticket.id})">
                <div class="ticket-card-header">
                    <h3>#${ticket.id} ${ticket.subject}</h3>
                    ${statusBadge}
                </div>
                <div class="ticket-card-body">
                    <div class="ticket-meta">
                        <span><i class="fas fa-tag"></i> ${categoryLabel}</span>
                        <span>${priorityBadge}</span>
                    </div>
                    <p class="ticket-preview">${ticket.message.substring(0, 100)}${ticket.message.length > 100 ? '...' : ''}</p>
                    <div class="ticket-footer">
                        <span class="ticket-date"><i class="fas fa-clock"></i> ${formatDateTime(ticket.created_at)}</span>
                        <span class="ticket-messages"><i class="fas fa-comments"></i> ${ticket.message_count || 0} mensajes</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    listContainer.innerHTML = html;
}

// Filter my tickets
function filterMyTickets() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = allMyTickets;
    
    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    displayMyTickets(filtered);
}

// Show create ticket modal
function showCreateTicketModal() {
    document.getElementById('createTicketModal').style.display = 'flex';
}

// Close create ticket modal
function closeCreateTicketModal() {
    document.getElementById('createTicketModal').style.display = 'none';
    document.getElementById('createTicketForm').reset();
}

// Submit new ticket
async function submitNewTicket(event) {
    event.preventDefault();
    
    const subject = document.getElementById('ticketSubject').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const message = document.getElementById('ticketMessage').value.trim();
    
    if (!subject || !category || !priority || !message) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    try {
        const response = await fetch('/client/ticket/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                subject: subject,
                category: category,
                priority: priority,
                message: message
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Ticket creado exitosamente');
            closeCreateTicketModal();
            loadMyTickets();
        } else {
            showError('Error al crear ticket: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        showError('Error al crear el ticket');
    }
}

// View ticket chat
async function viewTicketChat(ticketId) {
    currentChatTicketId = ticketId;
    
    try {
        const response = await fetch(`/client/ticket/${ticketId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showTicketChatModal(data.ticket, data.messages);
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
    const modal = document.getElementById('ticketChatModal');
    const modalBody = document.getElementById('ticketChatBody');
    
    document.getElementById('ticketChatTitle').innerHTML = `Ticket #${ticket.id} - ${ticket.subject}`;
    
    let html = '<div class="ticket-chat-container">';
    
    // Ticket info
    html += '<div class="ticket-info">';
    html += `<div><strong>Estado:</strong> ${getClientStatusBadge(ticket.status)}</div>`;
    html += `<div><strong>Categoría:</strong> ${getClientCategoryLabel(ticket.category)}</div>`;
    html += `<div><strong>Prioridad:</strong> ${getClientPriorityBadge(ticket.priority)}</div>`;
    html += `<div><strong>Fecha:</strong> ${formatDateTime(ticket.created_at)}</div>`;
    if (ticket.assigned_employee_name) {
        html += `<div><strong>Atendido por:</strong> ${ticket.assigned_employee_name}</div>`;
    }
    html += '</div>';
    
    // Messages thread
    html += '<div class="chat-messages" id="chatMessages">';
    
    // Initial ticket message
    html += '<div class="chat-message client-message">';
    html += `<div class="message-header"><strong>Tú</strong> <span class="message-time">${formatDateTime(ticket.created_at)}</span></div>`;
    html += `<div class="message-body">${ticket.message}</div>`;
    html += '</div>';
    
    // Subsequent messages (exclude internal notes)
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const isEmployee = msg.user_id !== ticket.user_id;
            const messageClass = isEmployee ? 'employee-message' : 'client-message';
            const userName = isEmployee ? (msg.user_name || 'Empleado') : 'Tú';
            
            html += `<div class="chat-message ${messageClass}">`;
            html += `<div class="message-header"><strong>${userName}</strong> <span class="message-time">${formatDateTime(msg.created_at)}</span></div>`;
            html += `<div class="message-body">${msg.message}</div>`;
            html += '</div>';
        });
    }
    
    html += '</div>';
    
    // Message input (only if ticket is not closed)
    if (ticket.status !== 'closed') {
        html += '<div class="chat-input-container">';
        html += '<textarea id="clientMessageInput" class="form-control" placeholder="Escribe tu respuesta..." rows="3"></textarea>';
        html += '<button class="btn btn-primary" onclick="sendClientMessage()" style="margin-top: 10px;"><i class="fas fa-paper-plane"></i> Enviar</button>';
        html += '</div>';
    } else {
        html += '<div class="ticket-closed-notice"><i class="fas fa-lock"></i> Este ticket está cerrado. No se pueden enviar más mensajes.</div>';
    }
    
    html += '</div>';
    
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    
    // Scroll to bottom
    setTimeout(() => {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 100);
}

// Close ticket chat modal
function closeTicketChatModal() {
    document.getElementById('ticketChatModal').style.display = 'none';
    currentChatTicketId = null;
}

// Send client message
async function sendClientMessage() {
    const messageInput = document.getElementById('clientMessageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        showError('Por favor escribe un mensaje');
        return;
    }
    
    if (!currentChatTicketId) {
        showError('Error: Ticket no identificado');
        return;
    }
    
    try {
        const response = await fetch(`/client/ticket/${currentChatTicketId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess('Mensaje enviado');
            messageInput.value = '';
            // Reload chat
            viewTicketChat(currentChatTicketId);
        } else {
            showError('Error al enviar mensaje: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Error al enviar el mensaje');
    }
}

// Helper functions
function getClientCategoryLabel(category) {
    const labels = {
        'consulta': 'Consulta',
        'soporte_tecnico': 'Soporte Técnico',
        'reclamo': 'Reclamo',
        'sugerencia': 'Sugerencia'
    };
    return labels[category] || category;
}

function getClientPriorityBadge(priority) {
    const badges = {
        'low': '<span class="badge badge-priority-low">Baja</span>',
        'medium': '<span class="badge badge-priority-medium">Media</span>',
        'high': '<span class="badge badge-priority-high">Alta</span>',
        'urgent': '<span class="badge badge-priority-urgent">Urgente</span>'
    };
    return badges[priority] || priority;
}

function getClientStatusBadge(status) {
    const badges = {
        'open': '<span class="badge badge-status-open">Abierto</span>',
        'in_progress': '<span class="badge badge-status-inprogress">En Proceso</span>',
        'resolved': '<span class="badge badge-status-resolved">Resuelto</span>',
        'closed': '<span class="badge badge-status-closed">Cerrado</span>'
    };
    return badges[status] || status;
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

function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function showSuccess(message) {
    alert(message); // Replace with better notification system
}

function showError(message) {
    alert(message); // Replace with better notification system
}
