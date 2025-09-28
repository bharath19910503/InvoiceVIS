/* ---------------- 3D Preview Setup ---------------- */
let scene, camera, renderer, controls, cube;

function initThreeJS() {
  const canvas = document.getElementById('threejs-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  camera.position.z = 5;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5,5,5);
  scene.add(light);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThreeJS();

/* ---------------- 3D Generation with Progress ---------------- */
function start3DGeneration(event) {
  const file = event.target.files[0];
  if (!file) return;

  const progressContainer = document.getElementById('progressBarContainer');
  const progressBar = document.getElementById('progressBar');
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';

  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    progressBar.style.width = progress + '%';
    if(progress >= 100) {
      clearInterval(interval);
      progressContainer.style.display = 'none';
      loadImage(file);
    }
  }, 50);
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const texture = new THREE.TextureLoader().load(e.target.result);
    if(cube) scene.remove(cube);
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
  }
  reader.readAsDataURL(file);
}

/* ---------------- Invoice Functions ---------------- */
function addRow() {
  const tbody = document.querySelector('#invoiceTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `<td><input type="text" value="Item"></td>
                   <td><input type="number" value="1"></td>
                   <td><input type="number" value="0"></td>`;
  tbody.appendChild(row);
}

function calculateTotal() {
  const rows = document.querySelectorAll('#invoiceTable tbody tr');
  let total = 0;
  rows.forEach(row => {
    const amount = parseFloat(row.cells[2].children[0].value) || 0;
    total += amount;
  });
  const gst = parseFloat(document.getElementById('gst').value) || 0;
  const gstAmount = total * gst / 100;
  const finalCost = total + gstAmount;

  document.getElementById('total').textContent = total.toFixed(2);
  document.getElementById('finalCost').textContent = finalCost.toFixed(2);
  return { total, gstAmount, finalCost };
}

setInterval(calculateTotal, 500);

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text("Varshith Interior Solutions", 105, 10, {align: 'center'});

  // Table
  const rows = [];
  document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
    const item = row.cells[0].children[0].value;
    const qty = row.cells[1].children[0].value;
    const amount = row.cells[2].children[0].value;
    rows.push([item, qty, amount]);
  });

  doc.autoTable({
    head: [['Item', 'Qty', 'Amount']],
    body: rows,
    startY: 20
  });

  const { total, gstAmount, finalCost } = calculateTotal();
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Total Cost: ${total.toFixed(2)}`, 14, finalY);
  doc.text(`GST: ${gstAmount.toFixed(2)}`, 14, finalY + 8);
  doc.text(`Final Cost: ${finalCost.toFixed(2)}`, 14, finalY + 16);

  // Note
  doc.text("Note: 50% advance, 30% after 50% work completion, 20% on project completion.", 14, finalY + 26);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, pageHeight - 20);
  doc.text("Phone: +91 9916511599 & +91 8553608981", 14, pageHeight - 15);
  doc.text("Email: Varshithinteriorsolutions@gmail.com", 14, pageHeight - 10);

  doc.save("invoice.pdf");
}

/* ---------------- Load Old Invoice ---------------- */
function loadInvoice(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    const tbody = document.querySelector('#invoiceTable tbody');
    tbody.innerHTML = '';
    data.items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td><input type="text" value="${item.name}"></td>
                       <td><input type="number" value="${item.qty}"></td>
                       <td><input type="number" value="${item.amount}"></td>`;
      tbody.appendChild(row);
    });
    document.getElementById('gst').value = data.gst;
  }
  reader.readAsText(file);
}
