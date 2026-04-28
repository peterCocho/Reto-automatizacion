/**
 * CONFIGURACIÓN GLOBAL
 * Las variables de entorno se cargan desde el archivo .env (reemplaza PropertiesService de Apps Script).
 * Requiere: npm install
 * Ejecutar:  node codigo.js
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// -- Equivalente a PropertiesService.getScriptProperties() --
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const SPREADSHEET_ID   = process.env.SPREADSHEET_ID;
const GEMINI_ENDPOINT  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// -- Autenticación con Google Sheets API (reemplaza SpreadsheetApp) --
// Descarga tu archivo de cuenta de servicio desde Google Cloud Console y
// guárdalo como service-account.json en la raíz del proyecto.
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE || 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const app = express();
app.use(express.json());

// -- Equivalente a HtmlService.createHtmlOutputFromFile() --
// Express sirve los archivos estáticos (index.html) directamente.
app.use(express.static(__dirname));

/**
 * Recibe los datos del formulario HTML, los guarda en la hoja
 * y llama a la IA para clasificarlos.
 * Reemplaza la función processWebFeedback() de Apps Script.
 * El frontend llama a este endpoint con fetch('/api/process-feedback').
 */
app.post('/api/process-feedback', async (req, res) => {
  try {
    const formData = req.body;

    // 1. Marca de Tiempo
    const timestamp = new Date().toISOString();

    // 2. Procesar el comentario con Gemini
    const aiAnalysis = await fetchGeminiAnalysis(formData.comentario);

    // 3. Guardar en Google Sheets vía API (reemplaza sheet.appendRow y sheet.getRange)
    // Orden columnas: Tiempo | Producto | Comentario | Nombre | Sentimiento | Resumen
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Feedback!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          timestamp,
          formData.producto,
          formData.comentario,
          formData.nombre,
          aiAnalysis.sentiment,
          aiAnalysis.summary,
        ]],
      },
    });

    res.json({ success: true, message: 'Éxito' });
  } catch (error) {
    console.error('Error procesando feedback web: ' + error.message);
    res.status(500).json({ success: false, message: 'Fallo en el servidor al guardar.' });
  }
});

/**
 * Se comunica con la API de Gemini para obtener el análisis estructurado.
 * Reemplaza UrlFetchApp.fetch() de Apps Script usando fetch() nativo de Node 18+.
 * @param {string} textContent El texto del feedback del usuario.
 * @return {Promise<Object>} Objeto con los campos 'sentiment' y 'summary'.
 */
async function fetchGeminiAnalysis(textContent) {
  const instructionPrompt = `Analiza el siguiente comentario de un cliente: "${textContent}". 
  Responde estrictamente en formato JSON con dos campos: 
  1. "sentiment": debe ser exclusivamente una de estas opciones: "Positivo", "Neutro" o "Negativo". 
  2. "summary": un resumen muy breve de máximo 15 palabras que sintetice la idea principal.`;

  const requestPayload = {
    contents: [{ parts: [{ text: instructionPrompt }] }],
  };

  // -- Equivalente a UrlFetchApp.fetch() --
  const apiResponse = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  const responseData = await apiResponse.json();

  // Si Google devuelve un error (ej. modelo no encontrado), lo capturamos aquí
  if (responseData.error) {
    console.error('Detalle del error de Google: ', responseData.error);
    throw new Error('Google API Error: ' + responseData.error.message);
  }

  // Validar si la respuesta contiene los datos esperados
  if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
    let cleanTextResponse = responseData.candidates[0].content.parts[0].text;

    // Limpiar posibles etiquetas de bloques de código Markdown
    cleanTextResponse = cleanTextResponse.replace(/```json|```/g, '').trim();

    const parsedData = JSON.parse(cleanTextResponse);

    return {
      sentiment: parsedData.sentiment || 'Indeterminado',
      summary:   parsedData.summary   || 'Sin resumen disponible',
    };
  } else {
    throw new Error('La API de Gemini no devolvió un formato válido.');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
