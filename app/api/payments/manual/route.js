import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    // 1. RÉCEPTION & SÉCURITÉ JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, message: "Données corrompues." }, { status: 400 })
    }

    const { userId, amount, senderNumber, smsReference, country } = body

    // 2. VÉRIFICATION DES CHAMPS
    if (!userId || !amount || !senderNumber || !smsReference) {
      return NextResponse.json({ success: false, message: "Informations incomplètes." }, { status: 400 })
    }

    // 3. NETTOYAGE RADICAL (Le "@" et les symboles sautent ici)
    const cleanSenderPhone = String(senderNumber).replace(/[^\d+]/g, '')
    const cleanReference = String(smsReference).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const validAmount = Math.abs(parseFloat(amount))

    if (validAmount <= 0) {
      return NextResponse.json({ success: false, message: "Montant invalide." }, { status: 400 })
    }

    // 4. VÉRIFICATION ANTI-DOUBLON (Sécurité Maximale)
    const { data: existingRef } = await supabase
      .from('deposits')
      .select('transaction_id')
      .eq('transaction_id', cleanReference)
      .maybeSingle()

    if (existingRef) {
      return NextResponse.json({ 
        success: false, 
        message: "Cette référence de transaction a déjà été enregistrée." 
      }, { status: 200 }) // Status 200 pour que le front puisse lire le message proprement
    }

    // 5. RÉCUPÉRATION DU TÉLÉPHONE UTILISATEUR (Liaison table users)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('phone')
      .eq('user_id_code', userId) 
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable." }, { status: 400 })
    }

    // 6. INSERTION DANS LA TABLE DEPOSITS (Expérience Premium)
    const { error: insertError } = await supabase
      .from('deposits')
      .insert([{
        user_id_code: userId,
        user_phone: userData.phone,
        amount: validAmount,
        status: 'pending', 
        transaction_id: cleanReference, 
        sender_phone: cleanSenderPhone, 
        method: 'manual', 
        screenshot_url: `Gateway: ${country} | Date: ${new Date().toLocaleString('fr-FR')}` 
      }])

    if (insertError) {
      console.error("Erreur Insertion:", insertError)
      return NextResponse.json({ success: false, message: "Erreur base de données." }, { status: 200 })
    }

    // SUCCÈS TOTAL
    return NextResponse.json({ 
      success: true, 
      message: "Votre demande de dépôt est en cours de vérification." 
    }, { status: 200 })

  } catch (error) {
    console.error("Crash API Manuel:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Une erreur technique est survenue sur le serveur." 
    }, { status: 500 })
  }
}