// ----------------- Invoice Functions -----------------
function addRow(item = {}) {
  const tbody = document.getElementById("invoiceBody");
  const rowCount = tbody.rows.length + 1;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="text" value="${item.name || ''}"></td>
    <td><input type="text" value="${item.material || ''}"></td>
    <td><input type="number" class="price" value="${item.price || 0}"></td>
    <td><button onclick="deleteRow(this)">Delete</button></td>
  `;
  calculateTotal();
}

function deleteRow(btn) {
  const row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
  updateSlNo();
  calculateTotal();
}

function updateSlNo() {
  const rows = document.querySelectorAll("#invoiceBody tr");
  rows.forEach((row, index) => {
    row.cells[0].textContent = index + 1;
  });
}

function calculateTotal() {
  let total = 0;
  document.querySelectorAll(".price").forEach(input => {
    total += parseFloat(input.value) || 0;
  });
  const gst = total * 0.18;
  const final = total + gst;

  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("gstAmount").textContent = gst.toFixed(2);
  document.getElementById("finalAmount").textContent = final.toFixed(2);
}

document.addEventListener("input", calculateTotal);

// ----------------- Invoice Upload & Edit -----------------
function loadInvoice(input) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    document.getElementById("clientName").value = data.clientName || '';
    document.getElementById("invoiceNumber").value = data.invoiceNumber || '';
    document.getElementById("invoiceDate").value = data.date || '';
    const tbody = document.getElementById("invoiceBody");
    tbody.innerHTML = "";
    data.items.forEach(item => addRow(item));
  };
  reader.readAsText(input.files[0]);
}

function editInvoice() {
  const data = {
    clientName: document.getElementById("clientName").value,
    invoiceNumber: document.getElementById("invoiceNumber").value,
    date: document.getElementById("invoiceDate").value,
    items: Array.from(document.querySelectorAll("#invoiceBody tr")).map(row => ({
      name: row.cells[1].firstChild.value,
      material: row.cells[2].firstChild.value,
      price: row.cells[3].firstChild.value
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${data.invoiceNumber || 'edited'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ----------------- PDF Download -----------------
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Varshith Interior Solution", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Client Name: ${document.getElementById("clientName").value}`, 14, 35);
  doc.text(`Invoice No: ${document.getElementById("invoiceNumber").value}`, 14, 42);
  doc.text(`Date: ${document.getElementById("invoiceDate").value}`, 14, 49);

  // Table
  const rows = Array.from(document.querySelectorAll("#invoiceBody tr")).map((row, index) => [
    index + 1,
    row.cells[1].firstChild.value,
    row.cells[2].firstChild.value,
    row.cells[3].firstChild.value
  ]);

  doc.autoTable({
    startY: 55,
    head: [['Sl No', 'Item Name', 'Material', 'Price (₹)']],
    body: rows,
  });

  const totalsY = doc.lastAutoTable.finalY + 10;
  doc.text(`Total: ₹${document.getElementById("totalAmount").textContent}`, 14, totalsY);
  doc.text(`GST (18%): ₹${document.getElementById("gstAmount").textContent}`, 14, totalsY + 7);
  doc.text(`Final Total: ₹${document.getElementById("finalAmount").textContent}`, 14, totalsY + 14);

  // Footer
  doc.setFontSize(10);
  doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
  doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 287);

  doc.save(`Invoice_${document.getElementById("invoiceNumber").value}.pdf`);
}
