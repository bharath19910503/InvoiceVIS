/* ===== DOM elements ===== */
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
const preview3D = document.getElementById('preview3D');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonFile = document.getElementById('importJsonFile');

let logoDataURL = null;
let designs = [];

/* ===== Helper Functions ===== */
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getImageTypeFromDataURL(dataURL){ 
  if(!dataURL) return 'PNG';
  const h = dataURL.substring(0,30).toLowerCase();
  if(h.includes('jpeg')||h.includes('jpg')) return 'JPEG';
  return 'PNG';
}

/* ===== Invoice Table Functions ===== */
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
    total += parseFloat(tr.querySelector('.amount').value)||0;
  });
  const gstPercent = parseFloat(gstPercentEl.value)||0;
  const gstAmount = total*gstPercent/100;
  totalCostEl.textContent = total.toFixed(2);
  gstAmountEl.textContent = gstAmount.toFixed(2);
  finalCostEl.textContent = (total+gstAmount).toFixed(2);
}
gstPercentEl.addEventListener('input', recalcTotals);
invoiceTbody.innerHTML=''; recalcTotals();

/* ===== Logo Upload ===== */
logoUpload.addEventListener('change', async (ev)=>{
  const f = ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = e=>{ logoDataURL = e.target.result; logoImg.src=logoDataURL; };
  reader.readAsDataURL(f);
});

/* ===== Designs Upload & Render ===== */
upload2D.addEventListener('change', async (ev)=>{
  const files = Array.from(ev.target.files || []);
  for(const f of files){
    const id = uid('design_');
    const reader = new FileReader();
    reader.onload = e=>{
      const entry = { id, name:f.name, fileName:f.name, dataURL:e.target.result, snapshot:null };
      designs.push(entry);
      renderDesignList();
    };
    reader.readAsDataURL(f);
  }
  upload2D.value='';
});

function renderDesignList(){
  designListEl.innerHTML='';
  designs.forEach(d=>{
    const div = document.createElement('div'); div.className='design-item';
    div.innerHTML=`
      <img class="design-thumb" src="${escapeHtml(d.dataURL)}" alt="${escapeHtml(d.name)}"/>
      <div class="design-info">
        <input class="design-name" value="${escapeHtml(d.name)}"/>
        <div class="design-controls">
          <button class="gen3dBtn">Generate 3D</button>
          <button class="removeBtn">Remove</button>
        </div>
      </div>
    `;
    div.querySelector('.design-name').addEventListener('input', e=>{ d.name=e.target.value; });
    div.querySelector('.gen3dBtn').addEventListener('click', ()=>generate3DForDesign(d.id));
    div.querySelector('.removeBtn').addEventListener('click', ()=>{ designs=designs.filter(x=>x.id!==d.id); renderDesignList(); });
    designListEl.appendChild(div);
  });
}

/* ===== 3D Preview Generation ===== */
let globalRenderer=null, globalScene=null, globalCamera=null, globalControls=null;
function generate3DForDesign(designId){
  const entry = designs.find(d=>d.id===designId); if(!entry){ alert('Design not found'); return; }
  progressContainer.style.display='block'; progressBar.style.width='0%';
  let p=0;
  const id = setInterval(()=>{
    p+=Math.random()*20; if(p>100)p=100;
    progressBar.style.width=`${p}%`;
    if(p===100){ clearInterval(id); setTimeout(()=>{
      progressContainer.style.display='none';
      render3DPlaneAndCapture(entry);
    },200);}
  },150);
}

function render3DPlaneAndCapture(entry){
  if(globalRenderer){ try{ globalRenderer.forceContextLoss(); globalRenderer.domElement.remove(); }catch(e){} globalRenderer=null; }
  globalScene = new THREE.Scene(); globalScene.background = new THREE.Color(0xf3f3f3);
  const w = preview3D.clientWidth||600; const h = preview3D.clientHeight||380;
  globalCamera = new THREE.PerspectiveCamera(45, w/h,0.1,1000);
  globalCamera.position.set(0,0,5);
  globalRenderer = new THREE.WebGLRenderer({antialias:true});
  globalRenderer.setSize(w,h); preview3D.innerHTML=''; preview3D.appendChild(globalRenderer.domElement);
  const controls = new THREE.OrbitControls(globalCamera, globalRenderer.domElement);
  const light = new THREE.DirectionalLight(0xffffff,1); light.position.set(5,5,5); globalScene.add(light);
  const texture = new THREE.TextureLoader().load(entry.dataURL);
  const geometry = new THREE.PlaneGeometry(3,2); const material = new THREE.MeshBasicMaterial({map:texture});
  const plane = new THREE.Mesh(geometry,material); globalScene.add(plane);
  globalRenderer.render(globalScene,globalCamera);
  const snapshot = globalRenderer.domElement.toDataURL('image/png'); entry.snapshot = snapshot;
}

