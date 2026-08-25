 // ---------- supabase connection ----------
  const SUPABASE_URL = 'https://rxqmvguyntontpgxupeh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cW12Z3V5bnRvbnRwZ3h1cGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTEyMjAsImV4cCI6MjA5OTIyNzIyMH0.4bil8xGsGpMfOygS3JvGdLeP3_M99FCmOTKGgKsHX3s';

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- nav solid + active section ----------
  const nav = document.getElementById('topnav');
  const navLinks = document.querySelectorAll('.navlinks a');
  const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  const onScrollNav = () => {
    nav.classList.toggle('solid', window.scrollY > window.innerHeight * 0.5);
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    sections.forEach((sec, i) => {
      if(sec && scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight){
        navLinks.forEach(l => l.classList.remove('active'));
        navLinks[i].classList.add('active');
      }
    });
  };
  document.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  // ---------- mobile nav drawer: see js/nav.js (shared with photos.html) ----------

  // ---------- scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));

  // parallax quote reveal
  const parallaxQuote = document.getElementById('parallax-quote');
  const parallaxAttr = document.getElementById('parallax-attr');
  const parallaxIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        parallaxQuote.classList.add('is-visible');
        parallaxAttr.classList.add('is-visible');
      }
    });
  }, { threshold: 0.3 });
  parallaxIO.observe(document.getElementById('parallax-band'));

  // photo tiles stagger reveal
  const photoTiles = document.querySelectorAll('.photo-tile');
  const photoIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        const delay = e.target.dataset.delay || 0;
        setTimeout(() => e.target.classList.add('is-visible'), delay * 100);
        photoIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  photoTiles.forEach(el => photoIO.observe(el));

  // ---------- reusable click-to-zoom lightbox ----------
  function setupLightbox(lightboxId, tiles){
    const lightbox = document.getElementById(lightboxId);
    if(!lightbox || !tiles.length) return;

    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbTiles = [...tiles];
    let lbIndex = 0;

    const show = (index) => {
      lbIndex = (index + lbTiles.length) % lbTiles.length;
      const tile = lbTiles[lbIndex];
      const img = tile.querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      if(lbCaption) lbCaption.textContent = tile.dataset.caption || '';
    };

    const open = (index) => {
      show(index);
      lightbox.classList.add('open');
      document.body.style.overflowY = 'hidden';
    };

    const close = () => {
      lightbox.classList.remove('open');
      document.body.style.overflowY = 'auto';
      lbImg.src = '';
    };

    lbTiles.forEach((tile, i) => tile.addEventListener('click', () => open(i)));
    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', e => { e.stopPropagation(); show(lbIndex - 1); });
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', e => { e.stopPropagation(); show(lbIndex + 1); });
    lightbox.addEventListener('click', e => { if(e.target === lightbox) close(); });

    document.addEventListener('keydown', e => {
      if(!lightbox.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') show(lbIndex - 1);
      if(e.key === 'ArrowRight') show(lbIndex + 1);
    });
  }

  setupLightbox('photos-lightbox', photoTiles);
  setupLightbox('qr-lightbox', document.querySelectorAll('.qr-item'));
  setupLightbox('dress-lightbox', document.querySelectorAll('.dress-sample-media'));

  // ---------- parallax + scroll-driven movement ----------
  const parallaxBg = document.getElementById('parallax-bg');
  const scrollSpeedEls = document.querySelectorAll('[data-scroll-speed]');

  const onScrollEffects = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    // main parallax band
    if(parallaxBg && !prefersReducedMotion){
      const band = document.getElementById('parallax-band');
      const rect = band.getBoundingClientRect();
      if(rect.bottom > 0 && rect.top < vh){
        const progress = (vh - rect.top) / (vh + rect.height);
        parallaxBg.style.transform = `translateY(${(progress - 0.5) * 80}px) scale(1.08)`;
      }
    }

    // elements with custom scroll speed (subtle float)
    if(!prefersReducedMotion){
      scrollSpeedEls.forEach(el => {
        const speed = parseFloat(el.dataset.scrollSpeed) || 0.1;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) * speed * -1;
        el.style.transform = `translateY(${offset}px)`;
      });
    }
  };
  document.addEventListener('scroll', onScrollEffects, { passive: true });
  window.addEventListener('resize', onScrollEffects);
  onScrollEffects();

  // ---------- signature vine grows with scroll ----------
  const vinePath = document.getElementById('vine-path');
  const vineLen = vinePath.getTotalLength();
  vinePath.style.strokeDasharray = vineLen;
  vinePath.style.strokeDashoffset = vineLen;
  const drawVine = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const frac = Math.min(1, Math.max(0, window.scrollY / scrollable));
    vinePath.style.strokeDashoffset = vineLen * (1 - frac);
  };
  document.addEventListener('scroll', drawVine, { passive: true });
  window.addEventListener('resize', drawVine);
  drawVine();

  // ---------- countdown ----------
  const target = new Date('2026-10-17T15:00:00');
  const dEl = document.getElementById('cd-days'), hEl = document.getElementById('cd-hours'),
        mEl = document.getElementById('cd-mins'), sEl = document.getElementById('cd-secs');
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const diff = target - new Date();
    if(diff <= 0){ dEl.textContent='00'; hEl.textContent='00'; mEl.textContent='00'; sEl.textContent='00'; return; }
    dEl.textContent = pad(Math.floor(diff / 86400000));
    hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
    sEl.textContent = pad(Math.floor((diff % 60000) / 1000));
  };
  tick(); setInterval(tick, 1000);

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if(!isOpen){
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- radio pill styling ----------
  document.querySelectorAll('.radio-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
  // ---------- toast ----------
  const toast = document.getElementById('toast');
let toastTimer;

function showToast(message, type = 'success') {
  
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'toast';

  if (type === 'error') {
    toast.classList.add('error');
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
const msg = document.getElementById('rsvp-msg');

function showInlineMessage(message, type = 'ok') {
  if (!msg) return;
  msg.textContent = message;
  msg.className = `rsvp-msg ${type} show`;
}

function clearInlineMessage() {
  if (!msg) return;
  msg.textContent = '';
  msg.className = 'rsvp-msg';
}
  // ---------- RSVP submit ----------
  const form = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('rsvp-submit');


function showInlineMessage(message, type = 'ok') {
  if (!msg) return;
  msg.textContent = message;
  msg.className = `rsvp-msg ${type} show`;
}

function clearInlineMessage() {
  if (!msg) return;
  msg.textContent = '';
  msg.className = 'rsvp-msg';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  clearInlineMessage();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    const formData = new FormData(form);

    const payload = {
      email: (formData.get('email') || '').toString().trim().toLowerCase(),
      name: (formData.get('name') || '').toString().trim(),
      attending: (formData.get('attending') || '').toString().trim(),
      guests: Number(formData.get('guests') || 1),
      message: (formData.get('message') || '').toString().trim() || null
    };

    const { error } = await supabaseClient
      .from('rsvps')
      .insert([payload]);

    if (error) {
      if (error.code === '23505') {
        const duplicateMsg = 'This email has already been used for an RSVP. If you need to make changes, please contact the couple.';
        showToast(duplicateMsg, 'error');
        showInlineMessage(duplicateMsg, 'err');
        return;
      }

      throw error;
    }

    const successMsg = "Thank you! We've received your RSVP and can't wait to celebrate with you.";
    showToast(successMsg);
    showInlineMessage(successMsg, 'ok');

    form.reset();
    document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));

  } catch (err) {
    console.error('RSVP insert failed:', err);
    const errorMsg = 'Sorry, something went wrong while sending your RSVP. Please try again.';
    showToast(errorMsg, 'error');
    showInlineMessage(errorMsg, 'err');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send RSVP';
  }
});

