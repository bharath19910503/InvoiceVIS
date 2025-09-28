// ----------------- Invoice Functions -----------------
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
  calculateTotal();
}

function deleteRow(btn) {
  const row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
  updateSlNo();
  calculateTotal();
}

function updateSlNo() {
  const rows = document.querySelectorAll("#invoiceBody tr");
  rows.forEach((row, index) => {
    row.cells[0].textContent = index + 1;
  });
}

function calculateTotal() {
  let total = 0;
  document.querySelectorAll(".price").forEach(input => {
    total += parseFloat(input.value) || 0;
  });
  const gst = total * 0.18;
  const final = total + gst;

  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("gstAmount").textContent = gst.toFixed(2);
  document.getElementById("finalAmount").textContent = final.toFixed(2);
}

document.addEventListener("input", calculateTotal);

// ----------------- Invoice Upload & Edit -----------------
function loadInvoice(input) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    const tbody = document.getElementById("invoiceBody");
    tbody.innerHTML = "";
    data.items.forEach((item, i) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${i + 1}</td>
        <td><input type="text" value="${item.name}"></td>
        <td><input type="text" value="${item.material}"></td>
        <td><input type="number" class="price" value="${item.price}"></td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
      `;
    });
    document.getElementById("clientName").value = data.clientName || '';
    document.getElementById("invoiceNumber").value = data.invoiceNumber || '';
    document.getElementById("invoiceDate").value = data.date || '';
    calculateTotal();
  };
  reader.readAsText(input.files[0]);
}

// ----------------- PDF Preview & Download -----------------
function previewInvoice() {
  downloadPDF(true);
}

async function downloadPDF(preview = false) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Logo Placeholder (optional)
  doc.setFillColor(30, 61, 89);
  doc.rect(10, 10, 40, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("LOGO", 30, 20, null, null, "center");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text("Varshith Interior Solution", 105, 35, { align: "center" });

  // Client Details
  doc.setFontSize(12);
  doc.text(`Client Name: ${document.getElementById("clientName").value}`, 14, 50);
  doc.text(`Invoice No: ${document.getElementById("invoiceNumber").value}`, 14, 57);
  doc.text(`Date: ${document.getElementById("invoiceDate").value}`, 14, 64);

  // Table Header
  let startY = 70;
  doc.autoTable({
    startY: startY,
    head: [['Sl No', 'Item Name', 'Material', 'Price (₹)']],
    body: Array.from(document.querySelectorAll("#invoiceBody tr")).map((row, index) => [
      index + 1,
      row.cells[1].firstChild.value,
      row.cells[2].firstChild.value,
      row.cells[3].firstChild.value
    ]),
  });

  const totalsY = doc.lastAutoTable.finalY + 10;
  doc.text(`Total: ₹${document.getElementById("totalAmount").textContent}`, 14, totalsY);
  doc.text(`GST (18%): ₹${document.getElementById("gstAmount").textContent}`, 14, totalsY + 7);
  doc.text(`Final Total: ₹${document.getElementById("finalAmount").textContent}`, 14, totalsY + 14);

  // Footer
  doc.setFontSize(10);
  doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
  doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 287);

  if (preview) {
    window.open(doc.output('bloburl'));
  } else {
    doc.save(`Invoice_${document.getElementById("invoiceNumber").value}.pdf`);
  }
}

// ----------------- 2D → 3D Placeholder -----------------
function generate3D() {
  const fileInput = document.getElementById("imageUpload");
  if (!fileInput.files[0]) {
    alert("Please upload a 2D image first!");
    return;
  }

  const canvas = document.getElementById("threeCanvas");
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x1e3d59, wireframe: true });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
