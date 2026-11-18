import { NextResponse } from 'next/server'

const NOWPAYMENTS_API_KEY = "R54GW2F-3A54NT4-QAEVPYH-Q3WGHB1"

export async function POST(request) {
  try {
    const { userIdCode, amount, cryptoAmount } = await request.json()

    // Conversion forcée en nombre pour éviter le "vide"
    const finalAmount = parseFloat(cryptoAmount)

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    }

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: finalAmount,
        price_currency: 'USD', // Passage en MAJUSCULES (important pour leur API)
        order_id: String(userIdCode),
        order_description: `Depot 2D INVEST - ${amount} FCFA`,
        ipn_callback_url: 'https://2d-invest.vercel.app/api/payments/crypto/webhook',
        success_url: 'https://2d-invest.vercel.app/dashboard',
        cancel_url: 'https://2d-invest.vercel.app/deposit'
      }),
    })

    const data = await response.json()

    if (data.invoice_url) {
      return NextResponse.json({ success: true, payment_url: data.invoice_url })
    } else {
      console.error("ERREUR_INTERNE_NOWPAYMENTS:", data)
      return NextResponse.json({ error: "Configuration de compte requise" }, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({ error: "Serveur indisponible" }, { status: 500 })
  }
}