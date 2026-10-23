const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const DATA_FILE = path.join(__dirname, 'citas_backup.json');

// WEBHOOK DE TU HOJA DE GOOGLE SHEETS
const GOOGLE_DRIVE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwBP4gZ7w9MG2ybTq26QNi1XaD2HZpvZMqM1O45bVJsBtEQD49qch9udJL1IY-CK6_1bQ/exec'; 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
}

const obtenerCitas = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
};

const guardarCitas = (citas) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(citas, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar respaldo local:', err);
  }
};

app.get('/api/citas', (req, res) => res.json(obtenerCitas()));

app.post('/api/citas', (req, res) => {
  const citas = obtenerCitas();
  const nuevaCita = req.body;
  citas.push(nuevaCita);
  guardarCitas(citas);

  // Enviar copia inmediata a Google Sheets
  if (GOOGLE_DRIVE_WEBHOOK && GOOGLE_DRIVE_WEBHOOK.startsWith('http')) {
    try {
      const dataString = JSON.stringify(nuevaCita);
      const url = new URL(GOOGLE_DRIVE_WEBHOOK);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString)
        }
      };

      const reqGoogle = https.request(options);
      reqGoogle.on('error', (e) => console.error('Error enviando a Google Sheets:', e));
      reqGoogle.write(dataString);
      reqGoogle.end();
    } catch (error) {
      console.error('Excepción al enviar a Google Sheets:', error);
    }
  }

  res.status(201).json({ status: 'ok', cita: nuevaCita });
});

app.use(express.static(path.join(__dirname, 'público')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const publicPath = path.join(__dirname, 'público', 'index.html');
  res.sendFile(publicPath, (err) => {
    if (err) res.status(200).send('<h2>Servidor Activo con Respaldo en Google Sheets</h2>');
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor activo con doble respaldo en puerto ${PORT}`));

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
