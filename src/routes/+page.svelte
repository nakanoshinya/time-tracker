<script lang="ts">
  import StartStopCard from '$lib/components/StartStopCard.svelte';
  import { onMount } from 'svelte';
  import { logsStore, type CategoryId } from '$lib/stores/logs';
  import DonutChart from '$lib/components/DonutChart.svelte';
  import Clock24h from '$lib/components/Clock24h.svelte';
  import LogTable from '$lib/components/LogTable.svelte';
  import LogEditor from '$lib/components/LogEditor.svelte';

  const { logs, init, manualInsert, manualUpdate } = logsStore;

  // カテゴリ
  const categories: { id: CategoryId; name: string }[] = [
    { id:'c_univ',     name:'大学' },
    { id:'c_intern',   name:'長期インターン' },
    { id:'c_toeic',    name:'TOEIC' },
    { id:'c_learning', name:'学習' },
    { id:'c_phone',    name:'スマホ' },
    { id:'c_fun',      name:'遊び' },
    { id:'c_meal',     name:'料理/食事' },
    { id:'c_prep',     name:'準備' },
    { id:'c_move',     name:'移動' },
    { id:'c_sleep',    name:'睡眠' },
    { id:'c_other',    name:'その他' },
  ];
  const categoryLabels: Record<string, string> = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const categoryColors: Record<string, string> = {
    c_univ:'#0ea5e9', c_intern:'#06b6d4', c_toeic:'#a78bfa', c_learning:'#10b981',
    c_phone:'#f43f5e', c_fun:'#f59e0b', c_meal:'#ef4444', c_prep:'#22c55e',
    c_move:'#3b82f6', c_sleep:'#64748b', c_other:'#94a3b8'
  };
  const palette = ['#10B981','#6366F1','#F59E0B','#EC4899','#06B6D4','#84CC16','#A78BFA','#F97316'];

  // ローカル日のキー
  const toLocalDayKey = (d: Date=new Date()) => {
    const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset());
    return x.toISOString().slice(0,10);
  };
  let dayKey = toLocalDayKey();

  onMount(() => init());

  // ====== クランプ用ユーティリティ ======
  // 指定日のローカル 00:00–24:00 境界
  const dayBoundsOf = (key: string) => {
    const start = new Date(`${key}T00:00:00`);             // ローカル時刻として解釈
    const end   = new Date(start.getTime() + 24*3600*1000);
    return { start, end };
  };

  // ログ区間を当日範囲にクランプして秒数を返す（未終了は0）
  const clampSec = (log: any, dayStart: Date, dayEnd: Date): number => {
    if (!log.end) return 0;
    const s = new Date(log.start);
    const e = new Date(log.end);
    const cs = s < dayStart ? dayStart : s;
    const ce = e > dayEnd   ? dayEnd   : e;
    const sec = (ce.getTime() - cs.getTime()) / 1000;
    return sec > 0 ? Math.floor(sec) : 0;
  };

  // 当日の境界
  let dayStart, dayEnd;
  $: ({ start: dayStart, end: dayEnd } = dayBoundsOf(dayKey));

  // 画面のログ一覧：当日に「少しでも重なる」ものを表示（未終了は除外）
  $: dayLogs = $logs.filter((l: any) => {
    if (!l.end) return false;
    const s = new Date(l.start);
    const e = new Date(l.end);
    return e > dayStart && s < dayEnd;
  });

  // すべてのログから当日の寄与分だけを集計（カテゴリ別・秒）
  let donutTotals: Record<string, number> = {};
  $: donutTotals = (() => {
    const t: Record<string, number> = {};
    for (const l of $logs) {
      const sec = clampSec(l, dayStart, dayEnd);
      if (sec > 0) t[l.category_id] = (t[l.category_id] || 0) + sec;
    }
    return t;
  })();

  // 円グラフ用セグメントへ変換（DonutChart は描画専用）
  $: donutSegs = Object.entries(donutTotals as Record<string, number>).map(([id, sec], i) => ({
    label: categoryLabels[id] ?? id,
    value: sec,
    color: categoryColors[id] || palette[i % palette.length],
  }));

  // エディタ（新規/編集）
  let editorOpen = false, editorInitial: any = null;
  function openEditor(){ editorInitial = null; editorOpen = true; }
  function openEditorFor(item: any){ editorInitial = JSON.parse(JSON.stringify(item)); editorOpen = true; }
  async function onEditorSave(e: CustomEvent<{ value: any }>){
    const v = e.detail.value;
    if (v.id) await manualUpdate(v.id, v); else await manualInsert(v);
    editorOpen = false;
  }
</script>

<main class="wrap">
  <header class="top">
    <h1>Time Tracker</h1>
    <div class="spacer"></div><a href="/weekly" class="ghost">週間ビュー</a>
    <input type="date" bind:value={dayKey} />
  </header>

  <!-- レイアウト（重なり防止の単一グリッド） -->
  <div class="pagegrid">
    <!-- 上段 左：計測 -->
    <div class="section section-timer">
      <StartStopCard {categories} {categoryLabels} onOpenEditor={openEditor} />
    </div>

    <!-- 上段 右：ログ（行の編集でモーダル起動） -->
    <div class="section section-log">
      <LogTable
        logs={dayLogs}
        max={2}
        {categoryLabels}
        on:edit={(e) => openEditorFor(e.detail.item)}
      />
    </div>

    <!-- 下段 左：カテゴリ分布（クランプ集計したセグメントを渡す） -->
    <div class="section section-donut">
      <div class="card">
        <h3>カテゴリの分布</h3>
        <DonutChart segments={donutSegs} size={260} thickness={52} />
      </div>
    </div>

    <!-- 下段 右：24時間円グラフ（従来どおり dayKey 連携） -->
    <div class="section section-clock">
      <div class="card">
        <h3>24時間の円グラフ</h3>
        <Clock24h {dayKey} {categoryColors} {categoryLabels} />
      </div>
    </div>
  </div>

  <LogEditor bind:open={editorOpen} {categories} {editorInitial} on:save={onEditorSave} />
</main>

<style>
  :global(body){background:#f8fafc}
  :global(*){ box-sizing: border-box; }

  .wrap{padding:16px;min-height:100vh}
  .top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .top h1{margin:0;font-size:1.6rem}
  .spacer{flex:1}
  .ghost{
    text-decoration:none; border:1px solid #e5e7eb; padding:6px 10px;
    border-radius:10px; color:#334155; background:#fff
  }

  .pagegrid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas:
      "timer log"
      "donut clock";
    gap:16px;
    align-items:stretch;
    width:100%;
  }
  .section{ min-width:0; }
  .section-timer{ grid-area: timer; }
  .section-log  { grid-area: log; }
  .section-donut{ grid-area: donut; }
  .section-clock{ grid-area: clock; }

  .section-timer :global(.card),
  .section-log   :global(.card){
    height:100%;
    min-height:260px;
    display:flex; flex-direction:column;
    overflow:hidden;
  }

  .section-donut .card,
  .section-clock .card{
    height:100%;
    min-height:360px;
    display:flex; flex-direction:column;
    overflow:hidden;
  }

  .card{
    background:#fff;border-radius:16px;
    box-shadow:0 2px 10px rgba(0,0,0,.06);
    padding:12px;
  }
  h3{margin:0 0 8px 0;font-size:1rem}

  @media (max-width: 980px){
    .pagegrid{
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto auto;
      grid-template-areas:
        "timer"
        "log"
        "donut"
        "clock";
    }
  }
</style>