// =========================================================
// GUEST MESSAGE CAROUSEL
// =========================================================

const guestTrack = document.getElementById('guest-marquee-track');
const guestMarquee = guestTrack?.parentElement;

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'G';
}

function escapeHtml(str = '') {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildGuestCard(item) {
  const name = escapeHtml(item.name || 'Guest');
  const message = escapeHtml(item.message || '');
  const initials = getInitials(item.name || 'Guest');

  return `
    <article class="guest-card">
      <p class="guest-card-message">${message}</p>
      <div class="guest-card-footer">
        <div class="guest-card-avatar">${initials}</div>
        <div>
          <div class="guest-card-name">${name}</div>
          <div class="guest-card-sub">With love</div>
        </div>
      </div>
    </article>
  `;
}

let marqueeState = {
  isDragging: false,
  startX: 0,
  currentTranslate: 0,
  prevTranslate: 0,
  animationId: null,
  autoSpeed: 0.45, // px per frame; adjust if you want faster/slower
  loopWidth: 0
};

function stopGuestMarquee() {
  if (marqueeState.animationId) {
    cancelAnimationFrame(marqueeState.animationId);
    marqueeState.animationId = null;
  }
}

function setGuestTrackPosition(x) {
  guestTrack.style.transform = `translate3d(${x}px, 0, 0)`;
}

function normalizeGuestTrackPosition() {
  const { loopWidth } = marqueeState;
  if (!loopWidth) return;

  // keep translate between -loopWidth and 0 for seamless looping
  if (marqueeState.currentTranslate <= -loopWidth) {
    marqueeState.currentTranslate += loopWidth;
  } else if (marqueeState.currentTranslate > 0) {
    marqueeState.currentTranslate -= loopWidth;
  }
}

function animateGuestMarquee() {
  if (!marqueeState.isDragging) {
    marqueeState.currentTranslate -= marqueeState.autoSpeed;
    normalizeGuestTrackPosition();
    setGuestTrackPosition(marqueeState.currentTranslate);
  }

  marqueeState.animationId = requestAnimationFrame(animateGuestMarquee);
}

function setupGuestMarqueeDrag() {
  if (!guestMarquee || !guestTrack) return;

  const getClientX = (e) => {
    if (e.touches?.length) return e.touches[0].clientX;
    if (e.changedTouches?.length) return e.changedTouches[0].clientX;
    return e.clientX;
  };

  const onDragStart = (e) => {
    marqueeState.isDragging = true;
    guestMarquee.classList.add('dragging');
    marqueeState.startX = getClientX(e);
    marqueeState.prevTranslate = marqueeState.currentTranslate;
  };

  const onDragMove = (e) => {
    if (!marqueeState.isDragging) return;
    const currentX = getClientX(e);
    const delta = currentX - marqueeState.startX;
    marqueeState.currentTranslate = marqueeState.prevTranslate + delta;
    normalizeGuestTrackPosition();
    setGuestTrackPosition(marqueeState.currentTranslate);
  };

  const onDragEnd = () => {
    if (!marqueeState.isDragging) return;
    marqueeState.isDragging = false;
    guestMarquee.classList.remove('dragging');
    marqueeState.prevTranslate = marqueeState.currentTranslate;
  };

  guestMarquee.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);

  guestMarquee.addEventListener('touchstart', onDragStart, { passive: true });
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('touchend', onDragEnd);

  guestMarquee.addEventListener('mouseleave', onDragEnd);
}

