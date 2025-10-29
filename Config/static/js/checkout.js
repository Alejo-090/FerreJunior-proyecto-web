async function updateQuantity(itemId, change) {
    const qtyElement = document.getElementById(`qty-${itemId}`);
    const currentQty = parseInt(qtyElement.textContent);
    const newQty = Math.max(0, currentQty + change);

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch(`/client/cart/item/${itemId}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ quantity: newQty })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            if (newQty === 0) {
                // recargar la página para reflejar cambios
                window.location.reload();
            } else {
                qtyElement.textContent = newQty;
                updateTotals();
            }
        } else {
            showNotification(payload.error || 'No se pudo actualizar la cantidad', 'error');
        }
    } catch (e) {
        console.error('Error actualizando cantidad:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

async function removeItem(itemId) {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch(`/client/cart/item/${itemId}`, { method: 'DELETE', credentials: 'same-origin', headers: { 'X-CSRFToken': csrfToken } });
        const payload = await resp.json();
        if (payload && payload.success) {
            window.location.reload();
        } else {
            showNotification(payload.error || 'No se pudo eliminar el producto', 'error');
        }
    } catch (e) {
        console.error('Error eliminando item:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

function updateTotals() {
    // Aquí se recalcularían los totales
    console.log('Actualizando totales...');
}

function updateCartCount() {
    const cartItems = document.querySelectorAll('.cart-item').length;
    document.querySelector('.cart-subtitle').textContent = `${cartItems} productos en tu carrito`;
    document.querySelector('.badge').textContent = cartItems;
}

function processPayment() {
    alert('Redirigiendo al procesador de pagos...');
    // Aquí se implementaría la lógica de pago real
}