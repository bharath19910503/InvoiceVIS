let invoiceItems = [];

const addItemBtn = document.getElementById('addItemBtn');
const invoiceTableBody = document.querySelector('#invoiceTable tbody');
const totalCostSpan = document.getElementById('totalCost');
const gstSpan = document.getElementById('gst');
const finalCostSpan = document.getElementById('finalCost');
const clientNameInput = document.getElementById('clientName');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const invoiceDateInput = document.getElementById('invoiceDate');
const uploadInvoiceInput = document.getElementById('uploadInvoice');
const upload2DDesignInput = document.getElementById('upload2DDesign');
const previewPDFBtn = document.getElementById('previewPDFBtn');
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
const pdfPreview = document.getElementById('pdfPreview');
const generate3DBtn = document.getElementById('generate3DBtn');

function updateTable() {
  invoiceTableBody.innerHTML = '';
  invoiceItems.forEach((item, index) => {
    const tr = document.createElement('tr');

    ['description','quantity','rate','cost'].forEach(key => {
      const td = document.createElement('td');
      if(key === 'cost') {
        td.textContent = (item.quantity * item.rate).toFixed(2);
      } else {
        const input = document.createElement('input');
        input.value = item[key];
        input.oninput = () => {
          item[key] = key === 'quantity' || key === 'rate' ? parseFloat(input.value) || 0 : input.value;
          updateTotals();
          updateTable();
        }
        td.appendChild(input);
      }
      tr.appendChild(td);
    });

    invoiceTableBody.appendChild(tr);
  });
}

function updateTotals() {
  const total = invoiceItems.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
  const gst = total * 0.18;
  const finalCost = total + gst;

  totalCostSpan.textContent = total.toFixed(2);
  gstSpan.textContent = gst.toFixed(2);
  finalCostSpan.textContent = finalCost.toFixed(2);
}

addItemBtn.addEventListener('click', () => {
  invoiceItems.push({description:'', quantity:1, rate:0, cost:0});
  updateTable();
  updateTotals();
});

// Upload Invoice JSON
uploadInvoiceInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    clientNameInput.value = data.clientName || '';
    invoiceNumberInput.value = data.invoiceNumber || '';
    invoiceDateInput.value = data.invoiceDate || '';
    invoiceItems = data.items || [];
    updateTable();
    updateTotals();
  }
  reader.readAsText(file);
});

// PDF Generation
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Logo placeholder
  const logo = document.querySelector('.logo');
  if(logo) doc.addImage(logo.src, 'PNG', 80, 10, 50, 20);

  doc.setFontSize(16);
  doc.text("Varshith Interior Solution", 105, 40, null, null, 'center');

  doc.setFontSize(12);
  doc.text(`Invoice Details`, 14, 50);
  doc.text(`Client Name: ${clientNameInput.value || 'N/A'}`, 14, 58);
  const invNo = invoiceNumberInput.value || Math.floor(10000 + Math.random()*90000);
  doc.text(`Invoice Number: ${invNo}`, 14, 66);
  doc.text(`Date: ${invoiceDateInput.value || new Date().toLocaleDateString()}`, 14, 74);

  // Table
  let startY = 84;
  doc.autoTable({
    startY,
    head: [['Description','Quantity','Rate','Cost']],
    body: invoiceItems.map(i => [i.description, i.quantity, i.rate, (i.quantity*i.rate).toFixed(2)]),
  });

  const finalY = doc.lastAutoTable.finalY || startY;
  doc.text(`Total Cost: ${totalCostSpan.textContent}`, 14, finalY + 10);
  doc.text(`GST (18%): ${gstSpan.textContent}`, 14, finalY + 18);
  doc.text(`Final Cost: ${finalCostSpan.textContent}`, 14, finalY + 26);

  // Footer
  doc.setFontSize(10);
  doc.text("Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106", 14, 280);
  doc.text("Phone: +91 9916511599 & +91 8553608981", 14, 286);

  return doc;
}

previewPDFBtn.addEventListener('click', () => {
  const doc = generatePDF();
  pdfPreview.innerHTML = `<iframe width="100%" height="500px" src="${doc.output('bloburl')}"></iframe>`;
});

downloadPDFBtn.addEventListener('click', () => {
  const doc = generatePDF();
  doc.save(`Invoice_${invoiceNumberInput.value || Math.floor(10000 + Math.random()*90000)}.pdf`);
});

// Placeholder 2D → 3D Design
generate3DBtn.addEventListener('click', () => {
  alert("3D Design Generator functionality will be implemented here.");
});
