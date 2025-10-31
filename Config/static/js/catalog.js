// Variables globales
let currentPage = 1;
let currentFilters = {};
let currentSort = '';
let allProducts = [];

// Productos cargados desde la API (inicialmente vacío)
let products = [];
let pagination = { page: 1, per_page: 12, total: 0, pages: 1 };

// Inicializar la página: cargar productos desde el servidor (con paginación)
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadProducts(1);
});

async function loadProducts(page = 1) {
    currentPage = page;
    const per_page = 9; // elementos por página en UI
    try {
        const resp = await fetch(`/client/catalog-data?page=${page}&per_page=${per_page}`);
        const payload = await resp.json();
        if (payload && payload.products) {
            products = payload.products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.price || 0,
                category: p.category_id || null,
                brand: p.brand || null,
                image: p.image || null,
                in_stock: (p.stock_quantity || 0) > 0
            }));

            pagination = payload.pagination || pagination;
        } else {
            products = [];
        }
    } catch (e) {
        console.error('Error cargando productos:', e);
        products = [];
    }

    allProducts = products;
    renderProducts();
    renderPagination();
}

function setupEventListeners() {
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', function(e) {
        searchProducts(e.target.value);
    });

    // Ordenamiento
    document.getElementById('sortSelect').addEventListener('change', function(e) {
        currentSort = e.target.value;
        renderProducts();
    });

    // Filtros
    const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            collectFilters();
        });
    });
}

function searchProducts(query) {
    if (!query) {
        allProducts = products;
    } else {
        allProducts = products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
    }
    renderProducts();
}

function collectFilters() {
    const filters = {};

    // Categorías
    const categories = [];
    document.querySelectorAll('[id^="herramientas"], [id^="tornilleria"], [id^="pinturas"], [id^="plomeria"], [id^="electricidad"]').forEach(cb => {
        if (cb.checked) categories.push(cb.id);
    });
    if (categories.length > 0) filters.categories = categories;

    // Precio
    const priceFilter = document.querySelector('input[name="price"]:checked');
    if (priceFilter) filters.price = priceFilter.id;

    // Marca
    const brands = [];
    document.querySelectorAll('[id^="dewalt"], [id^="black-decker"], [id^="stanley"], [id^="bosch"]').forEach(cb => {
        if (cb.checked) brands.push(cb.id);
    });
    if (brands.length > 0) filters.brands = brands;

    currentFilters = filters;
}

function applyFilters() {
    let filteredProducts = products;

    // Aplicar filtros de categoría
    if (currentFilters.categories) {
        filteredProducts = filteredProducts.filter(product =>
            currentFilters.categories.includes(product.category)
        );
    }

    // Aplicar filtros de precio
    if (currentFilters.price) {
        filteredProducts = filteredProducts.filter(product => {
            const price = product.price;
            switch(currentFilters.price) {
                case 'price-0-50': return price < 50;
                case 'price-50-100': return price >= 50 && price <= 100;
                case 'price-100-200': return price > 100 && price <= 200;
                case 'price-200-plus': return price > 200;
                default: return true;
            }
        });
    }

    // Aplicar filtros de marca
    if (currentFilters.brands) {
        filteredProducts = filteredProducts.filter(product =>
            currentFilters.brands.includes(product.brand)
        );
    }

    allProducts = filteredProducts;
    renderProducts();

    // Mostrar notificación
    showNotification(`Se encontraron ${filteredProducts.length} productos`, 'success');
}

function renderProducts() {
    let productsToRender = [...allProducts];

    // Aplicar ordenamiento
    if (currentSort) {
        productsToRender.sort((a, b) => {
            switch(currentSort) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                default: return 0;
            }
        });
    }

    const grid = document.getElementById('productsGrid');

    if (productsToRender.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #6b7280;">
                <i class="fas fa-search fa-3x" style="margin-bottom: 16px; opacity: 0.5;"></i>
                <h3 style="margin: 0 0 8px 0; font-size: 18px;">No se encontraron productos</h3>
                <p style="margin: 0;">Intenta ajustar los filtros o el término de búsqueda</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card" onclick="goToProduct(${product.id})">
            <div class="product-image-container">
                <img src="${product.image || `https://via.placeholder.com/261x261/ff6b35/white?text=${encodeURIComponent(product.name)}` }"
                     alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${typeof formatCOP === 'function' ? formatCOP(product.price) : '$' + (product.price || 0).toLocaleString()}</span>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')" ${product.in_stock ? '' : 'disabled title="Sin stock"'}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
`).join('');
}

function renderPagination() {
    const nav = document.querySelector('.pagination');
    if (!pagination || pagination.pages <= 1) {
        nav.style.display = 'none';
        return;
    }
    nav.style.display = 'flex';
    // Build simple pagination buttons
    let html = `<button class="pagination-btn prev" onclick="changePage('prev')"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= pagination.pages; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    html += `<button class="pagination-btn next" onclick="changePage('next')"><i class="fas fa-chevron-right"></i></button>`;
    nav.innerHTML = html;
}

