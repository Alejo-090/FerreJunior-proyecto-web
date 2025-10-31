async function updateQuantity(itemId, change) {
    const qtyElement = document.getElementById(`qty-${itemId}`);
    const currentQty = parseInt(qtyElement.textContent);
    const newQty = Math.max(0, currentQty + change);

    if (newQty === currentQty) {
        return; // No hay cambio
    }

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
                console.log('Cantidad actualizada exitosamente, nueva cantidad:', newQty);
                // Actualizar inmediatamente el texto de la cantidad
                qtyElement.textContent = String(newQty);
                qtyElement.innerText = String(newQty); // Doble actualización para asegurar
                
                // Usar nextTick para asegurar que el DOM se actualice completamente
                Promise.resolve().then(() => {
                    // Verificar que se actualizó correctamente
                    const currentQtyInDom = parseInt(qtyElement.textContent.trim()) || 0;
                    console.log('Cantidad en DOM después de actualizar:', currentQtyInDom);
                    
                    // Actualizar precio total del item
                    updateItemTotal(itemId);
                    // Recalcular todos los totales INMEDIATAMENTE
                    updateTotals();
                    // Actualizar contador de productos
                    updateCartCount();
                    console.log('Totales actualizados después de cambiar cantidad');
                });
            }
        } else {
            showNotification(payload.error || 'No se pudo actualizar la cantidad', 'error');
        }
    } catch (e) {
        console.error('Error actualizando cantidad:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

function updateItemTotal(itemId) {
    // Encontrar el cart-item que contiene este itemId
    const qtyElement = document.getElementById(`qty-${itemId}`);
    if (!qtyElement) return;
    
    const cartItem = qtyElement.closest('.cart-item');
    if (!cartItem) return;
    
    const priceElement = cartItem.querySelector('.item-price');
    if (!priceElement) return;
    
    const unitPrice = parseFloat(priceElement.getAttribute('data-unit-price')) || 0;
    const quantity = parseInt(qtyElement.textContent) || 0;
    const totalPrice = unitPrice * quantity;
    
    // Actualizar el texto del precio (mostrar precio unitario x cantidad = total)
    // Pero mantener el formato original por ahora, o actualizar para mostrar total
    // Por ahora solo actualizamos si queremos mostrar el total, pero mantengamos el formato
    // El precio que se muestra es unitario según el diseño, así que lo dejamos así
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
    console.log('updateTotals llamado en checkout');
    
    // Calcular subtotal sumando todos los items (precio unitario * cantidad)
    let subtotal = 0;
    const cartItems = document.querySelectorAll('.cart-item');
    
    console.log('Items encontrados en checkout:', cartItems.length);
    
    if (cartItems.length === 0) {
        console.warn('No se encontraron items en el carrito');
        // Si no hay items, establecer todos los totales en 0
        const elSubtotal = document.getElementById('checkout-subtotal');
        const elShipping = document.getElementById('checkout-shipping');
        const elTax = document.getElementById('checkout-tax');
        const elTotal = document.getElementById('checkout-total');
        
        if (elSubtotal) elSubtotal.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elShipping) elShipping.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elTax) elTax.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elTotal) elTotal.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        return;
    }
    
    cartItems.forEach((item, index) => {
        const priceElement = item.querySelector('.item-price');
        const qtyElement = item.querySelector('.quantity-value');
        
        if (priceElement && qtyElement) {
            // Leer el precio unitario del atributo data-unit-price
            let unitPriceStr = priceElement.getAttribute('data-unit-price');
            console.log(`Item ${index + 1}: data-unit-price raw: "${unitPriceStr}"`);
            
            // Si no hay atributo data-unit-price, intentar leer del texto del precio
            if (!unitPriceStr || unitPriceStr === '0' || unitPriceStr === '') {
                // Intentar extraer el número del texto formateado (ej: "$74.577" -> 74577)
                const priceText = priceElement.textContent.trim();
                // Remover todos los caracteres que no sean números
                unitPriceStr = priceText.replace(/[^\d]/g, '');
                console.log(`Item ${index + 1}: Precio extraído del texto: "${unitPriceStr}"`);
            }
            
            // Convertir a número
            const unitPrice = parseFloat(unitPriceStr) || 0;
            
            // Leer la cantidad del texto del elemento (debe estar actualizado)
            const quantityStr = qtyElement.textContent.trim();
            const quantity = parseInt(quantityStr) || 0;
            
            const itemTotal = unitPrice * quantity;
            subtotal += itemTotal;
            console.log(`Item ${index + 1}: Precio unitario: ${unitPrice}, Cantidad: ${quantity}, Total item: ${itemTotal}`);
        } else {
            console.warn(`Item ${index + 1}: No se encontraron elementos - precio: ${!!priceElement}, cantidad: ${!!qtyElement}`);
        }
    });
    
    console.log('Subtotal calculado:', subtotal);
    
    // Calcular envío: $15,000 si subtotal < $200,000, sino $0
    const shipping = subtotal > 0 && subtotal < 200000 ? 15000 : 0;
    
    // Calcular IVA: 19% del subtotal
    const tax = Math.round(subtotal * 0.19);
    
    // Calcular total
    const total = subtotal + shipping + tax;
    
    console.log('Totales calculados - Subtotal:', subtotal, 'Envío:', shipping, 'IVA:', tax, 'Total:', total);
    
    // Actualizar los elementos en el DOM
    // Intentar encontrar por ID primero, luego por selector
    let elSubtotal = document.getElementById('checkout-subtotal');
    let elShipping = document.getElementById('checkout-shipping');
    let elTax = document.getElementById('checkout-tax');
    let elTotal = document.getElementById('checkout-total');
    
    // Si no se encuentran por ID, buscar por selector CSS
    if (!elSubtotal) elSubtotal = document.querySelector('#checkout-subtotal') || document.querySelector('.summary-details .summary-row:first-child .price');
    if (!elShipping) elShipping = document.querySelector('#checkout-shipping') || document.querySelector('.summary-details .summary-row:nth-child(2) .price');
    if (!elTax) elTax = document.querySelector('#checkout-tax') || document.querySelector('.summary-details .summary-row:nth-child(3) .price');
    if (!elTotal) elTotal = document.querySelector('#checkout-total') || document.querySelector('.summary-details .summary-row.total .price');
    
    console.log('Elementos DOM encontrados:', {
        subtotal: !!elSubtotal,
        shipping: !!elShipping,
        tax: !!elTax,
        total: !!elTotal,
        subtotalElement: elSubtotal,
        shippingElement: elShipping,
        taxElement: elTax,
        totalElement: elTotal
    });
    
    if (elSubtotal) {
        const newValue = typeof formatCOP === 'function' ? formatCOP(subtotal) : '$' + (subtotal || 0).toLocaleString();
        elSubtotal.textContent = newValue;
        console.log('Subtotal actualizado a:', newValue);
    } else {
        console.error('No se encontró el elemento checkout-subtotal');
    }
    
    if (elShipping) {
        const newValue = typeof formatCOP === 'function' ? formatCOP(shipping) : '$' + (shipping || 0).toLocaleString();
        elShipping.textContent = newValue;
        console.log('Envío actualizado a:', newValue);
    } else {
        console.error('No se encontró el elemento checkout-shipping');
    }
    
    if (elTax) {
        const newValue = typeof formatCOP === 'function' ? formatCOP(tax) : '$' + (tax || 0).toLocaleString();
        elTax.textContent = newValue;
        console.log('IVA actualizado a:', newValue);
    } else {
        console.error('No se encontró el elemento checkout-tax');
    }
    
    if (elTotal) {
        const newValue = typeof formatCOP === 'function' ? formatCOP(total) : '$' + (total || 0).toLocaleString();
        elTotal.textContent = newValue;
        console.log('Total actualizado a:', newValue);
    } else {
        console.error('No se encontró el elemento checkout-total');
    }
    
    // Actualizar sección de envío gratis si aplica
    const freeShippingSection = document.querySelector('.free-shipping');
    if (subtotal >= 200000 && shipping === 0) {
        if (!freeShippingSection) {
            // Crear sección de envío gratis si no existe
            const orderSummary = document.querySelector('.order-summary');
            if (orderSummary) {
                const freeShippingDiv = document.createElement('div');
                freeShippingDiv.className = 'free-shipping';
                freeShippingDiv.innerHTML = `
                    <i class="fas fa-truck free-shipping-icon"></i>
                    <div class="free-shipping-content">
                        <h3>Envío Gratis</h3>
                        <p>En compras superiores a ${typeof formatCOP === 'function' ? formatCOP(200000) : '$200,000'}. Tu pedido califica para envío gratuito.</p>
                    </div>
                `;
                orderSummary.appendChild(freeShippingDiv);
            }
        }
    } else if (freeShippingSection && shipping > 0) {
        freeShippingSection.remove();
    }
    
    console.log('updateTotals completado');
}

