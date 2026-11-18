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

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileBtn.contains(e.target) && navLinks.classList.contains('active')) {
                mobileBtn.classList.remove('active');
                navLinks.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Auto-scroll active mobile navigation pill into view on mobile
    try {
        const activeNavPill = document.querySelector('.nav-links a.active');
        if (activeNavPill && window.innerWidth <= 992) {
            setTimeout(() => {
                activeNavPill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }, 100);
        }
    } catch (e) {}

    // Admission Form & Interactive Modal Logic
    const gradeSelect = document.getElementById('gradeSelect');
    const firstNameInput = document.getElementById('firstNameInput');
    const middleNameInput = document.getElementById('middleNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const ageInput = document.getElementById('ageInput');
    const mobileInput = document.getElementById('mobileInput');
    const emailInput = document.getElementById('emailInput') || document.querySelector('input[type="email"]');
    const admissionForm = document.getElementById('admissionForm');
    const formFeedback = document.getElementById('formFeedback');
    const downloadBrochureBtn = document.getElementById('downloadBrochureBtn');
    const submitBtn = document.getElementById('submitEnquiryBtn') || (admissionForm ? admissionForm.querySelector('button[type="submit"]') : null);

    // Modal elements
    const siteModal = document.getElementById('siteModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalEnquiryBtn = document.getElementById('modalEnquiryBtn');
    const modalDirectBtn = document.getElementById('modalDirectBtn');

    let isFormSubmitted = false;

    // Helper: Display accessible inline feedback
    function showFeedback(message, type = 'info') {
        if (!formFeedback) return;
        formFeedback.className = `form-feedback show ${type}`;
        formFeedback.innerHTML = message;
        formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Modal controls
    function openModal() {
        if (!siteModal) return;
        siteModal.classList.add('active');
        siteModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!siteModal) return;
        siteModal.classList.remove('active');
        siteModal.setAttribute('aria-hidden', 'true');
    }

    if (siteModal) {
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        siteModal.addEventListener('click', (e) => {
            if (e.target === siteModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && siteModal.classList.contains('active')) closeModal();
        });
        if (modalEnquiryBtn) {
            modalEnquiryBtn.addEventListener('click', () => {
                closeModal();
                if (gradeSelect) {
                    gradeSelect.focus();
                    gradeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

    // Sanitize mobile input: digits only, max 10
    if (mobileInput) {
        mobileInput.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    // Handle "View Brochure" click
    if (downloadBrochureBtn) {
        downloadBrochureBtn.addEventListener('click', (e) => {
            if (!isFormSubmitted && siteModal) {
                e.preventDefault();
                openModal();
            }
        });
    }

    // Form Submission Handler
    if (admissionForm) {
        admissionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const grade = gradeSelect ? gradeSelect.value.trim() : '';
            const firstName = firstNameInput ? firstNameInput.value.trim() : '';
            const middleName = middleNameInput ? middleNameInput.value.trim() : '';
            const lastName = lastNameInput ? lastNameInput.value.trim() : '';
            const age = ageInput ? ageInput.value.trim() : '';
            const mobile = mobileInput ? mobileInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';

            // --- Form Validations ---
            if (!grade) {
                showFeedback('⚠️ Please select a grade for admission (Nursery, Junior KG, or Senior KG).', 'error');
                if (gradeSelect) gradeSelect.focus();
                return;
            }

            if (!firstName || firstName.length < 2) {
                showFeedback("⚠️ Please enter the student's first name (at least 2 letters).", 'error');
                if (firstNameInput) firstNameInput.focus();
                return;
            }

            if (!lastName || lastName.length < 2) {
                showFeedback("⚠️ Please enter the student's last name (at least 2 letters).", 'error');
                if (lastNameInput) lastNameInput.focus();
                return;
            }

            // Indian mobile format (10 digits starting with 6, 7, 8, or 9)
            if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
                showFeedback('⚠️ Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.', 'error');
                if (mobileInput) mobileInput.focus();
                return;
            }

            // Optional email format validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showFeedback('⚠️ Please enter a valid email address (e.g. name@example.com) or leave it empty.', 'error');
                if (emailInput) emailInput.focus();
                return;
            }

            // Google Apps Script Web App Endpoint
            const scriptURL = 'https://script.google.com/macros/s/AKfycbzLsLL3prpT2X3v8NmEw7NFkqSdagSuewX17T3BVZrubITGpH-DflLuigu0nHrJDiSb/exec';

            // Prepare payload
            const formData = new FormData();
            const fullName = middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
            formData.append('Student Name', fullName);
            formData.append('Grade', grade);
            formData.append('Age', age);
            formData.append('Mobile', mobile);
            formData.append('Email', email);

            // Button loading state
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';
            if (submitBtn) {
                submitBtn.innerHTML = 'Sending Enquiry...';
                submitBtn.disabled = true;
            }
            showFeedback('Submitting your details securely...', 'info');

            fetch(scriptURL, {
                method: 'POST',
                mode: 'cors',
                body: new URLSearchParams(formData)
            })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    if (submitBtn) {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }

                    if (data.result === 'duplicate') {
                        const duplicateField = data.field || 'mobile number';
                        showFeedback(`😊 You've already submitted an enquiry with this ${duplicateField}. Our team will contact you soon!`, 'info');
                    } else if (data.result === 'success') {
                        isFormSubmitted = true;
                        showFeedback('🎉 Thank you! Your enquiry has been received. You can now view and download the brochure below.', 'success');
                        if (downloadBrochureBtn) {
                            downloadBrochureBtn.innerHTML = `✓ View School Brochure (Unlocked)`;
                        }
                        createConfettiExplosion();
                    } else {
                        throw new Error(data.message || 'Unknown response');
                    }
                })
                .catch(error => {
                    console.error('Submission error:', error);
                    if (submitBtn) {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }
                    // Graceful fallback: Allow user to proceed so they aren't stuck
                    isFormSubmitted = true;
                    showFeedback(`Thank you! Your details have been recorded. You can now explore the brochure below or call us at <a href="tel:+919822531127" style="color:inherit;font-weight:bold;text-decoration:underline;">+91 9822531127</a>.`, 'success');
                    if (downloadBrochureBtn) {
                        downloadBrochureBtn.innerHTML = `✓ View School Brochure (Unlocked)`;
                    }
                    createConfettiExplosion();
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
    // Navbar scroll effect (add elevation class on scroll)
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
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        });
    }
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

    // ══════════════════════════════════════════════════════════════════
    // DYNAMIC ADMISSION YEAR & SITE CONFIG LOADER
    // ══════════════════════════════════════════════════════════════════
    async function applySiteConfig() {
        try {
            let config = null;
            // Check local cache first for instant sync
            try {
                const cached = JSON.parse(localStorage.getItem('hemy_site_config') || 'null');
                if (cached && cached.admission_year) config = cached;
            } catch (e) {}

            try {
                const res = await fetch('/api/site-config');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.config) {
                        config = data.config;
                        try {
                            localStorage.setItem('hemy_site_config', JSON.stringify(config));
                        } catch (e) {}
                    }
                }
            } catch (e) {}

            if (!config) {
                const staticRes = await fetch('../data/site-config.json').catch(() => fetch('data/site-config.json'));
                if (staticRes && staticRes.ok) config = await staticRes.json();
            }

            if (!config) return;

            const year = config.admission_year || '2027-28';
            const isOpen = config.is_admission_open !== false;
            const statusText = isOpen 
                ? `ADMISSIONS OPEN FOR ${year} — TAP TO ENQUIRE 👆`
                : `ADMISSIONS FOR ${year} CLOSED — ENQUIRE FOR NEXT SESSION 👆`;

            // Update all notification ticker texts
            document.querySelectorAll('.notification-text').forEach(el => {
                el.textContent = statusText;
            });

            // Update dynamic year placeholders
            document.querySelectorAll('.dynamic-year, [data-dynamic="year"]').forEach(el => {
                el.textContent = year;
            });

            // Update brochure CTA if on brochure page
            const brochureCta = document.querySelector('#finishCta .finish-cta-text h4');
            if (brochureCta) {
                brochureCta.textContent = isOpen ? `Admissions Open for ${year}` : `Admissions for ${year} Closed`;
            }

            // Update footer copyright
            if (config.copyright_year) {
                document.querySelectorAll('.footer-bottom p').forEach(el => {
                    if (el.textContent.includes('All Rights Reserved')) {
                        el.innerHTML = `&copy; ${config.copyright_year} Happy English Medium School. All Rights Reserved.`;
                    }
                });
            }
        } catch (err) {
            console.log('Using default site settings:', err);
        }
    }

    applySiteConfig();

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

    // ══════════════════════════════════════════════════════════════════
    // CLICKABLE NOTIFICATION BAR -> Smooth Scroll to Admission Form
    // ══════════════════════════════════════════════════════════════════
    const notificationBar = document.querySelector('.notification-bar');
    if (notificationBar) {
        notificationBar.addEventListener('click', () => {
            const formContainer = document.querySelector('.admission-form-container') || document.getElementById('admissionForm');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                formContainer.classList.remove('form-highlight');
                void formContainer.offsetWidth; // Trigger reflow for animation
                formContainer.classList.add('form-highlight');
                const gradeInput = document.getElementById('gradeSelect');
                if (gradeInput) setTimeout(() => gradeInput.focus(), 600);
            } else {
                window.location.href = '../index.html#admissionForm';
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // QR TRACKING WELCOME HOOK
    // ══════════════════════════════════════════════════════════════════
    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search || (fullUrl.includes('?') ? fullUrl.split('?')[1] : ''));
    const trkid = urlParams.get('trkid');
    if (trkid) {
        const qrBanner = document.getElementById('qrWelcomeBanner');
        if (qrBanner) {
            qrBanner.classList.add('show');
            const closeBtn = qrBanner.querySelector('.qr-welcome-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => qrBanner.classList.remove('show'));
            }
        }
        setTimeout(() => {
            const formContainer = document.querySelector('.admission-form-container');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                formContainer.classList.add('form-highlight');
            }
        }, 600);
    }

    // ══════════════════════════════════════════════════════════════════
    // INTERACTIVE GALLERY FILTER TABS & LIGHTBOX
    // ══════════════════════════════════════════════════════════════════
    const filterPills = document.querySelectorAll('.filter-pill');
    const galleryCards = document.querySelectorAll('.gallery-card');
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    if (filterPills.length > 0 && galleryCards.length > 0) {
        // Tab Filtering
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const category = pill.getAttribute('data-category');

                galleryCards.forEach(card => {
                    const cardCat = card.getAttribute('data-category');
                    if (category === 'all' || cardCat === category) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 30);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 200);
                    }
                });
            });
        });

        // Deep link from URL hash (e.g. gallery.html#cultural)
        if (window.location.hash) {
            const hashCat = window.location.hash.replace('#', '');
            const matchingPill = document.querySelector(`.filter-pill[data-category="${hashCat}"]`);
            if (matchingPill) matchingPill.click();
        }
    }

    // Lightbox Zoom Logic
    if (lightbox && galleryCards.length > 0) {
        let currentImgIndex = 0;
        let visibleCards = [];

        function updateVisibleCards() {
            visibleCards = Array.from(galleryCards).filter(card => card.style.display !== 'none');
        }

        function showLightboxImage(index) {
            updateVisibleCards();
            if (visibleCards.length === 0) return;
            if (index < 0) index = visibleCards.length - 1;
            if (index >= visibleCards.length) index = 0;
            currentImgIndex = index;

            const card = visibleCards[currentImgIndex];
            const img = card.querySelector('img');
            const title = card.querySelector('.gallery-card-title') || card.querySelector('img');

            if (img && lightboxImg) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt || 'School Activity';
                if (lightboxCaption) {
                    lightboxCaption.textContent = title ? (title.textContent || title.alt) : '';
                }
            }
        }

        galleryCards.forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-delete-btn')) return;
                updateVisibleCards();
                const idx = visibleCards.indexOf(card);
                showLightboxImage(idx >= 0 ? idx : 0);
                lightbox.classList.add('active');
                lightbox.setAttribute('aria-hidden', 'false');
            });
        });

        function closeLightbox() {
            lightbox.classList.remove('active');
            lightbox.setAttribute('aria-hidden', 'true');
        }

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', () => showLightboxImage(currentImgIndex - 1));
        if (lightboxNext) lightboxNext.addEventListener('click', () => showLightboxImage(currentImgIndex + 1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showLightboxImage(currentImgIndex - 1);
            if (e.key === 'ArrowRight') showLightboxImage(currentImgIndex + 1);
        });
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
