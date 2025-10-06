// @ts-nocheck
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const toLocalDayKey = (iso: string) => {
  const d = new Date(iso);
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10); // YYYY-MM-DD
};

export async function GET() {
  const list = await prisma.log.findMany({
    orderBy: { start: 'asc' }
  });
  return json(list);
}

export async function POST({ request }) {
  const body = await request.json();

  const data: any = {
    category_id: body.category_id,
    start: new Date(body.start),
    end: body.end ? new Date(body.end) : null,
    note: body.note ?? ''
  };

  const day_key = toLocalDayKey(data.start.toISOString());

  const created = await prisma.log.create({
    data: { ...data, day_key }
  });

  return json(created, { status: 201 });
}
