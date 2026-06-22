window.PDFDesk = window.PDFDesk || {};

(function() {
    'use strict';
    const PDFDesk = window.PDFDesk;

    // 3. 리사이징 및 병합 워크스페이스 인스턴스
    const resizeSettingsHtml = `
        <div class="mb-4">
            <label class="block font-body-sm text-on-surface font-semibold mb-1">용지 크기</label>
            <select id="select-size-resize" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                <option value="A4" selected>A4 사이즈 (강제 맞춤)</option>
                <option value="A3">A3 사이즈</option>
                <option value="A2">A2 사이즈</option>
                <option value="A1">A1 사이즈</option>
                <option value="A0">A0 사이즈</option>
                <option value="ORIGINAL">원본 사이즈 유지 (가장 빠름)</option>
            </select>
        </div>
        <div class="mb-4">
            <label class="block font-body-sm text-on-surface font-semibold mb-1">용지 방향</label>
            <select id="select-orientation-resize" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                <option value="AUTO" selected>자동 (원본 방향에 맞춤)</option>
                <option value="PORTRAIT">세로 고정 (Portrait)</option>
                <option value="LANDSCAPE">가로 고정 (Landscape)</option>
            </select>
        </div>
        <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" id="check-toc-resize" class="w-4 h-4 text-primary bg-surface-bright border-outline-variant rounded focus:ring-primary focus:ring-2 cursor-pointer">
                <span class="font-body-sm text-on-surface group-hover:text-primary transition-colors">자동 목차(TOC) 생성</span>
            </label>
            <p class="text-[11px] text-on-surface-variant mt-1 ml-6 leading-tight">병합된 파일의 맨 앞 장에 각 파일의 시작 페이지를 알려주는 목차를 추가합니다.</p>
        </div>
        <div class="mb-6">
            <label class="block font-body-sm text-on-surface font-semibold mb-1">출력 파일명</label>
            <input type="text" id="input-filename-resize" placeholder="기본값: 자동으로 생성됨" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
        </div>
    `;

    PDFDesk.initResize = function() {
        const workspace = new PDFDesk.WorkspaceTool({
            id: 'resize',
            title: '용지 크기 통일 & 병합',
            executeBtnText: '병합 실행하기',
            settingsHtml: resizeSettingsHtml,
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
                        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, throwOnInvalidObject: false });
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

                    if (includeToc) {
                        workspace.setProgress(85, '목차(TOC) 생성 중...');
                        const font = await mergedPdf.embedFont(window.PDFLib.StandardFonts.Helvetica);
                        const tocPage = mergedPdf.insertPage(0, [595.28, 841.89]);
                        const { width, height } = tocPage.getSize();
                        
                        tocPage.drawText('Table of Contents', { x: 50, y: height - 80, size: 24, font: font, color: rgb(0, 0, 0) });

                        let yPosition = height - 130;
                        tocData.forEach((item, idx) => {
                            const safeName = item.filename.replace(/[^\x00-\x7F]/g, "_");
                            const text = `${idx + 1}. ${safeName}`;
                            const pageText = `Page ${item.startPage + 1}`; 

                            tocPage.drawText(text.substring(0, 50) + (text.length > 50 ? '...' : ''), { x: 50, y: yPosition, size: 12, font });
                            tocPage.drawText(pageText, { x: width - 100, y: yPosition, size: 12, font });
                            
                            tocPage.drawLine({
                                start: { x: 50 + font.widthOfTextAtSize(text.substring(0, 50), 12) + 10, y: yPosition + 4 },
                                end: { x: width - 110, y: yPosition + 4 },
                                thickness: 1,
                                color: rgb(0.8, 0.8, 0.8),
                                dashArray: [2, 2]
                            });

                            yPosition -= 25;
                        });
                    }

                    workspace.setProgress(90, '최종 병합 및 파일 생성 중... (잠시 멈출 수 있습니다)');
                    const mergedPdfBytes = await mergedPdf.save();
                    
                    workspace.setProgress(100, '완료! 다운로드가 시작됩니다.');

                    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    
                    let outputName = inputFilename.value.trim();
                    if (!outputName) {
                        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                        outputName = `PDFDesk_Merged_${dateStr}.pdf`;
                    } else if (!outputName.toLowerCase().endsWith('.pdf')) {
                        outputName += '.pdf';
                    }

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = outputName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    workspace.completeProgress('파일이 성공적으로 다운로드되었습니다!');

                } catch (error) {
                    console.error('PDF 처리 중 오류:', error);
                    let errMsg = '처리 중 오류가 발생했습니다.';
                    if (error.message && (error.message.includes('Expected instance') || error.message.includes('Invalid object'))) {
                        errMsg = '일부 PDF 파일의 내부 구조가 손상되었거나 표준 규격과 맞지 않아 처리할 수 없습니다.\n크롬 브라우저에서 해당 파일을 열고 "PDF로 인쇄"를 통해 새 파일로 저장한 후 다시 시도해 보세요.';
                    } else if (error.message && error.message.toLowerCase().includes('encrypted')) {
                        errMsg = '보안(암호)이 설정된 PDF는 처리할 수 없습니다.';
                    }
                    alert(errMsg);
                    workspace.hideProgress();
                }
            }
        });
        return workspace;
    };
})();
