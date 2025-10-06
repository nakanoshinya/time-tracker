<script>
  export let title = ''; export let value = ''; export let sub = '';
</script>
<div class="card">
  <div class="t">{title}</div>
  <div class="v">{value}</div>
  {#if sub}<div class="s">{sub}</div>{/if}
</div>
<style>
  .card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.06);padding:12px}
  .t{color:#6b7280;font-size:.9rem}
  .v{font-weight:700;font-size:1.6rem;margin-top:6px}
  .s{color:#6b7280;margin-top:4px}
</style>
