(function () {
    'use strict';
    let items = [];
    let current = 0;

    const track = document.getElementById('track');
    if (!track) return; // no album structure on this page

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // (Title/desc panel removed; info shown only in lightbox)

    const lightbox = document.getElementById('lightbox');
    const lbClose = document.getElementById('lbClose');
    const lbImage = document.getElementById('lbImage');
    const lbTitle = document.getElementById('lbTitle');
    const lbDesc = document.getElementById('lbDesc');
    const viewerShell = document.querySelector('.viewer');
    let alignRaf = 0;
    let revealTimer = 0;
    let revealPending = false;
    let resizeObserver = null;

    function revealViewer() {
        if (!viewerShell) return;
        viewerShell.classList.remove('is-preparing');
        viewerShell.classList.add('is-ready');
    }

    function requestAlign() {
        if (alignRaf) cancelAnimationFrame(alignRaf);
        alignRaf = requestAnimationFrame(() => show(current, false));
    }

    function waitForCurrentImageThenReveal() {
        if (revealPending) return;
        revealPending = true;

        const slides = Array.from(track.querySelectorAll('.slide'));
        const currentSlide = slides[current];
        const currentImg = currentSlide ? currentSlide.querySelector('img') : null;

        const done = () => {
            if (!revealPending) return;
            revealPending = false;
            requestAnimationFrame(() => {
                show(current, false);
                revealViewer();
            });
        };

        if (!currentImg) {
            done();
            return;
        }

        if (currentImg.complete && currentImg.naturalWidth > 0) {
            done();
            return;
        }

        const onReady = () => {
            currentImg.removeEventListener('load', onReady);
            currentImg.removeEventListener('error', onReady);
            done();
        };

        currentImg.addEventListener('load', onReady, { once: true });
        currentImg.addEventListener('error', onReady, { once: true });
        clearTimeout(revealTimer);
        revealTimer = setTimeout(done, 1500);
    }

    function setupResizeObserver() {
        if (typeof ResizeObserver === 'undefined') return;
        if (resizeObserver) resizeObserver.disconnect();
        const wrap = trackWrap || track.parentElement;
        if (!wrap) return;
        resizeObserver = new ResizeObserver(() => {
            requestAlign();
        });
        resizeObserver.observe(wrap);
    }

    function render() {
        track.innerHTML = '';
        items.forEach((it, i) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.index = i;
            slide.addEventListener('click', () => onSlideClick(i));

            const img = document.createElement('img');
            img.src = it.src || '';
            img.alt = it.title || '';
            img.addEventListener('load', requestAlign);
            img.addEventListener('error', requestAlign);

            slide.appendChild(img);
            track.appendChild(slide);
        });
        setupResizeObserver();
        // wait until layout is measurable, then center with a few follow-up passes
        scheduleInitialLayoutSync();
    }

    function scheduleInitialLayoutSync() {
        let tries = 0;
        const maxTries = 24;

        const sync = () => {
            const wrap = trackWrap || track.parentElement;
            const firstSlide = track.querySelector('.slide');
            const wrapWidth = wrap ? wrap.clientWidth : 0;
            const slideWidth = firstSlide ? firstSlide.offsetWidth : 0;

            if (wrapWidth > 0 && slideWidth > 0) {
                show(current, false);
                requestAnimationFrame(() => show(current, false));
                setTimeout(() => show(current, false), 120);
                setTimeout(() => {
                    show(current, false);
                    requestAnimationFrame(() => {
                        show(current, false);
                        waitForCurrentImageThenReveal();
                    });
                }, 320);
                return;
            }

            tries += 1;
            if (tries < maxTries) {
                requestAnimationFrame(sync);
            } else {
                // fail-safe: reveal UI even on extreme slow layout cases
                show(current, false);
                waitForCurrentImageThenReveal();
            }
        };

        requestAnimationFrame(sync);
    }

    function show(index, animate = true) {
        if (items.length === 0) return;
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        current = index;

        const slides = Array.from(track.querySelectorAll('.slide'));
        if (!slides.length) return;

        const wrap = trackWrap || track.parentElement;
        const wrapWidth = wrap.clientWidth;
        const slideEl = slides[index];
        const style = getComputedStyle(slideEl);
        const marginRight = parseFloat(style.marginRight || 0);
        const slideWidth = slideEl.offsetWidth + marginRight;
        const centerOffset = Math.round((wrapWidth - slideEl.offsetWidth) / 2);
        const translateX = -index * slideWidth + centerOffset;

        if (!animate) track.style.transition = 'none';
        else track.style.transition = '';
        track.style.transform = `translateX(${translateX}px)`;

        // update classes for visual stacking
        const prevIndex = (index - 1 + slides.length) % slides.length;
        const nextIndex = (index + 1) % slides.length;
        slides.forEach((s, i) => {
            s.classList.remove('is-current', 'is-prev', 'is-next');
            if (i === index) s.classList.add('is-current');
            else if (i === prevIndex) s.classList.add('is-prev');
            else if (i === nextIndex) s.classList.add('is-next');
        });
    }

    function prev() { show(current - 1); }
    function next() { show(current + 1); }

    function onSlideClick(index) {
        // Only the focused slide can open intro/lightbox.
        // Side slides are still visible and clickable, but click only focuses them.
        if (index === current) openLightbox(index);
        else show(index);
    }

    // swipe
    const trackWrap = document.querySelector('.track-wrap') || track.parentElement;
    let startX = 0; let isDown = false;
    if (trackWrap) {
        trackWrap.addEventListener('pointerdown', (e) => { isDown = true; startX = e.clientX; });
        trackWrap.addEventListener('pointerup', (e) => { if (!isDown) return; isDown = false; const dx = e.clientX - startX; if (Math.abs(dx) > 40) { if (dx > 0) prev(); else next(); } });
        trackWrap.addEventListener('pointercancel', () => { isDown = false; });
    }

    // controls
    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    // lightbox
    function openLightbox(idx) {
        const it = items[idx]; if (!it) return;
        lbImage.src = it.src || '';
        lbTitle.textContent = it.title || '';
        const descText = Array.isArray(it.desc)
            ? it.desc.map((line) => String(line ?? '')).join('\n')
            : (it.desc || '');
        lbDesc.textContent = descText;
        lightbox.classList.add('show');
        lightbox.setAttribute('aria-hidden', 'false');
    }
    function closeLightbox() {
        lightbox.classList.remove('show');
        lightbox.setAttribute('aria-hidden', 'true');
        lbImage.removeAttribute('src');
    }
    lbClose && lbClose.addEventListener('click', closeLightbox);
    lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); });

    // recalc centering on resize
    window.addEventListener('resize', () => { requestAnimationFrame(() => show(current, false)); });
    window.addEventListener('load', () => { requestAnimationFrame(() => show(current, false)); });
    window.addEventListener('pageshow', () => { requestAnimationFrame(() => show(current, false)); });

    window.__album_set = function (newItems) {
        items = Array.isArray(newItems) ? newItems : [];
        if (items.length === 0) { items = [{ src: '/pay_wx.jpg', title: '示例', desc: '' }]; }
        render();
    }

    async function tryLoadDataJson(path = './data.json') {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) { window.__album_set(data); return true; }
            }
        } catch (e) { }
        window.__album_set([]);
        return false;
    }

    async function loadByQuery() {
        const params = new URLSearchParams(location.search);
        const albumRaw = params.get('album') || params.get('a');
        if (!albumRaw) return false;
        const album = albumRaw.replace(/\.\./g, '').replace(/^\/+/, '');

        // 尝试两种路径，一种是不带 "album/" 的，一种是带 "album/" 的，方便兼顾真实目录
        const path1 = `./album/${album}/data.json`;
        const path2 = `./${album}/data.json`;

        try {
            let res = await fetch(path1, { cache: 'no-store' });
            if (!res.ok) {
                res = await fetch(path2, { cache: 'no-store' });
            }
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) { window.__album_set(data); return true; }
            }
        } catch (e) { }

        window.__album_set([]);
        return false;
    }

    function init() {
        if (window.__ALBUM_DATA && Array.isArray(window.__ALBUM_DATA)) {
            window.__album_set(window.__ALBUM_DATA);
        } else {
            const params = new URLSearchParams(location.search);
            if (params.get('album') || params.get('a')) {
                loadByQuery();
            } else {
                tryLoadDataJson();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
