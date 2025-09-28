// --------------- 3D Section ---------------
let scene, camera, renderer;
const canvas = document.getElementById("threeCanvas");
let wallMeshes = [];

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThree();

function processImageUpload() {
  const input = document.getElementById("imageUpload");
  if (!input.files[0]) return alert("Please upload a 2D floor plan!");
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = () => processImage(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function processImage(img) {
  const canvasInput = document.getElementById("inputCanvas");
  const ctx = canvasInput.getContext("2d");
  canvasInput.width = img.width;
  canvasInput.height = img.height;
  ctx.drawImage(img, 0, 0);

  clearWalls();

  cv["onRuntimeInitialized"] = () => {
    let src = cv.imread("inputCanvas");
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, dst, 50, 150, 3, false);
    let lines = new cv.Mat();
    cv.HoughLinesP(dst, lines, 1, Math.PI / 180, 50, 50, 10);

    for (let i = 0; i < lines.rows; ++i) {
      let line = lines.data32S.subarray(i * 4, i * 4 + 4);
      createWall3D(line[0], line[1], line[2], line[3], img.height);
    }

    src.delete(); dst.delete(); lines.delete();
  };
}

function clearWalls() {
  wallMeshes.forEach(wall => scene.remove(wall));
  wallMeshes = [];
}

function createWall3D(x1, y1, x2, y2, imgHeight) {
  const scale = 0.05;
  const xMid = ((x1 + x2) / 2) * scale;
  const zMid = ((imgHeight - y1 + imgHeight - y2) / 2) * scale;
  const dx = x2 - x1;
  const dz = y2 - y1;
  const length = Math.sqrt(dx*dx + dz*dz) * scale;
  const angle = Math.atan2(dz, dx);

  const wallGeometry = new THREE.BoxGeometry(length, 2, 0.2);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(xMid, 1, zMid);
  wall.rotation.y = -angle;

  scene.add(wall);
  wallMeshes.push(wall);
}

// --------------- Invoice Section ---------------
function addRow() {
  const tbody = document.getElementById("invoiceBody");
  const rowCount = tbody.rows.length + 1;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="text"></td>
    <td><input type="text"></td>
    <td><input type="number" class="price"></td>
    <td><button onclick="deleteRow(this)">Delete</button></td>
  `;
}

function deleteRow(btn) {
  const row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
  updateSerialNumbers();
}

function updateSerialNumbers() {
  const rows = document.querySelectorAll("#invoiceBody tr");
  rows.forEach((row, i) => {
    row.cells[0].textContent = i+1;
  });
}

// Load invoice from JSON
function loadInvoice(input) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    const tbody = document.getElementById("invoiceBody");
    tbody.innerHTML = "";
    data.forEach((item, i) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${i+1}</td>
        <td><input type="text" value="${item.name}"></td>
        <td><input type="text" value="${item.material}"></td>
        <td><input type="number" class="price" value="${item.price}"></td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
      `;
    });
  };
  reader.readAsText(input.files[0]);
}

// Preview Invoice
function previewInvoice() {
  const invoiceData = getInvoiceData();
  alert("Preview:\n" + invoiceData.map(i => `${i.name} - ${i.material} - ${i.price}`).join("\n"));
}

// Download PDF
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Logo
  const img = new Image();
  img.src = "https://via.placeholder.com/100x50.png?text=Logo";
  img.onload = () => {
    doc.addImage(img, 'PNG', 80, 10, 50, 25);

    // Header
    doc.setFontSize(16);
    doc.setFont("Arial", "bold");
    doc.text("Varshith Interior Solution", 105, 50, null, null, "center");

    // Table
    const data = getInvoiceData();
    let startY = 60;
    doc.setFontSize(12);
    data.forEach((item, i) => {
      doc.text(`${i+1}`, 10, startY);
      doc.text(item.name, 20, startY);
      doc.text(item.material, 80, startY);
      doc.text(item.price.toString(), 160, startY, null, null, "right");
      startY += 10;
    });

    // Footer
    doc.setFontSize(10);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 10, 280);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 160, 280, null, null, "right");

    doc.save("invoice.pdf");
  };
}

function getInvoiceData() {
  const rows = document.querySelectorAll("#invoiceBody tr");
  return Array.from(rows).map(row => ({
    name: row.cells[1].querySelector("input").value,
    material: row.cells[2].querySelector("input").value,
    price: parseFloat(row.cells[3].querySelector("input").value) || 0
  }));
}
