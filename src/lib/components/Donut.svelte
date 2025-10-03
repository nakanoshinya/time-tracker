<script>
    import { onMount } from 'svelte';
    import { logsStore } from '$lib/stores/logs';
    const { logs } = logsStore;
  
    export let dayKey = (new Date()).toISOString().slice(0,10); // YYYY-MM-DD（デフォルト: 今日）
    export let size = 240;       // SVG の幅・高さ
    export let thickness = 48;   // ドーナツの厚さ
    export let categoryColors = {}; // optional: { category_id: '#RRGGBB' }
  
    // デフォルト色（カテゴリが未定義でも見えるようにループ色）
    const defaultPalette = [
      "#4f46e5","#06b6d4","#f97316","#10b981","#ef4444","#8b5cf6","#f59e0b","#0ea5e9"
    ];
  
    function polarToCartesian(cx, cy, r, angleDeg) {
      const a = (angleDeg - 90) * Math.PI / 180.0;
      return { x: cx + (r * Math.cos(a)), y: cy + (r * Math.sin(a)) };
    }
  
    // ドーナツのセグメント（外弧→内弧でパスを作る）
    function describeDonutArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
      const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
      const endOuter   = polarToCartesian(cx, cy, rOuter, startAngle);
      const startInner = polarToCartesian(cx, cy, rInner, endAngle);
      const endInner   = polarToCartesian(cx, cy, rInner, startAngle);
  
      const largeArcFlag = (endAngle - startAngle) <= 180 ? "0" : "1";
  
      const d = [
        "M", startOuter.x, startOuter.y,
        "A", rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", rInner, rInner, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
      ].join(" ");
      return d;
    }
  
    // 集計
    $: dayLogs = $logs.filter(l => l.day_key === dayKey);
    // 動作中ログは duration_sec が null — ここでは現在時刻まで仮計算
    $: now = Date.now();
    $: totals = (() => {
      const map = new Map();
      for (const l of dayLogs) {
        const dur = l.duration_sec != null
          ? l.duration_sec
          : Math.max(0, Math.floor((now - new Date(l.start).getTime())/1000));
        map.set(l.category_id, (map.get(l.category_id) || 0) + dur);
      }
      return map; // Map<category_id, seconds>
    })();
  
    $: totalSec = Array.from(totals.values()).reduce((a,b) => a+b, 0);
  
    // スライス情報（color割り当て）
    $: slices = (() => {
      const arr = [];
      let startAngle = 0;
      let i = 0;
      for (const [cat, sec] of totals) {
        const angle = totalSec ? (sec / totalSec) * 360 : 0;
        const color = categoryColors[cat] ?? defaultPalette[i % defaultPalette.length];
        arr.push({ category: cat, sec, startAngle, endAngle: startAngle + angle, color });
        startAngle += angle;
        i++;
      }
      return arr;
    })();
  </script>
  
  <style>
    .donut-wrapper { display:inline-block; }
    .center-label { font-weight:700; font-size:0.95rem; text-anchor:middle; dominant-baseline:middle; }
    .legend { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; font-size:0.9rem; }
    .legend-item { display:flex; align-items:center; gap:8px; padding:2px 6px; border-radius:6px; background:rgba(0,0,0,0.02); }
    .swatch { width:12px; height:12px; border-radius:2px; }
  </style>
  
  <div class="donut-wrapper" style="width:{size}px;">
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="時間配分ドーナツ">
      {#if slices.length === 0}
        <!-- 空のドーナツ -->
        <circle cx={size/2} cy={size/2} r={(size/2)-thickness/2} stroke="#e6e6e6" stroke-width={thickness} fill="none" />
        <text x={size/2} y={size/2} class="center-label">{(0).toFixed(1)}h</text>
      {:else}
        {#each slices as s (s.category)}
          {@html `<path d="${describeDonutArc(size/2,size/2,(size/2),(size/2)-thickness,s.startAngle,s.endAngle)}" fill="${s.color}"><title>${s.category}: ${ (s.sec/3600).toFixed(2) } h</title></path>`}
        {/each}
        <!-- 中央合計 -->
        <text x={size/2} y={size/2} class="center-label">{ (totalSec/3600).toFixed(2) }h</text>
      {/if}
    </svg>
  
    <!-- レジェンド -->
    <div class="legend" aria-hidden="false">
      {#each slices as s}
        <div class="legend-item">
          <div class="swatch" style="background:{s.color}"></div>
          <div>{s.category} — {(s.sec/3600).toFixed(2)}h ({ totalSec ? ((s.sec/totalSec)*100).toFixed(1) : '0' }%)</div>
        </div>
      {/each}
    </div>
  </div>
  