document.addEventListener('DOMContentLoaded', async () => {
  function setupScrollSection(scrollView, wrapper = null) {
    if (!scrollView) return null;

    const container = wrapper || document.createElement('div');
    if (!wrapper) {
      container.className = 'gallery-wrapper';
      scrollView.parentNode.insertBefore(container, scrollView);
      container.appendChild(scrollView);
    }

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'gallery-button gallery-prev disabled';
    btnPrev.setAttribute('aria-label', 'Scroll left');
    btnPrev.innerHTML = '◀';

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'gallery-button gallery-next disabled';
    btnNext.setAttribute('aria-label', 'Scroll right');
    btnNext.innerHTML = '▶';

    container.appendChild(btnPrev);
    container.appendChild(btnNext);

    function updateButtons() {
      const scrollLeft = scrollView.scrollLeft;
      const maxScrollLeft = Math.max(0, scrollView.scrollWidth - scrollView.clientWidth);

      if (maxScrollLeft === 0) {
        btnPrev.style.display = 'none';
        btnNext.style.display = 'none';
        return;
      } else {
        btnPrev.style.display = '';
        btnNext.style.display = '';
      }

      if (scrollLeft <= 5) {
        btnPrev.classList.add('disabled');
      } else {
        btnPrev.classList.remove('disabled');
      }

      if (scrollLeft >= maxScrollLeft - 5) {
        btnNext.classList.add('disabled');
      } else {
        btnNext.classList.remove('disabled');
      }
    }

    function scrollNext() {
      scrollView.scrollBy({ left: Math.round(scrollView.clientWidth * 0.8), behavior: 'smooth' });
    }
    function scrollPrev() {
      scrollView.scrollBy({ left: -Math.round(scrollView.clientWidth * 0.8), behavior: 'smooth' });
    }

    btnNext.addEventListener('click', () => { if (!btnNext.classList.contains('disabled')) scrollNext(); });
    btnPrev.addEventListener('click', () => { if (!btnPrev.classList.contains('disabled')) scrollPrev(); });

    let scrollTimer = null;
    scrollView.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateButtons, 80);
    });

    window.addEventListener('resize', () => { setTimeout(updateButtons, 120); });

    scrollView.tabIndex = 0;
    scrollView.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { scrollNext(); }
      if (e.key === 'ArrowLeft') { scrollPrev(); }
    });

    return updateButtons;
  }

  const gallery = document.querySelector('.gallery');
  const galleryUpdate = setupScrollSection(gallery);

  const teamGrid = document.querySelector('.team-grid');
  const teamWrapper = document.querySelector('.team-wrapper');
  const teamUpdate = setupScrollSection(teamGrid, teamWrapper);

  // Create overlay for expanded images
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.innerHTML = `
    <button class="gallery-overlay-close" aria-label="Close expanded view">✕</button>
    <button class="gallery-overlay-arrow gallery-overlay-prev" aria-label="Previous image">◀</button>
    <div class="gallery-overlay-content">
      <img class="gallery-overlay-img" src="" alt="">
      <div class="gallery-overlay-caption"></div>
    </div>
    <button class="gallery-overlay-arrow gallery-overlay-next" aria-label="Next image">▶</button>
  `;
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('.gallery-overlay-img');
  const overlayCaption = overlay.querySelector('.gallery-overlay-caption');
  const overlayClose = overlay.querySelector('.gallery-overlay-close');
  const overlayPrev = overlay.querySelector('.gallery-overlay-prev');
  const overlayNext = overlay.querySelector('.gallery-overlay-next');

  let allItems = [];
  let currentImageIndex = 0;

  function openImageModal(src, alt, description, index) {
    currentImageIndex = index;
    overlayImg.src = src;
    overlayImg.alt = alt;
    overlayCaption.textContent = description;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateArrowButtons();
  }

  function closeImageModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateArrowButtons() {
    overlayPrev.style.opacity = currentImageIndex === 0 ? '0.3' : '1';
    overlayPrev.style.pointerEvents = currentImageIndex === 0 ? 'none' : 'auto';
    overlayNext.style.opacity = currentImageIndex === allItems.length - 1 ? '0.3' : '1';
    overlayNext.style.pointerEvents = currentImageIndex === allItems.length - 1 ? 'none' : 'auto';
  }

  async function showImage(index) {
    if (index < 0 || index >= allItems.length) return;
    const item = allItems[index];
    let description = item.alt;
    
    try {
      const txtPath = item.src.replace('.png', '.txt').replace('images/showcase/', 'images/showcase/');
      const res = await fetch(txtPath);
      if (res.ok) {
        description = await res.text();
      }
    } catch (err) {
      console.log('Using alt text as description');
    }
    
    openImageModal(item.src, item.alt, description, index);
  }

  overlayClose.addEventListener('click', closeImageModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeImageModal();
  });

  overlayPrev.addEventListener('click', () => {
    if (currentImageIndex > 0) showImage(currentImageIndex - 1);
  });

  overlayNext.addEventListener('click', () => {
    if (currentImageIndex < allItems.length - 1) showImage(currentImageIndex + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeImageModal();
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) showImage(currentImageIndex - 1);
    if (e.key === 'ArrowRight' && currentImageIndex < allItems.length - 1) showImage(currentImageIndex + 1);
  });

  // Load items
  if (gallery) {
    try {
      const res = await fetch('showcase.json');
      if (!res.ok) throw new Error('Failed to fetch showcase.json');
      const items = await res.json();
      allItems = items;

      gallery.innerHTML = '';
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = it.src;
        img.alt = it.alt || '';
        img.loading = 'lazy';

        item.appendChild(img);
        gallery.appendChild(item);

        // Add click handler to open modal with index
        item.addEventListener('click', () => {
          showImage(idx);
        });
      }

      requestAnimationFrame(() => { galleryUpdate?.(); });
    } catch (err) {
      console.error('Error loading showcase items:', err);
    }
  }

  galleryUpdate?.();
  teamUpdate?.();
});
