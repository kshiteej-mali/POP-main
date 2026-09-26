
class SplitFlapText {
  constructor(container, options = {}) {
    this.container = container;
    this.flipDuration = options.flipDuration || 280;
    this.stagger = options.stagger || 30;
    this.currentText = "";
  }

  setText(newText) {
    const textStr = String(newText);
    if (this.currentText === textStr) return;

    const chars = textStr.split('');
    const prevChars = (this.currentText || '').split('');
    this.currentText = textStr;

    let tiles = this.container.querySelectorAll('.split-flap-tile');
    if (tiles.length !== chars.length) {
      this.container.innerHTML = '';
      chars.forEach((c) => {
        const tile = document.createElement('div');
        tile.className = `split-flap-tile ${c === '.' ? 'char-dot' : ''} ${c === ' ' ? 'char-space' : ''}`;
        tile.dataset.char = c;
        tile.innerHTML = `
          <div class="flap top"><span class="char">${c}</span></div>
          <div class="flap bottom"><span class="char">${c}</span></div>
          <div class="flap leaf"><span class="char">${c}</span></div>
          <div class="flap-divider"></div>
        `;
        this.container.appendChild(tile);
      });
      return;
    }

    tiles.forEach((tile, i) => {
      const targetChar = chars[i];
      const oldChar = tile.dataset.char || prevChars[i] || ' ';
      tile.className = `split-flap-tile ${targetChar === '.' ? 'char-dot' : ''} ${targetChar === ' ' ? 'char-space' : ''}`;

      if (oldChar !== targetChar) {
        setTimeout(() => {
          this.animateFlip(tile, oldChar, targetChar);
        }, i * this.stagger);
      }
    });
  }

  animateFlip(tile, fromChar, toChar) {
    tile.dataset.char = toChar;
    const topChar = tile.querySelector('.flap.top .char');
    const bottomChar = tile.querySelector('.flap.bottom .char');
    const leaf = tile.querySelector('.flap.leaf');
    const leafChar = leaf.querySelector('.char');

    topChar.textContent = toChar;
    bottomChar.textContent = fromChar;
    leafChar.textContent = fromChar;

    tile.classList.remove('flipping');
    void tile.offsetWidth;
    tile.classList.add('flipping');

    setTimeout(() => {
      bottomChar.textContent = toChar;
      leafChar.textContent = toChar;
      tile.classList.remove('flipping');
    }, this.flipDuration);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');
  let isNavigating = false;

  function triggerMathRender() {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      } catch(e) {}
    }
  }

  function navigateToSection(targetId) {
    if (isNavigating) return;
    const currentActive = document.querySelector('.section.active');
    const targetSection = document.getElementById(targetId);
    if (!targetSection || currentActive === targetSection) return;

    isNavigating = true;

    if (targetId === 'iks') {
      document.body.classList.add('iks-theme');
    } else {
      document.body.classList.remove('iks-theme');
    }

    navButtons.forEach(b => {
      if (b.dataset.target === targetId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (currentActive) {
      currentActive.classList.add('morph-out');
      setTimeout(() => {
        currentActive.classList.remove('active', 'morph-out');
        targetSection.classList.add('active', 'morph-in');
        
        triggerMathRender();
        playInstrumentIntro(targetId);

        setTimeout(() => {
          targetSection.classList.remove('morph-in');
          isNavigating = false;
        }, 360);
      }, 200);
    } else {
      targetSection.classList.add('active', 'morph-in');
      triggerMathRender();
      playInstrumentIntro(targetId);
      setTimeout(() => {
        targetSection.classList.remove('morph-in');
        isNavigating = false;
      }, 360);
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToSection(btn.dataset.target);
    });
  });

  document.querySelectorAll('.card-nav').forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof handleBounceCardClick === 'function') {
        handleBounceCardClick(card, () => {
          navigateToSection(card.dataset.target);
        });
      } else {
        navigateToSection(card.dataset.target);
      }
    });
  });

  const logo = document.querySelector('.logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      navigateToSection('home');
    });
  }

  initVernier();
  initScrew();
  initSpherometer();
  initScannerBackground();
  initTechText();
  initStrokeTextIntros();
  initBounceCardsNav();

  triggerMathRender();
  setTimeout(triggerMathRender, 300);
  setTimeout(triggerMathRender, 800);
});
const VernierEngine = {
  LEAST_COUNT_MM: 0.1,

  calculate(msr, vsd, zeroError = 0, leastCount = 0.1) {
    const validMSR = Math.max(0, Math.floor(Number(msr) || 0));
    const validVSD = Math.max(0, Math.min(10, Math.round(Number(vsd) || 0)));
    const validError = Number(zeroError) || 0;
    
    const vsr = Math.round((validVSD * leastCount) * 1000) / 1000;
    const observed = Math.round((validMSR + vsr) * 1000) / 1000;
    const corrected = Math.round((observed - validError) * 1000) / 1000;

    return {
      msr: validMSR,
      vsd: validVSD,
      leastCount,
      vsr,
      observed,
      zeroError: validError,
      corrected,
      steps: {
        vsrCalc: `${validVSD} × ${leastCount.toFixed(2)} mm = ${vsr.toFixed(2)} mm`,
        observedCalc: `${validMSR.toFixed(1)} + (${validVSD} × ${leastCount.toFixed(2)}) = ${observed.toFixed(2)} mm`,
        correctedCalc: `${observed.toFixed(2)} - (${validError >= 0 ? '+' : ''}${validError.toFixed(2)}) = ${corrected.toFixed(2)} mm`
      }
    };
  },

  simulateMeasurement(trueThicknessMm, zeroErrorMm = 0) {
    const targetObserved = Math.max(0, Math.round((trueThicknessMm + zeroErrorMm) * 10) / 10);
    const msr = Math.floor(targetObserved);
    const vsd = Math.round((targetObserved - msr) * 10);
    const calc = this.calculate(msr, vsd, zeroErrorMm, this.LEAST_COUNT_MM);
    const isTrue = Math.abs(calc.corrected - trueThicknessMm) < 0.001;
    return {
      trueThicknessMm,
      zeroErrorMm,
      ...calc,
      isTrue
    };
  }
};

const ScrewEngine = {
  DEFAULT_PITCH: 1.0,
  DEFAULT_DIVISIONS: 100,

  calculateLeastCount(pitch = 1.0, divisions = 100) {
    const p = Number(pitch) > 0 ? Number(pitch) : 1.0;
    const d = Math.max(1, Math.round(Number(divisions) || 100));
    return Math.round((p / d) * 10000) / 10000;
  },

  calculate(msr, csr, zeroError = 0, pitch = 1.0, divisions = 100) {
    const validPitch = Number(pitch) > 0 ? Number(pitch) : 1.0;
    const validDivs = Math.max(1, Math.round(Number(divisions) || 100));
    const lc = this.calculateLeastCount(validPitch, validDivs);

    const validMSR = Math.max(0, Number(msr) || 0);
    const validCSR = Math.max(0, Math.round(Number(csr) || 0));
    const validError = Number(zeroError) || 0;

    const csrMm = Math.round((validCSR * lc) * 10000) / 10000;
    const observed = Math.round((validMSR + csrMm) * 10000) / 10000;
    const corrected = Math.round((observed - validError) * 10000) / 10000;

    return {
      pitch: validPitch,
      divisions: validDivs,
      leastCount: lc,
      msr: validMSR,
      csr: validCSR,
      csrMm,
      observed,
      zeroError: validError,
      corrected,
      steps: {
        lcCalc: `LC = Pitch / Circular Divisions = ${validPitch.toFixed(2)} mm / ${validDivs} = ${lc.toFixed(4)} mm`,
        csrCalc: `CSR = ${validCSR} × ${lc.toFixed(4)} mm = ${csrMm.toFixed(3)} mm`,
        observedCalc: `Observed = ${validMSR.toFixed(2)} mm + ${csrMm.toFixed(3)} mm = ${observed.toFixed(3)} mm`,
        correctedCalc: `Corrected = ${observed.toFixed(3)} mm - (${validError >= 0 ? '+' : ''}${validError.toFixed(3)} mm) = ${corrected.toFixed(3)} mm`
      }
    };
  },

  simulateMeasurement(trueThicknessMm, zeroErrorMm = 0, pitch = 1.0, divisions = 100) {
    const lc = this.calculateLeastCount(pitch, divisions);
    const targetObserved = Math.max(0, Math.round((trueThicknessMm + zeroErrorMm) * (1 / lc)) * lc);
    const msr = Math.floor(targetObserved / pitch) * pitch;
    const csr = Math.round((targetObserved - msr) / lc) % divisions;
    const calc = this.calculate(msr, csr, zeroErrorMm, pitch, divisions);
    const isTrue = Math.abs(calc.corrected - trueThicknessMm) < 0.001;
    return {
      trueThicknessMm,
      zeroErrorMm,
      ...calc,
      isTrue
    };
  }
};

const SpherometerEngine = {
  DEFAULT_PITCH: 1.0,
  DEFAULT_DIVISIONS: 100,

  calculateLeastCount(pitch = 1.0, divisions = 100) {
    const p = Number(pitch) > 0 ? Number(pitch) : 1.0;
    const d = Math.max(1, Math.round(Number(divisions) || 100));
    return Math.round((p / d) * 10000) / 10000;
  },

  calculate(msr, csr, zeroError = 0, pitch = 1.0, divisions = 100, legDistance = 50) {
    const validPitch = Number(pitch) > 0 ? Number(pitch) : 1.0;
    const validDivs = Math.max(1, Math.round(Number(divisions) || 100));
    const lc = this.calculateLeastCount(validPitch, validDivs);

    const validMSR = Number(msr) || 0;
    const validCSR = Math.max(0, Math.round(Number(csr) || 0));
    const validError = Number(zeroError) || 0;
    const validL = Math.max(1, Number(legDistance) || 50);

    const csrMm = Math.round((validCSR * lc) * 10000) / 10000;
    const observedH = Math.round((validMSR + csrMm) * 10000) / 10000;
    const correctedH = Math.round((observedH - validError) * 10000) / 10000;

    let radiusOfCurvature = Infinity;
    let rCalc = "R = ∞ (Flat Surface, h = 0)";
    if (Math.abs(correctedH) > 0.0001) {
      const hAbs = Math.abs(correctedH);
      radiusOfCurvature = Math.round(((validL * validL) / (6 * hAbs) + hAbs / 2) * 100) / 100;
      rCalc = `R = (${validL}² / (6 × ${hAbs.toFixed(2)})) + (${hAbs.toFixed(2)} / 2) = ${radiusOfCurvature.toFixed(2)} mm`;
    }

    return {
      pitch: validPitch,
      divisions: validDivs,
      leastCount: lc,
      msr: validMSR,
      csr: validCSR,
      csrMm,
      observedH,
      zeroError: validError,
      correctedH,
      legDistance: validL,
      radiusOfCurvature,
      steps: {
        lcCalc: `LC = Pitch / Circular Divisions = ${validPitch.toFixed(2)} mm / ${validDivs} = ${lc.toFixed(4)} mm`,
        csrCalc: `CSR = ${validCSR} × ${lc.toFixed(4)} mm = ${csrMm.toFixed(3)} mm`,
        observedCalc: `Observed (h) = ${validMSR.toFixed(2)} mm + ${csrMm.toFixed(3)} mm = ${observedH.toFixed(3)} mm`,
        correctedCalc: `Corrected (h) = ${observedH.toFixed(3)} mm - (${validError >= 0 ? '+' : ''}${validError.toFixed(3)} mm) = ${correctedH.toFixed(3)} mm`,
        rCalc
      }
    };
  },

  simulateMeasurement(trueHeightMm, zeroErrorMm = 0, legDistance = 50, pitch = 1.0, divisions = 100) {
    const lc = this.calculateLeastCount(pitch, divisions);
    const targetObserved = Math.round((trueHeightMm + zeroErrorMm) * (1 / lc)) * lc;
    const msr = Math.floor(targetObserved / pitch) * pitch;
    const csr = Math.round((targetObserved - msr) / lc) % divisions;
    const calc = this.calculate(msr, csr, zeroErrorMm, pitch, divisions, legDistance);
    const isTrue = Math.abs(calc.correctedH - trueHeightMm) < 0.001;
    return {
      trueHeightMm,
      zeroErrorMm,
      ...calc,
      isTrue
    };
  }
};

