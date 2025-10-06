<script>
  import { onMount } from 'svelte';
  import { logsStore } from '$lib/stores/logs.ts';
  import WeeklyStackedBars from '$lib/components/WeeklyStackedBars.svelte';

  const { logs, init } = logsStore;

  const categories = [
    { id:'c_univ', name:'大学' }, { id:'c_intern', name:'長期インターン' },
    { id:'c_toeic', name:'TOEIC' }, { id:'c_learning', name:'学習' },
    { id:'c_phone', name:'スマホ' }, { id:'c_fun', name:'遊び' },
    { id:'c_meal', name:'料理/食事' }, { id:'c_prep', name:'準備' },
    { id:'c_move', name:'移動' }, { id:'c_sleep', name:'睡眠' }, { id:'c_other', name:'その他' },
  ];
  const categoryLabels = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const categoryColors = {
    c_univ:'#0ea5e9', c_intern:'#06b6d4', c_toeic:'#a78bfa', c_learning:'#10b981',
    c_phone:'#f43f5e', c_fun:'#f59e0b', c_meal:'#ef4444', c_prep:'#22c55e',
    c_move:'#3b82f6', c_sleep:'#64748b', c_other:'#94a3b8'
  };

  const toLocalDayKey = (d=new Date()) => {
    const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset());
    return x.toISOString().slice(0,10);
  };
  const lastNDays = (n=7) => {
    const out = []; const now = new Date();
    for (let i=n-1; i>=0; i--) { const d = new Date(now); d.setDate(now.getDate()-i); out.push(toLocalDayKey(d)); }
    return out;
  };

  onMount(() => init());

  const durSec = (l) => l.end ? Math.max(0, Math.floor((new Date(l.end)-new Date(l.start))/1000)) : 0;
  const days7 = lastNDays(7);

  $: weekly = (() => {
    const base = Object.fromEntries(days7.map(k => [k, {}]));
    for (const l of $logs) {
      if (!l.end) continue;                 // 進行中は除外
      if (!base[l.day_key]) continue;       // 7日範囲外は無視
      const sec = durSec(l);
      base[l.day_key][l.category_id] = (base[l.day_key][l.category_id] || 0) + sec;
    }
    return days7.map(k => ({ day: k, totals: base[k] }));
  })();
</script>

<main class="wrap">
  <header class="top">
    <h1>Time Tracker — 週間ビュー</h1>
    <div class="spacer" />
    <a href="/" class="ghost">← 今日のダッシュボード</a>
  </header>

  <section class="card">
    <h3>直近7日・カテゴリ別の時間（縦軸=時間 0–24h）</h3>
    <WeeklyStackedBars
      days={weekly}
      {categories}
      {categoryLabels}
      {categoryColors}
      width={980}
      height={360}
    />
  </section>
</main>

<style>
  :global(body){ background:#f8fafc }
  .wrap{ padding:16px; min-height:100vh }
  .top{ display:flex; align-items:center; gap:12px; margin-bottom:12px }
  .top h1{ margin:0; font-size:1.4rem }
  .spacer{ flex:1 }
  .ghost{ text-decoration:none; border:1px solid #e5e7eb; padding:6px 10px; border-radius:10px; color:#334155; background:#fff }
  .card{ background:#fff; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,.06); padding:12px }
  h3{ margin:0 0 8px 0; font-size:1rem }
</style>
