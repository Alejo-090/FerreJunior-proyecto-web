$(document).ready(function() {
    // Toggle password visibility
    $('.fa-eye').click(function() {
        var input = $(this).closest('.input-group').find('input');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            $(this).removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            $(this).removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Validación del formulario
    $('form.user').submit(function(e) {
        e.preventDefault();

        var email = $('input[type="email"]').val();
        var password = $('input[type="password"]').val();
        var isValid = true;

        // Validar email
        if (!email) {
            showError('input[type="email"]', 'El correo electrónico es requerido');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('input[type="email"]', 'Por favor ingresa un correo electrónico válido');
            isValid = false;
        } else {
            removeError('input[type="email"]');
        }

        // Validar contraseña
        if (!password) {
            showError('input[type="password"]', 'La contraseña es requerida');
            isValid = false;
        } else if (password.length < 6) {
            showError('input[type="password"]', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        } else {
            removeError('input[type="password"]');
        }

        // Si todo está validado, enviar el formulario
        if (isValid) {
            this.submit();
        }
    });

    // Función para mostrar mensajes de error
    function showError(selector, message) {
        var input = $(selector);
        var formGroup = input.closest('.input-group');

        // Remover mensaje de error anterior si existe
        removeError(selector);

        // Agregar clase de error
        input.addClass('is-invalid');
        formGroup.after('<div class="invalid-feedback d-block">' + message + '</div>');
    }

    // Función para remover mensajes de error
    function removeError(selector) {
        var input = $(selector);
        var formGroup = input.closest('.input-group');

        input.removeClass('is-invalid');
        formGroup.next('.invalid-feedback').remove();
    }

    // Función para validar email
    function isValidEmail(email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Remover mensajes de error cuando el usuario comienza a escribir
    $('input').on('input', function() {
        removeError(this);
    });

    function showAlert(message, type) {
        var alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        var alert = $('<div class="alert ' + alertClass + ' alert-dismissible fade show" role="alert">' +
                     message +
                     '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                     '<span aria-hidden="true">&times;</span></button></div>');

        $('.container').prepend(alert);

        // Auto cerrar después de 5 segundos
        setTimeout(function() {
            alert.alert('close');
        }, 5000);
    }
});