document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxDesc = document.getElementById('lightbox-description');
  const closeBtn = document.getElementById('lightbox-close');

  window.addEventListener('openLightbox', e => {
  if (e.detail && e.detail.src) {
    lightboxImg.src = e.detail.src;
    lightboxDesc.innerHTML = e.detail.description || '';
    lightbox.style.display = 'flex';
  }
});

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
    lightboxDesc.innerHTML = '';
  }
});
