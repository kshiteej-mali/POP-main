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

const testCases = [
  {
    name: "SLA Instructions Example: Curved Lens (MSR=2mm, CSR=30, Error=+0.05mm, l=30mm)",
    msr: 2,
    csr: 30,
    zeroError: 0.05,
    pitch: 1.0,
    divisions: 100,
    legDistance: 30,
    expectedObserved: 2.30,
    expectedCorrected: 2.25,
    expectedR: 67.79
  },
  {
    name: "Flat Plane Baseline (h=0mm -> R=Infinity)",
    msr: 0,
    csr: 0,
    zeroError: 0,
    pitch: 1.0,
    divisions: 100,
    legDistance: 50,
    expectedObserved: 0.00,
    expectedCorrected: 0.00,
    expectedR: Infinity
  },
  {
    name: "Positive Zero Error (+0.04mm) Compensation",
    msr: 3,
    csr: 24,
    zeroError: 0.04,
    pitch: 1.0,
    divisions: 100,
    legDistance: 50,
    expectedObserved: 3.24,
    expectedCorrected: 3.20,
    expectedR: 131.81
  },
  {
    name: "Negative Zero Error (-0.03mm) Compensation",
    msr: 1,
    csr: 47,
    zeroError: -0.03,
    pitch: 1.0,
    divisions: 100,
    legDistance: 40,
    expectedObserved: 1.47,
    expectedCorrected: 1.50,
    expectedR: 178.53
  },
  {
    name: "Developer Test: Convex Watch Glass (True h: 3.50mm, Error: +0.02mm, l: 45mm)",
    simulation: { trueHeight: 3.50, zeroError: 0.02, legDistance: 45, pitch: 1.0, divisions: 100 }
  },
  {
    name: "Developer Test: Concave Mirror Sagitta (True h: 1.25mm, Error: -0.02mm, l: 40mm)",
    simulation: { trueHeight: 1.25, zeroError: -0.02, legDistance: 40, pitch: 1.0, divisions: 100 }
  },
  {
    name: "Developer Test: Spherical Surface (True h: 2.80mm, Error: 0.00mm, l: 50mm)",
    simulation: { trueHeight: 2.80, zeroError: 0.00, legDistance: 50, pitch: 1.0, divisions: 100 }
  }
];

function runTests() {
  console.log("=================================================");
  console.log("  SPHEROMETER METROLOGY DEVELOPER TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = testCases.length;

  testCases.forEach((tc, idx) => {
    let success = false;
    let details = "";

    if (tc.simulation) {
      const res = SpherometerEngine.simulateMeasurement(
        tc.simulation.trueHeight,
        tc.simulation.zeroError,
        tc.simulation.legDistance,
        tc.simulation.pitch,
        tc.simulation.divisions
      );
      success = res.isTrue;
      details = `True h: ${tc.simulation.trueHeight}mm | Error: ${tc.simulation.zeroError}mm -> Observed: ${res.observedH}mm, Corrected: ${res.correctedH}mm, R: ${res.radiusOfCurvature}mm (Match: ${res.isTrue})`;
    } else {
      const res = SpherometerEngine.calculate(tc.msr, tc.csr, tc.zeroError, tc.pitch, tc.divisions, tc.legDistance);
      const obsMatch = Math.abs(res.observedH - tc.expectedObserved) < 0.001;
      const corrMatch = Math.abs(res.correctedH - tc.expectedCorrected) < 0.001;
      const rMatch = (tc.expectedR === Infinity) ? (res.radiusOfCurvature === Infinity) : Math.abs(res.radiusOfCurvature - tc.expectedR) < 0.05;
      success = obsMatch && corrMatch && rMatch;
      details = `MSR: ${tc.msr}mm, CSR: ${tc.csr}, Error: ${tc.zeroError}mm -> Observed h: ${res.observedH}mm, Corrected h: ${res.correctedH}mm, R: ${res.radiusOfCurvature}mm (Exp R: ${tc.expectedR})`;
    }

    if (success) {
      passed++;
      console.log(`[PASS] Test ${idx + 1}: ${tc.name}`);
      console.log(`       ${details}`);
    } else {
      console.error(`[FAIL] Test ${idx + 1}: ${tc.name}`);
      console.error(`       ${details}`);
    }
  });

  console.log(`\n=================================================`);
  console.log(`RESULTS: ${passed}/${total} Spherometer Tests Passed (${passed === total ? 'ALL METROLOGY TESTS VERIFIED' : 'FAILURES DETECTED'})`);
  console.log(`=================================================`);

  if (typeof process !== 'undefined' && process.exit) {
    process.exit(passed === total ? 0 : 1);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpherometerEngine, testCases, runTests };
}

if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
