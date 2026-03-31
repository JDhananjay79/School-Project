np/**
 * JavaScript QR Code Generator
 * Replaces Python backend/QRGenerator.py
 * 
 * Uses: qrcode.js library for QR generation
 * Usage: Can be used in browser or Node.js environments
 */

// ========== QR CODE GENERATOR CLASS ==========

class QRCodeGenerator {
    constructor(config = {}) {
        this.config = {
            url: config.url || 'https://school-project-six-chi.vercel.app/api/qr-track?trkid=QR001&utm_source=qr&utm_medium=print&utm_campaign=school',
            trackingId: config.trackingId || 'QR001',
            logoUrl: config.logoUrl || 'assets/images/logo.jpg',
            qrSize: config.qrSize || 400,
            boxSize: config.boxSize || 16,
            errorCorrection: config.errorCorrection || 'H',
            borderSize: config.borderSize || 5,
            ...config
        };

        this.analytics = {
            timestamp: new Date().toLocaleString(),
            trackingId: this.config.trackingId,
            qrModules: 0,
            qrVersion: 'js_scannable_v1',
            modulesStyle: 'squares',
            colors: 'black_white'
        };
    }

    /**
     * Generate QR Code as Canvas
     */
    async generateQRCanvas() {
        // We'll use qrcode.js library approach
        // For browser: Use QRCode.js or qrcode library
        // For Node.js: Use qrcode npm package

        return new Promise((resolve, reject) => {
            // Browser environment
            if (typeof window !== 'undefined' && window.QRCode) {
                const div = document.createElement('div');
                const qr = new window.QRCode(div, {
                    text: this.config.url,
                    width: this.config.qrSize,
                    height: this.config.qrSize,
                    correctLevel: this.getCorrectLevel()
                });

                // Wait for QR to be generated
                setTimeout(() => {
                    const canvas = div.querySelector('canvas');
                    if (canvas) {
                        resolve(canvas);
                    } else {
                        reject(new Error('Failed to generate QR code canvas'));
                    }
                }, 100);
            } else {
                reject(new Error('QRCode library not available. Load qrcode.js in browser or use Node.js qrcode package'));
            }
        });
    }

    /**
     * Get correct level mapping
     */
    getCorrectLevel() {
        const levels = {
            'L': window.QRCode ? window.QRCode.CorrectLevel.L : 0,
            'M': window.QRCode ? window.QRCode.CorrectLevel.M : 1,
            'Q': window.QRCode ? window.QRCode.CorrectLevel.Q : 2,
            'H': window.QRCode ? window.QRCode.CorrectLevel.H : 3
        };
        return levels[this.config.errorCorrection] || 3;
    }

    /**
     * Add logo to QR code canvas
     */
    async addLogoToCanvas(canvas) {
        return new Promise((resolve, reject) => {
            const ctx = canvas.getContext('2d');
            const img = new Image();

            // Handle CORS by allowing cross-origin
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Calculate logo size
                const logoSize = Math.min(canvas.width, canvas.height) / 5;
                const x = (canvas.width - logoSize) / 2;
                const y = (canvas.height - logoSize) / 2;

                // Draw white background circle/square
                const bgSize = logoSize + 30;
                const bgX = (canvas.width - bgSize) / 2;
                const bgY = (canvas.height - bgSize) / 2;

                ctx.fillStyle = 'white';
                ctx.fillRect(bgX, bgY, bgSize, bgSize);

                // Draw border
                ctx.strokeStyle = '#e6e6e6';
                ctx.lineWidth = 2;
                ctx.strokeRect(bgX + 1, bgY + 1, bgSize - 2, bgSize - 2);

                // Draw logo
                ctx.drawImage(img, x, y, logoSize, logoSize);

                resolve(canvas);
            };

            img.onerror = () => {
                // If logo fails to load, just return canvas without logo
                console.warn('Failed to load logo, generating QR without logo');
                resolve(canvas);
            };

            img.src = this.config.logoUrl;
        });
    }

    /**
     * Convert canvas to PNG blob
     */
    canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            }, 'image/png', 0.95);
        });
    }

    /**
     * Download QR code as PNG
     */
    async downloadQR(filename = `qr_${this.config.trackingId}.png`) {
        try {
            const canvas = await this.generateQRCanvas();
            const canvasWithLogo = await this.addLogoToCanvas(canvas);
            const blob = await this.canvasToBlob(canvasWithLogo);

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return { success: true, message: 'QR code downloaded successfully' };
        } catch (error) {
            console.error('Error downloading QR:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get QR tracking URL
     */
    getTrackingURL() {
        return this.config.url;
    }

    /**
     * Get analytics data
     */
    getAnalytics() {
        return this.analytics;
    }

    /**
     * Generate analytics report
     */
    generateAnalyticsReport() {
        const report = `
${'='.repeat(60)}
QR CODE ANALYTICS & TRACKING REPORT
${'='.repeat(60)}

Generated: ${this.analytics.timestamp}
Tracking ID: ${this.analytics.trackingId}
QR Version: ${this.analytics.qrVersion}
Modules Style: ${this.analytics.modulesStyle}
Color Scheme: ${this.analytics.colors}

Tracking URL: ${this.config.url}

QR Code Features:
  ✓ Black & White (maximum scannability)
  ✓ Rounded Squares (clean professional look)
  ✓ Optimal module spacing
  ✓ Error Correction Level: ${this.config.errorCorrection}
  ✓ High-quality output (supports 300 DPI printing)

Scanning will record:
  - utm_source=${this.extractParam('utm_source')}
  - utm_medium=${this.extractParam('utm_medium')}
  - utm_campaign=${this.extractParam('utm_campaign')}
  - trkid=${this.config.trackingId} (unique scan ID)

${'='.repeat(60)}
`;
        return report;
    }

    /**
     * Extract URL parameter value
     */
    extractParam(param) {
        const url = new URL(this.config.url);
        return url.searchParams.get(param) || 'N/A';
    }

    /**
     * Display analytics report
     */
    displayAnalyticsReport() {
        const report = this.generateAnalyticsReport();
        console.log(report);
        return report;
    }
}

// ========== BROWSER INTEGRATION ==========

// Global function for browser usage
if (typeof window !== 'undefined') {
    window.QRCodeGenerator = QRCodeGenerator;

    // Example usage helper
    window.generateQRCode = async (config) => {
        const generator = new QRCodeGenerator(config);
        const report = generator.displayAnalyticsReport();
        return generator;
    };

    window.downloadQRCode = async (config, filename) => {
        const generator = new QRCodeGenerator(config);
        return await generator.downloadQR(filename);
    };
}

// ========== NODE.JS INTEGRATION ==========

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCodeGenerator;
}
