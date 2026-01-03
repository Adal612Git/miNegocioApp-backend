(() => {
  const api = new ApiClient();

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }

  async function handleReset(event) {
    event.preventDefault();
    const token = getToken();
    const password = document.getElementById("resetPassword")?.value?.trim();
    if (!token) {
      alert("Token invalido.");
      return;
    }
    if (!password) {
      alert("Ingresa una nueva contraseña.");
      return;
    }

    try {
      await api.post("/auth/reset-password", { token, password });
      alert("Contraseña actualizada. Ya puedes iniciar sesión.");
      window.location.href = "index.html";
    } catch (err) {
      alert("No se pudo actualizar la contraseña.");
    }
  }

  document.getElementById("resetForm")?.addEventListener("submit", handleReset);
})();
