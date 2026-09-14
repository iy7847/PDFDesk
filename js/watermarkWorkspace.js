(function() {
    'use strict';
    const PDFDesk = window.PDFDesk = window.PDFDesk || {};
    
    let wmState = {
        type: 'text',
        previewIndex: 0,
        previewPage: 1,
        totalPreviewPages: 1,
        zoom: 1.0,
        panX: 0,
        panY: 0,
        pdfDocCache: null,
        pdfDocCacheIndex: -1,
        text: 'CONFIDENTIAL',
        color: '#808080',
        font: '맑은 고딕',
        userSelectedFont: false,
        imageFile: null,
        imageUrl: null,
        scale: 1.0,
        widthRatio: 100,
        rotate: 45,
        opacity: 0.3,
        x: 50,
        y: 50
    };

    window.wmSharedViewer = new PDFDesk.SharedViewer({
        prefix: 'wm',
        workspace: null,
        state: wmState,
        onDrawOverlay: (canvas, ctx, viewport) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            // Transform to percentage based coordinates based on canvas width/height
            const centerX = canvas.width * (wmState.x / 100);
            const centerY = canvas.height * (wmState.y / 100);
            
            ctx.translate(centerX, centerY);
            ctx.rotate(wmState.rotate * Math.PI / 180);
            ctx.scale(wmState.scale, wmState.scale);
            ctx.globalAlpha = wmState.opacity;
            
            if (wmState.type === 'text') {
                const fontSize = Math.max(10, Math.round(canvas.width * 0.07));
                ctx.scale(wmState.widthRatio / 100, 1);
                ctx.fillStyle = wmState.color;
                ctx.font = 'bold ' + fontSize + 'px ' + wmState.font;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(wmState.text || ' ', 0, 0);
            } else {
                // If using image, use wmImageObj if already cached, else load dynamically
                let img = window.wmImageObj;
                if (!img && wmState.imageUrl) {
                    img = new Image();
                    img.src = wmState.imageUrl;
                    window.wmImageObj = img;
                }
                
                if (img) {
                    if (img.complete) {
                        const aspect = img.width / img.height;
                        let dw = img.width, dh = img.height;
                        const maxW = canvas.width * 0.35;
                        const maxH = canvas.width * 0.35; // using width as base for scale consistency
                        if(dw > maxW || dh > maxH) {
                            const ratio = Math.min(maxW / dw, maxH / dh);
                            dw *= ratio;
                            dh *= ratio;
                        }
                        ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
                    } else {
                        img.onload = () => window.wmSharedViewer.forceRedrawOverlay();
                    }
                }
            }
            ctx.restore();
        },
        onEvent: (type, e) => {
            if (type === 'mousedown' && e.button === 0 && !e.altKey) {
                wmState.isDraggingWm = true;
            } else if (type === 'mousemove' && wmState.isDraggingWm) {
                const overlay = document.getElementById('wm-overlay-canvas');
                if(!overlay) return;
                const rect = overlay.getBoundingClientRect();
                const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                const percentY = ((e.clientY - rect.top) / rect.height) * 100;
                wmState.x = Math.max(0, Math.min(100, percentX));
                wmState.y = Math.max(0, Math.min(100, percentY));
                window.wmSharedViewer.forceRedrawOverlay();
            } else if (type === 'mouseup' || type === 'mouseleave') {
                wmState.isDraggingWm = false;
            }
        },
        onPageChange: (idx, page) => {
            const listItems = document.querySelectorAll('#file-grid-watermark li');
            listItems.forEach((item, i) => {
                if (i === idx) {
                    item.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                    item.classList.remove('border-outline-variant');
                } else {
                    item.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                    item.classList.add('border-outline-variant');
                }
            });
        }
    });

    const ui = PDFDesk.UI;
    function getWatermarkSettingsHtml() {
        const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
        return `
        <div class="mb-5 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm">
            ${ui.radioGroup({
                name: 'wm-type',
                label: t('ws_watermark_type', '워터마크 타입'),
                icon: 'category',
                options: [
                    { value: 'text', label: t('ws_watermark_type_text', '텍스트'), checked: true },
                    { value: 'image', label: t('ws_watermark_type_image', '이미지') }
                ]
            })}

            <!-- Text Input Area -->
            <div id="wm-text-area" class="mb-4">
                <div class="grid grid-cols-[3rem_1fr] gap-2 mb-2 w-full">
                    <input type="color" id="input-watermark-color" class="h-11 w-full p-1 border border-outline-variant bg-surface-bright rounded-lg cursor-pointer" value="#808080" title="${t('ws_watermark_color_title', '워터마크 색상')}">
                    <select id="select-watermark-font" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg h-11 px-3 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                        ${(PDFDesk.i18n && PDFDesk.i18n.getLang() === 'en') ? `
                            <optgroup label="${t('ws_watermark_font_standard', 'Standard Western Fonts')}">
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Tahoma">Tahoma</option>
                                <option value="Impact">Impact</option>
                                <option value="Comic Sans MS">Comic Sans MS</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_korean', 'Korean System Fonts (Windows/Mac)')}">
                                <option value="맑은 고딕">Malgun Gothic (맑은 고딕)</option>
                                <option value="Noto Sans KR">Noto Sans KR</option>
                                <option value="Apple SD 산돌고딕 Neo">Apple SD Gothic Neo</option>
                                <option value="돋움">Dotum (돋움)</option>
                                <option value="굴림">Gulim (굴림)</option>
                                <option value="바탕">Batang (바탕)</option>
                                <option value="궁서">Gungsuh (궁서)</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_custom', 'Custom Font')}">
                                <option value="custom">${t('ws_watermark_font_custom', 'Custom Font...')}</option>
                            </optgroup>
                        ` : `
                            <optgroup label="${t('ws_watermark_font_win', '윈도우 기본 폰트')}">
                                <option value="맑은 고딕">맑은 고딕</option>
                                <option value="돋움">돋움</option>
                                <option value="굴림">굴림</option>
                                <option value="바탕">바탕</option>
                                <option value="궁서">궁서</option>
                                <option value="HY견고딕">HY견고딕</option>
                                <option value="HY견명조">HY견명조</option>
                                <option value="HY헤드라인M">HY헤드라인M</option>
                                <option value="휴먼둥근헤드라인">휴먼둥근헤드라인</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_mac', '맥(Mac) 기본 폰트')}">
                                <option value="Apple SD 산돌고딕 Neo">Apple SD 산돌고딕 Neo</option>
                                <option value="애플고딕">애플고딕</option>
                                <option value="애플명조">애플명조</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_web', '안드로이드/웹 기본 폰트')}">
                                <option value="Noto Sans KR">Noto Sans KR (나눔고딕)</option>
                                <option value="Roboto">Roboto</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_en', '영문 유명 폰트')}">
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Tahoma">Tahoma</option>
                                <option value="Comic Sans MS">Comic Sans MS</option>
                                <option value="Impact">Impact</option>
                            </optgroup>
                            <optgroup label="${t('ws_watermark_font_custom', '기타')}">
                                <option value="custom">${t('ws_watermark_font_custom', '직접 입력...')}</option>
                            </optgroup>
                        `}
                    </select>
                    <input type="text" id="input-watermark-font-custom" placeholder="${t('ws_watermark_font_placeholder', '폰트명 입력')}" class="hidden flex-1 border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                </div>
                <input type="text" id="input-watermark-text" value="CONFIDENTIAL" placeholder="${t('ws_watermark_text_placeholder', '워터마크 텍스트 입력')}" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-1">
            </div>

            <!-- Image Input Area -->
            <div id="wm-image-area" class="mb-4 hidden">
                <input type="file" id="input-watermark-image" accept="image/png, image/jpeg" class="hidden">
                <label for="input-watermark-image" class="w-full flex items-center justify-center gap-2 border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm cursor-pointer hover:bg-surface-container-low transition-colors">
                    <span class="material-symbols-outlined text-[18px]">add_photo_alternate</span> <span id="wm-image-label">${t('ws_watermark_select_img', '이미지 파일 선택 (PNG/JPG)')}</span>
                </label>
            </div>

            <!-- Common Controls (Sliders) -->
            <div class="space-y-4">
                ${ui.slider({ id: 'input-wm-scale', label: t('ws_watermark_scale', '크기 배율'), valueId: 'wm-val-scale', min: 0.1, max: 5.0, step: 0.1, value: 1.0, displayValue: '1.0x' })}
                ${ui.slider({ id: 'input-wm-width-ratio', label: t('ws_watermark_width_ratio', '장평 (가로 폭)'), valueId: 'wm-val-width-ratio', min: 50, max: 150, step: 5, value: 100, displayValue: '100%' })}
                ${ui.slider({ id: 'input-wm-rotate', label: t('ws_watermark_rotate', '회전 각도'), valueId: 'wm-val-rotate', min: -180, max: 180, step: 5, value: 45, displayValue: '45°' })}
                ${ui.slider({ id: 'input-wm-opacity', label: t('ws_watermark_opacity', '불투명도'), valueId: 'wm-val-opacity', min: 0, max: 100, step: 5, value: 30, displayValue: '30%' })}
            </div>

            <div class="mt-6 border-t border-outline-variant pt-4">
                ${window.wmSharedViewer.getSettingsNavigationHtml()}
            </div>
        </div>
        ${ui.filenameInput({
            id: 'input-filename-watermark',
            placeholder: t('ws_filename_placeholder', '입력하지 않으면 자동 생성됨')
        })}
    `;
    }

    const watermarkWorkspace = new PDFDesk.WorkspaceTool({
        id: 'watermark',
        title: '텍스트/이미지 워터마크',
        titleKey: 'ws_watermark_title',
        executeBtnText: '워터마크 일괄 적용하기',
        executeBtnKey: 'ws_watermark_btn',
        settingsHtml: getWatermarkSettingsHtml,
        hideDefaultGrid: false,
        onActiveItemChanged: (index, workspace) => {
            if (wmState.previewIndex !== index) {
                wmState.previewIndex = index;
                if (window.wmSharedViewer) {
                    window.wmSharedViewer.workspace = workspace;
                    window.wmSharedViewer.updatePreview();
                }
            }
        },
        onFilesChanged: async (files, workspace) => {
            if (wmState.previewIndex >= files.length) {
                wmState.previewIndex = Math.max(0, files.length - 1);
            }

            if (files.length > 0) {
                const inputFilename = document.getElementById('input-filename-watermark');
                if (!inputFilename.value) {
                    const fileObj = files[0];
                    const originalName = fileObj.file.name.replace(/\.[^/.]+$/, "");
                    inputFilename.value = `${originalName}_Watermarked`;
                }
                
                if (window.wmSharedViewer) {
                    window.wmSharedViewer.workspace = workspace;
                    window.wmSharedViewer.updatePreview();
                }
            } else {
                if (window.wmSharedViewer) {
                    window.wmSharedViewer.workspace = workspace;
                    window.wmSharedViewer.updatePreview();
                }
            }
        },
        onRender: (workspace) => {
            const customArea = document.getElementById(`custom-workspace-watermark`);
            customArea.classList.remove('hidden');
            
            const defaultHeader = document.getElementById(`default-header-watermark`);
            const fileGrid = document.getElementById('file-grid-watermark');
            if (defaultHeader && fileGrid && customArea.parentNode) {
                customArea.parentNode.insertBefore(customArea, defaultHeader);
            }
            
            // Build Preview Canvas HTML
            if (!document.getElementById('wm-preview-container')) {
                const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                customArea.innerHTML = `
                    <div id="wm-preview-container" class="w-full flex justify-between items-end mb-2">
                        <div class="flex-1">
                            <h3 class="font-headline-sm font-bold text-on-surface text-left">${t('ws_watermark_preview_title', '실시간 워터마크 미리보기')}</h3>
                            <p class="text-sm text-on-surface-variant text-left mt-1">${t('ws_watermark_preview_desc', '파일을 선택하고 마우스 드래그로 워터마크 위치를 조정하세요.')}</p>
                        </div>
                    </div>
                    ${window.wmSharedViewer.getViewerBoardHtml('w-full', 'cursor-move')}
                `;
                window.wmSharedViewer.bindEvents();
            }
            window.wmSharedViewer.workspace = workspace;
            window.wmSharedViewer.updatePreview();

            const radioType = document.getElementsByName('wm-type');
            const selectFont = document.getElementById('select-watermark-font');
            const inputColor = document.getElementById('input-watermark-color');
            const inputFontCustom = document.getElementById('input-watermark-font-custom');
            const inputTxt = document.getElementById('input-watermark-text');
            const inputImg = document.getElementById('input-watermark-image');
            const imgLabel = document.getElementById('wm-image-label');
            
            const txtArea = document.getElementById('wm-text-area');
            const imgArea = document.getElementById('wm-image-area');

            const rangeScale = document.getElementById('input-wm-scale');
            const valScale = document.getElementById('wm-val-scale');
            const rangeWidthRatio = document.getElementById('input-wm-width-ratio');
            const valWidthRatio = document.getElementById('wm-val-width-ratio');
            const rangeRotate = document.getElementById('input-wm-rotate');
            const valRotate = document.getElementById('wm-val-rotate');
            const rangeOpacity = document.getElementById('input-wm-opacity');
            const valOpacity = document.getElementById('wm-val-opacity');
            
            const headerActions = document.getElementById('settings-header-actions');
            if (headerActions) {
                const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                headerActions.innerHTML = `
                    <button id="btn-wm-reset" class="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 transition-colors rounded-lg bg-surface-bright border border-error/30 hover:border-error shadow-sm" title="${t('ws_watermark_reset_title', '워터마크 위치/설정 초기화')}">
                        <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                    </button>
                `;
            }

            const btnReset = document.getElementById('btn-wm-reset');

            // Update Preview Function
            const updatePreview = () => { window.wmSharedViewer.forceRedrawOverlay(); };
            // Event Listeners for UI
            radioType.forEach(r => {
                r.addEventListener('change', (e) => {
                    wmState.type = e.target.value;
                    if (wmState.type === 'text') {
                        txtArea.classList.remove('hidden');
                        imgArea.classList.add('hidden');
                    } else {
                        txtArea.classList.add('hidden');
                        imgArea.classList.remove('hidden');
                    }
                    updatePreview();
                });
            });


            selectFont.addEventListener('change', (e) => {
                wmState.userSelectedFont = true;
                const isEnCurrent = PDFDesk.i18n && PDFDesk.i18n.getLang() === 'en';
                if (e.target.value === 'custom') {
                    inputFontCustom.classList.remove('hidden');
                    wmState.font = inputFontCustom.value || (isEnCurrent ? 'Arial' : '맑은 고딕');
                } else {
                    inputFontCustom.classList.add('hidden');
                    wmState.font = e.target.value;
                }
                updatePreview();
            });

            inputColor.addEventListener('input', (e) => {
                wmState.color = e.target.value;
                updatePreview();
            });

            inputFontCustom.addEventListener('input', (e) => {
                if (selectFont.value === 'custom') {
                    wmState.userSelectedFont = true;
                    wmState.font = e.target.value;
                    updatePreview();
                }
            });

            inputTxt.addEventListener('input', (e) => {
                wmState.text = e.target.value;
                updatePreview();
            });

            inputImg.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    wmState.imageFile = file;
                    imgLabel.innerText = file.name;
                    if (wmState.imageUrl) URL.revokeObjectURL(wmState.imageUrl);
                    wmState.imageUrl = URL.createObjectURL(file);
                    updatePreview();
                }
            });

            rangeScale.addEventListener('input', (e) => {
                wmState.scale = parseFloat(e.target.value);
                valScale.innerText = wmState.scale.toFixed(1) + 'x';
                updatePreview();
            });

            rangeWidthRatio.addEventListener('input', (e) => {
                wmState.widthRatio = parseInt(e.target.value);
                valWidthRatio.innerText = wmState.widthRatio + '%';
                updatePreview();
            });

            rangeRotate.addEventListener('input', (e) => {
                wmState.rotate = parseInt(e.target.value);
                valRotate.innerText = wmState.rotate + '°';
                updatePreview();
            });

            rangeOpacity.addEventListener('input', (e) => {
                wmState.opacity = parseInt(e.target.value) / 100;
                valOpacity.innerText = e.target.value + '%';
                updatePreview();
            });
            
            if (btnReset) {
                const newBtnReset = btnReset.cloneNode(true);
                btnReset.parentNode.replaceChild(newBtnReset, btnReset);
                newBtnReset.addEventListener('click', () => {
                    wmState.userSelectedFont = false;
                    const isEnCurrent = PDFDesk.i18n && PDFDesk.i18n.getLang() === 'en';
                    const defaultFont = isEnCurrent ? 'Arial' : '맑은 고딕';
                    wmState.font = defaultFont;
                    selectFont.value = defaultFont;
                    inputFontCustom.classList.add('hidden');
                    
                    wmState.x = 50;
                    wmState.y = 50;
                    wmState.scale = 1.0;
                    wmState.widthRatio = 100;
                    wmState.rotate = 45;
                    
                    rangeScale.value = 1.0;
                    valScale.innerText = '1.0x';
                    
                    rangeWidthRatio.value = 100;
                    valWidthRatio.innerText = '100%';
                    
                    rangeRotate.value = 45;
                    valRotate.innerText = '45°';
                    
                    updatePreview();
                });
            }

            // Old drag logic removed as it's now handled by SharedViewer

            // Set initial state
            const isEn = PDFDesk.i18n && PDFDesk.i18n.getLang() === 'en';
            if (!wmState.userSelectedFont) {
                wmState.font = isEn ? 'Arial' : '맑은 고딕';
            }

            const standardFonts = [
                'Arial', 'Times New Roman', 'Roboto', 'Verdana', 'Tahoma', 'Comic Sans MS', 'Impact',
                '맑은 고딕', '돋움', '굴림', '바탕', '궁서', 'HY견고딕', 'HY견명조', 'HY헤드라인M', '휴먼둥근헤드라인',
                'Apple SD 산돌고딕 Neo', '애플고딕', '애플명조',
                'Noto Sans KR'
            ];
            if (standardFonts.includes(wmState.font)) {
                selectFont.value = wmState.font;
                inputFontCustom.classList.add('hidden');
            } else {
                selectFont.value = 'custom';
                inputFontCustom.value = wmState.font;
                inputFontCustom.classList.remove('hidden');
            }
            updatePreview();
        },
        onExecute: async (workspace) => {
            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
            if (workspace.selectedFiles.length === 0) {
                alert(t('ws_watermark_alert_nofile', '파일을 먼저 업로드해 주세요.'));
                return;
            }
            if (wmState.type === 'image' && !wmState.imageFile) {
                alert(t('ws_watermark_alert_noimg', '워터마크로 사용할 이미지를 업로드해 주세요.'));
                return;
            }
            if (wmState.type === 'text' && !wmState.text.trim()) {
                alert(t('ws_watermark_alert_notext', '워터마크 텍스트를 입력해 주세요.'));
                return;
            }
            
            try {
                workspace.showProgress();
                workspace.setProgress(5, '필요한 리소스 준비 중...');

                const { PDFDocument, degrees } = window.PDFLib;
                const mergedPdf = await PDFDocument.create();
                
                let customImage = null;
                
                // Helper to load image object from File or DataURL to get natural dimensions
                const loadImageElement = (src) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = src;
                    });
                };
                
                // --- STEP 1: PREPARE THE IMAGE (Convert Text to PNG if needed) ---
                let sourceWidth = 0;
                let sourceHeight = 0;
                
                if (wmState.type === 'text') {
                    workspace.setProgress(15, '텍스트 이미지로 변환 중...');
                    // Create high resolution canvas for text
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const fontSize = 160; // Base large font size for crispness
                    const fontString = `bold ${fontSize}px ${wmState.font}`;
                    
                    ctx.font = fontString;
                    const metrics = ctx.measureText(wmState.text);
                    const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
                    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                    
                    // Add padding to prevent clipping
                    const scaleX = wmState.widthRatio / 100;
                    canvas.width = (textWidth * scaleX) + 40;
                    canvas.height = textHeight + 40;
                    
                    // Re-apply context settings after resize
                    ctx.font = fontString;
                    ctx.fillStyle = wmState.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Draw text in center with scaling
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.scale(scaleX, 1);
                    ctx.fillText(wmState.text, 0, 0);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    
                    sourceWidth = canvas.width;
                    sourceHeight = canvas.height;
                    
                    // Get PNG Buffer and embed
                    const dataUrl = canvas.toDataURL('image/png');
                    const base64Data = dataUrl.split(',')[1];
                    const binaryString = window.atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    customImage = await mergedPdf.embedPng(bytes);
                    
                } else if (wmState.type === 'image' && wmState.imageFile) {
                    workspace.setProgress(15, '이미지 로드 중...');
                    // Get natural width/height of the uploaded image
                    const imgEl = await loadImageElement(wmState.imageUrl);
                    sourceWidth = imgEl.naturalWidth;
                    sourceHeight = imgEl.naturalHeight;
                    
                    const imgBytes = await wmState.imageFile.arrayBuffer();
                    if (wmState.imageFile.type === 'image/jpeg') {
                        customImage = await mergedPdf.embedJpg(imgBytes);
                    } else if (wmState.imageFile.type === 'image/png') {
                        customImage = await mergedPdf.embedPng(imgBytes);
                    } else {
                        throw new Error('JPG나 PNG 파일만 지원합니다.');
                    }
                }

                // --- STEP 2: CALCULATE RELATIVE SCALING RATIOS ---
                let relativeWidthRatio = 0;
                
                if (wmState.type === 'text') {
                    const tempCanvas = document.createElement('canvas');
                    const tCtx = tempCanvas.getContext('2d');
                    const refWidth = 1000;
                    const refFontSize = Math.max(10, Math.round(refWidth * 0.07));
                    tCtx.font = `bold ${refFontSize}px ${wmState.font}`;
                    const metrics = tCtx.measureText(wmState.text || ' ');
                    const textWidth = metrics.width * (wmState.widthRatio / 100);
                    relativeWidthRatio = textWidth / refWidth;
                } else {
                    let drawWidth = sourceWidth;
                    let drawHeight = sourceHeight;
                    const refWidth = 1000;
                    const maxW = refWidth * 0.35;
                    const maxH = refWidth * 0.35;
                    
                    if (drawWidth > maxW || drawHeight > maxH) {
                        const ratio = Math.min(maxW / drawWidth, maxH / drawHeight);
                        drawWidth *= ratio;
                    }
                    relativeWidthRatio = drawWidth / refWidth;
                }
                
                const sourceAspectRatio = sourceHeight / sourceWidth;

                // --- STEP 3: APPLY TO PDFs ---
                let totalPagesProcessed = 0;
                let totalExpectedPages = 0;

                for (let f = 0; f < workspace.selectedFiles.length; f++) {
                    const fileObj = workspace.selectedFiles[f];
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const pdfDoc = await PDFDesk.Utils.loadPdfSafely(arrayBuffer, {}, (cur, tot, msg) => {
                        workspace.setProgress(10, `[${f + 1}/${workspace.selectedFiles.length}] ${msg}`);
                    });
                    totalExpectedPages += pdfDoc.getPageCount();
                    fileObj.tempDoc = pdfDoc;
                }

                for (let f = 0; f < workspace.selectedFiles.length; f++) {
                    const fileObj = workspace.selectedFiles[f];
                    workspace.setProgress(20 + (totalPagesProcessed / totalExpectedPages) * 60, `워터마크 각인 중... (${f+1}/${workspace.selectedFiles.length} 파일)`);
                    
                    const pdfDoc = fileObj.tempDoc;
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    
                    for (let i = 0; i < copiedPages.length; i++) {
                        const page = copiedPages[i];
                        // Get bounding box and rotation
                        let box = page.getCropBox();
                        if (!box) box = page.getMediaBox();
                        
                        const unrotatedWidth = box.width;
                        const unrotatedHeight = box.height;
                        const rotationAngle = page.getRotation().angle; // 0, 90, 180, 270
                        
                        // Determine visual dimensions
                        let visualWidth = unrotatedWidth;
                        let visualHeight = unrotatedHeight;
                        if (rotationAngle === 90 || rotationAngle === 270) {
                            visualWidth = unrotatedHeight;
                            visualHeight = unrotatedWidth;
                        }

                        // Target dimensions based on visual width
                        let targetWidth = visualWidth * relativeWidthRatio * wmState.scale;
                        let targetHeight = targetWidth * sourceAspectRatio;
                        
                        // Visual absolute coordinates (0,0 is visual bottom-left)
                        const vAbsX = (wmState.x / 100) * visualWidth;
                        const vAbsY = ((100 - wmState.y) / 100) * visualHeight;
                        
                        // Map visual coordinates to unrotated coordinates
                        let absX = vAbsX;
                        let absY = vAbsY;
                        
                        if (rotationAngle === 90) {
                            absX = unrotatedWidth - vAbsY;
                            absY = vAbsX;
                        } else if (rotationAngle === 180) {
                            absX = unrotatedWidth - vAbsX;
                            absY = unrotatedHeight - vAbsY;
                        } else if (rotationAngle === 270) {
                            absX = vAbsY;
                            absY = unrotatedHeight - vAbsX;
                        }
                        
                        // Add CropBox offset
                        absX += box.x;
                        absY += box.y;

                        // Calculate final rotation (compensate for page rotation)
                        const totalRotation = -wmState.rotate + rotationAngle;
                        
                        const theta = totalRotation * Math.PI / 180;
                        const cosTheta = Math.cos(theta);
                        const sinTheta = Math.sin(theta);
                        
                        // Calculate bottom-left corner so that it rotates perfectly around the center (absX, absY)
                        const finalX = absX - (targetWidth / 2) * cosTheta + (targetHeight / 2) * sinTheta;
                        const finalY = absY - (targetWidth / 2) * sinTheta - (targetHeight / 2) * cosTheta;

                        page.drawImage(customImage, {
                            x: finalX,
                            y: finalY,
                            width: targetWidth,
                            height: targetHeight,
                            opacity: wmState.opacity,
                            rotate: degrees(totalRotation)
                        });

                        mergedPdf.addPage(page);
                        totalPagesProcessed++;
                        workspace.setProgress(20 + (totalPagesProcessed / totalExpectedPages) * 60, `워터마크 각인 중...`);
                    }
                    delete fileObj.tempDoc; // free memory
                }

                workspace.setProgress(90, '최종 파일 생성 중...');
                const pdfBytes = await mergedPdf.save();

                const filename = PDFDesk.Utils.buildFilename(document.getElementById('input-filename-watermark').value, 'Watermarked', '.pdf');
                PDFDesk.Utils.downloadFile(pdfBytes, filename, 'application/pdf');

                workspace.completeProgress(t('ws_watermark_success', '워터마크가 성공적으로 적용되었습니다!'));
            } catch (error) {
                PDFDesk.Utils.handlePdfError(error, workspace);
            }
        }
    });

    PDFDesk.initWatermark = function() {
        return watermarkWorkspace;
    };
})();
