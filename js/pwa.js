// Gerenciador de PWA - HAVOC BASE
let deferredPrompt = null;

window.addEventListener('DOMContentLoaded', () => {
  // 1. Registra o Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('🛡️ [HAVOC BASE] Service Worker ativo:', reg.scope))
      .catch((err) => console.warn('⚠️ Falha ao registrar Service Worker:', err));
  }

  const installBtn = document.getElementById('btn-install-pwa');
  const installBanner = document.getElementById('pwa-install-banner');
  const installBannerBtn = document.getElementById('btn-banner-install');
  const dismissBannerBtn = document.getElementById('btn-banner-dismiss');

  // 2. Intercepta evento de instalação do navegador
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 HAVOC BASE pronto para instalação direta no celular!');

    if (installBtn) installBtn.style.display = 'inline-flex';
    if (installBanner && !localStorage.getItem('havoc_pwa_dismissed')) {
      installBanner.classList.add('visible');
    }
  });

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      alert('Para instalar o HAVOC BASE:\n• No Android: Abra o menu do Chrome (três pontos) e toque em "Instalar aplicativo" ou "Adicionar à tela inicial".\n• No iPhone/iOS: Toque no botão Compartilhar e selecione "Adicionar à Tela de Início".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado da instalação: ${outcome}`);
    deferredPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    if (installBanner) installBanner.classList.remove('visible');
  };

  if (installBtn) installBtn.addEventListener('click', triggerInstall);
  if (installBannerBtn) installBannerBtn.addEventListener('click', triggerInstall);

  if (dismissBannerBtn) {
    dismissBannerBtn.addEventListener('click', () => {
      if (installBanner) installBanner.classList.remove('visible');
      localStorage.setItem('havoc_pwa_dismissed', 'true');
    });
  }

  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('🚀 HAVOC BASE rodando em modo nativo Standalone');
    if (installBtn) installBtn.style.display = 'none';
    if (installBanner) installBanner.style.display = 'none';
  }
});
