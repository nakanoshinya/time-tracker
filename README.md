## Time Tracker（学習アウトプット）
<img width="3743" height="1956" alt="スクリーンショット 2025-10-06 133456" src="https://github.com/user-attachments/assets/eed4b5c9-08b9-4a8e-ac2a-279b602a990f" />
<img width="3839" height="1975" alt="スクリーンショット 2025-10-06 133356" src="https://github.com/user-attachments/assets/459c1a5b-25c8-40b0-a965-951bff529d40" />

SvelteKit を用いて実装したシンプルなタイムトラッカーです。日々の活動をカテゴリ別に計測・可視化します。

### 特徴
- 計測の開始/停止（メモ付き）
- 手動でのログ追加/編集（モーダル）
- 当日のログ一覧、24時間円グラフ、カテゴリ分布ドーナツ
- 週間スタックバー（直近7日）
- SQLite（Prisma）で手軽に開始、将来的に PostgreSQL など RDB へ移行可能

---

## セットアップ

1) 依存関係のインストール
```bash
bun install
```

2) 開発サーバー
```bash
bun run dev
```

DB は Prisma/SQLite を使用します。`.env` の `DATABASE_URL` が未設定の場合は SvelteKit の既定（`prisma/dev.db`）を参照します。

---

## 技術スタック
- フロント: SvelteKit v2 / Svelte v5 / Vite 7 / TypeScript
- サーバ/API: SvelteKit `+server.ts`
- DB/ORM: Prisma + SQLite

---

## ディレクトリ（主要）
- `src/routes/+page.svelte`: ダッシュボード（計測・一覧・チャート）
- `src/routes/weekly/+page.svelte`: 週間ビュー
- `src/lib/components/*`: UI コンポーネント群
- `src/lib/stores/logs.ts`: ログの状態管理（`logs`, `running`, `start/stop`, `refresh` など）
- `src/routes/api/logs/+server.ts`: 一覧取得・作成
- `src/routes/api/logs/[id]/+server.ts`: 部分更新
- `prisma/schema.prisma`: Prisma スキーマ

---

## 画面機能
- 計測カード: カテゴリ選択、メモ入力、開始/停止、進行中ステータス
- ログ一覧: 当日範囲と重なるログ（終了したもの）を表示、編集起点
- 円グラフ（24h）: 当日 0–24h の円形時間分布（進行中は現在時刻まで）
- ドーナツ: 当日寄与時間をカテゴリ別に集計
- 週間スタックバー: 直近7日のカテゴリ別積み上げ

---

## API（簡易仕様）
- `GET /api/logs` … 全件取得（`start` 昇順）
- `POST /api/logs` … 作成 `{ category_id, start: ISO, end: ISO|null, note }`
- `PATCH /api/logs/:id` … 部分更新（上記フィールドの任意）

サーバ側で `day_key`（ローカル日付 `YYYY-MM-DD`）を算出・更新します。

---

## データモデル（Prisma）
- `Log` … 計測ログ
  - `id`, `start`, `end?`, `category_id`(enum), `note`, `day_key`, `created_at`, `updated_at`
  - インデックス: `day_key`, `category_id`, `start`
- `Task` …（将来拡張用。UI 未接続）

---

## タイムゾーンと集計
- 入力: ローカルの `datetime-local` を ISO に変換して保存
- 集計: 表示日の 0–24h にログ区間をクランプして秒数集計
- `day_key`: `start` のローカル日付から生成（`timezoneOffset` を控除して `YYYY-MM-DD`）


---

## 開発メモ
- 開始/停止は `logsStore.start/stop` が API を叩き、進行中の状態は `running` に保持
- 編集モーダルはローカル→ISO 変換を二重補正せず、ズレを防止
- 可視化は `new Date(iso)` をローカルとして扱う前提で統一
