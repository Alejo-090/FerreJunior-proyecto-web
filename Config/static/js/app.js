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
