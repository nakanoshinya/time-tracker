<script>
  export let days = [];                // [{day:'YYYY-MM-DD', totals:{c_xxx:sec,...}}, ...]
  export let categories = [];          // [{id,name}, ...]
  export let categoryLabels = {};      // {id:'大学',...}
  export let categoryColors  = {};     // {id:'#color',...}
  export let width = 900;
  export let height = 320;

  const pad = { top: 16, right: 20, bottom: 40, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top  - pad.bottom;

  const maxSec = 24 * 3600;
  const secToY  = (sec) => pad.top + innerH - (sec / maxSec) * innerH;
  const fmtMD   = (k) => k?.slice(5).replace('-', '/'); // 'MM/DD'
  const fmtH    = (sec) => (sec/3600).toFixed(2) + 'h';
  const palette = ['#10B981','#6366F1','#F59E0B','#EF4444','#06B6D4','#84CC16','#A78BFA','#F97316'];
  const colorOf = (id, i) => categoryColors[id] ?? palette[i % palette.length];

  const yticksH = [0,6,12,18,24];

  const barGap  = 8;
  const barSlot = innerW / Math.max(1, days.length);
  const barW    = Math.max(8, barSlot - barGap);

  $: bars = days.map((d, di) => {
    const totals = d?.totals || {};
    let stack = 0;
    const segs = categories.map((c, ci) => {
      const sec = totals[c.id] || 0;
      if (sec <= 0) return null;
      const yTop = secToY(stack + sec);
      const yBot = secToY(stack);
      const seg = {
        id: c.id,
        label: categoryLabels[c.id] ?? c.id,
        sec,
        y: yTop,
        h: Math.max(0, yBot - yTop),
        color: colorOf(c.id, ci)
      };
      stack += sec;
      return seg;
    }).filter(Boolean);

    const x = pad.left + di*barSlot + (barSlot - barW)/2;
    return { day: d.day, x, sumSec: stack, segs };
  });
</script>

<svg {width} {height} role="img" aria-label="週間・カテゴリ別の積み上げ棒グラフ">
  {#each [0,6,12,18,24] as h (h)}
    <line x1={pad.left} y1={secToY(h*3600)} x2={width-pad.right} y2={secToY(h*3600)} stroke="#e5e7eb" stroke-width="1" />
    <text x={pad.left-8} y={secToY(h*3600)} text-anchor="end" dominant-baseline="middle" fill="#64748b" font-size="12">{h}</text>
  {/each}
  <text x={pad.left-20} y={pad.top-4} text-anchor="end" fill="#64748b" font-size="11">h</text>

  {#each bars as b (b.day)}
    {#each b.segs as s (s.id)}
      <rect x={b.x} y={s.y} width={barW} height={s.h} fill={s.color} rx="4">
        <title>{fmtMD(b.day)}  {s.label}: {fmtH(s.sec)}</title>
      </rect>
    {/each}
    {#if b.sumSec > 0}
      <text x={b.x + barW/2} y={secToY(b.sumSec) - 6} text-anchor="middle" fill="#334155" font-size="11">
        {(b.sumSec/3600).toFixed(1)}h
      </text>
    {/if}
    <text x={b.x + barW/2} y={height - 14} text-anchor="middle" fill="#64748b" font-size="12">{fmtMD(b.day)}</text>
  {/each}
</svg>

<div class="legend">
  {#each categories as c, i (c.id)}
    <div class="legend-item">
      <span class="sw" style={`background:${colorOf(c.id,i)}`}></span>{categoryLabels[c.id] ?? c.id}
    </div>
  {/each}
</div>

<style>
  svg { display:block; width:100%; height:auto; max-width:100%; }
  .legend { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
  .legend-item { display:flex; align-items:center; gap:6px; padding:3px 8px; border-radius:999px; background:#f1f5f9; font-size:.88rem; color:#334155; }
  .sw { width:12px; height:12px; border-radius:3px; }
</style>
