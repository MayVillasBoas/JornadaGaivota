const sections = ['hero', 'lentes', 'mentores', 'ferramentas', 'escrita'];

function updateActiveDot(id: string) {
  document.querySelectorAll('.dot-nav-dot').forEach(dot => {
    const isActive = (dot as HTMLElement).dataset.section === id;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      updateActiveDot(entry.target.id);
    }
  });
}, { threshold: 0.3 });

sections.forEach(id => {
  const el = document.getElementById(id);
  if (el) observer.observe(el);
});

document.querySelectorAll('.dot-nav-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const id = (dot as HTMLElement).dataset.section;
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
