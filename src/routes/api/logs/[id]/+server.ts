import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const dayKeyOf = (d: Date) => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0,10);
};

export async function PATCH({ params, request }) {
  const id = params.id;
  const patch = await request.json();

  // 既存を取得（duration計算のために必要）
  const current = await prisma.log.findUnique({ where: { id } });
  if (!current) throw error(404, 'not found');

  // 変更内容をまとめる
  const data: any = {};
  if (patch.start) {
    data.start = new Date(patch.start);
    data.day_key = dayKeyOf(data.start);
  }
  if ('end' in patch) {
    data.end = patch.end ? new Date(patch.end) : null;
  }
  if (patch.category_id) data.category_id = patch.category_id;
  if ('note' in patch) data.note = patch.note ?? '';
  if ('task_id' in patch) data.task_id = patch.task_id ?? null;

  // duration_sec を一貫して再計算
  const start = (data.start ?? current.start) as Date;
  const end   = ('end' in data ? data.end : current.end) as Date | null;
  data.duration_sec = end ? Math.max(0, Math.floor((end.getTime() - start.getTime())/1000)) : null;
  if (!data.day_key) data.day_key = dayKeyOf(start);

  const updated = await prisma.log.update({ where: { id }, data });
  return json(updated);
}
