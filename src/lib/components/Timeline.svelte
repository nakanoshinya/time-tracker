<script>
  import { onMount } from 'svelte';
  import { logsStore } from '$lib/stores/logs.ts';
  const { logs } = logsStore;

  export let dayKey = (new Date()).toISOString().slice(0,10);
  export let height = 80;
  export let padding = 24;
  export let categoryColors = {};
  export let categoryLabels = {};

  const defaultPalette = ["#4f46e5","#06b6d4","#f97316","#10b981","#ef4444","#8b5cf6","#f59e0b","#0ea5e9"];
  const idxColor = (cat, i) => categoryColors[cat] ?? defaultPalette[i % defaultPalette.length];
  const labelOf  = (id) => categoryLabels[id] ?? id;

  $: dayStart = new Date(dayKey + 'T00:00:00'); // ローカル日の開始
  $: dayEnd   = new Date(new Date(dayStart).setDate(dayStart.getDate()+1)); // 翌日0:00

  $: dayLogs = $logs
    .filter(l => l.day_key === dayKey)
    .map((l, i) => {
      const s = new Date(l.start);
      const e = l.end ? new Date(l.end) : new Date();
      const startClamped = s < dayStart ? dayStart : s;
      const endClamped   = e > dayEnd ? dayEnd : e;
      const startPct = (startClamped - dayStart) / (dayEnd - dayStart);
      const endPct   = (endClamped - dayStart) / (dayEnd - dayStart);
      return { ...l, s: startClamped, e: endClamped, startPct, endPct, index: i };
    });

  let container; let width = 640;
  function updateWidth(){ if (container) width = container.clientWidth; }
  onMount(() => {
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(container);
    return () => ro.disconnect();
  });

  const fmtTime = (d) => new Date(d).toLocaleTimeString();
</script>

<style>
  .timeline { width:100%; border:1px solid #eee; padding:8px; border-radius:8px; background:#fff; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
  .bar { rx:4; ry:4; }
  .axis { font-size:12px; fill:#666; }
</style>

<div bind:this={container} class="timeline">
  <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
    <!-- 時刻目盛 -->
    {#each Array.from({length:25}) as _, h}
      {#if width}
        <g transform={`translate(${padding + ((width - padding*2) * (h/24))},${height - 18})`}>
          <line x1="0" y1="0" x2="0" y2="-6" stroke="#ccc"></line>
          <text x="0" y="0" class="axis" text-anchor="middle">{h}</text>
        </g>
      {/if}
    {/each}

    <!-- 区間バー -->
    {#each dayLogs as l}
      {#if width}
        {@html (() => {
          const x = padding + ((width - padding*2) * l.startPct);
          const w = Math.max(2, (width - padding*2) * (l.endPct - l.startPct));
          const y = 8 + ((height-36) * 0.15 * (l.index % 6)); // 簡易スタック
          const h = Math.min((height-36) * 0.7, 18);
          const color = idxColor(l.category_id, l.index);
          const title = `${labelOf(l.category_id)}\n${fmtTime(l.s)} → ${l.e?fmtTime(l.e):'(running)'}\n${l.duration_sec? l.duration_sec+'s':''}`;
          return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${color}" class="bar"><title>${title}</title></rect></g>`;
        })()}
      {/if}
    {/each}

    <!-- 現在時刻ライン -->
    {#if $logs.length}
      {@html (() => {
        const now = Date.now();
        if (now < dayStart.getTime() || now > dayEnd.getTime()) return '';
        const pct = (now - dayStart) / (dayEnd - dayStart);
        const x = padding + ((width - padding*2) * pct);
        return `<g><line x1="${x}" x2="${x}" y1="4" y2="${height-20}" stroke="#ff0000" stroke-width="1" stroke-opacity="0.6"></line></g>`;
      })()}
    {/if}
  </svg>

  <!-- 凡例 -->
  <div style="margin-top:8px;font-size:13px;display:flex;gap:8px;flex-wrap:wrap">
    {#each Array.from(new Set(dayLogs.map(d=>d.category_id))) as c, i}
      <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.03)">
        <span style="width:12px;height:12px;background:{idxColor(c,i)};display:inline-block;border-radius:2px"></span>
        <span>{labelOf(c)}</span>
      </div>
    {/each}
  </div>
</div>
