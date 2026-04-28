# Feedback Alegra

Sistema de recolección de feedback de clientes con análisis de sentimiento mediante IA (Google Gemini).

## Descripción

Este proyecto permite a los usuarios enviar comentarios sobre productos de Alegra. Los comentarios se almacenan en Google Sheets y son analizados automáticamente por la API de Gemini para clasificar el sentimiento (Positivo, Neutro o Negativo) y generar un resumen.

## Requisitos

- Node.js 18+
- Cuenta de Google Cloud con API de Gemini habilitada
- Google Sheet con una hoja llamada "Feedback"
- Cuenta de servicio de Google Cloud (para escribir en Sheets)

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

1. **Copia el archivo de configuración:**

```bash
cp .env.example .env
```

2. **Edita `.env` con tus credenciales:**

| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | Tu API key de Google AI Studio |
| `SPREADSHEET_ID` | ID de tu Google Sheet (está en la URL) |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | Ruta al archivo JSON de la cuenta de servicio |

3. **Configura Google Sheets:**

   - Crea una hoja de cálculo con una pestaña llamada "Feedback"
   - Las columnas deben ser: Tiempo | Producto | Comentario | Nombre | Sentimiento | Resumen
   - Comparte la hoja con el email de tu cuenta de servicio (está en el archivo JSON como `client_email`)

4. **Obtener el Spreadsheet ID:**

   De la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

## Uso

```bash
# Iniciar el servidor
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## Estructura del proyecto

```
reto-automation/
├── codigo.js          # Servidor Express + lógica de Sheets y Gemini
├── index.html         # Interfaz del formulario
├── package.json       # Dependencias del proyecto
├── .env.example       # Plantilla de configuración
├── .gitignore         # Archivos ignorados por Git
└── README.md          # Este archivo
```

## Dependencias

- **express** - Servidor web
- **dotenv** - Cargar variables de entorno
- **googleapis** - Cliente de Google Sheets API

## Notas de seguridad

- **Nunca** subas el archivo `.env` o `service-account.json` a GitHub
- Ambos están incluidos en `.gitignore` para evitarlo
- Los colaboradores deben crear sus propios archivos de configuración
