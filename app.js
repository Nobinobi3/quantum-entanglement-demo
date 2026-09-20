(function (global) {
  "use strict";

  var DEG = Math.PI / 180;

  function sampleQuantum(thetaDeg, random) {
    var r = random || Math.random;
    var th = thetaDeg * DEG;
    var a = r() < 0.5 ? 1 : -1;
    var c = Math.cos(th / 2);
    var b = r() < c * c ? -a : a;
    return { a: a, b: b };
  }

  function sampleLHV(alphaDeg, betaDeg, random) {
    var r = random || Math.random;
    var lam = r() * 2 * Math.PI;
    var a = Math.cos(alphaDeg * DEG - lam) >= 0 ? 1 : -1;
    var b = Math.cos(betaDeg * DEG - lam) >= 0 ? -1 : 1;
    return { a: a, b: b };
  }

  function normDelta(d) {
    var m = Math.abs(d) % 360;
    if (m > 180) m = 360 - m;
    return m;
  }

  var eQuantum = function (d) { return -Math.cos(normDelta(d) * DEG); };
  var eLHV = function (d) { return (2 * normDelta(d) * DEG) / Math.PI - 1; };

  var chshS = function (eab, eabp, eapb, eapbp) { return eab + eabp + eapb - eapbp; };

  var core = {
    sampleQuantum: sampleQuantum,
    sampleLHV: sampleLHV,
    eQuantum: eQuantum,
    eLHV: eLHV,
    chshS: chshS,
    normDelta: normDelta
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }
  global.EntanglementCore = core;

  if (typeof document === "undefined") return;

  function $(id) { return document.getElementById(id); }
  function fmt(x, d) { return isFinite(x) ? x.toFixed(d === undefined ? 3 : d) : "–"; }
  function fmtSigned(x, d) { return (x >= 0 ? "+" : "") + fmt(x, d); }

  function setupCanvas(canvas, cssW, cssH) {
    var dpr = global.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + "px";
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return ctx;
  }

  function arrowHead(ctx, x, y, ux, uy, size, color) {
    var px = -uy, py = ux;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * size + px * size * 0.5, y - uy * size + py * size * 0.5);
    ctx.lineTo(x - ux * size - px * size * 0.5, y - uy * size - py * size * 0.5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function arrowLabel(v) { return v > 0 ? "↑ (+1)" : "↓ (−1)"; }
  function arrowClass(v) { return v > 0 ? "up" : "down"; }

  function initExp1() {
    var alphaS = $("alpha"), betaS = $("beta");
    var alphaVal = $("alphaVal"), betaVal = $("betaVal");
    var statN = $("e1N"), statE = $("e1E"), statQ = $("e1Q"), statL = $("e1L"), statAlice = $("e1Alice");
    var sameBar = $("e1SameBar"), oppBar = $("e1OppBar");
    var samePct = $("e1SamePct"), oppPct = $("e1OppPct");
    var lastA = $("e1LastA"), lastB = $("e1LastB");
    var runBtn = $("e1Run");

    var SW = 720, SH = 240;
    var sceneCtx = setupCanvas($("e1Scene"), SW, SH);
    var GW = 720, GH = 320;
    var gctx = setupCanvas($("e1Graph"), GW, GH);

    var state = { alpha: 0, beta: 45, n: 0, same: 0, opp: 0, aUp: 0, running: false };
    var sweep = { points: [] };
    var particles = [];
    var arrivedA = null, arrivedB = null;
    var lastSpawn = 0;

    var src = { x: SW / 2, y: SH / 2 };
    var alice = { x: 100, y: SH / 2, r: 38 };
    var bob = { x: SW - 100, y: SH / 2, r: 38 };
    var speed = 110;
    var maxD = src.x - alice.x - alice.r - 4;

    function curDelta() { return normDelta(state.alpha - state.beta); }

    function samplePair() {
      var p = sampleQuantum(state.alpha - state.beta);
      state.n++;
      if (p.a === p.b) state.same++; else state.opp++;
      if (p.a === 1) state.aUp++;
      return p;
    }

    function spawn() {
      var p = samplePair();
      particles.push({ t: 0, a: p.a, b: p.b, ca: false, cb: false });
      if (particles.length > 12) particles.shift();
      lastSpawn = performance.now();
      lastA.textContent = arrowLabel(p.a);
      lastA.className = arrowClass(p.a);
      lastB.textContent = arrowLabel(p.b);
      lastB.className = arrowClass(p.b);
      updateStats();
    }

    function batch(k) {
      for (var i = 0; i < k; i++) {
        var p = samplePair();
        if (i === k - 1) {
          lastA.textContent = arrowLabel(p.a);
          lastA.className = arrowClass(p.a);
          lastB.textContent = arrowLabel(p.b);
          lastB.className = arrowClass(p.b);
        }
      }
      updateStats();
    }

    function se() {
      if (state.n === 0) return NaN;
      var e = (state.same - state.opp) / state.n;
      return Math.sqrt(Math.max(0, 1 - e * e)) / Math.sqrt(state.n);
    }

    function updateStats() {
      statN.innerHTML = state.n.toLocaleString() + " <small>ペア</small>";
      var e = state.n ? (state.same - state.opp) / state.n : NaN;
      var s = se();
      statE.textContent = state.n ? fmtSigned(e, 3) + " ± " + fmt(s, 3) : "–";
      var d = curDelta();
      statQ.textContent = fmtSigned(eQuantum(d), 3) + "  (θ=" + d + "°)";
      statL.textContent = fmtSigned(eLHV(d), 3);
      if (state.n) {
        var up = state.aUp / state.n * 100, dn = 100 - up;
        statAlice.innerHTML = '<span class="up">↑ ' + up.toFixed(1) + '%</span> / <span class="down">↓ ' + dn.toFixed(1) + '%</span>';
        samePct.textContent = (state.same / state.n * 100).toFixed(1) + "%";
        oppPct.textContent = (state.opp / state.n * 100).toFixed(1) + "%";
      } else {
        statAlice.textContent = "–";
        samePct.textContent = "–";
        oppPct.textContent = "–";
      }
      if (state.n) {
        sameBar.style.width = (state.same / state.n * 100) + "%";
        oppBar.style.width = (state.opp / state.n * 100) + "%";
      } else {
        sameBar.style.width = "0%";
        oppBar.style.width = "0%";
      }
      drawGraph();
    }

    function drawDetector(d, thetaDeg, label, res) {
      var ctx = sceneCtx;
      var th = thetaDeg * DEG;
      var ux = Math.sin(th), uy = -Math.cos(th);
      ctx.strokeStyle = "#33415f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#7f95c0";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(d.x - ux * 58, d.y - uy * 58);
      ctx.lineTo(d.x + ux * 58, d.y + uy * 58);
      ctx.stroke();
      arrowHead(ctx, d.x + ux * 58, d.y + uy * 58, ux, uy, 10, "#7f95c0");
      ctx.strokeStyle = "#3b4a6b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 44);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      if (thetaDeg % 1 !== 0) thetaDeg = Math.round(thetaDeg);
      var a0 = -Math.PI / 2, a1 = -Math.PI / 2 + th;
      if (th < 0) { var t = a0; a0 = a1; a1 = t; }
      ctx.beginPath();
      ctx.arc(d.x, d.y, 16, Math.min(a0, a1), Math.max(a0, a1));
      ctx.stroke();
      ctx.fillStyle = "#9fb2d8";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, d.x, d.y + d.r + 18);
      if (res !== null && res !== undefined) {
        var sgn = res > 0 ? 1 : -1;
        var color = res > 0 ? "#45d4ff" : "#ffa257";
        var ex = d.x + ux * 26 * sgn, ey = d.y + uy * 26 * sgn;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        arrowHead(ctx, ex, ey, ux * sgn, uy * sgn, 11, color);
        ctx.fillStyle = color;
        ctx.font = "bold 13px sans-serif";
        ctx.fillText((res > 0 ? "↑" : "↓"), d.x + ux * 40 * sgn, d.y + uy * 40 * sgn + 4);
      }
    }

    function drawScene() {
      var ctx = sceneCtx;
      ctx.clearRect(0, 0, SW, SH);
      ctx.fillStyle = "#1b2745";
      ctx.beginPath();
      ctx.arc(src.x, src.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#45d4ff";
      ctx.beginPath();
      ctx.arc(src.x, src.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9fb2d8";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("シングレット状態の粒子対", src.x, src.y - 20);
      drawDetector(alice, state.alpha, "Alice  α = " + state.alpha + "°", arrivedA);
      drawDetector(bob, state.beta, "Bob  β = " + state.beta + "°", arrivedB);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dist = p.t * speed;
        if (dist <= maxD) {
          var y = SH / 2;
          ctx.fillStyle = "rgba(122,162,255,0.9)";
          ctx.beginPath();
          ctx.arc(src.x - dist, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(src.x + dist, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    var plot = { l: 52, r: 16, t: 16, b: 36 };

    function gx(v) { return plot.l + (v / 180) * (GW - plot.l - plot.r); }
    function gy(v) { return plot.t + ((1.2 - v) / 2.4) * (GH - plot.t - plot.b); }

    function drawGraph() {
      var ctx = gctx;
      ctx.clearRect(0, 0, GW, GH);
      ctx.strokeStyle = "#26324f";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#8fa0c2";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      for (var d = 0; d <= 180; d += 30) {
        ctx.beginPath();
        ctx.moveTo(gx(d), gy(-1.2));
        ctx.lineTo(gx(d), gy(1.2));
        ctx.stroke();
        ctx.fillText(d + "°", gx(d), GH - plot.b + 16);
      }
      ctx.textAlign = "right";
      for (var e = -1; e <= 1; e += 0.5) {
        ctx.beginPath();
        ctx.moveTo(plot.l, gy(e));
        ctx.lineTo(GW - plot.r, gy(e));
        ctx.stroke();
        ctx.fillText(e.toFixed(1), plot.l - 6, gy(e) + 4);
      }
      ctx.textAlign = "left";
      ctx.fillText("相関 E", plot.l - 44, plot.t + 8);
      ctx.textAlign = "center";
      ctx.fillText("軸の角度差 θ", (plot.l + GW - plot.r) / 2, GH - 6);

      ctx.strokeStyle = "#45d4ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var x = 0; x <= 180; x += 2) {
        var y = -Math.cos(x * DEG);
        if (x === 0) ctx.moveTo(gx(x), gy(y)); else ctx.lineTo(gx(x), gy(y));
      }
      ctx.stroke();

      ctx.strokeStyle = "#ffa257";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (x = 0; x <= 180; x += 2) {
        y = (2 * x * DEG) / Math.PI - 1;
        if (x === 0) ctx.moveTo(gx(x), gy(y)); else ctx.lineTo(gx(x), gy(y));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (var i = 0; i < sweep.points.length; i++) {
        var sp = sweep.points[i];
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx(sp.d), gy(sp.e - 1.96 * sp.se));
        ctx.lineTo(gx(sp.d), gy(sp.e + 1.96 * sp.se));
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gx(sp.d), gy(sp.e), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (state.n > 0) {
        var dNow = curDelta();
        var eNow = (state.same - state.opp) / state.n;
        var sNow = se();
        ctx.strokeStyle = "#7aa2ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx(dNow), gy(eNow - 1.96 * sNow));
        ctx.lineTo(gx(dNow), gy(eNow + 1.96 * sNow));
        ctx.stroke();
        ctx.fillStyle = "#7aa2ff";
        ctx.beginPath();
        ctx.arc(gx(dNow), gy(eNow), 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#45d4ff";
      ctx.fillText("— 量子力学  E = −cos θ", plot.l + 10, plot.t + 16);
      ctx.fillStyle = "#ffa257";
      ctx.fillText("- -  局所隠れた変数  E = 2θ/π − 1", plot.l + 190, plot.t + 16);
    }

    var lastFrame = performance.now();
    function frame(now) {
      var dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      if (state.running && now - lastSpawn > 130) spawn();
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.t += dt;
        if (p.t * speed >= maxD) {
          if (!p.ca) { p.ca = true; arrivedA = p.a; }
          if (!p.cb) { p.cb = true; arrivedB = p.b; }
        }
      }
      particles = particles.filter(function (p) { return p.t * speed < maxD + 60; });
      drawScene();
      requestAnimationFrame(frame);
    }

    function reset(keepSweep) {
      state.n = 0; state.same = 0; state.opp = 0; state.aUp = 0;
      if (!keepSweep) sweep.points = [];
      arrivedA = null; arrivedB = null;
      particles = [];
      lastA.textContent = "–"; lastB.textContent = "–";
      lastA.className = ""; lastB.className = "";
      updateStats();
    }

    function onSlide() {
      state.alpha = +alphaS.value;
      state.beta = +betaS.value;
      alphaVal.textContent = state.alpha + "°";
      betaVal.textContent = state.beta + "°";
      reset(false);
    }

    alphaS.addEventListener("input", onSlide);
    betaS.addEventListener("input", onSlide);

    runBtn.addEventListener("click", function () {
      state.running = !state.running;
      runBtn.textContent = state.running ? "■ 停止" : "▶ 連続測定";
      runBtn.classList.toggle("running", state.running);
      if (state.running && state.n === 0) lastSpawn = 0;
    });

    $("e1Batch").addEventListener("click", function () { batch(10000); });

    $("e1Sweep").addEventListener("click", function () {
      sweep.points = [];
      for (var d = 0; d <= 180; d += 10) {
        var same = 0, n = 20000;
        for (var i = 0; i < n; i++) {
          var p = sampleQuantum(0 - d);
          if (p.a === p.b) same++;
        }
        var e = (2 * same - n) / n;
        var s = Math.sqrt(Math.max(0, 1 - e * e)) / Math.sqrt(n);
        sweep.points.push({ d: d, e: e, se: s });
      }
      drawGraph();
    });

    $("e1Reset").addEventListener("click", function () {
      state.running = false;
      runBtn.textContent = "▶ 連続測定";
      runBtn.classList.remove("running");
      reset(false);
    });

    onSlide();
    requestAnimationFrame(frame);
  }

  function initExp2() {
    var modelQ = $("modelQ"), modelL = $("modelL");
    var sA = $("sA"), sAp = $("sAp"), sB = $("sB"), sBp = $("sBp");
    var vA = $("vA"), vAp = $("vAp"), vB = $("vB"), vBp = $("vBp");
    var N_PER = 20000;

    function modelIsQ() { return modelQ.checked; }

    function val() {
      return { a: +sA.value, ap: +sAp.value, b: +sB.value, bp: +sBp.value };
    }

    function updateLabels() {
      var v = val();
      vA.textContent = v.a + "°";
      vAp.textContent = v.ap + "°";
      vB.textContent = v.b + "°";
      vBp.textContent = (v.bp > 0 ? v.bp : v.bp) + "°";
    }

    [sA, sAp, sB, sBp].forEach(function (s) {
      s.addEventListener("input", updateLabels);
    });
    modelQ.addEventListener("change", updateLabels);
    modelL.addEventListener("change", updateLabels);

    function samplePair(m, x, y) {
      return m === "q" ? sampleQuantum(x - y) : sampleLHV(x, y);
    }

    function measure(m, x, y, n) {
      var s = 0;
      for (var i = 0; i < n; i++) {
        var p = samplePair(m, x, y);
        s += p.a * p.b;
      }
      var e = s / n;
      return { e: e, se: Math.sqrt(Math.max(0, 1 - e * e)) / Math.sqrt(n) };
    }

    function setCell(id, ev) {
      $(id).textContent = fmtSigned(ev.e, 3) + " ± " + fmt(ev.se, 3);
    }

    function run() {
      var m = modelIsQ() ? "q" : "l";
      var v = val();
      var f = m === "q" ? eQuantum : eLHV;
      var combos = [
        { key: "AB", x: v.a, y: v.b },
        { key: "ABp", x: v.a, y: v.bp },
        { key: "APb", x: v.ap, y: v.b },
        { key: "APBp", x: v.ap, y: v.bp }
      ];
      var res = {};
      combos.forEach(function (c) {
        res[c.key] = measure(m, c.x, c.y, N_PER);
        $("d" + c.key).textContent = normDelta(c.x - c.y) + "°";
        $("t" + c.key).textContent = fmtSigned(f(c.x - c.y), 3);
        setCell("e" + c.key, res[c.key]);
      });
      var S = chshS(res.AB.e, res.ABp.e, res.APb.e, res.APBp.e);
      var seS = Math.sqrt(res.AB.se * res.AB.se + res.ABp.se * res.ABp.se + res.APb.se * res.APb.se + res.APBp.se * res.APBp.se);
      var St = chshS(f(v.a - v.b), f(v.a - v.bp), f(v.ap - v.b), f(v.ap - v.bp));
      var absS = Math.abs(S);
      var violated = absS - 2 > 3 * seS;

      $("sVal").textContent = fmtSigned(S, 3);
      $("sVal").style.color = violated ? "#ff8fa8" : "#57d9a3";
      $("sErr").textContent = "± " + fmt(seS, 3) + "   |S| = " + fmt(absS, 3);
      $("theoryS").textContent = fmtSigned(St, 3);

      var fill = $("gaugeFill");
      fill.style.width = (absS / 4 * 100) + "%";
      fill.style.background = violated
        ? "linear-gradient(90deg,#7a3b52,#ff6b6b)"
        : "linear-gradient(90deg,#2c5a48,#57d9a3)";

      var verdict = $("verdict");
      verdict.style.display = "block";
      if (violated) {
        verdict.className = "verdict violate";
        verdict.innerHTML = "<strong>ベル不等式が違反された！</strong> |S| = " + fmt(Math.abs(S), 3) + " は局所実在論の限界 2 を超えています。この相関は、粒子が生成時に運んでいた局所的な「事前決定」では説明できません。量子力学の予測（|S| 最大 2√2 ≈ 2.828）が支持されました。";
      } else if (absS > 2) {
        verdict.className = "verdict no-violate";
        verdict.innerHTML = "|S| = " + fmt(absS, 3) + " は限界 2 をほんのわずか（標準誤差 ±" + fmt(seS, 3) + " 以内）だけ上回っていますが、統計的不確かさの範囲内の值です。局所隠れた変数モデルでは理論値がちょうど |S| = 2 になるので、こうした揺らぎは正常です。";
      } else {
        verdict.className = "verdict no-violate";
        verdict.innerHTML = m === "l"
          ? "局所隠れた変数モデルは <strong>|S| ≤ 2</strong> を満たしました。同じ軸での完全な逆相関を再現できても、斜めの角度での統計が量子力学と異なり、2√2 に届きません。この型破れな相関が「事前決定」では不可能であることを、ベルの定理が保証しています。"
          : "この角度設定では局所実在の限界 2 を超えませんでした。角度を変えて試してください（標準設定では 2√2 に近づくはず）。";
      }
    }

    $("e2Run").addEventListener("click", run);
    $("e2Std").addEventListener("click", function () {
      sA.value = 0; sAp.value = 90; sB.value = 45; sBp.value = -45;
      updateLabels();
      run();
    });

    updateLabels();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initExp1();
    initExp2();
  });
})(typeof window !== "undefined" ? window : globalThis);