async function addToCart(productId) {
    // Llama al endpoint que añade el producto al carrito del usuario autenticado
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch('/client/cart/add', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            showNotification('Producto agregado al carrito', 'success');
            
            // Si el carrito está abierto, actualizar su contenido y totales automáticamente
            const sidebar = document.getElementById('cartSidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                // Recargar datos del servidor primero
                await fetchCartFromServer();
                // Luego actualizar la vista completa
                renderCartLocal();
                // Llamar explícitamente a updateTotalsLocal para asegurar actualización
                updateTotalsLocal();
                // Actualizar badge
                updateCartBadgeLocal();
            } else {
                // Solo actualizar badge si el carrito no está abierto
                await refreshCartBadgeLocal();
            }
        } else {
            showNotification(payload.error || 'No se pudo agregar el producto', 'error');
        }
    } catch (e) {
        console.error('Error al agregar al carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

function changePage(page) {
    if (page === 'prev' && currentPage > 1) {
        loadProducts(currentPage - 1);
    } else if (page === 'next' && pagination && currentPage < pagination.pages) {
        loadProducts(currentPage + 1);
    } else if (typeof page === 'number') {
        loadProducts(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification(`Página ${currentPage} cargada`, 'info');
}

function openCart() {
    // Redirigir al dashboard con el carrito abierto
    window.location.href = "/client#cart";
}

function openUserMenu() {
    // Mostrar menú de usuario
    const modal = document.getElementById('userMenuModal');
    modal.style.display = 'block';
}

function goToProduct(productId) {
    // Redirigir a la página de detalle del producto
    window.location.href = `/product/${productId}`;
}

// Estado del carrito (se obtiene desde el servidor cuando se abre)
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
                price: Number(it.price) || Number(it.unit_price) || 0,
                quantity: Number(it.quantity) || 0,
                code: it.product_id || `PRD${it.id}`,
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

// Cart Functions
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        // Obtener carrito actualizado desde servidor antes de mostrar
        fetchCartFromServer().then(() => { renderCartLocal(); updateCartBadgeLocal(); });
    }
}

// Local/mock cart functions (renamed to avoid overriding server-backed functions)
function addToCartLocal(id, name, price, code) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            code: code,
            price: price,
            quantity: 1,
            image: `https://via.placeholder.com/64x64/ff6b35/white?text=${name.replace(/ /g, '+')}`
        });
    }

    updateCartBadgeLocal();

    // Show success message
    showNotification(`${name} agregado al carrito`);
}

