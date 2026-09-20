"use strict";

var core = require("./app.js");

function lcg(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

var failures = 0;

function check(name, cond, detail) {
  if (cond) {
    console.log("PASS  " + name + "  " + (detail || ""));
  } else {
    failures++;
    console.log("FAIL  " + name + "  " + (detail || ""));
  }
}

function estimate(thetaDeg, n, rand) {
  var same = 0, aUp = 0, bUp = 0;
  for (var i = 0; i < n; i++) {
    var p = core.sampleQuantum(thetaDeg, rand);
    if (p.a === p.b) same++;
    if (p.a === 1) aUp++;
    if (p.b === 1) bUp++;
  }
  var e = (2 * same - n) / n;
  return { e: e, se: Math.sqrt(Math.max(0, 1 - e * e)) / Math.sqrt(n), aUp: aUp / n, bUp: bUp / n };
}

var N = 2000000;

var r = lcg(42);
var m0 = estimate(0, N, r);
check("E(0) = -1 (perfect anticorrelation)", Math.abs(m0.e - (-1)) < 1e-9, "E=" + m0.e);
check("marginal A = 0.5 at theta=0", Math.abs(m0.aUp - 0.5) < 0.01, "aUp=" + m0.aUp);

var m45 = estimate(45, N, r);
var t45 = -Math.cos(45 * Math.PI / 180);
check("E(45deg) = -cos(45deg) = -0.7071", Math.abs(m45.e - t45) < 3 * m45.se + 0.002, "E=" + m45.e.toFixed(4) + " (theory " + t45.toFixed(4) + ")");
check("marginal B = 0.5 at theta=45", Math.abs(m45.bUp - 0.5) < 3 * (1 / Math.sqrt(N)) + 0.002, "bUp=" + m45.bUp.toFixed(4));

var m90 = estimate(90, N, r);
check("E(90deg) = 0", Math.abs(m90.e - 0) < 3 * m90.se + 0.002, "E=" + m90.e.toFixed(4));

var m180 = estimate(180, N, r);
check("E(180deg) = +1 (perfect correlation on opposite axes)", Math.abs(m180.e - 1) < 1e-9, "E=" + m180.e);

var noSig1 = estimate(15, N, lcg(7));
var noSig2 = estimate(165, N, lcg(9));
check("no-signaling: A marginal 0.5 for both Bob axes", Math.abs(noSig1.aUp - 0.5) < 0.01 && Math.abs(noSig2.aUp - 0.5) < 0.01, "aUp(" + 15 + "deg)=" + noSig1.aUp.toFixed(4) + " aUp(" + 165 + "deg)=" + noSig2.aUp.toFixed(4));

function chsh(m, a, ap, b, bp, n, rand) {
  function meas(x, y) {
    var s = 0;
    for (var i = 0; i < n; i++) {
      var p = m === "q" ? core.sampleQuantum(x - y, rand) : core.sampleLHV(x, y, rand);
      s += p.a * p.b;
    }
    return s / n;
  }
  return core.chshS(meas(a, b), meas(a, bp), meas(ap, b), meas(ap, bp));
}

var n2 = 1000000;
var S_q = chsh("q", 0, 90, 45, -45, n2, lcg(123));
check("CHSH quantum |S| ~ 2*sqrt(2) = 2.828 (violates 2)", Math.abs(Math.abs(S_q) - 2 * Math.SQRT2) < 0.03, "S=" + S_q.toFixed(4) + " |S|=" + Math.abs(S_q).toFixed(4));

var S_l = chsh("l", 0, 90, 45, -45, n2, lcg(456));
check("CHSH local-hidden-variable |S| ~ 2 (saturates bound)", Math.abs(S_l - (-2)) < 0.03, "S=" + S_l.toFixed(4));
check("CHSH local-hidden-variable respects |S| <= 2", Math.abs(S_l) <= 2.05, "|S|=" + Math.abs(S_l).toFixed(4));

function lhvE(d, n, rand) {
  var s = 0;
  for (var i = 0; i < n; i++) {
    var p = core.sampleLHV(0, d, rand);
    s += p.a * p.b;
  }
  return s / n;
}
var e_l45 = lhvE(45, 2000000, lcg(321));
check("LHV E(45deg) = 2*45/180 - 1 = -0.5", Math.abs(e_l45 - (-0.5)) < 0.01, "E=" + e_l45.toFixed(4));
var e_l135 = lhvE(135, 2000000, lcg(654));
check("LHV E(135deg) = +0.5", Math.abs(e_l135 - 0.5) < 0.01, "E=" + e_l135.toFixed(4));

check("analytic eQuantum(0) = -1", core.eQuantum(0) === -1);
check("analytic eQuantum(90) = 0", Math.abs(core.eQuantum(90)) < 1e-12);
check("analytic eQuantum(135) = +sqrt(2)/2", Math.abs(core.eQuantum(135) - Math.SQRT1_2) < 1e-12);
check("analytic eLHV(90) = 0", Math.abs(core.eLHV(90)) < 1e-12);
check("analytic eLHV(45) = -0.5", Math.abs(core.eLHV(45) + 0.5) < 1e-12);

var S_theory = core.chshS(core.eQuantum(0 - 45), core.eQuantum(0 - (-45)), core.eQuantum(90 - 45), core.eQuantum(90 - (-45)));
check("analytic CHSH quantum S = -2*sqrt(2)", Math.abs(S_theory + 2 * Math.SQRT2) < 1e-12, "S=" + S_theory.toFixed(6));

console.log(failures === 0 ? "\nAll tests passed." : "\n" + failures + " test(s) FAILED.");
process.exit(failures === 0 ? 0 : 1);
