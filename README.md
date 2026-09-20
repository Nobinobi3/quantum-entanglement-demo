# 量子もつれインタラクティブ解説

スピン1/2粒子の**シングレット状態**と**ベル（CHSH）試験**を、ブラウザ上でインタラクティブに体験できるJavaScript製シミュレーションです。外部ライブラリは一切不要です。

## 実行方法

`index.html` をブラウザで開くだけです。

```bash
open index.html   # macOS の場合
```

## 内容

1. **量子もつれとは** — シングレット状態 `|Ψ⁻⟩ = (|↑↓⟩ − |↓↑⟩)/√2` の解説と、量子力学の予測（同一軸での完全な逆相関、角度 θ での相関 E = −cos θ、個々の結果は 50/50 の乱数）
2. **歴史** — 1935年 EPR パラドックス → 1964年 ベルの定理 → 1972年/1982年の実験検証 → 2022年ノーベル物理学賞（アスペ、クラウザー、ツァイリンガー）
3. **実験1: 相関は軸の角度で変わる** — 軸角度スライダーと粒子アニメーション付きの測定シミュレーション。量子力学（−cos θ）と局所隠れた変数モデル（2θ/π − 1）の相関曲線を比較し、同じ軸では両者とも完全な逆相関でも斜めの角度で差が出ることを可視化。Alice 側の結果が常に 50/50 に留まること（非シグナル性）も表示
4. **実験2: ベル（CHSH）試験** — 量子モデル / 局所隠れた変数モデルを切り替えて S = E(a,b) + E(a,b′) + E(a′,b) − E(a′,b′) を測定。標準設定（a=0°, a′=90°, b=45°, b′=−45°）では量子力学で |S| ≈ 2√2 ≈ 2.828（局所実在の限界 2 を 3σ 以上で違反）、隠れた変数モデルでは |S| ≈ 2 で違反しないことを確認できます
5. **なぜ超光速通信できないのか** — 非シグナル性の解説
6. **シミュレーションについての注記** — モンテカルロ法の性質、隠れた変数モデルの定義、実際の光子実験との違い（偏光では E = −cos 2θ）など

## 物理の内容

- シングレット状態は全角運動量ゼロの回転対称状態で、任意の軸で測定したとき 2 粒子の結果は必ず反対
- 軸の角度差 θ で E(θ) = −cos θ（Born ルールによる P(反対) = cos²(θ/2), P(同じ) = sin²(θ/2) からサンプリング）
- CHSH 不等式: 局所実在論（局所性 + 実在性）は |S| ≤ 2 を満たすが、量子力学は最大 2√2（ツァイレソン上限）に達し、実験は量子力学を支持
- 片方の測定結果は他方の軸選択にかかわらず常に 50/50 のため、超光速通信は不可能（非シグナル定理）

## テスト

物理の検証を Node.js で行います（相関の収束、境界条件、CHSH の理論値・測定値、非シグナル性）。

```bash
node test.js
```

## 参考

- [量子もつれ — Wikipedia（日本語版）](https://ja.wikipedia.org/wiki/%E9%87%8F%E5%AD%90%E3%82%82%E3%81%A4%E3%82%8C)
- [Quantum entanglement — Wikipedia](https://en.wikipedia.org/wiki/Quantum_entanglement)
- [Bell's theorem — Wikipedia](https://en.wikipedia.org/wiki/Bell%27s_theorem)
- [CHSH inequality — Wikipedia](https://en.wikipedia.org/wiki/CHSH_inequality)
- [Tsirelson's bound — Wikipedia](https://en.wikipedia.org/wiki/Tsirelson%27s_bound)
- [The Nobel Prize in Physics 2022 — NobelPrize.org](https://www.nobelprize.org/prizes/physics/2022/press-release/)
