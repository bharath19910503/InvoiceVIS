let invoiceData = [];

function loadInvoice(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    invoiceData = JSON.parse(e.target.result);
    renderInvoice();
  };
  reader.readAsText(file);
}

function renderInvoice() {
  const tbody = document.getElementById("invoiceBody");
  tbody.innerHTML = "";
  invoiceData.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index+1}</td>
      <td><input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)"/></td>
      <td><input type="text" value="${item.material}" onchange="updateItem(${index}, 'material', this.value)"/></td>
      <td><input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)"/></td>
    `;

    tbody.appendChild(row);
  });
  calculateTotal();
}

function addRow() {
  invoiceData.push({ name: "", material: "", price: 0 });
  renderInvoice();
}

function updateItem(index, field, value) {
  invoiceData[index][field] = field === 'price' ? parseFloat(value) : value;
  calculateTotal();
}

function calculateTotal() {
  let total = invoiceData.reduce((sum, item) => sum + Number(item.price || 0), 0);
  let gst = total * 0.18;
  let finalTotal = total + gst;

  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("gstAmount").textContent = gst.toFixed(2);
  document.getElementById("finalAmount").textContent = finalTotal.toFixed(2);
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("Arial", "normal");

  doc.text("Varshith Interior Solution", 10, 10);
  doc.text("Invoice", 10, 20);

  let y = 30;
  invoiceData.forEach((item, index) => {
    doc.text(`${index+1}. ${item.name} - ${item.material} - ${item.price}`, 10, y);
    y += 10;
  });

  doc.text(`Total: ${document.getElementById("totalAmount").textContent}`, 10, y+10);
  doc.text(`GST: ${document.getElementById("gstAmount").textContent}`, 10, y+20);
  doc.text(`Final Total: ${document.getElementById("finalAmount").textContent}`, 10, y+30);

  doc.save("invoice.pdf");
}

// 2D to 3D Design
document.getElementById("generate3D").addEventListener("click", () => {
  const fileInput = document.getElementById("imageUpload");
  if (fileInput.files.length === 0) return alert("Upload an image first");

  const imageURL = URL.createObjectURL(fileInput.files[0]);
  generate3DScene(imageURL);
});

function generate3DScene(imageURL) {
  const canvas = document.getElementById("threeCanvas");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas });

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const geometry = new THREE.BoxGeometry();
  const texture = new THREE.TextureLoader().load(imageURL);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
