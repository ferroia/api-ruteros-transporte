const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Configuración de conexión PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Estructura en memoria fallback por si no se ha configurado la variable DATABASE_URL aún
let conductoresMemoria = [];
let entregasMemoria = [];

// Inicialización de Tablas en PostgreSQL
async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL no configurada. Usando almacenamiento en memoria.");
    return;
  }
  try {
    const client = await pool.connect();
    
    // Tabla de Conductores
    await client.query(`
      CREATE TABLE IF NOT EXISTS conductores (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL
      );
    `);

    // Tabla de Ruteros / Entregas
    await client.query(`
      CREATE TABLE IF NOT EXISTS entregas (
        id VARCHAR(50) PRIMARY KEY,
        fecha VARCHAR(20) NOT NULL,
        conductor VARCHAR(150) NOT NULL,
        zona VARCHAR(50) NOT NULL,
        tipo_documento VARCHAR(50) NOT NULL,
        pedido VARCHAR(100) NOT NULL,
        cliente VARCHAR(200) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        hora_llegada VARCHAR(20),
        hora_salida VARCHAR(20),
        firma TEXT
      );
    `);

    client.release();
    console.log("Base de datos PostgreSQL inicializada y sincronizada correctamente.");
  } catch (err) {
    console.error("Error inicializando PostgreSQL:", err);
  }
}

initDB();

// --- ENDPOINTS DE CONDUCTORES ---
app.get('/api/conductores', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json(conductoresMemoria);
  try {
    const result = await pool.query('SELECT * FROM conductores ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conductores', async (req, res) => {
  const { nombre, apellido } = req.body;
  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y Apellido son requeridos' });
  }
  const id = Date.now().toString();

  if (!process.env.DATABASE_URL) {
    const nuevo = { id, nombre: nombre.trim(), apellido: apellido.trim() };
    conductoresMemoria.push(nuevo);
    return res.json({ success: true, conductor: nuevo });
  }

  try {
    await pool.query(
      'INSERT INTO conductores (id, nombre, apellido) VALUES ($1, $2, $3)',
      [id, nombre.trim(), apellido.trim()]
    );
    res.json({ success: true, conductor: { id, nombre, apellido } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINTS DE RUTEROS / ENTREGAS ---
app.get('/api/ruteros', async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json(entregasMemoria);
  try {
    const result = await pool.query('SELECT id, fecha, conductor, zona, tipo_documento AS "tipoDocumento", pedido, cliente, estado, hora_llegada AS "horaLlegada", hora_salida AS "horaSalida", firma FROM entregas ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ruteros', async (req, res) => {
  const { fecha, conductor, zona, tipoDocumento, pedido, cliente } = req.body;
  if (!fecha || !conductor || !zona || !tipoDocumento || !pedido || !cliente) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const id = Date.now().toString();
  const estado = 'ASIGNADO';

  if (!process.env.DATABASE_URL) {
    const nueva = { id, fecha, conductor, zona, tipoDocumento, pedido, cliente, estado, horaLlegada: '', horaSalida: '', firma: '' };
    entregasMemoria.unshift(nueva);
    return res.json({ success: true, entrega: nueva });
  }

  try {
    await pool.query(
      'INSERT INTO entregas (id, fecha, conductor, zona, tipo_documento, pedido, cliente, estado, hora_llegada, hora_salida, firma) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [id, fecha, conductor, zona, tipoDocumento, pedido, cliente, estado, '', '', '']
    );
    res.json({ success: true, entrega: { id, fecha, conductor, zona, tipoDocumento, pedido, cliente, estado } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ruteros/completar', async (req, res) => {
  const { id, horaLlegada, horaSalida, firma } = req.body;
  const estado = 'ENTREGADO';

  if (!process.env.DATABASE_URL) {
    const entrega = entregasMemoria.find(e => e.id === id);
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    entrega.estado = estado;
    entrega.horaLlegada = horaLlegada;
    entrega.horaSalida = horaSalida;
    entrega.firma = firma;
    return res.json({ success: true, entrega });
  }

  try {
    await pool.query(
      'UPDATE entregas SET estado = $1, hora_llegada = $2, hora_salida = $3, firma = $4 WHERE id = $5',
      [estado, horaLlegada, horaSalida, firma, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de FERROCABLES corriendo en puerto ${PORT}`);
});
