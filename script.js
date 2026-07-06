const $ = (id) => document.getElementById(id);

/* ---------- Molecular canvas animation: corrected didactic storyboard ---------- */

const molecularCanvas = $("molecularCanvas");
const mctx = molecularCanvas.getContext("2d");

let molecularRunning = true;
let showLabels = true;
let selectedScene = "auto";
let molecularTime = 0;

const sceneText = {
  auto: {
    title: "Dissolução animada do NaCl",
    text: "<p><strong>Observe a sequência:</strong> primeiro há uma rede cristalina; depois a água polar se orienta na superfície; em seguida íons de superfície se separam; por fim, Na⁺ e Cl⁻ ficam hidratados.</p>"
  },
  crystal: {
    title: "1. Cristal iônico",
    text: "<p><strong>Rede cristalina:</strong> Na⁺ e Cl⁻ estão alternados e presos por atrações eletrostáticas. No desenho, a dissolução começa pelos íons da superfície.</p>"
  },
  water: {
    title: "2. Água polar se aproxima",
    text: "<p><strong>Orientação da água:</strong> o oxigênio, parcialmente negativo, aponta para Na⁺. Os hidrogênios, parcialmente positivos, apontam para Cl⁻.</p>"
  },
  release: {
    title: "3. Íons saem da superfície",
    text: "<p><strong>Dissociação:</strong> moléculas de água estabilizam os íons expostos. Isso favorece a saída de Na⁺ e Cl⁻ da rede cristalina.</p>"
  },
  hydrated: {
    title: "4. Íons hidratados",
    text: "<p><strong>Hidratação:</strong> os íons ficam cercados por moléculas de água orientadas. A solução contém íons móveis, o que explica sua condutividade.</p>"
  },
  naZoom: {
    title: "Zoom — Na⁺ hidratado",
    text: "<p><strong>Na⁺:</strong> a parte mais negativa da água é o oxigênio. Por isso, o oxigênio fica voltado para o cátion.</p>"
  },
  clZoom: {
    title: "Zoom — Cl⁻ hidratado",
    text: "<p><strong>Cl⁻:</strong> as regiões parcialmente positivas da água são os hidrogênios. Por isso, os hidrogênios ficam voltados para o ânion.</p>"
  }
};

