// Invoice logic
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

let invoiceItems = [];
let logoDataURL = null;
let designs = [];

logoUpload.addEventListener('change', e=>{
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = ev=>{ logoImg.src=ev.target.result; logoDataURL = ev.target.result; };
    reader.readAsDataURL(file);
  }
});

function recalcTotals(){
  let total=0;
  invoiceItems.forEach(item=>total+=item.qty*item.price);
  totalCostEl.textContent = total.toFixed(2);
  let gst = total * Number(gstPercentEl.value)/100;
  gstAmountEl.textContent = gst.toFixed(2);
  finalCostEl.textContent = (total+gst).toFixed(2);
}

function renderInvoice(){
  invoiceTbody.innerHTML='';
  invoiceItems.forEach((item,index)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input value="${item.name}" onchange="invoiceItems[${index}].name=this.value"></td>
      <td><input value="${item.material}" onchange="invoiceItems[${index}].material=this.value"></td>
      <td><input type="number" value="${item.qty}" min="0" onchange="invoiceItems[${index}].qty=+this.value;recalcTotals()"></td>
      <td><input type="number" value="${item.price}" min="0" onchange="invoiceItems[${index}].price=+this.value;recalcTotals()"></td>
      <td>${(item.qty*item.price).toFixed(2)}</td>
      <td><button class="deleteBtn" onclick="invoiceItems.splice(${index},1);renderInvoice();recalcTotals()">Delete</button></td>
    `;
    invoiceTbody.appendChild(tr);
  });
}

addRowBtn.addEventListener('click',()=>{
  invoiceItems.push({name:'',material:'',qty:1,price:0});
  renderInvoice();
  recalcTotals();
});

clearRowsBtn.addEventListener('click',()=>{
  invoiceItems=[];
  renderInvoice();
  recalcTotals();
});

gstPercentEl.addEventListener('input',recalcTotals);

// 2D → 3D Designs
const upload2D = document.getElementById('upload2D');
const designListEl = document.getElementById('designList');
const preview3D = document.getElementById('preview3D');

upload2D.addEventListener('change', async e=>{
  const files = Array.from(e.target.files);
  for(const file of files){
    const reader = new FileReader();
    reader.onload = ev=>{
      const id=Date.now()+Math.random();
      designs.push({id,name:file.name,snapshot:ev.target.result});
      renderDesigns();
    };
    reader.readAsDataURL(file);
  }
});

function renderDesigns(){
  designListEl.innerHTML='';
  designs.forEach((d,index)=>{
    const div=document.createElement('div');
    div.className='design-item';
    div.innerHTML=`
      <img class="design-thumb" src="${d.snapshot}">
      <div class="design-info">
        <input value="${d.name}" onchange="designs[${index}].name=this.value">
      </div>
    `;
    designListEl.appendChild(div);
  });
}

// PDF generation
generatePDFBtn.addEventListener('click',()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt',format:'a4'});
  let y=20;

  if(logoDataURL) doc.addImage(logoDataURL,'JPEG',40,y,80,80);
  doc.setFontSize(16);
  doc.text('Varshith Interior Solutions',130,y+20);
  doc.setFontSize(10);
  doc.text('NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106',130,y+40);
  y+=100;

  doc.setFontSize(12);
  doc.text(`Invoice Number: ${document.getElementById('invoiceNumber').value}`,40,y);
  doc.text(`Date: ${document.getElementById('invoiceDate').value}`,300,y);
  doc.text(`Client: ${document.getElementById('clientName').value}`,40,y+20);
  y+=40;

  doc.autoTable({
    startY:y,
    head:[['Item','Material','Qty','Unit Price','Amount']],
    body:invoiceItems.map(i=>[i.name,i.material,i.qty,i.price,(i.qty*i.price).toFixed(2)]),
    theme:'grid'
  });

  y = doc.lastAutoTable.finalY + 20;
  doc.text(`Total Cost: ${totalCostEl.textContent}`,40,y);
  doc.text(`GST (${gstPercentEl.value}%): ${gstAmountEl.textContent}`,40,y+15);
  doc.text(`Final Cost: ${finalCostEl.textContent}`,40,y+30);
  y+=50;
  doc.text("Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.",40,y,{maxWidth:500});
  y+=50;

  designs.forEach(d=>{
    if(y>700){ doc.addPage(); y=40; }
    doc.text(d.name,40,y);
    doc.addImage(d.snapshot,getImageTypeFromDataURL(d.snapshot),40,y+10,150,100);
    y+=120;
  });

  doc.save('invoice.pdf');
});

function getImageTypeFromDataURL(dataURL){
  if(!dataURL) return 'PNG';
  if(dataURL.includes('jpeg')||dataURL.includes('jpg')) return 'JPEG';
  return 'PNG';
}
