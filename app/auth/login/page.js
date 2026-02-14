'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// Liste des 5 codes pays disponibles
const countryCodes = ["+228", "+229", "+226", "+225", "+237", "+241"]

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('+228')  // Valeur par défaut Togo
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    const fullPhone = code + phone

    // Vérifier si l'utilisateur existe
    const { data, error: supabaseError } = await supabase
      .from('USERS')
      .select('*')
      .eq('phone', fullPhone)
      .eq('password', password)
      .single()

    if (supabaseError || !data) {
      setError("Numéro ou mot de passe incorrect")
      // Réinitialiser automatiquement après 2s
      setTimeout(() => router.reload(), 2000)
      return
    }

    // Stocker le numéro pour le Dashboard
    localStorage.setItem('phone', fullPhone)
    router.push('/dashboard')
  }

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Connexion</h1>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Ligne 1 : code pays + numéro */}
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={{ width: 80 }}
          >
            {countryCodes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Numéro"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ flex: 1 }}
          />
        </div>

        {/* Ligne 2 : mot de passe */}
        <div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: 10,
            marginTop: 10,
            backgroundColor: '#1E90FF',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Se connecter
        </button>
      </form>
    </div>
  )
}





