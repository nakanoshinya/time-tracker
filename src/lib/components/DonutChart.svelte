<script lang="ts">
  // 入力: segments = [{ label:'大学', value: 秒数, color:'#hex' }, ...]
  type DonutSegment = { label: string; value: number; color: string };
  type DonutPart = DonutSegment & { dash: string; offset: number };
  export let segments: DonutSegment[] = [];
  export let size: number = 260;
  export let thickness: number = 52;

  const cx = size / 2, cy = size / 2;
  const r  = size / 2 - thickness / 2;
  const C  = 2 * Math.PI * r;

  let total: number = 0;
  $: total = segments.reduce((a, s) => a + (s.value || 0), 0);

  let parts: DonutPart[] = [];
  $: parts = (() => {
    if (total <= 0) return [];
    let acc = 0;
    return segments.map((s) => {
      const len = (s.value / total) * C;
      const seg: DonutPart = { ...s, dash: `${len} ${C - len}`, offset: -acc };
      acc += len;
      return seg;
    });
  })();

  // 凡例用アイテム（秒→時間に換算）
  let legend: { label: string; h: number; color: string }[] = [];
  $: legend = segments
    .filter((s) => (s?.value || 0) > 0)
    .map((s) => ({ label: s.label, h: +(s.value/3600).toFixed(2), color: s.color }));
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="カテゴリ分布">
  <!-- 背景リング -->
  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" stroke-width={thickness} />

  <!-- 12時始まりにするため -90°回転 -->
  <g transform={`rotate(-90 ${cx} ${cy})`}>
    {#each parts as p (p.label)}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={p.color} stroke-width={thickness}
        stroke-dasharray={p.dash}
        stroke-dashoffset={p.offset}
      >
        <title>{p.label}: {(p.value/3600).toFixed(2)}h</title>
      </circle>
    {/each}
  </g>

  <!-- 中央トータル表示 -->
  <text x={cx} y={cy} text-anchor="middle" dominant-baseline="middle" fill="#334155" font-size="14">
    {(total/3600).toFixed(1)}h
  </text>
</svg>

<div class="legend">
  {#each legend as seg}
    <div class="legend-item">
      <span class="sw" style={`background:${seg.color}`}></span>
      {seg.label} — {seg.h}h
    </div>
  {/each}
  {#if legend.length === 0}
    <div class="legend-item empty">データなし</div>
  {/if}
  
</div>

<style>
  .legend { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; font-size:0.9rem; }
  .legend-item { display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:6px; background:rgba(0,0,0,0.04); }
  .legend-item.empty { background:transparent; color:#64748b }
  .sw { width:12px; height:12px; border-radius:2px; }
</style>
