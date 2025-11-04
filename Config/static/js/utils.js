/**
 * Utilidades comunes para la aplicación FerreJunior
 */

/**
 * Formatear moneda en pesos colombianos (COP)
 * @param {number} amount - Monto a formatear
 * @returns {string} - Monto formateado como $X.XXX
 */
function formatCOP(amount) {
    // Convertir a entero para eliminar decimales
    const intAmount = Math.round(amount || 0);
    // Formatear con separadores de miles en formato colombiano
    return '$' + intAmount.toLocaleString('es-CO');
}

/**
 * Parsear monto de COP string a número
 * @param {string} copString - String con formato $X.XXX
 * @returns {number} - Valor numérico
 */
function parseCOP(copString) {
    if (typeof copString === 'number') return Math.round(copString);
    return Math.round(parseFloat(copString.replace(/[$.,]/g, '')) || 0);
}

/**
 * Formatear fecha en formato colombiano
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDateCO(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatear fecha y hora en formato colombiano
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateadas
 */
function formatDateTimeCO(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
