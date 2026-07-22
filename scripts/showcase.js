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

  // Load items
  if (gallery) {
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

      requestAnimationFrame(() => { galleryUpdate?.(); });
    } catch (err) {
      console.error('Error loading showcase items:', err);
    }
  }

  galleryUpdate?.();
  teamUpdate?.();
});
