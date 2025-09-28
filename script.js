// ---------------------- 3D DESIGN -----------------------
let scene, camera, renderer, wallMeshes = [];
const canvas = document.getElementById("threeCanvas");

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);
  const ambient = new THREE.AmbientLight(0x888888);
  scene.add(ambient);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThree();

let uploadedImage = null;
document.getElementById("imageUpload").addEventListener("change", function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event){
    const img = new Image();
    img.onload = function(){
      uploadedImage = img;
      alert("Image uploaded! Click 'Generate 3D Design' to view walls.");
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(file);
});

function clearWalls(){
  wallMeshes.forEach(w => scene.remove(w));
  wallMeshes = [];
}

function generate3D(){
  if(!uploadedImage) return alert("Please upload a 2D floor plan first.");
  clearWalls();

  const canvasInput = document.getElementById("inputCanvas");
  canvasInput.width = uploadedImage.width;
  canvasInput.height = uploadedImage.height;
  const ctx = canvasInput.getContext("2d");
  ctx.drawImage(uploadedImage,0,0);

  cv['onRuntimeInitialized']=()=>{
    let src = cv.imread("inputCanvas");
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY,0);
    cv.Canny(src, dst, 50,150,3,false);
    let lines = new cv.Mat();
    cv.HoughLinesP(dst, lines, 1, Math.PI/180,50,50,10);

    for(let i=0;i<lines.rows;i++){
      let line = lines.data32S.subarray(i*4,i*4+4);
      createWall3D(line[0],line[1],line[2],line[3], uploadedImage.height);
    }

    src.delete(); dst.delete(); lines.delete();
  }
}

function createWall3D(x1,y1,x2,y2,imgHeight){
  const scale = 0.05;
  const xMid = ((x1+x2)/2)*scale;
  const zMid = ((imgHeight-y1 + imgHeight-y2)/2)*scale;
  const dx = x2-x1;
  const dz = y2-y1;
  const length = Math.sqrt(dx*dx+dz*dz)*scale;
  const angle = Math.atan2(dz,dx);

  const wallGeometry = new THREE.BoxGeometry(length,2,0.2);
  const wallMaterial = new THREE.MeshStandardMaterial({color:0x3498db});
  const wall = new THREE.Mesh(wallGeometry,wallMaterial);
  wall.position.set(xMid,1,zMid);
  wall.rotation.y = -angle;

  scene.add(wall);
  wallMeshes.push(wall);
}

// ---------------------- INVOICE -----------------------
function addRow(){
  const tbody = document.getElementById("invoiceBody");
  const rowCount = tbody.rows.length;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${rowCount+1}</td>
    <td><input type="text" value=""/></td>
    <td><input type="text" value="INV${rowCount+1}"/></td>
    <td><input type="date" value=""/></td>
    <td><input type="text" value=""/></td>
    <td><input type="text" value=""/></td>
    <td><input type="number" value="0" class="price"/></td>
  `;
  updateTotals();
}

function updateTotals(){
  let total = 0;
  document.querySelectorAll(".price").forEach(p=>{
    total += parseFloat(p.value)||0;
  });
  document.getElementById("totalAmount").innerText = total.toFixed(2);
  const gst = total*0.18;
  document.getElementById("gstAmount").innerText = gst.toFixed(2);
  document.getElementById("finalAmount").innerText = (total+gst).toFixed(2);
}

document.addEventListener("input", updateTotals);

function getInvoiceData(){
  const tbody = document.getElementById("invoiceBody");
  let data = [];
  for(let row of tbody.rows){
    let rowData = [];
    for(let cell of row.cells){
      let input = cell.querySelector("input");
      rowData.push(input ? input.value : cell.innerText);
    }
    data.push(rowData);
  }
  return data;
}

function previewInvoice(){
  updateTotals();
  const data = getInvoiceData();
  let preview = "<h2>Invoice Preview</h2><table border='1'><tr><th>Sl No</th><th>Client</th><th>Invoice No</th><th>Date</th><th>Item</th><th>Material</th><th>Price</th></tr>";
  data.forEach(r=>{
    preview += "<tr>"+r.map(c=>`<td>${c}</td>`).join("")+"</tr>";
  });
  preview += "</table>";
  preview += `<p>Total: ₹${document.getElementById("totalAmount").innerText}</p>`;
  preview += `<p>GST: ₹${document.getElementById("gstAmount").innerText}</p>`;
  preview += `<p>Final: ₹${document.getElementById("finalAmount").innerText}</p>`;
  const w = window.open("", "Preview", "width=800,height=600");
  w.document.write(preview);
}

function downloadPDF(){
  updateTotals();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Logo
  const img = new Image();
  img.src = "https://via.placeholder.com/150x50?text=Logo"; // Replace with your logo
  img.onload = function(){
    doc.addImage(img, 'PNG', 70, 10, 70, 30);
    doc.setFont("Arial","bold");
    doc.text("Varshith Interior Solution", 105, 50, {align:'center'});
    
    const data = getInvoiceData();
    let startY = 60;
    doc.autoTable({
      startY,
      head:[["Sl","Client","Invoice No","Date","Item","Material","Price"]],
      body:data,
      theme:'grid',
      headStyles:{fillColor:[52,152,219], textColor:255},
      styles:{font:'Arial', fontSize:10}
    });
    let finalY = doc.lastAutoTable.finalY || startY+20;
    doc.text(`Total: ₹${document.getElementById("totalAmount").innerText}`, 14, finalY+10);
    doc.text(`GST: ₹${document.getElementById("gstAmount").innerText}`, 14, finalY+20);
    doc.text(`Final Total: ₹${document.getElementById("finalAmount").innerText}`, 14, finalY+30);

    // Footer
    doc.setFontSize(9);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106",14,280);
    doc.text("Phone: +91 9916511599 & +91 8553608981",14,288);

    doc.save("Invoice.pdf");
  }
}

// JSON Save/Load
function downloadInvoiceJSON(){
  const data = getInvoiceData();
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoice.json";
  a.click();
}

function loadInvoice(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const data = JSON.parse(e.target.result);
    const tbody = document.getElementById("invoiceBody");
    tbody.innerHTML = "";
    data.forEach((r,i)=>{
      const row = tbody.insertRow();
      row.innerHTML = r.map(c=>`<td><input type="text" value="${c}"/></td>`).join("");
      row.cells[2].querySelector("input").type="text"; // Invoice no
      row.cells[3].querySelector("input").type="date"; // Date
    });
    updateTotals();
  }
  reader.readAsText(file);
}
