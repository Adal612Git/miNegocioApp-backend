// Marca el menú activo según el archivo actual
(function(){
  const path = location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
})();

(function(){
  const stored = localStorage.getItem("user");
  const nameEls = document.querySelectorAll(".side-user .name");
  const avatarEls = document.querySelectorAll(".side-user .avatar");
  const firstNameEl = nameEls[0];
  const defaultName = (firstNameEl && firstNameEl.textContent || "").trim() || "Nombre";
  const applyName = (value) => {
    const safeName = String(value || "").trim() || defaultName;
    nameEls.forEach((el) => {
      el.textContent = safeName;
    });
    avatarEls.forEach((el) => {
      el.textContent = safeName.charAt(0).toUpperCase() || "U";
    });
  };

  if (!stored) {
    applyName(defaultName);
    return;
  }

  try {
    const user = JSON.parse(stored);
    const rawName = user && typeof user === "object" ? user.name : "";
    const name = typeof rawName === "string" ? rawName : String(rawName || "");
    if (!name.trim()) {
      applyName(defaultName);
      // Evita que un valor vacio quede persistido y se repita.
      try {
        localStorage.setItem("user", JSON.stringify({ ...(user || {}), name: defaultName }));
      } catch {
        // Si storage falla, solo usa el valor en UI.
      }
      return;
    }
    applyName(name);
  } catch {
    applyName(defaultName);
  }
})();