function setMolecularScene(scene) {
  selectedScene = scene;
  molecularTime = 0;
  $("molecularTitle").textContent = sceneText[scene].title;
  $("sceneText").innerHTML = sceneText[scene].text;
  document.querySelectorAll(".scene-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.scene === scene);
  });
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function ease(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
function lerp(a, b, t) { return a + (b - a) * t; }

function clearMolecularCanvas() {
  const w = molecularCanvas.width;
  const h = molecularCanvas.height;
  mctx.clearRect(0, 0, w, h);
  const bg = mctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#17304d");
  bg.addColorStop(1, "#102236");
  mctx.fillStyle = bg;
  mctx.fillRect(0, 0, w, h);

  // subtle water-like background
  for (let i = 0; i < 35; i++) {
    const x = (Math.sin(i * 18.17) * 0.5 + 0.5) * w;
    const y = (Math.sin(i * 7.31 + 1.4) * 0.5 + 0.5) * h;
    mctx.fillStyle = "rgba(160,220,255,0.045)";
    mctx.beginPath();
    mctx.arc(x, y, 2.2, 0, Math.PI * 2);
    mctx.fill();
  }
}

function drawTextLabel(text, x, y, color = "#eaf6ff", size = 16, align = "center") {
  mctx.save();
  mctx.fillStyle = color;
  mctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  mctx.textAlign = align;
  mctx.textBaseline = "middle";
  mctx.fillText(text, x, y);
  mctx.restore();
}

function drawBadge(text, x, y) {
  mctx.save();
  mctx.font = "800 14px Inter, system-ui, sans-serif";
  const pad = 12;
  const width = mctx.measureText(text).width + pad * 2;
  mctx.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(x - width / 2, y - 18, width, 36, 18, true, false);
  mctx.fillStyle = "#17304d";
  mctx.textAlign = "center";
  mctx.textBaseline = "middle";
  mctx.fillText(text, x, y);
  mctx.restore();
}

function roundRect(x, y, w, h, r, fill = true, stroke = false) {
  mctx.beginPath();
  mctx.moveTo(x + r, y);
  mctx.arcTo(x + w, y, x + w, y + h, r);
  mctx.arcTo(x + w, y + h, x, y + h, r);
  mctx.arcTo(x, y + h, x, y, r);
  mctx.arcTo(x, y, x + w, y, r);
  mctx.closePath();
  if (fill) mctx.fill();
  if (stroke) mctx.stroke();
}

function sphere(x, y, r, color, label = "", alpha = 1) {
  const g = mctx.createRadialGradient(x - r * 0.38, y - r * 0.38, r * 0.15, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.18, color);
  g.addColorStop(1, "rgba(0,0,0,0.52)");
  mctx.save();
  mctx.globalAlpha = alpha;
  mctx.fillStyle = g;
  mctx.beginPath();
  mctx.arc(x, y, r, 0, Math.PI * 2);
  mctx.fill();
  mctx.restore();

  if (label && showLabels) {
    mctx.save();
    mctx.fillStyle = "#ffffff";
    mctx.font = `800 ${Math.max(12, r * 0.58)}px Inter, system-ui, sans-serif`;
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    mctx.fillText(label, x, y);
    mctx.restore();
  }
}

function drawDashedLine(x1, y1, x2, y2, color = "rgba(106, 210, 255, .55)") {
  mctx.save();
  mctx.strokeStyle = color;
  mctx.lineWidth = 2.4;
  mctx.setLineDash([7, 8]);
  mctx.beginPath();
  mctx.moveTo(x1, y1);
  mctx.lineTo(x2, y2);
  mctx.stroke();
  mctx.restore();
}

function drawArrow(x1, y1, x2, y2, color = "rgba(255,255,255,.55)") {
  const a = Math.atan2(y2 - y1, x2 - x1);
  mctx.save();
  mctx.strokeStyle = color;
  mctx.fillStyle = color;
  mctx.lineWidth = 2.5;
  mctx.beginPath();
  mctx.moveTo(x1, y1);
  mctx.lineTo(x2, y2);
  mctx.stroke();
  mctx.beginPath();
  mctx.moveTo(x2, y2);
  mctx.lineTo(x2 - 12 * Math.cos(a - 0.5), y2 - 12 * Math.sin(a - 0.5));
  mctx.lineTo(x2 - 12 * Math.cos(a + 0.5), y2 - 12 * Math.sin(a + 0.5));
  mctx.closePath();
  mctx.fill();
  mctx.restore();
}

function drawWaterMolecule(x, y, angle, scale = 1, label = false, alpha = 1) {
  // Oxygen at x,y; hydrogens are drawn with real bent geometry around angle.
  const oh = 21 * scale;
  const theta = 0.92;
  const h1 = { x: x + Math.cos(angle + theta) * oh, y: y + Math.sin(angle + theta) * oh };
  const h2 = { x: x + Math.cos(angle - theta) * oh, y: y + Math.sin(angle - theta) * oh };

  mctx.save();
  mctx.globalAlpha = alpha;
  mctx.strokeStyle = "rgba(230,248,255,.9)";
  mctx.lineWidth = 2.2 * scale;
  mctx.beginPath();
  mctx.moveTo(x, y);
  mctx.lineTo(h1.x, h1.y);
  mctx.moveTo(x, y);
  mctx.lineTo(h2.x, h2.y);
  mctx.stroke();
  mctx.restore();

  sphere(x, y, 8.2 * scale, "#e84135", label ? "O" : "", alpha);
  sphere(h1.x, h1.y, 5.3 * scale, "#f4f7fb", label ? "H" : "", alpha);
  sphere(h2.x, h2.y, 5.3 * scale, "#f4f7fb", label ? "H" : "", alpha);
}

function drawWaterTowardNa(ionX, ionY, angle, distance, scale = 1, alpha = 1) {
  // O closer to Na+, hydrogens outward.
  const ox = ionX + Math.cos(angle) * distance;
  const oy = ionY + Math.sin(angle) * distance;
  drawDashedLine(ionX, ionY, ox, oy);
  drawWaterMolecule(ox, oy, angle, scale, true, alpha);
}

function drawWaterTowardCl(ionX, ionY, angle, distance, scale = 1, alpha = 1) {
  // H atoms closer to Cl-. O sits farther out; water points inward.
  const ox = ionX + Math.cos(angle) * distance;
  const oy = ionY + Math.sin(angle) * distance;
  drawDashedLine(ionX, ionY, ox - Math.cos(angle) * 14 * scale, oy - Math.sin(angle) * 14 * scale);
  drawWaterMolecule(ox, oy, angle + Math.PI, scale, true, alpha);
}

function drawCrystalBlock(surfaceNa, surfaceCl, releaseProgress) {
  const startX = 170;
  const startY = 165;
  const spacing = 54;
  const rows = 5;
  const cols = 5;
  const skipNa = releaseProgress > 0.02;
  const skipCl = releaseProgress > 0.02;

  // shadows/depth rows
  for (let layer = 2; layer >= 0; layer--) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacing + layer * 13;
        const y = startY + r * spacing - layer * 12;
        const isNa = (r + c + layer) % 2 === 0;
        const isSurfaceNa = layer === 0 && r === 1 && c === 4;
        const isSurfaceCl = layer === 0 && r === 3 && c === 4;
        if ((isSurfaceNa && skipNa) || (isSurfaceCl && skipCl)) continue;
        const alpha = layer === 0 ? 1 : 0.48;
        sphere(x, y, isNa ? 18 : 23, isNa ? "#7c4dff" : "#20a85e", isNa ? "Na⁺" : "Cl⁻", alpha);
      }
    }
  }

  // mark surface ions when still attached
  if (releaseProgress < 0.03) {
    drawBadge("superfície do cristal", surfaceNa.x + 15, surfaceNa.y - 65);
    drawArrow(surfaceNa.x + 20, surfaceNa.y - 48, surfaceNa.x, surfaceNa.y - 10, "rgba(255,255,255,.35)");
  }
}

