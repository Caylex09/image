
function isAlbumMode() {
    const params = new URLSearchParams(location.search);
    return !!(params.get('album') || params.get('a'));
}

function setBackgroundImage() {
    const bgLayer = document.getElementById('bgLayer');
    if (!bgLayer) return;
    bgLayer.style.backgroundImage = "url('./background.jpg')";
}

function renderFolders() {
    const folderGrid = document.getElementById('folderGrid');
    if (!folderGrid) return;
    folderGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    folderItems.forEach(item => {
        const card = document.createElement('a');
        card.className = 'folder-card';

        // 如果指向上级或带斜线的目录，我们只需把 `?album=album/hello` 改简短点即可
        let href = item.href || '#';
        let albumName = null;
        try {
            albumName = href.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
            // user wants simpler URL string without "album/" directory path shown.
            // if it starts with "album/", replace it out for query purity.
            if (albumName.startsWith('album/')) albumName = albumName.substring(6);
            if (!albumName) albumName = null;
        } catch (e) { albumName = null; }

        card.href = albumName ? `?album=${encodeURIComponent(albumName)}` : href;
        card.target = '_self';
        card.rel = '';

        card.innerHTML = `
            <h3 class="folder-title">${item.title}</h3>
            <p class="folder-desc">${item.desc}</p>
        `;

        fragment.appendChild(card);
    });

    folderGrid.appendChild(fragment);
}

async function loadFolderItems() {
    try {
        const res = await fetch('./albums.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        folderItems = data.map((item) => ({
            title: item.title || '未命名相册',
            desc: item.desc || '',
            href: item.href || '#',
        }));
    } catch (e) {
        // keep fallbackFolderItems when albums.json is unavailable
    }
}

function setupScrollReveal() {
    if (isAlbumMode()) return;
    const hero = document.getElementById('hero');
    const folders = document.getElementById('folders');
    if (!hero || !folders) return;

    // ensure hidden state
    folders.classList.remove('visible');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // hero is in view -> hide folders
                folders.classList.remove('visible');
                const cards = folders.querySelectorAll('.folder-card');
                cards.forEach(c => c.style.transitionDelay = '');
            } else {
                // hero left view -> show folders with staggered delays
                folders.classList.add('visible');
                const cards = folders.querySelectorAll('.folder-card');
                cards.forEach((c, i) => {
                    c.style.transitionDelay = (i * 90) + 'ms';
                });
            }
        });
    }, { root: null, threshold: 0.12 });

    observer.observe(hero);
}

function setupPayToggle() {
    if (isAlbumMode()) return;
    const button = document.getElementById('payToggleBtn');
    const payGrid = document.getElementById('payGrid');
    if (!button || !payGrid) return;

    button.addEventListener('click', () => {
        payGrid.classList.toggle('is-collapsed');
        const expanded = !payGrid.classList.contains('is-collapsed');
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? '收起收款码' : 'v 我 50';
    });
}

async function initHome() {
    if (isAlbumMode()) return;
    setBackgroundImage();
    setupPayToggle();
    await loadFolderItems();
    renderFolders();
    setupScrollReveal();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHome);
else initHome();
