// Interactive scripts for portfolio website
document.addEventListener("DOMContentLoaded", function() {
    console.log("BSIT Industry-Ready Portfolio loaded successfully!");

    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("portfolio-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    function setTheme(theme) {
        document.body.dataset.theme = theme;
        const isDark = theme === "dark";
        themeToggle.innerHTML = `<i class="fa-solid fa-${isDark ? "sun" : "moon"}" aria-hidden="true"></i><span class="theme-toggle-label">${isDark ? "Light mode" : "Dark mode"}</span>`;
        themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
        localStorage.setItem("portfolio-theme", theme);
    }

    setTheme(savedTheme || preferredTheme);
    themeToggle.addEventListener("click", function() {
        setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    });

    // Smooth scrolling for section links and buttons
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target || this.hasAttribute('data-bs-toggle')) return;

            e.preventDefault();
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });

    // Reveal sections and cards as they enter the viewport.
    const revealItems = document.querySelectorAll(
        '.section-title, #certifications .card, #projects .card, #skills .card, #about .card, #problem-solving .card, #employability .card'
    );
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(item => item.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

        revealItems.forEach((item, index) => {
            item.classList.add('reveal-on-scroll');
            item.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
            revealObserver.observe(item);
        });
    }
    const lightbox = document.getElementById('certificateLightbox');
    const lightboxContent = document.getElementById('certificateLightboxContent');
    const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxContent.replaceChildren();
        document.body.classList.remove('certificate-viewer-open');
    };
    document.querySelectorAll('.certificate-image, .certificate-pdf-preview, .profile-card img').forEach(preview => {
        const openPreview = () => {
            const isPdf = preview.tagName === 'IFRAME';
            const source = isPdf ? preview.src.split('#')[0] : preview.src;
            const viewer = document.createElement(isPdf ? 'iframe' : 'img');
            viewer.src = isPdf ? `${source}#toolbar=1&navpanes=0&view=Fit` : source;
            if (isPdf) viewer.title = preview.title; else viewer.alt = preview.alt;
            lightboxContent.replaceChildren(viewer);
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('certificate-viewer-open');
            lightbox.querySelector('.certificate-lightbox-close').focus();
        };
        preview.addEventListener('click', openPreview);
        if (preview.matches('.profile-card img')) {
            preview.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openPreview();
                }
            });
        }
        if (preview.classList.contains('certificate-pdf-preview')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'certificate-preview-wrap';
            preview.parentNode.insertBefore(wrapper, preview);
            wrapper.appendChild(preview);
            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'certificate-preview-open';
            openButton.setAttribute('aria-label', `Open ${preview.title} full screen`);
            openButton.addEventListener('click', openPreview);
            wrapper.appendChild(openButton);
        }
    });
    lightbox.querySelector('.certificate-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox(); });
});
