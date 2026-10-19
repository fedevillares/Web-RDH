(() => {
  // Header background swap on scroll
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.classList.toggle('active', open);
  });
  mobileNav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    })
  );

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Highlight a catalog card when jumped to via anchor (e.g. marquee links)
  const highlightCard = (hash) => {
    const target = document.querySelector(hash);
    if (!target || !target.classList.contains('cat-card')) return;
    target.classList.add('pulse');
    setTimeout(() => target.classList.remove('pulse'), 1400);
  };
  document.querySelectorAll('a[href^="#cat-"]').forEach(a =>
    a.addEventListener('click', () => highlightCard(a.getAttribute('href')))
  );
  if (location.hash) highlightCard(location.hash);

  // PDP gallery: crossfade the main image on thumbnail click, and bring the
  // clicked photo to the foreground in a lightbox instead of a static swap.
  const pdpMainWrap = document.querySelector('.pdp-gallery-main');
  const pdpMain = pdpMainWrap ? pdpMainWrap.querySelector('img') : null;
  const pdpThumbs = document.querySelectorAll('.pdp-gallery-thumbs button');
  const pdpLightbox = document.getElementById('pdpLightbox');
  const pdpLightboxImg = pdpLightbox ? pdpLightbox.querySelector('img') : null;

  const setMainImage = (src, alt) => {
    pdpMain.classList.add('is-switching');
    setTimeout(() => {
      pdpMain.setAttribute('src', src);
      pdpMain.setAttribute('alt', alt);
      requestAnimationFrame(() => pdpMain.classList.remove('is-switching'));
    }, 200);
  };

  if (pdpMain && pdpThumbs.length) {
    let pdpVideo = null;
    const hideVideo = () => {
      if (!pdpVideo) return;
      pdpVideo.pause();
      pdpVideo.remove();
      pdpVideo = null;
      pdpMainWrap.classList.remove('has-video');
    };
    pdpThumbs.forEach(btn => btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      pdpThumbs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.video) {
        hideVideo();
        pdpVideo = document.createElement('video');
        pdpVideo.src = btn.dataset.video;
        pdpVideo.poster = img.getAttribute('src');
        pdpVideo.controls = true;
        pdpVideo.autoplay = true;
        pdpVideo.muted = true;
        pdpVideo.loop = true;
        pdpVideo.playsInline = true;
        pdpVideo.setAttribute('aria-label', img.getAttribute('alt'));
        pdpMainWrap.classList.add('has-video');
        pdpMainWrap.appendChild(pdpVideo);
        return;
      }
      hideVideo();
      setMainImage(img.getAttribute('src'), img.getAttribute('alt'));
    }));
  }

  // Header search: fetches a prebuilt product index and filters it live.
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');

  if (searchToggle && searchOverlay && searchInput && searchResults) {
    let indexPromise = null;
    const loadIndex = () => {
      if (!indexPromise) {
        const pre = searchOverlay.dataset.pre || '';
        indexPromise = fetch(pre + 'search-index.json').then(r => r.json()).catch(() => []);
      }
      return indexPromise;
    };

    const renderResults = (items, query) => {
      if (!query) {
        searchResults.innerHTML = '<p class="search-hint">Escribí el nombre de un equipo, selección o liga.</p>';
        return;
      }
      if (!items.length) {
        searchResults.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'search-empty';
        p.textContent = 'No encontramos camisetas para "' + query + '".';
        searchResults.appendChild(p);
        return;
      }
      const pre = searchOverlay.dataset.pre || '';
      searchResults.innerHTML = '';
      items.slice(0, 20).forEach(p => {
        const a = document.createElement('a');
        a.className = 'search-result';
        a.href = pre + p.href;

        const img = document.createElement('img');
        img.src = pre + p.img;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 44;
        img.height = 44;

        const info = document.createElement('div');
        info.className = 'search-result-info';
        const name = document.createElement('p');
        name.className = 'search-result-name';
        name.textContent = p.name;
        const tag = document.createElement('p');
        tag.className = 'search-result-tag';
        tag.textContent = p.tag;
        info.appendChild(name);
        info.appendChild(tag);

        a.appendChild(img);
        a.appendChild(info);
        searchResults.appendChild(a);
      });
    };

    const runSearch = (query) => {
      const q = query.trim().toLowerCase();
      loadIndex().then(items => {
        const matches = q ? items.filter(p => p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)) : [];
        renderResults(matches, q);
      });
    };

    const openSearch = () => {
      searchOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      loadIndex();
      renderResults([], '');
      setTimeout(() => searchInput.focus(), 50);
    };
    const closeSearch = () => {
      searchOverlay.classList.remove('open');
      document.body.style.overflow = '';
      searchInput.value = '';
    };

    searchToggle.addEventListener('click', openSearch);
    searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !searchOverlay.classList.contains('open') && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        openSearch();
      }
    });
    searchInput.addEventListener('input', () => runSearch(searchInput.value));
  }

  if (pdpMainWrap && pdpLightbox && pdpLightboxImg) {
    const slides = Array.from(pdpThumbs).filter(btn => !btn.dataset.video).map(btn => {
      const img = btn.querySelector('img');
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
    });
    let slideIndex = 0;

    const showSlide = (i) => {
      slideIndex = (i + slides.length) % slides.length;
      const s = slides[slideIndex];
      pdpLightboxImg.setAttribute('src', s.src);
      pdpLightboxImg.setAttribute('alt', s.alt);
    };
    const nextSlide = () => showSlide(slideIndex + 1);
    const prevSlide = () => showSlide(slideIndex - 1);

    const openLightbox = () => {
      const currentSrc = pdpMain.getAttribute('src');
      const found = slides.findIndex(s => s.src === currentSrc);
      showSlide(found >= 0 ? found : 0);
      pdpLightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      pdpLightbox.classList.remove('open');
      document.body.style.overflow = '';
    };
    pdpMainWrap.addEventListener('click', () => {
      if (!pdpMainWrap.classList.contains('has-video')) openLightbox();
    });
    pdpLightbox.addEventListener('click', (e) => {
      if (e.target === pdpLightboxImg) return;
      closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!pdpLightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight' && slides.length > 1) nextSlide();
      if (e.key === 'ArrowLeft' && slides.length > 1) prevSlide();
    });

    if (slides.length > 1) {
      let touchStartX = null;
      pdpLightboxImg.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      pdpLightboxImg.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) (dx < 0 ? nextSlide : prevSlide)();
        touchStartX = null;
      }, { passive: true });

      const prevBtn = document.createElement('button');
      prevBtn.className = 'pdp-lightbox-nav pdp-lightbox-prev';
      prevBtn.setAttribute('aria-label', 'Foto anterior');
      prevBtn.innerHTML = '&#8249;';
      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevSlide(); });

      const nextBtn = document.createElement('button');
      nextBtn.className = 'pdp-lightbox-nav pdp-lightbox-next';
      nextBtn.setAttribute('aria-label', 'Foto siguiente');
      nextBtn.innerHTML = '&#8250;';
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextSlide(); });

      pdpLightbox.appendChild(prevBtn);
      pdpLightbox.appendChild(nextBtn);
    }
  }
})();
