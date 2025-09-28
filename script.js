let items = [];

document.getElementById('addItemBtn').addEventListener('click', () => {
    const tableBody = document.querySelector('#invoiceTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="Item Name"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="18"></td>
        <td>0</td>
    `;
    tableBody.appendChild(row);
    row.querySelectorAll('input').forEach(input => input.addEventListener('input', updateTotals));
});

function updateTotals() {
    const tableBody = document.querySelector('#invoiceTable tbody');
    let total = 0;
    tableBody.querySelectorAll('tr').forEach(row => {
        const qty = parseFloat(row.children[1].querySelector('input').value) || 0;
        const rate = parseFloat(row.children[2].querySelector('input').value) || 0;
        const gst = parseFloat(row.children[3].querySelector('input').value) || 0;
        const amount = qty * rate + (qty * rate * gst / 100);
        row.children[4].textContent = amount.toFixed(2);
        total += amount;
    });
    document.getElementById('finalCost').textContent = 'Total: ' + total.toFixed(2);
}

document.getElementById('generatePdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add logo
    const img = document.getElementById('company-logo');
    doc.addImage(img, 'PNG', 150, 10, 40, 20);

    // Add header
    doc.setFontSize(16);
    doc.text("Varshith Interior Solutions", 10, 20);

    // Add table
    let startY = 40;
    doc.autoTable({ html: '#invoiceTable', startY: startY });

    // Add final cost
    startY += (items.length + 1) * 10;
    doc.setFontSize(12);
    doc.text(document.getElementById('finalCost').textContent, 10, startY);

    // Add payment note
    doc.text(document.getElementById('paymentNote').textContent, 10, startY + 10);

    doc.save('Invoice.pdf');
});

// Simple 3D preview
function init3D() {
    const container = document.getElementById('designPreview');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
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
init3D();
