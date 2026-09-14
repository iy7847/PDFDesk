window.PDFDesk = window.PDFDesk || {};

(function() {
    'use strict';
    const PDFDesk = window.PDFDesk;

    // 3. 리사이징 및 병합 워크스페이스 인스턴스
    const ui = PDFDesk.UI;
    const getResizeSettingsHtml = () => {
        const i18n = PDFDesk.i18n;
        const t = (k) => i18n ? i18n.t(k) : k;

        return `
            ${ui.select({
                id: 'select-size-resize',
                label: t('ws_resize_paper_size'),
                options: [
                    { value: 'A4', label: t('ws_resize_size_a4'), selected: true },
                    { value: 'A3', label: t('ws_resize_size_a3') },
                    { value: 'A2', label: t('ws_resize_size_a2') },
                    { value: 'A1', label: t('ws_resize_size_a1') },
                    { value: 'A0', label: t('ws_resize_size_a0') },
                    { value: 'ORIGINAL', label: t('ws_resize_size_orig') }
                ]
            })}
            ${ui.select({
                id: 'select-orientation-resize',
                label: t('ws_resize_orientation'),
                options: [
                    { value: 'AUTO', label: t('ws_resize_orient_auto'), selected: true },
                    { value: 'PORTRAIT', label: t('ws_resize_orient_port') },
                    { value: 'LANDSCAPE', label: t('ws_resize_orient_land') }
                ]
            })}
            ${ui.checkbox({
                id: 'check-toc-resize',
                label: t('ws_resize_toc'),
                description: t('ws_resize_toc_desc')
            })}
            ${ui.filenameInput({
                id: 'input-filename-resize',
                label: t('ws_filename_label'),
                placeholder: t('ws_filename_placeholder')
            })}
        `;
    };

    PDFDesk.initResize = function() {
        const workspace = new PDFDesk.WorkspaceTool({
            id: 'resize',
            titleKey: 'ws_resize_title',
            title: '용지 크기 통일 & 병합',
            executeBtnKey: 'ws_resize_btn',
            executeBtnText: '병합 실행하기',
            settingsHtml: getResizeSettingsHtml,
            onFilesChanged: (files, workspace) => {
                if (files.length > 0) {
                    const inputFilename = document.getElementById('input-filename-resize');
                    if (!inputFilename.value) {
                        const fileObj = files[0];
                        const originalName = fileObj.file.name.replace(/\.[^/.]+$/, "");
                        inputFilename.value = `${originalName}_Merged`;
                    }
                }
            },
            onExecute: async (workspace) => {
                try {
                    workspace.showProgress();
                    workspace.setProgress(0, '메모리 초기화 중...');

                    const { PDFDocument, rgb, degrees } = window.PDFLib;
                    const mergedPdf = await PDFDocument.create();

                    const selectSize = document.getElementById('select-size-resize');
                    const selectOrientation = document.getElementById('select-orientation-resize');
                    const checkToc = document.getElementById('check-toc-resize');
                    const inputFilename = document.getElementById('input-filename-resize');

                    const targetSize = selectSize.value;
                    const targetOrientationVal = selectOrientation ? selectOrientation.value : 'AUTO';
                    const includeToc = checkToc.checked;
                    
                    let totalFiles = workspace.selectedFiles.length;
                    let tocData = []; 
                    let currentOutputPageNumber = 1; 

                    for (let i = 0; i < totalFiles; i++) {
                        const fObj = workspace.selectedFiles[i];
                        workspace.setProgress(Math.round((i / totalFiles) * 80), `[${i + 1}/${totalFiles}] ${fObj.file.name} 처리 중...`);
                        
                        tocData.push({ filename: fObj.file.name, startPage: currentOutputPageNumber });

                        const arrayBuffer = await fObj.file.arrayBuffer();
                        const pdf = await PDFDesk.Utils.loadPdfSafely(arrayBuffer, {}, (cur, tot, msg) => {
                            const basePercent = Math.round((i / totalFiles) * 80);
                            const stepPercent = Math.round((cur / tot) * (80 / totalFiles));
                            workspace.setProgress(basePercent + stepPercent, `[${i + 1}/${totalFiles}] ${fObj.file.name}: ${msg}`);
                        });
                        const pageIndices = pdf.getPageIndices();
                        
                        if (targetSize === 'ORIGINAL') {
                            const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
                            copiedPages.forEach(page => {
                                mergedPdf.addPage(page);
                                currentOutputPageNumber++;
                            });
                        } else {
                            const targetDims = PDFDesk.PAGE_SIZES[targetSize];
                            for (const idx of pageIndices) {
                                const page = pdf.getPage(idx);
                                const embeddedPage = await mergedPdf.embedPage(page);
                                const { width, height } = embeddedPage;
                                
                                let targetWidth = targetDims[0];
                                let targetHeight = targetDims[1];
                                let needsRotation = false;
                                
                                if (targetOrientationVal === 'AUTO') {
                                    // 원본이 가로 방향(Landscape)이면 타겟 용지도 가로 방향으로 변경
                                    if (width > height) {
                                        targetWidth = targetDims[1];
                                        targetHeight = targetDims[0];
                                    }
                                } else if (targetOrientationVal === 'LANDSCAPE') {
                                    // 무조건 가로 고정
                                    targetWidth = Math.max(targetDims[0], targetDims[1]);
                                    targetHeight = Math.min(targetDims[0], targetDims[1]);
                                    if (width <= height) needsRotation = true; // 세로 원본을 가로 용지에 넣을 때 회전
                                } else if (targetOrientationVal === 'PORTRAIT') {
                                    // 무조건 세로 고정
                                    targetWidth = Math.min(targetDims[0], targetDims[1]);
                                    targetHeight = Math.max(targetDims[0], targetDims[1]);
                                    if (width > height) needsRotation = true; // 가로 원본을 세로 용지에 넣을 때 회전
                                }
                                
                                const newPage = mergedPdf.addPage([targetWidth, targetHeight]);
                                
                                if (needsRotation) {
                                    // 회전하여 넣는 경우 (가로/세로가 뒤바뀜)
                                    const scale = Math.min(targetWidth / height, targetHeight / width);
                                    const scaledWidth = width * scale;
                                    const scaledHeight = height * scale;
                                    
                                    const xOffset = (targetWidth - scaledHeight) / 2;
                                    const yOffset = (targetHeight - scaledWidth) / 2;
                                    
                                    newPage.drawPage(embeddedPage, {
                                        x: xOffset + scaledHeight,
                                        y: yOffset,
                                        width: scaledWidth,
                                        height: scaledHeight,
                                        rotate: degrees(90),
                                    });
                                } else {
                                    // 회전 없이 넣는 경우
                                    const scale = Math.min(targetWidth / width, targetHeight / height);
                                    const scaledWidth = width * scale;
                                    const scaledHeight = height * scale;
                                    
                                    newPage.drawPage(embeddedPage, {
                                        x: (targetWidth - scaledWidth) / 2,
                                        y: (targetHeight - scaledHeight) / 2,
                                        width: scaledWidth,
                                        height: scaledHeight,
                                    });
                                }
                                currentOutputPageNumber++;
                            }
                        }
                    }

                    if (includeToc && tocData.length > 0) {
                        workspace.setProgress(85, '목차(TOC) 생성 중...');
                        const tocPage = mergedPdf.insertPage(0, [595.28, 841.89]);
                        const { width, height } = tocPage.getSize();
                        
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const scale = 2;
                        canvas.width = width * scale;
                        canvas.height = height * scale;
                        ctx.scale(scale, scale);
                        
                        ctx.fillStyle = '#1e293b';
                        ctx.font = 'bold 24px "Noto Sans KR", "Malgun Gothic", sans-serif';
                        ctx.fillText('Table of Contents', 50, 70);
                        
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(50, 85);
                        ctx.lineTo(width - 50, 85);
                        ctx.stroke();

                        ctx.font = '13px "Noto Sans KR", "Malgun Gothic", sans-serif';
                        let yPosition = 120;
                        tocData.forEach((item, idx) => {
                            const displayName = `${idx + 1}. ${item.filename}`;
                            const pageText = `Page ${item.startPage + 1}`;
                            
                            ctx.fillStyle = '#334155';
                            ctx.textAlign = 'left';
                            ctx.fillText(displayName.substring(0, 50) + (displayName.length > 50 ? '...' : ''), 50, yPosition);
                            
                            ctx.fillStyle = '#64748b';
                            ctx.textAlign = 'right';
                            ctx.fillText(pageText, width - 50, yPosition);
                            
                            ctx.save();
                            ctx.setLineDash([2, 4]);
                            ctx.strokeStyle = '#cbd5e1';
                            ctx.beginPath();
                            const textW = Math.min(ctx.measureText(displayName).width, 350);
                            ctx.moveTo(50 + textW + 10, yPosition - 4);
                            ctx.lineTo(width - 110, yPosition - 4);
                            ctx.stroke();
                            ctx.restore();
                            
                            yPosition += 26;
                        });
                        
                        const dataUrl = canvas.toDataURL('image/png');
                        const base64Data = dataUrl.split(',')[1];
                        const binaryString = window.atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let b = 0; b < binaryString.length; b++) { bytes[b] = binaryString.charCodeAt(b); }
                        
                        const tocImage = await mergedPdf.embedPng(bytes);
                        tocPage.drawImage(tocImage, { x: 0, y: 0, width: width, height: height });
                    }

                    workspace.setProgress(90, '최종 병합 및 파일 생성 중... (잠시 멈출 수 있습니다)');
                    const mergedPdfBytes = await mergedPdf.save();
                    
                    workspace.setProgress(100, '완료! 다운로드가 시작됩니다.');

                    const filename = PDFDesk.Utils.buildFilename(inputFilename.value, 'Merged', '.pdf');
                    PDFDesk.Utils.downloadFile(mergedPdfBytes, filename, 'application/pdf');

                    workspace.completeProgress('파일이 성공적으로 다운로드되었습니다!');

                } catch (error) {
                    PDFDesk.Utils.handlePdfError(error, workspace);
                }
            }
        });
        return workspace;
    };
})();
