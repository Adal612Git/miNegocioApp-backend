(() => {
  const api = new ApiClient();
  const messageEl = document.getElementById("verifyMessage");

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }

  function setMessage(text) {
    if (messageEl) {
      messageEl.textContent = text;
    }
  }

  async function verifyAccount() {
    const token = getToken();
    if (!token) {
      setMessage("Token invalido.");
      return;
    }

    try {
      await api.get(`/auth/verify/${token}`);
      setMessage("Cuenta activada con exito. Redirigiendo al login...");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } catch (err) {
      setMessage("No se pudo verificar tu cuenta.");
    }
  }

  verifyAccount();
})();
