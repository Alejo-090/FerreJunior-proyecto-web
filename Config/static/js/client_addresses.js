let addresses = [];
let editingAddress = null;

// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Load addresses
function loadAddresses() {
    const addressesSection = document.getElementById('addresses-section');
    addressesSection.innerHTML = '<div class="loading">Cargando direcciones...</div>';

    fetch('/client/addresses-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addresses = data.addresses;
                renderAddresses();
            } else {
                showError('Error al cargar direcciones');
            }
        })
        .catch(error => {
            console.error('Error loading addresses:', error);
            showError('Error de conexión');
        });
}

function renderAddresses() {
    const addressesSection = document.getElementById('addresses-section');

    if (addresses.length === 0) {
        addressesSection.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <h3>No tienes direcciones guardadas</h3>
                <p>Agrega tu primera dirección para facilitar tus compras</p>
                <button class="btn-primary" onclick="openAddModal()" style="padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-plus"></i> Agregar Dirección
                </button>
            </div>
        `;
        return;
    }

    const addressesHtml = addresses.map(address => {
        const typeText = getTypeText(address.type);
        const isDefault = address.is_default;

        return `
            <div class="address-card${isDefault ? ' default' : ''}">
                <div class="address-header">
                    <div class="address-type">
                        <i class="fas fa-${getTypeIcon(address.type)}"></i>
                        ${typeText}
                        ${isDefault ? '<span class="default-badge">Predeterminada</span>' : ''}
                    </div>
                    <div class="address-actions">
                        <button class="btn-action btn-edit" onclick="editAddress(${address.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!isDefault ? `
                            <button class="btn-action btn-set-default" onclick="setAsDefault(${address.id})">
                                <i class="fas fa-star"></i>
                            </button>
                        ` : ''}
                        <button class="btn-action btn-delete" onclick="deleteAddress(${address.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="address-content">
                    <div class="address-line"><strong>${address.recipient_name}</strong></div>
                    <div class="address-line">${address.street}</div>
                    <div class="address-line">${address.city}, ${address.state} ${address.postal_code}</div>
                    <div class="address-line">${address.country}</div>
                    ${address.phone ? `<div class="address-line"><i class="fas fa-phone"></i> ${address.phone}</div>` : ''}
                    ${address.delivery_instructions ? `<div class="address-line"><i class="fas fa-info-circle"></i> ${address.delivery_instructions}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    const addCardHtml = `
        <div class="add-address-card" onclick="openAddModal()">
            <div class="add-icon">
                <i class="fas fa-plus"></i>
            </div>
            <div class="add-text">Agregar Dirección</div>
            <div class="add-subtext">Agrega una nueva dirección de envío</div>
        </div>
    `;

    addressesSection.innerHTML = addressesHtml + addCardHtml;
}

function getTypeText(type) {
    const types = {
        'home': 'Casa',
        'work': 'Trabajo',
        'other': 'Otro'
    };
    return types[type] || 'Otro';
}

function getTypeIcon(type) {
    const icons = {
        'home': 'home',
        'work': 'building',
        'other': 'map-marker-alt'
    };
    return icons[type] || 'map-marker-alt';
}

function openAddModal() {
    editingAddress = null;
    document.getElementById('modalTitle').textContent = 'Agregar Dirección';
    document.getElementById('submitBtn').textContent = 'Guardar Dirección';
    document.getElementById('addressForm').reset();
    document.getElementById('addressId').value = '';
    document.getElementById('addressModal').classList.add('show');
}

function editAddress(id) {
    const address = addresses.find(a => a.id === id);
    if (!address) return;

    editingAddress = address;
    document.getElementById('modalTitle').textContent = 'Editar Dirección';
    document.getElementById('submitBtn').textContent = 'Actualizar Dirección';

    // Fill form
    document.getElementById('addressId').value = address.id;
    document.getElementById('addressType').value = address.type;
    document.getElementById('recipientName').value = address.recipient_name;
    document.getElementById('phone').value = address.phone || '';
    document.getElementById('street').value = address.street;
    document.getElementById('city').value = address.city;
    document.getElementById('state').value = address.state;
    document.getElementById('postalCode').value = address.postal_code;
    document.getElementById('country').value = address.country;
    document.getElementById('instructions').value = address.delivery_instructions || '';
    document.getElementById('isDefault').checked = address.is_default;

    document.getElementById('addressModal').classList.add('show');
}

function closeModal() {
    document.getElementById('addressModal').classList.remove('show');
    document.getElementById('addressForm').reset();
    editingAddress = null;
}

function setAsDefault(id) {
    if (confirm('¿Quieres establecer esta dirección como predeterminada?')) {
        fetch(`/client/addresses/${id}/set-default`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadAddresses();
                showNotification('Dirección predeterminada actualizada', 'success');
            } else {
                showNotification('Error al actualizar dirección predeterminada', 'error');
            }
        })
        .catch(error => {
            console.error('Error setting default address:', error);
            showNotification('Error de conexión', 'error');
        });
    }
}

function deleteAddress(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
        fetch(`/client/addresses/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadAddresses();
                showNotification('Dirección eliminada exitosamente', 'success');
            } else {
                showNotification('Error al eliminar dirección', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting address:', error);
            showNotification('Error de conexión', 'error');
        });
    }
}

function showError(message) {
    const addressesSection = document.getElementById('addresses-section');
    addressesSection.innerHTML = `<div class="error-message">${message}</div>`;
}

function showNotification(message, type = 'success') {
    // Create notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Form submission
document.getElementById('addressForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    const formData = new FormData(this);
    const addressData = Object.fromEntries(formData.entries());

    // Convert checkbox to boolean
    addressData.is_default = formData.has('is_default');

    const isEditing = addressData.id;
    const url = isEditing ? `/client/addresses/${addressData.id}` : '/client/addresses';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            loadAddresses();
            showNotification(
                isEditing ? 'Dirección actualizada exitosamente' : 'Dirección agregada exitosamente',
                'success'
            );
        } else {
            showNotification(data.message || 'Error al guardar dirección', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving address:', error);
        showNotification('Error de conexión', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
});

// Close modal when clicking outside
document.getElementById('addressModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
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
    loadAddresses();
});