async function loadGuestMessages() {
  if (!guestTrack) return;

  guestTrack.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('rsvps')
    .select('name, message')
    .eq('is_approved', true)
    .eq('show_message', true)
    .not('message', 'is', null);

  if (error) {
    console.error('Failed to load guest messages:', error);
    guestTrack.innerHTML = `<div class="guest-marquee-empty">Guest messages will appear here soon.</div>`;
    return;
  }

  const cleaned = (data || [])
    .map(item => ({
      name: (item.name || '').trim(),
      message: (item.message || '').trim()
    }))
    .filter(item => item.message.length > 0);

  if (!cleaned.length) {
    guestTrack.innerHTML = `<div class="guest-marquee-empty">Guest messages will appear here soon.</div>`;
    return;
  }

  // randomize every visit
  const shuffled = shuffleArray(cleaned);

  // duplicate once for seamless looping
  const html = [...shuffled, ...shuffled]
    .map(buildGuestCard)
    .join('');

  guestTrack.innerHTML = html;

  // wait for layout
  requestAnimationFrame(() => {
    const cards = guestTrack.querySelectorAll('.guest-card');
    if (!cards.length) return;

    // first half width = loop width
    const totalWidth = guestTrack.scrollWidth;
    marqueeState.loopWidth = totalWidth / 2;
    marqueeState.currentTranslate = 0;
    marqueeState.prevTranslate = 0;

    setGuestTrackPosition(0);
    stopGuestMarquee();
    animateGuestMarquee();
  });
}

setupGuestMarqueeDrag();
loadGuestMessages();
window.addEventListener('resize', () => {
  // recompute width on resize
  if (!guestTrack || !guestTrack.children.length) return;
  requestAnimationFrame(() => {
    marqueeState.loopWidth = guestTrack.scrollWidth / 2;
    normalizeGuestTrackPosition();
    setGuestTrackPosition(marqueeState.currentTranslate);
  });
});

// ---------- engagement carousel ----------
(function initEngagementCarousel(){
  const track = document.getElementById('engagement-track');
  const dotsWrap = document.getElementById('engagement-dots');
  if (!track || !dotsWrap) return;

  const slides = [...track.querySelectorAll('.ecarousel-slide')];
  const prevBtn = document.querySelector('.ecarousel-prev');
  const nextBtn = document.querySelector('.ecarousel-next');

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'ecarousel-dot';
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => {
      slide.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.children];

  const setActive = () => {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let closestDist = Infinity;
    slides.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const dist = Math.abs((r.left + r.width / 2) - center);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    slides.forEach((s, i) => s.classList.toggle('is-active', i === closest));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === closest));
  };

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { setActive(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  const goTo = (dir) => {
    const idx = slides.findIndex(s => s.classList.contains('is-active'));
    const target = slides[Math.min(slides.length - 1, Math.max(0, idx + dir))];
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };
  prevBtn.addEventListener('click', () => goTo(-1));
  nextBtn.addEventListener('click', () => goTo(1));

  window.addEventListener('resize', () => requestAnimationFrame(setActive));
  setActive();
})();


