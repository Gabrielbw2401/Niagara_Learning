// Hamburger menu
const hamburger = document.getElementById('nav-toggle');
const nav = document.getElementById('main-nav');
if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
        nav.classList.toggle('open');
    });
}

// Dropdown menu delay
document.querySelectorAll('.dropdown').forEach(function(dropdown) {
    let timeout;
    dropdown.addEventListener('mouseenter', function() {
        clearTimeout(timeout);
        dropdown.classList.add('open');
    });
    dropdown.addEventListener('mouseleave', function() {
        timeout = setTimeout(function() {
            dropdown.classList.remove('open');
        }, 500);
    });
});