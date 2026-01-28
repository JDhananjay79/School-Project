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

    // Admission Form Logic
    const gradeSelect = document.getElementById('gradeSelect');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const mobileInput = document.getElementById('mobileInput');
    const downloadBrochureBtn = document.getElementById('downloadBrochureBtn'); // New ID required in HTML

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

        // Allow only numbers in mobile input and limit to 10 digits
        mobileInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });

        // State to track submission
        let isFormSubmitted = false;

        // Helper function to validate form
        function isFormValid() {
            const grade = gradeSelect.value;
            const firstName = firstNameInput.value;
            const lastName = lastNameInput.value;
            const mobile = mobileInput.value;
            const email = document.querySelector('input[type="email"]').value;
            return grade && firstName && lastName && mobile && email;
        }

        // Handle "Download Brochure" Click
        if (downloadBrochureBtn) {
            downloadBrochureBtn.addEventListener('click', (e) => {
                if (!isFormSubmitted) {
                    e.preventDefault(); // Stop download
                    if (isFormValid()) {
                        alert('Please click "Send Enquiry" to submit your details first.');
                    } else {
                        alert('Please fill and submit the form to view the brochure');
                    }
                }
                // If isFormSubmitted is true, allow download
            });
        }

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

                // ----------------------------------------------------
                // 1. Send Data to Google Sheets (The "Online Excel")
                // ----------------------------------------------------
                const scriptURL = 'https://script.google.com/macros/s/AKfycbzLsLL3prpT2X3v8NmEw7NFkqSdagSuewX17T3BVZrubITGpH-DflLuigu0nHrJDiSb/exec';

                // Prepare data for Google Sheets (Keys must match Headers in Sheet)
                const formData = new FormData();
                formData.append('Student Name', `${firstName} ${lastName}`);
                formData.append('Grade', grade);
                formData.append('Mobile', mobile);
                formData.append('Email', email);

                // Send to Google Sheets
                // console.log("Sending enquiry...");
                fetch(scriptURL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors' // Important for mobile/cross-origin
                })
                    .then(() => {
                        // With no-cors, we get an opaque response, so we assume success
                        console.log('Request sent (no-cors)');

                        // Mark as submitted
                        isFormSubmitted = true;

                        // Notify user
                        alert("Thank you! Your enquiry has been sent. You can now view the brochure.");

                        // CELEBRATION!
                        createConfettiExplosion();
                    })
                    .catch(error => {
                        console.error('Error!', error.message);
                        createConfettiExplosion(); // Show anyway for UX
                        alert("There was an error sending your enquiry, but it may have been recorded. Please check your connection.");
                    });

                // Auto-download REMOVED as requested.
            });
        }
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
    // Drag to Scroll for Events Section
    const slider = document.querySelector('.events-scroll');
    if (slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed
            slider.scrollLeft = scrollLeft - walk;
        });

        // Mouse wheel horizontal scroll
        slider.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
            }
        });

        // Set initial cursor
        slider.style.cursor = 'grab';
    }

    // Space Loader & Star Generation
    const spaceLoader = document.getElementById('space-loader');
    const starsGen = document.getElementById('stars-gen');

    if (starsGen) {
        // Generate random stars
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star-dot';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.opacity = Math.random();
            starsGen.appendChild(star);
        }
    }

    // Fade out loader after content is ready
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (spaceLoader) {
                spaceLoader.classList.add('fade-out');
            }
        }, 2000); // Show for at least 2 seconds for impact
    });

    // Carousel Logic for Gallery Page
    const carousels = document.querySelectorAll('[data-carousel]');

    carousels.forEach(carousel => {
        const main = carousel.querySelector('.carousel-main');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.carousel-nav.prev');
        const nextBtn = carousel.querySelector('.carousel-nav.next');
        const indicators = carousel.querySelectorAll('.indicator');

        let currentIndex = 0;
        const totalSlides = slides.length;

        // --- Touch/Swipe Support ---
        let touchStartX = 0;
        let touchEndX = 0;

        main.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        main.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchStartX - touchEndX > swipeThreshold) {
                showNext(); // Swipe Left
            } else if (touchEndX - touchStartX > swipeThreshold) {
                showPrev(); // Swipe Right
            }
        }
        // ---------------------------

        function updateCarousel() {
            // Update positioning
            main.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update active states
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentIndex);
            });

            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }

        function showNext() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        }

        function showPrev() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }

        if (nextBtn) nextBtn.addEventListener('click', showNext);
        if (prevBtn) prevBtn.addEventListener('click', showPrev);

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
            });
        });

        // Auto-play (optional, keeps it alive)
        let interval = setInterval(showNext, 5000);
        carousel.addEventListener('mouseenter', () => clearInterval(interval));
        carousel.addEventListener('mouseleave', () => interval = setInterval(showNext, 5000));

        // Pause auto-play on touch
        carousel.addEventListener('touchstart', () => clearInterval(interval));
    });

    // Deep link smooth scroll (Gallery Page)
    if (window.location.hash) {
        setTimeout(() => {
            const element = document.querySelector(window.location.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    // "Send Enquiry" Bounce Effect
    const sendEnquiryBtn = document.querySelector('.btn-submit');
    if (sendEnquiryBtn) {
        sendEnquiryBtn.addEventListener('click', () => {
            // Add bounce class
            sendEnquiryBtn.classList.add('btn-bounce');
            // Remove after animation completes to allow re-triggering
            setTimeout(() => {
                sendEnquiryBtn.classList.remove('btn-bounce');
            }, 600);
        });
    }

    // Events Section Navigation Logic
    const eventsScroll = document.querySelector('.events-scroll');
    const prevEventBtn = document.querySelector('.events-nav-btn.prev');
    const nextEventBtn = document.querySelector('.events-nav-btn.next');

    if (eventsScroll && prevEventBtn && nextEventBtn) {
        const checkScroll = () => {
            const maxScroll = eventsScroll.scrollWidth - eventsScroll.clientWidth;
            prevEventBtn.disabled = eventsScroll.scrollLeft <= 5; // Tolerance
            nextEventBtn.disabled = eventsScroll.scrollLeft >= maxScroll - 5;
        };

        const scrollAmount = 350; // Card + gap

        prevEventBtn.addEventListener('click', () => {
            eventsScroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 500); // Wait for scroll animation
        });

        nextEventBtn.addEventListener('click', () => {
            eventsScroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 500);
        });

        eventsScroll.addEventListener('scroll', () => {
            // Debounce for performance
            clearTimeout(eventsScroll.scrollTimer);
            eventsScroll.scrollTimer = setTimeout(checkScroll, 100);
        });

        // Initialize button state
        checkScroll();
    }

    // Keep last hovered event card active
    const eventCards = document.querySelectorAll('.event-card');
    if (eventCards.length > 0) {
        eventCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Remove active class from all
                eventCards.forEach(c => c.classList.remove('force-active'));
                // Add to current
                card.classList.add('force-active');
            });
        });
    }

    // Clone Notification Bar Content for Seamless Loop
    const notificationContent = document.querySelector('.notification-content');
    if (notificationContent) {
        const originalContent = notificationContent.innerHTML;
        notificationContent.innerHTML = originalContent + originalContent; // Duplicate once
    }

    // Remove Train Transition Overlay after animation
    const trainOverlay = document.querySelector('.train-transition-overlay');
    if (trainOverlay) {
        setTimeout(() => { trainOverlay.classList.add('reveal-complete'); }, 500);
        setTimeout(() => { trainOverlay.style.display = 'none'; }, 3000);
    }
});

