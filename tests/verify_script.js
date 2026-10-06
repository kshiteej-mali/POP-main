const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

if (!scriptContent.includes('const VernierEngine = {')) {
  console.error('FAIL: VernierEngine not found in script.js');
  process.exit(1);
}

if (!scriptContent.includes('const ScrewEngine = {')) {
  console.error('FAIL: ScrewEngine not found in script.js');
  process.exit(1);
}

if (!scriptContent.includes('const SpherometerEngine = {')) {
  console.error('FAIL: SpherometerEngine not found in script.js');
  process.exit(1);
}

global.document = {
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null
};
global.window = {
  addEventListener: () => {}
};

const fn = new Function(scriptContent + '\nreturn { VernierEngine, ScrewEngine, SpherometerEngine };');
const { VernierEngine, ScrewEngine, SpherometerEngine } = fn();

console.log("Checking VernierEngine instance from script.js...");
const res = VernierEngine.calculate(23, 6, 0.2);
console.log("Calculation result for MSR 23, VSD 6, Zero Error +0.2:", res);

if (Math.abs(res.observed - 23.6) > 0.001 || Math.abs(res.corrected - 23.4) > 0.001) {
  console.error("FAIL: Vernier Arithmetic mismatch");
  process.exit(1);
}

const sim = VernierEngine.simulateMeasurement(24.0, 0.2);
console.log("Simulation for 24.0mm cylinder with +0.2mm error:", sim);
if (!sim.isTrue || Math.abs(sim.corrected - 24.0) > 0.001) {
  console.error("FAIL: Vernier Simulation mismatch");
  process.exit(1);
}

console.log("\nChecking ScrewEngine instance from script.js...");
const screwRes = ScrewEngine.calculate(5, 25, 0.02, 1.0, 100);
console.log("Calculation result for MSR 5mm, CSR 25, Zero Error +0.02mm:", screwRes);

if (Math.abs(screwRes.observed - 5.25) > 0.001 || Math.abs(screwRes.corrected - 5.23) > 0.001) {
  console.error("FAIL: Screw Gauge Arithmetic mismatch");
  process.exit(1);
}

const screwSim = ScrewEngine.simulateMeasurement(3.50, 0.02, 1.0, 100);
console.log("Simulation for 3.50mm reading with +0.02mm error:", screwSim);
if (!screwSim.isTrue || Math.abs(screwSim.corrected - 3.50) > 0.001) {
  console.error("FAIL: Screw Gauge Simulation mismatch");
  process.exit(1);
}

console.log("\nChecking SpherometerEngine instance from script.js...");
const sphRes = SpherometerEngine.calculate(2, 30, 0.05, 1.0, 100, 30);
console.log("Calculation result for MSR 2mm, CSR 30, Zero Error +0.05mm, l=30mm:", sphRes);

if (Math.abs(sphRes.observedH - 2.30) > 0.001 || Math.abs(sphRes.correctedH - 2.25) > 0.001 || Math.abs(sphRes.radiusOfCurvature - 67.79) > 0.05) {
  console.error("FAIL: Spherometer Arithmetic mismatch");
  process.exit(1);
}

const sphSim = SpherometerEngine.simulateMeasurement(2.25, 0.05, 30, 1.0, 100);
console.log("Simulation for 2.25mm height with +0.05mm error:", sphSim);
if (!sphSim.isTrue || Math.abs(sphSim.correctedH - 2.25) > 0.001) {
  console.error("FAIL: Spherometer Simulation mismatch");
  process.exit(1);
}

console.log("\nALL SCRIPT.JS BACKEND ENGINE CHECKS (VERNIER, SCREW GAUGE & SPHEROMETER) PASSED!");


