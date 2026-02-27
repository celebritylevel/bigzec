import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API is working',
    hasApifyKey: !!process.env.APIFY_API_KEY,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    env: process.env.NODE_ENV
  })
}
