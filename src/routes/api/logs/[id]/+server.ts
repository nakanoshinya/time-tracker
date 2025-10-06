// @ts-nocheck
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const toLocalDayKey = (iso: string) => {
  const d = new Date(iso);
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

export async function PATCH({ params, request }) {
  const id = params.id;
  const body = await request.json();

  const data: any = {};
  if ('category_id' in body) data.category_id = body.category_id;
  if ('start' in body) data.start = new Date(body.start);
  if ('end' in body) data.end = body.end ? new Date(body.end) : null;
  if ('note' in body) data.note = body.note ?? '';

  // ★ 開始が変わる可能性があるなら day_key を再計算
  if (data.start) {
    data.day_key = toLocalDayKey(data.start.toISOString());
  }

  const updated = await prisma.log.update({
    where: { id },
    data
  });

  return json(updated);
}
