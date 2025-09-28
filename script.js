// ----------------- INVOICE LOGIC -----------------
let invoiceTable = document.querySelector("#invoiceTable tbody");
let totalCostSpan = document.getElementById("totalCost");
let gstSpan = document.getElementById("gst");
let finalCostSpan = document.getElementById("finalCost");

// Add new item row
document.getElementById("addItemBtn").addEventListener("click", () => {
    let row = invoiceTable.insertRow();
    row.innerHTML = `
        <td contenteditable="true">Item Name</td>
        <td contenteditable="true">Material Name</td>
        <td contenteditable="true">0</td>
        <td>0</td>
    `;
    row.cells[2].addEventListener("input", calculateTotals); // Rate
});

// Calculate totals (Material Used ignored)
function calculateTotals() {
    let total = 0;
    invoiceTable.querySelectorAll("tr").forEach(row => {
        let rate = parseFloat(row.cells[2].textContent) || 0;
        let amount = rate; // Only rate determines amount
        row.cells[3].textContent = amount.toFixed(2);
        total += amount;
    });

    totalCostSpan.textContent = total.toFixed(2);
    let gst = total * 0.18;
    gstSpan.textContent = gst.toFixed(2);
    finalCostSpan.textContent = (total + gst).toFixed(2);
}

// Generate invoice
document.getElementById("generateInvoiceBtn").addEventListener("click", () => {
    calculateTotals();
    alert("Invoice ready!");
});

// Download invoice PDF with header & footer on each page
document.getElementById("downloadInvoiceBtn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();

    let clientName = document.getElementById("clientName").value || "Client";
    let invoiceNumber = document.getElementById("invoiceNumber").value || Math.floor(10000 + Math.random() * 90000);
    let invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();

    function headerFooter(doc) {
        // Header
        doc.setFontSize(16);
        doc.text("Varshith Interior Solution", 105, 14, null, null, "center");
        // Footer
        let pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFontSize(10);
        doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, pageHeight - 40);
        doc.text("Phone: +91 9916511599 & +91 8553608981", 14, pageHeight - 32);
        doc.text("Email: Varshithinteriorsolutions@gmail.com", 14, pageHeight - 24);
        doc.text("Note: 50% advance, 30% after 50% work completion, 20% on project completion.", 14, pageHeight - 12);
    }

    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`, 14, 28);
    doc.text(`Client Name: ${clientName}`, 14, 36);
    doc.text(`Date: ${invoiceDate}`, 14, 44);

    doc.autoTable({
        startY: 50,
        html: "#invoiceTable",
        theme: "grid",
        didDrawPage: function (data) {
            headerFooter(doc);
        }
    });

    // Totals at end of table
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Cost: ${totalCostSpan.textContent}`, 14, finalY);
    doc.text(`GST: ${gstSpan.textContent}`, 14, finalY + 8);
    doc.text(`Final Cost: ${finalCostSpan.textContent}`, 14, finalY + 16);

    doc.save(`Invoice_${invoiceNumber}.pdf`);
});

// ----------------- 2D TO 3D DESIGN -----------------
let scene, camera, renderer;

document.getElementById("generate3DBtn").addEventListener("click", () => {
    let fileInput = document.getElementById("upload2D");
    if (!fileInput.files[0]) return alert("Upload a 2D Design first!");

    let reader = new FileReader();
    reader.onload = function(event) {
        let imgData = event.target.result;

        // Setup Three.js Scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 800/400, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(800, 400);
        document.getElementById("3dPreview").innerHTML = "";
        document.getElementById("3dPreview").appendChild(renderer.domElement);

        let light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(0, 20, 0);
        scene.add(light);

        // Apply uploaded 2D image as texture on a cube
        let textureLoader = new THREE.TextureLoader();
        let texture = textureLoader.load(imgData);
        let geometry = new THREE.BoxGeometry(2, 2, 2);
        let material = new THREE.MeshBasicMaterial({ map: texture });
        let cube = new THREE.Mesh(geometry, material);
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
    reader.readAsDataURL(fileInput.files[0]);
});
