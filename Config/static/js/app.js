function saludar() {
  let nombre = document.getElementById("nombre");
  let mensaje = nombre.value + " Hola mundo!";
  alertify.alert("Alert Title", mensaje, function () {
    alertify.success("Ok");
  });
}

function cargartabla() {
  axios
    .get("/cargarTabla", {
      params: {
        ID: 12345,
      },
    })
    .then(function (response) {
      alert(response['data'][0]['name']);
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    })
    .finally(function () {
      // always executed
    });
}

// Formatea números a pesos colombianos (sin decimales, separador de miles como punto)
function formatCOP(value) {
  // Acepta números o strings numéricas; redondea al peso más cercano
  const n = Math.round(Number(value) || 0);
  // usa toLocaleString con locale 'es-CO' para punto como separador de miles
  try {
    return '$' + n.toLocaleString('es-CO');
  } catch (e) {
    // Fallback genérico
    return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

// Exponer globalmente por si algunos templates cargan este archivo tarde
window.formatCOP = formatCOP;
