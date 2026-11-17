/**
 * Stealth Admin Mode for Happy English Medium School Gallery
 * Secret trigger: 5 rapid clicks on the invisible trigger next to "Moments of Joy"
 * Provides a 10-minute session to upload new photos and delete older photos.
 */

(function () {
    const TRIGGER_ID = 'secretAdminTrigger';
    const SESSION_KEY = 'hemy_admin_session';

    let adminToken = null;
    let timerInterval = null;
    let galleryItems = [];

    // DOM Elements
    const triggerEl = document.getElementById(TRIGGER_ID);
    const adminToolbar = document.getElementById('adminToolbar');
    const adminTimer = document.getElementById('adminTimer');
    const openUploadBtn = document.getElementById('openUploadBtn');
    const openChangePinBtn = document.getElementById('openChangePinBtn');
    const exitAdminBtn = document.getElementById('exitAdminBtn');

    // PIN Modal Elements
    const pinModal = document.getElementById('adminPinModal');
    const pinInput = document.getElementById('adminPinInput');
    const pinFeedback = document.getElementById('pinModalFeedback');
    const pinSubmitBtn = document.getElementById('pinSubmitBtn');
    const pinCancelBtn = document.getElementById('pinCancelBtn');

    // Upload Modal Elements
    const uploadModal = document.getElementById('adminUploadModal');
    const uploadForm = document.getElementById('adminUploadForm');
    const uploadCategory = document.getElementById('uploadCategory');
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadFile = document.getElementById('uploadFile');
    const uploadPreviewWrap = document.getElementById('uploadPreviewWrap');
    const uploadPreviewImg = document.getElementById('uploadPreviewImg');
    const uploadFeedback = document.getElementById('uploadFeedback');
    const submitUploadBtn = document.getElementById('submitUploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');

    // Change PIN Modal Elements
    const changePinModal = document.getElementById('adminChangePinModal');
    const currPinField = document.getElementById('currPinField');
    const newPinField = document.getElementById('newPinField');
    const confirmPinField = document.getElementById('confirmPinField');
    const changePinFeedback = document.getElementById('changePinFeedback');
    const submitChangePinBtn = document.getElementById('submitChangePinBtn');
    const cancelChangePinBtn = document.getElementById('cancelChangePinBtn');

    const mainGalleryGrid = document.getElementById('mainGalleryGrid');

    // ── 1. Fetch & Render Gallery Dynamic Items ────────────────────────
    async function loadGallery() {
        try {
            const res = await fetch('/api/gallery/items');
            if (res.ok) {
                const data = await res.json();
                if (data.items && Array.isArray(data.items)) {
                    galleryItems = data.items;
                    renderGalleryGrid(galleryItems);
                    updateCategoryCounts(galleryItems);
                }
            }
        } catch (err) {
            console.log('Serving offline gallery cards:', err);
        }
    }

    function getActiveCategory() {
        const activePill = document.querySelector('.filter-pill.active');
        return activePill ? activePill.getAttribute('data-category') : 'all';
    }

    function renderGalleryGrid(items) {
        if (!mainGalleryGrid) return;
        const isAdmin = !!adminToken;
        const currentCategory = getActiveCategory();

        mainGalleryGrid.innerHTML = items.map(item => {
            const isVisible = (currentCategory === 'all' || item.category === currentCategory);
            return `
            <div class="gallery-card" data-category="${item.category}" data-id="${item.id}" style="display: ${isVisible ? 'block' : 'none'};">
                ${isAdmin ? `<button type="button" class="card-delete-btn" data-id="${item.id}" title="Delete Photo" aria-label="Delete Photo">🗑️</button>` : ''}
                <span class="gallery-card-badge">${item.badge || 'School Event'}</span>
                <img src="${item.src}" alt="${item.alt || item.title}" loading="lazy" decoding="async">
                <div class="gallery-card-overlay"><span class="gallery-card-title">${item.title}</span></div>
            </div>
            `;
        }).join('');

        // Re-attach card click listeners for Lightbox & Delete
        attachCardListeners();
    }

    function attachCardListeners() {
        const cards = document.querySelectorAll('.gallery-card');
        const lightbox = document.getElementById('galleryLightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxCaption = document.getElementById('lightboxCaption');

        cards.forEach((card, index) => {
            // Delete button handler
            const delBtn = card.querySelector('.card-delete-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const photoId = delBtn.getAttribute('data-id');
                    const title = card.querySelector('.gallery-card-title')?.textContent || 'this photo';
                    confirmAndDeletePhoto(photoId, title);
                });
            }

            // Lightbox viewer
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-delete-btn')) return;
                const img = card.querySelector('img');
                const title = card.querySelector('.gallery-card-title');
                if (lightbox && lightboxImg && img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                    if (lightboxCaption) lightboxCaption.textContent = title ? title.textContent : '';
                    lightbox.classList.add('active');
                    lightbox.setAttribute('aria-hidden', 'false');
                }
            });
        });
    }

    function updateCategoryCounts(items) {
        const counts = {
            all: items.length,
            cultural: 0,
            sports: 0,
            bubbles: 0,
            traditions: 0,
            mini: 0
        };

        items.forEach(item => {
            if (counts[item.category] !== undefined) {
                counts[item.category]++;
            }
        });

        const pillMap = {
            all: `✨ All Photos (${counts.all})`,
            cultural: `🎭 Cultural Fest (${counts.cultural})`,
            sports: `🏆 Sports Meet (${counts.sports})`,
            bubbles: `🔬 Brainy Bubbles (${counts.bubbles})`,
            traditions: `🎨 Tiny Traditions (${counts.traditions})`,
            mini: `🧩 Mini Activities (${counts.mini})`
        };

        document.querySelectorAll('.filter-pill').forEach(pill => {
            const cat = pill.getAttribute('data-category');
            if (pillMap[cat]) {
                pill.textContent = pillMap[cat];
            }
            // Bind click to filter cards
            if (!pill.dataset.adminBound) {
                pill.dataset.adminBound = 'true';
                pill.addEventListener('click', () => {
                    const selectedCat = pill.getAttribute('data-category');
                    document.querySelectorAll('.gallery-card').forEach(card => {
                        const cardCat = card.getAttribute('data-category');
                        if (selectedCat === 'all' || cardCat === selectedCat) {
                            card.style.display = 'block';
                            card.style.opacity = '1';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            }
        });
    }

    // ── 2. Secret 5-Tap Gesture Detection ──────────────────────────────
    let tapCount = 0;
    let lastTapTime = 0;

    if (triggerEl) {
        triggerEl.addEventListener('click', (e) => {
            e.preventDefault();
            const now = Date.now();
            if (now - lastTapTime > 3000) {
                tapCount = 0;
            }
            lastTapTime = now;
            tapCount++;

            if (tapCount === 5) {
                tapCount = 0;
                openPinModal();
            }
        });
    }

    // ── 3. PIN Verification & Lockout ──────────────────────────────────
    function openPinModal() {
        if (adminToken) {
            alert('Admin Mode is already active!');
            return;
        }
        if (pinFeedback) {
            pinFeedback.textContent = '';
            pinFeedback.className = 'admin-modal-feedback';
        }
        if (pinInput) {
            pinInput.value = '';
            setTimeout(() => pinInput.focus(), 150);
        }
        if (pinModal) pinModal.classList.add('active');
    }

    function closePinModal() {
        if (pinModal) pinModal.classList.remove('active');
    }

    if (pinCancelBtn) pinCancelBtn.addEventListener('click', closePinModal);

    if (pinInput) {
        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitPin();
        });
    }

    if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', submitPin);

    async function submitPin() {
        const pin = pinInput.value.trim();
        if (!pin) {
            showFeedback(pinFeedback, 'Please enter your PIN.', 'error');
            return;
        }

        pinSubmitBtn.disabled = true;
        pinSubmitBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/gallery/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                closePinModal();
                startAdminSession(data.token, data.expires_in || 600);
            } else {
                showFeedback(pinFeedback, data.message || 'Incorrect PIN.', 'error');
            }
        } catch (err) {
            showFeedback(pinFeedback, 'Connection error. Please try again.', 'error');
        } finally {
            pinSubmitBtn.disabled = false;
            pinSubmitBtn.textContent = 'Unlock';
        }
    }

    // ── 4. 10-Minute Admin Session & Countdown ─────────────────────────
    function startAdminSession(token, expiresInSeconds) {
        adminToken = token;
        const expiryTime = Date.now() + (expiresInSeconds * 1000);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiryTime }));

        document.body.classList.add('admin-mode-active');
        if (adminToolbar) adminToolbar.style.display = 'flex';

        // Re-render gallery grid to expose delete buttons
        renderGalleryGrid(galleryItems);

        // Start 10-minute timer
        if (timerInterval) clearInterval(timerInterval);
        updateTimerDisplay(expiryTime);
        timerInterval = setInterval(() => {
            const rem = expiryTime - Date.now();
            if (rem <= 0) {
                exitAdminMode(true);
            } else {
                updateTimerDisplay(expiryTime);
            }
        }, 1000);
    }

    function updateTimerDisplay(expiryTime) {
        const remainingMs = Math.max(0, expiryTime - Date.now());
        const totalSec = Math.floor(remainingMs / 1000);
        const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        if (adminTimer) adminTimer.textContent = `⏱️ ${mins}:${secs}`;
    }

    function exitAdminMode(isExpired = false) {
        adminToken = null;
        sessionStorage.removeItem(SESSION_KEY);
        if (timerInterval) clearInterval(timerInterval);

        document.body.classList.remove('admin-mode-active');
        if (adminToolbar) adminToolbar.style.display = 'none';

        renderGalleryGrid(galleryItems);

        if (isExpired) {
            alert('🔒 10-minute Admin session has expired. Admin mode locked.');
        }
    }

    if (exitAdminBtn) {
        exitAdminBtn.addEventListener('click', () => {
            if (confirm('Exit Admin Mode now?')) {
                exitAdminMode(false);
            }
        });
    }

    // Check existing session on page load
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
        try {
            const parsed = JSON.parse(savedSession);
            const remSeconds = Math.floor((parsed.expiryTime - Date.now()) / 1000);
            if (remSeconds > 0 && parsed.token) {
                startAdminSession(parsed.token, remSeconds);
            } else {
                sessionStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }

    // ── 5. Photo Upload Modal & Flow ───────────────────────────────────
    if (openUploadBtn) {
        openUploadBtn.addEventListener('click', () => {
            if (uploadFeedback) uploadFeedback.textContent = '';
            if (uploadTitle) uploadTitle.value = '';
            if (uploadFile) uploadFile.value = '';
            if (uploadPreviewWrap) uploadPreviewWrap.style.display = 'none';
            if (uploadModal) uploadModal.classList.add('active');
        });
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            if (uploadModal) uploadModal.classList.remove('active');
        });
    }

    // Image preview on file selection
    if (uploadFile) {
        uploadFile.addEventListener('change', () => {
            const file = uploadFile.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (uploadPreviewImg) uploadPreviewImg.src = e.target.result;
                    if (uploadPreviewWrap) uploadPreviewWrap.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (submitUploadBtn) {
        submitUploadBtn.addEventListener('click', async () => {
            const file = uploadFile.files[0];
            const category = uploadCategory.value;
            const title = uploadTitle.value.trim();

            if (!file) {
                showFeedback(uploadFeedback, 'Please select an image to upload.', 'error');
                return;
            }
            if (!title) {
                showFeedback(uploadFeedback, 'Please enter a caption/title for the photo.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            formData.append('title', title);
            formData.append('token', adminToken);

            submitUploadBtn.disabled = true;
            submitUploadBtn.textContent = 'Uploading...';

            try {
                const res = await fetch('/api/gallery/upload', {
                    method: 'POST',
                    headers: { 'X-Admin-Token': adminToken },
                    body: formData
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showFeedback(uploadFeedback, '🎉 Photo published successfully!', 'success');
                    setTimeout(() => {
                        if (uploadModal) uploadModal.classList.remove('active');
                        // Add newly uploaded item to list
                        galleryItems.unshift(data.item);
                        renderGalleryGrid(galleryItems);
                        updateCategoryCounts(galleryItems);
                    }, 800);
                } else {
                    showFeedback(uploadFeedback, data.message || 'Upload failed.', 'error');
                }
            } catch (err) {
                showFeedback(uploadFeedback, 'Upload error. Please try again.', 'error');
            } finally {
                submitUploadBtn.disabled = false;
                submitUploadBtn.textContent = 'Upload & Publish';
            }
        });
    }

    // ── 6. Photo Delete Flow ───────────────────────────────────────────
    async function confirmAndDeletePhoto(photoId, photoTitle) {
        if (!confirm(`Are you sure you want to delete "${photoTitle}"?\n\nThis photo will be removed from the school gallery.`)) {
            return;
        }

        try {
            const res = await fetch('/api/gallery/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify({ id: photoId, token: adminToken })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Remove from local list
                galleryItems = galleryItems.filter(item => item.id !== photoId);
                const cardEl = document.querySelector(`.gallery-card[data-id="${photoId}"]`);
                if (cardEl) {
                    cardEl.style.transition = 'all 0.35s ease';
                    cardEl.style.transform = 'scale(0.8)';
                    cardEl.style.opacity = '0';
                    setTimeout(() => {
                        cardEl.remove();
                        updateCategoryCounts(galleryItems);
                    }, 350);
                } else {
                    renderGalleryGrid(galleryItems);
                    updateCategoryCounts(galleryItems);
                }
            } else {
                alert('Delete failed: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Network error while deleting photo.');
        }
    }

    // ── 7. Change PIN Flow ─────────────────────────────────────────────
    if (openChangePinBtn) {
        openChangePinBtn.addEventListener('click', () => {
            if (changePinFeedback) changePinFeedback.textContent = '';
            if (currPinField) currPinField.value = '';
            if (newPinField) newPinField.value = '';
            if (confirmPinField) confirmPinField.value = '';
            if (changePinModal) changePinModal.classList.add('active');
        });
    }

    if (cancelChangePinBtn) {
        cancelChangePinBtn.addEventListener('click', () => {
            if (changePinModal) changePinModal.classList.remove('active');
        });
    }

    if (submitChangePinBtn) {
        submitChangePinBtn.addEventListener('click', async () => {
            const current_pin = currPinField.value.trim();
            const new_pin = newPinField.value.trim();
            const confirm_pin = confirmPinField.value.trim();

            if (!current_pin) {
                showFeedback(changePinFeedback, 'Please enter your current PIN.', 'error');
                return;
            }
            if (new_pin.length < 4) {
                showFeedback(changePinFeedback, 'New PIN must be at least 4 digits.', 'error');
                return;
            }
            if (new_pin !== confirm_pin) {
                showFeedback(changePinFeedback, 'New PIN and Confirm PIN do not match.', 'error');
                return;
            }

            submitChangePinBtn.disabled = true;
            submitChangePinBtn.textContent = 'Updating...';

            try {
                const res = await fetch('/api/gallery/change-pin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken
                    },
                    body: JSON.stringify({ current_pin, new_pin })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showFeedback(changePinFeedback, '✅ PIN updated successfully!', 'success');
                    setTimeout(() => {
                        if (changePinModal) changePinModal.classList.remove('active');
                    }, 1200);
                } else {
                    showFeedback(changePinFeedback, data.message || 'Update failed.', 'error');
                }
            } catch (err) {
                showFeedback(changePinFeedback, 'Connection error.', 'error');
            } finally {
                submitChangePinBtn.disabled = false;
                submitChangePinBtn.textContent = 'Save New PIN';
            }
        });
    }

    // ── 8. Admission Year & Site Settings Flow ─────────────────────────
    const openYearModalBtn = document.getElementById('openYearModalBtn');
    const yearModal = document.getElementById('adminYearModal');
    const admissionYearInput = document.getElementById('admissionYearInput');
    const statusOpen = document.getElementById('statusOpen');
    const statusClosed = document.getElementById('statusClosed');
    const copyrightYearInput = document.getElementById('copyrightYearInput');
    const yearModalFeedback = document.getElementById('yearModalFeedback');
    const submitYearBtn = document.getElementById('submitYearBtn');
    const cancelYearBtn = document.getElementById('cancelYearBtn');

    if (openYearModalBtn) {
        openYearModalBtn.addEventListener('click', async () => {
            if (yearModalFeedback) yearModalFeedback.textContent = '';
            try {
                const res = await fetch('/api/site-config');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.config) {
                        if (admissionYearInput) admissionYearInput.value = data.config.admission_year || '2027-28';
                        if (copyrightYearInput) copyrightYearInput.value = data.config.copyright_year || '2026';
                        if (data.config.is_admission_open) {
                            if (statusOpen) statusOpen.checked = true;
                        } else {
                            if (statusClosed) statusClosed.checked = true;
                        }
                    }
                }
            } catch (err) {
                if (admissionYearInput) admissionYearInput.value = '2027-28';
            }
            if (yearModal) yearModal.classList.add('active');
        });
    }

    if (cancelYearBtn) {
        cancelYearBtn.addEventListener('click', () => {
            if (yearModal) yearModal.classList.remove('active');
        });
    }

    if (submitYearBtn) {
        submitYearBtn.addEventListener('click', async () => {
            const admission_year = admissionYearInput.value.trim();
            const is_admission_open = statusOpen ? statusOpen.checked : true;
            const copyright_year = copyrightYearInput.value.trim();

            if (!admission_year) {
                showFeedback(yearModalFeedback, 'Please enter the admission year (e.g. 2028-29).', 'error');
                return;
            }

            submitYearBtn.disabled = true;
            submitYearBtn.textContent = 'Saving...';

            try {
                const res = await fetch('/api/site-config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken
                    },
                    body: JSON.stringify({
                        admission_year,
                        is_admission_open,
                        copyright_year
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showFeedback(yearModalFeedback, '🎉 Academic year updated successfully!', 'success');
                    
                    // Immediately update ticker on the current page
                    const statusText = is_admission_open
                        ? `ADMISSIONS OPEN FOR ${admission_year} — TAP TO ENQUIRE 👆`
                        : `ADMISSIONS FOR ${admission_year} CLOSED — ENQUIRE FOR NEXT SESSION 👆`;
                    document.querySelectorAll('.notification-text').forEach(el => {
                        el.textContent = statusText;
                    });

                    setTimeout(() => {
                        if (yearModal) yearModal.classList.remove('active');
                    }, 1000);
                } else {
                    showFeedback(yearModalFeedback, data.message || 'Save failed.', 'error');
                }
            } catch (err) {
                showFeedback(yearModalFeedback, 'Connection error.', 'error');
            } finally {
                submitYearBtn.disabled = false;
                submitYearBtn.textContent = 'Save Year Changes';
            }
        });
    }

    function showFeedback(el, msg, type) {
        if (!el) return;
        el.textContent = msg;
        el.className = `admin-modal-feedback ${type}`;
    }

    // Initial load
    loadGallery();
})();
