// ===== Invoice Calculation & PDF =====
function calculateTotals() {
    let total = 0;
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        const amount = parseFloat(row.querySelector('.amount').value) || 0;
        total += amount;
    });
    document.getElementById('totalCost').innerText = total.toFixed(2);

    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
    const gstAmount = (total * gstPercent / 100);
    document.getElementById('gstAmount').innerText = gstAmount.toFixed(2);

    const finalCost = total + gstAmount;
    document.getElementById('finalCost').innerText = finalCost.toFixed(2);
}

// Event listeners
document.querySelectorAll('.amount, .qty').forEach(el => {
    el.addEventListener('input', calculateTotals);
});
document.getElementById('gstPercent').addEventListener('input', calculateTotals);

// PDF Download
document.getElementById('downloadPdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Varshith Interior Solutions", 14, 20);
    let y = 30;

    // Table headers
    doc.setFontSize(12);
    const headers = ["Item", "Material Used", "Qty", "Amount"];
    headers.forEach((h, i) => doc.text(h, 14 + i*40, y));
    y += 10;

    // Table rows
    document.querySelectorAll('#invoiceTable tbody tr').forEach(row => {
        row.querySelectorAll('input').forEach((cell, i) => {
            doc.text(cell.value.toString(), 14 + i*40, y);
        });
        y += 10;
    });

    // Totals
    y += 10;
    doc.text(`Total Cost: ${document.getElementById('totalCost').innerText}`, 14, y);
    y += 7;
    doc.text(`GST: ${document.getElementById('gstAmount').innerText}`, 14, y);
    y += 7;
    doc.text(`Final Cost: ${document.getElementById('finalCost').innerText}`, 14, y);
    y += 10;
    doc.text("Note: 50% advance, 30% after 50% work completion, 20% on project completion.", 14, y);
    y += 10;

    // Footer
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, y);
    y += 7;
    doc.text("Phone: +91 9916511599 & +91 8553608981", 14, y);
    y += 7;
    doc.text("Email: Varshithinteriorsolutions@gmail.com", 14, y);

    doc.save("Invoice.pdf");
});

// Upload and Edit Invoice
document.getElementById('uploadInvoice').addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = JSON.parse(evt.target.result);
        const tbody = document.querySelector('#invoiceTable tbody');
        tbody.innerHTML = "";
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${item.name}"></td>
                <td><input type="text" value="${item.material}"></td>
                <td><input type="number" value="${item.qty}" min="1" class="qty"></td>
                <td><input type="number" value="${item.amount}" min="0" class="amount"></td>
            `;
            tbody.appendChild(tr);
        });
        calculateTotals();

        // Reattach listeners
        document.querySelectorAll('.amount, .qty').forEach(el => {
            el.addEventListener('input', calculateTotals);
        });
    };
    reader.readAsText(file);
});

// ===== 3D Preview Section =====
let scene, camera, renderer, cube;

function init3D() {
    const container = document.getElementById('3dPreview');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xdddddd });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

init3D();

document.getElementById('uploadImage').addEventListener('change', e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const textureLoader = new THREE.TextureLoader();
        document.getElementById('progress').innerText = "Loading 3D preview...";
        textureLoader.load(evt.target.result, texture => {
            cube.material.map = texture;
            cube.material.needsUpdate = true;
            document.getElementById('progress').innerText = "3D Preview Loaded!";
        });
    };
    reader.readAsDataURL(file);
});
