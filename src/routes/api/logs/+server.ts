import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const dayKeyOf = (d: Date) => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0,10);
};

export async function GET({ url }) {
  const dayKey = url.searchParams.get('dayKey');
  const where = dayKey ? { day_key: dayKey } : {};
  const logs = await prisma.log.findMany({
    where,
    orderBy: { start: 'asc' }
  });
  return json(logs);
}

export async function POST({ request }) {
  const data = await request.json();
  // 手動追加: start & end が来る / ランニング開始: end が無い
  if (data.start && data.end) {
    const s = new Date(data.start);
    const e = new Date(data.end);
    const duration = Math.max(0, Math.floor((e.getTime() - s.getTime()) / 1000));
    const created = await prisma.log.create({
      data: {
        category_id: data.category_id,
        start: s,
        end: e,
        note: data.note ?? '',
        task_id: data.task_id ?? null,
        day_key: dayKeyOf(s),
        duration_sec: duration
      }
    });
    return json(created);
  } else {
    const now = new Date();
    const created = await prisma.log.create({
      data: {
        category_id: data.category_id,
        start: now,
        end: null,
        note: data.note ?? '',
        task_id: data.task_id ?? null,
        day_key: dayKeyOf(now),
        duration_sec: null
      }
    });
    return json(created);
  }
}
