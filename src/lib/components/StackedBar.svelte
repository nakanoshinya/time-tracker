<script>
  export let segments = []; // [{label,value,color}]
  export let height = 12;
  $: sum = segments.reduce((a,b)=>a+b.value,0);
  $: segs = segments.map(s => ({...s, pct: sum? (s.value/sum*100):0}));
</script>

<div class="bar" style={`height:${height}px`}>
  {#each segs as s}<span class="seg" style={`width:${s.pct}%;background:${s.color}`} title={`${s.label}: ${s.value}s`} />{/each}
</div>

<style>
  .bar{display:flex;overflow:hidden;border-radius:8px;background:#f3f4f6}
  .seg{height:100%}
</style>
