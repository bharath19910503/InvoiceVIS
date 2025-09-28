const invoiceTbody = document.querySelector('#invoiceTable tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const gstPercentEl = document.getElementById('gstPercent');
const totalCostEl = document.getElementById('totalCost');
const gstAmountEl = document.getElementById('gstAmount');
const finalCostEl = document.getElementById('finalCost');
const generatePDFBtn = document.getElementById('generatePDFBtn');
const logoUpload = document.getElementById('logoUpload');
const logoImg = document.getElementById('logoImg');
const upload2D = document.getElementById('upload2D');
const designListEl = document.getElementById('designList');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

let logoDataURL = null;
let designs = [];

// Utilities
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

// Invoice table functions
function createRow(item='', material='', qty=1, unitPrice=0){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="item" type="text" value="${escapeHtml(item)}"></td>
    <td><input class="material" type="text" value="${escapeHtml(material)}"></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}"></td>
    <td><input class="unitPrice" type="number" min="0" step="0.01" value="${unitPrice}"></td>
    <td><input class="amount" type="text" readonly value="${(qty*unitPrice).toFixed(2)}"></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTbody.appendChild(tr);
  const qtyEl = tr.querySelector('.qty');
  const upEl = tr.querySelector('.unitPrice');
  const amountEl = tr.querySelector('.amount');
  function updateLine(){ 
    const q = parseFloat(qtyEl.value)||0;
    const p = parseFloat(upEl.value)||0;
    amountEl.value = (q*p).toFixed(2);
    recalcTotals();
  }
  qtyEl.addEventListener('input', updateLine);
  upEl.addEventListener('input', updateLine);
  tr.querySelector('.deleteBtn').addEventListener('click', ()=>{ tr.remove(); recalcTotals(); });
}
addRowBtn.addEventListener('click', ()=>{ createRow(); recalcTotals(); });
clearRowsBtn.addEventListener('click', ()=>{ invoiceTbody.innerHTML=''; recalcTotals(); });

function recalcTotals(){
  let total = 0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    total += parseFloat(tr.querySelector('.amount').value) || 0;
  });
  const gstPercent = parseFloat(gstPercentEl.value)||0;
  const gstAmount = total * gstPercent / 100;
  const final = total + gstAmount;
  totalCostEl.textContent = total.toFixed(2);
  gstAmountEl.textContent = gstAmount.toFixed(2);
  finalCostEl.textContent = final.toFixed(2);
}
gstPercentEl.addEventListener('input', recalcTotals);
invoiceTbody.innerHTML = ''; recalcTotals();

// Logo upload
logoUpload.addEventListener('change', async (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = e=>{ logoDataURL = e.target.result; logoImg.src = logoDataURL; };
  reader.readAsDataURL(f);
});

// 2D → 3D Designer
upload2D.addEventListener('change', async ev=>{
  const files = Array.from(ev.target.files||[]);
  for(const f of files){
    const id = uid('design_');
    const dataURL = await new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = e=>res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
    designs.push({id, name:f.name, dataURL, snapshot: dataURL});
  }
  renderDesignList();
  upload2D.value = '';
});

function renderDesignList(){
  designListEl.innerHTML = '';
  designs.forEach(d=>{
    const div = document.createElement('div'); div.className='design-item';
    div.innerHTML = `
      <img class="design-thumb" src="${escapeHtml(d.dataURL)}"/>
      <div class="design-info">
        <input class="design-name" value="${escapeHtml(d.name)}"/>
        <div class="design-controls">
          <button class="gen3dBtn">Generate 3D</button>
          <button class="removeBtn">Remove</button>
        </div>
      </div>
    `;
    div.querySelector('.design-name').addEventListener('input', e=>{ d.name=e.target.value; });
    div.querySelector('.gen3dBtn').addEventListener('click', ()=> alert('3D generation demo - snapshot already captured'));
    div.querySelector('.removeBtn').addEventListener('click', ()=>{
      designs = designs.filter(x=>x.id!==d.id); renderDesignList();
    });
    designListEl.appendChild(div);
  });
}

// PDF generation
generatePDFBtn.addEventListener('click', ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','pt','a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin=40;

  const clientName = document.getElementById('clientName')?.value || '';
  const invoiceNumber = document.getElementById('invoiceNumber')?.value || '';
  const invoiceDate = document.getElementById('invoiceDate')?.value || new Date().toLocaleDateString();
  const gstPercent = parseFloat(gstPercentEl.value)||0;

  const body=[];
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const item=tr.querySelector('.item').value||'';
    const material=tr.querySelector('.material').value||'';
    const qty=tr.querySelector('.qty').value||'0';
    const amount=tr.querySelector('.amount').value||'0.00';
    body.push([item,material,qty,amount]);
  });
  const total=parseFloat(totalCostEl.textContent)||0;
  const gstAmount=parseFloat(gstAmountEl.textContent)||0;
  const final=parseFloat(finalCostEl.textContent)||0;

  if(logoDataURL){ try{ doc.addImage(logoDataURL,'PNG',margin,18,72,48); } catch(e){} }
  doc.setFontSize(18); doc.text("Varshith Interior Solutions", pageWidth/2,40,{align:'center'});
  doc.setFontSize(10);
  doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106", pageWidth/2,56,{align:'center'});
  doc.text("Phone: +91 9916511599 & +91 8553608981   Email: Varshithinteriorsolutions@gmail.com", pageWidth/2,70,{align:'center'});
  doc.setFontSize(10);
  if(clientName) doc.text(`Client: ${clientName}`, margin, 90);
  doc.text(`Invoice No: ${invoiceNumber}`, pageWidth-200, 90);
  doc.text(`Date: ${invoiceDate}`, pageWidth-200, 105);

  try{
    doc.autoTable({
      head:[['Item','Material Used','Qty','Amount']],
      body,
      startY:120,
      theme:'grid',
      styles:{fontSize:10,cellPadding:6},
      headStyles:{fillColor:[46,125,50],textColor:255,halign:'center'},
      columnStyles:{0:{cellWidth:150},1:{cellWidth:240},2:{cellWidth:50,halign:'center'},3:{cellWidth:80,halign:'right'}},
      margin:{top:100,bottom:100}
    });
  }catch(e){ console.error(e); }

  let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY+20 : 140;
  doc.text("Payment note: 50% of the quoted amount has to be paid as advance, 30% after completing 50% of work and remaining 20% after the completion of work.", margin, finalY);

  finalY += 30;
  designs.forEach(d=>{
    doc.text(`Design: ${d.name}`, margin, finalY);
    finalY += 15;
    try{ doc.addImage(d.snapshot,'PNG',margin,finalY,120,90); finalY+=100; } catch(e){}
    if(finalY>700){ doc.addPage(); finalY=40; }
  });

  finalY += 10;
  doc.text(`Total Cost: ${total.toFixed(2)}`, margin, finalY);
  finalY+=12;
  doc.text(`GST (${gstPercent}%): ${gstAmount.toFixed(2)}`, margin, finalY);
  finalY+=12;
  doc.text(`Final Cost: ${final.toFixed(2)}`, margin, finalY);

  doc.save(`Invoice_${invoiceNumber||'New'}.pdf`);
});
