(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaItems tbody");
  const titleEl = document.getElementById("tituloLista");
  const tabServicios = document.getElementById("tabServicios");
  const tabArticulos = document.getElementById("tabArticulos");
  const addBtn = document.getElementById("btnAgregar");
  const backdrop = document.getElementById("itemBackdrop");
  const form = document.getElementById("itemForm");
  const formTitle = document.getElementById("itemModalTitle");
  const nameInput = document.getElementById("itemName");
  const categorySelect = document.getElementById("itemCategory");
  const priceInput = document.getElementById("itemPrice");
  const stockInput = document.getElementById("itemStock");

  let mode = "servicios";
  let products = [];
  let editing = null;

  const categoryOptions = {
    servicios: ["Servicio", "Paquete", "Otro"],
    articulos: ["Producto", "Insumo", "Otro"],
  };

  function formatMoney(amount) {
    const value = Number(amount || 0);
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function normalizeCategory(category) {
    return String(category || "").toLowerCase();
  }

  function isService(product) {
    const category = normalizeCategory(product.category);
    return category.includes("servicio");
  }

  function getFilteredProducts() {
    return products.filter((product) =>
      mode === "servicios" ? isService(product) : !isService(product)
    );
  }

  function render() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (titleEl) {
      titleEl.textContent = mode === "servicios" ? "Servicios" : "Articulos";
    }

    const list = getFilteredProducts();
    if (!list.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="empty-state">No hay items registrados.</td>`;
      tableBody.appendChild(tr);
      return;
    }
    list.forEach((product) => {
      const tr = document.createElement("tr");
      const stock = Number.isFinite(product.stock) ? product.stock : "-";
      tr.innerHTML = `
        <td>${product.name || ""}</td>
        <td>${product.category || "-"}</td>
        <td>${formatMoney(product.price || 0)}</td>
        <td>${stock}</td>
        <td>
          <button class="btn-sm" data-edit="${product._id}">Editar</button>
          <button class="btn-sm" data-del="${product._id}">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const product = products.find((item) => item._id === id);
        if (product) {
          handleEdit(product);
        }
      });
    });

    tableBody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const product = products.find((item) => item._id === id);
        if (product) {
          handleDelete(product);
        }
      });
    });
  }

  function openModal(product) {
    if (!backdrop || !form) return;
    editing = product || null;
    if (formTitle) {
      formTitle.textContent = editing ? "Editar item" : "Nuevo item";
    }
    if (nameInput) nameInput.value = editing?.name || "";

    if (categorySelect) {
      const options = mode === "servicios" ? categoryOptions.servicios : categoryOptions.articulos;
      categorySelect.innerHTML = "";
      options.forEach((option) => {
        const el = document.createElement("option");
        el.value = option;
        el.textContent = option;
        categorySelect.appendChild(el);
      });
      const current = editing?.category || options[0];
      categorySelect.value = options.includes(current) ? current : options[0];
    }

    if (priceInput) priceInput.value = editing?.price ?? "";
    if (stockInput) {
      const defaultStock = mode === "servicios" ? 0 : 1;
      stockInput.value = editing?.stock ?? defaultStock;
    }
    backdrop.style.display = "flex";
  }

  function closeModal() {
    if (!backdrop || !form) return;
    backdrop.style.display = "none";
    form.reset();
    editing = null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = nameInput?.value?.trim() || "";
    const category = categorySelect?.value || "";
    const price = Number.parseFloat(priceInput?.value || "0");
    const stockValue = Number.parseInt(stockInput?.value || "0", 10);

    if (!name) {
      alert("Ingresa el nombre.");
      return;
    }
    if (!category) {
      alert("Selecciona una categoria.");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      alert("Ingresa un precio valido.");
      return;
    }
    if (Number.isNaN(stockValue) || stockValue < 0) {
      alert("Ingresa un stock valido.");
      return;
    }

    const payload = {
      name,
      category,
      price,
      stock: stockValue,
    };

    try {
      if (editing?._id) {
        await api.patch(`/products/${editing._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      await loadProducts();
      closeModal();
    } catch (err) {
      alert("No se pudo guardar el producto");
    }
  }

  async function handleEdit(product) {
    openModal(product);
  }

  async function handleDelete(product) {
    const ok = confirm(`Eliminar ${product.name || "producto"}?`);
    if (!ok) return;
    try {
      await api.delete(`/products/${product._id}`);
      await loadProducts();
    } catch (err) {
      alert("No se pudo eliminar el producto");
    }
  }

  async function loadProducts() {
    try {
      const data = await api.get("/products");
      products = Array.isArray(data) ? data : [];
      render();
    } catch (err) {
      alert("No se pudieron cargar productos");
    }
  }

  tabServicios?.addEventListener("click", () => {
    mode = "servicios";
    tabServicios.classList.add("active");
    tabArticulos?.classList.remove("active");
    render();
  });

  tabArticulos?.addEventListener("click", () => {
    mode = "articulos";
    tabArticulos.classList.add("active");
    tabServicios?.classList.remove("active");
    render();
  });

  addBtn?.addEventListener("click", () => openModal());
  document.getElementById("closeItem")?.addEventListener("click", closeModal);
  document.getElementById("cancelItem")?.addEventListener("click", closeModal);
  form?.addEventListener("submit", handleSubmit);

  loadProducts();
})();
