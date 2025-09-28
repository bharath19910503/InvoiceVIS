// -------------------- 3D Floor Plan --------------------
let scene, camera, renderer;
const canvas = document.getElementById("threeCanvas");

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThree();

document.getElementById("imageUpload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      processImage(img);
      document.getElementById("generate3D").style.display = "inline-block";
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

let wallMeshes = [];

function clearWalls() {
  wallMeshes.forEach((wall) => scene.remove(wall));
  wallMeshes = [];
}

function processImage(img) {
  const canvasInput = document.getElementById("inputCanvas");
  const ctx = canvasInput.getContext("2d");
  canvasInput.width = img.width;
  canvasInput.height = img.height;
  ctx.drawImage(img, 0, 0);
}

function generate3D() {
  const canvasInput = document.getElementById("inputCanvas");
  cv["onRuntimeInitialized"] = () => {
    let src = cv.imread("inputCanvas");
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, dst, 50, 150, 3, false);
    let lines = new cv.Mat();
    cv.HoughLinesP(dst, lines, 1, Math.PI / 180, 50, 50, 10);

    clearWalls();

    for (let i = 0; i < lines.rows; ++i) {
      let line = lines.data32S.subarray(i * 4, i * 4 + 4);
      let x1 = line[0];
      let y1 = line[1];
      let x2 = line[2];
      let y2 = line[3];
      createWall3D(x1, y1, x2, y2, canvasInput.height);
    }

    src.delete();
    dst.delete();
    lines.delete();
  };
}

function createWall3D(x1, y1, x2, y2, imgHeight) {
  const scale = 0.05;
  const xMid = ((x1 + x2) / 2) * scale;
  const zMid = ((imgHeight - y1 + imgHeight - y2) / 2) * scale;
  const dx = x2 - x1;
  const dz = y2 - y1;
  const length = Math.sqrt(dx * dx + dz * dz) * scale;
  const angle = Math.atan2(dz, dx);

  const wallGeometry = new THREE.BoxGeometry(length, 2, 0.2);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(xMid, 1, zMid);
  wall.rotation.y = -angle;

  scene.add(wall);
  wallMeshes.push(wall);
}

// -------------------- Invoice Functionality --------------------
function addRow() {
  const tbody = document.getElementById("invoiceBody");
  const rowCount = tbody.rows.length + 1;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="text" value=""></td>
    <td><input type="text" value=""></td>
    <td><input type="number" class="price" value="0"></td>
  `;
  attachInputListeners();
}

function attachInputListeners() {
  document.querySelectorAll(".price").forEach((input) => {
    input.removeEventListener("input", calculateTotal);
    input.addEventListener("input", calculateTotal);
  });
}

function calculateTotal() {
  let total = 0;
  document.querySelectorAll(".price").forEach((input) => {
    total += parseFloat(input.value) || 0;
  });
  const gst = total * 0.18;
  const final = total + gst;

  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("gstAmount").textContent = gst.toFixed(2);
  document.getElementById("finalAmount").textContent = final.toFixed(2);
}

function loadInvoice(input) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    const tbody = document.getElementById("invoiceBody");
    tbody.innerHTML = "";
    data.forEach((item, i) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${i + 1}</td>
        <td><input type="text" value="${item.name}"></td>
        <td><input type="text" value="${item.material}"></td>
        <td><input type="number" class="price" value="${item.price}"></td>
      `;
    });
    attachInputListeners();
    calculateTotal();
  };
  reader.readAsText(input.files[0]);
}

function downloadInvoice() {
  const rows = document.querySelectorAll("#invoiceBody tr");
  const data = Array.from(rows).map((row) => {
    const inputs = row.querySelectorAll("input");
    return {
      name: inputs[0].value,
      material: inputs[1].value,
      price: parseFloat(inputs[2].value) || 0,
    };
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoice.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("helvetica");

  doc.setFontSize(18);
  doc.text("Varshith Interior Solution", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text("No 39 BRN Ashish Layout Anekal - 562106", 10, 285);
  doc.text("+91 9916511599 & +91 8553608981", 150, 285);

  let startY = 40;
  doc.setFont(undefined, "bold");
  doc.text("Sl No", 10, startY);
  doc.text("Item Name", 30, startY);
  doc.text("Material", 90, startY);
  doc.text("Price", 160, startY);
  doc.setFont(undefined, "normal");

  startY += 10;
  let total = 0;
  const rows = document.querySelectorAll("#invoiceBody tr");
  rows.forEach((row, index) => {
    const inputs = row.querySelectorAll("input");
    const item = inputs[0].value;
    const material = inputs[1].value;
    const price = parseFloat(inputs[2].value) || 0;
    total += price;

    doc.text(`${index + 1}`, 10, startY);
    doc.text(item, 30, startY);
    doc.text(material, 90, startY);
    doc.text(price.toFixed(2), 160, startY);
    startY += 10;
  });

  const gst = total * 0.18;
  const final = total + gst;

  startY += 10;
  doc.text(`Total: ₹${total.toFixed(2)}`, 10, startY);
  doc.text(`GST (18%): ₹${gst.toFixed(2)}`, 60, startY);
  doc.text(`Final Total: ₹${final.toFixed(2)}`, 120, startY);

  doc.save("Invoice.pdf");
}

attachInputListeners();
