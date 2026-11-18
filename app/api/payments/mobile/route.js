import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 1. FONDATION SUPABASE (Service Role pour une fluidité totale sans blocage RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 2. CLE SECRETE SENDAVAPAY (Mode Live pour la rapidité des transactions)
const SENDAVAPAY_SECRET_KEY = process.env.SENDAVAPAY_SECRET_KEY

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, phone, amount, country } = body;

    // 3. VALIDATION DE RIGUEUR (Sécurité des données entrantes)
    if (!userId || !phone || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants ou invalides." }, 
        { status: 400 }
      )
    }

    // 4. RÉFÉRENCE UNIQUE (Traçabilité indestructible)
    const externalRef = `DEP-${phone}-${Date.now()}`;

    const paymentData = {
      amount: Math.round(Number(amount)),
      currency: "XOF",
      description: `Dépôt 2D INVEST - Code: ${userId}`,
      externalReference: externalRef,
      customerPhone: phone,
      redirectUrl: `https://vercel.app`
    }

    // 5. APPEL API (Secret Key pour authentification forte)
    const response = await fetch('https://sendavapay.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDAVAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const result = await response.json()

    // 6. INSERTION SQL (Alignée précisément sur tes colonnes : user_id_code, user_phone)
    if (result.success && result.data && result.data.paymentUrl) {
      
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{
          user_id_code: userId,
          user_phone: phone,
          type: 'deposit_auto',
          amount: Math.round(Number(amount)),
          status: 'pending',
          reference: result.data.reference || externalRef, 
          description: `Initiation dépôt via SendavaPay`,
          metadata: {
            gateway: 'sendavapay',
            country: country || 'Togo',
            initiation_time: new Date().toISOString()
          }
        }])

      if (insertError) {
          // Log critique mais on laisse passer l'utilisateur vers le paiement
          console.error("ERREUR CRITIQUE INSERTION TRANSACTION:", insertError);
      }

      return NextResponse.json({ 
        success: true, 
        payment_url: result.data.paymentUrl,
        reference: externalRef 
      })

    } else {
      console.error("ÉCHEC PRESTATAIRE:", result);
      return NextResponse.json({ 
        success: false, 
        message: result.message || "Impossible de générer le lien de paiement." 
      }, { status: 400 })
    }

  } catch (error) {
    console.error("CRASH SERVEUR API:", error)
    return NextResponse.json(
      { success: false, message: "Connexion interrompue. Veuillez réessayer." }, 
      { status: 500 }
    )
  }
}
