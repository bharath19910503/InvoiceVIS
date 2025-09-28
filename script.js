// Auto-calculate totals
function calculateTotals() {
  const rows = document.querySelectorAll('#invoiceTable tbody tr');
  let total = 0;
  rows.forEach(row => {
    const amount = parseFloat(row.cells[3].querySelector('input').value) || 0;
    total += amount;
  });
  const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
  const gst = total * gstPercent / 100;
  const finalCost = total + gst;

  document.getElementById('totalCost').innerText = total.toFixed(2);
  document.getElementById('gstAmount').innerText = gst.toFixed(2);
  document.getElementById('finalCost').innerText = finalCost.toFixed(2);
}

// Add new row
function addRow() {
  const tbody = document.querySelector('#invoiceTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" placeholder="Item Name"></td>
    <td><input type="text" placeholder="Material"></td>
    <td><input type="number" value="1" onchange="calculateTotals()"></td>
    <td><input type="number" value="0" onchange="calculateTotals()"></td>
  `;
  tbody.appendChild(tr);
}

// Download multi-page PDF
async function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const header = () => {
    pdf.setFontSize(14);
    pdf.text("Varshith Interior Solutions", 10, 10);
    pdf.setFontSize(10);
    pdf.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 10, 16);
    pdf.text("Phone: +91 9916511599 & +91 8553608981", 10, 22);
    pdf.text("Email: Varshithinteriorsolutions@gmail.com", 10, 28);
    pdf.setLineWidth(0.5);
    pdf.line(10,32,pageWidth-10,32);
  };

  const footer = (pageNum) => {
    pdf.setLineWidth(0.5);
    pdf.line(10,pageHeight-15,pageWidth-10,pageHeight-15);
    pdf.setFontSize(10);
    pdf.text(`Page ${pageNum}`, pageWidth-20, pageHeight-10);
  };

  const table = document.getElementById('invoiceTable');
  const rows = table.querySelectorAll('tbody tr');
  const rowHeight = 10;
  let y = 40;
  let pageNum = 1;
  header();

  pdf.setFontSize(12);
  pdf.setFillColor(41,128,185);
  pdf.setTextColor(255,255,255);
  pdf.rect(10, y-6, pageWidth-20, 8, 'F');
  pdf.text("Item", 12, y);
  pdf.text("Material Used", 60, y);
  pdf.text("Qty", 120, y);
  pdf.text("Amount", 150, y);
  pdf.setTextColor(0,0,0);

  rows.forEach((row) => {
    if(y+rowHeight > pageHeight-20){
      footer(pageNum);
      pdf.addPage();
      pageNum++;
      y = 40;
      header();
      pdf.setFillColor(41,128,185);
      pdf.setTextColor(255,255,255);
      pdf.rect(10, y-6, pageWidth-20, 8, 'F');
      pdf.text("Item", 12, y);
      pdf.text("Material Used", 60, y);
      pdf.text("Qty", 120, y);
      pdf.text("Amount", 150, y);
      pdf.setTextColor(0,0,0);
    }
    const cells = row.querySelectorAll('input');
    pdf.text(cells[0].value || '', 12, y+rowHeight);
    pdf.text(cells[1].value || '', 60, y+rowHeight);
    pdf.text(cells[2].value || '', 120, y+rowHeight);
    pdf.text(parseFloat(cells[3].value || 0).toFixed(2), 150, y+rowHeight);
    y += rowHeight + 2;
  });

  if(y + 30 > pageHeight-20){ footer(pageNum); pdf.addPage(); pageNum++; y=40; header(); }
  y += 10;
  pdf.text(`Total Cost: ${document.getElementById('totalCost').innerText}`, 10, y);
  y += 8;
  pdf.text(`GST: ${document.getElementById('gstAmount').innerText}`, 10, y);
  pdf.text(`Final Cost: ${document.getElementById('finalCost').innerText}`, 100, y);
  footer(pageNum);
  pdf.save('Invoice.pdf');
}

// 3D Preview Logic
let scene, camera, renderer, cube;
function init3D() {
  const container = document.getElementById('3dContainer');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5,5,5);
  scene.add(light);
  camera.position.z = 5;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if(cube) cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

function generate3D(){
  const fileInput = document.getElementById('designUpload');
  if(!fileInput.files.length){
    alert("Please upload 2D Design");
    return;
  }
  const progressBar = document.getElementById('progress');
  progressBar.style.width = '0%';
  progressBar.innerText = '0%';
  init3D();

  let progress=0;
  const interval = setInterval(()=>{
    progress += 10;
    if(progress>100) progress=100;
    progressBar.style.width = progress + '%';
    progressBar.innerText = progress + '%';
    if(progress>=100){
      clearInterval(interval);
      // Simulate generated 3D model
      const geometry = new THREE.BoxGeometry(2,2,2);
      const material = new THREE.MeshStandardMaterial({color: Math.random()*0xffffff});
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
    }
  }, 200);
}
