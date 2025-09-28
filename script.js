// ===== Invoice Logic =====
function addRow() {
    const tbody = document.querySelector("#invoice-table tbody");
    const row = document.createElement("tr");
    row.innerHTML = `<td contenteditable="true">New Item</td>
                     <td contenteditable="true">Material</td>
                     <td contenteditable="true">1</td>
                     <td contenteditable="true">0.00</td>`;
    tbody.appendChild(row);
    attachInputListeners();
}

function attachInputListeners() {
    const amountCells = document.querySelectorAll("#invoice-table tbody td:nth-child(4)");
    amountCells.forEach(cell => {
        cell.addEventListener("input", calculateTotals);
    });
    const qtyCells = document.querySelectorAll("#invoice-table tbody td:nth-child(3)");
    qtyCells.forEach(cell => {
        cell.addEventListener("input", calculateTotals);
    });
}

function calculateTotals() {
    let total = 0;
    const rows = document.querySelectorAll("#invoice-table tbody tr");
    rows.forEach(row => {
        const qty = parseFloat(row.cells[2].innerText) || 0;
        const amount = parseFloat(row.cells[3].innerText) || 0;
        total += qty * amount;
    });
    document.getElementById("totalCost").innerText = total.toFixed(2);

    const gstPercent = parseFloat(document.getElementById("gstPercent").value) || 0;
    const gstAmount = (total * gstPercent) / 100;
    document.getElementById("gstAmount").innerText = gstAmount.toFixed(2);

    const finalCost = total + gstAmount;
    document.getElementById("finalCost").innerText = finalCost.toFixed(2);
}

attachInputListeners();

// ===== PDF Download =====
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({orientation: 'p', unit: 'pt', format: 'a4'});
    
    const header = "Varshith Interior Solutions";
    const footer = "Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106\nPhone: +91 9916511599 & +91 8553608981\nEmail: Varshithinteriorsolutions@gmail.com";

    const table = document.getElementById("invoice-table");
    const rows = Array.from(table.querySelectorAll("tr")).map(r => Array.from(r.cells).map(c => c.innerText));

    doc.setFontSize(14);
    doc.text(header, 40, 40);

    let y = 70;
    rows.forEach((row, index) => {
        doc.text(row.join(" | "), 40, y);
        y += 20;
        if(y > 750) {
            doc.addPage();
            y = 40;
            doc.text(header, 40, 40);
        }
    });

    y += 20;
    doc.text(`Total Cost: ${document.getElementById("totalCost").innerText}`, 40, y);
    y += 20;
    doc.text(`GST: ${document.getElementById("gstAmount").innerText}`, 40, y);
    y += 20;
    doc.text(`Final Cost: ${document.getElementById("finalCost").innerText}`, 40, y);
    y += 20;
    doc.text("Note: 50% advance, 30% after 50% work completion, 20% on project completion.", 40, y);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i=1; i<=pageCount; i++){
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(footer, 40, 800);
    }

    doc.save("invoice.pdf");
}

// ===== 2D to 3D =====
let scene, camera, renderer, cube;

function generate3D() {
    const fileInput = document.getElementById("upload2D");
    if(!fileInput.files[0]) {
        alert("Please upload a 2D design image first.");
        return;
    }

    document.getElementById("progress").innerText = "Generating 3D preview...";

    setTimeout(() => {
        // Initialize Three.js Scene
        const container = document.getElementById("preview3D");
        container.innerHTML = ""; // Clear previous

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Add a simple cube as placeholder 3D
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({color: 0x3498db});
        cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 5;

        const animate = function () {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };

        animate();
        document.getElementById("progress").innerText = "3D preview generated!";
    }, 2000); // simulate processing time
}

function download3DPDF() {
    if(!renderer) {
        alert("Please generate 3D preview first.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const imgData = renderer.domElement.toDataURL("image/png");
    doc.addImage(imgData, 'PNG', 15, 40, 180, 160);
    doc.save("3D_design.pdf");
}
