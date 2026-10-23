const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const DATA_FILE = path.join(__dirname, 'citas_backup.json');

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
    console.error('Error al guardar respaldo:', err);
  }
};

app.get('/api/citas', (req, res) => res.json(obtenerCitas()));

app.post('/api/citas', (req, res) => {
  const citas = obtenerCitas();
  const nuevaCita = req.body;
  citas.push(nuevaCita);
  guardarCitas(citas);
  res.status(201).json({ status: 'ok', cita: nuevaCita });
});

app.use(express.static(path.join(__dirname, 'público')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const publicPath = path.join(__dirname, 'público', 'index.html');
  res.sendFile(publicPath, (err) => {
    if (err) res.status(200).send('<h2>Servidor Activo con Respaldo</h2>');
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor activo en puerto ${PORT}`));

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
