let items = [];

function addItem(name='', desc='', qty=1, price=0) {
    items.push({name, desc, qty, price});
    renderTable();
}

function renderTable() {
    const tbody = document.querySelector('#invoiceTable tbody');
    tbody.innerHTML = '';
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input value="${item.name}" onchange="updateItem(${index}, 'name', this.value)"></td>
            <td><input value="${item.desc}" onchange="updateItem(${index}, 'desc', this.value)"></td>
            <td><input type="number" value="${item.qty}" onchange="updateItem(${index}, 'qty', this.value)"></td>
            <td><input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)"></td>
            <td>${(item.qty * item.price).toFixed(2)}</td>
            <td><button onclick="deleteItem(${index})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
    updateTotals();
}

function updateItem(index, key, value) {
    items[index][key] = key === 'qty' || key === 'price' ? parseFloat(value) : value;
    renderTable();
}

function deleteItem(index) {
    items.splice(index,1);
    renderTable();
}

function updateTotals() {
    let total = items.reduce((sum, i)=> sum + i.qty*i.price,0);
    let gst = total*0.18;
    let finalAmount = total+gst;
    document.getElementById('totalAmount').innerText = total.toFixed(2);
    document.getElementById('gstAmount').innerText = gst.toFixed(2);
    document.getElementById('finalAmount').innerText = finalAmount.toFixed(2);
}

// Upload existing invoice
function uploadInvoice() {
    const file = document.getElementById('invoiceUpload').files[0];
    if(!file) return alert('Select a file!');
    const reader = new FileReader();
    reader.onload = function(e){
        const data = JSON.parse(e.target.result);
        document.getElementById('clientName').value = data.clientName || '';
        document.getElementById('invoiceNumber').value = data.invoiceNumber || '';
        document.getElementById('invoiceDate').value = data.invoiceDate || '';
        items = data.items || [];
        renderTable();
    }
    reader.readAsText(file);
}

// Preview Invoice
function previewInvoice() {
    const preview = document.getElementById('invoicePreview');
    preview.innerHTML = generateInvoiceHTML();
    preview.style.display = 'block';
}

// Download PDF
function downloadInvoice() {
    const invoiceHTML = generateInvoiceHTML();
    const doc = new jspdf.jsPDF();
    html2canvas(document.createElement('div')).then(()=>{}); // optional
    doc.html(invoiceHTML, {
        callback: function (doc) {
            doc.save(`Invoice_${document.getElementById('invoiceNumber').value || Date.now()}.pdf`);
        },
        x: 10,
        y: 10,
        html2canvas: { scale: 0.5 }
    });
}

// Generate Invoice HTML
function generateInvoiceHTML() {
    let html = `
        <div style="text-align:center; font-family: Arial;">
            <h1>Varshith Interior Solution</h1>
            <p>Address: NO 39 BRN Ashish Layout Near Sri Thimmaraya Swami Gudi Anekal - 562106</p>
            <p>Phone: +91 9916511599 & +91 8553608981</p>
            <hr/>
            <p>Client Name: ${document.getElementById('clientName').value}</p>
            <p>Invoice Number: ${document.getElementById('invoiceNumber').value}</p>
            <p>Date: ${document.getElementById('invoiceDate').value}</p>
            <table border="1" style="width:100%; border-collapse: collapse;">
                <tr style="background-color:#3498db; color:white;">
                    <th>Item</th><th>Description</th><th>Qty</th><th>Price</th><th>Total</th>
                </tr>
    `;
    items.forEach(item=>{
        html+=`<tr>
            <td>${item.name}</td>
            <td>${item.desc}</td>
            <td>${item.qty}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${(item.qty*item.price).toFixed(2)}</td>
        </tr>`;
    });
    html+=`</table>
        <p>Total: ${document.getElementById('totalAmount').innerText}</p>
        <p>GST: ${document.getElementById('gstAmount').innerText}</p>
        <p>Final Amount: ${document.getElementById('finalAmount').innerText}</p>
    </div>`;
    return html;
}

// 2D → 3D Design Generator
function generate3D() {
    const file = document.getElementById('design2D').files[0];
    if(!file){ alert('Upload a 2D Design image first'); return; }
    const reader = new FileReader();
    reader.onload = function(e){
        const url = e.target.result;
        const container = document.getElementById('designPreview');
        container.innerHTML = '';

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const light = new THREE.DirectionalLight(0xffffff,1);
        light.position.set(5,5,5).normalize();
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(url, function(texture){
            const geometry = new THREE.PlaneGeometry(4,3);
            const material = new THREE.MeshStandardMaterial({map:texture});
            const plane = new THREE.Mesh(geometry, material);
            scene.add(plane);
            animate();
        });

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene,camera);
        }
    }
    reader.readAsDataURL(file);
}
