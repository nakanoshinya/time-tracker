<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { logsStore, type CategoryId } from '$lib/stores/logs';
  const { running, start, stop } = logsStore;

  export let categories: { id: CategoryId; name: string }[] = [];
  export let onOpenEditor: () => void = () => {};
  export let categoryLabels: Record<string, string> = {};
  const labelOf = (id: string) => categoryLabels[id] ?? id;

  let selected: CategoryId = categories?.[0]?.id ?? 'c_toeic';
  let note = '';
  let now = new Date(), t: any;

  onMount(() => t = setInterval(() => now = new Date(), 1000));
  onDestroy(() => clearInterval(t));

  const fmtHMS = (sec: number) => {
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const elapsed = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime())/1000));

  function doStart(){ if (selected) { start(selected, { note }); note=''; } }
  function doStop(){ stop(); }
</script>

<div class="card">
  <div class="title">計測</div>
  <div class="clock">{now.toLocaleTimeString()}</div>

  <div class="controls">
    <select class="select" bind:value={selected}>
      {#each categories as c}<option value={c.id}>{c.name}</option>{/each}
    </select>

    <input class="input" placeholder="メモ" bind:value={note} />

    {#if $running}
      <button class="primary stop" on:click={doStop}>停止</button>
    {:else}
      <button class="primary" on:click={doStart}>開始</button>
    {/if}

    <!-- 開始ボタンの右に編集（手動追加） -->
    <button class="ghost" on:click={onOpenEditor}>編集（手動追加）</button>

    <div class="spacer"></div>
  </div>

  <div class="status">
    {#if $running}
      <div>
        計測中: <b>{labelOf($running.category_id)}</b>
        ／ 開始 {new Date($running.start).toLocaleTimeString()}
        ／ 経過 {fmtHMS(elapsed($running.start))}
      </div>
    {:else}
      <div>待機中</div>
    {/if}
  </div>
</div>

<style>
  .card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.06);padding:16px}
  .title{font-weight:600;font-size:1.1rem;margin-bottom:6px}
  .clock{font-size:2rem;font-weight:700;margin:6px 0 12px}
  .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .select,.input{padding:8px 10px;border:1px solid #e5e7eb;border-radius:10px;min-width:140px}
  .primary{padding:10px 18px;border:0;border-radius:999px;background:#10b981;color:#fff;font-weight:700}
  .stop{background:#ef4444}
  .ghost{background:transparent;border:1px solid #e5e7eb;border-radius:10px;padding:8px 12px}
  .spacer{flex:1 1 auto}
  .status{margin-top:10px;color:#334155}
</style>
