(() => {
  const api = new ApiClient();

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = getValue("email");
    const password = getValue("password");

    try {
      const data = await api.post("/auth/login", { email, password });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      alert("Credenciales invalidas");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const businessName =
      getValue("business_name") || getValue("businessName") || getValue("negocio");
    const email = getValue("email");
    const password = getValue("password");
    const passwordConfirm = getValue("password_confirm");

    if (passwordConfirm && password !== passwordConfirm) {
      alert("Las contrasenas no coinciden");
      return;
    }

    try {
      const data = await api.post("/auth/register", {
        business_name: businessName,
        email,
        password,
      });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      alert("No se pudo registrar");
    }
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  } else {
    document.getElementById("loginButton")?.addEventListener("click", handleLogin);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  } else {
    document
      .getElementById("registerButton")
      ?.addEventListener("click", handleRegister);
  }
})();
