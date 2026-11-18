import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY 
const supabase = createClient(supabaseUrl, supabaseServiceRole)

export async function POST(request) {
  try {
    const body = await request.json()
    
    // 1. DÉTECTION DU PROVIDER (Préparation NOWPayments / SendavaPay)
    // On identifie d'où vient la notification pour adapter la logique
    const provider = body.payment_id ? 'nowpayments' : 'sendavapay'
    
    console.log(`=== NOTIFICATION ${provider.toUpperCase()} REÇUE ===`)

    // 2. VALIDATION DU STATUT SELON LE PROVIDER
    let isSuccess = false
    let transactionId = ""
    let amountPaid = 0
    let userPhone = ""

    if (provider === 'sendavapay') {
      isSuccess = body.status === 'SUCCESS' || body.status === 'APPROVED' || body.status === 'completed'
      transactionId = body.reference || body.transaction_id
      amountPaid = Math.round(Number(body.amount))
      userPhone = body.metadata?.phone
    } else {
      // Logique NOWPayments (Crypto)
      isSuccess = body.payment_status === 'finished'
      transactionId = body.payment_id
      amountPaid = Math.round(Number(body.pay_amount)) // À adapter selon ta devise de base
      userPhone = body.order_description // Souvent utilisé pour passer le phone en crypto
    }

    // Si le paiement est en attente (surtout pour la Crypto)
    const isPending = body.status === 'PENDING' || body.payment_status === 'waiting'

    if (isPending) {
       // On peut enregistrer la transaction en 'pending' pour l'affichage Dashboard
       await supabase.from('transactions').upsert({
         phone: userPhone,
         amount: amountPaid,
         type: 'deposit',
         status: 'pending',
         reference: transactionId,
         provider: provider,
         description: `Recharge ${provider} en cours...`
       }, { onConflict: 'reference' })
       
       return NextResponse.json({ received: true, message: "En attente de confirmation" })
    }

    if (!isSuccess) {
      return NextResponse.json({ received: true, message: "Paiement non validé" })
    }

    if (!userPhone || !transactionId) {
      return NextResponse.json({ success: false, message: "Métadonnées manquantes" }, { status: 400 })
    }

    // 3. VÉRIFICATION ANTI-DOUBLON (Précision 1000%)
    const { data: alreadyProcessed } = await supabase
      .from('transactions')
      .select('status')
      .eq('reference', transactionId)
      .eq('status', 'success')
      .single()

    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: "Déjà crédité" }, { status: 200 })
    }

    // 4. RÉCUPÉRATION DE L'UTILISATEUR
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('recharge_balance, phone')
      .eq('phone', userPhone)
      .single()

    if (fetchError || !userData) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 })
    }

    const newBalance = (Number(userData.recharge_balance) || 0) + amountPaid

    // 5. MISE À JOUR ATOMIQUE (Solde + Historique)
    // On met à jour l'utilisateur
    const { error: updateError } = await supabase
      .from('users')
      .update({ recharge_balance: newBalance })
      .eq('phone', userData.phone)

    if (updateError) throw updateError

    // On valide la transaction dans l'historique
    await supabase.from('transactions').upsert({
      phone: userData.phone,
      amount: amountPaid,
      type: 'deposit',
      status: 'success',
      reference: transactionId,
      provider: provider,
      description: `Recharge via ${provider}`
    }, { onConflict: 'reference' })

    return NextResponse.json({ success: true, message: "Compte crédité avec succès" }, { status: 200 })

  } catch (error) {
    console.error("ERREUR CRITIQUE API:", error)
    return NextResponse.json({ success: false, message: "Erreur interne" }, { status: 500 })
  }
}