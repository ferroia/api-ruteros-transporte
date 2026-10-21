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

let conductores = [
  { id: '1', nombre: 'Andrés', apellido: 'Gómez' },
  { id: '2', nombre: 'Carlos', apellido: 'Pérez' }
];

const today = new Date().toISOString().split('T')[0];

// Datos de prueba representativos para ver los gráficos llenos
let entregas = [
  {
    id: '101',
    fecha: today,
    conductor: 'Andrés Gómez',
    zona: 'Medellín',
    tipoDocumento: 'Remisión',
    pedido: 'REM-501',
    cliente: 'Estructuras del Norte S.A.S.',
    estado: 'ENTREGADO',
    horaLlegada: '08:15',
    horaSalida: '08:40',
    firma: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 20 Q 30 5 50 20 T 90 20" stroke="black" fill="none" stroke-width="2"/></svg>'
  },
  {
    id: '102',
    fecha: today,
    conductor: 'Carlos Pérez',
    zona: 'Oriente',
    tipoDocumento: 'Factura',
    pedido: 'F-9021',
    cliente: 'Constructora El Peñol',
    estado: 'ENTREGADO',
    horaLlegada: '09:00',
    horaSalida: '09:40',
    firma: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 15 Q 40 35 70 15" stroke="black" fill="none" stroke-width="2"/></svg>'
  },
  {
    id: '103',
    fecha: today,
    conductor: 'Andrés Gómez',
    zona: 'Oriente',
    tipoDocumento: 'Factura',
    pedido: 'F-9040',
    cliente: 'Obras San Nicolás',
    estado: 'ENTREGADO',
    horaLlegada: '10:10',
    horaSalida: '10:40',
    firma: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 15 25 Q 45 5 75 25" stroke="black" fill="none" stroke-width="2"/></svg>'
  },
  {
    id: '104',
    fecha: today,
    conductor: 'Carlos Pérez',
    zona: 'Medellín',
    tipoDocumento: 'Remisión',
    pedido: 'REM-505',
    cliente: 'Ingeniería Bello S.A.S.',
    estado: 'ASIGNADO',
    horaLlegada: '',
    horaSalida: '',
    firma: ''
  },
  {
    id: '105',
    fecha: today,
    conductor: 'Andrés Gómez',
    zona: 'Medellín',
    tipoDocumento: 'Factura',
    pedido: 'F-9100',
    cliente: 'Construcciones Poblado',
    estado: 'ASIGNADO',
    horaLlegada: '',
    horaSalida: '',
    firma: ''
  }
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
  const { fecha, conductor, zona, tipoDocumento, pedido, cliente } = req.body;
  if (!fecha || !conductor || !zona || !tipoDocumento || !pedido || !cliente) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  const nuevaEntrega = {
    id: Date.now().toString(),
    fecha,
    conductor,
    zona,
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
