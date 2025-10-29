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
    // Mostrar modal de cambio de contraseña
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'block';
}

function enable2FA() {
    if (confirm('¿Está seguro de que desea habilitar la autenticación de dos factores?')) {
        fetch('/employee/profile/toggle-2fa', {
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

// Form submission
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // El formulario ahora se envía normalmente al servidor
    this.submit();
});

// Close user dropdown when clicking outside
window.onclick = function(event) {
    const userDropdown = document.getElementById('userDropdown');
    if (!event.target.closest('.user-info') && userDropdown.style.display === 'block') {
        userDropdown.style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
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