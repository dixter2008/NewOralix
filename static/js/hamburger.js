document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            if (mobileNav) {
                const isOpen = mobileNav.style.display === 'flex';
                mobileNav.style.display = isOpen ? 'none' : 'flex';
            }
        });
    }
});