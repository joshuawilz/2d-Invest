'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

const COUNTRIES = [
  { name: "Togo", code: "+228", flag: "🇹🇬" },
  { name: "Bénin", code: "+229", flag: "🇧🇯" },
  { name: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { name: "Sénégal", code: "+221", flag: "🇸🇳" },
  { name: "Niger", code: "+227", flag: "🇳🇪" },
]

export default function AuthPage() {
  const router = useRouter()
  // Inscription affichée par défaut
  const [isLogin, setIsLogin] = useState(false) 
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    const fullPhone = selectedCountry.code + phone

    if (isLogin) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", fullPhone)
        .eq("password", password)
        .single()

      if (error || !data) {
        alert("Identifiants incorrects.")
      } else {
        localStorage.setItem("phone", data.phone)
        router.push("/dashboard")
      }
    } else {
      if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas !")
        setLoading(false)
        return
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("phone")
        .eq("phone", fullPhone)
        .single()

      if (existingUser) {
        alert("Ce numéro est déjà utilisé.")
        setIsLogin(true)
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from("users")
        .insert([{ phone: fullPhone, password, recharge_balance: 0, withdraw_balance: 0 }])

      if (insertError) {
        alert("Erreur : " + insertError.message)
      } else {
        localStorage.setItem("phone", fullPhone)
        router.push("/dashboard")
      }
    }
    setLoading(false)
  }

  return (
    <div style={containerStyle}>
      <div style={authCard}>
        
        {/* REMPLACEMENT DU LOGO TEXTE PAR TON IMAGE */}
        <div style={logoWrapper}>
          <img 
            src="/logo-2d.png" // Assure-toi de mettre l'image dans le dossier /public
            alt="2D Invest Logo" 
            style={imageStyle}
          />
        </div>

        <div style={{ padding: '20px 30px 40px' }}>
          <h2 style={titleStyle}>{isLogin ? "Heureux de vous revoir !" : "Commencez à investir"}</h2>
          <p style={subtitleStyle}>
            {isLogin ? "Connectez-vous pour suivre vos profits." : "Créez votre compte en quelques secondes."}
          </p>

          <form onSubmit={handleAuth}>
            
            {/* SÉLECTEUR DE PAYS DÉROULANT */}
            <label style={labelStyle}>Pays</label>
            <div style={selectContainer}>
              <select 
                style={selectInput}
                value={selectedCountry.code}
                onChange={(e) => setSelectedCountry(COUNTRIES.find(c => c.code === e.target.value))}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} style={{ background: "#111", color: "white" }}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <span style={selectArrowIcon}>▼</span>
            </div>

            {/* NUMÉRO DE TÉLÉPHONE */}
            <label style={labelStyle}>Numéro de téléphone</label>
            <div style={phoneInputWrapper}>
              <div style={codeBox}>{selectedCountry.code}</div>
              <input 
                type="tel" 
                placeholder="Ex: 92360282" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputPhone}
                required
              />
            </div>

            {/* MOT DE PASSE */}
            <label style={labelStyle}>Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputFull}
              required
            />

            {!isLogin && (
              <>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputFull}
                  required
                />
              </>
            )}

            <button type="submit" disabled={loading} style={mainBtn}>
              {loading ? "Vérification..." : isLogin ? "SE CONNECTER" : "CRÉER MON COMPTE"}
            </button>
          </form>

          <div style={switchContainer}>
            <span style={{ opacity: 0.5 }}>{isLogin ? "Nouveau membre ?" : "Déjà un compte ?"}</span>
            <button onClick={() => setIsLogin(!isLogin)} style={switchBtn}>
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- STYLES --- */
const containerStyle = { background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }
const authCard = { background: "#111", width: "100%", maxWidth: 420, borderRadius: 35, overflow: "hidden", border: "1px solid #222", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }

const logoWrapper = { width: "100%", height: 220, overflow: "hidden", background: "#000" }
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" }

const titleStyle = { margin: 0, fontSize: 20, fontWeight: "bold", color: "white" }
const subtitleStyle = { fontSize: 13, color: "#666", marginTop: 5, marginBottom: 25 }
const labelStyle = { display: "block", fontSize: 11, color: "#888", marginBottom: 8, textTransform: "uppercase", fontWeight: "bold" }

const selectContainer = { position: "relative", marginBottom: 18 }
const selectInput = { width: "100%", padding: "16px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 15, color: "white", fontSize: 15, appearance: "none", outline: "none", cursor: "pointer" }
const selectArrowIcon = { position: "absolute", right: 15, top: 18, fontSize: 10, color: "#00c896", pointerEvents: "none" }

const phoneInputWrapper = { display: "flex", background: "#1a1a1a", borderRadius: 15, border: "1px solid #333", overflow: "hidden", marginBottom: 18 }
const codeBox = { padding: "0 15px", background: "#222", color: "#00c896", fontWeight: "bold", display: "flex", alignItems: "center", fontSize: 14 }
const inputPhone = { flex: 1, padding: 16, background: "none", border: "none", color: "white", outline: "none", fontSize: 16 }

const inputFull = { width: "100%", padding: 16, background: "#1a1a1a", border: "1px solid #333", borderRadius: 15, color: "white", outline: "none", boxSizing: "border-box", marginBottom: 18, fontSize: 16 }

const mainBtn = { width: "100%", padding: 18, background: "#00c896", color: "white", border: "none", borderRadius: 15, fontWeight: "bold", fontSize: 16, cursor: "pointer", transition: "0.3s" }
const switchContainer = { marginTop: 25, textAlign: "center", fontSize: 14 }
const switchBtn = { background: "none", border: "none", color: "#00c896", fontWeight: "bold", marginLeft: 8, cursor: "pointer" }