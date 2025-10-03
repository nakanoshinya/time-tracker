<script>
  import { onMount } from 'svelte';
  import DonutChart from '$lib/components/DonutChart.svelte';
  import Clock24h from '$lib/components/Clock24h.svelte';
  import LogEditor from '$lib/components/LogEditor.svelte';
  import { logsStore } from '$lib/stores/logs';

  const { logs, running, start, stop, manualUpdate, manualInsert, init } = logsStore;

  // カテゴリ（ID/表示名/色）— 11種
  const categories = [
    { id: 'c_univ',     name: '大学',         color: '#2563EB' },
    { id: 'c_intern',   name: '長期インターン', color: '#0EA5E9' },
    { id: 'c_toeic',    name: 'TOEIC',       color: '#14B8A6' },
    { id: 'c_learning', name: '学習',         color: '#10B981' },
    { id: 'c_phone',    name: 'スマホ',       color: '#F59E0B' },
    { id: 'c_fun',      name: '遊び',         color: '#F97316' },
    { id: 'c_meal',     name: '料理/食事',    color: '#EF4444' },
    { id: 'c_prep',     name: '準備',         color: '#8B5CF6' },
    { id: 'c_move',     name: '移動',         color: '#A855F7' },
    { id: 'c_sleep',    name: '睡眠',         color: '#64748B' },
    { id: 'c_other',    name: 'その他',       color: '#94A3B8' },
  ];
  const categoryColors = Object.fromEntries(categories.map(c => [c.id, c.color]));
  const categoryLabels = Object.fromEntries(categories.map(c => [c.id, c.name]));

  // ローカル日付キー
  const todayLocalKey = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  };
  let dayKey = todayLocalKey();
  let nowStr = '';
  let timerHandle;

  // 編集ダイアログ
  let editorOpen = false;
  let editorInitial = null; // 既存ログ or null（新規=手動追加）

  // 開始カテゴリピッカー
  let pickerOpen = false;
  let pickerDlg;

  // ログ一覧の表示制御
  let showAllLogs = false;

  onMount(() => {
    init?.();
    timerHandle = setInterval(() => { nowStr = new Date().toLocaleTimeString(); }, 1000);
    return () => clearInterval(timerHandle);
  });

  function openAddManual(){ editorInitial = null; editorOpen = true; }
  function openEditLog(log){ editorInitial = log; editorOpen = true; }

  async function onEditorSave(e){
    try {
      const v = e.detail.value;
      if (editorInitial && editorInitial.id) {
        await manualUpdate(editorInitial.id, { category_id: v.category_id, start: v.start, end: v.end, note: v.note });
      } else {
        await manualInsert({ category_id: v.category_id, start: v.start, end: v.end, note: v.note });
      }
      editorOpen = false;
    } catch (err) {
      console.error('manual save failed', err);
      alert('保存に失敗しました: ' + (err?.message ?? err));
    }
  }
  function onEditorCancel(){ editorOpen = false; }

  function openPicker(){ pickerOpen = true; }
  function closePicker(){ pickerOpen = false; }
  function chooseCategory(catId){ closePicker(); start(catId); }

  $: if (pickerOpen) { pickerDlg?.showModal?.(); }
  $: if (!pickerOpen && pickerDlg?.open) { pickerDlg.close(); }
</script>

<style>
  .toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    align-items: start;
    margin-top: 8px;
  }
  .card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 12px;
  }
  .card h3 { margin: 4px 0 8px; font-size: 1rem; }
</style>

<main style="padding:20px;font-family:system-ui;">
  <h1>Time Tracker</h1>

  <!-- ヘッダー -->
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <div><strong>現在の時刻：</strong>{nowStr}</div>
    <label><strong>表示日：</strong><input type="date" bind:value={dayKey} /></label>
  </div>

  <!-- 操作（最小化） -->
  <section style="margin-top:14px;">
    <strong>操作</strong>
    <div class="toolbar">
      <button on:click={openPicker} style="padding:8px 12px;border:1px solid #eee;border-radius:8px;background:white">開始</button>
      <button on:click={stop} style="padding:8px 12px;border:1px solid #eee;border-radius:8px;background:#111;color:#fff">停止</button>
      <button on:click={openAddManual} style="padding:8px 12px;border:1px solid #eee;border-radius:8px;background:#f7f7f7">編集</button>
    </div>
  </section>

  <!-- 開始カテゴリピッカー（dialog） -->
  <dialog bind:this={pickerDlg} style="padding:0;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.2);">
    <div style="min-width:320px;max-width:520px;">
      <header style="padding:14px 16px;border-bottom:1px solid #eee;font-weight:600">開始するカテゴリを選択</header>
      <div style="padding:12px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
          {#each categories as c, i}
            <button on:click={() => chooseCategory(c.id)}
                    style="display:flex;gap:8px;align-items:center;justify-content:flex-start;padding:10px;border:1px solid #eee;border-radius:10px;background:white;">
              <span style="width:12px;height:12px;border-radius:3px;background:{c.color}"></span>
              <span>{c.name}</span>
            </button>
          {/each}
        </div>
      </div>
      <footer style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #eee">
        <button on:click={closePicker} style="padding:6px 12px;border:1px solid #eee;border-radius:8px;background:#f7f7f7">閉じる</button>
      </footer>
    </div>
  </dialog>

  <!-- 進行中 -->
  <section style="margin-top:16px;">
    <h2>現在の計測</h2>
    {#if $running}
      <div>計測中: {categoryLabels[$running.category_id] ?? $running.category_id} ／ {new Date($running.start).toLocaleTimeString()}</div>
    {:else}
      <div>計測中のログはありません</div>
    {/if}
  </section>

  <!-- ログ一覧（直近3件 + もっと見る） -->
  <section style="margin-top:16px;">
    <h2>ログ一覧</h2>
    <ul>
      {#each (showAllLogs ? $logs.slice().reverse() : $logs.slice().reverse().slice(0,3)) as l}
        <li style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0;">
          <span style="min-width:7em">{l.day_key}</span>
          <span style="min-width:9em">{categoryLabels[l.category_id] ?? l.category_id}</span>
          <span>{new Date(l.start).toLocaleTimeString()} → {l.end ? new Date(l.end).toLocaleTimeString() : '（進行中）'}</span>
          <button on:click={() => openEditLog(l)} style="margin-left:auto;border:1px solid #eee;background:white;border-radius:6px;padding:4px 8px">編集</button>
        </li>
      {/each}
    </ul>
    <div style="margin-top:6px;">
      <button on:click={() => showAllLogs = !showAllLogs}
              style="padding:6px 10px;border:1px solid #eee;border-radius:8px;background:#f7f7f7">
        {showAllLogs ? '閉じる' : 'もっと見る'}
      </button>
    </div>
  </section>

  <!-- 可視化（横並び） -->
  <section style="margin-top:16px;">
    <h2>可視化</h2>
    <div class="charts">
      <div class="card">
        <h3>カテゴリ配分（合計）</h3>
        <DonutChart {dayKey} size={300} thickness={52} {categoryColors} {categoryLabels} />
      </div>
      <div class="card">
        <h3>24時間（時間帯）</h3>
        <Clock24h {dayKey} size={320} ringThickness={14} ringGap={4} {categoryColors} {categoryLabels} />
      </div>
    </div>
  </section>

  <!-- エディタダイアログ（手動追加/既存編集） -->
  <LogEditor
    bind:open={editorOpen}
    {categories}
    initial={editorInitial}
    title={editorInitial ? '記録の編集' : '手動で記録を追加'}
    on:save={onEditorSave}
    on:cancel={onEditorCancel}
  />
</main>
