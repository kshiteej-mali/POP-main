// Yasti Yantra 3D logic and Calculator
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('yasti-3d-container');
  if (!container) return;

  // --- 1. Three.js Setup ---
  if (typeof THREE === 'undefined') {
    console.error('Three.js library is not loaded');
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0502); // Deep rich black-orange
  
  const initialW = container.clientWidth || 500;
  const initialH = container.clientHeight || 420;

  const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.1, 1000);
  camera.position.set(30, 20, 50);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(initialW, initialH);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  let controls = null;
  if (typeof THREE.OrbitControls === 'function') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 5, 0);
  } else if (typeof OrbitControls === 'function') {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 5, 0);
  } else {
    console.warn('OrbitControls not found on THREE or global scope; proceeding with camera view.');
  }

  // Lighting (Fiery Vedic Sun & Amber Ambience)
  const ambientLight = new THREE.AmbientLight(0xffeedd, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xff7700, 1.2); // Vibrant Orange Sun
  dirLight.position.set(15, 30, 20);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xffa500, 0.6); // Warm Amber Backlight
  backLight.position.set(-15, 10, -15);
  scene.add(backLight);

  // --- 2. 3D Objects ---
  // Ground (Deep Black with Fiery Orange Grid Rings)
  const gridHelper = new THREE.PolarGridHelper(100, 16, 8, 64, 0xff5500, 0x331100);
  scene.add(gridHelper);

  const materialStand = new THREE.MeshStandardMaterial({ color: 0xcc5500, roughness: 0.3, metalness: 0.6 });
  const materialWood = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, metalness: 0.2 });
  const materialTarget = new THREE.MeshStandardMaterial({ color: 0xff6600, wireframe: true, transparent: true, opacity: 0.85 });

  // Stand
  const standMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 1, 16), materialStand);
  scene.add(standMesh);

  // Yasti Rod (pivot group)
  const pivotGroup = new THREE.Group();
  scene.add(pivotGroup);
  const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), materialWood);
  rodMesh.rotation.z = Math.PI / 2; // horizontal by default
  pivotGroup.add(rodMesh);

  // Target Object (Cone - Temple Shikhara/Pillar)
  const targetMesh = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 4), materialTarget);
  scene.add(targetMesh);

  // Sight Lines (Vibrant Orange & Yellow)
  const lineMatA = new THREE.LineBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.95 });
  const lineGeoA = new THREE.BufferGeometry();
  const lineMeshA = new THREE.Line(lineGeoA, lineMatA);
  scene.add(lineMeshA);

  const lineMatB = new THREE.LineBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.95 });
  const lineGeoB = new THREE.BufferGeometry();
  const lineMeshB = new THREE.Line(lineGeoB, lineMatB);
  scene.add(lineMeshB);

  // Handle Resize using ResizeObserver and window events
  function handleContainerResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(entries => {
      handleContainerResize();
    });
    resizeObserver.observe(container);
  }
  window.addEventListener('resize', handleContainerResize);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) handleContainerResize();
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
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
    modeABtn.className = "flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 bg-[#ff5500] text-black shadow-[0_0_10px_rgba(255,85,0,0.5)]";
    modeBBtn.className = "flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 text-orange-200/50 hover:bg-[#ff5500]/10 hover:text-[#ff8800]";
    panelA.classList.remove('hidden');
    panelA.classList.add('flex');
    panelB.classList.add('hidden');
    panelB.classList.remove('flex');
    lineMeshB.visible = false;
    updateCalculations();
  });

  modeBBtn.addEventListener('click', () => {
    currentMode = 'B';
    modeBBtn.className = "flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 bg-[#ff5500] text-black shadow-[0_0_10px_rgba(255,85,0,0.5)]";
    modeABtn.className = "flex-1 py-2 text-sm font-bold rounded-md transition-all duration-200 text-orange-200/50 hover:bg-[#ff5500]/10 hover:text-[#ff8800]";
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
        <div class="mb-2 text-orange-200/90">By Similar Triangles: Target Height = (D × (H / L)) + d</div>
        <div class="mb-2 text-[#ff8800]">= (${D} × (${H} / ${L})) + ${d_stand}</div>
        <div class="text-lg font-bold text-[#ffaa00]">= ${totalHeight.toFixed(2)} m</div>
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
          <div class="mb-2 text-orange-200/90">Target Height = [ B / ((L2/H2) - (L1/H1)) ] + d</div>
          <div class="mb-2 text-[#ff8800]">= [ ${B} / ((${L2}/${H2}) - (${L1}/${H1})) ] + ${d_stand}</div>
          <div class="mb-2 text-[#ff8800]">= [ ${B} / (${(L2/H2).toFixed(3)} - ${(L1/H1).toFixed(3)}) ] + ${d_stand}</div>
          <div class="text-lg font-bold text-[#ffaa00]">= ${totalHeight.toFixed(2)} m</div>
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
