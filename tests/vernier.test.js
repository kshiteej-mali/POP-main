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

const testCases = [
  {
    name: "Standard Measurement (Zero Error = 0)",
    msr: 23,
    vsd: 6,
    zeroError: 0,
    expectedObserved: 23.6,
    expectedCorrected: 23.6
  },
  {
    name: "Positive Zero Error (+0.2 mm) Compensation",
    msr: 23,
    vsd: 8,
    zeroError: 0.2,
    expectedObserved: 23.8,
    expectedCorrected: 23.6
  },
  {
    name: "Negative Zero Error (-0.3 mm) Compensation",
    msr: 23,
    vsd: 3,
    zeroError: -0.3,
    expectedObserved: 23.3,
    expectedCorrected: 23.6
  },
  {
    name: "Zero Thickness with Positive Error (+0.4 mm)",
    msr: 0,
    vsd: 4,
    zeroError: 0.4,
    expectedObserved: 0.4,
    expectedCorrected: 0.0
  },
  {
    name: "Test Object: Cylinder Outer Diameter (True: 24.0 mm, Error: +0.2 mm)",
    simulation: { trueThickness: 24.0, zeroError: 0.2 }
  },
  {
    name: "Test Object: Cylinder Inner Diameter (True: 16.0 mm, Error: -0.1 mm)",
    simulation: { trueThickness: 16.0, zeroError: -0.1 }
  },
  {
    name: "Test Object: Wooden Block (True: 42.5 mm, Error: 0.0 mm)",
    simulation: { trueThickness: 42.5, zeroError: 0.0 }
  },
  {
    name: "Test Object: Acrylic Block (True: 30.0 mm, Error: -0.2 mm)",
    simulation: { trueThickness: 30.0, zeroError: -0.2 }
  }
];

function runTests() {
  console.log("=================================================");
  console.log(" VERNIER CALIPER METROLOGY & SIMULATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = testCases.length;

  testCases.forEach((tc, idx) => {
    let success = false;
    let details = "";

    if (tc.simulation) {
      const res = VernierEngine.simulateMeasurement(tc.simulation.trueThickness, tc.simulation.zeroError);
      success = res.isTrue;
      details = `True: ${tc.simulation.trueThickness}mm | Error: ${tc.simulation.zeroError}mm -> Observed: ${res.observed}mm, Corrected: ${res.corrected}mm (Match: ${res.isTrue})`;
    } else {
      const res = VernierEngine.calculate(tc.msr, tc.vsd, tc.zeroError);
      const obsMatch = Math.abs(res.observed - tc.expectedObserved) < 0.001;
      const corrMatch = Math.abs(res.corrected - tc.expectedCorrected) < 0.001;
      success = obsMatch && corrMatch;
      details = `MSR: ${tc.msr}mm, VSD: ${tc.vsd}, Error: ${tc.zeroError}mm -> Observed: ${res.observed}mm (Expected: ${tc.expectedObserved}), Corrected: ${res.corrected}mm (Expected: ${tc.expectedCorrected})`;
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
  console.log(`RESULTS: ${passed}/${total} Tests Passed (${passed === total ? 'ALL READINGS ARE TRUE & VERIFIED' : 'FAILURES DETECTED'})`);
  console.log(`=================================================`);

  if (typeof process !== 'undefined' && process.exit) {
    process.exit(passed === total ? 0 : 1);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VernierEngine, testCases, runTests };
}

if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
