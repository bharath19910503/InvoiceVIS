// Invoice Data
let items = [];

// Table Functions
const tableBody = document.querySelector("#itemsTable tbody");

function updateTotals() {
    let total = items.reduce((sum, item) => sum + item.total, 0);
    let gst = total * 0.18;
    let finalAmount = total + gst;

    document.getElementById("totalAmount").innerText = total.toFixed(2);
    document.getElementById("gstAmount").innerText = gst.toFixed(2);
    document.getElementById("finalAmount").innerText = finalAmount.toFixed(2);
}

function renderTable() {
    tableBody.innerHTML = "";
    items.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)"></td>
            <td><input type="number" value="${item.quantity}" min="1" onchange="updateItem(${index}, 'quantity', this.value)"></td>
            <td><input type="number" value="${item.price}" min="0" onchange="updateItem(${index}, 'price', this.value)"></td>
            <td>${item.total.toFixed(2)}</td>
        `;

        tableBody.appendChild(row);
    });
    updateTotals();
}

function updateItem(index, field, value) {
    if (field === 'quantity' || field === 'price') value = parseFloat(value);
    items[index][field] = value;
    items[index].total = items[index].quantity * items[index].price;
    renderTable();
}

document.getElementById("addItemBtn").addEventListener("click", () => {
    items.push({name: '', quantity: 1, price: 0, total: 0});
    renderTable();
});

// PDF Generation
document.getElementById("generatePDF").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const invoiceElement = document.querySelector(".container");
    await html2canvas(invoiceElement).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 10, 10, 190, 0);
        doc.save(`Invoice_${document.getElementById("invoiceNumber").value || "New"}.pdf`);
    });
});

// Upload Invoice
const fileInput = document.getElementById("invoiceFile");
document.getElementById("uploadInvoice").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function() {
        const data = JSON.parse(reader.result);
        document.getElementById("clientName").value = data.clientName || "";
        document.getElementById("invoiceNumber").value = data.invoiceNumber || "";
        document.getElementById("invoiceDate").value = data.invoiceDate || "";
        items = data.items || [];
        renderTable();
    }
    reader.readAsText(file);
});

// 2D → 3D Design
let scene, camera, renderer, cube;
function init3D() {
    const canvas = document.getElementById("designCanvas");
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xecf0f1);

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5,5,5).normalize();
    scene.add(light);

    cube = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshPhongMaterial({ color: 0x3498db })
    );
    scene.add(cube);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

document.getElementById("generate3D").addEventListener("click", () => {
    init3D();
});

// Initialize
renderTable();
