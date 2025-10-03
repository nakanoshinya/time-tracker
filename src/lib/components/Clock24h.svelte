<script>
  import { logsStore } from '$lib/stores/logs';
  const { logs } = logsStore;

  export let dayKey = (new Date()).toISOString().slice(0,10);
  export let size = 320;           // SVGの一辺
  export let ringThickness = 14;   // 1レーンの太さ
  export let ringGap = 4;          // レーン間の隙間
  export let categoryColors = {};
  export let categoryLabels = {};
  export let showTicks = true;     // 目盛を描くか

  const defaultPalette = ["#4f46e5","#06b6d4","#f97316","#10b981","#ef4444","#8b5cf6","#f59e0b","#0ea5e9"];
  const colorOf = (cat, i) => categoryColors[cat] ?? defaultPalette[i % defaultPalette.length];
  const labelOf = (id) => categoryLabels[id] ?? id;

  // 角度→座標
  function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  // ドーナツアークpath
  function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    // 0長さは描かない
    if (Math.abs(endDeg - startDeg) < 0.01) return '';
    const large = (endDeg - startDeg) % 360 > 180 ? 1 : 0;
    const so = polar(cx, cy, rOuter, startDeg);
    const eo = polar(cx, cy, rOuter, endDeg);
    const si = polar(cx, cy, rInner, endDeg);
    const ei = polar(cx, cy, rInner, startDeg);
    return [
      `M ${so.x} ${so.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${eo.x} ${eo.y}`,
      `L ${si.x} ${si.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${ei.x} ${ei.y}`,
      'Z'
    ].join(' ');
  }

  // ローカル日の境界
  $: dayStart = new Date(dayKey + 'T00:00:00');
  $: dayEnd = new Date(new Date(dayStart).setDate(dayStart.getDate() + 1));
  const dayMs = 24 * 60 * 60 * 1000;

  // 対象日のログを角度に変換（クランプ＋進行中は今で切る）
  $: now = Date.now();
  $: segments = $logs
    .filter(l => l.day_key === dayKey)
    .map((l, i) => {
      const s0 = new Date(l.start);
      const e0 = l.end ? new Date(l.end) : new Date();
      const s = s0 < dayStart ? dayStart : s0;
      const e = e0 > dayEnd ? dayEnd : e0;
      const len = Math.max(0, e - s);
      const startDeg = ((s - dayStart) / dayMs) * 360;
      const endDeg = ((e - dayStart) / dayMs) * 360;
      return { ...l, s, e, len, startDeg, endDeg, index: i };
    })
    .filter(seg => seg.len > 0)
    .sort((a,b) => a.s - b.s);

  // 重なりをレーンに割り当て（貪欲：先頭から最初に空くレーンへ）
  function assignLanes(segs) {
    const lanes = []; // each lane keeps lastEnd
    for (const seg of segs) {
      let placed = false;
      for (let i=0; i<lanes.length; i++) {
        if (seg.s >= lanes[i]) { // 重ならない
          seg.lane = i;
          lanes[i] = seg.e;
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.lane = lanes.length;
        lanes.push(seg.e);
      }
    }
    return { segs, laneCount: lanes.length };
  }
  $: ({ segs: segmentsWithLane, laneCount } = assignLanes(segments));

  // 半径計算
  const margin = 28; // 外側余白
  $: outerR = size/2 - margin;
  $: totalRings = laneCount > 0 ? laneCount : 1;
  $: totalThickness = totalRings * ringThickness + (totalRings - 1) * ringGap;
  $: innerR = Math.max(outerR - totalThickness, 24); // 最低半径を確保

  // 現在時刻ライン
  $: nowDeg = (now >= dayStart.getTime() && now <= dayEnd.getTime())
    ? ((now - dayStart.getTime()) / dayMs) * 360
    : null;

  // 目盛データ（毎時）
  $: ticks = Array.from({length: 24}, (_, h) => ({
    deg: (h/24)*360,
    label: h.toString()
  }));
</script>

<style>
  .legend { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; font-size:0.9rem; }
  .legend-item { display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:6px; background:rgba(0,0,0,0.04); }
  .sw { width:12px; height:12px; border-radius:2px; }
</style>

  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="24時間円グラフ">
  <!-- 目盛（内側に描画） -->
  {#if showTicks}
    {#each ticks as t}
      {@html (() => {
        const cx = size/2, cy = size/2;
        const r1 = innerR - 10;
        const r2 = innerR - 2;
        const p1 = polar(cx, cy, r1, t.deg);
        const p2 = polar(cx, cy, r2, t.deg);
        const txt = polar(cx, cy, innerR - 18, t.deg);
        const isMajor = (parseInt(t.label) % 6 === 0);
        const stroke = isMajor ? '#999' : '#ccc';
        const label = isMajor ? `<text x="${txt.x}" y="${txt.y}" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="#666">${t.label}</text>` : '';
        return `<g>
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" />
          ${label}
        </g>`;
      })()}
    {/each}
  {/if}

  <!-- 区間アーク（各レーン） -->
  {#each segmentsWithLane as seg, i}
    {@html (() => {
      const cx = size/2, cy = size/2;
      const rIn = innerR + seg.lane * (ringThickness + ringGap);
      const rOut = rIn + ringThickness;
      const path = arcPath(cx, cy, rOut, rIn, seg.startDeg, seg.endDeg);
      if (!path) return '';
      const color = colorOf(seg.category_id, i);
      const title = `${labelOf(seg.category_id)}\n${new Date(seg.s).toLocaleTimeString()} → ${seg.end ? new Date(seg.e).toLocaleTimeString() : '(running)'}\n${seg.duration_sec ? Math.round(seg.duration_sec/60) : Math.round(seg.len/60000)} min`;
      return `<path d="${path}" fill="${color}"><title>${title}</title></path>`;
    })()}
  {/each}

  <!-- 現在時刻ライン -->
  {#if nowDeg !== null}
    {@html (() => {
      const cx = size/2, cy = size/2;
      const p1 = polar(cx, cy, innerR - 6, nowDeg);
      const p2 = polar(cx, cy, outerR + 6, nowDeg);
      return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#ff0000" stroke-opacity="0.6" stroke-width="1.2"></line>`;
    })()}
  {/if}

  <!-- 中央ラベル -->
  <circle cx={size/2} cy={size/2} r={innerR - 22} fill="white" stroke="#eee"></circle>
  <text x={size/2} y={size/2} text-anchor="middle" dominant-baseline="middle" font-weight="600" font-size="12">{dayKey}</text>
</svg>

<!-- 凡例 -->
<div class="legend">
  {#each Array.from(new Set(segmentsWithLane.map(s => s.category_id))) as c, i}
    <div class="legend-item">
      <span class="sw" style="background:{colorOf(c, i)}"></span>
      <span>{labelOf(c)}</span>
    </div>
  {/each}
</div>
