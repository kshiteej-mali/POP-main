// Yasti Yantra 3D logic and Calculator
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('yasti-3d-container');
  if (!container) return;

  // --- 1. Three.js Setup ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617); // slate-950
  
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(30, 20, 50);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 5, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0x2dd4bf, 0.8); // teal-400
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xa855f7, 0.5); // purple-500
  backLight.position.set(-10, 10, -10);
  scene.add(backLight);

  // --- 2. 3D Objects ---
  // Ground
  const gridHelper = new THREE.PolarGridHelper(100, 16, 8, 64, 0x1e293b, 0x0f172a);
  scene.add(gridHelper);

  const materialStand = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 });
  const materialWood = new THREE.MeshStandardMaterial({ color: 0xccb89e, roughness: 0.9, metalness: 0.1 });
  const materialTarget = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.6 });

  // Stand
  const standMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 1, 16), materialStand);
  scene.add(standMesh);

  // Yasti Rod (pivot group)
  const pivotGroup = new THREE.Group();
  scene.add(pivotGroup);
  const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 8), materialWood);
  rodMesh.rotation.z = Math.PI / 2; // horizontal by default
  pivotGroup.add(rodMesh);

  // Target Object (Cone)
  const targetMesh = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 4), materialTarget);
  scene.add(targetMesh);

  // Sight Lines
  const lineMatA = new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.8 });
  const lineGeoA = new THREE.BufferGeometry();
  const lineMeshA = new THREE.Line(lineGeoA, lineMatA);
  scene.add(lineMeshA);

  const lineMatB = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 });
  const lineGeoB = new THREE.BufferGeometry();
  const lineMeshB = new THREE.Line(lineGeoB, lineMatB);
  scene.add(lineMeshB);

  // Handle Resize using ResizeObserver to handle hidden-to-visible transitions
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }
  });
  resizeObserver.observe(container);

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // --- 3. Calculator UI Logic ---
  const modeABtn = document.getElementById('mode-a-btn');
  const modeBBtn = document.getElementById('mode-b-btn');
  const panelA = document.getElementById('mode-a-panel');
  const panelB = document.getElementById('mode-b-panel');
  const mathA = document.getElementById('mode-a-math');
  const mathB = document.getElementById('mode-b-math');

  let currentMode = 'A';

  modeABtn.addEventListener('click', () => {
    currentMode = 'A';
    modeABtn.className = "px-4 py-2 font-bold text-teal-400 border-b-2 border-teal-400 transition-colors";
    modeBBtn.className = "px-4 py-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-teal-300 transition-colors";
    panelA.classList.remove('hidden');
    panelA.classList.add('flex');
    panelB.classList.add('hidden');
    panelB.classList.remove('flex');
    lineMeshB.visible = false;
    updateCalculations();
  });

  modeBBtn.addEventListener('click', () => {
    currentMode = 'B';
    modeBBtn.className = "px-4 py-2 font-bold text-purple-400 border-b-2 border-purple-400 transition-colors";
    modeABtn.className = "px-4 py-2 font-bold text-slate-400 border-b-2 border-transparent hover:text-purple-300 transition-colors";
    panelB.classList.remove('hidden');
    panelB.classList.add('flex');
    panelA.classList.add('hidden');
    panelA.classList.remove('flex');
    lineMeshB.visible = true;
    updateCalculations();
  });

  // Input Elements Mode A
  const inputD = document.getElementById('yasti-d');
  const inputStandA = document.getElementById('yasti-stand');
  const inputHA = document.getElementById('yasti-h');
  const inputLA = document.getElementById('yasti-l');

  // Input Elements Mode B
  const inputB = document.getElementById('yasti-b');
  const inputH1 = document.getElementById('yasti-h1');
  const inputL1 = document.getElementById('yasti-l1');
  const inputH2 = document.getElementById('yasti-h2');
  const inputL2 = document.getElementById('yasti-l2');

  function bindInput(inputEl, valElId) {
    const valEl = document.getElementById(valElId);
    inputEl.addEventListener('input', () => {
      valEl.textContent = inputEl.value;
      updateCalculations();
    });
  }

  bindInput(inputD, 'yasti-d-val');
  bindInput(inputStandA, 'yasti-stand-val');
  bindInput(inputHA, 'yasti-h-val');
  bindInput(inputLA, 'yasti-l-val');

  bindInput(inputB, 'yasti-b-val');
  bindInput(inputH1, 'yasti-h1-val');
  bindInput(inputL1, 'yasti-l1-val');
  bindInput(inputH2, 'yasti-h2-val');
  bindInput(inputL2, 'yasti-l2-val');

  function updateCalculations() {
    const d_stand = parseFloat(inputStandA.value); // Use same stand height for both (simplify)
    
    // Scale down factors for 3D visual so things don't get too crazy
    const visualScale = 0.2; 
    
    standMesh.scale.set(1, d_stand * 2, 1); // visually taller
    standMesh.position.y = d_stand;
    pivotGroup.position.set(0, d_stand * 2, 0);

    if (currentMode === 'A') {
      const D = parseFloat(inputD.value);
      const H = parseFloat(inputHA.value);
      const L = parseFloat(inputLA.value);
      
      const totalHeight = (D * (H / L)) + d_stand;
      
      mathA.innerHTML = `
        <div class="mb-2 text-slate-300">By Similar Triangles: Target Height = (D × (H / L)) + d</div>
        <div class="mb-2 text-teal-400">= (${D} × (${H} / ${L})) + ${d_stand}</div>
        <div class="text-lg font-bold text-teal-300">= ${totalHeight.toFixed(2)} m</div>
      `;

      // Update 3D visually
      targetMesh.scale.set(totalHeight * 0.1, totalHeight * visualScale, totalHeight * 0.1);
      targetMesh.position.set(D * visualScale, (totalHeight * visualScale) / 2, 0);
      
      const angle = Math.atan2(H, L);
      pivotGroup.rotation.z = angle;

      const eyePos = new THREE.Vector3(0, d_stand * 2, 0);
      const targetPos = new THREE.Vector3(D * visualScale, totalHeight * visualScale, 0);
      lineGeoA.setFromPoints([eyePos, targetPos]);
      
    } else {
      const B = parseFloat(inputB.value);
      const H1 = parseFloat(inputH1.value);
      const L1 = parseFloat(inputL1.value);
      const H2 = parseFloat(inputH2.value);
      const L2 = parseFloat(inputL2.value);

      // Denominator
      const denom = (L2 / H2) - (L1 / H1);
      let totalHeight = 0;
      let valid = false;

      if (Math.abs(denom) > 0.001) {
        totalHeight = (B / denom) + d_stand;
        valid = totalHeight > d_stand; // ensure it's physically meaningful (above eye level)
      }

      if (valid) {
        mathB.innerHTML = `
          <div class="mb-2 text-slate-300">Target Height = [ B / ((L2/H2) - (L1/H1)) ] + d</div>
          <div class="mb-2 text-purple-400">= [ ${B} / ((${L2}/${H2}) - (${L1}/${H1})) ] + ${d_stand}</div>
          <div class="mb-2 text-purple-400">= [ ${B} / (${(L2/H2).toFixed(3)} - ${(L1/H1).toFixed(3)}) ] + ${d_stand}</div>
          <div class="text-lg font-bold text-purple-300">= ${totalHeight.toFixed(2)} m</div>
        `;

        // We can deduce D (distance to first point) based on height
        const D1 = (totalHeight - d_stand) * (L1 / H1);
        const D2 = D1 + B;

        targetMesh.scale.set(totalHeight * 0.1, totalHeight * visualScale, totalHeight * 0.1);
        targetMesh.position.set(D1 * visualScale, (totalHeight * visualScale) / 2, 0);

        const eyePos1 = new THREE.Vector3(0, d_stand * 2, 0);
        const targetPos = new THREE.Vector3(D1 * visualScale, totalHeight * visualScale, 0);
        
        const eyePos2 = new THREE.Vector3(-B * visualScale, d_stand * 2, 0); // shift backward by B

        lineGeoA.setFromPoints([eyePos1, targetPos]);
        lineGeoB.setFromPoints([eyePos2, targetPos]);
        
        // Pivot angle reflects the first sighting
        pivotGroup.rotation.z = Math.atan2(H1, L1);
      } else {
        mathB.innerHTML = `<div class="text-red-400">Invalid inputs: The geometric lines do not intersect sensibly (L2/H2 must be > L1/H1).</div>`;
        lineGeoA.setFromPoints([]);
        lineGeoB.setFromPoints([]);
      }
    }
  }

  // Initial trigger
  updateCalculations();
});