function drawApproachingWaters(t, surfaceNa, surfaceCl) {
  const waters = [
    { target: surfaceNa, kind: "Na", angle: 0.1, sx: 755, sy: 118 },
    { target: surfaceNa, kind: "Na", angle: -0.7, sx: 720, sy: 245 },
    { target: surfaceCl, kind: "Cl", angle: 0.4, sx: 775, sy: 350 },
    { target: surfaceCl, kind: "Cl", angle: -0.3, sx: 720, sy: 470 }
  ];
  waters.forEach((w, i) => {
    const local = ease(t);
    const tx = w.target.x + Math.cos(w.angle) * 66;
    const ty = w.target.y + Math.sin(w.angle) * 54;
    const x = lerp(w.sx, tx, local);
    const y = lerp(w.sy, ty, local);
    if (w.kind === "Na") {
      drawWaterMolecule(x, y, w.angle, 0.92, true, 0.95);
      if (t > 0.75) drawDashedLine(w.target.x, w.target.y, x, y);
    } else {
      drawWaterMolecule(x, y, w.angle + Math.PI, 0.92, true, 0.95);
      if (t > 0.75) drawDashedLine(w.target.x, w.target.y, x - Math.cos(w.angle) * 12, y - Math.sin(w.angle) * 12);
    }
  });
}

function drawHydratedIon(ionX, ionY, type, shellT = 1) {
  const isNa = type === "Na";
  sphere(ionX, ionY, isNa ? 26 : 31, isNa ? "#7c4dff" : "#20a85e", isNa ? "Na⁺" : "Cl⁻");
  const n = 6;
  for (let i = 0; i < n; i++) {
    const angle = i * Math.PI * 2 / n + molecularTime * 0.18;
    const dist = lerp(42, isNa ? 76 : 86, shellT);
    const alpha = 0.25 + 0.75 * shellT;
    if (isNa) drawWaterTowardNa(ionX, ionY, angle, dist, 0.88, alpha);
    else drawWaterTowardCl(ionX, ionY, angle, dist, 0.88, alpha);
  }
}

function phaseFromAuto() {
  const cycle = (molecularTime % 16) / 16;
  if (cycle < 0.23) return { scene: "crystal", t: cycle / 0.23 };
  if (cycle < 0.48) return { scene: "water", t: (cycle - 0.23) / 0.25 };
  if (cycle < 0.72) return { scene: "release", t: (cycle - 0.48) / 0.24 };
  return { scene: "hydrated", t: (cycle - 0.72) / 0.28 };
}

