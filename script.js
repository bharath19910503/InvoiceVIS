// Invoice data
let items = [];

// Add item
document.getElementById('addItemBtn').addEventListener('click', () => {
    const newItem = { name: '', qty: 1, rate: 0, amount: 0 };
    items.push(newItem);
    renderItems();
});

// Render items table
function renderItems() {
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)"></td>
            <td><input type="number" value="${item.qty}" min="1" onchange="updateItem(${index}, 'qty', this.value)"></td>
            <td><input type="number" value="${item.rate}" min="0" onchange="updateItem(${index}, 'rate', this.value)"></td>
            <td>${item.qty * item.rate}</td>
        `;
        tbody.appendChild(tr);
    });
    calculateTotals();
}

// Update item
function updateItem(index, field, value) {
    if(field === 'qty' || field === 'rate') value = parseFloat(value);
    items[index][field] = value;
    items[index].amount = items[index].qty * items[index].rate;
    renderItems();
}

// Calculate totals
function calculateTotals() {
    let total = items.reduce((sum, item) => sum + item.amount, 0);
    let gst = total * 0.18;
    let finalAmount = total + gst;
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    document.getElementById('gstAmount').textContent = gst.toFixed(2);
    document.getElementById('finalAmount').textContent = finalAmount.toFixed(2);
}

// Generate PDF
document.getElementById('generatePDF').addEventListener('click', () => {
    generatePDF();
});
document.getElementById('previewPDF').addEventListener('click', () => {
    generatePDF(true);
});

async function generatePDF(preview=false) {
    const { jsPDF } = window.jspdf;
    const invoiceDiv = document.createElement('div');
    invoiceDiv.style.width = '800px';
    invoiceDiv.style.padding = '20px';
    invoiceDiv.style.background = '#fff';
    invoiceDiv.innerHTML = `
        <h1 style="text-align:center;color:#004080;">Varshith Interior Solution</h1>
        <h2>Invoice Details</h2>
        <p>Client Name: ${document.getElementById('clientName').value}</p>
        <p>Invoice Number: ${document.getElementById('invoiceNumber').value}</p>
        <p>Date: ${document.getElementById('invoiceDate').value}</p>
        <table border="1" style="width:100%;border-collapse:collapse;margin-top:10px;">
            <thead>
                <tr style="background:#004080;color:#fff;">
                    <th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(i => `<tr>
                    <td>${i.name}</td><td>${i.qty}</td><td>${i.rate}</td><td>${i.amount.toFixed(2)}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <p>Total Amount: ${document.getElementById('totalAmount').textContent}</p>
        <p>GST: ${document.getElementById('gstAmount').textContent}</p>
        <p>Final Amount: ${document.getElementById('finalAmount').textContent}</p>
        <footer style="margin-top:20px;">
            <p>Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106</p>
            <p>Phone: +91 9916511599 & +91 8553608981</p>
        </footer>
    `;
    document.body.appendChild(invoiceDiv);
    const canvas = await html2canvas(invoiceDiv);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    pdf.addImage(imgData, 'PNG', 20, 20, 555, canvas.height * 555 / canvas.width);
    document.body.removeChild(invoiceDiv);
    if(preview) {
        window.open(pdf.output('bloburl'));
    } else {
        pdf.save(`Invoice_${document.getElementById('invoiceNumber').value}.pdf`);
    }
}

// Upload invoice
document.getElementById('uploadInvoice').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        const data = JSON.parse(reader.result);
        document.getElementById('clientName').value = data.clientName || '';
        document.getElementById('invoiceNumber').value = data.invoiceNumber || '';
        document.getElementById('invoiceDate').value = data.date || '';
        items = data.items || [];
        renderItems();
    };
    reader.readAsText(file);
});

// 2D → 3D Design
document.getElementById('generate3D').addEventListener('click', () => {
    const container = document.getElementById('design3D');
    container.innerHTML = '';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 400/300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 300);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({color: 0x004080});
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
});
