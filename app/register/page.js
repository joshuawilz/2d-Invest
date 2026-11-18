'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { notifyError, notifyAccessCreated, toastHUD } from "../../lib/alerts"

const PAYS_LISTE = [
  { nom: "Togo", code: "+228", drapeau: "🇹🇬", chiffres: 8 },
  { nom: "Bénin", code: "+229", drapeau: "🇧🇯", chiffres: 8 },
  { nom: "Côte d'Ivoire", code: "+225", drapeau: "🇨🇮", chiffres: 10 },
  { nom: "Sénégal", code: "+221", drapeau: "🇸🇳", chiffres: 9 },
  { nom: "Mali", code: "+223", drapeau: "🇲🇱", chiffres: 8 },
  { nom: "Burkina Faso", code: "+226", drapeau: "🇧🇫", chiffres: 8 }
]

export default function RegisterPage() {
  const router = useRouter()
  const inputPassRef = useRef(null)
  
  const [estLogin, setEstLogin] = useState(false) 
  const [pays, setPays] = useState(PAYS_LISTE[0])
  const [telephone, setTelephone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [voirPass, setVoirPass] = useState(false)
  const [voirConfirm, setVoirConfirm] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [modeSombre, setModeSombre] = useState(true)
  const [secousse, setSecousse] = useState(false)

  const [codeParrain, setCodeParrain] = useState("")
  const [aUnLien, setAUnLien] = useState(false)
  const [telParrain, setTelParrain] = useState(null)

  // 1. GESTION DU VIEWPORT ET DU THEME (SANS FLASH)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', modeSombre ? 'dark' : 'light')
    document.body.style.backgroundColor = modeSombre ? '#050505' : '#f8f8f8'
    
    const resoudreViewport = () => {
        window.scrollTo(0, 0);
    }
    window.addEventListener('focusout', resoudreViewport)

    const chargerParrainage = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const ref = urlParams.get('ref') || localStorage.getItem("pending_ref")
      if (ref) {
        const { data } = await supabase.from("users").select("phone, user_id_code").eq("user_id_code", ref.toUpperCase()).single()
        if (data) { 
            setCodeParrain(data.user_id_code)
            setTelParrain(data.phone)
            setAUnLien(true) 
        }
      }
    }
    chargerParrainage()
    return () => window.removeEventListener('focusout', resoudreViewport)
  }, [modeSombre])

  // 2. LOGIQUE DE FORCE DU MOT DE PASSE (OPTIMISÉE)
  const forcePass = useMemo(() => {
    if (!password) return 0
    if (password.length < 6) return 25
    let score = 60
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score = 100
    return score
  }, [password])

  const handleTelChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '') 
    if (val.length <= pays.chiffres) setTelephone(val)
  }

  // 3. PROTOCOLE D'AUTHENTIFICATION ÉLITE
  const executerAuth = async (e) => {
    e.preventDefault()
    if (telephone.length !== pays.chiffres) {
        notifyError("FORMAT", `Entrez ${pays.chiffres} chiffres.`)
        setSecousse(true); return
    }
    const telComplet = pays.code + telephone
    setChargement(true)

    try {
      if (estLogin) {
        const { data, error } = await supabase.from("users").select("*").eq("phone", telComplet).eq("password", password).single()
        if (error || !data) throw new Error("Identifiants invalides.")

        document.cookie = `phone=${data.phone}; path=/; max-age=86400; SameSite=Lax`
        router.push("/dashboard")
      } else {
        if (password !== confirmPassword) throw new Error("Les mots de passe divergent.")
        
        // GÉNÉRATION PRÉ-INSERTION POUR VÉRIFICATION
        const { data: newCode, error: genError } = await supabase.rpc('generate_unique_code')
        const finalCode = genError ? Math.random().toString(36).substring(2, 6).toUpperCase() : newCode

        const { error: rpcError } = await supabase.rpc('create_user_with_referral', {
          p_phone: telComplet, 
          p_password: password, 
          p_new_code: finalCode,
          p_ref_code: aUnLien ? codeParrain : null, 
          p_sponsor_phone: telParrain
        })
        
        if (rpcError) throw new Error(rpcError.message)

        document.cookie = `phone=${telComplet}; path=/; max-age=86400; SameSite=Lax`
        
        if (window.navigator.vibrate) window.navigator.vibrate([100, 30, 100]) // Haptic Feedback
        
        await notifyAccessCreated(finalCode)
        router.push("/dashboard")
      }
    } catch (err) { 
        notifyError("ERREUR SYSTÈME", err.message)
        setSecousse(true)
        if (window.navigator.vibrate) window.navigator.vibrate(200)
        setTimeout(() => setSecousse(false), 500)
    } finally { setChargement(false) }
  }

  return (
    <div style={s.container}>
      <button onClick={() => setModeSombre(!modeSombre)} style={s.boutonTheme}>{modeSombre ? "☀️" : "🌙"}</button>
      
      <div className={secousse ? "shake-anim" : ""} style={{...s.carte, background: modeSombre ? "#0d0d0d" : "#ffffff", borderColor: modeSombre ? "#222" : "#eee"}}>
        <div style={s.interne}>
          
          <div style={s.logoZone}>
             <div style={s.cercleLogo}><span style={s.texteLogo}>2D</span></div>
             <div style={s.nomMarque}>INVEST <span style={s.badgePremium}>PREMIUM</span></div>
          </div>

          <h1 style={{...s.titre, color: modeSombre ? "#fff" : "#000"}}>{estLogin ? "CONNEXION" : "INSCRIPTION"}</h1>
          
          <form onSubmit={executerAuth} style={s.formulaire}>
            <div style={s.champ}>
              <label style={s.label}>TÉLÉPHONE</label>
              <div style={{...s.groupeSaisie, background: modeSombre ? "#000" : "#f5f5f5", borderColor: modeSombre ? "#333" : "#ddd"}}>
                <select style={{...s.selecteur, color: modeSombre ? "#fff" : "#000"}} value={pays.code} onChange={(e) => setPays(PAYS_LISTE.find(p => p.code === e.target.value))}>
                  {PAYS_LISTE.map(p => <option key={p.code} value={p.code}>{p.drapeau} {p.code}</option>)}
                </select>
                <input type="tel" value={telephone} onChange={handleTelChange} style={{...s.inputTel, color: modeSombre ? "#fff" : "#000"}} placeholder="00 00 00 00" required />
              </div>
            </div>

            <div style={s.champ}>
              <label style={s.label}>MOT DE PASSE</label>
              <div style={s.positionRel}>
                <input ref={inputPassRef} type={voirPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={{...s.input, background: modeSombre ? "#000" : "#f5f5f5", color: modeSombre ? "#fff" : "#000", borderColor: modeSombre ? "#333" : "#ddd"}} placeholder="••••••••" required />
                <button type="button" onClick={() => setVoirPass(!voirPass)} style={s.boutonOeil}>{voirPass ? "🙈" : "👁️"}</button>
              </div>
              {!estLogin && <div style={s.jaugeBase}><div style={{...s.jaugeRemplissage, width: `${forcePass}%`, background: forcePass <= 25 ? "#ff3b3b" : forcePass <= 60 ? "#ffcc00" : "#00c896"}}></div></div>}
            </div>

            {!estLogin && (
              <>
                <div style={s.champ}>
                    <label style={s.label}>CONFIRMER LE MOT DE PASSE</label>
                    <div style={s.positionRel}>
                        <input type={voirConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{...s.input, background: modeSombre ? "#000" : "#f5f5f5", color: modeSombre ? "#fff" : "#000", borderColor: modeSombre ? "#333" : "#ddd"}} placeholder="••••••••" required />
                        <button type="button" onClick={() => setVoirConfirm(!voirConfirm)} style={s.boutonOeil}>{voirConfirm ? "🙈" : "👁️"}</button>
                    </div>
                </div>
                {aUnLien && (
                  <div style={s.badgeParrainage}>
                    <div style={s.iconeParrain}>🛡️</div>
                    <div style={s.infoParrain}>
                      <span style={s.labelParrain}>PARRAINAGE ACTIF</span>
                      <span style={s.idParrain}>{codeParrain}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={chargement} style={s.boutonPrincipal}>
              {chargement ? "SYNCHRONISATION..." : estLogin ? "ACCÉDER AU TERMINAL" : "CRÉER MON ACCÈS"}
            </button>
          </form>
          
          <button onClick={() => setEstLogin(!estLogin)} style={s.boutonSwitch}>
            {estLogin ? "PAS DE COMPTE ? S'INSCRIRE" : "DÉJÀ MEMBRE ? SE CONNECTER"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        body { margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; height: 100dvh; width: 100vw; background: #050505; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .shake-anim { animation: shake 0.4s; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

const s = {
  container: { height: "100dvh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", position: "fixed", top: 0, left: 0, padding: "20px" },
  carte: { width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.7)", maxHeight: "92dvh", overflowY: "auto", overflowX: "hidden", position: "relative" },
  interne: { padding: "30px 24px", display: "flex", flexDirection: "column", gap: "20px" },
  logoZone: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  cercleLogo: { width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #00c896 0%, #008f6a 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" },
  texteLogo: { color: "#000", fontWeight: "900", fontSize: "20px" },
  nomMarque: { color: "#00c896", fontSize: "11px", fontWeight: "900", letterSpacing: "4px" },
  badgePremium: { color: "#fff", background: "#222", padding: "2px 6px", borderRadius: "4px", fontSize: "7px" },
  titre: { fontSize: "20px", fontWeight: "900", textAlign: "center", margin: "0", letterSpacing: "1px" },
  formulaire: { display: "flex", flexDirection: "column", gap: "16px" },
  champ: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "10px", color: "#666", fontWeight: "900", marginLeft: "4px", letterSpacing: "0.5px" },
  groupeSaisie: { display: "flex", border: "1px solid", borderRadius: "14px", overflow: "hidden" },
  selecteur: { background: "none", border: "none", padding: "12px", fontWeight: "800", fontSize: "13px" },
  inputTel: { flex: 1, background: "none", border: "none", padding: "12px", fontSize: "16px", fontWeight: "600" },
  input: { width: "100%", padding: "14px", border: "1px solid", borderRadius: "14px", fontSize: "15px", fontWeight: "600" },
  positionRel: { position: "relative" },
  boutonOeil: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: "18px", cursor: "pointer" },
  jaugeBase: { height: "4px", background: "rgba(128,128,128,0.1)", marginTop: "6px", borderRadius: "2px" },
  jaugeRemplissage: { height: "100%", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
  badgeParrainage: { padding: "12px", borderRadius: "14px", background: "rgba(0, 200, 150, 0.03)", border: "1px dashed rgba(0, 200, 150, 0.2)", display: "flex", alignItems: "center", gap: "10px" },
  iconeParrain: { fontSize: "16px" },
  infoParrain: { display: "flex", flexDirection: "column" },
  labelParrain: { fontSize: "8px", fontWeight: "900", color: "#666" },
  idParrain: { fontSize: "13px", fontWeight: "900", color: "#00c896" },
  boutonPrincipal: { background: "#00c896", color: "#000", border: "none", padding: "16px", borderRadius: "14px", fontWeight: "900", fontSize: "14px", marginTop: "10px", cursor: "pointer", transition: "transform 0.2s" },
  boutonSwitch: { background: "none", border: "none", color: "#555", marginTop: "10px", fontSize: "11px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px" },
  boutonTheme: { position: "absolute", top: "20px", right: "20px", background: "rgba(128,128,128,0.1)", border: "none", padding: "10px", borderRadius: "12px", zIndex: 10, cursor: "pointer" }
}