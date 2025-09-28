let scene, camera, renderer;
const canvas = document.getElementById("threeCanvas");
let wallMeshes = [];
let uploadedImage = null;

// Initialize Three.js Scene
function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThree();

// Upload 2D Image
document.getElementById("imageUpload").addEventListener("change", function(e){
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event){
    const img = new Image();
    img.onload = function(){
      uploadedImage = img;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Generate 3D Design
function generate3D(){
  if(!uploadedImage){
    alert("Please upload a 2D floor plan first.");
    return;
  }
  processImage(uploadedImage);
}

// Process Image and Create 3D Walls
function processImage(img){
  const canvasInput = document.getElementById("inputCanvas");
  const ctx = canvasInput.getContext("2d");
  canvasInput.width = img.width;
  canvasInput.height = img.height;
  ctx.drawImage(img, 0, 0);

  clearWalls();

  cv["onRuntimeInitialized"] = () => {
    let src = cv.imread("inputCanvas");
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, dst, 50, 150, 3, false);
    let lines = new cv.Mat();
    cv.HoughLinesP(dst, lines, 1, Math.PI / 180, 50, 50, 10);

    for(let i=0;i<lines.rows;++i){
      let line = lines.data32S.subarray(i*4, i*4+4);
      createWall3D(line[0], line[1], line[2], line[3], img.height);
    }

    src.delete(); dst.delete(); lines.delete();
  };
}

function clearWalls(){
  wallMeshes.forEach(wall => scene.remove(wall));
  wallMeshes = [];
}

function createWall3D(x1,y1,x2,y2,imgHeight){
  const scale = 0.05;
  const xMid = ((x1+x2)/2)*scale;
  const zMid = ((imgHeight - y1 + imgHeight - y2)/2)*scale;
  const dx = x2 - x1;
  const dz = y2 - y1;
  const length = Math.sqrt(dx*dx + dz*dz)*scale;
  const angle = Math.atan2(dz, dx);

  const wallGeometry = new THREE.BoxGeometry(length, 2, 0.2);
  const wallMaterial = new THREE.MeshStandardMaterial({color:0x3498db});
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(xMid, 1, zMid);
  wall.rotation.y = -angle;

  scene.add(wall);
  wallMeshes.push(wall);
}

// Invoice Functions
function addRow(){
  const tbody = document.getElementById("invoiceBody");
  const rowCount = tbody.rows.length+1;
  const row = tbody.insertRow();
  row.innerHTML = `<td>${rowCount}</td>
    <td><input type="text"></td>
    <td><input type="text"></td>
    <td><input type="number" class="price"></td>`;
}

function calculateTotal(){
  let total=0;
  document.querySelectorAll(".price").forEach(input => total+=parseFloat(input.value)||0);
  const gst = total*0.18;
  const final = total+gst;
  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("gstAmount").textContent = gst.toFixed
