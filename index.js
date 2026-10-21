const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Desactivar caché HTTP
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Base de datos temporal en memoria
let entregas = [];

// API Endpoints
app.get('/api/ruteros', (req, res) => {
  res.json(entregas);
});

app.post('/api/ruteros', (req, res) => {
  const { fecha, conductor, pedido, cliente } = req.body;
  if (!fecha || !conductor || !pedido || !cliente) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const nuevaEntrega = {
    id: Date.now().toString(),
    fecha,
    conductor,
    pedido,
    cliente,
    estado: 'ASIGNADO',
    horaLlegada: '',
    horaSalida: '',
    firma: ''
  };
  entregas.unshift(nuevaEntrega);
  res.json({ success: true, entrega: nuevaEntrega });
});

app.post('/api/ruteros/completar', (req, res) => {
  const { id, horaLlegada, horaSalida, firma } = req.body;
  const entrega = entregas.find(e => e.id === id);
  if (!entrega) {
    return res.status(404).json({ error: 'Entrega no encontrada' });
  }
  entrega.estado = 'ENTREGADO';
  entrega.horaLlegada = horaLlegada;
  entrega.horaSalida = horaSalida;
  entrega.firma = firma;
  res.json({ success: true, entrega });
});

// Servir estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de FERROCABLES corriendo en puerto ${PORT}`);
});
