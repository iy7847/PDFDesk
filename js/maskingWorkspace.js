/**
 * PDFDesk - Masking (Flatten) Workspace Module
 * 
 * Provides the masking workspace tool that renders PDF pages to canvas,
 * allows drawing mask overlays (rect/ellipse), and exports flattened
 * (image-based) PDFs with masks baked in.
 * 
 * Dependencies: PDFDesk.WorkspaceTool, pdf-lib, pdf.js
 */
window.PDFDesk = window.PDFDesk || {};

(function () {
    'use strict';

    PDFDesk.initMasking = function () {

        let maskState = {
            previewIndex: 0,
            previewPage: 1,
            zoom: 1.0,
            panX: 0,
            panY: 0,
            color: '#ffffff',
            shape: 'rect',
            eraserMode: false,
            masks: {}, // { fileIndex: { pageIndex: [ {x, y, w, h, color, shape} ] } }
            isPanning: false,
            isDrawing: false,
            startX: 0,
            startY: 0,
            pdfDocCache: null,
            pdfDocCacheIndex: -1,
            totalPreviewPages: 1
        };

        
        window.maskSharedViewer = new PDFDesk.SharedViewer({
            prefix: 'mask',
            workspace: null,
            state: maskState,
            onDrawOverlay: (canvas, ctx, viewport) => {
                if (typeof drawMaskOverlay === 'function') drawMaskOverlay();
            },
            onPageChange: (idx, page) => {
                const listItems = document.querySelectorAll('#file-grid-masking li');
                listItems.forEach((item, i) => {
                    if (i === idx) {
                        item.classList.add('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                        item.classList.remove('border-outline-variant');
                    } else {
                        item.classList.remove('ring-2', 'ring-primary', 'bg-primary/5', 'border-primary');
                        item.classList.add('border-outline-variant');
                    }
                });
            },
            onZoomPan: () => {
                if (typeof drawMaskOverlay === 'function') drawMaskOverlay();
            },
            onEvent: (type, e) => {
                if(type === 'mousedown') {
                    if (e.button === 0 && !e.altKey) {
                        const overlay = document.getElementById('mask-overlay-canvas');
                        if(!overlay) return;
                        const rect = overlay.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * overlay.width;
                        const y = ((e.clientY - rect.top) / rect.height) * overlay.height;
                        if (maskState.eraserMode) {
                            const fIdx = maskState.previewIndex;
                            const pIdx = maskState.previewPage;
                            if (maskState.masks[fIdx] && maskState.masks[fIdx][pIdx]) {
                                maskState.masks[fIdx][pIdx] = maskState.masks[fIdx][pIdx].filter(m => {
                                    return !(x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
                                });
                                drawMaskOverlay();
                            }
                        } else {
                            maskState.isDrawing = true;
                            maskState.startX = x;
                            maskState.startY = y;
                            maskState.tempRect = { x: x, y: y, w: 0, h: 0 };
                        }
                    }
                } else if(type === 'mousemove') {
                    if (maskState.isDrawing) {
                        const overlay = document.getElementById('mask-overlay-canvas');
                        const rect = overlay.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * overlay.width;
                        const y = ((e.clientY - rect.top) / rect.height) * overlay.height;
                        maskState.tempRect.x = Math.min(maskState.startX, x);
                        maskState.tempRect.y = Math.min(maskState.startY, y);
                        maskState.tempRect.w = Math.abs(x - maskState.startX);
                        maskState.tempRect.h = Math.abs(y - maskState.startY);
                        drawMaskOverlay();
                    }
                } else if(type === 'mouseup' || type === 'mouseleave') {
                    if (maskState.isDrawing) {
                        maskState.isDrawing = false;
                        if (maskState.tempRect.w > 5 && maskState.tempRect.h > 5) {
                            const fIdx = maskState.previewIndex;
                            const pIdx = maskState.previewPage;
                            if (!maskState.masks[fIdx]) maskState.masks[fIdx] = {};
                            if (!maskState.masks[fIdx][pIdx]) maskState.masks[fIdx][pIdx] = [];
                            maskState.masks[fIdx][pIdx].push({
                                x: maskState.tempRect.x,
                                y: maskState.tempRect.y,
                                w: maskState.tempRect.w,
                                h: maskState.tempRect.h,
                                color: maskState.color,
                                shape: maskState.shape
                            });
                        }
                        drawMaskOverlay();
                    }
                }
            }
        });

        const maskingSettingsHtml = `
            <div class="mb-5 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm">
                <label class="block font-body-sm text-on-surface font-bold mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-primary">layers_clear</span> 마스킹 도구
                </label>
                <div class="flex gap-2 mb-4">
                    <label id="label-shape-rect" class="flex-1 flex items-center justify-center gap-1 border border-outline-variant bg-surface-bright text-on-surface rounded-lg py-2.5 px-0 cursor-pointer transition-colors">
                        <input type="radio" name="mask-shape-radio" value="rect" id="radio-shape-rect" class="hidden" checked>
                        <span class="material-symbols-outlined text-[18px]">rectangle</span>
                        <span class="font-bold text-[12px] whitespace-nowrap tracking-tight">사각</span>
                    </label>
                    <label id="label-shape-ellipse" class="flex-1 flex items-center justify-center gap-1 border border-outline-variant bg-surface-bright text-on-surface rounded-lg py-2.5 px-0 cursor-pointer transition-colors">
                        <input type="radio" name="mask-shape-radio" value="ellipse" id="radio-shape-ellipse" class="hidden">
                        <span class="material-symbols-outlined text-[18px]">circle</span>
                        <span class="font-bold text-[12px] whitespace-nowrap tracking-tight">원형</span>
                    </label>
                    <label id="label-mask-eraser" class="flex-1 flex items-center justify-center gap-1 border border-outline-variant bg-surface-bright text-on-surface rounded-lg py-2.5 px-0 cursor-pointer transition-colors">
                        <input type="checkbox" id="checkbox-mask-eraser" class="hidden">
                        <span class="material-symbols-outlined text-[18px]">ink_eraser</span>
                        <span class="font-bold text-[12px] whitespace-nowrap tracking-tight">지우개</span>
                    </label>
                </div>

                <div class="flex justify-between items-center mb-4">
                    <label class="font-body-sm text-on-surface font-bold flex items-center gap-1 mb-0">
                        <span class="material-symbols-outlined text-[16px] text-primary">palette</span> 마스킹 색상
                    </label>
                    <input type="color" id="input-mask-color" class="w-8 h-8 p-0 border border-outline-variant bg-surface-bright rounded cursor-pointer" value="#ffffff" title="마스킹 색상">
                </div>
                
                ${window.maskSharedViewer.getSettingsNavigationHtml()}
            </div>


            <div class="mb-4">
                <label class="block font-body-sm text-on-surface font-bold mb-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-primary">save_as</span> 출력 파일명
                </label>
                <input type="text" id="input-filename-masking" placeholder="입력하지 않으면 자동 생성됨" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
            </div>
        `;

        const drawMaskOverlay = () => {
            const overlayCanvas = document.getElementById('mask-overlay-canvas');
            if (!overlayCanvas) return;
            const ctx = overlayCanvas.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            const fIdx = maskState.previewIndex;
            const pIdx = maskState.previewPage;

            const drawBorder = (color) => {
                ctx.lineWidth = 2;
                const isRed = color.toLowerCase() === '#ff0000' || color.toLowerCase() === 'red';
                ctx.strokeStyle = isRed ? '#0000ff' : '#ff0000';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            };
            
            if (maskState.masks[fIdx] && maskState.masks[fIdx][pIdx]) {
                maskState.masks[fIdx][pIdx].forEach(m => {
                    ctx.fillStyle = m.color;
                    if (m.shape === 'ellipse') {
                        ctx.beginPath();
                        ctx.ellipse(m.x + m.w/2, m.y + m.h/2, Math.abs(m.w/2), Math.abs(m.h/2), 0, 0, 2 * Math.PI);
                        ctx.fill();
                        drawBorder(m.color);
                    } else {
                        ctx.fillRect(m.x, m.y, m.w, m.h);
                        ctx.beginPath();
                        ctx.rect(m.x, m.y, m.w, m.h);
                        drawBorder(m.color);
                    }
                });
            }

            if (maskState.isDrawing && !maskState.eraserMode) {
                ctx.fillStyle = maskState.color;
                if (maskState.shape === 'ellipse') {
                    ctx.beginPath();
                    ctx.ellipse(maskState.tempRect.x + maskState.tempRect.w/2, maskState.tempRect.y + maskState.tempRect.h/2, Math.abs(maskState.tempRect.w/2), Math.abs(maskState.tempRect.h/2), 0, 0, 2 * Math.PI);
                    ctx.fill();
                    drawBorder(maskState.color);
                } else {
                    ctx.fillRect(maskState.tempRect.x, maskState.tempRect.y, maskState.tempRect.w, maskState.tempRect.h);
                    ctx.beginPath();
                    ctx.rect(maskState.tempRect.x, maskState.tempRect.y, maskState.tempRect.w, maskState.tempRect.h);
                    drawBorder(maskState.color);
                }
            }
        };

        const maskingWorkspace = new PDFDesk.WorkspaceTool({
            id: 'masking',
            title: '마스킹 (Flatten)',
            executeBtnText: '마스킹 일괄 적용하기',
            settingsHtml: maskingSettingsHtml,
            hideDefaultGrid: false,
            onRender: (workspace) => {
                const customArea = document.getElementById(`custom-workspace-masking`);
                customArea.classList.remove('hidden');

                const defaultHeader = document.getElementById(`default-header-masking`);
                const fileGrid = document.getElementById(`file-grid-masking`);
                
                if (defaultHeader && fileGrid && customArea) {
                    defaultHeader.parentNode.insertBefore(customArea, defaultHeader);
                }
            },
            onActiveItemChanged: (index, workspace) => {
                if (maskState.previewIndex !== index) {
                    maskState.previewIndex = index;
                    maskState.previewPage = 1;
                    maskState.zoom = 1.0;
                    maskState.panX = 0;
                    maskState.panY = 0;
                    window.maskSharedViewer.workspace = workspace; 
                    window.maskSharedViewer.updatePreview();
                }
            },
            onFilesChanged: (files, workspace) => {
                if (maskState.previewIndex >= files.length) {
                    maskState.previewIndex = Math.max(0, files.length - 1);
                }

                if (files.length > 0) {
                    const inputFilename = document.getElementById('input-filename-masking');
                    if (inputFilename && !inputFilename.value) {
                        const originalName = files[0].file.name.replace(/\.[^/.]+$/, "");
                        inputFilename.value = originalName + '_masked';
                    }

                    const customArea = document.getElementById(`custom-workspace-masking`);
                    
                    if (!document.getElementById('mask-preview-container')) {
                        customArea.innerHTML = `
                            <div class="w-full flex justify-between items-end mb-3">
                                <div class="flex-1">
                                    <h3 class="font-headline-sm font-bold text-on-surface text-left">미리보기 및 마스킹 그리기</h3>
                                    <div class="flex flex-wrap gap-x-4 gap-y-1 items-center mt-2 text-[12px] text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/50">
                                        <span class="flex items-center gap-1 text-primary font-bold"><span class="material-symbols-outlined text-[14px]">info</span> 단축키 및 조작:</span>
                                        <span><b class="text-on-surface">Ctrl+휠</b>: 돋보기</span>
                                        <span><b class="text-on-surface">가운데 휠 클릭+드래그</b>: 이동</span>
                                        <span><b class="text-on-surface">좌클릭+드래그</b>: 마스킹 그리기</span>
                                        <span><b class="text-on-surface">← / → (방향키)</b>: 페이지 변경</span>
                                        <span><b class="text-on-surface">R / C / E</b>: 사각 / 원형 / 지우개 도구 변경</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="mask-preview-container" class="relative w-full bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-inner cursor-crosshair flex justify-center items-center" style="height: 60vh; max-height: 800px;">
                                ${window.maskSharedViewer.getViewerBoardHtml('max-w-full max-h-full m-auto h-full', 'cursor-crosshair')}
                            </div>
                        `;

                        window.maskSharedViewer.bindEvents();
                    }
                }

                window.maskSharedViewer.workspace = workspace; window.maskSharedViewer.updatePreview();

                const headerActions = document.getElementById('settings-header-actions');
                if (headerActions) {
                    headerActions.innerHTML = `
                        <button id="btn-mask-clear-page" class="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 transition-colors rounded-lg bg-surface-bright border border-error/30 hover:border-error shadow-sm" title="현재 페이지 마스킹 초기화">
                            <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                        </button>
                    `;
                }

                const inputColor = document.getElementById('input-mask-color');
                const radiosShape = document.querySelectorAll('input[name="mask-shape-radio"]');
                const chkEraser = document.getElementById('checkbox-mask-eraser');
                const btnPrev = document.getElementById('btn-mask-prev');
                const btnNext = document.getElementById('btn-mask-next');
                const btnClear = document.getElementById('btn-mask-clear-page');

                const labelShapeRect = document.getElementById('label-shape-rect');
                const labelShapeEllipse = document.getElementById('label-shape-ellipse');
                const labelMaskEraser = document.getElementById('label-mask-eraser');

                if (inputColor) {
                    inputColor.value = maskState.color;
                    const newColor = inputColor.cloneNode(true);
                    inputColor.parentNode.replaceChild(newColor, inputColor);
                    newColor.addEventListener('input', e => maskState.color = e.target.value);
                }

                const updateShapeUI = () => {
                    if (labelShapeRect && labelShapeEllipse && labelMaskEraser) {
                        if (maskState.eraserMode) {
                            labelMaskEraser.classList.add('bg-error/10', 'border-error', 'text-error');
                            labelMaskEraser.classList.remove('border-outline-variant', 'bg-surface-bright', 'text-on-surface');

                            labelShapeRect.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                            labelShapeRect.classList.add('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                            labelShapeEllipse.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                            labelShapeEllipse.classList.add('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                        } else {
                            labelMaskEraser.classList.remove('bg-error/10', 'border-error');
                            labelMaskEraser.classList.add('border-outline-variant', 'bg-surface-bright', 'text-on-surface');

                            if (maskState.shape === 'rect') {
                                labelShapeRect.classList.add('bg-primary/10', 'border-primary', 'text-primary');
                                labelShapeRect.classList.remove('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                                
                                labelShapeEllipse.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                                labelShapeEllipse.classList.add('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                            } else {
                                labelShapeEllipse.classList.add('bg-primary/10', 'border-primary', 'text-primary');
                                labelShapeEllipse.classList.remove('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                                
                                labelShapeRect.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                                labelShapeRect.classList.add('border-outline-variant', 'bg-surface-bright', 'text-on-surface');
                            }
                        }
                    }

                    radiosShape.forEach(radio => {
                        if (radio.value === maskState.shape) {
                            radio.checked = true;
                        }
                    });
                    if (chkEraser) {
                        chkEraser.checked = maskState.eraserMode;
                        if (maskState.eraserMode) {
                            document.getElementById('mask-preview-container').style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23ff0000%27 d=%27M15.14 3c-.51 0-1.02.2-1.41.59l-2.59 2.59-4.17 4.17-4.38 4.38c-.78.78-.78 2.05 0 2.83l3.41 3.41c.39.39.9.59 1.41.59s1.02-.2 1.41-.59l11.17-11.17c.78-.78.78-2.05 0-2.83l-3.41-3.41c-.39-.39-.9-.59-1.41-.59zM15.14 5l3.41 3.41-11.17 11.17-3.41-3.41L15.14 5z%27/%3E%3C/svg%3E") 0 24, auto';
                        } else {
                            document.getElementById('mask-preview-container').style.cursor = 'crosshair';
                        }
                    }
                };
                window.updateShapeUI = updateShapeUI;

                radiosShape.forEach(radio => {
                    const newRadio = radio.cloneNode(true);
                    radio.parentNode.replaceChild(newRadio, radio);
                    newRadio.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            maskState.shape = e.target.value;
                            if (maskState.eraserMode) {
                                maskState.eraserMode = false;
                            }
                            updateShapeUI();
                        }
                    });
                });

                if (chkEraser) {
                    const newChk = chkEraser.cloneNode(true);
                    chkEraser.parentNode.replaceChild(newChk, chkEraser);
                    newChk.addEventListener('change', (e) => {
                        maskState.eraserMode = e.target.checked;
                        updateShapeUI();
                    });
                }

                if (!window.hasEraserShortcut) {
                    window.addEventListener('keydown', (e) => {
                        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                            if (document.getElementById('mask-preview-container')) {
                                if (e.key === 'e' || e.key === 'E') {
                                    maskState.eraserMode = !maskState.eraserMode;
                                    if (typeof window.updateShapeUI === 'function') window.updateShapeUI();
                                } else if (e.key === 'r' || e.key === 'R') {
                                    maskState.shape = 'rect';
                                    if (maskState.eraserMode) maskState.eraserMode = false;
                                    if (typeof window.updateShapeUI === 'function') window.updateShapeUI();
                                } else if (e.key === 'c' || e.key === 'C') {
                                    maskState.shape = 'ellipse';
                                    if (maskState.eraserMode) maskState.eraserMode = false;
                                    if (typeof window.updateShapeUI === 'function') window.updateShapeUI();
                                }
                            }
                        }
                    });
                    window.hasEraserShortcut = true;
                }
                updateShapeUI();

                

                if (btnClear) {
                    const newClear = btnClear.cloneNode(true);
                    btnClear.parentNode.replaceChild(newClear, btnClear);
                    newClear.onclick = (e) => {
                        e.preventDefault();
                        if (confirm('현재 페이지의 마스킹을 모두 지우시겠습니까?')) {
                            const fIdx = maskState.previewIndex;
                            const pIdx = maskState.previewPage;
                            if (maskState.masks[fIdx] && maskState.masks[fIdx][pIdx]) {
                                maskState.masks[fIdx][pIdx] = [];
                                drawMaskOverlay();
                            }
                        }
                    };
                }
            },
            onExecute: async (workspace) => {
                if (workspace.selectedFiles.length === 0) {
                    alert('파일을 선택해 주세요.');
                    return;
                }

                try {
                    workspace.showProgress();
                    workspace.setProgress(5, '마스킹 준비 중...');

                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const { PDFDocument } = window.PDFLib;
                    
                    const mergedPdf = await PDFDocument.create();

                    const totalFiles = workspace.selectedFiles.length;
                    let processedPages = 0;
                    let totalPages = 0;

                    for (let fIdx = 0; fIdx < totalFiles; fIdx++) {
                        const fileObj = workspace.selectedFiles[fIdx];
                        const arrayBuffer = await fileObj.file.arrayBuffer();
                        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                        totalPages += pdfDoc.numPages;
                    }

                    for (let fIdx = 0; fIdx < totalFiles; fIdx++) {
                        const fileObj = workspace.selectedFiles[fIdx];
                        const arrayBuffer = await fileObj.file.arrayBuffer();
                        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                        // Load into pdf-lib for native copying of unmasked pages
                        const pdfLibDoc = await PDFDocument.load(arrayBuffer.slice(0));

                        for (let pIdx = 1; pIdx <= pdfDoc.numPages; pIdx++) {
                            processedPages++;
                            workspace.setProgress(
                                5 + Math.floor((processedPages / totalPages) * 80),
                                `페이지 처리 중... (${processedPages} / ${totalPages})`
                            );
                            
                            const masksOnPage = maskState.masks[fIdx] && maskState.masks[fIdx][pIdx] && maskState.masks[fIdx][pIdx].length > 0;

                            if (masksOnPage) {
                                // 가려질 영역이 있는 페이지 -> 캔버스로 렌더링 후 이미지(JPEG)로 완전 병합 (보안)
                                const page = await pdfDoc.getPage(pIdx);
                                const scale = 2.0; 
                                const viewport = page.getViewport({ scale: scale });

                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = viewport.width;
                                canvas.height = viewport.height;

                                const renderContext = {
                                    canvasContext: ctx,
                                    viewport: viewport
                                };
                                await page.render(renderContext).promise;

                                const mapScale = scale / 1.5; // Preview is at 1.5 scale
                                maskState.masks[fIdx][pIdx].forEach(m => {
                                    ctx.fillStyle = m.color;
                                    if (m.shape === 'ellipse') {
                                        ctx.beginPath();
                                        ctx.ellipse(m.x * mapScale + (m.w * mapScale)/2, m.y * mapScale + (m.h * mapScale)/2, Math.abs(m.w * mapScale)/2, Math.abs(m.h * mapScale)/2, 0, 0, 2 * Math.PI);
                                        ctx.fill();
                                    } else {
                                        ctx.fillRect(m.x * mapScale, m.y * mapScale, m.w * mapScale, m.h * mapScale);
                                    }
                                });

                                const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                                const base64Data = imgDataUrl.split(',')[1];
                                const binaryString = window.atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }
                                
                                const image = await mergedPdf.embedJpg(bytes);
                                
                                const pdfPage = mergedPdf.addPage([viewport.width / scale, viewport.height / scale]);
                                pdfPage.drawImage(image, {
                                    x: 0,
                                    y: 0,
                                    width: viewport.width / scale,
                                    height: viewport.height / scale
                                });
                            } else {
                                // 가려질 영역이 없는 페이지 -> 원본 벡터 상태 그대로 복사 (속도 및 용량 최적화)
                                const [copiedPage] = await mergedPdf.copyPages(pdfLibDoc, [pIdx - 1]);
                                mergedPdf.addPage(copiedPage);
                            }
                        }
                    }

                    workspace.setProgress(90, '최종 파일 생성 중...');
                    const pdfBytes = await mergedPdf.save();
                    
                    workspace.setProgress(100, '완료!');
                    
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    let outName = document.getElementById('input-filename-masking').value || 'Masked_Document';
                    if (!outName.toLowerCase().endsWith('.pdf')) outName += '.pdf';
                    a.download = outName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    workspace.completeProgress('마스킹이 성공적으로 적용되었습니다!');

                } catch (err) {
                    workspace.hideProgress();
                    console.error(err);
                    alert('마스킹 도중 오류가 발생했습니다: ' + err.message);
                }
            }
        });

        return maskingWorkspace;
    };

})();
