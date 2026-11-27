// Aparicion de cada parte de seccion, una sola vez; nunca deja contenido oculto.
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// Lo vivo: que pod y que nodo del cluster han servido esta visita (nginx responde /served-by.json),
// en el pie y en la tarjeta del hero, con el tiempo de respuesta medido en el navegador.
(() => {
  const foot = document.querySelector('[data-served]');
  const live = document.querySelectorAll('[data-live]');
  if (!foot && !live.length) return;
  const t0 = performance.now();
  fetch('/served-by.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      if (!d.pod || !d.node) return;
      const ms = String(Math.round(performance.now() - t0));
      if (foot) foot.textContent = foot.dataset.served.replace('{pod}', d.pod).replace('{node}', d.node);
      live.forEach((el) => { el.textContent = { pod: d.pod, node: d.node, ms }[el.dataset.live] ?? el.textContent; });
    })
    .catch(() => {});
})();
