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
  { id: '2', nombre: 'Carlos', apellido: 'Pérez' },
  { id: '3', nombre: 'Mateo', apellido: 'Restrepo' }
];

const firmaDemo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M 10 20 Q 30 5 50 20 T 90 20" stroke="black" fill="none" stroke-width="2"/></svg>';

// Historial enriquecido con fechas pasadas y del mes para ver tendencias
let entregas = [
  { id: '201', fecha: '2026-09-15', conductor: 'Andrés Gómez', zona: 'Medellín', tipoDocumento: 'Factura', pedido: 'F-8100', cliente: 'Construcciones El Norte', estado: 'ENTREGADO', horaLlegada: '08:00', horaSalida: '08:35', firma: firmaDemo },
  { id: '202', fecha: '2026-09-20', conductor: 'Carlos Pérez', zona: 'Oriente', tipoDocumento: 'Remisión', pedido: 'REM-410', cliente: 'Obras Rionegro', estado: 'ENTREGADO', horaLlegada: '09:10', horaSalida: '09:50', firma: firmaDemo },
  { id: '203', fecha: '2026-10-01', conductor: 'Mateo Restrepo', zona: 'Medellín', tipoDocumento: 'Factura', pedido: 'F-8900', cliente: 'Ingeniería Poblado', estado: 'ENTREGADO', horaLlegada: '07:30', horaSalida: '08:05', firma: firmaDemo },
  { id: '204', fecha: '2026-10-05', conductor: 'Andrés Gómez', zona: 'Oriente', tipoDocumento: 'Factura', pedido: 'F-8920', cliente: 'Constructora Marinilla', estado: 'ENTREGADO', horaLlegada: '10:00', horaSalida: '10:30', firma: firmaDemo },
  { id: '205', fecha: '2026-10-10', conductor: 'Carlos Pérez', zona: 'Medellín', tipoDocumento: 'Remisión', pedido: 'REM-480', cliente: 'Estructuras envigado', estado: 'ENTREGADO', horaLlegada: '11:15', horaSalida: '11:45', firma: firmaDemo },
  { id: '206', fecha: '2026-10-15', conductor: 'Mateo Restrepo', zona: 'Oriente', tipoDocumento: 'Factura', pedido: 'F-9010', cliente: 'Redes Guarne', estado: 'ENTREGADO', horaLlegada: '08:45', horaSalida: '09:15', firma: firmaDemo },
  { id: '207', fecha: '2026-10-20', conductor: 'Andrés Gómez', zona: 'Medellín', tipoDocumento: 'Remisión', pedido: 'REM-501', cliente: 'Estructuras del Norte', estado: 'ENTREGADO', horaLlegada: '08:15', horaSalida: '08:40', firma: firmaDemo },
  { id: '208', fecha: '2026-10-20', conductor: 'Carlos Pérez', zona: 'Oriente', tipoDocumento: 'Factura', pedido: 'F-9021', cliente: 'Constructora El Peñol', estado: 'ENTREGADO', horaLlegada: '09:00', horaSalida: '09:40', firma: firmaDemo },
  { id: '209', fecha: '2026-10-21', conductor: 'Andrés Gómez', zona: 'Oriente', tipoDocumento: 'Factura', pedido: 'F-9040', cliente: 'Obras San Nicolás', estado: 'ENTREGADO', horaLlegada: '10:10', horaSalida: '10:40', firma: firmaDemo },
  { id: '210', fecha: '2026-10-21', conductor: 'Carlos Pérez', zona: 'Medellín', tipoDocumento: 'Remisión', pedido: 'REM-505', cliente: 'Ingeniería Bello', estado: 'ASIGNADO', horaLlegada: '', horaSalida: '', firma: '' },
  { id: '211', fecha: '2026-10-21', conductor: 'Mateo Restrepo', zona: 'Medellín', tipoDocumento: 'Factura', pedido: 'F-9100', cliente: 'Construcciones Sabaneta', estado: 'ASIGNADO', horaLlegada: '', horaSalida: '', firma: '' }
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