function initVernier() {
  const mainTicksContainer = document.getElementById('main-ticks');
  const vernierTicksContainer = document.getElementById('vernier-ticks');
  const slider = document.getElementById('vernier-slider');
  const depthBlade = document.getElementById('depth-blade');
  const modeBtn = document.getElementById('vernier-mode-btn');
  const svg = document.getElementById('vernier-svg');
  const caliperAssembly = document.getElementById('caliper-assembly');
  const depthBeaker = document.getElementById('depth-beaker');
  
  const valInput = document.getElementById('vernier-val');
  const errorInput = document.getElementById('vernier-error');
  const msrInput = document.getElementById('vernier-msr-input');
  const vsdInput = document.getElementById('vernier-vsd-input');
  const sensitivitySelect = document.getElementById('vernier-sensitivity');
  const stepDecBtn = document.getElementById('vernier-step-dec');
  const stepIncBtn = document.getElementById('vernier-step-inc');
  const calcBtn = document.getElementById('vernier-calc-btn');
  const resetBtn = document.getElementById('vernier-reset-btn');

  const msrSpan = document.getElementById('vernier-msr');
  const vsdDisplay = document.getElementById('vernier-vsd-display');
  const vsrSpan = document.getElementById('vernier-vsr');
  const observedSpan = document.getElementById('vernier-observed');
  const errorDisplay = document.getElementById('vernier-error-display');
  const correctedSpan = document.getElementById('vernier-corrected');
  const stepsContent = document.getElementById('vernier-steps-content');
  const readoutBox = document.getElementById('vernier-readout-box');
  const vernierFlapEl = document.getElementById('vernier-corrected-flap');
  const vernierFlap = vernierFlapEl ? new SplitFlapText(vernierFlapEl) : null;

  mainTicksContainer.innerHTML = '';
  for (let i = 0; i <= 60; i++) {
    const x = 150 + i * 10;
    const isMajor = i % 10 === 0;
    const isHalf = i % 5 === 0 && !isMajor;
    const height = isMajor ? 16 : (isHalf ? 11 : 7);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', 100);
    line.setAttribute('x2', x);
    line.setAttribute('y2', 100 - height);
    line.setAttribute('stroke', '#2c2c2e');
    line.setAttribute('stroke-width', isMajor ? '2' : '1');
    mainTicksContainer.appendChild(line);
    if (isMajor) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', 80);
      text.setAttribute('fill', '#1c1c1e');
      text.setAttribute('font-size', '11');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = i / 10;
      mainTicksContainer.appendChild(text);
    }
  }

  vernierTicksContainer.innerHTML = '';
  for (let i = 0; i <= 10; i++) {
    const x = 150 + i * 9;
    const isMajor = i % 5 === 0;
    const height = isMajor ? 12 : 7;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', 100);
    line.setAttribute('x2', x);
    line.setAttribute('y2', 100 + height);
    line.setAttribute('stroke', '#1c1c1e');
    line.setAttribute('stroke-width', '1.5');
    vernierTicksContainer.appendChild(line);
    if (isMajor) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', 124);
      text.setAttribute('fill', '#1c1c1e');
      text.setAttribute('font-size', '9');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = i;
      vernierTicksContainer.appendChild(text);
    }
  }

  let activeTrigger = 'slider';
  let activeObj = 'none';

  function update() {
    let rawVal = parseFloat(valInput.value) || 0;
    const zeroError = parseFloat(errorInput.value) || 0;

    let msr = 0;
    let vsd = 0;

    if (activeTrigger === 'inputs') {
      msr = parseInt(msrInput.value) || 0;
      vsd = parseInt(vsdInput.value) || 0;
      const observedVal = msr + vsd * VernierEngine.LEAST_COUNT_MM;
      rawVal = Math.max(0, Math.min(60, Math.round((observedVal - zeroError) * 10) / 10));
      valInput.value = rawVal;
    } else {
      const observedVal = Math.max(0, Math.round((rawVal + zeroError) * 10) / 10);
      msr = Math.floor(observedVal);
      vsd = Math.round((observedVal - msr) * 10);
      msrInput.value = msr;
      vsdInput.value = vsd;
    }

    const sliderPosMm = (activeTrigger === 'inputs')
      ? (msr + vsd * VernierEngine.LEAST_COUNT_MM)
      : (rawVal + zeroError);
    slider.setAttribute('transform', `translate(${sliderPosMm * 10}, 0)`);
    vernierTicksContainer.removeAttribute('transform');

    const result = VernierEngine.calculate(msr, vsd, zeroError, VernierEngine.LEAST_COUNT_MM);

    msrSpan.textContent = `${result.msr.toFixed(1)} mm`;
    if (vsdDisplay) vsdDisplay.textContent = `${result.vsd}`;
    vsrSpan.textContent = `${result.vsr.toFixed(2)} mm`;
    observedSpan.textContent = `${result.observed.toFixed(2)} mm`;
    if (errorDisplay) {
      const sign = result.zeroError > 0 ? '+' : '';
      errorDisplay.textContent = `${sign}${result.zeroError.toFixed(2)} mm`;
    }
    correctedSpan.textContent = `${result.corrected.toFixed(2)} mm`;

    if (vernierFlap) {
      vernierFlap.setText(`${result.corrected.toFixed(1)} mm`);
    }

    let isMatch = false;
    let expectedDim = null;
    if (activeObj === 'cylOut') expectedDim = 24.0;
    if (activeObj === 'cylIn') expectedDim = 16.0;
    if (activeObj === 'rect') expectedDim = 42.5;
    if (activeObj === 'sq') expectedDim = 30.0;
    if (activeObj === 'depthJar') expectedDim = 28.0;

    if (expectedDim !== null) {
      const diff = Math.abs(result.corrected - expectedDim);
      if (diff < 0.05) {
        isMatch = true;
      }
    } else {
      isMatch = true;
    }


    if (readoutBox) {
      if (isMatch && activeObj !== 'none') {
        readoutBox.style.borderColor = 'var(--accent)';
        readoutBox.style.boxShadow = '0 0 15px rgba(254, 198, 1, 0.6)';
      } else {
        readoutBox.style.borderColor = '';
        readoutBox.style.boxShadow = '';
      }
    }
  }

  valInput.addEventListener('input', () => {
    activeTrigger = 'slider';
    update();
  });

  errorInput.addEventListener('input', () => {
    activeTrigger = 'slider';
    update();
  });

  msrInput.addEventListener('input', () => {
    activeTrigger = 'inputs';
    update();
  });

  vsdInput.addEventListener('input', () => {
    activeTrigger = 'inputs';
    update();
  });

  if (stepDecBtn) {
    stepDecBtn.addEventListener('click', () => {
      activeTrigger = 'slider';
      let curr = parseFloat(valInput.value) || 0;
      valInput.value = Math.max(0, Math.round((curr - 0.1) * 10) / 10);
      update();
    });
  }

  if (stepIncBtn) {
    stepIncBtn.addEventListener('click', () => {
      activeTrigger = 'slider';
      let curr = parseFloat(valInput.value) || 0;
      valInput.value = Math.min(60, Math.round((curr + 0.1) * 10) / 10);
      update();
    });
  }

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      update();
      if (readoutBox) {
        readoutBox.style.animation = 'none';
        void readoutBox.offsetWidth;
        readoutBox.style.animation = 'fadeIn 0.3s ease';
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeTrigger = 'slider';
      activeObj = 'none';
      valInput.value = 10;
      errorInput.value = 0;
      msrInput.value = 10;
      vsdInput.value = 0;
      if (sensitivitySelect) sensitivitySelect.value = '1.0';
      selectObject('none', 0, 'Drag the slider or adjust inputs to measure freely.');
      update();
    });
  }

  let mode = 'jaw';
  let zoomLevel = 1.0;
  const vernierViewport = document.getElementById('vernier-viewport');
  const zoomInBtn = document.getElementById('vernier-zoom-in');
  const zoomOutBtn = document.getElementById('vernier-zoom-out');
  let isPanning = false;
  let startX = 0, startY = 0;
  let panX = 0, panY = 0;
  let currentPanX = 0, currentPanY = 0;

  function applyZoom() {
    const scale = 1 / zoomLevel;
    const px = panX + currentPanX;
    const py = panY + currentPanY;
    if (mode === 'jaw') {
      vernierViewport.style.transform = `scale(${scale}) translate(${px}px, ${py}px)`;
    } else {
      const depthFitScale = scale * 0.48;
      vernierViewport.style.transform = `scale(${depthFitScale}) translate(${px}px, ${-90 + py}px)`;
    }
  }

  zoomInBtn.addEventListener('click', () => {
    zoomLevel = Math.max(0.4, zoomLevel - 0.1);
    applyZoom();
  });
  zoomOutBtn.addEventListener('click', () => {
    zoomLevel = Math.min(2.0, zoomLevel + 0.1);
    applyZoom();
  });

  function startPan(clientX, clientY) {
    isPanning = true;
    startX = clientX;
    startY = clientY;
    currentPanX = 0;
    currentPanY = 0;
    svg.style.cursor = 'grabbing';
  }

  function movePan(clientX, clientY) {
    if (!isPanning) return;
    currentPanX = (clientX - startX) * zoomLevel;
    currentPanY = (clientY - startY) * zoomLevel;
    applyZoom();
  }

  function endPan() {
    if (!isPanning) return;
    isPanning = false;
    panX += currentPanX;
    panY += currentPanY;
    currentPanX = 0;
    currentPanY = 0;
    svg.style.cursor = 'grab';
  }

  let isDraggingSlider = false;
  let dragStartClientX = 0;
  let dragStartVal = 0;

  function startDragSlider(clientX) {
    isDraggingSlider = true;
    activeTrigger = 'slider';
    dragStartClientX = clientX;
    dragStartVal = parseFloat(valInput.value) || 0;
    slider.style.transition = 'none';
    slider.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function moveDragSlider(clientX) {
    if (!isDraggingSlider) return;
    const sensitivity = 1.0; // Default balanced sensitivity
    
    const svgRect = svg.getBoundingClientRect();
    const svgViewWidth = 900;
    const currentScale = (mode === 'depth' ? (1 / zoomLevel) * 0.48 : (1 / zoomLevel));
    const pixelsPerSvgUnit = (svgRect.width / svgViewWidth) * currentScale;
    const pixelsPerMm = pixelsPerSvgUnit * 10;

    const deltaPixels = clientX - dragStartClientX;
    const deltaMm = (deltaPixels / (pixelsPerMm || 10)) * sensitivity;

    let newVal = Math.max(0, Math.min(60, dragStartVal + deltaMm));
    newVal = Math.round(newVal * 10) / 10;
    valInput.value = newVal;
    update();
  }

  function endDragSlider() {
    if (!isDraggingSlider) return;
    isDraggingSlider = false;
    slider.style.cursor = 'grab';
    document.body.style.userSelect = '';
  }

  slider.style.cursor = 'grab';
  slider.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    startDragSlider(e.clientX);
  });

  slider.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      startDragSlider(e.touches[0].clientX);
    }
  }, { passive: false });

  svg.addEventListener('mousedown', (e) => {
    if (e.target.closest('#vernier-slider')) return;
    startPan(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingSlider) {
      moveDragSlider(e.clientX);
    } else if (isPanning) {
      movePan(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    endDragSlider();
    endPan();
  });

  svg.addEventListener('touchstart', (e) => {
    if (e.target.closest('#vernier-slider')) return;
    if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingSlider && e.touches.length === 1) {
      e.preventDefault();
      moveDragSlider(e.touches[0].clientX);
    } else if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    endDragSlider();
    endPan();
  });

  function setMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    panX = 0;
    panY = 0;
    zoomLevel = 1.0;

    if (mode === 'depth') {
      modeBtn.textContent = 'Flip to Jaw Mode';
      caliperAssembly.style.transform = 'rotate(90deg)';
      if (activeObj !== 'depthJar') {
        depthBeaker.style.opacity = '0';
        depthBeaker.style.display = 'none';
      }
    } else {
      modeBtn.textContent = 'Flip to Depth Mode';
      caliperAssembly.style.transform = 'rotate(0deg)';
      depthBeaker.style.opacity = '0';
      depthBeaker.style.display = 'none';
    }
    applyZoom();
  }

  modeBtn.addEventListener('click', () => {
    if (mode === 'jaw') {
      setMode('depth');
      if (activeObj !== 'depthJar') {
        selectObject('none', 0, 'Switched to Depth Mode. Drag the slider or select Depth Jar to measure beaker depth.');
      }
    } else {
      setMode('jaw');
      if (activeObj === 'depthJar') {
        selectObject('none', 0, 'Switched to Jaw Mode. Drag the slider or select a test object from the tray.');
      }
    }
  });

  const objBtns = {
    none: document.getElementById('obj-none-btn'),
    cylOut: document.getElementById('obj-cyl-out-btn'),
    cylIn: document.getElementById('obj-cyl-in-btn'),
    rect: document.getElementById('obj-rect-btn'),
    sq: document.getElementById('obj-sq-btn'),
    depthJar: document.getElementById('obj-depth-btn')
  };
  const svgObjs = {
    cylOut: document.getElementById('svg-obj-cyl-out'),
    cylIn: document.getElementById('svg-obj-cyl-in'),
    rect: document.getElementById('svg-obj-rect'),
    sq: document.getElementById('svg-obj-square')
  };
  const objDesc = document.getElementById('object-desc');

  function selectObject(objKey, targetVal, descText) {
    Object.values(objBtns).forEach(btn => { if (btn) btn.classList.remove('active'); });
    if (objBtns[objKey]) objBtns[objKey].classList.add('active');
    activeObj = objKey;

    if (objKey === 'depthJar') {
      if (mode !== 'depth') {
        setMode('depth');
      }
      depthBeaker.style.display = 'block';
      setTimeout(() => {
        depthBeaker.style.opacity = '1';
      }, 50);
      Object.keys(svgObjs).forEach(k => { if (svgObjs[k]) svgObjs[k].style.display = 'none'; });
    } else {
      depthBeaker.style.opacity = '0';
      setTimeout(() => {
        if (activeObj !== 'depthJar') depthBeaker.style.display = 'none';
      }, 300);

      if (objKey !== 'none' && mode === 'depth') {
        setMode('jaw');
      }

      Object.keys(svgObjs).forEach(key => {
        if (svgObjs[key]) svgObjs[key].style.display = (key === objKey) ? 'block' : 'none';
      });
    }

    if (objDesc) objDesc.textContent = descText;
    if (objKey !== 'none') {
      activeTrigger = 'slider';
      valInput.value = targetVal;
    }
    update();
  }

  if (objBtns.none) objBtns.none.addEventListener('click', () => selectObject('none', 0, 'Drag the slider or adjust inputs to measure freely.'));
  if (objBtns.cylOut) objBtns.cylOut.addEventListener('click', () => selectObject('cylOut', 24.0, 'Target outer diameter: 24.0 mm. Jaws aligned to clamp metallic cylinder.'));
  if (objBtns.cylIn) objBtns.cylIn.addEventListener('click', () => selectObject('cylIn', 16.0, 'Target inner diameter: 16.0 mm. Internal jaws expanded inside hollow ring.'));
  if (objBtns.rect) objBtns.rect.addEventListener('click', () => selectObject('rect', 42.5, 'Target width: 42.5 mm. Jaws aligned to measure the wooden block.'));
  if (objBtns.sq) objBtns.sq.addEventListener('click', () => selectObject('sq', 30.0, 'Target width: 30.0 mm. Jaws aligned to measure the acrylic block.'));
  if (objBtns.depthJar) objBtns.depthJar.addEventListener('click', () => selectObject('depthJar', 28.0, 'Target depth: 28.0 mm. Thin depth probe rod inserted to measure beaker liquid depth.'));

  const testTbody = document.getElementById('vernier-test-tbody');
  const runSuiteBtn = document.getElementById('vernier-run-suite-btn');

  const suiteCases = [
    { name: "Standard (Zero Error = 0)", msr: 23, vsd: 6, error: 0.0, expected: 23.6, obj: 'none' },
    { name: "Positive Zero Error (+0.2 mm)", msr: 23, vsd: 8, error: 0.2, expected: 23.6, obj: 'none' },
    { name: "Negative Zero Error (-0.3 mm)", msr: 23, vsd: 3, error: -0.3, expected: 23.6, obj: 'none' },
    { name: "Zero Thickness (+0.4 mm error)", msr: 0, vsd: 4, error: 0.4, expected: 0.0, obj: 'none' },
    { name: "Cylinder Outer Dia (True 24.0 mm)", trueVal: 24.0, error: 0.2, obj: 'cylOut' },
    { name: "Cylinder Inner Dia (True 16.0 mm)", trueVal: 16.0, error: -0.1, obj: 'cylIn' },
    { name: "Wooden Block (True 42.5 mm)", trueVal: 42.5, error: 0.0, obj: 'rect' },
    { name: "Acrylic Block (True 30.0 mm)", trueVal: 30.0, error: -0.2, obj: 'sq' },
    { name: "Depth Jar / Beaker (True Depth 28.0 mm)", trueVal: 28.0, error: 0.1, obj: 'depthJar' }
  ];

  function renderSuiteTable() {
    if (!testTbody) return;
    testTbody.innerHTML = '';
    suiteCases.forEach((tc, idx) => {
      let calc;
      if (tc.trueVal !== undefined) {
        calc = VernierEngine.simulateMeasurement(tc.trueVal, tc.error);
      } else {
        calc = VernierEngine.calculate(tc.msr, tc.vsd, tc.error);
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${tc.name}</strong></td>
        <td>${calc.zeroError >= 0 ? '+' : ''}${calc.zeroError.toFixed(2)} mm</td>
        <td>${calc.msr.toFixed(1)} mm</td>
        <td>${calc.vsd}</td>
        <td>${calc.observed.toFixed(2)} mm</td>
        <td><strong style="color: var(--accent);">${calc.corrected.toFixed(2)} mm</strong></td>
        <td><span style="color: #2ecc71; font-weight: bold;">✔ TRUE & PASS</span></td>
        <td>
          <button class="action-btn test-load-btn" data-idx="${idx}" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
            Simulate
          </button>
        </td>
      `;
      testTbody.appendChild(tr);
    });

    document.querySelectorAll('.test-load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        loadTestCase(idx);
      });
    });
  }

  function loadTestCase(idx) {
    const tc = suiteCases[idx];
    if (!tc) return;

    errorInput.value = tc.error;
    if (tc.trueVal !== undefined) {
      if (tc.obj && objBtns[tc.obj]) {
        objBtns[tc.obj].click();
      } else {
        valInput.value = tc.trueVal;
        activeTrigger = 'slider';
        update();
      }
    } else {
      activeTrigger = 'inputs';
      msrInput.value = tc.msr;
      vsdInput.value = tc.vsd;
      update();
    }
  }

  if (testTbody) {
    renderSuiteTable();
  }
  update();
}
function initScrew() {
  const mainTicks = document.getElementById('screw-main-ticks');
  const circularTicks = document.getElementById('circular-ticks');
  const spindle = document.getElementById('spindle');
  const thimble = document.getElementById('thimble');
  const screwObject = document.getElementById('screw-object');
  const screwObjectGroup = document.getElementById('screw-object-group');
  const labelsGroup = document.getElementById('screw-labels-group');
  const toggleLabelsCheckbox = document.getElementById('screw-toggle-labels');
  const toggleObjectCheckbox = document.getElementById('screw-toggle-object');

  const valInput = document.getElementById('screw-val');
  const msrInput = document.getElementById('screw-msr-input');
  const csrInput = document.getElementById('screw-csr-input');
  const pitchInput = document.getElementById('screw-pitch-input');
  const divsInput = document.getElementById('screw-divs-input');
  const errorInput = document.getElementById('screw-error');
  const calcBtn = document.getElementById('screw-calc-btn');
  const resetBtn = document.getElementById('screw-reset-btn');

  const stepM1 = document.getElementById('screw-step-m1');
  const stepM01 = document.getElementById('screw-step-m01');
  const stepM001 = document.getElementById('screw-step-m001');
  const stepP001 = document.getElementById('screw-step-p001');
  const stepP01 = document.getElementById('screw-step-p01');
  const stepP1 = document.getElementById('screw-step-p1');

  const lcDisplay = document.getElementById('screw-lc-display');
  const psrSpan = document.getElementById('screw-psr');
  const csrSpan = document.getElementById('screw-csr');
  const observedSpan = document.getElementById('screw-observed');
  const errorDisplay = document.getElementById('screw-error-display');
  const correctedSpan = document.getElementById('screw-corrected');
  const stepsContent = document.getElementById('screw-steps-content');

  const screwFlapEl = document.getElementById('screw-corrected-flap');
  const screwFlap = screwFlapEl ? new SplitFlapText(screwFlapEl) : null;

  // Callout pointer lines
  const spindleLine = document.getElementById('callout-spindle-line');
  const thimbleScaleLine = document.getElementById('callout-thimble-scale-line');
  const ratchetLine = document.getElementById('callout-ratchet-line');

  // Draw main scale graduations on the sleeve
  function drawMainScale() {
    if (!mainTicks) return;
    mainTicks.innerHTML = '';
    const originX = 390; // mm 0
    const scale = 10;    // 10 px per mm
    for (let i = 0; i <= 15; i++) {
      const x = originX + i * scale;
      const isMajor = (i % 5 === 0);
      const upperY = isMajor ? 133 : 138;

      // Millimeter tick above datum line (y=150)
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 150);
      line.setAttribute('x2', x);
      line.setAttribute('y2', upperY);
      line.setAttribute('stroke', '#9ec3e3');
      line.setAttribute('stroke-width', isMajor ? '2' : '1.2');
      mainTicks.appendChild(line);

      // Number text above tick
      if (isMajor) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', 126);
        text.setAttribute('fill', '#fec601');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', "'Outfit', sans-serif");
        text.setAttribute('text-anchor', 'middle');
        text.textContent = i;
        mainTicks.appendChild(text);
      }

      // Half-millimeter tick below datum line (y=150)
      if (i < 15) {
        const xHalf = x + 5;
        const halfLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        halfLine.setAttribute('x1', xHalf);
        halfLine.setAttribute('y1', 150);
        halfLine.setAttribute('x2', xHalf);
        halfLine.setAttribute('y2', 160);
        halfLine.setAttribute('stroke', '#73bfb8');
        halfLine.setAttribute('stroke-width', '1.2');
        mainTicks.appendChild(halfLine);
      }
    }
  }

  // Draw circular scale graduations on the beveled cone of the thimble
  function drawCircularScale(currentDiv, totalDivs = 100) {
    if (!circularTicks) return;
    circularTicks.innerHTML = '';
    // The bevel runs from x=0 to x=35. Datum line is at y=150.
    // Numbers increase UPWARDS as shown in diagram (15, 20, 25, 30).
    const spacing = 4.5;
    for (let i = -8; i <= 8; i++) {
      const divNum = ((Math.round(currentDiv) + i) % totalDivs + totalDivs) % totalDivs;
      const y = 150 - i * spacing; // higher divNum at smaller y (higher on screen)
      if (y >= 122 && y <= 178) {
        const isMajor = (divNum % 5 === 0);
        const tickLen = isMajor ? 18 : 10;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', tickLen);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', isMajor ? '#fec601' : '#f0f7fd');
        line.setAttribute('stroke-width', isMajor ? '1.8' : '1');
        circularTicks.appendChild(line);

        if (isMajor) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', 24);
          text.setAttribute('y', y + 3.5);
          text.setAttribute('fill', '#fec601');
          text.setAttribute('font-size', '9');
          text.setAttribute('font-weight', '600');
          text.setAttribute('font-family', "'Outfit', monospace");
          text.setAttribute('text-anchor', 'middle');
          text.textContent = divNum;
          circularTicks.appendChild(text);
        }
      }
    }
  }

  let isInternalUpdate = false;

  function update(source = 'val') {
    if (!valInput) return;
    const rawVal = Math.max(0, Math.min(15, parseFloat(valInput.value) || 0));
    const zeroError = parseFloat(errorInput ? errorInput.value : 0) || 0;
    const pitch = Math.max(0.1, parseFloat(pitchInput ? pitchInput.value : 1.0) || 1.0);
    const divs = Math.max(10, parseInt(divsInput ? divsInput.value : 100, 10) || 100);

    const lc = ScrewEngine.calculateLeastCount(pitch, divs);

    // Visual position of thimble reflects opening + zero error
    const visualOpening = Math.max(0, rawVal + zeroError);

    // Calculate MSR and CSR
    const msr = Math.floor(visualOpening / pitch) * pitch;
    const csrDiv = Math.round(((visualOpening - msr) / lc)) % divs;

    if (source !== 'inputs' && !isInternalUpdate && msrInput && csrInput) {
      isInternalUpdate = true;
      msrInput.value = msr;
      csrInput.value = csrDiv;
      isInternalUpdate = false;
    }

    // Run pure metrological calculation
    const calc = ScrewEngine.calculate(msr, csrDiv, zeroError, pitch, divs);

    // Update graphical elements
    // Anvil face is at x=130. Spindle moves by rawVal * 10.
    const spindleX = rawVal * 10;
    if (spindle) spindle.setAttribute('transform', `translate(${spindleX}, 0)`);

    // Thimble beveled face starts at x=390 (origin 0 on sleeve).
    const thimbleX = 390 + visualOpening * 10;
    if (thimble) thimble.setAttribute('transform', `translate(${thimbleX}, 0)`);

    // Measured object (red sphere) clamped between anvil (x=130) and spindle tip (x=130 + spindleX)
    const showObject = toggleObjectCheckbox ? toggleObjectCheckbox.checked : true;
    if (screwObject && screwObjectGroup) {
      if (showObject && rawVal > 0.05) {
        const diam = Math.min(spindleX, 120);
        const r = diam / 2;
        const cx = 130 + r;
        screwObject.setAttribute('cx', cx);
        screwObject.setAttribute('r', r);
        screwObjectGroup.style.display = 'block';
      } else {
        screwObjectGroup.style.display = 'none';
      }
    }

    // Draw circular scale aligned with current division
    drawCircularScale(csrDiv, divs);

    // Update callout arrow lines to follow moving parts
    if (spindleLine) {
      const targetSpindleX = Math.min(340, Math.max(145, 130 + spindleX / 2 + 15));
      spindleLine.setAttribute('x2', targetSpindleX);
    }
    if (thimbleScaleLine) {
      thimbleScaleLine.setAttribute('x2', thimbleX + 12);
    }
    if (ratchetLine) {
      ratchetLine.setAttribute('x2', thimbleX + 160);
    }

    // Update readouts
    if (lcDisplay) lcDisplay.textContent = `${lc.toFixed(divs >= 100 ? 3 : 2)} mm`;
    if (psrSpan) psrSpan.textContent = `${calc.msr.toFixed(1)} mm`;
    if (csrSpan) csrSpan.textContent = `${calc.csrMm.toFixed(2)} mm (Div: ${calc.csr})`;
    if (observedSpan) observedSpan.textContent = `${calc.observed.toFixed(2)} mm`;
    if (errorDisplay) errorDisplay.textContent = `${zeroError >= 0 ? '+' : ''}${zeroError.toFixed(2)} mm`;
    if (correctedSpan) correctedSpan.textContent = `${calc.corrected.toFixed(2)} mm`;

    if (screwFlap) {
      screwFlap.setText(`${calc.corrected.toFixed(2)} mm`);
    }

    // Step-by-step breakdown
    if (stepsContent) {
      stepsContent.innerHTML = `
        <div>1. ${calc.steps.lcCalc}</div>
        <div>2. ${calc.steps.csrCalc}</div>
        <div>3. ${calc.steps.observedCalc}</div>
        <div>4. ${calc.steps.correctedCalc}</div>
      `;
    }


  }

  // Draw static main scale
  drawMainScale();

  // Label toggle (default OFF)
  if (toggleLabelsCheckbox && labelsGroup) {
    labelsGroup.style.display = toggleLabelsCheckbox.checked ? 'block' : 'none';
    toggleLabelsCheckbox.addEventListener('change', () => {
      labelsGroup.style.display = toggleLabelsCheckbox.checked ? 'block' : 'none';
    });
  }

  // Object toggle
  if (toggleObjectCheckbox) {
    toggleObjectCheckbox.addEventListener('change', () => update('val'));
  }

  // Input listeners
  if (valInput) valInput.addEventListener('input', () => update('val'));
  if (errorInput) errorInput.addEventListener('input', () => update('val'));
  if (pitchInput) {
    pitchInput.addEventListener('input', () => {
      drawMainScale();
      update('val');
    });
  }
  if (divsInput) divsInput.addEventListener('input', () => update('val'));

  // Direct MSR / CSR inputs
  function onDirectInputsChange() {
    if (isInternalUpdate) return;
    const msr = Math.max(0, parseFloat(msrInput.value) || 0);
    const csr = Math.max(0, parseInt(csrInput.value, 10) || 0);
    const zeroError = parseFloat(errorInput ? errorInput.value : 0) || 0;
    const pitch = Math.max(0.1, parseFloat(pitchInput ? pitchInput.value : 1.0) || 1.0);
    const divs = Math.max(10, parseInt(divsInput ? divsInput.value : 100, 10) || 100);
    const lc = ScrewEngine.calculateLeastCount(pitch, divs);

    const observed = msr + csr * lc;
    const targetVal = Math.max(0, Math.min(15, observed - zeroError));
    valInput.value = targetVal.toFixed(2);
    update('inputs');
  }

  if (msrInput) msrInput.addEventListener('input', onDirectInputsChange);
  if (csrInput) csrInput.addEventListener('input', onDirectInputsChange);

  // Step buttons
  function applyStep(delta) {
    if (!valInput) return;
    let cur = parseFloat(valInput.value) || 0;
    cur = Math.max(0, Math.min(15, Math.round((cur + delta) * 100) / 100));
    valInput.value = cur.toFixed(2);
    update('val');
  }

  if (stepM1) stepM1.addEventListener('click', () => applyStep(-1.0));
  if (stepM01) stepM01.addEventListener('click', () => applyStep(-0.1));
  if (stepM001) stepM001.addEventListener('click', () => applyStep(-0.01));
  if (stepP001) stepP001.addEventListener('click', () => applyStep(0.01));
  if (stepP01) stepP01.addEventListener('click', () => applyStep(0.1));
  if (stepP1) stepP1.addEventListener('click', () => applyStep(1.0));

  // Calculate button
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      update('val');
      const box = document.getElementById('screw-readout-box');
      if (box) {
        box.style.boxShadow = '0 0 15px rgba(254, 198, 1, 0.4)';
        setTimeout(() => { box.style.boxShadow = ''; }, 600);
      }
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (valInput) valInput.value = '3.50';
      if (errorInput) errorInput.value = '0';
      if (pitchInput) pitchInput.value = '1.0';
      if (divsInput) divsInput.value = '100';
      if (toggleLabelsCheckbox) toggleLabelsCheckbox.checked = false;
      if (toggleObjectCheckbox) toggleObjectCheckbox.checked = true;
      if (labelsGroup) labelsGroup.style.display = 'none';
      drawMainScale();
      update('val');
    });
  }

  // Zoom & Pan
  let zoomLevel = 1.0;
  const svg = document.getElementById('screw-svg');
  const zoomInBtn = document.getElementById('screw-zoom-in');
  const zoomOutBtn = document.getElementById('screw-zoom-out');
  const zoomResetBtn = document.getElementById('screw-zoom-reset');

  let isPanning = false;
  let startX = 0, startY = 0;
  let panX = 0, panY = 0;
  let currentPanX = 0, currentPanY = 0;

  function applyZoom() {
    if (!svg) return;
    const w = 850 * zoomLevel;
    const h = 320 * zoomLevel;
    const x = 425 - w / 2 - (panX + currentPanX);
    const y = 160 - h / 2 - (panY + currentPanY);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoomLevel = Math.max(0.4, zoomLevel - 0.1);
      applyZoom();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoomLevel = Math.min(2.0, zoomLevel + 0.1);
      applyZoom();
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      zoomLevel = 1.0;
      panX = 0;
      panY = 0;
      currentPanX = 0;
      currentPanY = 0;
      applyZoom();
    });
  }

  function startPan(clientX, clientY) {
    if (!svg) return;
    isPanning = true;
    startX = clientX;
    startY = clientY;
    currentPanX = 0;
    currentPanY = 0;
    svg.style.cursor = 'grabbing';
  }

  function movePan(clientX, clientY) {
    if (!isPanning) return;
    currentPanX = (clientX - startX) * zoomLevel;
    currentPanY = (clientY - startY) * zoomLevel;
    applyZoom();
  }

  function endPan() {
    if (!isPanning) return;
    isPanning = false;
    panX += currentPanX;
    panY += currentPanY;
    currentPanX = 0;
    currentPanY = 0;
    if (svg) svg.style.cursor = 'grab';
  }

  // Thimble / Ratchet interactive dragging
  let isDraggingThimble = false;
  let dragStartSvgX = 0;
  let dragStartVal = 0;

  function getSvgPoint(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function startDragThimble(clientX, clientY) {
    if (!svg || !valInput) return;
    isDraggingThimble = true;
    const svgPt = getSvgPoint(clientX, clientY);
    dragStartSvgX = svgPt.x;
    dragStartVal = parseFloat(valInput.value) || 0;
    if (thimble) thimble.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function moveDragThimble(clientX, clientY) {
    if (!isDraggingThimble || !valInput) return;
    const svgPt = getSvgPoint(clientX, clientY);
    const deltaSvgX = svgPt.x - dragStartSvgX;
    const deltaMm = deltaSvgX / 10; // 10 px per mm
    let newVal = Math.max(0, Math.min(15, dragStartVal + deltaMm));
    newVal = Math.round(newVal * 100) / 100;
    valInput.value = newVal.toFixed(2);
    update('val');
  }

  function endDragThimble() {
    if (!isDraggingThimble) return;
    isDraggingThimble = false;
    if (thimble) thimble.style.cursor = 'grab';
    document.body.style.userSelect = '';
  }

  if (thimble) {
    thimble.style.cursor = 'grab';
    thimble.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startDragThimble(e.clientX, e.clientY);
    });
    thimble.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.stopPropagation();
        startDragThimble(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  if (svg) {
    svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('#thimble')) return;
      startPan(e.clientX, e.clientY);
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (isDraggingThimble) {
      moveDragThimble(e.clientX, e.clientY);
    } else if (isPanning) {
      movePan(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    endDragThimble();
    endPan();
  });

  if (svg) {
    svg.addEventListener('touchstart', (e) => {
      if (e.target.closest('#thimble')) return;
      if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY);
    });
  }

  window.addEventListener('touchmove', (e) => {
    if (isDraggingThimble && e.touches.length === 1) {
      e.preventDefault();
      moveDragThimble(e.touches[0].clientX, e.touches[0].clientY);
    } else if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    endDragThimble();
    endPan();
  });

  // Initial update
  update('val');
}
function initSpherometer() {
  const base = document.getElementById('spherometer-base');
  const surfaceLabel = document.getElementById('sph-surface-label');
  const screw = document.getElementById('spherometer-screw');
  const discTicks = document.getElementById('disc-ticks');
  const discZeroText = document.getElementById('sph-disc-zero');
  const labelsGroup = document.getElementById('sph-labels-group');
  const toggleLabelsCheckbox = document.getElementById('sph-toggle-labels');

  const surfaceSelect = document.getElementById('spherometer-surface');
  const aInput = document.getElementById('spherometer-a');
  const hInput = document.getElementById('spherometer-h');
  const msrInput = document.getElementById('spherometer-msr-input');
  const csrInput = document.getElementById('spherometer-csr-input');
  const errorInput = document.getElementById('spherometer-error');
  const calcBtn = document.getElementById('sph-calc-btn');
  const resetBtn = document.getElementById('sph-reset-btn');

  const stepM1 = document.getElementById('sph-step-m1');
  const stepM01 = document.getElementById('sph-step-m01');
  const stepM001 = document.getElementById('sph-step-m001');
  const stepP001 = document.getElementById('sph-step-p001');
  const stepP01 = document.getElementById('sph-step-p01');
  const stepP1 = document.getElementById('sph-step-p1');

  const lcDisplay = document.getElementById('sph-lc-display');
  const msrDisplay = document.getElementById('sph-msr-display');
  const csrDisplay = document.getElementById('sph-csr-display');
  const observedDisplay = document.getElementById('sph-observed-display');
  const errorDisplay = document.getElementById('sph-error-display');
  const sphFlapEl = document.getElementById('spherometer-h-flap');
  const sphFlap = sphFlapEl ? new SplitFlapText(sphFlapEl) : null;
  const hValSpan = document.getElementById('spherometer-h-val');
  const rSpan = document.getElementById('spherometer-r');
  const stepsContent = document.getElementById('sph-steps-content');

  // Draw radial divisions on perspective circular disc (crisp line-art)
  function drawDiscScale(offsetDiv, totalDivs = 100) {
    if (!discTicks) return;
    discTicks.innerHTML = '';
    const cx = 400;
    const cy = 95;
    const rxOuter = 152;
    const ryOuter = 21;
    const rxInner = 141;
    const ryInner = 19.5;

    // Draw ticks around ellipse
    const numTicks = 60;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i / numTicks) * 2 * Math.PI;
      const isMajor = (i % 5 === 0);

      const rIn = isMajor ? rxInner - 4 : rxInner;
      const rInY = isMajor ? ryInner - 1 : ryInner;

      const x1 = cx + Math.cos(angle) * rIn;
      const y1 = cy + Math.sin(angle) * rInY;
      const x2 = cx + Math.cos(angle) * rxOuter;
      const y2 = cy + Math.sin(angle) * ryOuter;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#000000');
      line.setAttribute('stroke-width', isMajor ? '1.5' : '0.9');
      discTicks.appendChild(line);
    }

    if (discZeroText) {
      discZeroText.textContent = `${Math.round(offsetDiv) % totalDivs}`;
    }
  }

  let isInternalUpdate = false;

  function update(source = 'h') {
    if (!hInput) return;
    const surface = surfaceSelect ? surfaceSelect.value : 'convex';
    const legDistance = Math.max(10, parseFloat(aInput ? aInput.value : 50) || 50);
    const hRaw = Math.max(-10, Math.min(10, parseFloat(hInput.value) || 0));
    const zeroError = parseFloat(errorInput ? errorInput.value : 0) || 0;

    const pitch = 1.0;
    const divs = 100;
    const lc = SpherometerEngine.calculateLeastCount(pitch, divs);

    // Visual reading including zero error
    const visualH = Math.max(-10, Math.min(10, hRaw + zeroError));
    
    // MSR: signed integer part towards 0 or conventional floor
    let msr = Math.trunc(visualH);
    let rem = visualH - msr;
    let csrDiv = Math.round(Math.abs(rem) / lc) % divs;
    if (visualH < 0 && csrDiv > 0) {
      // On negative side of spherometer vertical pitch scale:
      // e.g. -2.30 mm: MSR is -2 or -3 with CSR reading upwards/downwards
      // For textbook linear scales with 0 at center: MSR is signed -2, CSR is fraction
      csrDiv = Math.round(Math.abs(rem) / lc) % divs;
    }

    if (source !== 'inputs' && !isInternalUpdate && msrInput && csrInput) {
      isInternalUpdate = true;
      msrInput.value = msr;
      csrInput.value = csrDiv;
      isInternalUpdate = false;
    }

    // Pure metrological calculation using SpherometerEngine
    const calc = SpherometerEngine.calculate(msr, csrDiv, zeroError, pitch, divs, legDistance);

    // Sync calculated corrected height with signed direction
    if (visualH < 0 && calc.correctedH > 0) {
      calc.correctedH = -calc.correctedH;
      calc.observedH = -Math.abs(calc.observedH);
    }

    // Update surface SVG curve
    let baseD = "M 180 275 L 620 275";
    const hMagnitude = Math.abs(calc.correctedH);
    let curveHeight = Math.min(hMagnitude * 5, 50);

    if (surface === "convex") {
      // Convex curvature arches UPWARDS towards the center
      baseD = `M 180 275 Q 400 ${275 - curveHeight} 620 275`;
      if (surfaceLabel) {
        surfaceLabel.textContent = calc.correctedH === 0
          ? "Surface: Flat Glass Plate (Reference h = 0.00 mm)"
          : `Surface: Convex Lens / Spherical Mirror (Outward Sagitta h = +${hMagnitude.toFixed(2)} mm)`;
      }
    } else if (surface === "concave") {
      // Concave curvature dips DOWNWARDS (inward depression)
      baseD = `M 180 275 Q 400 ${275 + curveHeight} 620 275`;
      if (surfaceLabel) {
        surfaceLabel.textContent = calc.correctedH === 0
          ? "Surface: Flat Glass Plate (Reference h = 0.00 mm)"
          : `Surface: Concave Mirror / Inward Cavity (Inward Depth h = -${hMagnitude.toFixed(2)} mm)`;
      }
    } else {
      if (surfaceLabel) surfaceLabel.textContent = "Surface: Flat Glass Plate (Reference h = 0.00 mm)";
    }

    if (base) base.setAttribute('d', baseD);

    // Central screw moves vertically along with disc and knob
    // Travel: 5 px per mm (elevation > 0 moves UP / yOffset negative; depression < 0 moves DOWN / yOffset positive)
    const travelPx = visualH * 5;
    const yOffset = -travelPx;
    if (screw) {
      screw.setAttribute('transform', `translate(0, ${yOffset})`);
    }

    // Draw disc ticks
    drawDiscScale(csrDiv, divs);

    // Update Readouts
    if (lcDisplay) lcDisplay.textContent = `${lc.toFixed(2)} mm`;
    const msrSign = calc.msr > 0 ? '+' : '';
    if (msrDisplay) msrDisplay.textContent = `${msrSign}${calc.msr.toFixed(1)} mm`;
    if (csrDisplay) csrDisplay.textContent = `${calc.csrMm.toFixed(2)} mm (Div: ${calc.csr})`;
    const obsSign = calc.observedH > 0 ? '+' : '';
    if (observedDisplay) observedDisplay.textContent = `${obsSign}${calc.observedH.toFixed(2)} mm`;
    if (errorDisplay) errorDisplay.textContent = `${zeroError >= 0 ? '+' : ''}${zeroError.toFixed(2)} mm`;
    
    const corrSign = calc.correctedH > 0 ? '+' : '';
    const formattedH = `${corrSign}${calc.correctedH.toFixed(2)} mm`;
    if (hValSpan) hValSpan.textContent = formattedH;

    if (sphFlap) {
      sphFlap.setText(formattedH);
    }

    if (rSpan) {
      if (calc.radiusOfCurvature === Infinity) {
        rSpan.textContent = "∞ (Flat Surface)";
      } else {
        const curvatureType = calc.correctedH < 0 ? " (Concave)" : " (Convex)";
        rSpan.textContent = `${calc.radiusOfCurvature.toFixed(2)} mm${curvatureType}`;
      }
    }

    // Step-by-Step breakdown
    if (stepsContent) {
      stepsContent.innerHTML = `
        <div>1. ${calc.steps.lcCalc}</div>
        <div>2. ${calc.steps.csrCalc}</div>
        <div>3. ${calc.steps.observedCalc}</div>
        <div>4. ${calc.steps.correctedCalc}</div>
        <div>5. ${calc.steps.rCalc}</div>
      `;
    }


  }

  // Label toggle (default OFF)
  if (toggleLabelsCheckbox && labelsGroup) {
    labelsGroup.style.display = toggleLabelsCheckbox.checked ? 'block' : 'none';
    toggleLabelsCheckbox.addEventListener('change', () => {
      labelsGroup.style.display = toggleLabelsCheckbox.checked ? 'block' : 'none';
    });
  }

  // Direct inputs
  function onDirectInputsChange() {
    if (isInternalUpdate) return;
    const msr = parseFloat(msrInput.value) || 0;
    const csr = Math.max(0, parseInt(csrInput.value, 10) || 0);
    const zeroError = parseFloat(errorInput ? errorInput.value : 0) || 0;
    const lc = 0.01;

    const sign = msr < 0 ? -1 : 1;
    const observed = msr >= 0 ? (msr + csr * lc) : (msr - csr * lc);
    const targetH = Math.max(-10, Math.min(10, observed - zeroError));
    hInput.value = targetH.toFixed(2);
    update('inputs');
  }

  if (msrInput) msrInput.addEventListener('input', onDirectInputsChange);
  if (csrInput) csrInput.addEventListener('input', onDirectInputsChange);

  // Surface change: Convex (h > 0), Concave (h < 0), Flat (h = 0)
  if (surfaceSelect) {
    surfaceSelect.addEventListener('change', () => {
      if (surfaceSelect.value === 'flat') {
        hInput.value = '0.00';
      } else if (surfaceSelect.value === 'concave') {
        // Switch to inward/depression mode (negative h)
        let cur = parseFloat(hInput.value) || 0;
        hInput.value = cur > 0 ? (-cur).toFixed(2) : (cur === 0 ? '-2.50' : cur.toFixed(2));
      } else if (surfaceSelect.value === 'convex') {
        // Switch to outward/elevation mode (positive h)
        let cur = parseFloat(hInput.value) || 0;
        hInput.value = cur < 0 ? Math.abs(cur).toFixed(2) : (cur === 0 ? '2.50' : cur.toFixed(2));
      }
      update('h');
    });
  }

  if (aInput) aInput.addEventListener('input', () => update('h'));
  if (hInput) hInput.addEventListener('input', () => update('h'));
  if (errorInput) errorInput.addEventListener('input', () => update('h'));

  // Step buttons (-10 to +10 mm range)
  function applyStep(delta) {
    if (!hInput) return;
    let cur = parseFloat(hInput.value) || 0;
    cur = Math.max(-10, Math.min(10, Math.round((cur + delta) * 100) / 100));
    hInput.value = cur.toFixed(2);
    // Auto-update surface selector if crossing 0
    if (surfaceSelect) {
      if (cur < 0 && surfaceSelect.value !== 'concave') {
        surfaceSelect.value = 'concave';
      } else if (cur > 0 && surfaceSelect.value !== 'convex') {
        surfaceSelect.value = 'convex';
      } else if (cur === 0 && surfaceSelect.value !== 'flat') {
        surfaceSelect.value = 'flat';
      }
    }
    update('h');
  }

  if (stepM1) stepM1.addEventListener('click', () => applyStep(-1.0));
  if (stepM01) stepM01.addEventListener('click', () => applyStep(-0.1));
  if (stepM001) stepM001.addEventListener('click', () => applyStep(-0.01));
  if (stepP001) stepP001.addEventListener('click', () => applyStep(0.01));
  if (stepP01) stepP01.addEventListener('click', () => applyStep(0.1));
  if (stepP1) stepP1.addEventListener('click', () => applyStep(1.0));

  // Calculate button
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      update('h');
      const box = document.getElementById('sph-readout-box');
      if (box) {
        box.style.boxShadow = '0 0 15px rgba(254, 198, 1, 0.4)';
        setTimeout(() => { box.style.boxShadow = ''; }, 600);
      }
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (surfaceSelect) surfaceSelect.value = 'convex';
      if (hInput) hInput.value = '2.50';
      if (aInput) aInput.value = '50';
      if (errorInput) errorInput.value = '0';
      if (toggleLabelsCheckbox) toggleLabelsCheckbox.checked = false;
      if (labelsGroup) labelsGroup.style.display = 'none';
      update('h');
    });
  }

  // Zoom & Pan
  let zoomLevel = 1.0;
  const svg = document.getElementById('spherometer-svg');
  const zoomInBtn = document.getElementById('sph-zoom-in');
  const zoomOutBtn = document.getElementById('sph-zoom-out');
  const zoomResetBtn = document.getElementById('sph-zoom-reset');

  let isPanning = false;
  let startX = 0, startY = 0;
  let panX = 0, panY = 0;
  let currentPanX = 0, currentPanY = 0;

  function applyZoom() {
    if (!svg) return;
    const w = 850 * zoomLevel;
    const h = 340 * zoomLevel;
    const x = 425 - w / 2 - (panX + currentPanX);
    const y = 170 - h / 2 - (panY + currentPanY);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoomLevel = Math.max(0.4, zoomLevel - 0.1);
      applyZoom();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoomLevel = Math.min(2.0, zoomLevel + 0.1);
      applyZoom();
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      zoomLevel = 1.0;
      panX = 0;
      panY = 0;
      currentPanX = 0;
      currentPanY = 0;
      applyZoom();
    });
  }

  function startPan(clientX, clientY) {
    if (!svg) return;
    isPanning = true;
    startX = clientX;
    startY = clientY;
    currentPanX = 0;
    currentPanY = 0;
    svg.style.cursor = 'grabbing';
  }

  function movePan(clientX, clientY) {
    if (!isPanning) return;
    currentPanX = (clientX - startX) * zoomLevel;
    currentPanY = (clientY - startY) * zoomLevel;
    applyZoom();
  }

  function endPan() {
    if (!isPanning) return;
    isPanning = false;
    panX += currentPanX;
    panY += currentPanY;
    currentPanX = 0;
    currentPanY = 0;
    if (svg) svg.style.cursor = 'grab';
  }

  // Screw Interactive Dragging
  let isDraggingScrew = false;
  let dragStartSvgY = 0;
  let dragStartVal = 0;

  function getSvgPoint(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function startDragScrew(clientX, clientY) {
    if (!svg || !hInput) return;
    isDraggingScrew = true;
    const svgPt = getSvgPoint(clientX, clientY);
    dragStartSvgY = svgPt.y;
    dragStartVal = parseFloat(hInput.value) || 0;
    if (screw) screw.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function moveDragScrew(clientX, clientY) {
    if (!isDraggingScrew || !hInput) return;
    const svgPt = getSvgPoint(clientX, clientY);
    // Dragging UP in SVG (smaller Y) lifts the screw (higher positive h)
    // Dragging DOWN in SVG (larger Y) pushes the screw down (negative/concave h)
    const deltaSvgY = dragStartSvgY - svgPt.y;
    const deltaMm = deltaSvgY / 5; // 5 px per mm
    let newVal = Math.max(-10, Math.min(10, dragStartVal + deltaMm));
    newVal = Math.round(newVal * 100) / 100;
    hInput.value = newVal.toFixed(2);
    if (surfaceSelect) {
      if (newVal < 0 && surfaceSelect.value !== 'concave') {
        surfaceSelect.value = 'concave';
      } else if (newVal > 0 && surfaceSelect.value !== 'convex') {
        surfaceSelect.value = 'convex';
      } else if (newVal === 0 && surfaceSelect.value !== 'flat') {
        surfaceSelect.value = 'flat';
      }
    }
    update('h');
  }

  function endDragScrew() {
    if (!isDraggingScrew) return;
    isDraggingScrew = false;
    if (screw) screw.style.cursor = 'grab';
    document.body.style.userSelect = '';
  }

  if (screw) {
    screw.style.cursor = 'grab';
    screw.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startDragScrew(e.clientX, e.clientY);
    });
    screw.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.stopPropagation();
        startDragScrew(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  if (svg) {
    svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('#spherometer-screw')) return;
      startPan(e.clientX, e.clientY);
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (isDraggingScrew) {
      moveDragScrew(e.clientX, e.clientY);
    } else if (isPanning) {
      movePan(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    endDragScrew();
    endPan();
  });

  if (svg) {
    svg.addEventListener('touchstart', (e) => {
      if (e.target.closest('#spherometer-screw')) return;
      if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY);
    });
  }

  window.addEventListener('touchmove', (e) => {
    if (isDraggingScrew && e.touches.length === 1) {
      e.preventDefault();
      moveDragScrew(e.touches[0].clientX, e.touches[0].clientY);
    } else if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    endDragScrew();
    endPan();
  });

  // Initial update
  update('h');
}

// React Bits Scanner Background Component Implementation
function initScannerBackground() {
  const container = document.getElementById("scanner-bg");
  if (!container) return;

  const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
  };

  const directionToFloat = dir => (dir === "horizontal" ? 1.0 : dir === "diagonal" ? 2.0 : 0.0);

  const config = {
    color1: "#5227FF",
    color2: "#FF9FFC",
    color3: "#FFFFFF",
    speed: 0.5,
    sweepSpeed: 0.25,
    sweepWidth: 1.6,
    sweepFalloff: 6,
    scale: 1.5,
    frequency: 2,
    ripple: 0.22,
    bandDensity: 11,
    lineSharpness: 5.5,
    glow: 0.22,
    scanDirection: "vertical",
    colorSpread: 0.7,
    brightness: 1.0,
    contrast: 1.15,
    softness: 1.4,
    vignette: 0.45,
    scanline: true,
    grain: true,
    grainIntensity: 0.05,
    opacity: 1.0,
    mouseInteraction: true,
    mouseRadius: 0.5,
    mouseStrength: 0.5
  };

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  container.appendChild(canvas);

  let gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false
  });

  if (!gl) {
    console.warn("WebGL2 not supported for Scanner.");
    return;
  }

  const vertexShaderSrc = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShaderSrc = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepFalloff;
uniform float uScale;
uniform float uFrequency;
uniform float uRipple;
uniform float uBandDensity;
uniform float uLineSharpness;
uniform float uGlow;
uniform float uColorSpread;
uniform float uBrightness;
uniform float uContrast;
uniform float uSoftness;
uniform float uVignette;
uniform float uOpacity;
uniform float uScanline;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uDirection;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

const float TAU = 6.2831853;

float signalField(vec2 p, float t) {
  float w = sin(p.x * 1.3 + t * 0.7);
  w += sin(p.y * 1.7 - t * 0.52) * 0.8;
  w += sin((p.x + p.y) * 0.9 + t * 0.91) * 0.6;
  w += sin((p.x - p.y) * 1.53 - t * 0.63) * 0.42;
  return w * 0.35;
}

vec3 palette(float f) {
  f = clamp(f, 0.0, 1.0);
  f = pow(f, uContrast);
  vec3 c = mix(uColor1, uColor2, smoothstep(0.08, 0.6, f));
  return mix(c, uColor3, smoothstep(0.68, 1.0, f));
}

float scanBand(float x, float aa, float sharp) {
  float v = mix(0.5, 0.5 + 0.5 * cos(x * TAU), aa);
  return pow(v, sharp);
}

void main() {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv0 = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
  vec2 p = uv0 / max(uScale, 0.001);

  float t = iTime * uSpeed;

  float mouseBoost = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mUv = vec2((uMouse.x * 2.0 - 1.0) * aspect, uMouse.y * 2.0 - 1.0);
    vec2 md = uv0 - mUv;
    float r = max(uMouseRadius, 0.001);
    mouseBoost = exp(-dot(md, md) / (r * r)) * uMouseStrength * uMouseActive;
  }

  float axis;
  if (uDirection < 0.5) axis = p.y;
  else if (uDirection < 1.5) axis = p.x;
  else axis = (p.x + p.y) * 0.70710678;

  float sig = signalField(p * uFrequency, t);
  float coord = axis + sig * uRipple;

  float phase = coord / max(uSweepWidth, 0.05) - t * uSweepSpeed;
  float sweep = pow(0.5 + 0.5 * cos(phase * TAU), max(uSweepFalloff, 0.1));

  float lc = coord * uBandDensity;
  float aa = 1.0 / (1.0 + uSoftness * fwidth(lc) * 3.0);
  aa = clamp(aa * (1.0 + mouseBoost * 0.6), 0.0, 1.0);

  float bodyBase = clamp(0.5 + 0.5 * sig, 0.0, 1.0);
  float body = bodyBase * bodyBase * uGlow * sweep;

  float sharp = max(uLineSharpness, 0.1);
  float split = uColorSpread * 0.16;
  float fr = clamp(scanBand(lc + split, aa, sharp) * sweep + body, 0.0, 1.0);
  float fg = clamp(scanBand(lc, aa, sharp) * sweep + body, 0.0, 1.0);
  float fb = clamp(scanBand(lc - split, aa, sharp) * sweep + body, 0.0, 1.0);

  vec3 col = vec3(palette(fr).r, palette(fg).g, palette(fb).b);

  float inten = (fr + fg + fb) * 0.3333333 * uBrightness;
  inten *= 1.0 + mouseBoost * 0.9;

  if (uScanline > 0.5) {
    inten *= 1.0 - 0.18 * (0.5 + 0.5 * cos(gl_FragCoord.y * 1.7));
  }

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    inten += (g - 0.5) * uGrainIntensity;
  }

  inten *= clamp(1.0 - uVignette * smoothstep(0.55, 1.65, length(uv0)), 0.0, 1.0);
  inten = clamp(inten, 0.0, 1.0);

  float a = clamp(inten * uOpacity, 0.0, 1.0);
  fragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  if (!vertShader || !fragShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  const triangleData = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleData, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    iTime: gl.getUniformLocation(program, "iTime"),
    iResolution: gl.getUniformLocation(program, "iResolution"),
    uSpeed: gl.getUniformLocation(program, "uSpeed"),
    uSweepSpeed: gl.getUniformLocation(program, "uSweepSpeed"),
    uSweepWidth: gl.getUniformLocation(program, "uSweepWidth"),
    uSweepFalloff: gl.getUniformLocation(program, "uSweepFalloff"),
    uScale: gl.getUniformLocation(program, "uScale"),
    uFrequency: gl.getUniformLocation(program, "uFrequency"),
    uRipple: gl.getUniformLocation(program, "uRipple"),
    uBandDensity: gl.getUniformLocation(program, "uBandDensity"),
    uLineSharpness: gl.getUniformLocation(program, "uLineSharpness"),
    uGlow: gl.getUniformLocation(program, "uGlow"),
    uColorSpread: gl.getUniformLocation(program, "uColorSpread"),
    uBrightness: gl.getUniformLocation(program, "uBrightness"),
    uContrast: gl.getUniformLocation(program, "uContrast"),
    uSoftness: gl.getUniformLocation(program, "uSoftness"),
    uVignette: gl.getUniformLocation(program, "uVignette"),
    uOpacity: gl.getUniformLocation(program, "uOpacity"),
    uScanline: gl.getUniformLocation(program, "uScanline"),
    uGrain: gl.getUniformLocation(program, "uGrain"),
    uGrainIntensity: gl.getUniformLocation(program, "uGrainIntensity"),
    uDirection: gl.getUniformLocation(program, "uDirection"),
    uMouse: gl.getUniformLocation(program, "uMouse"),
    uMouseEnabled: gl.getUniformLocation(program, "uMouseEnabled"),
    uMouseRadius: gl.getUniformLocation(program, "uMouseRadius"),
    uMouseStrength: gl.getUniformLocation(program, "uMouseStrength"),
    uMouseActive: gl.getUniformLocation(program, "uMouseActive"),
    uColor1: gl.getUniformLocation(program, "uColor1"),
    uColor2: gl.getUniformLocation(program, "uColor2"),
    uColor3: gl.getUniformLocation(program, "uColor3")
  };

  const setSize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const ro = new ResizeObserver(setSize);
  ro.observe(container);
  setSize();

  let currentMouse = [0.5, 0.5];
  let targetMouse = [0.5, 0.5];
  let mouseActive = 0;
  let targetMouseActive = 0;

  window.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    targetMouse = [
      (e.clientX - rect.left) / Math.max(rect.width, 1),
      1.0 - (e.clientY - rect.top) / Math.max(rect.height, 1)
    ];
    targetMouseActive = 1;
  });

  window.addEventListener("mouseleave", () => {
    targetMouseActive = 0;
  });

  const c1 = hexToRgb(config.color1);
  const c2 = hexToRgb(config.color2);
  const c3 = hexToRgb(config.color3);

  let raf = 0;
  let isVisible = true;
  let isPageVisible = !document.hidden;
  const t0 = performance.now();

  const loop = t => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(uniforms.iTime, (t - t0) * 0.001);
    gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uSpeed, config.speed);
    gl.uniform1f(uniforms.uSweepSpeed, config.sweepSpeed);
    gl.uniform1f(uniforms.uSweepWidth, config.sweepWidth);
    gl.uniform1f(uniforms.uSweepFalloff, config.sweepFalloff);
    gl.uniform1f(uniforms.uScale, config.scale);
    gl.uniform1f(uniforms.uFrequency, config.frequency);
    gl.uniform1f(uniforms.uRipple, config.ripple);
    gl.uniform1f(uniforms.uBandDensity, config.bandDensity);
    gl.uniform1f(uniforms.uLineSharpness, config.lineSharpness);
    gl.uniform1f(uniforms.uGlow, config.glow);
    gl.uniform1f(uniforms.uColorSpread, config.colorSpread);
    gl.uniform1f(uniforms.uBrightness, config.brightness);
    gl.uniform1f(uniforms.uContrast, config.contrast);
    gl.uniform1f(uniforms.uSoftness, config.softness);
    gl.uniform1f(uniforms.uVignette, config.vignette);
    gl.uniform1f(uniforms.uOpacity, config.opacity);
    gl.uniform1f(uniforms.uScanline, config.scanline ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uGrain, config.grain ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uGrainIntensity, config.grainIntensity);
    gl.uniform1f(uniforms.uDirection, directionToFloat(config.scanDirection));

    if (!config.mouseInteraction) {
      targetMouseActive = 0;
    }
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    gl.uniform2f(uniforms.uMouse, currentMouse[0], currentMouse[1]);

    mouseActive += 0.05 * (targetMouseActive - mouseActive);
    gl.uniform1f(uniforms.uMouseActive, mouseActive);
    gl.uniform1f(uniforms.uMouseEnabled, config.mouseInteraction ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uMouseRadius, config.mouseRadius);
    gl.uniform1f(uniforms.uMouseStrength, config.mouseStrength);

    gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2]);
    gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2]);
    gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2]);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    raf = requestAnimationFrame(loop);
  };

  const tryStart = () => {
    if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
  };
  const tryStop = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      isVisible ? tryStart() : tryStop();
    },
    { threshold: 0 }
  );
  io.observe(container);

  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    isPageVisible ? tryStart() : tryStop();
  });

  tryStart();
}

// React Bits TechText Component Implementation
function initTechText() {
  const container = document.getElementById('pop-tech-text');
  const canvas = document.getElementById('pop-tech-canvas');
  if (!container || !canvas) return;

  const ctx = canvas.getContext('2d');
  const scratch = document.createElement('canvas');
  const scratchCtx = scratch.getContext('2d');
  if (!ctx || !scratchCtx) return;

  const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const FALLOFF_STEPS = 8;
  const SPRING = 320;
  const DAMPING = 22;

  const approach = (current, target, dt, seconds) => current + (target - current) * (1 - Math.exp(-dt / seconds));

  const hexToRgb = hex => {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, c => c + c);
    const n = parseInt(h.slice(0, 6), 16);
    return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  const rgba = (hex, alpha) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const noise = (...values) => {
    let h = 2166136261;
    for (const value of values) {
      h = Math.imul(h ^ (value | 0), 16777619);
      h ^= h >>> 13;
      h = Math.imul(h, 0x5bd1e995);
      h ^= h >>> 15;
    }
    return (h >>> 0) / 4294967296;
  };

  const signed = value => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0');

  const settings = {
    text: 'Precision of Physics',
    fontFamily: "'Cinzel', 'Outfit', serif",
    fontWeight: 700,
    fontSize: 150,
    letterSpacing: -0.02,
    color: '#f0f7fd',
    accentColor: '#3da5d9',
    reach: 200,
    softness: 0.7,
    dashLength: 4,
    dashGap: 2,
    strokeWidth: 1.5,
    lineStyle: 'dashed',
    reveal: 'letter',
    specks: 15,
    selection: true,
    labels: true,
    draggable: true,
    sweep: true,
    speed: 1
  };

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let alive = true;
  let layoutKey = '';
  let requestedFont = '';
  let word = null;
  let glyphs = [];
  let presence = 0;
  let clock = 0;
  let pulse = 0;
  let placed = false;
  let dragging = -1;
  const pointer = { x: 0, y: 0, inside: false };
  const grab = { x: 0, y: 0 };
  const lens = { x: 0, y: 0 };
  const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

  const wake = () => {
    if (raf || !visible || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const refreshFonts = () => {
    layoutKey = '';
    wake();
  };

  const family = s => s.fontFamily || getComputedStyle(container).fontFamily || 'sans-serif';
  const fontFor = (s, size) => `${s.fontWeight} ${size}px ${family(s)}`;

  const setFont = (target, s, size) => {
    target.font = fontFor(s, size);
    if ('letterSpacing' in target) target.letterSpacing = `${s.letterSpacing * size}px`;
    target.textAlign = 'left';
    target.textBaseline = 'alphabetic';
  };

  const sprite = (s, view, glyph, stroke) => {
    const pad = Math.ceil(s.strokeWidth * 2 + 4);
    const left = glyph.box.x1 - pad;
    const top = glyph.box.y1 - pad;
    const w = glyph.box.x2 - glyph.box.x1 + pad * 2;
    const h = glyph.box.y2 - glyph.box.y1 + pad * 2;
    const image = document.createElement('canvas');
    image.width = Math.max(1, Math.ceil(w * dpr));
    image.height = Math.max(1, Math.ceil(h * dpr));
    const c = image.getContext('2d');
    if (!c) return { image, left, top };
    c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
    setFont(c, s, view.size);
    if (stroke) {
      c.lineJoin = 'round';
      c.lineWidth = s.strokeWidth * 2;
      c.lineCap = 'butt';
      c.strokeStyle = s.color;
      if (s.lineStyle !== 'solid') c.setLineDash([Math.max(1, s.dashLength), Math.max(1, s.dashGap)]);
      c.strokeText(glyph.char, glyph.x, view.baseline);
      c.setLineDash([]);
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = '#000000';
      c.fillText(glyph.char, glyph.x, view.baseline);
      c.globalCompositeOperation = 'source-over';
    } else {
      c.fillStyle = s.color;
      c.fillText(glyph.char, glyph.x, view.baseline);
    }
    return { image, left, top };
  };

  const ensureLayout = s => {
    const key = [
      s.text,
      family(s),
      s.fontWeight,
      s.fontSize,
      s.letterSpacing,
      s.color,
      s.dashLength,
      s.dashGap,
      s.strokeWidth,
      s.lineStyle,
      width,
      height,
      dpr
    ].join('|');
    if (key === layoutKey && word) return word;
    layoutKey = key;
    const wanted = fontFor(s, 64);
    if (document.fonts && wanted !== requestedFont) {
      requestedFont = wanted;
      document.fonts.load(wanted, s.text).then(refreshFonts, refreshFonts);
    }

    const probe = scratchCtx;
    setFont(probe, s, s.fontSize);
    let m = probe.measureText(s.text);
    const fit = Math.min(
      1,
      (width * 0.9) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1),
      (height * 0.66) / Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1)
    );
    const size = s.fontSize * fit;
    setFont(probe, s, size);
    m = probe.measureText(s.text);
    const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const x = (width - inkWidth) / 2 + m.actualBoundingBoxLeft;
    const baseline = (height - inkHeight) / 2 + m.actualBoundingBoxAscent;
    const next = {
      size,
      baseline,
      left: x - m.actualBoundingBoxLeft,
      right: x + m.actualBoundingBoxRight,
      top: baseline - m.actualBoundingBoxAscent,
      bottom: baseline + m.actualBoundingBoxDescent
    };
    word = next;

    const chars = Array.from(s.text);
    const previous = glyphs;
    glyphs = [];
    let prefix = '';
    chars.forEach((char, i) => {
      prefix += char;
      const own = probe.measureText(char);
      const gx = x + probe.measureText(prefix).width - own.width;
      if (!char.trim()) return;
      const base = {
        char,
        x: gx,
        box: {
          x1: gx - own.actualBoundingBoxLeft,
          y1: baseline - own.actualBoundingBoxAscent,
          x2: gx + own.actualBoundingBoxRight,
          y2: baseline + own.actualBoundingBoxDescent
        }
      };
      const kept = previous[glyphs.length];
      glyphs.push({
        ...base,
        offset: kept?.char === char ? kept.offset : { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        outline: 0,
        index: i,
        fill: sprite(s, next, base, false),
        dashes: sprite(s, next, base, true)
      });
    });
    dragging = -1;
    frame.index = -1;
    return next;
  };

  const glyphAt = (x, y) => {
    if (!word || y < word.top - 24 || y > word.bottom + 24) return -1;
    let best = -1;
    let bestDistance = Infinity;
    glyphs.forEach((glyph, i) => {
      const x1 = glyph.box.x1 + glyph.offset.x;
      const x2 = glyph.box.x2 + glyph.offset.x;
      const d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return bestDistance < 28 ? best : -1;
  };

  const falloff = (target, cx, cy, radius, strength, softness) => {
    const inner = Math.min(1, Math.max(0, 1 - softness));
    const gradient = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
    if (inner > 0.995) {
      gradient.addColorStop(0.995, `rgba(0, 0, 0, ${strength})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      return gradient;
    }
    for (let i = 0; i <= FALLOFF_STEPS; i++) {
      const t = i / FALLOFF_STEPS;
      const eased = t * t * (3 - 2 * t);
      gradient.addColorStop(inner + (1 - inner) * t, `rgba(0, 0, 0, ${strength * (1 - eased)})`);
    }
    return gradient;
  };

  const blit = (target, art, dx, dy, originX, originY) => {
    target.drawImage(
      art.image,
      Math.round((art.left + dx) * dpr - originX),
      Math.round((art.top + dy) * dpr - originY)
    );
  };

  const drawReveal = s => {
    const radius = s.reach * dpr;
    const cx = lens.x * dpr;
    const cy = lens.y * dpr;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = falloff(ctx, cx, cy, radius, presence, s.softness);
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = 'source-over';

    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
    const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
    if (x1 <= x0 || y1 <= y0) return;
    const w = x1 - x0;
    const h = y1 - y0;
    if (scratch.width < w || scratch.height < h) {
      scratch.width = Math.max(scratch.width, w);
      scratch.height = Math.max(scratch.height, h);
    }
    scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
    scratchCtx.globalCompositeOperation = 'source-over';
    scratchCtx.clearRect(0, 0, w, h);
    for (const glyph of glyphs) blit(scratchCtx, glyph.dashes, glyph.offset.x, glyph.offset.y, x0, y0);
    scratchCtx.globalCompositeOperation = 'destination-in';
    scratchCtx.fillStyle = falloff(scratchCtx, cx - x0, cy - y0, radius, 1, s.softness);
    scratchCtx.fillRect(0, 0, w, h);
    scratchCtx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = presence;
    ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h);
    ctx.globalAlpha = 1;
  };

  const crisp = value => (Math.round(value * dpr) + 0.5) / dpr;

  const perimeterPoint = (distance, w, h) => {
    let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
    if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
    d -= w;
    if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
    d -= h;
    if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
    d -= w;
    return [frame.x1, frame.y2 - d, -1, 0];
  };

  const drawSpecks = (s, a) => {
    const w = frame.x2 - frame.x1;
    const h = frame.y2 - frame.y1;
    if (w < 2 || h < 2) return;
    const perimeter = 2 * (w + h);
    const seed = frame.index + 1;
    const grid = 3;

    for (let k = 0; k < s.specks; k++) {
      const period = 0.5 + noise(seed, k, 11) * 1.2;
      const t = pulse / period + noise(seed, k, 17);
      const cycle = Math.floor(t);
      const life = t - cycle;
      if (life > 0.7) continue;
      const [px, py, nx, ny] = perimeterPoint(noise(seed, k, cycle) * perimeter, w, h);
      const pick = noise(seed, k, cycle, 2);
      const size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
      const large = size >= 8;
      const out = (large ? 9 : 4) + Math.floor(noise(seed, k, cycle, 1) * 5) * grid;
      const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid;
      const y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
      const tone = noise(seed, k, cycle, 3);
      const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
      const alpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink;
      const left = Math.round(x - size / 2);
      const top = Math.round(y - size / 2);
      if (tone < 0.26 || (large && tone < 0.78)) {
        ctx.strokeStyle = rgba(s.accentColor, alpha);
        ctx.strokeRect(left + 0.5, top + 0.5, size, size);
        if (large && tone > 0.5) {
          ctx.fillStyle = rgba(s.accentColor, alpha);
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
      } else {
        ctx.fillStyle = rgba(s.accentColor, alpha);
        ctx.fillRect(left, top, size, size);
      }
    }

    for (let j = 0; j < 2; j++) {
      const head = (pulse * 0.42 * s.speed + j * 0.5) * perimeter;
      for (let i = 0; i < 4; i++) {
        const [x, y] = perimeterPoint(head - i * 6, w, h);
        const size = i === 0 ? 3 : 2;
        ctx.fillStyle = rgba(s.accentColor, a * [0.95, 0.55, 0.32, 0.16][i]);
        ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      }
    }
  };

  const drawFrame = s => {
    const glyph = glyphs[frame.index];
    if (!glyph || frame.alpha < 0.01) return;
    const a = frame.alpha;
    const x1 = crisp(frame.x1);
    const y1 = crisp(frame.y1);
    const x2 = crisp(frame.x2);
    const y2 = crisp(frame.y2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
    if (moved > 1) {
      const hx = (glyph.box.x1 + glyph.box.x2) / 2;
      const hy = (glyph.box.y1 + glyph.box.y2) / 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + glyph.offset.x, hy + glyph.offset.y);
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(s.accentColor, 0.45 * a);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
      ctx.fillStyle = rgba(s.accentColor, 0.7 * a);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(s.accentColor, 0.5 * a);
    ctx.stroke();

    ctx.beginPath();
    for (const [cx, cy] of [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2]
    ]) {
      ctx.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
    }
    ctx.fillStyle = rgba(s.accentColor, 0.95 * a);
    ctx.fill();

    if (s.specks > 0) {
      ctx.lineWidth = 1;
      drawSpecks(s, a);
    }

    if (!s.labels) return;
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = rgba(s.accentColor, 0.62 * a);
    const label =
      moved > 1
        ? `${signed(Math.round(glyph.offset.x))}, ${signed(Math.round(-glyph.offset.y))}`
        : `${glyph.char}  ${Math.round(glyph.box.x2 - glyph.box.x1)} × ${Math.round(glyph.box.y2 - glyph.box.y1)}`;
    ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
  };

  const tick = now => {
    raf = 0;
    const s = settings;
    if (!s) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const view = ensureLayout(s);

    const sweeping = s.sweep && !reducedMotion && !pointer.inside && dragging < 0;
    if (sweeping) clock += dt * s.speed;
    pulse += dt;
    let targetX = pointer.x;
    let targetY = pointer.y;
    if (sweeping) {
      targetX = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45));
      targetY = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8));
    }
    const active = pointer.inside || sweeping || dragging >= 0;
    if (active && !placed) {
      lens.x = targetX;
      lens.y = targetY;
    }
    if (active) {
      const lag = pointer.inside ? 0.05 : 0.22;
      lens.x = approach(lens.x, targetX, dt, lag);
      lens.y = approach(lens.y, targetY, dt, lag);
    }
    placed = active;
    presence = approach(presence, s.reveal === 'area' && active && dragging < 0 ? 1 : 0, dt, 0.16);

    let moving = false;
    glyphs.forEach((glyph, i) => {
      if (i === dragging) {
        glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);
        glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);
        glyph.velocity.x = 0;
        glyph.velocity.y = 0;
        moving = true;
        return;
      }
      const { offset, velocity } = glyph;
      if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05 && Math.hypot(velocity.x, velocity.y) < 0.5) {
        offset.x = 0;
        offset.y = 0;
        velocity.x = 0;
        velocity.y = 0;
        return;
      }
      velocity.x += (-SPRING * offset.x - DAMPING * velocity.x) * dt;
      velocity.y += (-SPRING * offset.y - DAMPING * velocity.y) * dt;
      offset.x += velocity.x * dt;
      offset.y += velocity.y * dt;
      moving = true;
    });

    const focus = dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
    if (focus >= 0 && s.selection) {
      const glyph = glyphs[focus];
      const bx1 = glyph.box.x1 + glyph.offset.x - 6;
      const by1 = glyph.box.y1 + glyph.offset.y - 6;
      const bx2 = glyph.box.x2 + glyph.offset.x + 6;
      const by2 = glyph.box.y2 + glyph.offset.y + 6;
      if (frame.index < 0 || frame.alpha < 0.02) {
        frame.x1 = bx1;
        frame.y1 = by1;
        frame.x2 = bx2;
        frame.y2 = by2;
      }
      const glide = focus === dragging ? 0.02 : 0.08;
      frame.x1 = approach(frame.x1, bx1, dt, glide);
      frame.y1 = approach(frame.y1, by1, dt, glide);
      frame.x2 = approach(frame.x2, bx2, dt, glide);
      frame.y2 = approach(frame.y2, by2, dt, glide);
      frame.index = focus;
    }
    frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);

    glyphs.forEach((glyph, i) => {
      const target = s.reveal === 'letter' && i === focus && i !== dragging ? 1 : 0;
      glyph.outline = approach(glyph.outline, target, dt, 0.09);
      if (Math.abs(glyph.outline - target) > 0.002) moving = true;
      else glyph.outline = target;
    });

    if (s.draggable) container.style.cursor = dragging >= 0 ? 'grabbing' : focus >= 0 && pointer.inside ? 'grab' : '';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const glyph of glyphs) {
      const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
      if (moved > 1) {
        ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
        blit(ctx, glyph.dashes, 0, 0, 0, 0);
        ctx.globalAlpha = 1;
      }
    }
    for (const glyph of glyphs) {
      if (glyph.outline < 0.999) {
        ctx.globalAlpha = 1 - glyph.outline;
        blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
      }
      if (glyph.outline > 0.001) {
        ctx.globalAlpha = glyph.outline;
        blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0);
      }
      ctx.globalAlpha = 1;
    }
    if (presence > 0.001) drawReveal(s);
    drawFrame(s);

    const settling =
      moving ||
      Math.abs(presence - (s.reveal === 'area' && active && dragging < 0 ? 1 : 0)) > 0.002 ||
      (frame.alpha > 0.01 && frame.alpha < 0.99);
    if ((active || settling) && visible && alive) raf = requestAnimationFrame(tick);
  };

  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    layoutKey = '';
    wake();
  };

  const locate = e => {
    const rect = container.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  };
  const onMove = e => {
    locate(e);
    pointer.inside = true;
    wake();
  };
  const onLeave = () => {
    if (dragging >= 0) return;
    pointer.inside = false;
    wake();
  };
  const onDown = e => {
    locate(e);
    pointer.inside = true;
    const s = settings;
    if (s?.draggable && (e.pointerType !== 'mouse' || e.button === 0)) {
      const index = glyphAt(pointer.x, pointer.y);
      if (index >= 0) {
        dragging = index;
        grab.x = pointer.x - glyphs[index].offset.x;
        grab.y = pointer.y - glyphs[index].offset.y;
        container.setPointerCapture?.(e.pointerId);
      }
    }
    wake();
  };
  const onUp = e => {
    if (dragging >= 0) {
      dragging = -1;
      container.releasePointerCapture?.(e.pointerId);
      const rect = container.getBoundingClientRect();
      pointer.inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    }
    wake();
  };

  container.addEventListener('pointermove', onMove, { passive: true });
  container.addEventListener('pointerenter', onMove, { passive: true });
  container.addEventListener('pointerdown', onDown, { passive: true });
  container.addEventListener('pointerup', onUp, { passive: true });
  container.addEventListener('pointercancel', onUp, { passive: true });
  container.addEventListener('pointerleave', onLeave, { passive: true });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  intersectionObserver.observe(container);
  if (document.fonts) document.fonts.ready.then(refreshFonts, refreshFonts);

  resize();
}

