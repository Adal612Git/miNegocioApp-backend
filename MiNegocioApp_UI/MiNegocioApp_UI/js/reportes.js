const ventas = [
  {fecha:"2025-12-01", concepto:"Corte + barba", total:200},
  {fecha:"2025-12-02", concepto:"Venta de shampoo", total:95},
  {fecha:"2025-12-03", concepto:"Corte", total:120},
  {fecha:"2025-12-05", concepto:"Cera para cabello", total:110},
];

const top = [
  {prod:"Corte de cabello", cant:18},
  {prod:"Barba", cant:12},
  {prod:"Shampoo 250ml", cant:9},
];

function money(n){ return `$ ${n.toLocaleString("es-MX")}`; }

function renderTop(){
  const tb = document.querySelector("#topProductos tbody");
  tb.innerHTML="";
  top.forEach(t=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.prod}</td><td>${t.cant}</td>`;
    tb.appendChild(tr);
  });
}

function renderVentas(list){
  const tb = document.querySelector("#tablaVentas tbody");
  tb.innerHTML="";
  list.forEach(v=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${v.fecha}</td><td>${v.concepto}</td><td>${money(v.total)}</td>`;
    tb.appendChild(tr);
  });
}

renderTop();
renderVentas(ventas);

document.getElementById("btnAplicar").onclick = ()=>{
  const d = document.getElementById("desde").value;
  const h = document.getElementById("hasta").value;
  if(!d || !h) return alert("Selecciona desde/hasta (demo).");
  const f = ventas.filter(v => v.fecha >= d && v.fecha <= h);
  renderVentas(f.length ? f : ventas);
};

document.getElementById("btnPdf").onclick = ()=>{
  alert("Exportación PDF (demo). Aquí iría tu generación real.");
};
