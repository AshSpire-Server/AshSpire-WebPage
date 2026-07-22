document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  // Wrap gallery in a container so we can position controls
  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-wrapper';
  gallery.parentNode.insertBefore(wrapper, gallery);
  wrapper.appendChild(gallery);

  // Create prev/next controls
  const btnPrev = document.createElement('button');
  btnPrev.className = 'gallery-button gallery-prev disabled';
  btnPrev.setAttribute('aria-label', 'Scroll left');
  btnPrev.innerHTML = '◀';

  const btnNext = document.createElement('button');
  btnNext.className = 'gallery-button gallery-next disabled';
  btnNext.setAttribute('aria-label', 'Scroll right');
  btnNext.innerHTML = '▶';

  wrapper.appendChild(btnPrev);
  wrapper.appendChild(btnNext);

  // helper to update button enabled/disabled state
  function updateButtons() {
    const scrollLeft = gallery.scrollLeft;
    const maxScrollLeft = Math.max(0, gallery.scrollWidth - gallery.clientWidth);

    // hide controls entirely if not scrollable
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

  // Scroll by roughly one viewport of the gallery
  function scrollNext() {
    gallery.scrollBy({ left: Math.round(gallery.clientWidth * 0.8), behavior: 'smooth' });
  }
  function scrollPrev() {
    gallery.scrollBy({ left: -Math.round(gallery.clientWidth * 0.8), behavior: 'smooth' });
  }

  btnNext.addEventListener('click', () => { if (!btnNext.classList.contains('disabled')) scrollNext(); });
  btnPrev.addEventListener('click', () => { if (!btnPrev.classList.contains('disabled')) scrollPrev(); });

  let scrollTimer = null;
  gallery.addEventListener('scroll', () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateButtons, 80);
  });

  window.addEventListener('resize', () => { setTimeout(updateButtons, 120); });

  // Load items
  try {
    const res = await fetch('showcase.json');
    if (!res.ok) throw new Error('Failed to fetch showcase.json');
    const items = await res.json();

    gallery.innerHTML = '';
    for (const it of items) {
      const item = document.createElement('div');
      item.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || '';
      img.loading = 'lazy';

      item.appendChild(img);
      gallery.appendChild(item);
    }

    // After items inserted, allow browser to layout then update controls
    requestAnimationFrame(() => { updateButtons(); });

  } catch (err) {
    console.error('Error loading showcase items:', err);
  }

  // Keyboard support: left/right when gallery focused
  gallery.tabIndex = 0;
  gallery.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { scrollNext(); }
    if (e.key === 'ArrowLeft') { scrollPrev(); }
  });
});
