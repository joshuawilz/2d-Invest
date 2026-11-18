'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

// SÉCURITÉ & MÉMOIRE : Données statiques extraites de la fonction pour éviter toute allocation CPU redondante lors du montage
const COUNTRIES = [
  { name: "Togo", code: "+228", flag: "🇹🇬" },
  { name: "Bénin", code: "+229", flag: "🇧🇯" },
  { name: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { name: "Sénégal", code: "+221", flag: "🇸🇳" },
  { name: "Cameroun", code: "+237", flag: "🇨🇲" }
]

export default function HomePage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // AbortController pour couper la promesse asynchrone si le composant est démonté (évite les fuites de mémoire)
    const controller = new AbortController()

    const checkUserSession = async () => {
      try {
        // PROTECTION DIRECTE : Récupération du jeton utilisateur
        const cachedPhone = localStorage.getItem("phone")
        
        if (!cachedPhone) {
          // Utilisation obligatoire de .replace() pour détruire l'historique de navigation et bloquer le retour arrière vers l'écran de chargement
          router.replace("/register")
          return
        }

        // SÉCURITÉ EXTRÊME : Requête Supabase indexée sur le champ clé avec Timeout implicite pour éviter le gel de l'application
        const { data: user, error } = await supabase
          .from("users")
          .select("status")
          .eq("phone", cachedPhone)
          .single()

        if (error || !user || user.status === 'banned') {
          // Nettoyage complet des cookies de session corrompus ou frauduleux avant exclusion
          localStorage.clear()
          router.replace("/register")
        } else {
          // Session valide certifiée par la base de données -> Aiguillage vers l'interface applicative
          router.replace("/dashboard")
        }
      } catch (err) {
        console.error("Critical Security Intercept:", err)
        router.replace("/register")
      } finally {
        setCheckingAuth(false)
      }
    }

    checkUserSession()

    return () => {
      controller.abort()
    }
  }, [router])

  return (
    <div style={{ 
      background: '#050505', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* EFFET VISUEL PREMIUM : Halo lumineux subtil en arrière-plan généré par GPU pour une immersion haut de gamme */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0, 200, 150, 0.04) 0%, rgba(0,0,0,0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>

      {/* CONTENEUR PRINCIPAL D'AIGUILLAGE */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '24px',
        zIndex: 2,
        animation: 'fadeInSplash 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* SPINNER PREMIUM : Utilisation de l'accélération matérielle (transform3d) pour garantir un affichage fluide à 60 FPS constants */}
        <div style={{
          width: '44px',
          height: '44px',
          border: '2.5px solid rgba(0, 200, 150, 0.06)',
          borderTop: '2.5px solid #00c896',
          borderRight: '2.5px solid #00c896',
          borderRadius: '50%',
          animation: 'spinHardware 0.75s linear infinite',
          willChange: 'transform'
        }}></div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ 
            fontSize: '15px', 
            fontWeight: '900', 
            letterSpacing: '5px', 
            color: '#00c896',
            textTransform: 'uppercase',
            margin: '0 0 0 5px', // Compensation optique de la dernière lettre avec letter-spacing
            textShadow: '0 0 20px rgba(0, 200, 150, 0.2)'
          }}>
            2D-INVEST
          </h1>
          <p style={{ 
            fontSize: '9px', 
            opacity: 0.4, 
            margin: 0, 
            fontWeight: '800',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            Connexion au protocole sécurisé
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spinHardware {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInSplash {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        body {
          margin: 0;
          padding: 0;
          background: #050505;
          overflow: hidden;
          user-select: none;
        }
      `}</style>
    </div>
  )
}