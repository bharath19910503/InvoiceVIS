/* DOM elements */
const invoiceTbody=document.querySelector('#invoiceTable tbody');
const addRowBtn=document.getElementById('addRowBtn');
const clearRowsBtn=document.getElementById('clearRowsBtn');
const gstPercentEl=document.getElementById('gstPercent');
const generatePDFBtn=document.getElementById('generatePDFBtn');
const upload2D=document.getElementById('upload2D');
const designListEl=document.getElementById('designList');
const progressContainer=document.getElementById('progressContainer');
const progressBar=document.getElementById('progressBar');
const preview3D=document.getElementById('preview3D');
const logoUpload=document.getElementById('logoUpload');
const logoImg=document.getElementById('logoImg');

let logoDataURL=null;
let designs=[];

/* Helper functions */
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function uid(prefix='id'){return prefix+Math.random().toString(36).slice(2,9);}
function getImageTypeFromDataURL(dataURL){if(!dataURL) return 'PNG'; const h=dataURL.substring(0,30).toLowerCase(); if(h.includes('jpeg')||h.includes('jpg')) return 'JPEG'; return 'PNG';}
async function resizeImageFileToDataURL(file,maxW=1200,maxH=1200,mime='image/jpeg',quality=0.8){return new Promise((resolve,reject)=>{const r=new FileReader(); r.onerror=()=>reject(new Error('read error')); r.onload=()=>{const img=new Image(); img.onload=()=>{let w=img.width,h=img.height; const ratio=Math.min(maxW/w,maxH/h,1); w=Math.round(w*ratio); h=Math.round(h*ratio); const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h); try{const dataURL=canvas.toDataURL(mime,quality); resolve(dataURL);}catch(e){reject(e);}}; img.onerror=()=>reject(new Error('invalid image')); img.src=r.result;}; r.readAsDataURL(file);});}

/* Invoice table row */
function createRow(item='',material='',qty=1,unitPrice=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input class="item" type="text" value="${escapeHtml(item)}"></td>
    <td><input class="material" type="text" value="${escapeHtml(material)}"></td>
    <td><input class="qty" type="number" min="0" step="1" value="${qty}"></td>
    <td><input class="unitPrice" type="number" min="0" step="0.01" value="${unitPrice}"></td>
    <td><input class="amount" type="text" readonly value="${(qty*unitPrice).toFixed(2)}"></td>
    <td><button class="deleteBtn">Delete</button></td>
  `;
  invoiceTbody.appendChild(tr);

  const qtyEl=tr.querySelector('.qty');
  const upEl=tr.querySelector('.unitPrice');
  const amountEl=tr.querySelector('.amount');

  function updateLine(){
    const q=parseFloat(qtyEl.value)||0;
    const p=parseFloat(upEl.value)||0;
    amountEl.value=(q*p).toFixed(2);
    updateTotals();
  }
  qtyEl.addEventListener('input',updateLine);
  upEl.addEventListener('input',updateLine);
  tr.querySelector('.deleteBtn').addEventListener('click',()=>{tr.remove();updateTotals();});
}

/* Totals */
function updateTotals(){
  const gstPercent=parseFloat(gstPercentEl.value)||0;
  let total=0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{const q=parseFloat(tr.querySelector('.qty').value)||0; const p=parseFloat(tr.querySelector('.unitPrice').value)||0; const amt=q*p; tr.querySelector('.amount').value=amt.toFixed(2); total+=amt;});
  const gstAmount=total*gstPercent/100;
  const finalCost=total+gstAmount;

  let summaryEl=document.getElementById('summary');
  summaryEl.innerHTML=`
    <div>Total Cost: ${total.toFixed(2)}</div>
    <div>GST (${gstPercent}%): ${gstAmount.toFixed(2)}</div>
    <div>Final Cost: ${finalCost.toFixed(2)}</div>
  `;
  return { total, gstAmount, finalCost };
}

/* Add / Clear */
addRowBtn.addEventListener('click',()=>{createRow();updateTotals();});
clearRowsBtn.addEventListener('click',()=>{invoiceTbody.innerHTML='';updateTotals();});
gstPercentEl.addEventListener('input',updateTotals);

/* Logo Upload */
logoUpload.addEventListener('change',async ev=>{const f=ev.target.files[0]; if(!f) return; try{logoDataURL=await resizeImageFileToDataURL(f,600,600,f.type.includes('png')?'image/png':'image/jpeg',0.9); logoImg.src=logoDataURL;}catch(e){}});

/* 2D → 3D Designs */
upload2D.addEventListener('change',async ev=>{
  const files=Array.from(ev.target.files||[]);
  for(const f of files){
    const id=uid('design_'); const fileName=f.name;
    let dataURL=null;
    try{dataURL=await resizeImageFileToDataURL(f,1600,1600,'image/jpeg',0.85);}catch(e){const r=new FileReader(); dataURL=await new Promise(res=>{r.onload=e=>res(e.target.result); r.readAsDataURL(f);});}
    const entry={id,name:fileName,fileName,dataURL,snapshot:null};
    designs.push(entry);
  }
  renderDesignList();
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
          <button class="gen3dBtn">Generate 3D</button>
          <button class="removeBtn">Remove</button>
        </div>
      </div>
    `;
    const nameInput=div.querySelector('.design-name');
    nameInput.addEventListener('input',e=>{d.name=e.target.value;});
    div.querySelector('.removeBtn').addEventListener('click',()=>{designs=designs.filter(x=>x.id!==d.id); renderDesignList();});
    div.querySelector('.gen3dBtn').addEventListener('click',()=>generate3DForDesign(d.id));
    designListEl.appendChild(div);
  });
}

