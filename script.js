const designList = document.getElementById("design-list");
const addDesignInput = document.getElementById("add-design");
const note = document.getElementById("note");
const generatePDFBtn = document.getElementById("generate-pdf");
let designs = [];

// Add designer files
addDesignInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const design = { name: file.name, src: reader.result };
      designs.push(design);
      renderDesigns();
    };
    reader.readAsDataURL(file);
  });
});

// Render designer list
function renderDesigns() {
  designList.innerHTML = "";
  designs.forEach((d, i) => {
    const div = document.createElement("div");
    div.className = "design-item";
    div.innerHTML = `
      <div class="design-info">
        <strong>${d.name}</strong>
        <div class="design-preview" id="preview-${i}"></div>
      </div>
      <div class="design-controls">
        <button onclick="removeDesign(${i})">Delete</button>
      </div>
    `;
    designList.appendChild(div);
    render3DPreview(`preview-${i}`, d);
  });
}

// Remove designer
function removeDesign(index) {
  designs.splice(index, 1);
  renderDesigns();
}

// Render placeholder 3D preview using Three.js
function render3DPreview(containerId, file) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  camera.position.z = 2;

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

// PDF generation
generatePDFBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Invoice", 14, 20);
  doc.setFontSize(12);
  doc.text(note.value, 14, 30);

  designs.forEach((d, i) => {
    doc.text(`${i+1}. ${d.name}`, 14, 40 + i*10);
  });

  doc.save("invoice.pdf");
});
