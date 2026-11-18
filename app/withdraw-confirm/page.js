'use client'

import { useRouter } from "next/navigation"

export default function WithdrawConfirm() {
    const router = useRouter()

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.iconCircle}>
                    <span style={styles.checkIcon}>✓</span>
                </div>
                
                <h1 style={styles.title}>Demande envoyée !</h1>
                
                <p style={styles.message}>
                    Votre demande de retrait a été enregistrée. 
                    Le traitement est généralement effectué sous 24h.
                </p>

                <div style={styles.infoBox}>
                    <p style={styles.infoText}>
                        Vous pouvez suivre le statut de votre retrait ou l'annuler dans votre historique.
                    </p>
                </div>

                <button 
                    onClick={() => router.push("/history")} 
                    style={styles.mainBtn}
                >
                    VOIR L'HISTORIQUE
                </button>
            </div>
        </div>
    )
}

const styles = {
    container: { 
        background: '#050505', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px',
        fontFamily: 'sans-serif' 
    },
    card: { 
        background: '#111', 
        padding: '30px 20px', 
        borderRadius: '20px', 
        textAlign: 'center', 
        border: '1px solid #222', 
        width: '100%',
        maxWidth: '350px'
    },
    iconCircle: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#00c89615',
        border: '2px solid #00c896',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto'
    },
    checkIcon: {
        color: '#00c896',
        fontSize: '30px',
        fontWeight: 'bold'
    },
    title: { 
        fontSize: '18px', 
        color: '#fff', 
        marginBottom: '12px',
        fontWeight: 'bold'
    },
    message: { 
        fontSize: '13px', 
        color: '#aaa', 
        lineHeight: '1.6',
        marginBottom: '20px' 
    },
    infoBox: {
        background: '#000',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '25px',
        border: '1px solid #1a1a1a'
    },
    infoText: {
        fontSize: '10px',
        color: '#666',
        margin: 0,
        lineHeight: '1.4'
    },
    mainBtn: { 
        width: '100%', 
        padding: '14px', 
        borderRadius: '12px', 
        border: 'none', 
        fontWeight: 'bold', 
        color: '#000', 
        background: '#00c896',
        cursor: 'pointer',
        fontSize: '13px',
        letterSpacing: '0.5px'
    }
}