function drawScene() {
  clearMolecularCanvas();
  const surfaceNa = { x: 170 + 4 * 54, y: 165 + 1 * 54 };
  const surfaceCl = { x: 170 + 4 * 54, y: 165 + 3 * 54 };

  let phase;
  if (selectedScene === "auto") phase = phaseFromAuto();
  else if (selectedScene === "crystal") phase = { scene: "crystal", t: 0 };
  else if (selectedScene === "water") phase = { scene: "water", t: 1 };
  else if (selectedScene === "release") phase = { scene: "release", t: 1 };
  else if (selectedScene === "hydrated") phase = { scene: "hydrated", t: 1 };

  if (selectedScene === "naZoom") {
    drawBadge("Oxigênio voltado para Na⁺", molecularCanvas.width / 2, 58);
    drawHydratedIon(molecularCanvas.width / 2, molecularCanvas.height / 2 + 18, "Na", 1);
    drawTextLabel("O δ−", molecularCanvas.width / 2 - 128, molecularCanvas.height / 2 - 102, "#ffccc7", 16);
    return;
  }

  if (selectedScene === "clZoom") {
    drawBadge("Hidrogênios voltados para Cl⁻", molecularCanvas.width / 2, 58);
    drawHydratedIon(molecularCanvas.width / 2, molecularCanvas.height / 2 + 18, "Cl", 1);
    drawTextLabel("H δ+", molecularCanvas.width / 2 - 128, molecularCanvas.height / 2 - 102, "#ffffff", 16);
    return;
  }

  const releaseProgress = phase.scene === "release" ? ease(phase.t) : (phase.scene === "hydrated" ? 1 : 0);
  drawCrystalBlock(surfaceNa, surfaceCl, releaseProgress);

  if (phase.scene === "crystal") {
    drawBadge("rede iônica organizada", 440, 72);
  }

  if (phase.scene === "water") {
    drawBadge("água polar se orienta", 560, 72);
    drawApproachingWaters(phase.t, surfaceNa, surfaceCl);
  }

  if (phase.scene === "release" || phase.scene === "hydrated") {
    const t = phase.scene === "release" ? ease(phase.t) : 1;
    const naX = lerp(surfaceNa.x, 650, t);
    const naY = lerp(surfaceNa.y, 195, t);
    const clX = lerp(surfaceCl.x, 650, t);
    const clY = lerp(surfaceCl.y, 365, t);

    if (t < 1) {
      drawArrow(surfaceNa.x + 34, surfaceNa.y - 12, naX - 30, naY, "rgba(255,255,255,.48)");
      drawArrow(surfaceCl.x + 34, surfaceCl.y + 10, clX - 34, clY, "rgba(255,255,255,.48)");
      sphere(naX, naY, 24, "#7c4dff", "Na⁺");
      sphere(clX, clY, 29, "#20a85e", "Cl⁻");
      drawApproachingWaters(1, { x: naX, y: naY }, { x: clX, y: clY });
      drawBadge("íons deixam a superfície", 610, 72);
    } else {
      drawBadge("íons hidratados em solução", 620, 72);
      drawHydratedIon(620, 200, "Na", 1);
      drawHydratedIon(620, 380, "Cl", 1);
    }
  }
}

function drawMolecularCanvas() {
  drawScene();
  if (molecularRunning) molecularTime += 0.035;
  requestAnimationFrame(drawMolecularCanvas);
}

document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMolecularScene(btn.dataset.scene));
});

$("playMolecular").addEventListener("click", () => {
  molecularRunning = !molecularRunning;
  $("playMolecular").textContent = molecularRunning ? "Pausar animação" : "Reproduzir animação";
});

$("labelsToggle").addEventListener("click", () => {
  showLabels = !showLabels;
  $("labelsToggle").textContent = showLabels ? "Ocultar rótulos" : "Mostrar rótulos";
});

setMolecularScene("auto");
drawMolecularCanvas();

/* ---------- Simulation ---------- */

const sim = {
  saltMass: $("saltMass"),
  waterMass: $("waterMass"),
  temperature: $("temperature"),
  agitation: $("agitation"),
  grainSize: $("grainSize"),
  saltMassValue: $("saltMassValue"),
  waterMassValue: $("waterMassValue"),
  temperatureValue: $("temperatureValue"),
  agitationValue: $("agitationValue"),
  start: $("startSim"),
  pause: $("pauseSim"),
  reset: $("resetSim"),
  resetMessage: $("resetMessage"),
  liquid: $("liquid"),
  particleLayer: $("particleLayer"),
  solidLayer: $("solidLayer"),
  timeValue: $("timeValue"),
  stateValue: $("stateValue"),
  capacityValue: $("capacityValue"),
  dissolvedValue: $("dissolvedValue"),
  solidNowValue: $("solidNowValue"),
  excessValue: $("excessValue"),
  saturationValue: $("saturationValue"),
  concentrationValue: $("concentrationValue"),
  conductivityValue: $("conductivityValue"),
  dynamicExplanation: $("dynamicExplanation"),
  kineticsChart: $("kineticsChart"),
  solubilityChart: $("solubilityChart")
};

