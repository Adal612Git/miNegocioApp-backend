(() => {
  const api = new ApiClient();
  const catalogBody = document.querySelector("#tablaCatalogo tbody");
  const cartBody = document.querySelector("#tablaCarrito tbody");
  const totalEl = document.getElementById("total");
  const payBtn = document.getElementById("btnCobrar");

  let catalog = [];
  let cart = [];

  function formatMoney(cents) {
    const amount = (cents || 0) / 100;
    return amount.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function computeTotal() {
    return cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }

  function renderCatalog() {
    if (!catalogBody) return;
    catalogBody.innerHTML = "";

    catalog.forEach((product) => {
      const tr = document.createElement("tr");
      const price = formatMoney(product.priceCents || product.price_cents || 0);
      const stock = product.stock ?? 0;
      tr.innerHTML = `
        <td>${product.name || ""}</td>
        <td>${product.type || "product"}</td>
        <td>${price}</td>
        <td>
          <button class="btn-sm">Agregar</button>
        </td>
      `;
      tr.querySelector("button")?.addEventListener("click", () => {
        addToCart(product);
      });
      catalogBody.appendChild(tr);
    });
  }

  function renderCart() {
    if (!cartBody) return;
    cartBody.innerHTML = "";

    cart.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name} x${item.quantity}</td>
        <td>${formatMoney(item.priceCents * item.quantity)}</td>
        <td><button class="btn-sm">Quitar</button></td>
      `;
      tr.querySelector("button")?.addEventListener("click", () => {
        removeFromCart(item.productId);
      });
      cartBody.appendChild(tr);
    });

    if (totalEl) {
      totalEl.textContent = formatMoney(computeTotal());
    }
  }

  function addToCart(product) {
    const productId = product._id || product.id;
    if (!productId) return;

    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId,
        name: product.name,
        priceCents: product.priceCents ?? product.price_cents ?? 0,
        quantity: 1,
      });
    }
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter((item) => item.productId !== productId);
    renderCart();
  }

  function parseAmountToCents(value) {
    if (!value) return 0;
    const normalized = value.replace(/[^0-9.]/g, "");
    if (!normalized) return 0;
    const amount = Number.parseFloat(normalized);
    if (Number.isNaN(amount)) return 0;
    return Math.round(amount * 100);
  }

  async function handlePay() {
    if (!cart.length) {
      alert("Carrito vacio");
      return;
    }

    const input = document.getElementById("mRecibido");
    const raw = input?.value || prompt("Monto recibido");
    const amountPaidCents = parseAmountToCents(String(raw || ""));

    try {
      const sale = await api.post("/sales", {
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        amount_paid_cents: amountPaidCents,
      });

      const changeCents =
        sale?.changeCents ?? sale?.change_cents ?? sale?.change ?? 0;
      const changeEl = document.getElementById("mCambio");
      if (changeEl) {
        changeEl.textContent = formatMoney(changeCents);
      } else {
        alert(`Cambio: ${formatMoney(changeCents)}`);
      }

      cart = [];
      renderCart();
    } catch (err) {
      if (err?.status === 409) {
        alert("Stock insuficiente");
        return;
      }
      alert("No se pudo procesar la venta");
    }
  }

  async function loadProducts() {
    try {
      const data = await api.get("/products");
      catalog = Array.isArray(data) ? data : [];
      renderCatalog();
    } catch (err) {
      alert("No se pudieron cargar productos");
    }
  }

  payBtn?.addEventListener("click", handlePay);

  loadProducts();
})();
