const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// 🔹 SQLite
const Database = require('better-sqlite3');

// 🔹 Asegurarnos de que la base de datos se cree en la carpeta del backend
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

// 🔥 Crear tablas automáticamente
db.prepare(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    precio_compra REAL,
    precio_venta REAL,
    stock INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER,
    cantidad INTEGER,
    total REAL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS deudas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    total REAL,
    pagado REAL DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ===================
// Rutas Productos
// ===================
app.post('/productos', (req, res) => {
  const { nombre, precio_compra, precio_venta, stock } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO productos (nombre, precio_compra, precio_venta, stock)
      VALUES (?, ?, ?, ?)
    `).run(nombre, precio_compra, precio_venta, stock);

    res.send({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/productos', (req, res) => {
  try {
    const productos = db.prepare(`SELECT * FROM productos`).all();
    res.send(productos);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/productos/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM productos WHERE id = ?`).run(req.params.id);
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/productos/:id', (req, res) => {
  const { nombre, precio_compra, precio_venta, stock } = req.body;
  try {
    db.prepare(`
      UPDATE productos
      SET nombre = ?, precio_compra = ?, precio_venta = ?, stock = ?
      WHERE id = ?
    `).run(nombre, precio_compra, precio_venta, stock, req.params.id);
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// Rutas Ventas
// ===================
app.post('/ventas', (req, res) => {
  const { producto_id, cantidad } = req.body;
  try {
    const producto = db.prepare("SELECT * FROM productos WHERE id = ?").get(producto_id);
    if (!producto) return res.status(404).send("Producto no existe");
    if (producto.stock < cantidad) return res.status(400).send("No hay suficiente stock");

    const total = producto.precio_venta * cantidad;
    db.prepare(`INSERT INTO ventas (producto_id, cantidad, total) VALUES (?, ?, ?)`).run(producto_id, cantidad, total);
    db.prepare(`UPDATE productos SET stock = stock - ? WHERE id = ?`).run(cantidad, producto_id);

    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/ventas', (req, res) => {
  try {
    const ventas = db.prepare(`
      SELECT v.*, p.nombre 
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
      ORDER BY v.fecha DESC
    `).all();
    res.send(ventas);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// Rutas Ganancias
// ===================
app.get('/ganancias', (req, res) => {
  try {
    const result = db.prepare(`SELECT SUM(total) as total FROM ventas`).get();
    res.send({ total: result.total || 0 });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// Rutas Deudas
// ===================
app.post('/deudas', (req, res) => {
  const { cliente, total } = req.body;
  try {
    db.prepare(`INSERT INTO deudas (cliente, total) VALUES (?, ?)`).run(cliente, total);
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/deudas', (req, res) => {
  try {
    const deudas = db.prepare(`SELECT *, (total - pagado) as pendiente FROM deudas`).all();
    res.send(deudas);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/deudas/pagar/:id', (req, res) => {
  const { monto } = req.body;
  try {
    const deuda = db.prepare(`SELECT * FROM deudas WHERE id = ?`).get(req.params.id);
    if (!deuda) return res.status(404).send("Deuda no encontrada");

    const nuevoPagado = deuda.pagado + monto;
    if (nuevoPagado > deuda.total) return res.status(400).send("El pago excede la deuda");

    db.prepare(`UPDATE deudas SET pagado = ? WHERE id = ?`).run(nuevoPagado, req.params.id);
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// Servidor
// ===================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo 🚀 en puerto ${PORT}`));