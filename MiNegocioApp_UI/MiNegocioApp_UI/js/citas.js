(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaCitas tbody");

  function formatTime(date) {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderAppointments(list) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    list.forEach((item) => {
      const tr = document.createElement("tr");
      const startAt = new Date(item.startAt || item.start_at);
      const endAt = new Date(item.endAt || item.end_at);
      const status = item.status || "scheduled";

      tr.innerHTML = `
        <td>${formatTime(startAt)} - ${formatTime(endAt)}</td>
        <td>${item.title || ""}</td>
        <td>${item.notes || "-"}</td>
        <td>${status}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  async function loadAppointments() {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );

      const data = await api.get(
        `/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
      );

      renderAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("No se pudieron cargar las citas");
    }
  }

  async function handleCreate(event) {
    event?.preventDefault?.();

    const title = prompt("Titulo de la cita");
    const startAt = prompt("Inicio (YYYY-MM-DDTHH:mm)");
    const endAt = prompt("Fin (YYYY-MM-DDTHH:mm)");
    const notes = prompt("Notas (opcional)") || "";

    if (!title || !startAt || !endAt) {
      alert("Completa los campos requeridos");
      return;
    }

    try {
      await api.post("/appointments", {
        title: title.trim(),
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        notes,
      });
      await loadAppointments();
      alert("Cita creada");
    } catch (err) {
      if (err?.status === 409) {
        alert("Horario ocupado");
        return;
      }
      alert("No se pudo crear la cita");
    }
  }

  document.getElementById("btnNuevaCita")?.addEventListener("click", handleCreate);

  loadAppointments();
})();
