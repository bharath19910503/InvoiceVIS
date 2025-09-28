let invoiceData = [];
const invoiceTable = document.getElementById("invoiceTable").getElementsByTagName("tbody")[0];

function updateTotals() {
    let total = 0;
    invoiceData.forEach(item => {
        total += item.quantity * item.price;
    });
    let gst = total * 0.18; // 18% GST
    let finalCost = total + gst;

    document.getElementById("totalCost").innerText = total.toFixed(2);
    document.getElementById("gst").innerText = gst.toFixed(2);
    document.getElementById("finalCost").innerText = finalCost.toFixed(2);
}

function renderTable() {
    invoiceTable.innerHTML = "";
    invoiceData.forEach((item, index) => {
        const row = invoiceTable.insertRow();
        row.insertCell(0).innerHTML = `<input value="${item.description}" onchange="editItem(${index}, 'description', this.value)">`;
        row.insertCell(1).innerHTML = `<input type="number" value="${item.quantity}" onchange="editItem(${index}, 'quantity', this.value)">`;
        row.insertCell(2).innerHTML = `<input type="number" value="${item.price}" onchange="editItem(${index}, 'price', this.value)">`;
    });
    updateTotals();
}

function editItem(index, field, value) {
    if (field === "quantity" || field === "price") value = parseFloat(value);
    invoiceData[index][field] = value;
    updateTotals();
}

document.getElementById("addItemBtn").addEventListener("click", () => {
    invoiceData.push({ description: "", quantity: 1, price: 0 });
    renderTable();
});

document.getElementById("uploadInvoiceBtn").addEventListener("click", () => {
    document.getElementById("uploadInvoiceInput").click();
});

document.getElementById("uploadInvoiceInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadedData = JSON.parse(e.target.result);
        invoiceData = uploadedData.items || [];
        document.getElementById("clientName").value = uploadedData.clientName || "";
        document.getElementById("invoiceNumber").value = uploadedData.invoiceNumber || "";
        document.getElementById("invoiceDate").value = uploadedData.invoiceDate || "";
        renderTable();
    };
    reader.readAsText(file);
});

document.getElementById("downloadPdfBtn").addEventListener("click", () => {
    generatePDF();
});

document.getElementById("previewPdfBtn").addEventListener("click", () => {
    generatePDF(true);
});

// 2D to 3D Design Stub
document.getElementById("generate3DBtn").addEventListener("click", () => {
    alert("3D Design generation feature coming soon!");
});

// PDF generation using jsPDF
function generatePDF(preview = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("Arial", "bold");
    doc.setFontSize(16);
    doc.text("Varshith Interior Solution", 105, 15, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("Arial", "normal");
    doc.text(`Invoice Details`, 10, 30);
    doc.text(`Client: ${document.getElementById("clientName").value || "-"}`, 10, 37);
    doc.text(`Invoice No: ${document.getElementById("invoiceNumber").value || Math.floor(Math.random()*90000+10000)}`, 10, 44);
    doc.text(`Date: ${document.getElementById("invoiceDate").value || new Date().toLocaleDateString()}`, 10, 51);

    let startY = 60;
    invoiceData.forEach(item => {
        doc.text(`${item.description}`, 10, startY);
        doc.text(`${item.quantity}`, 80, startY);
        doc.text(`${item.price}`, 120, startY);
        startY += 7;
    });

    doc.text(`Total Cost: ${document.getElementById("totalCost").innerText}`, 10, startY + 10);
    doc.text(`GST: ${document.getElementById("gst").innerText}`, 10, startY + 17);
    doc.text(`Final Cost: ${document.getElementById("finalCost").innerText}`, 10, startY + 24);

    doc.setFontSize(10);
    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 10, 280);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 10, 287);

    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save("Invoice.pdf");
    }
}
