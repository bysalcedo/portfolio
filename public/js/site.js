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

// Pie: que servidor ha entregado esta pagina (nginx responde /served-by.json en el mismo origen:
// un pod de Ebro o la VM de Oracle Cloud).
(() => {
  const foot = document.querySelector('[data-served]');
  if (!foot) return;
  fetch('/served-by.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      if (!d.pod || !d.node) return;
      foot.textContent = foot.dataset.served.replace('{pod}', d.pod).replace('{node}', d.node);
    })
    .catch(() => {});
})();

// Tarjeta en vivo: pregunta a Ebro aunque la web la sirva otro sitio, y mide la respuesta.
// Si Ebro no contesta en 3 s, lo dice en vez de quedarse en blanco.
(() => {
  const card = document.querySelector('[data-live-src]');
  if (!card) return;
  const set = (k, v) => card.querySelectorAll(`[data-live="${k}"]`).forEach((el) => { el.textContent = v; });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3000);
  const t0 = performance.now();
  fetch(card.dataset.liveSrc, { cache: 'no-store', mode: 'cors', signal: ctl.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      if (!d.pod || !d.node) return Promise.reject();
      set('ms', String(Math.round(performance.now() - t0)));
      set('pod', d.pod);
      set('node', d.node);
    })
    .catch(() => {
      set('pod', '-');
      set('node', '-');
      set('comment', card.dataset.liveOffline);
    })
    .finally(() => clearTimeout(timer));
})();
