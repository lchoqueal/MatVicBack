const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const productController = require('./controllers/productController');
const { startListener } = require('./services/dbListener');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173','https://mat-vic-front.vercel.app','https://mat-vic-front-git-main-lchoqueals-projects.vercel.app'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => res.send('API funcionando'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3001;

// Verificar conexión a la DB antes de iniciar y habilitar Socket.IO
pool
  .query('SELECT 1')
  .then(() => {
    const server = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: { origin: '*' },
    });
  // pasar io al controller que lo necesita
  productController.setIO(io);

  // iniciar listener de DB para convertir NOTIFY en eventos Socket.IO
  startListener(io).catch(err => console.error('Error iniciando DB listener', err));

    io.on('connection', (socket) => {
      console.log('Cliente socket conectado:', socket.id);
    });

    app.use('/api/sales', salesRoutes);
  app.use('/api/alerts', alertsRoutes);

    server.listen(PORT, () => {
      console.log(`Backend corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  });
