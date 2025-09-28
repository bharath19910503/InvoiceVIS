const designList = document.getElementById('designList');
const addDesign = document.getElementById('addDesign');
const quotedAmount = document.getElementById('quotedAmount');
const totalAmount = document.getElementById('totalAmount');
const note = document.getElementById('note');
const previewNote = document.getElementById('previewNote');
const generatePDF = document.getElementById('generatePDF');

let designs = [];

addDesign.addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(ev){
      const design = {name:file.name, src:ev.target.result};
      designs.push(design);
      renderDesigns();
    };
    reader.readAsDataURL(file);
  });
  addDesign.value = '';
});

function renderDesigns(){
  designList.innerHTML = '';
  designs.forEach((d, idx)=>{
    const div = document.createElement('div');
    div.className = 'design-item';
    div.innerHTML = `
      <img src="${d.src}" class="design-thumb">
      <div class="design-info">${d.name}</div>
      <div class="design-controls">
        <button onclick="removeDesign(${idx})">Delete</button>
      </div>
    `;
    designList.appendChild(div);
  });
}

function removeDesign(index){
  designs.splice(index,1);
  renderDesigns();
}

quotedAmount.addEventListener('input', ()=>{
  totalAmount.textContent = Number(quotedAmount.value || 0).toLocaleString('en-IN', {style:'currency', currency:'INR'});
});

note.addEventListener('input', ()=>{
  previewNote.textContent = note.value;
});

// PDF Generation
generatePDF.addEventListener('click', ()=>{
  const invoiceData = {
    client: document.getElementById('clientName').value,
    invoiceNo: document.getElementById('invoiceNo').value,
    date: document.getElementById('invoiceDate').value,
    designs: designs,
    amount: quotedAmount.value,
    note: note.value
  };

  const pdfWindow = window.open('', '_blank');
  let designsHtml = '';
  invoiceData.designs.forEach(d=>{
    designsHtml += `<div><img src="${d.src}" style="width:80px;height:60px;border:1px solid #000;margin-right:5px;"> ${d.name}</div>`;
  });

  pdfWindow.document.write(`
    <h1>Invoice: ${invoiceData.invoiceNo}</h1>
    <p>Date: ${invoiceData.date}</p>
    <p>Client: ${invoiceData.client}</p>
    <hr>
    <h3>Design Files:</h3>
    ${designsHtml}
    <hr>
    <p>Quoted Amount: ₹${invoiceData.amount}</p>
    <p>${invoiceData.note}</p>
  `);
  pdfWindow.print();
});
