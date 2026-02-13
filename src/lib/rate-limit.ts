import { NextRequest, NextResponse } from 'next/server'

const rateLimit = new Map<string, { count: number; timestamp: number }>()

export function rateLimiter(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000
) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now - record.timestamp > windowMs) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return null
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  record.count++
  return null
}