<!-- src/lib/components/DonutChart.svelte -->
<script>
  // 入力: segments = [{ label:'大学', value: 秒数, color:'#hex' }, ...]
  export let segments = [];
  export let size = 260;
  export let thickness = 52;

  const cx = size/2, cy = size/2;
  const r  = size/2 - thickness/2;
  const C  = 2 * Math.PI * r;

  $: total = segments.reduce((a, s) => a + (s.value || 0), 0);
  $: parts = (() => {
    if (total <= 0) return [];
    let acc = 0;
    return segments.map((s) => {
      const len = (s.value / total) * C;
      const seg = { ...s, dash: `${len} ${C - len}`, offset: -acc };
      acc += len;
      return seg;
    });
  })();
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
