# Configuración de OAuth (Google y Facebook)

Para habilitar el inicio de sesión con Google y Facebook, necesitas configurar las siguientes variables de entorno.

## Variables de Entorno Requeridas

### Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (o Google Identity)
4. Ve a "Credenciales" y crea un "ID de cliente OAuth 2.0"
5. Configura las URIs de redirección autorizadas:
   - `http://localhost:5000/login/google/callback` (desarrollo)
   - `https://tudominio.com/login/google/callback` (producción)
6. Obtén el Client ID y Client Secret

### Facebook OAuth
1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Agrega el producto "Facebook Login"
4. Configura las URLs de redirección OAuth válidas:
   - `http://localhost:5000/login/facebook/callback` (desarrollo)
   - `https://tudominio.com/login/facebook/callback` (producción)
5. Obtén el App ID y App Secret

## Configuración en el Sistema

### Windows (PowerShell)
```powershell
$env:GOOGLE_CLIENT_ID="tu-google-client-id"
$env:GOOGLE_CLIENT_SECRET="tu-google-client-secret"
$env:FACEBOOK_APP_ID="tu-facebook-app-id"
$env:FACEBOOK_APP_SECRET="tu-facebook-app-secret"
```

### Linux/Mac
```bash
export GOOGLE_CLIENT_ID="tu-google-client-id"
export GOOGLE_CLIENT_SECRET="tu-google-client-secret"
export FACEBOOK_APP_ID="tu-facebook-app-id"
export FACEBOOK_APP_SECRET="tu-facebook-app-secret"
```

### Archivo .env (Recomendado)
Crea un archivo `.env` en la raíz del proyecto:
```
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
FACEBOOK_APP_ID=tu-facebook-app-id
FACEBOOK_APP_SECRET=tu-facebook-app-secret
```

Luego instala `python-dotenv` y carga las variables:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Notas Importantes

- **Seguridad**: Nunca subas las credenciales a repositorios públicos
- **Desarrollo**: En desarrollo, el sistema mostrará un mensaje de advertencia si OAuth no está configurado, pero el login normal seguirá funcionando
- **Producción**: Asegúrate de usar HTTPS en producción para OAuth
- **Email**: Para la recuperación de contraseña, en producción deberías configurar Flask-Mail o un servicio de email como SendGrid, Mailgun, etc.

## Funcionalidades Implementadas

✅ **Recuperación de Contraseña**
- Ruta: `/forgot-password`
- Genera token de reset válido por 1 hora
- En desarrollo, el link se muestra en la consola
- En producción, configurar envío de email

✅ **Registro de Usuarios**
- Ruta: `/register`
- Validación de campos
- Verificación de email único
- Registro con OAuth (Google/Facebook)

✅ **OAuth Google**
- Ruta: `/login/google`
- Callback: `/login/google/callback`
- Crea o vincula cuenta con Google ID

✅ **OAuth Facebook**
- Ruta: `/login/facebook`
- Callback: `/login/facebook/callback`
- Crea o vincula cuenta con Facebook ID

✅ **Recordarme**
- Funcionalidad ya implementada en el login
- Usa cookies persistentes de Flask-Login

