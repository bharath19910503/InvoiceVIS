// ----------------- VARIABLES -----------------
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
const preview3D = document.getElementById('preview3D');

let logoDataURL = null;
let designs = []; // {id,name,fileName,dataURL,snapshot}

// ----------------- UTILITY -----------------
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function getImageTypeFromDataURL(dataURL){ if(!dataURL) return 'PNG'; if(dataURL.includes('jpeg')||dataURL.includes('jpg')) return 'JPEG'; return 'PNG'; }

// ----------------- INVOICE TABLE -----------------
function createRow(item='', material='', qty=1, unitPrice=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input class="item" type="text" value="${escapeHtml(item)}"></td>
    <td><input class="material" type="text" value="${escapeHtml(material)}"></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}"></td>
    <td><input class="unitPrice" type="number" min="0" step="0.01" value="${unitPrice}"></td>
    <td><input class="amount" type="text" readonly value="${(qty*unitPrice).toFixed(2)}"></td>
    <td><button class="deleteBtn">Delete</button></td>`;
  invoiceTbody.appendChild(tr);

  const qtyEl=tr.querySelector('.qty'), upEl=tr.querySelector('.unitPrice'), amountEl=tr.querySelector('.amount');
  function updateLine(){ const q=parseFloat(qtyEl.value)||0, p=parseFloat(upEl.value)||0; amountEl.value=(q*p).toFixed(2); recalcTotals(); }
  qtyEl.addEventListener('input', updateLine); upEl.addEventListener('input', updateLine);
  tr.querySelector('.deleteBtn').addEventListener('click', ()=>{ tr.remove(); recalcTotals(); });
}

addRowBtn.addEventListener('click', ()=>{ createRow(); recalcTotals(); });
clearRowsBtn.addEventListener('click', ()=>{ invoiceTbody.innerHTML=''; recalcTotals(); });

function recalcTotals(){
  let total=0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{ total+=parseFloat(tr.querySelector('.amount').value)||0; });
  const gst=parseFloat(gstPercentEl.value)||0;
  const gstAmt=total*gst/100;
  totalCostEl.textContent=total.toFixed(2);
  gstAmountEl.textContent=gstAmt.toFixed(2);
  finalCostEl.textContent=(total+gstAmt).toFixed(2);
}
gstPercentEl.addEventListener('input', recalcTotals);
recalcTotals();

// ----------------- LOGO UPLOAD -----------------
logoUpload.addEventListener('change', async ev=>{
  const f=ev.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{ logoDataURL=e.target.result; logoImg.src=logoDataURL; }
  r.readAsDataURL(f);
});

// ----------------- DESIGN UPLOAD -----------------
upload2D.addEventListener('change', async ev=>{
  const files=Array.from(ev.target.files||[]);
  for(const f of files){
    const id=uid('d_'); const fileName=f.name;
    const reader=new FileReader();
    reader.onload=e=>{
      designs.push({id,name:fileName,fileName,dataURL:e.target.result,snapshot:e.target.result});
      renderDesignList();
    };
    reader.readAsDataURL(f);
  }
  upload2D.value='';
});

function renderDesignList(){
  designListEl.innerHTML='';
  designs.forEach(d=>{
    const div=document.createElement('div'); div.className='design-item';
    div.innerHTML=`
      <img class="design-thumb" src="${escapeHtml(d.dataURL)}"/>
      <div class="design-info">
        <input class="design-name" value="${escapeHtml(d.name)}"/>
        <div class="design-controls">
          <button class="removeBtn">Remove</button>
        </div>
      </div>`;
    div.querySelector('.design-name').addEventListener('input', e=>{ d.name=e.target.value; });
    div.querySelector('.removeBtn').addEventListener('click', ()=>{ designs=designs.filter(x=>x.id!==d.id); renderDesignList(); });
    designListEl.appendChild(div);
  });
}

// ----------------- PDF -----------------
generatePDFBtn.addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p','pt','a4');
  const pageWidth=doc.internal.pageSize.getWidth(), margin=40;
  const clientName=document.getElementById('clientName')?.value||'';
  const invoiceNumber=document.getElementById('invoiceNumber')?.value||'';
  const invoiceDate=document.getElementById('invoiceDate')?.value||new Date().toLocaleDateString();
  const gstPercent=parseFloat(gstPercentEl.value)||0;

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

  if(logoDataURL) doc.addImage(logoDataURL,getImageTypeFromDataURL(logoDataURL),margin,20,60,60);
  doc.setFontSize(18); doc.text("Varshith Interior Solutions",pageWidth/2,40,{align:'center'});
  doc.setFontSize(10); doc.text(`Address: NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106`,pageWidth/2,56,{align:'center'});
  doc.text(`Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com`,pageWidth/2,70,{align:'center'});

  doc.setFontSize(12); doc.text(`Invoice No: ${invoiceNumber}`,margin,100);
  doc.text(`Date: ${invoiceDate}`,pageWidth-150,100);
  doc.text(`Client: ${clientName}`,margin,120);

  doc.autoTable({
    startY:140,
    head:[['Item','Material','Qty','Amount']],
    body:body
  });

  let y=doc.lastAutoTable.finalY+10;
  doc.text(`Total: ₹${total.toFixed(2)}`,margin,y);
  doc.text(`GST (${gstPercent}%): ₹${gstAmount.toFixed(2)}`,margin,y+15);
  doc.text(`Final: ₹${final.toFixed(2)}`,margin,y+30);

  doc.setFontSize(10);
  doc.text(`Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.`,margin,y+50,{maxWidth:pageWidth-2*margin});

  let designY=y+80;
  for(const d of designs){
    if(designY>doc.internal.pageSize.getHeight()-80){ doc.addPage(); designY=40; }
    doc.text(`Design: ${d.name}`,margin,designY);
    if(d.snapshot) doc.addImage(d.snapshot,getImageTypeFromDataURL(d.snapshot),margin,designY+5,150,100);
    designY+=110;
  }

  doc.save(`Invoice_${invoiceNumber||Date.now()}.pdf`);
});
