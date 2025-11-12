// E-commerce Homepage JavaScript

// Format currency in Colombian pesos
function formatCOP(amount) {
    if (!amount) return '$0';
    const intAmount = Math.round(parseFloat(amount));
    return '$' + intAmount.toLocaleString('es-CO');
}

// Products array
let products = [];

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/public/products?per_page=12');
        const data = await response.json();
        
        if (data.success && data.products) {
            products = data.products;
            renderProducts();
        } else {
            console.error('Error loading products:', data.error);
            document.getElementById('productsGrid').innerHTML = 
                '<p style="text-align: center; padding: 40px; color: #6b7280;">No se encontraron productos.</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = 
            '<p style="text-align: center; padding: 40px; color: #6b7280;">Error al cargar productos.</p>';
    }
}

// Render products in grid
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">No hay productos disponibles.</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const imageUrl = product.image || '';
        const description = product.description || '';
        const shortDescription = description.length > 60 ? description.substring(0, 60) + '...' : description;
        
        return `
            <div class="product-card" onclick="viewProduct(${product.id})">
                <div class="product-image-container">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.name}" class="product-image">` :
                        `<div class="product-image-placeholder">
                            <i class="fas fa-tools"></i>
                        </div>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${shortDescription}</p>
                    <div class="product-footer">
                        <span class="product-price">${formatCOP(product.price)}</span>
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); handleAddToCart(${product.id})" title="Agregar al carrito">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View product detail
function viewProduct(productId) {
    window.location.href = `/public/product/${productId}`;
}

// Handle add to cart (show login modal)
function handleAddToCart(productId) {
    showLoginModal();
}

// Modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('show');
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Modal close handlers
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', hideLoginModal);
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('loginModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideLoginModal();
        }
    });
    
    // Smooth scroll for "Ver Catálogo" button
    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

