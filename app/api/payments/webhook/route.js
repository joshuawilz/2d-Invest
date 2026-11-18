import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request) {
  try {
    // 1. CONFIGURATION DE PUISSANCE (Initialisée à l'exécution)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyrbmtiwvowfksxdnhsl.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. SECRET DE SÉCURITÉ (whsec exclusif pour la signature)
    const WEBHOOK_SECRET = process.env.SENDAVAPAY_WEBHOOK_SECRET || ''

    const bodyText = await request.text()
    const signature = request.headers.get('x-sendavapay-signature')
    const event = request.headers.get('x-sendavapay-event')

    if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 })

    // VÉRIFICATION HMAC (Bouclier anti-triche)
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error("ALERTE : Tentative de fraude détectée (Signature invalide)")
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(bodyText)

    // TRAITEMENT DU PAIEMENT (Supporte multiples formats de payload)
    if (event === 'payment.completed' || payload.status === 'SUCCESS' || payload.event === 'payment.completed') {
      const reference = payload.data?.reference || payload.reference || payload.externalReference
      const amount = payload.data?.amount || payload.amount

      if (!reference || !amount) {
        return NextResponse.json({ error: 'Payload data missing' }, { status: 400 })
      }

      // APPEL RPC ATOMIQUE (Crédit automatique indestructible)
      const { data, error: rpcError } = await supabase.rpc('process_payment_webhook', {
        p_reference: reference,
        p_amount: Number(amount)
      })

      if (rpcError) {
        console.error("ERREUR CRITIQUE RPC:", rpcError)
        return NextResponse.json({ success: false, message: "Database sync failed" }, { status: 500 })
      }

      return NextResponse.json({ 
        success: data?.success || false, 
        message: data?.message || "Processed" 
      }, { status: 200 })
    }

    return NextResponse.json({ success: true, message: "Event ignored" })

  } catch (error) {
    console.error("WEBHOOK CRASH:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
