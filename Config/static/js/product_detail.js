// Navbar Functions
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartSidebar.classList.contains('open')) {
        // Cerrar carrito
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('show');
    } else {
        // Abrir carrito
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('show');
        // Load cart from server before rendering
        fetchCartFromServer().then(() => renderCart());
    }
}

// Fetch cart items from server and populate `cart` variable
let cart = [];
async function fetchCartFromServer() {
    try {
        const resp = await fetch('/client/cart', { credentials: 'same-origin' });
        const payload = await resp.json();
        if (payload && payload.items) {
            cart = payload.items.map(it => ({
                id: it.id,
                product_id: it.product_id,
                name: it.name,
                // prefer server-provided snapshot fields
                unit_price: (typeof it.unit_price !== 'undefined') ? Number(it.unit_price) : (typeof it.price !== 'undefined' ? Number(it.price) : 0),
                unit_price_cop: (typeof it.unit_price_cop !== 'undefined') ? Number(it.unit_price_cop) : (typeof it.price_cop !== 'undefined' ? Number(it.price_cop) : null),
                total_price: (typeof it.total_price !== 'undefined') ? Number(it.total_price) : null,
                total_price_cop: (typeof it.total_price_cop !== 'undefined') ? Number(it.total_price_cop) : null,
                quantity: it.quantity,
                image: it.product && it.product.image ? it.product.image : `https://via.placeholder.com/64x64/ff6b35/white?text=${encodeURIComponent(it.name)}`
            }));
        } else {
            cart = [];
        }
    } catch (e) {
        console.error('Error cargando carrito:', e);
        cart = [];
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-shopping-cart fa-3x" style="margin-bottom: 16px;"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h6>${item.name}</h6>
                <p>${item.product_id || ''}</p>
                <div class="cart-item-price">${typeof formatCOP === 'function' ? formatCOP((item.total_price !== null ? item.total_price : (item.unit_price * item.quantity))) : '$' + ((item.total_price !== null ? item.total_price : (item.unit_price * item.quantity)) || 0).toLocaleString()}</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Update totals (subtotal, shipping, total) based on cart items
    try {
        const subtotalVal = cart.reduce((s, it) => s + (Number(it.total_price !== null ? it.total_price : (it.unit_price * it.quantity)) || 0), 0);
        const shippingVal = subtotalVal < 200000 && subtotalVal > 0 ? 15000 : 0;
        const taxVal = Math.round(subtotalVal * 0.19) || 0;
        const totalVal = subtotalVal + shippingVal + taxVal;

        const elSubtotal = document.getElementById('cartSubtotal');
        const elShipping = document.getElementById('cartShipping');
        const elTotal = document.getElementById('cartTotal');
        if (elSubtotal) elSubtotal.textContent = typeof formatCOP === 'function' ? formatCOP(subtotalVal) : '$' + (subtotalVal || 0).toLocaleString();
        if (elShipping) elShipping.textContent = typeof formatCOP === 'function' ? formatCOP(shippingVal) : '$' + (shippingVal || 0).toLocaleString();
        if (elTotal) elTotal.textContent = typeof formatCOP === 'function' ? formatCOP(totalVal) : '$' + (totalVal || 0).toLocaleString();
    } catch (e) {
        console.error('Error calculando totales del carrito:', e);
    }

    // Refresh badge to reflect quantities
    try { refreshCartBadge(); } catch (e) { console.error(e); }
}

// Funciones del carrito (comunican con la API para guest y usuarios autenticados)
async function updateQuantity(itemId, change) {
    // find current displayed quantity
    const qs = document.querySelectorAll('.cart-item');
    // compute new quantity locally first
    const span = [...document.querySelectorAll('.cart-item-quantity span')].find(s => s.parentElement && s.parentElement.parentElement && s.parentElement.parentElement.querySelector && s.parentElement.parentElement.querySelector(`button[onclick*="updateQuantity(${itemId},"]`));
    try {
        // fetch current value from DOM fallback
        let qtyEl = document.querySelector(`#qty-${itemId}`) || null;
        let currentQty = 1;
        if (qtyEl) currentQty = parseInt(qtyEl.textContent || qtyEl.innerText || 1);
        // if not present, try to derive from cart array
        const cartItem = cart.find(c => c.id === itemId) || {};
        currentQty = cartItem.quantity || currentQty;
        const newQty = Math.max(0, currentQty + change);

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch(`/client/cart/item/${itemId}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ quantity: newQty })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            // update local cart and re-render
            await fetchCartFromServer();
            renderCart();
            await refreshCartBadge();
        } else {
            showNotification(payload.error || 'No se pudo actualizar la cantidad', 'error');
        }
    } catch (e) {
        console.error('Error actualizando cantidad del carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

async function removeItem(itemId) {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch(`/client/cart/item/${itemId}`, { method: 'DELETE', credentials: 'same-origin', headers: { 'X-CSRFToken': csrfToken } });
        const payload = await resp.json();
        if (payload && payload.success) {
            await fetchCartFromServer();
            renderCart();
            await refreshCartBadge();
            showNotification('Producto eliminado del carrito', 'info');
        } else {
            showNotification(payload.error || 'No se pudo eliminar el producto', 'error');
        }
    } catch (e) {
        console.error('Error eliminando item del carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

function updateCartTotals() {
    // Lógica para recalcular totales del carrito
    // Aquí se implementaría el cálculo real basado en productos
    console.log('Actualizando totales del carrito...');
}

function updateCartBadge() {
    // Prefer computing total item quantities from the `cart` array
    // (sum of item.quantity) instead of counting DOM rows.
    try {
        const totalItems = Array.isArray(cart) ? cart.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.error('Error updating cart badge:', e);
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">×</button>
        </div>
    `;

    // Agregar estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'info' ? '#3b82f6' : '#ef4444'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        min-width: 250px;
        animation: slideIn 0.3s ease;
    `;

    // Agregar al body
    document.body.appendChild(notification);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Agregar estilos para la animación de notificación
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles);

// Quantity Controls
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const maxValue = parseInt(quantityInput.max);

    if (currentValue < maxValue) {
        quantityInput.value = currentValue + 1;
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const minValue = parseInt(quantityInput.min);

    if (currentValue > minValue) {
        quantityInput.value = currentValue - 1;
    }
}

// Tab Functionality
function showTab(tabName) {
    // Hide all tab panels
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => panel.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));

    // Show selected tab panel
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

// Product Actions
async function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value || '1');
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch('/client/cart/add', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            showNotification('Producto agregado al carrito exitosamente', 'success');
            await refreshCartBadge();
        } else {
            showNotification(payload.error || 'No se pudo agregar el producto', 'error');
        }
    } catch (e) {
        console.error('Error agregando al carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

async function buyNow(productId) {
    const quantity = parseInt(document.getElementById('quantity').value || '1');
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch('/client/cart/add', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            showNotification('Producto agregado. Redirigiendo al checkout...', 'success');
            // darle tiempo a que se procese
            setTimeout(() => { window.location.href = '{{ url_for("client.checkout") }}'; }, 600);
        } else {
            showNotification(payload.error || 'No se pudo agregar el producto', 'error');
        }
    } catch (e) {
        console.error('Error en buyNow:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

async function refreshCartBadge() {
    try {
        const resp = await fetch('/client/cart', { credentials: 'same-origin' });
        const payload = await resp.json();
        console.log('DEBUG refreshCartBadge payload:', payload);
        if (payload && payload.items) {
            const total = payload.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.textContent = total;
                badge.style.display = total > 0 ? 'flex' : 'none';
            }
        }
    } catch (e) {
        console.error('Error actualizando badge del carrito:', e);
    }
}

function addToFavorites(productId) {
    const heartIcon = document.querySelector('.btn-favorites i');

    if (heartIcon.classList.contains('far')) {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        heartIcon.style.color = '#ff6b35';
        showNotification('Producto agregado a favoritos', 'success');
    } else {
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        heartIcon.style.color = '';
        showNotification('Producto removido de favoritos', 'info');
    }
}

function goToProduct(productId) {
    window.location.href = `/product/${productId}`;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'info' ? '#3b82f6' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}
// On page load, refresh the cart badge so the header shows the real cart count
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Update badge using server-side data (quantity sum)
        refreshCartBadge();
    } catch (e) {
        console.error('Error refreshing cart badge on load:', e);
    }
});