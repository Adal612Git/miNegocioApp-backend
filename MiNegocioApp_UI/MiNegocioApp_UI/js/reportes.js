(() => {
  const api = new ApiClient();
  const desdeEl = document.getElementById("desde");
  const hastaEl = document.getElementById("hasta");
  const mesActualEl = document.getElementById("mesActual");
  const mesAnteriorEl = document.getElementById("mesAnterior");
  const topBody = document.querySelector("#topProductos tbody");
  const ventasBody = document.querySelector("#tablaVentas tbody");
  const bars = document.querySelectorAll(".bars .bar div");

  let productMap = new Map();

  function formatMoney(amount) {
    const value = Number(amount || 0);
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function toDateString(date) {
    return date.toISOString().slice(0, 10);
  }

  async function loadProductsMap() {
    try {
      const data = await api.get("/products");
      if (Array.isArray(data)) {
        productMap = new Map(data.map((item) => [String(item._id), item.name]));
      }
    } catch (err) {
      productMap = new Map();
    }
  }

  async function fetchReport(start, end) {
    return api.get(`/reports/sales?start_date=${start}&end_date=${end}`);
  }

  function renderTop(list) {
    if (!topBody) return;
    topBody.innerHTML = "";

    list.forEach((item) => {
      const name = productMap.get(String(item.product_id)) || "Producto";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${name}</td><td>${item.quantity || 0}</td>`;
      topBody.appendChild(tr);
    });
  }

  function renderVentas(list) {
    if (!ventasBody) return;
    ventasBody.innerHTML = "";

    list.forEach((item) => {
      const name = productMap.get(String(item.product_id)) || "Producto";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${name}</td><td>${item.quantity || 0}</td><td>${formatMoney(
        item.revenue || 0
      )}</td>`;
      ventasBody.appendChild(tr);
    });
  }

  async function loadMonthlySummary() {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    try {
      const current = await fetchReport(
        toDateString(currentStart),
        toDateString(currentEnd)
      );
      const prev = await fetchReport(
        toDateString(prevStart),
        toDateString(prevEnd)
      );

      const currentTotal = current?.total_income || 0;
      const prevTotal = prev?.total_income || 0;
      if (mesActualEl) mesActualEl.textContent = formatMoney(currentTotal);
      if (mesAnteriorEl) mesAnteriorEl.textContent = formatMoney(prevTotal);

      const max = Math.max(currentTotal, prevTotal, 1);
      if (bars[0]) bars[0].style.height = `${(currentTotal / max) * 100}%`;
      if (bars[1]) bars[1].style.height = `${(prevTotal / max) * 100}%`;
    } catch (err) {
      if (mesActualEl) mesActualEl.textContent = formatMoney(0);
      if (mesAnteriorEl) mesAnteriorEl.textContent = formatMoney(0);
    }
  }

  async function applyRange() {
    const start = desdeEl?.value;
    const end = hastaEl?.value;
    if (!start || !end) {
      alert("Selecciona desde/hasta");
      return;
    }

    try {
      const report = await fetchReport(start, end);
      const topProducts = Array.isArray(report?.top_products)
        ? report.top_products
        : [];
      renderTop(topProducts);
      renderVentas(topProducts);
    } catch (err) {
      alert("No se pudieron cargar los reportes");
    }
  }

  document.getElementById("btnAplicar")?.addEventListener("click", applyRange);
  document.getElementById("btnPdf")?.addEventListener("click", () => {
    alert("Exportacion PDF en preparacion.");
  });

  loadProductsMap().then(() => {
    loadMonthlySummary();
  });
})();