async function updateQuantityLocal(id, change) {
    const item = cart.find(item => item.id == id);
    if (!item) {
        return;
    }
    const newQuantity = item.quantity + change;

    if (newQuantity < 0) {
        return;
    }

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        // Si la cantidad llega a 0, eliminar el item
        if (newQuantity === 0) {
            const resp = await fetch(`/client/cart/item/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'X-CSRFToken': csrfToken }
            });
            const payload = await resp.json();
            if (payload && payload.success) {
                // Recargar datos del servidor
                await fetchCartFromServer();
                // Actualizar vista y totales
                renderCartLocal();
                // Llamar explícitamente a updateTotalsLocal
                updateTotalsLocal();
                updateCartBadgeLocal();
                showNotification('Producto eliminado del carrito', 'info');
            } else {
                showNotification(payload.error || 'No se pudo eliminar el producto', 'error');
            }
            return;
        }
        
        // Actualizar cantidad
        const resp = await fetch(`/client/cart/item/${id}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
            body: JSON.stringify({ quantity: newQuantity })
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            // Recargar datos del servidor primero
            await fetchCartFromServer();
            // Forzar actualización de totales recalculando desde cero
            renderCartLocal();
            // Llamar explícitamente a updateTotalsLocal para asegurar actualización
            updateTotalsLocal();
            updateCartBadgeLocal();
        } else {
            showNotification(payload.error || 'No se pudo actualizar el carrito', 'error');
        }
    } catch (e) {
        console.error('Error actualizando cantidad del carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

async function removeFromCartLocal(id) {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const resp = await fetch(`/client/cart/item/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { 'X-CSRFToken': csrfToken }
        });
        const payload = await resp.json();
        if (payload && payload.success) {
            // Recargar datos del servidor
            await fetchCartFromServer();
            // Actualizar vista y totales
            renderCartLocal();
            // Llamar explícitamente a updateTotalsLocal
            updateTotalsLocal();
            updateCartBadgeLocal();
            showNotification('Producto eliminado del carrito', 'info');
        } else {
            showNotification(payload.error || 'No se pudo eliminar el producto', 'error');
        }
    } catch (e) {
        console.error('Error eliminando producto del carrito:', e);
        showNotification('Error al conectar con el servidor', 'error');
    }
}

function renderCartLocal() {
    const cartItems = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-shopping-cart fa-3x" style="margin-bottom: 16px;"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-code">Código: ${item.code}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="quantity-controls">
                            <button class="quantity-btn minus" onclick="updateQuantityLocal(${item.id}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span style="font-weight: 600; margin: 0 8px;">${item.quantity}</span>
                            <button class="quantity-btn plus" onclick="updateQuantityLocal(${item.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="cart-item-price">${typeof formatCOP === 'function' ? formatCOP(item.price * item.quantity) : '$' + (item.price * item.quantity).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTotalsLocal();
}

function updateTotalsLocal() {
    console.log('updateTotalsLocal llamado, cart:', cart);
    
    // Asegurar que cart es un array válido
    if (!Array.isArray(cart) || cart.length === 0) {
        console.log('Carrito vacío, estableciendo totales a 0');
        const elSubtotal = document.getElementById('subtotal');
        const elShipping = document.getElementById('shipping');
        const elTaxes = document.getElementById('taxes');
        const elTotal = document.getElementById('total');
        if (elSubtotal) elSubtotal.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elShipping) elShipping.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elTaxes) elTaxes.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        if (elTotal) elTotal.textContent = typeof formatCOP === 'function' ? formatCOP(0) : '$0';
        return;
    }
    
    // Calcular subtotal sumando precio * cantidad de cada item
    const subtotal = cart.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const itemTotal = price * quantity;
        console.log(`Item: ${item.name}, Precio: ${price}, Cantidad: ${quantity}, Total: ${itemTotal}`);
        return sum + itemTotal;
    }, 0);
    
    console.log('Subtotal calculado:', subtotal);
    
    // Reglas unificadas con checkout: envío $15.000 si subtotal < $200.000; IVA 19%
    const shipping = subtotal > 0 && subtotal < 200000 ? 15000 : 0;
    const taxes = Math.round(subtotal * 0.19);
    const total = subtotal + shipping + taxes;
    
    console.log('Totales calculados - Subtotal:', subtotal, 'Envío:', shipping, 'IVA:', taxes, 'Total:', total);

    // Actualizar elementos del DOM
    const elSubtotal = document.getElementById('subtotal');
    const elShipping = document.getElementById('shipping');
    const elTaxes = document.getElementById('taxes');
    const elTotal = document.getElementById('total');
    
    console.log('Elementos DOM encontrados:', {
        subtotal: !!elSubtotal,
        shipping: !!elShipping,
        taxes: !!elTaxes,
        total: !!elTotal
    });
    
    if (elSubtotal) {
        elSubtotal.textContent = typeof formatCOP === 'function' ? formatCOP(subtotal) : '$' + (subtotal || 0).toLocaleString();
    }
    if (elShipping) {
        elShipping.textContent = typeof formatCOP === 'function' ? formatCOP(shipping) : '$' + (shipping || 0).toLocaleString();
    }
    if (elTaxes) {
        elTaxes.textContent = typeof formatCOP === 'function' ? formatCOP(taxes) : '$' + (taxes || 0).toLocaleString();
    }
    if (elTotal) {
        elTotal.textContent = typeof formatCOP === 'function' ? formatCOP(total) : '$' + (total || 0).toLocaleString();
    }
    
    console.log('Totales actualizados en DOM');
}

function updateCartBadgeLocal() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

async function refreshCartBadgeLocal() {
    await fetchCartFromServer();
    updateCartBadgeLocal();
}

function proceedCheckout() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }

    // Aquí implementarías la lógica de checkout
    showNotification('Redirigiendo al checkout...', 'success');

    // Simular redirección después de 2 segundos
    setTimeout(() => {
        alert('Función de checkout en desarrollo');
    }, 1000);
}

// Initialize cart on page load (use server-backed data for badge)
// Ensure we populate badge from DB/session so the header shows the real count
document.addEventListener('DOMContentLoaded', function() {
    try {
        refreshCartBadgeLocal();
    } catch (e) {
        console.error('Error refreshing cart badge on load:', e);
    }
});

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