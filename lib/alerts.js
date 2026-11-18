import Swal from 'sweetalert2';

// CONFIGURATION SYSTÈME ALPHA (DESIGN NOIR PROFOND)
const SYSTEM_THEME = {
  background: '#050505',
  color: '#ffffff',
  confirmButtonColor: '#00c896',
  cancelButtonColor: '#111111',
  padding: '2.5rem',
  buttonsStyling: true,
  backdrop: `rgba(0,0,0,0.9)`,
  customClass: {
    popup: 'premium-border-glow',
    confirmButton: 'premium-btn-main',
    cancelButton: 'premium-btn-alt'
  }
};

// 1. NOTIFICATION DE RÉUSSITE (INVESTISSEMENT / DÉPÔT)
export const notifySuccess = (title, text) => {
  return Swal.fire({
    ...SYSTEM_THEME,
    icon: 'success',
    iconColor: '#00c896',
    title: title?.toUpperCase(),
    text: text,
  });
};

// 2. ALERTE ERREUR CRITIQUE
export const notifyError = (title, text) => {
  return Swal.fire({
    ...SYSTEM_THEME,
    icon: 'error',
    iconColor: '#ff3b3b',
    title: title?.toUpperCase(),
    text: text,
    confirmButtonColor: '#ff3b3b',
  });
};

// 3. CONFIRMATION DE TRANSACTION (SÉCURITÉ MAXIMALE)
export const confirmSystemAction = async (title, text) => {
  const result = await Swal.fire({
    ...SYSTEM_THEME,
    icon: 'warning',
    iconColor: '#ffd700',
    title: title?.toUpperCase(),
    text: text,
    showCancelButton: true,
    confirmButtonText: 'CONFIRMER',
    cancelButtonText: 'ANNULER',
    reverseButtons: true,
  });
  return result.isConfirmed;
};

// 4. PROTOCOLE D'ACCÈS (AFFICHAGE DE L'ID UNIQUE)
export const notifyAccessCreated = (finalID) => {
  return Swal.fire({
    ...SYSTEM_THEME,
    icon: 'success',
    iconColor: '#00c896',
    title: 'IDENTIFIANT GÉNÉRÉ',
    html: `
      <div style="margin-top: 15px;">
        <p style="color: #888; font-size: 0.8rem; margin-bottom: 10px;">CONSERVEZ VOTRE CODE DE CONNEXION</p>
        <div style="background: #111; border: 1px solid #222; padding: 20px; border-radius: 12px; border: 1px solid #00c896;">
          <span style="color: #00c896; font-size: 2.5rem; font-weight: 900; letter-spacing: 4px;">${finalID}</span>
        </div>
        <p style="color: #00c896; font-size: 0.7rem; margin-top: 15px; font-weight: bold;">● SYNC. BASE DE DONNÉES OK</p>
      </div>
    `,
    confirmButtonText: 'DÉMARRER LA SESSION',
  });
};

// 5. TOAST HUD (NOTIFICATIONS RAPIDES)
export const notifyToast = (title, type = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: '#0d0d0d',
    color: '#fff',
  });
  return Toast.fire({
    icon: type,
    iconColor: type === 'success' ? '#00c896' : '#ff3b3b',
    title: title?.toUpperCase()
  });
};

// ALIAS POUR UNE STABILITÉ TOTALE DU DASHBOARD
export const toastHUD = notifyToast;
export const confirmAction = confirmSystemAction;