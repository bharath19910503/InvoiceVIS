// Add new row to invoice
document.getElementById('addItemBtn').addEventListener('click', () => {
    const tableBody = document.getElementById('invoiceBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" placeholder="Item"></td>
        <td><input type="text" placeholder="Material Used"></td>
        <td><input type="number" class="qty" value="1"></td>
        <td><input type="number" class="amount" value="0"></td>
    `;
    tableBody.appendChild(newRow);
    attachAmountListeners();
});

// Attach listeners to recalc totals
function attachAmountListeners() {
    const amounts = document.querySelectorAll('.amount');
    amounts.forEach(input => {
        input.removeEventListener('input', calculateTotals);
        input.addEventListener('input', calculateTotals);
    });
}
attachAmountListeners();

// Calculate total, GST, final
function calculateTotals() {
    const amounts = document.querySelectorAll('.amount');
    let total = 0;
    amounts.forEach(a => total += parseFloat(a.value) || 0);
    const gstPercent = parseFloat(document.getElementById('gstPercent').value) || 0;
    const gstAmount = total * gstPercent / 100;
    const final = total + gstAmount;

    document.getElementById('totalCost').innerText = total.toFixed(2);
    document.getElementById('gstAmount').innerText = gstAmount.toFixed(2);
    document.getElementById('finalCost').innerText = final.toFixed(2);
}

document.getElementById('gstPercent').addEventListener('input', calculateTotals);

// Download PDF (simplified using html2pdf)
document.getElementById('downloadPDF').addEventListener('click', () => {
    const element = document.body; 
    html2pdf().from(element).save('Invoice.pdf');
});

// 3D Design Generation Simulation
document.getElementById('generate3DBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('upload2D');
    if (!fileInput.files[0]) {
        alert("Please upload a 2D image first");
        return;
    }

    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    let progress = 0;

    const interval = setInterval(() => {
        progress += 10;
        progressBar.value = progress;
        progressStatus.innerText = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewImage').src = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    }, 300);
});
