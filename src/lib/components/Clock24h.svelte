<script>
  import { logsStore } from '$lib/stores/logs.ts';
  const { logs } = logsStore;

  export let dayKey;
  export let size = 260;
  export let ring = 24;
  export let categoryColors = {};
  export let categoryLabels = {};
  const labelOf = (id) => categoryLabels[id] ?? id;

  const cx = size/2, cy = size/2;
  const outerR = size/2 - 6;
  const innerR = outerR - ring;

  // ★修正点：ISOは new Date(iso) で既にローカル時刻になる。追加補正しない。
  const toLocal = (iso) => new Date(iso);

  // 0..24h → 0..360deg
  const degOf = (date) => {
    const h = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
    return h / 24 * 360;
  };

  const polar = (cx, cy, r, deg) => {
    const rad = (deg-90) * Math.PI/180;
    return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) };
  };
  function arcPath(cx, cy, r1, r2, a0, a1){
    const p0o = polar(cx, cy, r2, a0), p1o = polar(cx, cy, r2, a1);
    const p0i = polar(cx, cy, r1, a0), p1i = polar(cx, cy, r1, a1);
    const large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
    return [
      `M ${p0o.x} ${p0o.y}`,
      `A ${r2} ${r2} 0 ${large} 1 ${p1o.x} ${p1o.y}`,
      `L ${p1i.x} ${p1i.y}`,
      `A ${r1} ${r1} 0 ${large} 0 ${p0i.x} ${p0i.y}`,
      'Z'
    ].join(' ');
  }

  $: segments = [];
  $: (function build(){
    segments = [];
    const dayLogs = $logs.filter(l => l.day_key === dayKey);
    for (const l of dayLogs) {
      const s = toLocal(l.start), e = l.end ? toLocal(l.end) : null;
      let a0 = degOf(s), a1 = e ? degOf(e) : degOf(new Date());
      if (a1 < a0) a1 += 360; // 日またぎ簡易対応
      segments.push({
        id: l.category_id,
        color: categoryColors[l.category_id] || '#999',
        a0, a1,
        sec: l.end ? Math.max(0, Math.floor((new Date(l.end)-new Date(l.start))/1000)) : 0
      });
    }
  })();

  $: summary = (() => {
    const t={}; for(const s of segments){ t[s.id]=(t[s.id]||0)+(s.sec||0); } return t;
  })();
  $: items = Object.entries(summary).map(([id,sec])=>({id, h:+(sec/3600).toFixed(2), color: categoryColors[id]||'#999' }));
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="24時間円グラフ">
  <!-- 背景リング -->
  <circle cx={cx} cy={cy} r={(innerR+outerR)/2} fill="none" stroke="#f1f5f9" stroke-width={ring} />

  <!-- 各ログの扇形 -->
  {#each segments as s}
    <path d={arcPath(cx, cy, innerR, outerR, s.a0, s.a1)} fill={s.color} opacity="0.9" />
  {/each}

  <!-- 目盛（6時間おき） -->
  {#each [0,6,12,18] as h}
    <line x1={polar(cx,cy,innerR-6,h*15).x} y1={polar(cx,cy,innerR-6,h*15).y}
          x2={polar(cx,cy,innerR-2,h*15).x} y2={polar(cx,cy,innerR-2,h*15).y}
          stroke="#cbd5e1" stroke-width="1" />
    <text x={polar(cx,cy,innerR-14,h*15).x} y={polar(cx,cy,innerR-14,h*15).y}
          text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#64748b">{h}</text>
  {/each}
</svg>

<div class="legend">
  {#each items as seg}
    <div class="legend-item">
      <span class="sw" style={`background:${seg.color}`}></span>
      {labelOf(seg.id)} — {seg.h}h
    </div>
  {/each}
</div>

<style>
  .legend { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; font-size:0.9rem; }
  .legend-item { display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:6px; background:rgba(0,0,0,0.04); }
  .sw { width:12px; height:12px; border-radius:2px; }
</style>
