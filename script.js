let designs = [];

const designList = document.getElementById("designList");
const addDesignBtn = document.getElementById("addDesignBtn");
const designNameInput = document.getElementById("designName");
const designAmountInput = document.getElementById("designAmount");

// Add Design
addDesignBtn.addEventListener("click", () => {
  const name = designNameInput.value.trim();
  const amount = parseFloat(designAmountInput.value);

  if (!name || isNaN(amount)) return alert("Enter valid name and amount");

  designs.push({ name, amount });
  renderDesigns();

  designNameInput.value = "";
  designAmountInput.value = "";
});

// Render Design List
function renderDesigns() {
  designList.innerHTML = "";
  designs.forEach((d, i) => {
    const div = document.createElement("div");
    div.className = "design-item";
    div.innerHTML = `
      <span>${d.name} - ₹${d.amount.toLocaleString('en-IN')}</span>
      <button class="deleteBtn" onclick="deleteDesign(${i})">Delete</button>
    `;
    designList.appendChild(div);
  });
}

// Delete Design
function deleteDesign(index) {
  designs.splice(index, 1);
  renderDesigns();
}

// Format number in Indian Rupees
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Generate PDF
document.getElementById("generatePDFBtn").addEventListener("click", () => {
  if (!designs.length) return alert("Add at least one design");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Invoice", 14, 20);

  doc.setFontSize(12);
  let yPos = 30;

  designs.forEach((d, i) => {
    doc.text(`${i + 1}. ${d.name} - ${formatINR(d.amount)}`, 14, yPos);
    yPos += 8;

    const advance = d.amount * 0.5;
    const mid = d.amount * 0.3;
    const final = d.amount * 0.2;

    doc.text(`   - 50% Advance: ${formatINR(advance)}`, 18, yPos);
    yPos += 6;
    doc.text(`   - 30% After 50% Completion: ${formatINR(mid)}`, 18, yPos);
    yPos += 6;
    doc.text(`   - 20% On Completion: ${formatINR(final)}`, 18, yPos);
    yPos += 10;
  });

  doc.save("invoice.pdf");
});
