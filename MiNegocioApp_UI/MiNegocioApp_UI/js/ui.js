// Marca el menú activo según el archivo actual
(function(){
  const path = location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
})();

(function(){
  const stored = localStorage.getItem("user");
  if (!stored) return;
  try {
    const user = JSON.parse(stored);
    const name = user?.name ? String(user.name) : "";
    if (!name) return;
    document.querySelectorAll(".side-user .name").forEach((el) => {
      el.textContent = name;
    });
    document.querySelectorAll(".side-user .avatar").forEach((el) => {
      el.textContent = name.trim().charAt(0).toUpperCase() || "U";
    });
  } catch {
    return;
  }
})();