let running = false;
let interval = null;
let simTime = 0;
let dissolved = 0;
let history = [];
const grainFactors = { fine: 1.35, medium: 1.0, coarse: 0.68 };

function fmt(n, d = 1) {
  return n.toFixed(d).replace(".", ",");
}

function getInputs() {
  return {
    salt: Number(sim.saltMass.value),
    water: Number(sim.waterMass.value),
    temp: Number(sim.temperature.value),
    agitation: Number(sim.agitation.value),
    grain: sim.grainSize.value
  };
}

function solubilityPer100(temp) {
  return 35.7 + (39.2 - 35.7) * (temp / 100);
}

function capacity() {
  const x = getInputs();
  return solubilityPer100(x.temp) * (x.water / 100);
}

function targetDissolved() {
  const x = getInputs();
  return Math.min(x.salt, capacity());
}

function excessAtEquilibrium() {
  const x = getInputs();
  return Math.max(0, x.salt - capacity());
}

function syncLabels() {
  const x = getInputs();
  sim.saltMassValue.textContent = x.salt;
  sim.waterMassValue.textContent = x.water;
  sim.temperatureValue.textContent = x.temp;
  sim.agitationValue.textContent = x.agitation;
}

function resetSimulation(withMessage = false) {
  clearInterval(interval);
  interval = null;
  running = false;
  simTime = 0;
  dissolved = 0;
  history = [];
  updateSimulation();

  if (withMessage) {
    sim.resetMessage.textContent = "Experimento reiniciado para evitar estados fisicamente incoerentes.";
    clearTimeout(resetSimulation.tid);
    resetSimulation.tid = setTimeout(() => sim.resetMessage.textContent = "", 3200);
  }
}

function startSimulation() {
  if (running) return;
  running = true;
  interval = setInterval(stepSimulation, 110);
  updateSimulation();
}

function pauseSimulation() {
  clearInterval(interval);
  interval = null;
  running = false;
  updateSimulation();
}

function stepSimulation() {
  const x = getInputs();
  const target = targetDissolved();

  const tempFactor = 0.78 + (x.temp / 100) * 0.54;
  const agitationFactor = 0.62 + (x.agitation / 100) * 0.75;
  const grainFactor = grainFactors[x.grain];

  const remainingFraction = Math.max((target - dissolved) / Math.max(target, 1), 0.02);
  const k = 0.052 * tempFactor * agitationFactor * grainFactor * remainingFraction;

  dissolved += (target - dissolved) * k * 2.1;
  if (dissolved > target || Math.abs(target - dissolved) < 0.03) {
    dissolved = target;
  }

  simTime += 0.11;
  history.push({ t: simTime, m: dissolved });
  if (history.length > 340) history.shift();

  if (dissolved >= target) pauseSimulation();
  updateSimulation();
}

