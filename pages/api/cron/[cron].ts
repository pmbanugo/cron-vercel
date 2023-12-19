import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const cron = req.nextUrl.pathname.split('/')[3]
  console.log(cron)
  return new Response('Hello', { status: 200 })
}

async function update(interval: string) {
  const topstories = await fetch(
    'https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty'
  ).then((res) => res.json())

  const response = await kv.set(interval, {
    fetchedAt: Date.now(),
    id: topstories[0],
  })

  return response
}
