document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
            mobileBtn.setAttribute('aria-expanded', !isExpanded);
            mobileBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                mobileBtn.classList.remove('active');
                navLinks.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Scroll Reveal Animation (Lazy Loading Effect)
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Navbar scroll effect (add shadow on scroll)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            navbar.style.background = "rgba(255, 255, 255, 0.98)";
        } else {
            navbar.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            navbar.style.background = "rgba(255, 255, 255, 0.95)";
        }
    });

    // Admission Form Logic
    const gradeSelect = document.getElementById('gradeSelect');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const mobileInput = document.getElementById('mobileInput');

    if (gradeSelect && firstNameInput && lastNameInput && mobileInput) {
        // Initially disable name fields
        firstNameInput.disabled = true;
        lastNameInput.disabled = true;
        firstNameInput.style.opacity = '0.6';
        lastNameInput.style.opacity = '0.6';
        firstNameInput.style.cursor = 'not-allowed';
        lastNameInput.style.cursor = 'not-allowed';

        // Enable name inputs only when a grade is selected
        gradeSelect.addEventListener('change', () => {
            if (gradeSelect.value !== "") {
                firstNameInput.disabled = false;
                lastNameInput.disabled = false;
                firstNameInput.style.opacity = '1';
                lastNameInput.style.opacity = '1';
                firstNameInput.style.cursor = 'text';
                lastNameInput.style.cursor = 'text';
            } else {
                firstNameInput.disabled = true;
                lastNameInput.disabled = true;
                firstNameInput.style.opacity = '0.6';
                lastNameInput.style.opacity = '0.6';
                firstNameInput.style.cursor = 'not-allowed';
                lastNameInput.style.cursor = 'not-allowed';
            }
        });

        // Allow only numbers in mobile input
        mobileInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Form Submission Handler
        const admissionForm = document.getElementById('admissionForm');
        if (admissionForm) {
            admissionForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Get Values
                const grade = gradeSelect.value;
                const firstName = firstNameInput.value;
                const lastName = lastNameInput.value;
                const mobile = mobileInput.value;
                const email = document.querySelector('input[type="email"]').value;

                // Basic Validation
                if (!grade || !firstName || !lastName || !mobile || !email) {
                    alert('Please fill in all fields.');
                    return;
                }

                // 1. Simulate "Sending PDF": Trigger Download
                const link = document.createElement('a');
                link.href = 'assets/Dhananjay Jagtap_QA.pdf'; // Path to the asset
                link.download = 'School_Brochure.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 2. Send Enquiry to School via WhatsApp
                // Construct Message
                const message = `*New Admission Enquiry*\n\n` +
                    `*Student Name:* ${firstName} ${lastName}\n` +
                    `*Grade:* ${grade}\n` +
                    `*Mobile:* ${mobile}\n` +
                    `*Email:* ${email}\n\n` +
                    `Please send me more details.`;

                const encodedMessage = encodeURIComponent(message);
                const schoolNumber = '919822531127';
                const whatsappUrl = `https://wa.me/${schoolNumber}?text=${encodedMessage}`;

                // Open WhatsApp
                window.open(whatsappUrl, '_blank');

                // Optional: Reset form
                // admissionForm.reset();
            });
        }
    }
});
