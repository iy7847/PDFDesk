(function() {
    'use strict';
    const PDFDesk = window.PDFDesk = window.PDFDesk || {};

    class SharedViewer {
        constructor(options) {
            this.prefix = options.prefix || 'shared';
            this.workspace = options.workspace;
            this.state = options.state; 
            /*
             state must contain:
             previewIndex: 0,
             previewPage: 1,
             totalPreviewPages: 1,
             zoom: 1.0,
             panX: 0,
             panY: 0,
             pdfDocCache: null,
             pdfDocCacheIndex: -1,
            */
            this.onDrawOverlay = options.onDrawOverlay || (() => {});
            this.onPageChange = options.onPageChange || (() => {});
            this.onZoomPan = options.onZoomPan || (() => {});
            this.onEvent = options.onEvent || (() => {});
        }

        getSettingsNavigationHtml() {
            const ui = PDFDesk.UI;
            const t = (k, fb) => (PDFDesk.i18n ? PDFDesk.i18n.t(k, fb) : fb);
            const prevTitle = t('viewer_nav_prev', '이전 페이지/파일');
            const nextTitle = t('viewer_nav_next', '다음 페이지/파일');
            const pageTitle = t('viewer_nav_page', '페이지 이동');

            const prevBtn = ui ? ui.button({
                id: `btn-${this.prefix}-prev`,
                icon: 'chevron_left',
                variant: 'outline',
                classes: 'flex-1 !py-2 flex justify-center items-center',
                attrs: { title: prevTitle }
            }) : `<button id="btn-${this.prefix}-prev" class="flex-1 border border-outline-variant rounded-lg p-2 hover:bg-surface-container-low font-body-sm font-bold text-on-surface transition-colors flex justify-center items-center" title="${prevTitle}"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>`;
            
            const nextBtn = ui ? ui.button({
                id: `btn-${this.prefix}-next`,
                icon: 'chevron_right',
                variant: 'outline',
                classes: 'flex-1 !py-2 flex justify-center items-center',
                attrs: { title: nextTitle }
            }) : `<button id="btn-${this.prefix}-next" class="flex-1 border border-outline-variant rounded-lg p-2 hover:bg-surface-container-low font-body-sm font-bold text-on-surface transition-colors flex justify-center items-center" title="${nextTitle}"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>`;

            return `
                <div class="mb-4">
                    <label class="block font-body-sm text-on-surface font-bold mb-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px] text-primary">find_in_page</span> ${pageTitle}
                    </label>
                    <div class="flex items-center gap-2 mb-4">
                        ${prevBtn}
                        <span id="label-${this.prefix}-page" class="font-body-sm font-bold text-center px-2 min-w-[80px]">1 / 1</span>
                        ${nextBtn}
                    </div>
                </div>
            `;
        }

        getViewerBoardHtml(extraClasses = '', canvasClasses = '') {
            return `
                <div id="${this.prefix}-preview-board" class="bg-surface-container-low border border-outline-variant rounded-xl relative hidden shadow-sm focus:outline-none ${extraClasses}" tabindex="0">
                    <div id="${this.prefix}-canvas-container" class="absolute inset-0 origin-center" style="transform: translate(0px, 0px) scale(1.0);">
                        <canvas id="${this.prefix}-pdf-canvas" class="w-full h-full block"></canvas>
                        <canvas id="${this.prefix}-overlay-canvas" class="absolute inset-0 w-full h-full block ${canvasClasses}"></canvas>
                    </div>
                    <div class="absolute bottom-4 right-4 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm pointer-events-none z-10">
                        <span id="label-${this.prefix}-zoom" class="font-body-sm font-bold text-on-surface">100%</span>
                    </div>
                </div>
            `;
        }
        updateTransform() {
            const canvasContainer = document.getElementById(`${this.prefix}-canvas-container`);
            if (canvasContainer) {
                canvasContainer.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.zoom})`;
            }
            const zoomLabel = document.getElementById(`label-${this.prefix}-zoom`);
            if (zoomLabel) zoomLabel.textContent = `${Math.round(this.state.zoom * 100)}%`;
        }

        async updatePreview() {
            const board = document.getElementById(`${this.prefix}-preview-board`);
            const canvasContainer = document.getElementById(`${this.prefix}-canvas-container`);
            const pdfCanvas = document.getElementById(`${this.prefix}-pdf-canvas`);
            const overlayCanvas = document.getElementById(`${this.prefix}-overlay-canvas`);
            
            if (!board || !pdfCanvas || !overlayCanvas) return;

            if (this.workspace.selectedFiles.length === 0) {
                board.classList.add('hidden');
                return;
            }

            board.classList.remove('hidden');
            this.updateThumbnailSelection();

            canvasContainer.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.zoom})`;
            
            if (this.state.previewIndex !== this.state.pdfDocCacheIndex || !this.state.pdfDocCache) {
                try {
                    this.workspace.showProgress();
                    this.workspace.setProgress(10, '문서 불러오는 중...');
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const previewFile = this.workspace.selectedFiles[this.state.previewIndex];
                    const arrayBuffer = await previewFile.file.arrayBuffer();
                    const loadingTask = pdfjsLib.getDocument({ 
                        data: arrayBuffer.slice(0),
                        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                        cMapPacked: true
                    });
                    this.state.pdfDocCache = await loadingTask.promise;
                    this.state.pdfDocCacheIndex = this.state.previewIndex;
                    this.state.totalPreviewPages = this.state.pdfDocCache.numPages;
                    this.state.previewPage = 1;
                    this.workspace.hideProgress();
                } catch (err) {
                    this.workspace.hideProgress();
                    console.error("Error loading PDF for preview", err);
                    alert("PDF 파일 구조를 읽는 중 문제가 발생했습니다: " + err.message);
                    return;
                }
            }

            const pageLabel = document.getElementById(`label-${this.prefix}-page`);
            if (pageLabel) pageLabel.textContent = `${this.state.previewPage} / ${this.state.totalPreviewPages}`;
            const zoomLabel = document.getElementById(`label-${this.prefix}-zoom`);
            if (zoomLabel) zoomLabel.textContent = `${Math.round(this.state.zoom * 100)}%`;

            try {
                const page = await this.state.pdfDocCache.getPage(this.state.previewPage);
                const viewport = page.getViewport({ scale: 1.5 });

                this.state.previewViewportWidth = viewport.width;
                this.state.previewViewportHeight = viewport.height;

                board.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

                pdfCanvas.width = viewport.width;
                pdfCanvas.height = viewport.height;
                overlayCanvas.width = viewport.width;
                overlayCanvas.height = viewport.height;

                const pdfCtx = pdfCanvas.getContext('2d');
                await page.render({ canvasContext: pdfCtx, viewport: viewport }).promise;

                this.onDrawOverlay(overlayCanvas, overlayCanvas.getContext('2d'), viewport);
            } catch (err) {
                console.error("Error rendering PDF page", err);
            }
        }

        updateThumbnailSelection() {
            const listItems = document.querySelectorAll(`#file-grid-${this.workspace.id} li`);
            if (listItems) {
                listItems.forEach((item, i) => {
                    if (i === this.state.previewIndex) {
                        item.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                        item.classList.remove('border-outline-variant');
                    } else {
                        item.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                        item.classList.add('border-outline-variant');
                    }
                });
            }
        }

        bindEvents() {
            const btnPrev = document.getElementById(`btn-${this.prefix}-prev`);
            const btnNext = document.getElementById(`btn-${this.prefix}-next`);
            const board = document.getElementById(`${this.prefix}-preview-board`);
            const overlayCanvas = document.getElementById(`${this.prefix}-overlay-canvas`);

            if (btnPrev && btnNext) {
                btnPrev.onclick = (e) => {
                    e.preventDefault();
                    if (this.state.previewPage > 1) {
                        this.state.previewPage--;
                        this.state.zoom = 1.0; this.state.panX = 0; this.state.panY = 0;
                        this.updatePreview();
                        this.onPageChange(this.state.previewIndex, this.state.previewPage);
                    } else if (this.state.previewIndex > 0) {
                        this.state.previewIndex--;
                        this.state.previewPage = 1;
                        this.state.zoom = 1.0; this.state.panX = 0; this.state.panY = 0;
                        this.updatePreview();
                        this.onPageChange(this.state.previewIndex, this.state.previewPage);
                    }
                };
                btnNext.onclick = (e) => {
                    e.preventDefault();
                    if (this.state.previewPage < this.state.totalPreviewPages) {
                        this.state.previewPage++;
                        this.state.zoom = 1.0; this.state.panX = 0; this.state.panY = 0;
                        this.updatePreview();
                        this.onPageChange(this.state.previewIndex, this.state.previewPage);
                    } else if (this.state.previewIndex < this.workspace.selectedFiles.length - 1) {
                        this.state.previewIndex++;
                        this.state.previewPage = 1;
                        this.state.zoom = 1.0; this.state.panX = 0; this.state.panY = 0;
                        this.updatePreview();
                        this.onPageChange(this.state.previewIndex, this.state.previewPage);
                    }
                };
            }

            if (board) {
                board.addEventListener('wheel', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
                        this.state.zoom = Math.max(0.1, Math.min(this.state.zoom + zoomChange, 5.0));
                        this.updateTransform();
                        this.onZoomPan();
                    }
                }, { passive: false });

                let isPanning = false;
                let startX, startY;

                board.addEventListener('mousedown', (e) => {
                    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left click
                        isPanning = true;
                        startX = e.clientX - this.state.panX;
                        startY = e.clientY - this.state.panY;
                        board.style.cursor = 'grabbing';
                        e.preventDefault();
                    }
                });

                window.addEventListener('mousemove', (e) => {
                    if (isPanning) {
                        this.state.panX = e.clientX - startX;
                        this.state.panY = e.clientY - startY;
                        this.updateTransform();
                        this.onZoomPan();
                    }
                });

                window.addEventListener('mouseup', (e) => {
                    if (isPanning) {
                        isPanning = false;
                        board.style.cursor = '';
                    }
                });

                // 모바일/태블릿 멀티 터치 제스처 (핀치 줌 및 2-핑거 패닝)
                let touchMode = null;
                let initialPinchDist = 0;
                let initialZoom = 1.0;
                let initialMidX = 0;
                let initialMidY = 0;
                let initialPanX = 0;
                let initialPanY = 0;

                const getTouchDistance = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const getTouchCenter = (t1, t2) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

                board.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        touchMode = 'pinch_pan';
                        initialPinchDist = getTouchDistance(e.touches[0], e.touches[1]);
                        const center = getTouchCenter(e.touches[0], e.touches[1]);
                        initialMidX = center.x;
                        initialMidY = center.y;
                        initialZoom = this.state.zoom;
                        initialPanX = this.state.panX;
                        initialPanY = this.state.panY;
                        e.preventDefault();
                    }
                }, { passive: false });

                board.addEventListener('touchmove', (e) => {
                    if (touchMode === 'pinch_pan' && e.touches.length === 2) {
                        e.preventDefault();
                        const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
                        const center = getTouchCenter(e.touches[0], e.touches[1]);

                        // 핀치 줌 배율 계산
                        if (initialPinchDist > 0) {
                            const scaleMultiplier = currentDist / initialPinchDist;
                            this.state.zoom = Math.max(0.2, Math.min(initialZoom * scaleMultiplier, 5.0));
                        }

                        // 2-핑거 캔버스 패닝 이동
                        const deltaX = center.x - initialMidX;
                        const deltaY = center.y - initialMidY;
                        this.state.panX = initialPanX + deltaX;
                        this.state.panY = initialPanY + deltaY;

                        this.updateTransform();
                        this.onZoomPan();
                    }
                }, { passive: false });

                const endTouch = () => {
                    touchMode = null;
                };
                board.addEventListener('touchend', endTouch);
                board.addEventListener('touchcancel', endTouch);

                // Keyboard events
                const onKeyDown = (e) => {
                    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        if (document.getElementById(`${this.prefix}-preview-board`) && !document.getElementById(`${this.prefix}-preview-board`).classList.contains('hidden')) {
                            if (e.key === ',' || e.key === '<' || e.key === 'ArrowLeft') {
                                btnPrev?.click();
                            } else if (e.key === '.' || e.key === '>' || e.key === 'ArrowRight') {
                                btnNext?.click();
                            }
                            // Pass other keys to custom handler
                            this.onEvent('keydown', e);
                        }
                    }
                };

                // Prevent multiple bindings
                if (window[`${this.prefix}KeydownBound`]) {
                    window.removeEventListener('keydown', window[`${this.prefix}KeydownHandler`]);
                }
                window[`${this.prefix}KeydownHandler`] = onKeyDown;
                window.addEventListener('keydown', onKeyDown);
                window[`${this.prefix}KeydownBound`] = true;
            }

            // Mouse & Single-Touch events on overlay for custom drawing
            if (overlayCanvas) {
                overlayCanvas.addEventListener('mousedown', (e) => this.onEvent('mousedown', e));
                overlayCanvas.addEventListener('mousemove', (e) => this.onEvent('mousemove', e));
                overlayCanvas.addEventListener('mouseup', (e) => this.onEvent('mouseup', e));
                overlayCanvas.addEventListener('mouseleave', (e) => this.onEvent('mouseleave', e));

                // 모바일 싱글 터치 드로잉 지원 (마우스 좌표 이벤트 호환 에뮬레이션)
                const delegateTouchEvent = (type, touchEvent) => {
                    if (touchEvent.touches.length === 1 || (type === 'mouseup' && touchEvent.changedTouches.length === 1)) {
                        const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
                        const mouseEvt = {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            button: 0,
                            preventDefault: () => touchEvent.preventDefault(),
                            stopPropagation: () => touchEvent.stopPropagation()
                        };
                        this.onEvent(type, mouseEvt);
                    }
                };

                overlayCanvas.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {
                        delegateTouchEvent('mousedown', e);
                    }
                }, { passive: false });

                overlayCanvas.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 1) {
                        delegateTouchEvent('mousemove', e);
                    }
                }, { passive: false });

                overlayCanvas.addEventListener('touchend', (e) => delegateTouchEvent('mouseup', e));
            }
        }
        
        forceRedrawOverlay() {
            const overlayCanvas = document.getElementById(`${this.prefix}-overlay-canvas`);
            if (overlayCanvas) {
                this.onDrawOverlay(overlayCanvas, overlayCanvas.getContext('2d'), null); // viewport is lost, but usually cached in the app
            }
        }
    }

    PDFDesk.SharedViewer = SharedViewer;
})();