// Realistic Ribbon & Powder Celebration
function createConfettiExplosion() {
    const heroSection = document.body;
    if (!heroSection) return;

    const colors = ['#FF6F61', '#feca0b', '#6B109C', '#4a90e2', '#7ed321', '#00d2d3'];
    const container = document.createElement('div');
    container.classList.add('confetti-container');
    heroSection.appendChild(container);

    // Ribbons
    for (let i = 0; i < 80; i++) {
        const ribbon = document.createElement('div');
        ribbon.classList.add('confetti-ribbon');
        ribbon.style.left = (50 + (Math.random() - 0.5) * 50) + '%';
        ribbon.style.top = '50%';
        ribbon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const tx = (Math.random() - 0.5) * 200 + 'vw';
        const ty = (Math.random() - 0.5) * 100 + 'vh';
        ribbon.style.setProperty('--tx', tx);
        ribbon.style.setProperty('--ty', ty);

        // Slower animation (8s+ range for extra gravity feel)
        ribbon.style.animation = `ribbonBlast ${8 + Math.random() * 6}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`;
        container.appendChild(ribbon);
    }

    // Powder/Particles
    for (let i = 0; i < 150; i++) {
        const powder = document.createElement('div');
        powder.classList.add('confetti-powder');
        powder.style.left = '50%';
        powder.style.top = '50%';
        powder.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * Math.PI * 2;
        const velocity = 200 + Math.random() * 300;
        const tx = Math.cos(angle) * velocity + 'px';
        const ty = Math.sin(angle) * velocity + 'px';

        powder.style.setProperty('--tx', tx);
        powder.style.setProperty('--ty', ty);

        powder.style.animation = `powderBlast ${1 + Math.random()}s ease-out forwards`;
        container.appendChild(powder);
    }

    // Cleanup
    setTimeout(() => {
        container.remove();
    }, 15000); // Extended cleanup for very slow ribbons
}
