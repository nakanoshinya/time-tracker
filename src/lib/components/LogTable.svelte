<script>
  import { createEventDispatcher } from 'svelte';
  export let logs = [];
  export let max = 5;
  export let categoryLabels = {};
  const dispatch = createEventDispatcher();

  const labelOf = (id) => categoryLabels[id] ?? id;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString();
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString();
  const durSec = (l) => l.end ? Math.max(0, Math.floor((new Date(l.end)-new Date(l.start))/1000)) : 0;
  const durH = (s) => (s/3600).toFixed(2)+'h';

  let limit = max;
  $: sorted = logs.slice().sort((a,b)=> new Date(b.start) - new Date(a.start));
  $: view = sorted.slice(0, limit);

  function showAll(){ limit = logs.length; }
  function showLess(){ limit = max; }
  function onEdit(l){ dispatch('edit', { item: l }); }
</script>

<div class="card log-card">
  <h3>ログ一覧</h3>

  <table class="log">
    <colgroup>
      <col class="col-date" />
      <col class="col-cat" />
      <col class="col-time" />
      <col class="col-time" />
      <col class="col-dur" />
      <col class="col-memo" />
      <col class="col-edit" />
    </colgroup>

    <thead>
      <tr>
        <th>日付</th><th>カテゴリ</th><th>開始</th><th>終了</th><th>時間</th><th>メモ</th><th></th>
      </tr>
    </thead>
    <tbody>
      {#each view as l}
        <tr>
          <td>{fmtDate(l.start)}</td>
          <td class="cat" title={labelOf(l.category_id)}>{labelOf(l.category_id)}</td>
          <td>{fmtTime(l.start)}</td>
          <td>{l.end ? fmtTime(l.end) : '—'}</td>
          <td>{durH(durSec(l))}</td>
          <td class="memo">{l.note || ''}</td>
          <td class="editcell">
            <button class="ghost small" on:click={() => onEdit(l)}>編集</button>
          </td>
        </tr>
      {/each}
      {#if view.length === 0}
        <tr><td colspan="7" class="empty">記録がありません</td></tr>
      {/if}
    </tbody>
  </table>

  {#if logs.length > max}
    <div class="more">
      {#if limit > max}
        <button class="ghost" on:click={showLess}>閉じる</button>
      {:else}
        <button class="ghost" on:click={showAll}>もっと見る</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.06);padding:12px}
  h3{margin:0 0 8px 0;font-size:1rem}

  table.log{
    width:100%;
    table-layout:fixed;
    border-collapse:separate;
    border-spacing:0 8px;
  }
  th{font-size:.85rem;color:#64748b;text-align:left;padding:4px 8px;white-space:nowrap}
  td{
    background:#f8fafc;padding:10px 8px;
    border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;
    white-space:nowrap;
  }
  tr td:first-child{border-left:1px solid #eef2f7;border-top-left-radius:10px;border-bottom-left-radius:10px}
  tr td:last-child{border-right:1px solid #eef2f7;border-top-right-radius:10px;border-bottom-right-radius:10px}

  .col-date{ width: 96px; }
  .col-cat { width: 128px; }
  .col-time{ width: 88px; }
  .col-dur { width: 64px; }
  .col-memo{ width: auto; }
  .col-edit{ width: 64px; }

  td.cat{ overflow:hidden; text-overflow:ellipsis; }
  td.memo{ white-space:normal; }
  .editcell{ text-align:right; }

  .empty{ text-align:center; color:#64748b; background:transparent }

  .more{margin-top:8px;text-align:right}
  .ghost{background:transparent;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px}
  .ghost.small{ padding:4px 8px; font-size:.85rem; }

  @media (max-width: 980px){
    .col-memo{ display:none; }
    th:nth-child(6), td:nth-child(6){ display:none; }
    .col-cat{ width: 140px; }
  }
</style>
