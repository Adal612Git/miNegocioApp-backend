(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaCitas tbody");
  const backdrop = document.getElementById("appointmentBackdrop");
  const form = document.getElementById("appointmentForm");
  const dateInput = document.getElementById("appointmentDate");
  const timeInput = document.getElementById("appointmentTime");
  const notesInput = document.getElementById("appointmentNotes");

  function formatDate(date) {
    return date.toLocaleDateString("es-MX");
  }

  function getLocalDateString(value) {
    const date = value ? new Date(value) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function renderAppointments(list) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!list.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="empty-state">No hay citas registradas.</td>`;
      tableBody.appendChild(tr);
      return;
    }

    list.forEach((item) => {
      const tr = document.createElement("tr");
      const date = item.date ? new Date(item.date) : null;
      const time = item.time || "";
      const status = item.status || "scheduled";

      tr.innerHTML = `
        <td>${date ? formatDate(date) : "-"}</td>
        <td>${time}</td>
        <td>${item.title || item.notes || ""}</td>
        <td>${item.notes || "-"}</td>
        <td>${status}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  async function loadAppointments() {
    try {
      const start = getLocalDateString();
      const end = getLocalDateString();

      const data = await api.get(
        `/appointments?start_date=${start}&end_date=${end}`
      );

      renderAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("No se pudieron cargar las citas");
    }
  }

  function openModal() {
    if (!backdrop) return;
    if (dateInput && !dateInput.value) {
      dateInput.value = getLocalDateString();
    }
    if (timeInput && !timeInput.value) {
      timeInput.value = "09:00";
    }
    backdrop.style.display = "flex";
  }

  function closeModal() {
    if (!backdrop) return;
    backdrop.style.display = "none";
    if (form) form.reset();
  }

  async function handleCreate(event) {
    event?.preventDefault?.();
    const date = dateInput?.value || "";
    const time = timeInput?.value || "";
    const notes = notesInput?.value || "";

    if (!date || !time) {
      alert("Completa los campos requeridos");
      return;
    }

    try {
      await api.post("/appointments", {
        date: date.trim(),
        time: time.trim(),
        notes: notes.trim(),
      });
      await loadAppointments();
      closeModal();
    } catch (err) {
      if (err?.status === 409) {
        alert("Horario ocupado");
        return;
      }
      alert("No se pudo crear la cita");
    }
  }

  document.getElementById("btnNuevaCita")?.addEventListener("click", openModal);
  document.getElementById("closeAppointment")?.addEventListener("click", closeModal);
  document.getElementById("cancelAppointment")?.addEventListener("click", closeModal);
  form?.addEventListener("submit", handleCreate);

  loadAppointments();
})();
