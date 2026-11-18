'use client'
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAllTransactions = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/auth/login")

      try {
        // Récupération des 3 piliers : Dépôts, Retraits et Gains de Parrainage (déclenchés par achats)
        const [depRes, withRes, earnRes] = await Promise.all([
          supabase.from("DEPOSITS").select("*").eq("user_phone", phone),
          supabase.from("withdraws").select("*").eq("user_phone", phone),
          supabase.from("referral_earnings").select("*").eq("parrain_phone", phone)
        ])

        // 1. Formatage des Dépôts (Recharge simple)
        const formattedDeps = (depRes.data || []).map(d => ({
          id: d.id,
          date: d.created_at,
          amount: d.amount,
          type: 'DEPOT',
          status: d.status,
          description: `Recharge de compte (${d.method})`
        }))

        // 2. Formatage des Retraits
        const formattedWiths = (withRes.data || []).map(w => ({
          id: w.id,
          date: w.created_at,
          amount: -w.amount,
          type: 'RETRAIT',
          status: w.status,
          description: `Retrait de fonds`
        }))

        // 3. Formatage des Commissions (Déclenchées UNIQUEMENT par l'achat d'un pack)
        const formattedEarns = (earnRes.data || []).map(e => ({
          id: e.id,
          date: e.created_at,
          amount: e.amount_received,
          type: 'ACHAT_FILLEUL',
          status: 'approved',
          description: `Commission achat Niveau ${e.level_of_referral} (ID: ${e.filleul_phone.slice(-4)})`
        }))

        const allTransactions = [...formattedDeps, ...formattedWiths, ...formattedEarns]
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        setTransactions(allTransactions)
      } catch (error) {
        console.error("Erreur flux financier:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTransactions()
  }, [router])

  const getStatusColor = (type, status) => {
    if (type === 'ACHAT_FILLEUL') return '#00c896'
    if (status === 'pending') return '#ff9800'
    if (status === 'approved') return '#00c896'
    if (status === 'rejected') return '#ff4444'
    return '#eee'
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>FLUX FINANCIERS</h2>
        <div style={{ width: '40px', height: '3px', background: '#00c896', marginTop: '8px' }}></div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 50, color: '#00c896', fontSize: '14px' }}>Synchronisation...</div>
      ) : (
        transactions.map((tx) => (
          <div key={`${tx.type}-${tx.id}`} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: tx.type === 'ACHAT_FILLEUL' ? '#00c896' : '#888', marginBottom: '5px' }}>
                  {tx.type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{tx.description}</div>
                <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '5px' }}>
                  {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '100px' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: tx.amount > 0 ? '#00c896' : '#ff4444' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} F
                </div>
                <div style={{ fontSize: '10px', color: getStatusColor(tx.type, tx.status), marginTop: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {tx.type === 'ACHAT_FILLEUL' ? 'Crédité' : tx.status === 'pending' ? 'En cours' : tx.status === 'approved' ? 'Succès' : 'Échec'}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const containerStyle = { background: "#0a0a0a", minHeight: "100vh", color: "white", padding: "25px 20px" }
const headerStyle = { marginBottom: "30px" }
const cardStyle = { 
  background: "#111", 
  padding: "18px", 
  borderRadius: "12px", 
  marginBottom: "12px", 
  border: "1px solid #222",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
}