function updateMetrics() {
  const x = getInputs();
  const cap = capacity();
  const target = targetDissolved();
  const solidNow = Math.max(0, x.salt - dissolved);
  const excess = excessAtEquilibrium();
  const saturation = cap > 0 ? Math.min((dissolved / cap) * 100, 100) : 0;
  const concentration = (dissolved / 58.44) / (x.water / 1000);
  const conductivity = Math.min(dissolved / Math.max(cap, 0.001), 1);

  sim.timeValue.textContent = `${fmt(simTime)} s`;
  sim.stateValue.textContent = running ? "Dissolvendo" : (simTime === 0 ? "Pronto" : (dissolved >= target ? "Equilíbrio" : "Pausado"));
  sim.capacityValue.textContent = `${fmt(cap)} g`;
  sim.dissolvedValue.textContent = `${fmt(dissolved)} g`;
  sim.solidNowValue.textContent = `${fmt(solidNow)} g`;
  sim.excessValue.textContent = `${fmt(excess)} g`;
  sim.saturationValue.textContent = `${fmt(saturation, 0)} %`;
  sim.concentrationValue.textContent = `${fmt(concentration, 2)} mol/L`;
  sim.conductivityValue.textContent = conductivity.toFixed(2).replace(".", ",");

  let msg;
  if (x.salt > cap) {
    msg = `A capacidade estimada é ${fmt(cap)} g. Como foram adicionados ${x.salt} g, cerca de ${fmt(excess)} g permanecerão como sólido no equilíbrio. Agitar pode acelerar, mas não elimina esse excesso.`;
  } else if (x.grain === "fine" && x.agitation > 70) {
    msg = "Sal fino e alta agitação favorecem maior velocidade porque aumentam área de contato e renovação da água junto à superfície do sólido.";
  } else if (x.temp > 70) {
    msg = "A temperatura alta acelera a dissolução. Para NaCl, entretanto, a solubilidade cresce pouco mesmo quando a temperatura aumenta bastante.";
  } else if (x.grain === "coarse") {
    msg = "Grãos grossos tendem a dissolver mais lentamente por menor área superficial exposta, embora a quantidade final dissolvida possa ser a mesma.";
  } else {
    msg = "A água polar se orienta ao redor dos íons: oxigênio para Na⁺ e hidrogênios para Cl⁻. Essa hidratação estabiliza os íons em solução.";
  }
  sim.dynamicExplanation.textContent = msg;
}

function renderBeaker() {
  const x = getInputs();
  const level = 52 + ((x.water - 50) / 150) * 34;
  sim.liquid.style.height = `${level}%`;

  sim.solidLayer.innerHTML = "";
  sim.particleLayer.innerHTML = "";

  const solidNow = Math.max(0, x.salt - dissolved);
  const crystals = Math.min(120, Math.round(solidNow * 1.2));
  for (let i = 0; i < crystals; i++) {
    const c = document.createElement("div");
    c.className = "crystal";
    c.style.left = `${28 + Math.random() * 44}%`;
    c.style.top = `${83 + Math.random() * 11}%`;
    c.style.transform = `rotate(${Math.random() * 90}deg)`;
    sim.solidLayer.appendChild(c);
  }

  const fraction = x.salt > 0 ? dissolved / x.salt : 0;
  const pairs = Math.max(0, Math.round(fraction * 30));
  const top = 100 - level;

  for (let i = 0; i < pairs; i++) {
    const na = document.createElement("div");
    na.className = "b-ion na";
    na.textContent = "+";
    na.style.left = `${19 + Math.random() * 62}%`;
    na.style.top = `${top + 8 + Math.random() * Math.max(level - 18, 8)}%`;

    const cl = document.createElement("div");
    cl.className = "b-ion cl";
    cl.textContent = "–";
    cl.style.left = `${19 + Math.random() * 62}%`;
    cl.style.top = `${top + 8 + Math.random() * Math.max(level - 18, 8)}%`;

    sim.particleLayer.append(na, cl);
  }
}

function drawAxes(ctx, w, h, yLabel, xLabel) {
  const m = 46;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#dfeaf3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = m + (h - 2*m) * i / 5;
    ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(w - m, y); ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const x = m + (w - 2*m) * i / 5;
    ctx.beginPath(); ctx.moveTo(x, m); ctx.lineTo(x, h - m); ctx.stroke();
  }

  ctx.strokeStyle = "#8ba6bf";
  ctx.beginPath();
  ctx.moveTo(m, m);
  ctx.lineTo(m, h - m);
  ctx.lineTo(w - m, h - m);
  ctx.stroke();

  ctx.fillStyle = "#5d7288";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(yLabel, 10, 20);
  ctx.fillText(xLabel, w/2 - 28, h - 12);
  return m;
}

