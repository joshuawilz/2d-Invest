'use client'

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DepositConfirm() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [transId, setTransId] = useState("")

  useEffect(() => {
    const savedPhone = localStorage.getItem("phone")
    setPhone(savedPhone || "Client")
    setTransId(Math.random().toString(36).toUpperCase().substring(2, 10))
  }, [])

  return (
    <div style={s.container}>
      {/* Background Decor */}
      <div style={s.glow}></div>

      <div style={s.card}>
        {/* Animation Circle */}
        <div style={s.iconWrapper}>
          <div style={s.iconPulse}></div>
          <div style={s.iconInner}>✔️</div>
        </div>
        
        <h1 style={s.title}>Demande Confirmée</h1>
        
        <p style={s.subtitle}>
          Ravi de vous revoir, <span style={s.highlight}>{phone}</span>. 
          Votre intention de dépôt est enregistrée.
        </p>

        <div style={s.statusBox}>
          <div style={s.statusLine}>
            <span style={s.statusDot}></span>
            <span style={s.statusText}>TRAITEMENT PRIORITAIRE</span>
          </div>
          <p style={s.infoText}>
            Nos systèmes valident votre transfert. Crédit effectif sous <b>120 secondes</b>.
          </p>
        </div>

        <div style={s.detailTable}>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>ID TRANSACTION</span>
            <span style={s.detailValue}>#{transId}</span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>FRAIS DE SERVICE</span>
            <span style={s.detailValue}>INCLUS</span>
          </div>
        </div>

        <button 
          onClick={() => router.push("/history")} 
          style={s.mainBtn}
        >
          SUIVRE DANS L'HISTORIQUE
        </button>

        <button 
          onClick={() => router.push("/dashboard")} 
          style={s.secBtn}
        >
          RETOUR AU TABLEAU DE BORD
        </button>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const s = {
  container: {
    background: "#050505",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box"
  },
  glow: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(0,200,150,0.15) 0%, rgba(0,0,0,0) 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 0
  },
  card: {
    background: "rgba(15, 15, 15, 0.8)",
    backdropFilter: "blur(10px)",
    padding: "40px 20px",
    borderRadius: "32px",
    border: "1px solid rgba(255,255,255,0.05)",
    textAlign: "center",
    width: "100%",
    maxWidth: "380px",
    zIndex: 1,
    animation: "slideUp 0.6s ease-out",
    boxSizing: "border-box"
  },
  iconWrapper: {
    position: "relative",
    width: "80px",
    height: "80px",
    margin: "0 auto 30px auto"
  },
  iconInner: {
    position: "relative",
    width: "80px",
    height: "80px",
    background: "#00c896",
    color: "#000",
    fontSize: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    zIndex: 2,
    boxShadow: "0 0 20px rgba(0,200,150,0.4)"
  },
  iconPulse: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: "50%",
    border: "2px solid #00c896",
    animation: "pulse 2s infinite"
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    marginBottom: "10px",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    lineHeight: "1.5",
    marginBottom: "30px"
  },
  highlight: {
    color: "#00c896",
    fontWeight: "bold"
  },
  statusBox: {
    background: "rgba(255,215,0,0.05)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255,215,0,0.1)",
    marginBottom: "25px"
  },
  statusLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "8px"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    background: "#ffd700",
    borderRadius: "50%",
    boxShadow: "0 0 10px #ffd700"
  },
  statusText: {
    fontSize: "11px",
    fontWeight: "900",
    color: "#ffd700",
    letterSpacing: "1px"
  },
  infoText: {
    fontSize: "12px",
    color: "#ccc",
    margin: 0,
    lineHeight: "1.4"
  },
  detailTable: {
    marginBottom: "30px",
    borderTop: "1px solid #222",
    paddingTop: "15px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0"
  },
  detailLabel: {
    fontSize: "10px",
    color: "#555",
    fontWeight: "bold"
  },
  detailValue: {
    fontSize: "10px",
    color: "#eee",
    fontWeight: "bold",
    fontFamily: "monospace"
  },
  mainBtn: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #00c896 0%, #00a57d 100%)",
    color: "#000",
    border: "none",
    borderRadius: "16px",
    fontWeight: "900",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "12px",
    transition: "transform 0.2s",
    boxShadow: "0 10px 20px rgba(0, 200, 150, 0.2)"
  },
  secBtn: {
    width: "100%",
    padding: "15px",
    background: "transparent",
    color: "#666",
    border: "none",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  }
}