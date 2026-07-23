/* ═══════════════════════════════════════════════════════════
   Notexcali Landing Page — JavaScript
   Dark mode, navbar scroll, reveal animations, mobile menu
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Dark Mode Toggle ──
    const html = document.documentElement;
    const btnToggle = document.getElementById('btn-theme-toggle');
    const iconSun = btnToggle.querySelector('.icon-sun');
    const iconMoon = btnToggle.querySelector('.icon-moon');

    function updateThemeIcons() {
        const isDark = html.classList.contains('dark');
        iconSun.style.display = isDark ? 'block' : 'none';
        iconMoon.style.display = isDark ? 'none' : 'block';
    }

    updateThemeIcons();

    btnToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        const isDark = html.classList.contains('dark');
        localStorage.setItem('notexcali-landing-theme', isDark ? 'dark' : 'light');
        updateThemeIcons();
    });

    // ── Navbar Scroll Effect ──
    const navbar = document.getElementById('navbar');
    const progressBar = document.getElementById('progress-bar');
    let lastScroll = 0;

    function onScroll() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollY / docHeight : 0;

        // Frosted glass navbar
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Progress bar
        progressBar.style.transform = `scaleX(${progress})`;

        lastScroll = scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial state

    // ── Scroll-Triggered Reveal Animations ──
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px',
        }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // ── Mobile Menu ──
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    let menuOpen = false;

    function toggleMobileMenu() {
        menuOpen = !menuOpen;
        if (menuOpen) {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    btnMobileMenu.addEventListener('click', toggleMobileMenu);

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (menuOpen) toggleMobileMenu();
        });
    });

    // ── Smooth Scroll for Anchor Links ──
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80; // navbar height
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });
})();
