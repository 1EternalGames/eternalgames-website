// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

type WebhookPayload = {
  _type: string
  slug?: {
    current: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<WebhookPayload>(
      req,
      process.env.REVALIDATION_SECRET_TOKEN,
    )
    if (!isValidSignature) {
      const message = 'Invalid signature'
      console.warn(`[REVALIDATE] ${message}`)
      return new Response(JSON.stringify({ message, body }), { status: 401 })
    }

    if (!body?._type) {
      const message = 'Bad Request: Missing _type in body'
      console.warn(`[REVALIDATE] ${message}`)
      return new Response(JSON.stringify({ message, body }), { status: 400 })
    }
    
    // THE FIX: Changed 'layout' to 'max' to satisfy CacheLife profile
    console.log(`[REVALIDATE] Received webhook for type: ${body._type}. Revalidating tag...`)
    revalidateTag(body._type, 'max')

    const message = `Successfully revalidated tag: ${body._type}`
    console.log(`[REVALIDATE] ${message}`)
    return NextResponse.json({ body, message, revalidated: true, date: new Date().toISOString() })
  } catch (err: any) {
    console.error('[REVALIDATE] Error:', err)
    return new Response(err.message, { status: 500 })
  }
}