function updateCartCount() {
    const cartItems = document.querySelectorAll('.cart-item');
    let totalItems = 0;
    
    // Sumar todas las cantidades de los items
    cartItems.forEach(item => {
        const qtyElement = item.querySelector('.quantity-value');
        if (qtyElement) {
            totalItems += parseInt(qtyElement.textContent) || 0;
        }
    });
    
    const subtitleElement = document.querySelector('.cart-subtitle');
    if (subtitleElement) {
        subtitleElement.textContent = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} en tu carrito`;
    }
}

async function processPayment() {
    try {
        // Mostrar loading
        const checkoutBtn = document.querySelector('.checkout-btn');
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        // Obtener datos del formulario si existen
        const paymentMethod = 'Tarjeta de crédito'; // Por defecto, puede venir de un select
        const notes = ''; // Puede venir de un textarea
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        // Llamar al endpoint para crear el pedido
        const resp = await fetch('/client/checkout/create-order', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                payment_method: paymentMethod,
                notes: notes
            })
        });
        
        const payload = await resp.json();
        
        if (payload && payload.success) {
            showNotification(`¡Pedido creado exitosamente! Número de orden: ${payload.order_number}`, 'success');
            
            // Redirigir a la página de pedidos o a una confirmación
            setTimeout(() => {
                window.location.href = '/client/orders';
            }, 2000);
        } else {
            showNotification(payload.error || 'Error al procesar el pedido', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalText;
        }
    } catch (e) {
        console.error('Error procesando pago:', e);
        showNotification('Error al conectar con el servidor', 'error');
        const checkoutBtn = document.querySelector('.checkout-btn');
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceder al Pago';
    }
}

function showNotification(message, type = 'success') {
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
        z-index: 10000;
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
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}