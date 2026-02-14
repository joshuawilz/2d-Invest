'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function WalletSettings() {
  const router = useRouter()
  const [network, setNetwork] = useState("")
  const [number, setNumber] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [myWallets, setMyWallets] = useState([])

  // Liste complète des réseaux par pays
  const allNetworks = [
    { label: "TOGO 🇹🇬", options: ["T-Money", "Moov (Flooz)"] },
    { label: "BÉNIN 🇧🇯", options: ["MTN Bénin", "Moov Bénin", "Celtiis"] },
    { label: "CÔTE D'IVOIRE 🇨🇮", options: ["Orange CI", "MTN CI", "Moov CI", "Wave CI"] },
    { label: "SÉNÉGAL 🇸🇳", options: ["Orange Sénégal", "Free", "Wave Sénégal"] },
    { label: "BURKINA FASO 🇧🇫", options: ["Orange BF", "Moov Africa BF"] },
    { label: "MALI 🇲🇱", options: ["Orange Mali", "Malitel"] }
  ]

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    const phone = localStorage.getItem("phone")
    const { data } = await supabase.from("wallets").select("*").eq("user_phone", phone)
    if (data) setMyWallets(data)
  }

  const handleAddWallet = async (e) => {
    e.preventDefault()
    if (!network || !number || !ownerName) return alert("Veuillez remplir tous les champs")
    
    setLoading(true)
    const phone = localStorage.getItem("phone")

    const { error } = await supabase.from("wallets").insert([{
      user_phone: phone,
      network: network,
      number: number,
      owner_name: ownerName
    }])

    if (!error) {
      alert("Portefeuille ajouté !")
      setNumber("")
      setOwnerName("")
      fetchWallets()
    } else {
      alert("Erreur lors de l'ajout")
    }
    setLoading(false)
  }

  const deleteWallet = async (id) => {
    if(confirm("Supprimer ce compte ?")) {
        await supabase.from("wallets").delete().eq("id", id)
        fetchWallets()
    }
  }

  return (
    <div style={container}>
      <div style={header}>
        <button onClick={() => router.back()} style={backBtn}>←</button>
        <h2 style={{margin:0}}>Mon Portefeuille</h2>
      </div>

      {/* FORMULAIRE D'AJOUT */}
      <div style={card}>
        <h4 style={{marginTop:0, color:'#00c896'}}>Ajouter un nouveau compte</h4>
        <form onSubmit={handleAddWallet}>
          <p style={label}>Réseau Mobile</p>
          <select 
            style={select} 
            value={network} 
            onChange={(e) => setNetwork(e.target.value)}
          >
            <option value="">Sélectionnez un réseau...</option>
            {allNetworks.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <p style={label}>Numéro de téléphone</p>
          <input 
            style={input} 
            placeholder="Ex: 90000000" 
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />

          <p style={label}>Nom complet sur le compte</p>
          <input 
            style={input} 
            placeholder="Nom affiché lors du transfert" 
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />

          <button type="submit" disabled={loading} style={addBtn}>
            {loading ? "Enregistrement..." : "ENREGISTRER LE COMPTE"}
          </button>
        </form>
      </div>

      {/* LISTE DES COMPTES ENREGISTRÉS */}
      <h4 style={{margin:'30px 0 15px 0', opacity:0.7}}>Mes comptes enregistrés</h4>
      {myWallets.length === 0 ? (
          <p style={{fontSize:'13px', opacity:0.5}}>Aucun compte pour le moment.</p>
      ) : (
          myWallets.map((w) => (
              <div key={w.id} style={walletItem}>
                  <div>
                      <div style={{fontWeight:'bold'}}>{w.network}</div>
                      <div style={{fontSize:'14px', opacity:0.7}}>{w.number}</div>
                      <div style={{fontSize:'12px', color:'#00c896'}}>{w.owner_name}</div>
                  </div>
                  <button onClick={() => deleteWallet(w.id)} style={delBtn}>🗑️</button>
              </div>
          ))
      )}
    </div>
  )
}

/* --- STYLES --- */
const container = { minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '20px', fontFamily: 'sans-serif' }
const header = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }
const backBtn = { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor:'pointer' }
const card = { background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222' }
const label = { fontSize: '11px', opacity: 0.5, marginBottom: '8px', marginTop: '15px', fontWeight:'bold' }
const input = { width: '100%', background: '#000', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }
const select = { width: '100%', background: '#000', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }
const addBtn = { width: '100%', background: '#00c896', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px', cursor:'pointer' }
const walletItem = { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#111', padding:'15px', borderRadius:'15px', border:'1px solid #222', marginBottom:'10px' }
const delBtn = { background:'none', border:'none', cursor:'pointer', fontSize:'18px' }