const invoiceTbody = document.querySelector('#invoiceTable tbody');
const addRowBtn = document.getElementById('addRowBtn');
const clearRowsBtn = document.getElementById('clearRowsBtn');
const gstPercentEl = document.getElementById('gstPercent');
const totalCostEl = document.createElement('span');
const gstAmountEl = document.createElement('span');
const finalCostEl = document.createElement('span');

const generatePDFBtn = document.getElementById('generatePDFBtn');
const logoUpload = document.getElementById('logoUpload');
const logoImg = document.getElementById('logoImg');
const upload2D = document.getElementById('upload2D');
const designListEl = document.getElementById('designList');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const preview3D = document.getElementById('preview3D');

let logoDataURL = null;
let designs = [];

// Utils
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function resizeImageFileToDataURL(file,maxW=1200,maxH=1200,mime='image/jpeg',quality=0.8){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onerror = ()=>reject(new Error('read error'));
    r.onload = ()=> {
      const img = new Image();
      img.onload = ()=>{
        let w=img.width,h=img.height;
        const ratio=Math.min(maxW/w,maxH/h,1);
        w=Math.round(w*ratio); h=Math.round(h*ratio);
        const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
        ctx.drawImage(img,0,0,w,h);
        try{ resolve(canvas.toDataURL(mime,quality)); }catch(e){ reject(e); }
      };
      img.onerror=()=>reject(new Error('invalid image'));
      img.src=r.result;
    };
    r.readAsDataURL(file);
  });
}

// Invoice row
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
  const qtyEl=tr.querySelector('.qty'),upEl=tr.querySelector('.unitPrice'),amountEl=tr.querySelector('.amount');
  function updateLine(){ const q=parseFloat(qtyEl.value)||0,p=parseFloat(upEl.value)||0; amountEl.value=(q*p).toFixed(2); }
  qtyEl.addEventListener('input',updateLine); upEl.addEventListener('input',updateLine);
  tr.querySelector('.deleteBtn').addEventListener('click',()=>{ tr.remove(); });
}

addRowBtn.addEventListener('click',()=>{ createRow(); });
clearRowsBtn.addEventListener('click',()=>{ invoiceTbody.innerHTML=''; });

// Logo upload
logoUpload.addEventListener('change', async(ev)=>{
  const f=ev.target.files[0]; if(!f) return;
  logoDataURL = await resizeImageFileToDataURL(f,600,600,f.type.includes('png')?'image/png':'image/jpeg',0.9);
  logoImg.src=logoDataURL;
});

// Upload 2D designs
upload2D.addEventListener('change', async(ev)=>{
  const files=Array.from(ev.target.files||[]);
  for(const f of files){
    const id=uid('design_'); let dataURL=null;
    dataURL=await resizeImageFileToDataURL(f,1600,1600,'image/jpeg',0.85);
    designs.push({id,name:f.name,fileName:f.name,dataURL,snapshot:null});
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
    nameInput.addEventListener('input',e=>{ d.name=e.target.value; });
    div.querySelector('.gen3dBtn').addEventListener('click',()=>{ d.snapshot=d.dataURL; alert('3D generated for '+d.name); });
    div.querySelector('.removeBtn').addEventListener('click',()=>{ designs=designs.filter(x=>x.id!==d.id); renderDesignList(); });
    designListEl.appendChild(div);
  });
}

// Generate PDF
generatePDFBtn.addEventListener('click',()=>{
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF('p','pt','a4'); const pageWidth=doc.internal.pageSize.getWidth(); const margin=40;
  const clientName=document.getElementById('clientName')?.value||'';
  const invoiceNumber=document.getElementById('invoiceNumber')?.value||'';
  const invoiceDate=document.getElementById('invoiceDate')?.value||new Date().toLocaleDateString();
  const gstPercent=parseFloat(gstPercentEl.value)||0;

  const body=[];
  let total=0;
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const item=tr.querySelector('.item').value||'';
    const material=tr.querySelector('.material').value||'';
    const qty=tr.querySelector('.qty').value||'0';
    const amount=parseFloat(tr.querySelector('.amount').value)||0;
    total+=amount;
    body.push([item,material,qty,amount.toFixed(2)]);
  });
  const gstAmount=total*gstPercent/100;
  const final=total+gstAmount;

  // Header
  if(logoDataURL) try{ doc.addImage(logoDataURL,'PNG',margin,18,72,48); }catch(e){}
  doc.setFontSize(18); doc.text("Varshith Interior Solutions",pageWidth/2,40,{align:'center'});
  doc.setFontSize(10);
  doc.text("NO 39 BRN Ashish Layout, Near Sri Thimmaraya Swami Gudi, Anekal - 562106",pageWidth/2,56,{align:'center'});
  doc.text("Phone: +91 9916511599 & +91 8553608981   Email: Varshithinteriorsolutions@gmail.com",pageWidth/2,70,{align:'center'});
  if(clientName) doc.text(`Client: ${clientName}`,margin,90);
  doc.text(`Invoice No: ${invoiceNumber}`,pageWidth-200,90);
  doc.text(`Date: ${invoiceDate}`,pageWidth-200,105);

  try{ doc.autoTable({head:[['Item','Material Used','Qty','Amount']],body,startY:120,theme:'grid',styles:{fontSize:10,cellPadding:6},headStyles:{fillColor:[46,125,50],textColor:255,halign:'center'},columnStyles:{0:{cellWidth:150},1:{cellWidth:240},2:{cellWidth:50,halign:'center'},3:{cellWidth:80,halign:'right'}},margin:{top:100,bottom:100}});}catch(e){console.error(e);}

  let finalY=(doc.lastAutoTable && doc.lastAutoTable.finalY)?doc.lastAutoTable.finalY+20:140;
  doc.text("Payment note: 50% of the quoted amount has to be paid as advance, 30% after completing 50% of work and remaining 20% after the completion of work.",margin,finalY);
  finalY+=30;

  // Totals
  doc.text(`Total Cost: ${total.toFixed(2)}`,margin,finalY); finalY+=15;
  doc.text(`GST (${gstPercent}%): ${gstAmount.toFixed(2)}`,margin,finalY); finalY+=15;
  doc.text(`Final Cost: ${final.toFixed(2)}`,margin,finalY); finalY+=20;

  // Designs
  designs.forEach(d=>{
    doc.text(`Design: ${d.name}`,margin,finalY); finalY+=15;
    try{ doc.addImage(d.snapshot||d.dataURL,'PNG',margin,finalY,120,90); finalY+=100; }catch(e){}
    if(finalY>700){ doc.addPage(); finalY=40; }
  });

  doc.save(`Invoice_${invoiceNumber||'New'}.pdf`);
});
