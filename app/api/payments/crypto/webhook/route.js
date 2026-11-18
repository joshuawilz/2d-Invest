import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request) {
  try {
    // Configuration Supabase (Initialisée à l'exécution)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // TA CLÉ IPN (À récupérer dans ton Dashboard NOWPayments > Settings)
    const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "TON_IPN_SECRET_ICI" 

    const body = await request.json()
    const headers = request.headers
    
    // 1. VÉRIFICATION DE SÉCURITÉ (Signature)
    const sig = headers.get('x-nowpayments-sig')
    const hmac = crypto.createHmac('sha512', IPN_SECRET)
    hmac.update(JSON.stringify(body, Object.keys(body).sort()))
    const signature = hmac.digest('hex')

    // Si la signature ne correspond pas, c'est une tentative de fraude
    if (signature !== sig) {
      console.error("❌ SIGNATURE INVALIDE - Tentative de fraude possible")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`📩 Webhook reçu pour la commande: ${body.order_id} | Statut: ${body.payment_status}`)

    // 2. FILTRAGE : On ne traite que les paiements terminés
    if (body.payment_status === 'finished') {
      const userIdCode = body.order_id 
      const paymentId = body.payment_id.toString()
      
      // RÉCUPÉRATION DU MONTANT INITIAL (Extraction depuis la description)
      // La description est : "Depot 2D INVEST - 5000 FCFA"
      const description = body.order_description || ""
      const amountMatch = description.match(/\d+/)
      const amountInFcfa = amountMatch ? parseInt(amountMatch[0]) : 0

      if (amountInFcfa <= 0) {
        throw new Error("Impossible de déterminer le montant FCFA à créditer")
      }

      // 3. MISE À JOUR DU SOLDE DANS SUPABASE
      // On utilise ton RPC (Cerveau SQL) pour éviter les erreurs de calcul
      const { data, error: rpcError } = await supabase.rpc('process_payment_webhook', {
        p_user_id_code: userIdCode,
        p_amount: amountInFcfa,
        p_reference: paymentId,
        p_provider: 'nowpayments',
        p_description: `Depot Crypto Réussi (${body.pay_currency.toUpperCase()})`
      })

      if (rpcError) {
        console.error("❌ Erreur SQL lors du crédit:", rpcError)
        return NextResponse.json({ error: "Erreur DB" }, { status: 500 })
      }

      console.log(`✅ SUCCÈS : ${amountInFcfa} FCFA crédités au client ${userIdCode}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error("🔥 ERREUR CRITIQUE WEBHOOK:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
