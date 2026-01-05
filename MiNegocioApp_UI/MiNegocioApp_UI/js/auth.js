(() => {
  const api = new ApiClient();

  const blockedEmailDomains = new Set([
    "asd.com",
    "example.com",
    "test.com",
    "mail.com",
  ]);

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setFieldError(field, message) {
    const fieldEl = document.querySelector(`[data-field="${field}"]`);
    if (fieldEl) {
      fieldEl.classList.toggle("error", Boolean(message));
    }
    const errorEl = document.querySelector(`[data-error="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message || "";
    }
  }

  function clearErrors() {
    document.querySelectorAll("[data-field]").forEach((field) => {
      field.classList.remove("error");
    });
    document.querySelectorAll("[data-error]").forEach((el) => {
      el.textContent = "";
    });
    const formError = document.getElementById("registerError");
    if (formError) {
      formError.textContent = "";
    }
  }

  function setFormError(message) {
    const formError = document.getElementById("registerError");
    if (formError) {
      formError.textContent = message || "";
    }
  }

  function normalizePhone(raw) {
    const withoutSpaces = String(raw || "").replace(/\s+/g, "");
    return withoutSpaces.replace(/\D/g, "").slice(0, 10);
  }

  function isValidEmail(email) {
    if (!email) return false;
    const parts = email.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    if (!domain || !domain.includes(".")) return false;
    if (blockedEmailDomains.has(domain)) return false;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  function bindPhoneMask() {
    const phoneInput = document.getElementById("phone");
    if (!phoneInput) return;
    phoneInput.addEventListener("input", () => {
      const normalized = normalizePhone(phoneInput.value);
      phoneInput.value = normalized;
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = getValue("email");
    const password = getValue("password");

    try {
      const data = await api.post("/auth/login", { email, password });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        const existing = localStorage.getItem("user");
        if (!existing) {
          const nameFromEmail = email.split("@")[0] || "Usuario";
          localStorage.setItem(
            "user",
            JSON.stringify({ name: nameFromEmail })
          );
        }
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      alert("Credenciales invalidas");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const businessName =
      getValue("business_name") || getValue("businessName") || getValue("negocio");
    const name = getValue("name") || getValue("full_name") || getValue("nombre");
    const phone = normalizePhone(getValue("phone"));
    const email = getValue("email");
    const password = getValue("password");
    const passwordConfirm = getValue("password_confirm");

    let hasError = false;

    if (!name || name.length < 2) {
      setFieldError("name", "Ingresa un nombre valido.");
      hasError = true;
    }

    if (!phone || phone.length !== 10) {
      setFieldError("phone", "El telefono debe tener 10 digitos.");
      hasError = true;
    }

    if (!email || !isValidEmail(email)) {
      setFieldError("email", "Ingresa un correo valido.");
      hasError = true;
    }

    if (!businessName || businessName.length < 2) {
      setFieldError("business_name", "Ingresa el nombre del negocio.");
      hasError = true;
    }

    if (!password || password.length < 8) {
      setFieldError("password", "La contrasena debe tener al menos 8 caracteres.");
      hasError = true;
    }

    if (passwordConfirm && password !== passwordConfirm) {
      setFieldError("password_confirm", "Las contrasenas no coinciden.");
      hasError = true;
    }

    if (hasError) {
      setFormError("Revisa los campos marcados en rojo.");
      return;
    }

    try {
      const data = await api.post("/auth/register", {
        business_name: businessName,
        name,
        email,
        password,
        phone,
      });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (name) {
          localStorage.setItem("user", JSON.stringify({ name }));
        }
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      if (err?.data?.message === "EMAIL_ALREADY_EXISTS") {
        setFieldError("email", "El correo ya esta registrado.");
        setFormError("No se pudo registrar el usuario.");
        return;
      }
      if (err?.data?.message === "DUPLICATE_KEY") {
        setFieldError("email", "El correo ya esta registrado.");
        setFormError("No se pudo registrar el usuario.");
        return;
      }
      if (err?.data?.message === "VALIDATION_ERROR" && Array.isArray(err?.data?.errors)) {
        err.data.errors.forEach((issue) => {
          const field = String(issue.path || "");
          if (field) {
            setFieldError(field, "Dato invalido.");
          }
        });
        setFormError("No se pudo registrar el usuario.");
        return;
      }
      setFormError("No se pudo registrar el usuario. Intenta de nuevo.");
    }
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  } else {
    document.getElementById("loginButton")?.addEventListener("click", handleLogin);
  }

  async function handleForgotPassword(event) {
    event?.preventDefault?.();
    const email = getValue("email") || prompt("Ingresa tu correo");
    if (!email) return;
    try {
      await api.post("/auth/forgot-password", { email });
      alert("Si el correo existe, te enviaremos un enlace de recuperacion.");
    } catch (err) {
      alert("No se pudo enviar el correo de recuperacion.");
    }
  }

  document
    .getElementById("forgotPassword")
    ?.addEventListener("click", handleForgotPassword);

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  } else {
    document
      .getElementById("registerButton")
      ?.addEventListener("click", handleRegister);
  }

  bindPhoneMask();
})();
