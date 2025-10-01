/**
 * Sistema de Tema Claro/Oscuro para FerreJunior
 * Permite alternar entre modo claro y oscuro con persistencia
 */

class ThemeToggle {
    constructor() {
        this.init();
    }

    init() {
        // Verificar tema guardado o preferencia del sistema
        this.currentTheme = localStorage.getItem('ferrejunior-theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        // Aplicar tema inicial inmediatamente para evitar flash
        this.applyTheme(this.currentTheme);
        
        // Crear botón de toggle
        this.createToggleButton();
        
        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Solo cambiar automáticamente si el usuario no ha elegido manualmente
            if (!localStorage.getItem('ferrejunior-theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        console.log('🌗 Sistema de temas inicializado -', this.currentTheme);
    }

    createToggleButton() {
        // Verificar si ya existe el botón
        if (document.querySelector('.theme-toggle')) return;
        
        // Crear botón de toggle
        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.innerHTML = `
            <i class="fas fa-sun"></i>
            <i class="fas fa-moon"></i>
        `;
        toggleButton.setAttribute('aria-label', 'Cambiar tema');
        toggleButton.setAttribute('title', 'Alternar entre modo claro y oscuro');
        
        // Event listener para el click
        toggleButton.addEventListener('click', () => this.toggleTheme());
        
        // Agregar al body
        document.body.appendChild(toggleButton);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        
        // Aplicar atributo data-theme al HTML
        document.documentElement.setAttribute('data-theme', theme);
        
        // Guardar preferencia
        localStorage.setItem('ferrejunior-theme', theme);
        
        // Actualizar meta theme-color para navegadores móviles
        this.updateMetaThemeColor(theme);
        
        // Dispatch evento personalizado para otras partes de la app
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));

        console.log('🎨 Tema aplicado:', theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // Colores específicos para la barra de estado móvil
        metaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff';
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Mostrar notificación
        this.showNotification(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`);
    }

    showNotification(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = message;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 2.5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }

    // Método público para cambiar tema programáticamente
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme);
            console.log('🔧 Tema cambiado programáticamente a:', theme);
        } else {
            console.warn('⚠️ Tema no válido:', theme);
        }
    }

    // Obtener tema actual
    getTheme() {
        return this.currentTheme;
    }

    // Verificar si está en modo oscuro
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    // Resetear a preferencia del sistema
    resetToSystemPreference() {
        localStorage.removeItem('ferrejunior-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
        this.showNotification('Usando preferencia del sistema');
    }
}

// Función de inicialización temprana para evitar flash
function initThemeEarly() {
    const savedTheme = localStorage.getItem('ferrejunior-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
}

// Ejecutar inmediatamente
initThemeEarly();

// Inicializar clase completa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.themeToggle = new ThemeToggle();
});

// También manejar caso donde el script se carga después del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.themeToggle) {
            window.themeToggle = new ThemeToggle();
        }
    });
} else {
    // DOM ya está listo
    if (!window.themeToggle) {
        window.themeToggle = new ThemeToggle();
    }
}

// Exportar para uso global
window.ThemeToggle = ThemeToggle;