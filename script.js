// Invoice Logic
let invoiceItems = [];

const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const addItemBtn = document.getElementById("addItemBtn");
const generateInvoiceBtn = document.getElementById("generateInvoiceBtn");
const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");
const uploadInvoice = document.getElementById("uploadInvoice");

const totalCostSpan = document.getElementById("totalCost");
const gstAmountSpan = document.getElementById("gstAmount");
const finalCostSpan = document.getElementById("finalCost");

function updateTable() {
    invoiceTableBody.innerHTML = "";
    let totalCost = 0;
    invoiceItems.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)"></td>
            <td><input type="number" value="${item.quantity}" onchange="updateItem(${index}, 'quantity', this.value)"></td>
            <td><input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)"></td>
            <td>${(item.quantity * item.price).toFixed(2)}</td>
        `;
        invoiceTableBody.appendChild(row);
        totalCost += item.quantity * item.price;
    });
    const gst = totalCost * 0.18;
    const finalCost = totalCost + gst;
    totalCostSpan.textContent = totalCost.toFixed(2);
    gstAmountSpan.textContent = gst.toFixed(2);
    finalCostSpan.textContent = finalCost.toFixed(2);
}

function updateItem(index, key, value) {
    invoiceItems[index][key] = key === 'name' ? value : Number(value);
    updateTable();
}

addItemBtn.addEventListener("click", () => {
    invoiceItems.push({name:"", quantity:1, price:0});
    updateTable();
});

// Generate PDF
generateInvoiceBtn.addEventListener("click", () => {
    alert("Invoice generated in preview table.");
});

downloadInvoiceBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const clientName = document.getElementById("clientName").value || "Random_" + Math.floor(Math.random()*90000+10000);
    const invoiceNumber = document.getElementById("invoiceNumber").value || Math.floor(Math.random()*90000+10000);
    const invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Varshith Interior Solution", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Invoice No: ${invoiceNumber}`, 14, 40);
    doc.text(`Client: ${clientName}`, 14, 50);
    doc.text(`Date: ${invoiceDate}`, 14, 60);

    let startY = 70;
    doc.autoTable({
        startY: startY,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: invoiceItems.map(i => [i.name, i.quantity, i.price, (i.quantity*i.price).toFixed(2)])
    });

    const totalY = doc.lastAutoTable.finalY + 10;
    const totalCost = Number(totalCostSpan.textContent);
    const gst = Number(gstAmountSpan.textContent);
    const finalCost = Number(finalCostSpan.textContent);

    doc.text(`Total Cost: ${totalCost.toFixed(2)}`, 14, totalY);
    doc.text(`GST: ${gst.toFixed(2)}`, 14, totalY+10);
    doc.text(`Final Cost: ${finalCost.toFixed(2)}`, 14, totalY+20);

    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 288);

    doc.save(`${clientName}_invoice.pdf`);
});

// Upload and edit invoice
uploadInvoice.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = JSON.parse(event.target.result);
        document.getElementById("clientName").value = data.clientName;
        document.getElementById("invoiceNumber").value = data.invoiceNumber;
        document.getElementById("invoiceDate").value = data.invoiceDate;
        invoiceItems = data.items;
        updateTable();
    };
    reader.readAsText(file);
});

// 2D to 3D Designer
const upload2D = document.getElementById("upload2D");
const generate3DBtn = document.getElementById("generate3DBtn");
const threeDPreview = document.getElementById("threeDPreview");

generate3DBtn.addEventListener("click", () => {
    const file = upload2D.files[0];
    if(!file) { alert("Please upload 2D file"); return; }

    const reader = new FileReader();
    reader.onload = function(e){
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, threeDPreview.clientWidth/threeDPreview.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(threeDPreview.clientWidth, threeDPreview.clientHeight);
        threeDPreview.innerHTML = "";
        threeDPreview.appendChild(renderer.domElement);

        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshStandardMaterial({color:0x00ff00});
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5,5,5).normalize();
        scene.add(light);

        camera.position.z = 5;

        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();
    };
    reader.readAsText(file);
});
