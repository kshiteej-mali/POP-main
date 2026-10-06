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

const testCases = [
  {
    name: "Standard Textbook Reading (MSR=5mm, CSR=25, Error=+0.02mm)",
    msr: 5,
    csr: 25,
    zeroError: 0.02,
    pitch: 1.0,
    divisions: 100,
    expectedObserved: 5.25,
    expectedCorrected: 5.23
  },
  {
    name: "Default Simulator Preset (MSR=3mm, CSR=50, Zero Error=0.0mm)",
    msr: 3,
    csr: 50,
    zeroError: 0,
    pitch: 1.0,
    divisions: 100,
    expectedObserved: 3.50,
    expectedCorrected: 3.50
  },
  {
    name: "Positive Zero Error (+0.04mm) Compensation",
    msr: 8,
    csr: 15,
    zeroError: 0.04,
    pitch: 1.0,
    divisions: 100,
    expectedObserved: 8.15,
    expectedCorrected: 8.11
  },
  {
    name: "Negative Zero Error (-0.03mm) Compensation",
    msr: 4,
    csr: 72,
    zeroError: -0.03,
    pitch: 1.0,
    divisions: 100,
    expectedObserved: 4.72,
    expectedCorrected: 4.75
  },
  {
    name: "Zero Opening with Positive Zero Error (+0.03mm)",
    msr: 0,
    csr: 3,
    zeroError: 0.03,
    pitch: 1.0,
    divisions: 100,
    expectedObserved: 0.03,
    expectedCorrected: 0.00
  },
  {
    name: "Custom Micrometer Pitch (Pitch=0.5mm, Div=50 -> LC=0.01mm)",
    msr: 2.5,
    csr: 30,
    zeroError: 0.01,
    pitch: 0.5,
    divisions: 50,
    expectedObserved: 2.80,
    expectedCorrected: 2.79
  },
  {
    name: "Developer Test: Clamped Steel Ball (True: 4.28mm, Error: +0.02mm)",
    simulation: { trueThickness: 4.28, zeroError: 0.02, pitch: 1.0, divisions: 100 }
  },
  {
    name: "Developer Test: Copper Wire Gauge (True: 1.35mm, Error: -0.02mm)",
    simulation: { trueThickness: 1.35, zeroError: -0.02, pitch: 1.0, divisions: 100 }
  },
  {
    name: "Developer Test: Glass Plate Thickness (True: 2.50mm, Error: 0.00mm)",
    simulation: { trueThickness: 2.50, zeroError: 0.00, pitch: 1.0, divisions: 100 }
  }
];

function runTests() {
  console.log("=================================================");
  console.log("  SCREW GAUGE METROLOGY DEVELOPER TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = testCases.length;

  testCases.forEach((tc, idx) => {
    let success = false;
    let details = "";

    if (tc.simulation) {
      const res = ScrewEngine.simulateMeasurement(
        tc.simulation.trueThickness,
        tc.simulation.zeroError,
        tc.simulation.pitch,
        tc.simulation.divisions
      );
      success = res.isTrue;
      details = `True: ${tc.simulation.trueThickness}mm | Error: ${tc.simulation.zeroError}mm -> Observed: ${res.observed}mm, Corrected: ${res.corrected}mm (Match: ${res.isTrue})`;
    } else {
      const res = ScrewEngine.calculate(tc.msr, tc.csr, tc.zeroError, tc.pitch, tc.divisions);
      const obsMatch = Math.abs(res.observed - tc.expectedObserved) < 0.001;
      const corrMatch = Math.abs(res.corrected - tc.expectedCorrected) < 0.001;
      success = obsMatch && corrMatch;
      details = `MSR: ${tc.msr}mm, CSR: ${tc.csr} (p=${tc.pitch}, d=${tc.divisions}), Error: ${tc.zeroError}mm -> Observed: ${res.observed}mm (Exp: ${tc.expectedObserved}), Corrected: ${res.corrected}mm (Exp: ${tc.expectedCorrected})`;
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
  console.log(`RESULTS: ${passed}/${total} Screw Gauge Tests Passed (${passed === total ? 'ALL METROLOGY TESTS VERIFIED' : 'FAILURES DETECTED'})`);
  console.log(`=================================================`);

  if (typeof process !== 'undefined' && process.exit) {
    process.exit(passed === total ? 0 : 1);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrewEngine, testCases, runTests };
}

if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
