// Marca el menú activo según el archivo actual
(function(){
  const path = location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
})();
