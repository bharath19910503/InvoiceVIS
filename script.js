let invoiceTable = document.querySelector("#invoiceTable tbody");
let totalCostEl = document.getElementById("totalCost");
let gstEl = document.getElementById("gst");
let finalCostEl = document.getElementById("finalCost");

document.getElementById("addItemBtn").addEventListener("click", addItem);
document.getElementById("generateInvoice").addEventListener("click", generateInvoice);
document.getElementById("downloadInvoice").addEventListener("click", downloadInvoice);
document.getElementById("generate3D").addEventListener("click", generate3D);

function addItem() {
    let row = invoiceTable.insertRow();
    row.insertCell(0).innerHTML = '<input type="text" placeholder="Item Name">';
    row.insertCell(1).innerHTML = '<input type="number" placeholder="Qty" value="1">';
    row.insertCell(2).innerHTML = '<input type="number" placeholder="Price" value="0">';
    updateTotals();
    row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateTotals));
}

function updateTotals() {
    let total = 0;
    invoiceTable.querySelectorAll("tr").forEach(row => {
        let qty = Number(row.cells[1].querySelector("input").value);
        let price = Number(row.cells[2].querySelector("input").value);
        total += qty * price;
    });
    let gst = total * 0.18;
    let finalCost = total + gst;
    totalCostEl.textContent = total.toFixed(2);
    gstEl.textContent = gst.toFixed(2);
    finalCostEl.textContent = finalCost.toFixed(2);
}

function generateInvoice() {
    alert("Invoice Generated! Preview below will update soon.");
}

function downloadInvoice() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    let clientName = document.getElementById("clientName").value || "";
    let invoiceNumber = document.getElementById("invoiceNumber").value || Math.floor(Math.random() * 90000 + 10000);
    let date = document.getElementById("invoiceDate").value || new Date().toISOString().split("T")[0];

    doc.setFontSize(18);
    doc.text("Varshith Interior Solution", 105, 15, null, null, "center");
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`, 14, 30);
    doc.text(`Client Name: ${clientName}`, 14, 38);
    doc.text(`Date: ${date}`, 14, 46);

    let startY = 60;
    invoiceTable.querySelectorAll("tr").forEach((row, index) => {
        let item = row.cells[0].querySelector("input").value;
        let qty = row.cells[1].querySelector("input").value;
        let price = row.cells[2].querySelector("input").value;
        doc.text(`${item}`, 14, startY + index * 8);
        doc.text(`${qty}`, 80, startY + index * 8);
        doc.text(`${price}`, 120, startY + index * 8);
    });

    let lastY = startY + invoiceTable.rows.length * 8 + 10;
    doc.text(`Total Cost: ${totalCostEl.textContent}`, 14, lastY);
    doc.text(`GST: ${gstEl.textContent}`, 14, lastY + 8);
    doc.text(`Final Cost: ${finalCostEl.textContent}`, 14, lastY + 16);

    doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
    doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 287);
    doc.save(`Invoice_${invoiceNumber}.pdf`);
}

function generate3D() {
    let file = document.getElementById("upload2D").files[0];
    if(!file) {
        alert("Please upload a 2D design first!");
        return;
    }
    document.getElementById("preview3D").textContent = "3D Design generated from: " + file.name;
}
