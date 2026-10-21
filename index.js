const express = require('express');
const path = require('path');
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

let entregas = [];
let conductores = [
  { id: '1', nombre: 'Andrés', apellido: 'Gómez' },
  { id: '2', nombre: 'Carlos', apellido: 'Pérez' }
];

app.get('/api/conductores', (req, res) => {
  res.json(conductores);
});

app.post('/api/conductores', (req, res) => {
  const { nombre, apellido } = req.body;
  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y Apellido son requeridos' });
  }
  const nuevoConductor = {
    id: Date.now().toString(),
    nombre: nombre.trim(),
    apellido: apellido.trim()
  };
  conductores.push(nuevoConductor);
  res.json({ success: true, conductor: nuevoConductor });
});

app.get('/api/ruteros', (req, res) => {
  res.json(entregas);
});

app.post('/api/ruteros', (req, res) => {
  const { fecha, conductor, tipoDocumento, pedido, cliente } = req.body;
  if (!fecha || !conductor || !tipoDocumento || !pedido || !cliente) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const nuevaEntrega = {
    id: Date.now().toString(),
    fecha,
    conductor,
    tipoDocumento,
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de FERROCABLES corriendo en puerto ${PORT}`);
});