/* Dummy 3D generation (snapshot simulation) */
function generate3DForDesign(designId){
  const entry=designs.find(d=>d.id===designId);
  if(!entry) return;
  progressContainer.style.display='block'; let p=0;
  const id=setInterval(()=>{p+=Math.random()*18; if(p>100)p=100; progressBar.style.width=`${p}%`; if(p===100){clearInterval(id); setTimeout(()=>{entry.snapshot=entry.dataURL; progressContainer.style.display='none'; alert(`3D snapshot ready for ${entry.name}`);},200);}},150);
}

/* Generate PDF */
generatePDFBtn.addEventListener('click',()=>{
  const { jsPDF }=window.jspdf; const doc=new jsPDF('p','pt','a4');
  const pageWidth=doc.internal.pageSize.getWidth();
  const margin=40;

  const clientName=document.getElementById('clientName').value||'';
  const invoiceNumber=document.getElementById('invoiceNumber').value||Date.now();
  const invoiceDate=document.getElementById('invoiceDate').value||new Date().toLocaleDateString();

  const body=[];
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const item=tr.querySelector('.item').value||'';
    const material=tr.querySelector('.material').value||'';
    const qty=tr.querySelector('.qty').value||'0';
    const amount=tr.querySelector('.amount').value||'0.00';
    body.push([item,material,qty,amount]);
  });

  const totals=updateTotals();
  const total=totals.total; const gstAmount=totals.gstAmount; const final=totals.finalCost;

  /* Header */
  if(logoDataURL) try{doc.addImage(logoDataURL,getImageTypeFromDataURL(logoDataURL),margin,18,72,48);}catch(e){}
  doc.setFontSize(18); doc.text("Varshith Interior Solutions",pageWidth/2,40,{align:'center'});
  doc.setFontSize(10); doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106",pageWidth/2,56,{align:'center'});
  doc.text("Phone: +91 9916511599 & +91 8553608981 | Email: Varshithinteriorsolutions@gmail.com",pageWidth/2,70,{align:'center'});
  doc.setFontSize(12); doc.text(`Invoice To: ${clientName}`,margin,100);
  doc.text(`Invoice No: ${invoiceNumber}`,margin,115);
  doc.text(`Date: ${invoiceDate}`,margin,130);

  doc.autoTable({
    startY:150,
    head:[['Item','Material','Qty','Amount']],
    body,
    theme:'grid',
    margin:{left:margin,right:margin}
  });

  let finalY=doc.lastAutoTable.finalY+10;

  /* Payment note */
  doc.setFontSize(10); doc.text("Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.",margin,finalY);
  finalY+=30;

  /* Totals */
  doc.text(`Total Cost: ${total.toFixed(2)}`,margin,finalY);
  finalY+=15;
  doc.text(`GST (${gstPercentEl.value}%): ${gstAmount.toFixed(2)}`,margin,finalY);
  finalY+=15;
  doc.text(`Final Cost: ${final.toFixed(2)}`,margin,finalY);
  finalY+=25;

  /* 3D Designs */
  designs.forEach(d=>{
    if(!d.snapshot) return;
    doc.setFontSize(10); doc.text(`Design: ${d.name}`,margin,finalY);
    try{doc.addImage(d.snapshot,getImageTypeFromDataURL(d.snapshot),margin,finalY+5,120,90);}catch(e){}
    finalY+=100;
  });

  doc.save(`Invoice_${invoiceNumber}.pdf`);
});
