const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// 🔥 SUPABASE (PostgreSQL)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:1211BoutiqueReyes@db.yxyoqthdxmrehfjgxvzm.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

// ===================
// PRODUCTOS
// ===================
app.post('/productos', async (req, res) => {
  const { nombre, precio_compra, precio_venta, stock } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, precio_compra, precio_venta, stock)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombre, precio_compra, precio_venta, stock]
    );

    res.send({ id: result.rows[0].id });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/productos', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM productos`);
    res.send(result.rows);

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM productos WHERE id = $1`, [req.params.id]);
    res.send({ success: true });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/productos/:id', async (req, res) => {
  const { nombre, precio_compra, precio_venta, stock } = req.body;

  try {
    await pool.query(
      `UPDATE productos
       SET nombre = $1, precio_compra = $2, precio_venta = $3, stock = $4
       WHERE id = $5`,
      [nombre, precio_compra, precio_venta, stock, req.params.id]
    );

    res.send({ success: true });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// VENTAS
// ===================
app.post('/ventas', async (req, res) => {
  const { producto_id, cantidad } = req.body;

  try {
    const producto = await pool.query(
      "SELECT * FROM productos WHERE id = $1",
      [producto_id]
    );

    if (producto.rows.length === 0) {
      return res.status(404).send("Producto no existe");
    }

    const p = producto.rows[0];

    if (p.stock < cantidad) {
      return res.status(400).send("No hay suficiente stock");
    }

    const total = p.precio_venta * cantidad;

    await pool.query(
      `INSERT INTO ventas (producto_id, cantidad, total)
       VALUES ($1, $2, $3)`,
      [producto_id, cantidad, total]
    );

    await pool.query(
      `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
      [cantidad, producto_id]
    );

    res.send({ success: true });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.nombre
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
      ORDER BY v.fecha DESC
    `);

    res.send(result.rows);

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// GANANCIAS
// ===================
app.get('/ganancias', async (req, res) => {
  try {
    const result = await pool.query(`SELECT SUM(total) as total FROM ventas`);
    res.send({ total: result.rows[0].total || 0 });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// DEUDAS
// ===================
app.post('/deudas', async (req, res) => {
  const { cliente, total } = req.body;

  try {
    await pool.query(
      `INSERT INTO deudas (cliente, total) VALUES ($1, $2)`,
      [cliente, total]
    );

    res.send({ success: true });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/deudas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, (total - pagado) as pendiente FROM deudas
    `);

    res.send(result.rows);

  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/deudas/pagar/:id', async (req, res) => {
  const { monto } = req.body;

  try {
    const deuda = await pool.query(
      `SELECT * FROM deudas WHERE id = $1`,
      [req.params.id]
    );

    if (deuda.rows.length === 0) {
      return res.status(404).send("Deuda no encontrada");
    }

    const d = deuda.rows[0];
    const nuevoPagado = Number(d.pagado) + Number(monto);

    if (nuevoPagado > d.total) {
      return res.status(400).send("El pago excede la deuda");
    }

    await pool.query(
      `UPDATE deudas SET pagado = $1 WHERE id = $2`,
      [nuevoPagado, req.params.id]
    );

    res.send({ success: true });

  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ===================
// SERVIDOR
// ===================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀 en puerto " + PORT);
});