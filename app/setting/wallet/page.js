'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase"

export default function WalletSettings() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [walletType, setWalletType] = useState("TMoney")
  const [walletNumber, setWalletNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const phone = localStorage.getItem("phone")
      if (!phone) return router.push("/auth/login")
      
      const { data } = await supabase.from("users").select("*").eq("phone", phone).single()
      if (data) {
        setUser(data)
        setWalletType(data.wallet_type || "TMoney")
        setWalletNumber(data.wallet_number || "")
        setFullName(data.full_name || "")
      }
    }
    fetchUser()
  }, [router])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from("users")
      .update({
        wallet_type: walletType,
        wallet_number: walletNumber,
        full_name: fullName
      })
      .eq("phone", user.phone)

    if (!error) {
      alert("✅ Portefeuille mis à jour avec succès !")
      router.push("/dashboard")
    } else {
      alert("Erreur lors de la sauvegarde.")
    }
    setLoading(false)
  }

  if (!user) return <div style={{ background: "#0a0a0a", height: "100vh" }}></div>

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button onClick={() => router.back()} style={backBtn}>❮</button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Mon Portefeuille</h2>
      </div>

      <div style={infoBox}>
        <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
          Configurez vos informations de retrait. Assurez-vous que le numéro est correct car c'est là que vos gains seront envoyés.
        </p>
      </div>

      <form onSubmit={handleSave} style={formStyle}>
        {/* CHOIX DU RÉSEAU */}
        <label style={labelStyle}>Réseau de retrait</label>
        <div style={selectorGrid}>
          <div 
            onClick={() => setWalletType("TMoney")} 
            style={walletType === "TMoney" ? activeOption : optionStyle}
          >
            TMoney
          </div>
          <div 
            onClick={() => setWalletType("Moov")} 
            style={walletType === "Moov" ? activeOption : optionStyle}
          >
            Moov Money
          </div>
        </div>

        {/* NOM COMPLET */}
        <div style={inputGroup}>
          <label style={labelStyle}>Nom complet du bénéficiaire</label>
          <input 
            type="text" 
            placeholder="Ex: Jean Dupont" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        {/* NUMÉRO DE TÉLÉPHONE */}
        <div style={inputGroup}>
          <label style={labelStyle}>Numéro de téléphone de retrait</label>
          <input 
            type="tel" 
            placeholder="Ex: 90000000" 
            value={walletNumber}
            onChange={(e) => setWalletNumber(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <button type="submit" disabled={loading} style={saveBtn}>
          {loading ? "Sauvegarde..." : "ENREGISTRER LE PORTEFEUILLE"}
        </button>
      </form>
    </div>
  )
}

/* --- STYLES --- */
const containerStyle = { background: "#0a0a0a", minHeight: "100vh", color: "white", padding: 20, fontFamily: "sans-serif" }
const headerStyle = { display: "flex", alignItems: "center", gap: 15, marginBottom: 25, padding: "10px 0" }
const backBtn = { background: "#111", border: "1px solid #222", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }
const infoBox = { background: "rgba(0, 200, 150, 0.05)", border: "1px solid #00c89633", padding: 15, borderRadius: 15, marginBottom: 25 }
const formStyle = { display: "flex", flexDirection: "column", gap: 20 }
const labelStyle = { fontSize: 11, opacity: 0.5, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, display: "block" }
const inputGroup = { display: "flex", flexDirection: "column" }
const inputStyle = { background: "#111", border: "1px solid #222", padding: 15, borderRadius: 12, color: "white", outline: "none", fontSize: 15 }
const selectorGrid = { display: "flex", gap: 10, marginBottom: 10 }
const optionStyle = { flex: 1, padding: 12, textAlign: "center", background: "#111", border: "1px solid #222", borderRadius: 10, cursor: "pointer", fontSize: 14 }
const activeOption = { ...optionStyle, background: "#00c896", borderColor: "#00c896", fontWeight: "bold" }
const saveBtn = { background: "#00c896", color: "white", border: "none", padding: 18, borderRadius: 15, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginTop: 10 }