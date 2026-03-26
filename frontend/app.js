const API = "http://localhost:3000/productos";

// cargar productos
async function cargarProductos() {
  const res = await fetch(API);
  const data = await res.json();

  const tabla = document.getElementById("tabla");
  tabla.innerHTML = "";

  data.forEach(p => {
    tabla.innerHTML += `
  <tr>
    <td>${p.nombre}</td>
    <td>${p.precio_compra}</td>
    <td>${p.precio_venta}</td>
    <td>${p.stock}</td>
    <td>
      <button onclick="editar(${p.id})">✏️</button>
      <button onclick="eliminar(${p.id})">❌</button>
    </td>
  </tr>
`;
  });
}

// agregar producto
async function agregarProducto() {
  const nombre = document.getElementById("nombre").value;
  const compra = document.getElementById("compra").value;
  const venta = document.getElementById("venta").value;
  const stock = document.getElementById("stock").value;

  await fetch(API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      nombre,
      precio_compra: compra,
      precio_venta: venta,
      stock
    })
  });

  cargarProductos();
}

// eliminar producto
async function eliminar(id) {
  await fetch(API + "/" + id, { method: "DELETE" });
  cargarProductos();
}

async function editar(id) {
  const nombre = prompt("Nuevo nombre:");
  const compra = prompt("Nuevo precio compra:");
  const venta = prompt("Nuevo precio venta:");
  const stock = prompt("Nuevo stock:");

  await fetch(API + "/" + id, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      nombre,
      precio_compra: compra,
      precio_venta: venta,
      stock
    })
  });

  cargarProductos();
}

let productosGlobal = [];

async function cargarProductos() {
  const res = await fetch(API);
  const data = await res.json();

  productosGlobal = data;
  renderTabla(data);
}

function renderTabla(data) {
  const tabla = document.getElementById("tabla");
  tabla.innerHTML = "";

  data.forEach(p => {
    tabla.innerHTML += `
    <tr>
        <td>${p.nombre}</td>
        <td>${p.precio_compra}</td>
        <td>${p.precio_venta}</td>
        <td>${p.precio_venta - p.precio_compra}</td>
        <td>${p.stock}</td>
        <td>
      <button onclick="editar(${p.id})">✏️</button>
      <button onclick="eliminar(${p.id})">❌</button>
    </td>
  </tr>
`;
  });
}

function filtrar() {
  const texto = document.getElementById("buscar").value.toLowerCase();

  const filtrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );

  renderTabla(filtrados);
}

async function cargarSelect() {
  const res = await fetch(API);
  const productos = await res.json();

  const select = document.getElementById("productoVenta");
  select.innerHTML = "";

  productos.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.nombre} (Stock: ${p.stock})
      </option>
    `;
  });
}

async function vender() {
  const producto_id = document.getElementById("productoVenta").value;
  const cantidad = parseInt(document.getElementById("cantidadVenta").value);

  if (!cantidad || cantidad <= 0) {
    alert("Cantidad inválida");
    return;
  }

  const res = await fetch("http://localhost:3000/ventas", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ producto_id, cantidad })
  });

  if (!res.ok) {
    const error = await res.text();
    alert(error);
    return;
  }

  alert("Venta realizada ✅");

  cargarProductos();
  cargarSelect();
}

async function cargarVentas() {
  const res = await fetch("http://localhost:3000/ventas");
  const data = await res.json();

  const tabla = document.getElementById("tablaVentas");
  tabla.innerHTML = "";

  data.forEach(v => {
    tabla.innerHTML += `
      <tr>
        <td>${v.nombre}</td>
        <td>${v.cantidad}</td>
        <td>$${v.total}</td>
        <td>${v.fecha}</td>
      </tr>
    `;
  });
}

async function cargarGanancias() {
  const res = await fetch("http://localhost:3000/ganancias");
  const data = await res.json();

  document.getElementById("ganancias").innerText =
    "Total: $" + data.total;
}

async function crearDeuda() {
  const cliente = document.getElementById("cliente").value;
  const total = parseFloat(document.getElementById("montoDeuda").value);

  await fetch("http://localhost:3000/deudas", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ cliente, total })
  });

  cargarDeudas();
}

async function cargarDeudas() {
  const res = await fetch("http://localhost:3000/deudas");
  const data = await res.json();

  const tabla = document.getElementById("tablaDeudas");
  tabla.innerHTML = "";

  data.forEach(d => {
    tabla.innerHTML += `
      <tr>
        <td>${d.cliente}</td>
        <td>$${d.total}</td>
        <td>$${d.pagado}</td>
        <td>$${d.pendiente}</td>
        <td>
  <span class="badge ${d.pendiente == 0 ? 'pagado' : 'pendiente'}">
    ${d.pendiente == 0 ? 'Pagado' : 'Pendiente'}
  </span>
</td>
      </tr>
    `;
  });
}

async function pagar(id) {
  const monto = parseFloat(prompt("¿Cuánto pagó?"));

  if (!monto || monto <= 0) {
    alert("Monto inválido");
    return;
  }

  const res = await fetch("http://localhost:3000/deudas/pagar/" + id, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ monto })
  });

  if (!res.ok) {
    const error = await res.text();
    alert(error);
    return;
  }

  alert("Pago registrado ✅");

  cargarDeudas();
}async function pagar(id) {
  const monto = parseFloat(prompt("¿Cuánto pagó?"));

  if (!monto || monto <= 0) {
    alert("Monto inválido");
    return;
  }

  const res = await fetch("http://localhost:3000/deudas/pagar/" + id, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ monto })
  });

  if (!res.ok) {
    const error = await res.text();
    alert(error);
    return;
  }

  alert("Pago registrado ✅");

  cargarDeudas();
}
cargarProductos();
cargarSelect();
cargarVentas();
cargarGanancias();
cargarDeudas();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}