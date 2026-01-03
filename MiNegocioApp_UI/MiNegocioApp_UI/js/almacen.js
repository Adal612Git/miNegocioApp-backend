const servicios = [
  {nombre:"Corte de cabello", cat:"Estética", precio:120, stock:null},
  {nombre:"Barba", cat:"Estética", precio:80, stock:null},
  {nombre:"Lavado", cat:"Estética", precio:50, stock:null},
];

const articulos = [
  {nombre:"Shampoo 250ml", cat:"Productos", precio:95, stock:18},
  {nombre:"Cera para cabello", cat:"Productos", precio:110, stock:9},
  {nombre:"Gel", cat:"Productos", precio:65, stock:22},
];

let mode = "servicios";

function render(){
  const data = mode === "servicios" ? servicios : articulos;
  document.getElementById("tituloLista").textContent = mode === "servicios" ? "Servicios" : "Artículos";

  const tbody = document.querySelector("#tablaItems tbody");
  tbody.innerHTML = "";
  data.forEach((it, idx)=>{
    const stock = (it.stock === null) ? "—" : it.stock;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.nombre}</td>
      <td>${it.cat}</td>
      <td>$ ${it.precio}</td>
      <td>${stock}</td>
      <td><button class="btn-sm" data-del="${idx}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = () => {
      const i = Number(btn.getAttribute("data-del"));
      data.splice(i,1);
      render();
    };
  });
}

render();

document.getElementById("tabServicios").onclick = ()=>{
  mode="servicios";
  document.getElementById("tabServicios").classList.add("active");
  document.getElementById("tabArticulos").classList.remove("active");
  render();
};

document.getElementById("tabArticulos").onclick = ()=>{
  mode="articulos";
  document.getElementById("tabArticulos").classList.add("active");
  document.getElementById("tabServicios").classList.remove("active");
  render();
};

document.getElementById("btnAgregar").onclick = ()=>{
  const data = mode === "servicios" ? servicios : articulos;
  if(mode==="servicios"){
    data.push({nombre:"Servicio demo", cat:"General", precio:100, stock:null});
  }else{
    data.push({nombre:"Artículo demo", cat:"General", precio:50, stock:10});
  }
  render();
};
