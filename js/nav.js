/* ==========================================================
   SHARED SITE NAVIGATION — single source of truth for the nav
   bar markup + mobile drawer behavior, used by index.html and
   photos.html. Edit the LINKS list below to change nav links
   everywhere at once.
========================================================== */
(function () {
  const mount = document.getElementById('site-nav');
  if (!mount) return;

  const onPhotosPage = document.body.classList.contains('photos-page');
  const base = onPhotosPage ? 'index.html' : '';

  const LINKS = [
    { href: '#story', label: 'Our Story' },
    { href: '#dress-code', label: 'Dress Code' },
    { href: '#qa', label: 'Q&amp;A' },
    { href: '#venue', label: 'Venue' },
    { href: '#rsvp', label: 'RSVP' },
    { href: 'photos.html', label: 'Photos', isPhotos: true },
  ];

  const linksHtml = LINKS.map(l => {
    const href = l.isPhotos ? l.href : base + l.href;
    const activeAttr = onPhotosPage && l.isPhotos ? ' class="active"' : '';
    return `<a href="${href}"${activeAttr}>${l.label}</a>`;
  }).join('\n        ');

  mount.outerHTML = `
    <nav id="topnav">
      <a href="index.html#hero" class="brandmark">S &amp; E</a>
      <button id="navToggle" class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="navlinks">
        <span></span><span></span><span></span>
      </button>
      <div class="navlinks" id="navlinks">
        ${linksHtml}
      </div>
    </nav>
    <div class="nav-backdrop" id="navBackdrop"></div>`;

  const nav = document.getElementById('topnav');
  const navToggle = document.getElementById('navToggle');
  const navPanel = document.getElementById('navlinks');
  const navBackdrop = document.getElementById('navBackdrop');

  // pages without a #hero (e.g. photos.html) show the nav solid immediately
  // instead of the transparent-over-hero -> solid-on-scroll effect
  if (!document.getElementById('hero')) {
    nav.classList.add('solid');
  }

  const closeNavDrawer = () => {
    navPanel.classList.remove('open');
    navToggle.classList.remove('open');
    navBackdrop.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = 'auto';
  };

  const openNavDrawer = () => {
    navPanel.classList.add('open');
    navToggle.classList.add('open');
    navBackdrop.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflowY = 'hidden';
  };

  navToggle.addEventListener('click', () => {
    if (navPanel.classList.contains('open')) closeNavDrawer();
    else openNavDrawer();
  });
  navBackdrop.addEventListener('click', closeNavDrawer);
  navPanel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNavDrawer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNavDrawer();
  });
})();
