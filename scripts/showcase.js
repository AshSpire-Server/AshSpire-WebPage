document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.gallery');
  if (!container) return;

  try {
    const res = await fetch('showcase.json');
    if (!res.ok) throw new Error('Failed to fetch showcase.json');
    const items = await res.json();

    container.innerHTML = '';
    for (const it of items) {
      const item = document.createElement('div');
      item.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || '';
      img.loading = 'lazy';

      item.appendChild(img);
      container.appendChild(item);
    }
  } catch (err) {
    console.error('Error loading showcase items:', err);
  }
});
