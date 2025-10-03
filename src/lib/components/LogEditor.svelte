<script>
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '記録の編集';
  export let categories = []; // [{id, name}]
  export let initial = null;  // 既存ログ or null（新規）

  const dispatch = createEventDispatcher();
  let dlg;
  let formEl;

  // 入力モデル
  let category_id = 'c_learning';
  let startLocal  = '';
  let endLocal    = '';
  let note        = '';

  // ISO ←→ datetime-local 変換
  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  };
  const toISO = (localStr) => {
    if (!localStr) return null;
    const d = new Date(localStr);
    return d.toISOString();
  };

  function loadInitial() {
    if (initial) {
      // 既存：終了が無い（進行中）なら「今」を自動補完
      category_id = initial.category_id ?? 'c_learning';
      startLocal  = toLocalInput(initial.start);
      endLocal    = initial.end ? toLocalInput(initial.end) : (() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0,16);
      })();
      note        = initial.note ?? '';
    } else {
      // 新規：直近30分
      const now = new Date();
      const start = new Date(now.getTime() - 30*60*1000);
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      startLocal = start.toISOString().slice(0,16);
      endLocal   = now.toISOString().slice(0,16);
      category_id = 'c_learning';
      note = '';
    }
  }

  $: if (open) {
    loadInitial();
    dlg?.showModal?.();
  } else {
    dlg?.open && dlg.close();
  }

  function onCancel(e){ e?.preventDefault(); dispatch('cancel'); }

  function onSave(e){
    e?.preventDefault?.();

    // フォーム制約（required等）を尊重
    if (!formEl?.checkValidity?.() ) {
      formEl?.reportValidity?.();
      return;
    }

    const start = toISO(startLocal);
    const end   = toISO(endLocal);

    if (!category_id || !start || !end) {
      alert('必須項目が未入力です');
      return;
    }
    if (new Date(end) < new Date(start)) {
      alert('終了時刻が開始より前です');
      return;
    }

    try {
      dispatch('save', { value: { category_id, start, end, note } });
    } catch (err) {
      console.error('save dispatch failed', err);
      alert('保存に失敗しました: ' + (err?.message ?? err));
    }
  }
</script>

<dialog bind:this={dlg} style="padding:0;border:none;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.2);">
  <!-- method="dialog" は使わず、自前で open を制御 -->
  <form bind:this={formEl} on:submit|preventDefault={onSave} style="min-width:320px;max-width:520px;">
    <header style="padding:14px 16px;border-bottom:1px solid #eee;font-weight:600">{title}</header>
    <div style="padding:16px;display:grid;gap:12px;">
      <label style="display:grid;gap:6px">
        <span>カテゴリ</span>
        <select bind:value={category_id} required>
          {#each categories as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>
      <label style="display:grid;gap:6px">
        <span>開始</span>
        <input type="datetime-local" bind:value={startLocal} required />
      </label>
      <label style="display:grid;gap:6px">
        <span>終了</span>
        <input type="datetime-local" bind:value={endLocal} required />
      </label>
      <label style="display:grid;gap:6px">
        <span>メモ</span>
        <textarea bind:value={note} rows="2" placeholder="任意"></textarea>
      </label>
    </div>
    <footer style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee">
      <button on:click={onCancel} type="button">キャンセル</button>
      <button class="save" type="submit">保存</button>
    </footer>
  </form>
</dialog>
