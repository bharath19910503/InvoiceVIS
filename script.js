// Invoice Logic
let items = [];

const itemsTableBody = document.querySelector("#itemsTable tbody");
const totalCostSpan = document.getElementById("totalCost");
const gstAmountSpan = document.getElementById("gstAmount");
const finalCostSpan = document.getElementById("finalCost");

document.getElementById("addItemBtn").addEventListener("click", addItem);
document.getElementById("generateInvoiceBtn").addEventListener("click", generateInvoice);
document.getElementById("downloadPdfBtn").addEventListener("click", downloadPDF);
document.getElementById("uploadInvoice").addEventListener("change", uploadInvoice);

function addItem() {
    const row = { item: "", qty: 1, rate: 0, cost: 0 };
    items.push(row);
    renderTable();
}

function renderTable() {
    itemsTableBody.innerHTML = "";
    items.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" value="${row.item}" onchange="updateItem(${index}, 'item', this.value)"></td>
            <td><input type="number" value="${row.qty}" min="1" onchange="updateItem(${index}, 'qty', this.value)"></td>
            <td><input type="number" value="${row.rate}" min="0" onchange="updateItem(${index}, 'rate', this.value)"></td>
            <td>${row.cost.toFixed(2)}</td>
        `;
        itemsTableBody.appendChild(tr);
    });
    calculateTotals();
}

function updateItem(index, key, value) {
    items[index][key] = key === "item" ? value : parseFloat(value);
    items[index].cost = items[index].qty * items[index].rate;
    renderTable();
}

function calculateTotals() {
    const total = items.reduce((sum, row) => sum + row.cost, 0);
    const gst = total * 0.18;
    const finalCost = total + gst;
    totalCostSpan.textContent = total.toFixed(2);
    gstAmountSpan.textContent = gst.toFixed(2);
    finalCostSpan.textContent = finalCost.toFixed(2);
}

function generateInvoice() {
    alert("Invoice generated! Preview below before download.");
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("Varshith Interior Solution", 105, 20, null, null, "center");

    // Invoice Details
    const clientName = document.getElementById("clientName").value || "N/A";
    const invoiceNumber = document.getElementById("invoiceNumber").value || Math.floor(10000 + Math.random() * 90000);
    const invoiceDate = document.getElementById("invoiceDate").value || new Date().toISOString().split('T')[0];
    doc.setFontSize(12);
    doc.text(`Invoice Details:`, 14, 40);
    doc.text(`Client: ${clientName}`, 14, 50);
    doc.text(`Invoice #: ${invoiceNumber}`, 14, 60);
    doc.text(`Date: ${invoiceDate}`, 14, 70);

    // Table
    let startY = 80;
    doc.autoTable({
        startY,
        head: [['Item', 'Quantity', 'Rate', 'Cost']],
        body: items.map(i => [i.item, i.qty, i.rate.toFixed(2), i.cost.toFixed(2)])
    });

    // Totals
    startY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Cost: ${totalCostSpan.textContent}`, 14, startY);
    doc.text(`GST (18%): ${gstAmountSpan.textContent}`, 14, startY + 10);
    doc.text(`Final Cost: ${finalCostSpan.textContent}`, 14, startY + 20);

    // Footer
    doc.setFontSize(10);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 290);

    doc.save(`Invoice_${invoiceNumber}.pdf`);
}

// Upload and Edit Invoice
function uploadInvoice(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        document.getElementById("clientName").value = data.clientName;
        document.getElementById("invoiceNumber").value = data.invoiceNumber;
        document.getElementById("invoiceDate").value = data.invoiceDate;
        items = data.items;
        renderTable();
    };
    reader.readAsText(file);
}

// 2D to 3D Conversion using Three.js
let scene, camera, renderer, cube;

document.getElementById("generate3D").addEventListener("click", () => {
    const fileInput = document.getElementById("upload2D");
    if (!fileInput.files[0]) return alert("Upload a 2D image first.");

    const url = URL.createObjectURL(fileInput.files[0]);
    init3D(url);
});

function init3D(textureUrl) {
    if (renderer) {
        document.getElementById("threeContainer").innerHTML = "";
    }
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 400);
    document.getElementById("threeContainer").appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const texture = new THREE.TextureLoader().load(textureUrl);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;
    animate3D();
}

function animate3D() {
    requestAnimationFrame(animate3D);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
