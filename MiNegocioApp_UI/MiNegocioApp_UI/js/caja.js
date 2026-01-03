(() => {
  const api = new ApiClient();
  const catalogBody = document.querySelector("#tablaCatalogo tbody");
  const cartBody = document.querySelector("#tablaCarrito tbody");
  const totalEl = document.getElementById("total");
  const payBtn = document.getElementById("btnCobrar");
  const emptyBtn = document.getElementById("btnVaciar");
  const backdrop = document.getElementById("backdrop");
  const modalTotal = document.getElementById("mTotal");
  const receivedInput = document.getElementById("mRecibido");
  const changeEl = document.getElementById("mCambio");
  const confirmBtn = document.getElementById("confirmar");
  const cancelBtn = document.getElementById("cancelar");
  const closeBtn = document.getElementById("cerrar");
  const keypad = document.getElementById("keypad");

  let catalog = [];
  let cart = [];

  function formatMoney(amount) {
    const value = Number(amount || 0);
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function computeTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function renderCatalog() {
    if (!catalogBody) return;
    catalogBody.innerHTML = "";

    catalog.forEach((product) => {
      const tr = document.createElement("tr");
      const price = formatMoney(product.price || 0);
      const stock = product.stock ?? 0;
      tr.innerHTML = `
        <td>${product.name || ""}</td>
        <td>${product.category || "-"}</td>
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
        <td>${formatMoney(item.price * item.quantity)}</td>
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
        price: product.price ?? 0,
        quantity: 1,
      });
    }
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter((item) => item.productId !== productId);
    renderCart();
  }

  function parseAmount(value) {
    if (!value) return 0;
    const normalized = value.replace(/[^0-9.]/g, "");
    if (!normalized) return 0;
    const amount = Number.parseFloat(normalized);
    if (Number.isNaN(amount)) return 0;
    return amount;
  }

  function openPayModal() {
    if (!backdrop) return;
    const total = computeTotal();
    if (modalTotal) {
      modalTotal.textContent = formatMoney(total);
    }
    if (receivedInput) {
      receivedInput.value = "";
    }
    if (changeEl) {
      changeEl.textContent = formatMoney(0);
    }
    backdrop.style.display = "flex";
  }

  function closePayModal() {
    if (!backdrop) return;
    backdrop.style.display = "none";
  }

  function updateChange() {
    if (!receivedInput || !changeEl) return;
    const amountPaid = parseAmount(receivedInput.value || "");
    const total = computeTotal();
    const change = Math.max(0, amountPaid - total);
    changeEl.textContent = formatMoney(change);
  }

  async function handlePay() {
    if (!cart.length) {
      alert("Carrito vacio");
      return;
    }

    const raw = receivedInput?.value || "";
    const amountPaid = parseAmount(String(raw || ""));
    const total = computeTotal();

    if (!amountPaid || amountPaid <= 0) {
      alert("Ingresa el monto recibido.");
      return;
    }
    if (amountPaid < total) {
      alert("El monto recibido es menor al total.");
      return;
    }

    try {
      const sale = await api.post("/sales", {
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        amount_paid: amountPaid,
      });

      const computedTotal = sale?.total ?? total;
      const changeData = await api.post("/sales/change", {
        total: computedTotal,
        monto_recibido: amountPaid,
      });
      const changeAmount = changeData?.cambio ?? 0;
      if (changeEl) {
        changeEl.textContent = formatMoney(changeAmount);
      } else {
        alert(`Cambio: ${formatMoney(changeAmount)}`);
      }

      cart = [];
      renderCart();
      closePayModal();
    } catch (err) {
      if (err?.status === 409) {
        alert("Monto insuficiente o stock insuficiente");
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

  payBtn?.addEventListener("click", openPayModal);
  confirmBtn?.addEventListener("click", handlePay);
  cancelBtn?.addEventListener("click", closePayModal);
  closeBtn?.addEventListener("click", closePayModal);
  receivedInput?.addEventListener("input", updateChange);
  keypad?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!receivedInput) return;
    const value = target.textContent || "";
    if (value === "C") {
      receivedInput.value = "";
    } else if (value === "<") {
      receivedInput.value = receivedInput.value.slice(0, -1);
    } else if (/^[0-9]$/.test(value)) {
      receivedInput.value = `${receivedInput.value}${value}`.slice(0, 10);
    }
    updateChange();
  });
  emptyBtn?.addEventListener("click", () => {
    cart = [];
    renderCart();
  });

  loadProducts();
})();
