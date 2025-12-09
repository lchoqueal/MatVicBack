const { Client } = require('pg');
const db = require('../config/db');

let client;
let ioInstance = null;
let reconnectAttempts = 0;

const MAX_PAYLOAD_LENGTH = 2000; // evita intentar parsear payloads gigantes

async function startListener(io) {
  ioInstance = io;
  client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  });
  try {
    await client.connect();
  } catch (err) {
    console.error('DB listener connect error, will retry', err.message);
    scheduleReconnect(io);
    return;
  }
  await client.query('LISTEN stock_updated');
  await client.query('LISTEN stock_alert');

  client.on('notification', msg => {
    try {
      if (!msg.payload || msg.payload.length > MAX_PAYLOAD_LENGTH) {
        console.warn('Payload empty or too large, ignoring notification');
        return;
      }
      const payload = JSON.parse(msg.payload);
      if (ioInstance) {
        if (msg.channel === 'stock_updated') {
          ioInstance.emit('stock.updated', payload);
        } else if (msg.channel === 'stock_alert') {
          ioInstance.emit('stock.alert', payload);
        }
      }
    } catch (err) {
      console.error('Error parsing notification payload', err);
    }
  });

  client.on('error', err => {
    console.error('DB listener error', err);
    scheduleReconnect(io);
  });
}

function scheduleReconnect(io) {
  reconnectAttempts++;
  const wait = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
  console.log(`Reintentando conectar DB listener en ${wait}ms`);
  setTimeout(() => startListener(io), wait);
}

async function stopListener() {
  if (client) {
    try {
      await client.end();
    } catch (e) {}
  }
}

module.exports = { startListener, stopListener };