/**
 * React Bits: StrokeText Component Implementation
 * Renders measured SVG glyphs with GSAP stroke-dasharray drawing and fill wipe/fade
 */
function createStrokeText(container, options = {}) {
  const {
    text = 'Draw Attention',
    strokeColor = '#fec601',
    fillColor = '#f0f7fd',
    strokeWidth = 1.6,
    drawDuration = 1.4,
    fillDelay = 0.15,
    stagger = 0.05,
    ease = 'power2.out',
    fillMode = 'wipe',
    fontSize = 72,
    fontWeight = 700,
    letterSpacing = 2,
    reverse = false,
    onComplete = null
  } = options;

  if (!container) return { play: () => {}, kill: () => {} };

  const rawId = Math.random().toString(36).substring(2, 9);
  const wipeId = `stroke-text-wipe-${rawId}`;
  const characters = Array.from(String(text ?? ''));
  const dash = Math.max(fontSize * 7, 200);

  // Use center-anchored text so it is always perfectly balanced and centered
  container.innerHTML = `
    <span class="stroke-text" role="img" aria-label="${text.replace(/"/g, '&quot;')}" style="--stroke-text-height: ${Math.round(fontSize * 1.4)}px">
      <svg class="stroke-text__svg" viewBox="-450 ${-fontSize} 900 ${fontSize * 1.5}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id="${wipeId}" clipPathUnits="userSpaceOnUse">
            <rect class="wipe-rect" x="-450" y="${-fontSize}" width="0" height="${fontSize * 2}" />
          </clipPath>
        </defs>
        <text class="stroke-text__stroke" x="0" y="0" text-anchor="middle" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" style="font-size: ${fontSize}px; font-weight: ${fontWeight}; letter-spacing: ${letterSpacing}px;">
          ${characters.map(ch => `<tspan data-stroke-char>${ch === ' ' ? '&#160;' : ch}</tspan>`).join('')}
        </text>
        <text class="stroke-text__fill" x="0" y="0" text-anchor="middle" fill="${fillColor}" stroke="none" style="font-size: ${fontSize}px; font-weight: ${fontWeight}; letter-spacing: ${letterSpacing}px;" clip-path="${fillMode === 'wipe' ? `url(#${wipeId})` : 'none'}">
          ${characters.map(ch => `<tspan data-fill-char>${ch === ' ' ? '&#160;' : ch}</tspan>`).join('')}
        </text>
      </svg>
    </span>
  `;

  const svg = container.querySelector('.stroke-text__svg');
  const strokeTextElem = container.querySelector('.stroke-text__stroke');
  const wipeRect = container.querySelector('.wipe-rect');
  const strokes = Array.from(container.querySelectorAll('[data-stroke-char]'));
  const fills = Array.from(container.querySelectorAll('[data-fill-char]'));

  let box = { x: -450, y: -fontSize * 0.9, width: 900, height: fontSize * 1.4 };

  const calibrateViewBox = () => {
    try {
      if (strokeTextElem && typeof strokeTextElem.getBBox === 'function') {
        const bbox = strokeTextElem.getBBox();
        if (bbox && bbox.width > 0) {
          const pad = Math.max(Number(strokeWidth) || 2, fontSize * 0.12);
          const halfW = (bbox.width / 2) + pad;
          box = {
            x: -halfW,
            y: bbox.y - pad,
            width: halfW * 2,
            height: bbox.height + pad * 2
          };
          svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
          if (wipeRect) {
            wipeRect.setAttribute('x', box.x);
            wipeRect.setAttribute('y', box.y);
            wipeRect.setAttribute('height', box.height);
          }
        }
      }
    } catch (e) {}
  };

  calibrateViewBox();

  let timeline = null;

  const play = () => {
    if (typeof gsap === 'undefined') {
      container.querySelectorAll('[data-stroke-char]').forEach(s => {
        s.style.strokeDashoffset = '0';
      });
      container.querySelectorAll('[data-fill-char]').forEach(f => {
        f.style.opacity = '1';
      });
      if (onComplete) onComplete();
      return;
    }

    calibrateViewBox();

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig = reverse ? { each: stagger, from: 'end' } : stagger;
    const targets = [...strokes, ...fills, wipeRect].filter(Boolean);

    gsap.killTweensOf(targets);
    gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
    gsap.set(fills, { opacity: useWipe ? 1 : 0 });
    if (wipeRect) gsap.set(wipeRect, { attr: { width: 0 } });

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipeRect) gsap.set(wipeRect, { attr: { width: fillEnabled ? box.width : 0 } });
      if (onComplete) onComplete();
      return;
    }

    timeline = gsap.timeline({
      paused: false,
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    timeline.to(strokes, {
      strokeDashoffset: 0,
      duration: drawDuration,
      ease,
      stagger: staggerConfig
    }, 0);

    if (useWipe && wipeRect) {
      timeline.to(
        wipeRect,
        { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
        drawDuration + fillDelay
      );
    } else if (fillEnabled) {
      timeline.to(
        fills,
        { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
        drawDuration + fillDelay
      );
    }
  };

  const kill = () => {
    if (timeline) timeline.kill();
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf([...strokes, ...fills, wipeRect].filter(Boolean));
    }
  };

  return { play, kill };
}

// Controller for Instrument Intros
const instrumentIntros = {
  vernier: {
    text: 'Vernier Caliper',
    strokeColor: '#3da5d9',
    fillColor: '#f0f7fd',
    containerId: 'vernier-stroke-container',
    overlayId: 'vernier-intro-overlay',
    played: false,
    controller: null
  },
  screw: {
    text: 'Screw Gauge',
    strokeColor: '#fec601',
    fillColor: '#f0f7fd',
    containerId: 'screw-stroke-container',
    overlayId: 'screw-intro-overlay',
    played: false,
    controller: null
  },
  spherometer: {
    text: 'Spherometer',
    strokeColor: '#73bfb8',
    fillColor: '#f0f7fd',
    containerId: 'spherometer-stroke-container',
    overlayId: 'spherometer-intro-overlay',
    played: false,
    controller: null
  }
};

function dismissInstrumentIntro(key) {
  const config = instrumentIntros[key];
  if (!config) return;
  const overlay = document.getElementById(config.overlayId);
  if (overlay) {
    overlay.classList.add('hidden');
  }
  // Resume scrolling once the intro animation completes
  document.body.classList.remove('intro-active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function playInstrumentIntro(key) {
  const config = instrumentIntros[key];
  if (!config) return;

  const overlay = document.getElementById(config.overlayId);
  if (!overlay) return;

  // Scroll to top and lock scrolling so nothing moves during intro animation
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.add('intro-active');

  updateHeaderHeight();
  overlay.classList.remove('hidden');

  // Slight delay to ensure layout has stabilized
  setTimeout(() => {
    updateHeaderHeight();
    if (config.controller) {
      config.controller.kill();
    }
    const container = document.getElementById(config.containerId);
    if (!container) return;

    config.controller = createStrokeText(container, {
      text: config.text,
      strokeColor: config.strokeColor,
      fillColor: config.fillColor,
      strokeWidth: 1.8,
      drawDuration: 1.5,
      fillDelay: 0.18,
      stagger: 0.045,
      ease: 'power2.out',
      fillMode: 'wipe',
      fontSize: 84,
      fontWeight: 700,
      letterSpacing: 3,
      onComplete: () => {
        // Pause briefly so user appreciates the filled title, then reveal the simulator and resume scrolling
        setTimeout(() => {
          dismissInstrumentIntro(key);
        }, 550);
      }
    });

    config.controller.play();
  }, 100);
}

function updateHeaderHeight() {
  const header = document.querySelector('header');
  if (header) {
    const rect = header.getBoundingClientRect();
    const h = Math.round(rect.bottom);
    if (h > 0) {
      document.documentElement.style.setProperty('--header-actual-height', `${h}px`);
    }
  }
}

function initStrokeTextIntros() {
  updateHeaderHeight();
  window.addEventListener('resize', updateHeaderHeight);
}

/**
 * React Bits: BounceCards Component Adapted for Vanilla JS + Text-Based Instrument Cards
 * Features:
 * 1. Initial elastic bounce entrance on page load (gsap.fromTo scale: 0 -> 1 with elastic.out(1, 0.75))
 * 2. enableHover sibling physics: hovering pushes adjacent cards aside (translateX) and levels rotation
 * 3. Text-based internal motion: h3 titles smoothly scale and float with luminous accent glow
 * 4. Elastic click compression & release: tactile spring bounce when an instrument button is selected
 */
let bounceCardsInitialized = false;

function initBounceCardsNav() {
  const container = document.querySelector('.card-grid');
  const cards = Array.from(document.querySelectorAll('.card-nav'));
  if (!container || !cards.length || typeof gsap === 'undefined') return;

  if (bounceCardsInitialized) return;
  bounceCardsInitialized = true;

  // Base transform style for each instrument button (subtle organic angles)
  const baseTransforms = [
    { rotate: -2.5, x: 0, y: 0 },
    { rotate: 1.8,  x: 0, y: 0 },
    { rotate: -1.6, x: 0, y: 0 },
    { rotate: 2.2,  x: 0, y: 0 }
  ];

  // Initial bounce entrance on mount
  cards.forEach((card, i) => {
    card.dataset.cardIdx = i;
    const t = baseTransforms[i] || { rotate: 0, x: 0, y: 0 };
    gsap.set(card, {
      rotation: t.rotate,
      x: t.x,
      y: t.y,
      scale: 0,
      transformOrigin: '50% 50%'
    });
  });

  gsap.to(cards, {
    scale: 1,
    duration: 1.1,
    delay: 0.35,
    stagger: 0.08,
    ease: 'elastic.out(1, 0.65)',
    clearProps: 'scale'
  });

  // Push siblings hover animation (React Bits BounceCards enableHover logic)
  const pushSiblings = (hoveredIdx) => {
    cards.forEach((card, i) => {
      gsap.killTweensOf(card);
      const title = card.querySelector('h3');
      if (title) gsap.killTweensOf(title);

      const base = baseTransforms[i] || { rotate: 0, x: 0, y: 0 };

      if (i === hoveredIdx) {
        // Active hovered card: flattens rotation, lifts up slightly, text glows & scales
        gsap.to(card, {
          rotation: 0,
          x: 0,
          y: -6,
          scale: 1.04,
          borderColor: '#5fc1f0',
          boxShadow: '0 14px 32px rgba(61, 165, 217, 0.4)',
          backgroundColor: 'rgba(18, 48, 76, 0.92)',
          duration: 0.45,
          ease: 'back.out(1.6)',
          overwrite: 'auto'
        });

        if (title) {
          gsap.to(title, {
            scale: 1.08,
            color: '#ffffff',
            letterSpacing: '1.6px',
            textShadow: '0 0 16px rgba(95, 193, 240, 0.8)',
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      } else {
        // Sibling cards: pushed outward horizontally away from hovered card with stagger
        const pushDistance = i < hoveredIdx ? -14 : 14;
        const distIndex = Math.abs(hoveredIdx - i);
        const delay = distIndex * 0.04;

        gsap.to(card, {
          rotation: base.rotate * 1.35,
          x: pushDistance,
          y: 2,
          scale: 0.98,
          borderColor: '#132f4c',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          backgroundColor: 'rgba(9, 23, 38, 0.7)',
          duration: 0.45,
          delay,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        });

        if (title) {
          gsap.to(title, {
            scale: 0.96,
            color: '#73bfb8',
            letterSpacing: '1px',
            textShadow: 'none',
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      }
    });
  };

  const resetSiblings = () => {
    cards.forEach((card, i) => {
      gsap.killTweensOf(card);
      const title = card.querySelector('h3');
      if (title) gsap.killTweensOf(title);

      const base = baseTransforms[i] || { rotate: 0, x: 0, y: 0 };

      gsap.to(card, {
        rotation: base.rotate,
        x: 0,
        y: 0,
        scale: 1,
        borderColor: '#132f4c',
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
        backgroundColor: 'rgba(11, 28, 46, 0.75)',
        duration: 0.5,
        ease: 'elastic.out(1, 0.75)',
        overwrite: 'auto'
      });

      if (title) {
        gsap.to(title, {
          scale: 1,
          color: '#73bfb8',
          letterSpacing: '1px',
          textShadow: 'none',
          duration: 0.35,
          ease: 'power2.out'
        });
      }
    });
  };

  cards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => pushSiblings(idx));
  });

  container.addEventListener('mouseleave', resetSiblings);
}

function handleBounceCardClick(card, onComplete) {
  if (typeof gsap === 'undefined' || !card) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  const title = card.querySelector('h3');

  // Tactile elastic spring click bounce: quick squeeze then snappy elastic recoil
  const tl = gsap.timeline({
    onComplete: () => {
      if (typeof onComplete === 'function') onComplete();
    }
  });

  tl.to(card, {
    scale: 0.92,
    y: 4,
    borderColor: '#fec601',
    boxShadow: '0 0 24px rgba(254, 198, 1, 0.5)',
    duration: 0.12,
    ease: 'power2.in'
  });

  if (title) {
    tl.to(title, {
      scale: 0.93,
      color: '#fed338',
      textShadow: '0 0 14px rgba(254, 198, 1, 0.9)',
      duration: 0.12,
      ease: 'power2.in'
    }, 0);
  }

  tl.to(card, {
    scale: 1.05,
    y: -4,
    duration: 0.35,
    ease: 'elastic.out(1.2, 0.5)'
  });

  if (title) {
    tl.to(title, {
      scale: 1.05,
      duration: 0.35,
      ease: 'elastic.out(1.2, 0.5)'
    }, '-=0.35');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VernierEngine, ScrewEngine, SpherometerEngine };
}



// --- Chakra Yantra Generator Logic ---

document.addEventListener('DOMContentLoaded', () => {
  // 1. Numeric Planet Yantra (Magic Squares)
  const planetSelect = document.getElementById('planet-select');
  const yantraGrid = document.getElementById('yantra-grid');
  const rowSumsDiv = document.getElementById('row-sums');
  const colSumsDiv = document.getElementById('col-sums');
  const diagSum1 = document.getElementById('diag-sum-1');
  const diagSum2 = document.getElementById('diag-sum-2');

  const baseSquare = [
    [8, 1, 6],
    [3, 5, 7],
    [4, 9, 2]
  ];

  function generateMagicSquare(target) {
    const diff = (target / 3) - 5;
    let html = '';
    let rows = [0, 0, 0];
    let cols = [0, 0, 0];
    let d1 = 0;
    let d2 = 0;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const val = baseSquare[i][j] + diff;
        rows[i] += val;
        cols[j] += val;
        if (i === j) d1 += val;
        if (i + j === 2) d2 += val;
        html += `<div class="bg-slate-700/80 text-amber-300 font-bold text-2xl h-16 w-16 md:h-20 md:w-20 flex items-center justify-center rounded border border-slate-600/50 shadow-inner hover:bg-slate-600 transition-colors cursor-default">${val}</div>`;
      }
    }
    
    yantraGrid.innerHTML = html;
    
    rowSumsDiv.innerHTML = rows.map(r => `<div>= ${r}</div>`).join('');
    colSumsDiv.innerHTML = cols.map(c => `<div>${c}</div>`).join('');
    diagSum1.innerHTML = `\\ ${d1}`;
    diagSum2.innerHTML = `${d2} /`;
  }

  if (planetSelect && yantraGrid) {
    planetSelect.addEventListener('change', (e) => {
      generateMagicSquare(parseInt(e.target.value));
    });
    generateMagicSquare(15);
  }

  // 2. Geometric Sri Chakra Yantra
  const sriChakraSvg = document.getElementById('sri-chakra-svg');
  const avaranaList = document.getElementById('avarana-list');
  const infoTitle = document.getElementById('info-title');
  const infoDesc = document.getElementById('info-desc');

  const avaranas = [
    { id: 'bhupura', name: '1. Bhupura', desc: 'The outer earth square with 4 portals. Represents the physical plane and grounding.' },
    { id: 'shodashadala', name: '2. Shodashadala', desc: 'The 16-petaled lotus. Represents fulfillment of all hopes and desires.' },
    { id: 'ashtadala', name: '3. Ashtadala', desc: 'The 8-petaled lotus. Represents the eight fold nature of the subtle body and chakras.' },
    { id: 'chaturdashara', name: '4. Chaturdashara', desc: 'The 14-triangle circuit. Represents the 14 nadis (energy channels) of the body.' },
    { id: 'bahirdashara', name: '5. Bahirdashara', desc: 'The outer 10-triangle circuit. Represents the 10 vital breaths (Pranas).' },
    { id: 'antardashara', name: '6. Antardashara', desc: 'The inner 10-triangle circuit. Represents the 10 aspects of spiritual fire.' },
    { id: 'ashtakona', name: '7. Ashtakona', desc: 'The 8-triangle circuit. Represents the eightfold forms of the divine mother.' },
    { id: 'trikona', name: '8. Trikona', desc: 'The central primal triangle. Represents the trinity of creation, preservation, and dissolution.' },
    { id: 'bindu', name: '9. Bindu', desc: 'The central dimensionless dot. Represents the ultimate unmanifested state of pure consciousness.' }
  ];

  function renderSriChakra() {
    if (!sriChakraSvg) return;
    const cx = 250, cy = 250;
    let svgHtml = '';

    // Simplified geometric representations
    // 1. Bhupura (Outer Square)
    svgHtml += `<rect id="svg-bhupura" class="chakra-layer" x="20" y="20" width="460" height="460" fill="none" stroke="#fbbf24" stroke-width="3" opacity="0.4" />`;
    svgHtml += `<rect x="50" y="50" width="400" height="400" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.3" />`;
    svgHtml += `<rect x="80" y="80" width="340" height="340" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.3" />`;

    // 2. Shodashadala (16 Petals - simple circles)
    svgHtml += `<circle id="svg-shodashadala" class="chakra-layer" cx="${cx}" cy="${cy}" r="160" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="10 5" opacity="0.5" />`;

    // 3. Ashtadala (8 Petals)
    svgHtml += `<circle id="svg-ashtadala" class="chakra-layer" cx="${cx}" cy="${cy}" r="120" fill="none" stroke="#6366f1" stroke-width="4" stroke-dasharray="20 10" opacity="0.6" />`;

    // 4. Chaturdashara (14 triangles)
    svgHtml += `<path id="svg-chaturdashara" class="chakra-layer" d="M250,110 L150,320 L350,320 Z M250,390 L150,180 L350,180 Z" fill="none" stroke="#14b8a6" stroke-width="2" opacity="0.6" />`;

    // 5. Bahirdashara (Outer 10 triangles)
    svgHtml += `<path id="svg-bahirdashara" class="chakra-layer" d="M250,140 L170,290 L330,290 Z M250,360 L170,210 L330,210 Z" fill="none" stroke="#0ea5e9" stroke-width="2" opacity="0.6" />`;

    // 6. Antardashara (Inner 10 triangles)
    svgHtml += `<path id="svg-antardashara" class="chakra-layer" d="M250,165 L190,270 L310,270 Z M250,335 L190,230 L310,230 Z" fill="none" stroke="#8b5cf6" stroke-width="2.5" opacity="0.7" />`;

    // 7. Ashtakona (8 triangles)
    svgHtml += `<path id="svg-ashtakona" class="chakra-layer" d="M250,185 L210,250 L290,250 Z M250,315 L210,250 L290,250 Z" fill="none" stroke="#fbbf24" stroke-width="2.5" opacity="0.8" />`;

    // 8. Trikona (Central Triangle)
    svgHtml += `<polygon id="svg-trikona" class="chakra-layer" points="250,210 230,260 270,260" fill="none" stroke="#f43f5e" stroke-width="3" opacity="0.9" />`;

    // 9. Bindu (Center Dot)
    svgHtml += `<circle id="svg-bindu" class="chakra-layer" cx="${cx}" cy="245" r="4" fill="#fbbf24" stroke="#fcd34d" stroke-width="2" opacity="1" />`;

    sriChakraSvg.innerHTML = svgHtml;

    // Sidebar rendering
    if (avaranaList) {
      avaranaList.innerHTML = avaranas.map(a => `
        <button class="avarana-btn text-left px-4 py-2 bg-slate-800/60 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 rounded text-slate-300 hover:text-amber-300 transition-all text-sm font-medium" data-id="${a.id}">
          ${a.name}
        </button>
      `).join('');
    }

    // Interaction Logic
    const layers = document.querySelectorAll('.chakra-layer');
    const btns = document.querySelectorAll('.avarana-btn');

    function selectAvarana(id) {
      btns.forEach(b => {
        if (b.dataset.id === id) {
          b.classList.add('bg-indigo-900/80', 'border-indigo-400', 'text-amber-400');
          b.classList.remove('bg-slate-800/60', 'border-slate-700', 'text-slate-300');
        } else {
          b.classList.remove('bg-indigo-900/80', 'border-indigo-400', 'text-amber-400');
          b.classList.add('bg-slate-800/60', 'border-slate-700', 'text-slate-300');
        }
      });

      layers.forEach(l => {
        if (l.id === `svg-${id}`) {
          l.setAttribute('stroke', '#fbbf24');
          l.setAttribute('stroke-width', (parseFloat(l.getAttribute('stroke-width')) + 1.5).toString());
          l.setAttribute('opacity', '1');
          l.classList.add('drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]');
        } else {
          // Reset stroke based on original drawing logic
          l.removeAttribute('class');
          l.classList.add('chakra-layer');
          // We won't strictly revert colors here for simplicity, but lower opacity
          l.setAttribute('opacity', '0.2');
        }
      });

      const data = avaranas.find(a => a.id === id);
      if (data) {
        infoTitle.textContent = data.name;
        infoDesc.textContent = data.desc;
        infoTitle.parentElement.classList.add('scale-[1.02]', 'bg-indigo-900/50', 'border-indigo-400');
        setTimeout(() => {
          infoTitle.parentElement.classList.remove('scale-[1.02]');
        }, 300);
      }
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectAvarana(btn.dataset.id);
      });
    });

    layers.forEach(layer => {
      layer.style.cursor = 'pointer';
      layer.addEventListener('click', () => {
        const id = layer.id.replace('svg-', '');
        selectAvarana(id);
      });
      // Add hover effect
      layer.addEventListener('mouseenter', () => {
        layer.setAttribute('opacity', '1');
      });
      layer.addEventListener('mouseleave', () => {
        // Only if not selected
        const activeBtn = document.querySelector('.avarana-btn.bg-indigo-900\\/80');
        if (!activeBtn || activeBtn.dataset.id !== layer.id.replace('svg-', '')) {
          layer.setAttribute('opacity', activeBtn ? '0.2' : '0.6');
        }
      });
    });
  }

  renderSriChakra();

  // --- Smooth Morphed Inverted Circle Cursor ---
  (function initCustomCursor() {
    const cursor = document.getElementById('customCursor');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isMoving = false;
    let scaleX = 1;
    let scaleY = 1;
    let angle = 0;
    let isClicking = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isMoving) {
        currentX = mouseX;
        currentY = mouseY;
        isMoving = true;
        cursor.classList.add('active');
      }

      // Check if hovering over clickable / button / interactive element
      const target = e.target;
      const isInteractive = target && (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('.card-nav') ||
        target.closest('.nav-btn') ||
        target.closest('.interactive-chip') ||
        target.closest('.avarana-btn') ||
        target.closest('[role="button"]') ||
        window.getComputedStyle(target).cursor === 'pointer'
      );

      if (isInteractive) {
        cursor.classList.add('hovered');
      } else {
        cursor.classList.remove('hovered');
      }
    });

    window.addEventListener('mousedown', () => {
      isClicking = true;
      cursor.classList.add('clicked');
    });

    window.addEventListener('mouseup', () => {
      isClicking = false;
      cursor.classList.remove('clicked');
    });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
    });

    document.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
    });

    // Smooth animation loop with spring lerp
    function render() {
      const dx = mouseX - currentX;
      const dy = mouseY - currentY;

      // Smooth position interpolation
      currentX += dx * 0.22;
      currentY += dy * 0.22;

      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  })();
});

