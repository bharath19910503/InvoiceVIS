// ---------------- Invoice Logic ----------------
let invoiceTable = document.querySelector("#invoiceTable tbody");
let totalCostSpan = document.getElementById("totalCost");
let gstSpan = document.getElementById("gst");
let finalCostSpan = document.getElementById("finalCost");

// Add new invoice row
document.getElementById("addItemBtn").addEventListener("click", () => {
    let row = invoiceTable.insertRow();
    row.innerHTML = `
        <td contenteditable="true">Item Name</td>
        <td contenteditable="true">1</td>
        <td contenteditable="true">0</td>
        <td>0.00</td>
    `;
    row.querySelectorAll("td")[1].addEventListener("input", calculateTotals);
    row.querySelectorAll("td")[2].addEventListener("input", calculateTotals);
    calculateTotals();
});

// Calculate totals
function calculateTotals() {
    let total = 0;
    invoiceTable.querySelectorAll("tr").forEach(row => {
        let qty = parseFloat(row.cells[1].textContent) || 0;
        let rate = parseFloat(row.cells[2].textContent) || 0;
        let cost = qty * rate;
        row.cells[3].textContent = cost.toFixed(2);
        total += cost;
    });
    totalCostSpan.textContent = total.toFixed(2);
    let gst = total * 0.18;
    gstSpan.textContent = gst.toFixed(2);
    finalCostSpan.textContent = (total + gst).toFixed(2);
}

// Generate invoice button
document.getElementById("generateInvoiceBtn").addEventListener("click", () => {
    calculateTotals();
    alert("Invoice generated!");
});

// Download PDF
document.getElementById("downloadInvoiceBtn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    let clientName = document.getElementById("clientName").value || "Client";
    let invoiceNumber = document.getElementById("invoiceNumber").value || Math.floor(10000 + Math.random() * 90000);
    let invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text("Varshith Interior Solution", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`, 14, 30);
    doc.text(`Client Name: ${clientName}`, 14, 38);
    doc.text(`Date: ${invoiceDate}`, 14, 46);

    let startY = 55;
    doc.autoTable({ 
        startY: startY,
        html: "#invoiceTable",
        theme: 'grid'
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Cost: ${totalCostSpan.textContent}`, 14, finalY);
    doc.text(`GST: ${gstSpan.textContent}`, 14, finalY + 8);
    doc.text(`Final Cost: ${finalCostSpan.textContent}`, 14, finalY + 16);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, finalY + 30);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 14, finalY + 38);

    doc.save(`Invoice_${invoiceNumber}.pdf`);
});

// Upload & regenerate invoice from JSON
document.getElementById("uploadInvoiceJSON").addEventListener("change", function() {
    let file = this.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = e => {
        try {
            let data = JSON.parse(e.target.result);
            document.getElementById("clientName").value = data.clientName || "";
            document.getElementById("invoiceNumber").value = data.invoiceNumber || "";
            document.getElementById("invoiceDate").value = data.invoiceDate || "";
            invoiceTable.innerHTML = "";
            data.items.forEach(item => {
                let row = invoiceTable.insertRow();
                row.innerHTML = `
                    <td contenteditable="true">${item.name}</td>
                    <td contenteditable="true">${item.qty}</td>
                    <td contenteditable="true">${item.rate}</td>
                    <td>0.00</td>
                `;
                row.querySelectorAll("td")[1].addEventListener("input", calculateTotals);
                row.querySelectorAll("td")[2].addEventListener("input", calculateTotals);
            });
            calculateTotals();
        } catch(err) {
            alert("Invalid JSON file!");
        }
    };
    reader.readAsText(file);
});

// ---------------- 2D to 3D Design ----------------
let scene, camera, renderer, controls;

document.getElementById("generate3DBtn").addEventListener("click", () => {
    let fileInput = document.getElementById("upload2D");
    if (!fileInput.files[0]) return alert("Upload a 2D Design first!");

    let reader = new FileReader();
    reader.onload = function(e) {
        let imgSrc = e.target.result;

        // Clear previous 3D preview
        document.getElementById("3dPreview").innerHTML = "";

        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/2 / 400, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(window.innerWidth/2, 400);
        document.getElementById("3dPreview").appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // Light
        let light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(0, 20, 0);
        scene.add(light);

        // Plane with uploaded 2D texture
        let geometry = new THREE.PlaneGeometry(10, 10);
        let texture = new THREE.TextureLoader().load(imgSrc);
        let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        let plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        camera.position.z = 15;

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
            controls.update();
        }
        animate();
    };
    reader.readAsDataURL(fileInput.files[0]);
});