function drawKinetics() {
  const canvas = sim.kineticsChart;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const m = drawAxes(ctx, w, h, "massa dissolvida (g)", "tempo (s)");
  const maxM = Math.max(targetDissolved(), 1);
  const maxT = Math.max(history.length ? history[history.length - 1].t : 1, 1);

  ctx.fillStyle = "#5d7288";
  ctx.font = "11px Inter, sans-serif";
  for (let i = 0; i <= 5; i++) {
    const val = maxM * (1 - i / 5);
    const y = m + (h - 2*m) * i / 5;
    ctx.fillText(fmt(val), 5, y + 4);
  }

  const eqY = h - m - (targetDissolved() / maxM) * (h - 2*m);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#e28a18";
  ctx.beginPath(); ctx.moveTo(m, eqY); ctx.lineTo(w - m, eqY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#a8640e";
  ctx.fillText("equilíbrio previsto", w - 150, eqY - 8);

  if (history.length < 2) return;
  ctx.strokeStyle = "#225bd6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  history.forEach((p, i) => {
    const x = m + (p.t / maxT) * (w - 2*m);
    const y = h - m - (p.m / maxM) * (h - 2*m);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawSolubility() {
  const canvas = sim.solubilityChart;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const m = drawAxes(ctx, w, h, "g NaCl / 100 g H₂O", "temperatura (°C)");
  const minY = 35, maxY = 40;

  ctx.fillStyle = "#5d7288";
  ctx.font = "11px Inter, sans-serif";
  for (let i = 0; i <= 5; i++) {
    const val = maxY - (maxY - minY) * i / 5;
    const y = m + (h - 2*m) * i / 5;
    ctx.fillText(fmt(val, 1), 5, y + 4);
  }

  ctx.strokeStyle = "#05a6a6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let t = 0; t <= 100; t += 2) {
    const x = m + (t / 100) * (w - 2*m);
    const yVal = solubilityPer100(t);
    const y = h - m - ((yVal - minY) / (maxY - minY)) * (h - 2*m);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const temp = getInputs().temp;
  const x = m + (temp / 100) * (w - 2*m);
  const yVal = solubilityPer100(temp);
  const y = h - m - ((yVal - minY) / (maxY - minY)) * (h - 2*m);
  ctx.fillStyle = "#225bd6";
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillText(`${temp} °C`, x + 8, y - 8);
}

function updateSimulation() {
  syncLabels();
  updateMetrics();
  renderBeaker();
  drawKinetics();
  drawSolubility();
}

[sim.saltMass, sim.waterMass, sim.temperature].forEach(el => {
  el.addEventListener("input", () => resetSimulation(true));
});
sim.grainSize.addEventListener("change", () => resetSimulation(true));
sim.agitation.addEventListener("input", updateSimulation);
sim.start.addEventListener("click", startSimulation);
sim.pause.addEventListener("click", pauseSimulation);
sim.reset.addEventListener("click", () => resetSimulation(false));

/* ---------- Quiz ---------- */

const quizData = [
  {
    question: "O que acontece com o NaCl quando ele se dissolve em água?",
    options: [
      { text: "Ele desaparece e deixa de existir.", correct: false, feedback: "Não. O sal deixa de ser visto como sólido, mas seus íons continuam na solução." },
      { text: "Ele se dissocia em Na⁺ e Cl⁻ hidratados.", correct: true, feedback: "Correto. A água estabiliza os íons separados por hidratação." },
      { text: "Ele se transforma em moléculas de água.", correct: false, feedback: "Não há transformação em água; há dissociação do sólido iônico." },
      { text: "Ele vira gás dissolvido.", correct: false, feedback: "Não. O produto são íons aquosos, não um gás." }
    ]
  },
  {
    question: "Se há excesso no equilíbrio, onde esse excesso deve aparecer?",
    options: [
      { text: "Como uma linha horizontal dentro da água.", correct: false, feedback: "Essa representação é enganosa. O excesso não fica como uma linha no líquido." },
      { text: "Como sólido no fundo ou não dissolvido.", correct: true, feedback: "Correto. O excesso permanece como sólido em contato com a solução saturada." },
      { text: "Como bolhas na superfície.", correct: false, feedback: "Não há formação de gás nesse processo." },
      { text: "Como água separada em outra fase.", correct: false, feedback: "Não ocorre separação de uma nova fase de água." }
    ]
  },
  {
    question: "Qual parte da água se orienta para o Na⁺?",
    options: [
      { text: "Os hidrogênios, porque são parcialmente negativos.", correct: false, feedback: "Os hidrogênios são parcialmente positivos, não negativos." },
      { text: "O oxigênio, por ter densidade parcial negativa.", correct: true, feedback: "Correto. O oxigênio da água interage favoravelmente com o cátion." },
      { text: "Nenhuma parte: a orientação é aleatória.", correct: false, feedback: "A polaridade da água gera orientação preferencial." },
      { text: "A molécula inteira sem polaridade.", correct: false, feedback: "A água é polar." }
    ]
  },
  {
    question: "Agitar uma solução saturada de NaCl geralmente:",
    options: [
      { text: "Aumenta muito a solubilidade máxima.", correct: false, feedback: "Não. Agitação muda principalmente a velocidade, não o limite de solubilidade." },
      { text: "Ajuda o sistema a chegar mais rápido ao equilíbrio.", correct: true, feedback: "Correto. A agitação renova o contato entre água e sólido." },
      { text: "Remove os íons da solução.", correct: false, feedback: "Não. Os íons continuam em solução." },
      { text: "Impede a hidratação.", correct: false, feedback: "Não. A hidratação continua ocorrendo." }
    ]
  },
  {
    question: "Por que sal fino tende a dissolver mais rápido que sal grosso?",
    options: [
      { text: "Porque possui maior área superficial exposta.", correct: true, feedback: "Correto. Maior área favorece contato com a água." },
      { text: "Porque tem fórmula química diferente.", correct: false, feedback: "Não. A fórmula continua sendo NaCl." },
      { text: "Porque muda a polaridade da água.", correct: false, feedback: "Não. A polaridade da água não muda." },
      { text: "Porque elimina a saturação.", correct: false, feedback: "Não. O limite de solubilidade ainda existe." }
    ]
  },
  {
    question: "Por que a solução aquosa de NaCl conduz eletricidade?",
    options: [
      { text: "Porque contém íons móveis.", correct: true, feedback: "Correto. Íons móveis transportam carga elétrica." },
      { text: "Porque o sal sólido vira metal.", correct: false, feedback: "Não há formação de metal." },
      { text: "Porque a água pura sempre conduz fortemente.", correct: false, feedback: "Água pura tem baixa condutividade; os íons aumentam a condução." },
      { text: "Porque a agitação cria elétrons livres.", correct: false, feedback: "Não. O mecanismo é transporte iônico." }
    ]
  }
];

const userAnswers = new Array(quizData.length).fill(null);

function renderQuiz() {
  const container = $("quizContainer");
  container.innerHTML = "";

  quizData.forEach((item, qi) => {
    const card = document.createElement("article");
    card.className = "card quiz-card";

    const title = document.createElement("h3");
    title.textContent = `${qi + 1}. ${item.question}`;
    card.appendChild(title);

    const list = document.createElement("div");
    list.className = "option-list";

    item.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      btn.textContent = option.text;

      btn.addEventListener("click", () => {
        if (card.querySelector(".feedback")) return;

        userAnswers[qi] = option.correct;
        [...list.children].forEach(child => child.disabled = true);
        btn.classList.add(option.correct ? "correct" : "incorrect");

        if (!option.correct) {
          [...list.children].forEach((child, index) => {
            if (item.options[index].correct) child.classList.add("correct");
          });
        }

        const feedback = document.createElement("div");
        feedback.className = `feedback ${option.correct ? "correct" : "incorrect"}`;
        feedback.innerHTML = `<strong>${option.correct ? "Muito bem!" : "Atenção:"}</strong> ${option.feedback}`;
        card.appendChild(feedback);
      });

      list.appendChild(btn);
    });

    card.appendChild(list);
    container.appendChild(card);
  });
}

$("finishQuiz").addEventListener("click", () => {
  const answered = userAnswers.filter(v => v !== null).length;
  const score = userAnswers.filter(Boolean).length;
  const total = quizData.length;
  let message;

  if (answered < total) {
    message = `Você respondeu ${answered} de ${total} questões. Complete todas para um diagnóstico melhor.`;
  } else if (score === total) {
    message = "Excelente. Você diferenciou bem dissolução, hidratação, saturação e velocidade.";
  } else if (score >= 4) {
    message = "Ótimo resultado. Revise apenas os pontos em que o feedback indicou dúvida.";
  } else if (score >= 3) {
    message = "Bom começo. Revise principalmente excesso no equilíbrio, hidratação e papel da agitação.";
  } else {
    message = "Vale retomar a sequência: cristal → água polar → hidratação → íons móveis → saturação.";
  }

  const result = $("quizResult");
  result.classList.remove("hidden");
  result.innerHTML = `<h3>Resultado final</h3><p><strong>Pontuação:</strong> ${score} / ${total}</p><p>${message}</p>`;
});

renderQuiz();
updateSimulation();