/* ===== PDF Generation ===== */
generatePDFBtn.addEventListener('click',()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt',format:'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  let y=20;

  // HEADER
  doc.setFillColor(46,125,50);
  doc.rect(0,0,pageWidth,90,'F');
  if(logoDataURL) doc.addImage(logoDataURL,getImageTypeFromDataURL(logoDataURL),40,10,72,72);
  doc.setFontSize(16); doc.setTextColor(255,255,255);
  doc.text('Varshith Interior Solutions',130,30);
  doc.setFontSize(10);
  doc.text('NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106',130,45);
  doc.text('Phone: +91 9916511599, +91 8553608981',130,60);
  doc.text('Email: Varshithinteriorsolutions@gmail.com',130,75);

  y=100;
  const clientName = document.getElementById('clientName').value||'';
  const invoiceNumber = document.getElementById('invoiceNumber').value||'';
  const invoiceDate = document.getElementById('invoiceDate').value||'';
  doc.setFontSize(12); doc.setTextColor(0,0,0);
  doc.text(`Invoice Number: ${invoiceNumber}`,40,y);
  doc.text(`Date: ${invoiceDate}`,300,y);
  doc.text(`Client: ${clientName}`,40,y+20);
  y+=40;

  const tableBody=[];
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    const item=tr.querySelector('.item').value||'';
    const material=tr.querySelector('.material').value||'';
    const qty=tr.querySelector('.qty').value||0;
    const unitPrice=tr.querySelector('.unitPrice').value||0;
    const amount=tr.querySelector('.amount').value||0;
    tableBody.push([item,material,qty,unitPrice,amount]);
  });

  doc.autoTable({
    startY:y,
    head:[['Item','Material','Qty','Unit Price','Amount']],
    body:tableBody,
    theme:'grid',
    headStyles:{fillColor:[46,125,50],textColor:255},
    styles:{cellPadding:6,fontSize:10}
  });

  y = doc.lastAutoTable.finalY + 20;

  const total = parseFloat(totalCostEl.textContent)||0;
  const gstPercent = parseFloat(gstPercentEl.value)||0;
  const gstAmount = parseFloat(gstAmountEl.textContent)||0;
  const final = parseFloat(finalCostEl.textContent)||0;
  doc.text(`Total Cost: ${total.toFixed(2)}`,40,y);
  doc.text(`GST (${gstPercent}%): ${gstAmount.toFixed(2)}`,40,y+15);
  doc.text(`Final Cost: ${final.toFixed(2)}`,40,y+30);
  y+=50;

  const paymentNote = "Payment note: 50 PCT of the quoted amount has to be paid as advance, 30 PCT after completing 50 % of work and remaining 20 PCT after the completion of work.";
  doc.setFontSize(10);
  doc.text(paymentNote,40,y,{maxWidth:500});
  y+=50;

  // 2D → 3D Designs
  designs.forEach(d=>{
    if(y>700){ doc.addPage(); y=40; }
    const img = d.snapshot || d.dataURL;
    if(!img) return;
    doc.setFontSize(10);
    doc.text(d.name,40,y);
    y+=12;
    try{ doc.addImage(img,getImageTypeFromDataURL(img),40,y,150,100); }catch(e){ console.warn('Design embed failed',e);}
    y+=120;
  });

  doc.save(`Invoice_${invoiceNumber||Date.now()}.pdf`);
});

/* ===== JSON Export / Import ===== */
exportJsonBtn.addEventListener('click',()=>{
  const invoiceData={client:document.getElementById('clientName').value,
                     invoiceNumber:document.getElementById('invoiceNumber').value,
                     date:document.getElementById('invoiceDate').value,
                     gst:parseFloat(gstPercentEl.value)||0,
                     rows:[],designs:designs};
  invoiceTbody.querySelectorAll('tr').forEach(tr=>{
    invoiceData.rows.push({
      item:tr.querySelector('.item').value,
      material:tr.querySelector('.material').value,
      qty:tr.querySelector('.qty').value,
      unitPrice:tr.querySelector('.unitPrice').value
    });
  });
  const blob = new Blob([JSON.stringify(invoiceData,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='invoice.json'; a.click(); URL.revokeObjectURL(url);
});

importJsonBtn.addEventListener('click',()=>importJsonFile.click());
importJsonFile.addEventListener('change',ev=>{
  const f = ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = e=>{
    const data = JSON.parse(e.target.result);
    document.getElementById('clientName').value = data.client||'';
    document.getElementById('invoiceNumber').value = data.invoiceNumber||'';
    document.getElementById('invoiceDate').value = data.date||'';
    gstPercentEl.value = data.gst||18;
    invoiceTbody.innerHTML='';
    (data.rows||[]).forEach(r=>createRow(r.item,r.material,r.qty,r.unitPrice));
    designs = data.designs||[];
    renderDesignList();
    recalcTotals();
  };
  reader.readAsText(f);
});
