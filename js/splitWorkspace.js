window.PDFDesk = window.PDFDesk || {};

(function() {
    'use strict';
    const PDFDesk = window.PDFDesk;

    // ----------------------------------------------------
    // 3. 분할 (Split) Workspace 인스턴스 생성
    // ----------------------------------------------------
    function parseRange(rangeStr, maxPage) {
        if (!rangeStr.trim()) {
            const arr = [];
            for(let i=1; i<=maxPage; i++) arr.push(i);
            return arr;
        }
        const pages = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const p = part.trim();
            if (!p) continue;
            if (p.includes('-')) {
                const [start, end] = p.split('-').map(n => parseInt(n, 10));
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPage) pages.add(i);
                    }
                }
            } else {
                const num = parseInt(p, 10);
                if (!isNaN(num) && num >= 1 && num <= maxPage) {
                    pages.add(num);
                }
            }
        }
        return Array.from(pages).sort((a,b) => a-b);
    }

    const ui = PDFDesk.UI;
    const getSplitSettingsHtml = () => {
        const i18n = PDFDesk.i18n;
        const t = (k) => i18n ? i18n.t(k) : k;

        const infoContent = i18n && i18n.getLang() === 'en'
            ? `<p class="text-[11px] text-on-surface-variant leading-relaxed">
                    👉 Click pages on the right grid to extract.<br>
                    (Hold Ctrl or Shift to select multiple pages at once.)
               </p>`
            : `<p class="text-[11px] text-on-surface-variant leading-relaxed">
                    👉 우측 그리드에서 분할(추출)할 페이지를 마우스로 직접 클릭하여 선택하세요.<br>
                    (Ctrl, Shift 키를 누른 채 클릭하면 여러 장을 동시에 선택할 수 있습니다.)
               </p>`;

        return `
            ${ui.card({
                title: i18n && i18n.getLang() === 'en' ? 'Visual Page Selection' : '페이지 시각적 선택',
                icon: 'touch_app',
                content: infoContent
            })}
            ${ui.filenameInput({
                id: 'input-filename-split',
                label: t('ws_filename_label'),
                placeholder: t('ws_filename_placeholder'),
                hint: i18n && i18n.getLang() === 'en' ? 'Saves as ZIP containing individual split PDFs.' : '이 이름으로 ZIP 파일과 내부 분할 파일(예: 파일명_001.pdf)이 저장됩니다.'
            })}
        `;
    };

    // 분할에서는 사용자가 썸네일 그리드에서 최종 확정한 페이지 목록을 임시 저장
    let currentSplitTargetPages = [];

    let splitSelectedItems = new Set();
    let splitLastClickedItem = null;
    let splitIntersectionObserver = null;
    
    function updateSplitSelectionUI() {
        const countEl = document.getElementById('split-selected-count');
        if (countEl) {
            countEl.textContent = splitSelectedItems.size;
        }
        const grid = document.getElementById('inline-preview-grid');
        if (!grid) return;
        Array.from(grid.children).forEach(child => {
            const pNum = parseInt(child.dataset.page);
            if (isNaN(pNum)) return;
            const imgCont = child.querySelector('.overflow-hidden');
            if (!imgCont) return;
            
            if (splitSelectedItems.has(pNum)) {
                imgCont.classList.add('ring-4', 'ring-primary', 'bg-primary/5', 'border-primary');
                imgCont.classList.remove('border-outline-variant/50');
            } else {
                imgCont.classList.remove('ring-4', 'ring-primary', 'bg-primary/5', 'border-primary');
                imgCont.classList.add('border-outline-variant/50');
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            const splitPanel = document.getElementById('workspace-split');
            if (!splitPanel) return;
            
            if (splitSelectedItems.size > 0) {
                currentSplitTargetPages = currentSplitTargetPages.filter(p => !splitSelectedItems.has(p));
                splitSelectedItems.forEach(pNum => {
                    const child = document.querySelector(`#inline-preview-grid div[data-page="${pNum}"]`);
                    if (child) child.remove();
                });
                splitSelectedItems.clear();
                splitLastClickedItem = null;
                updateSplitSelectionUI();
            }
        }
    });

    async function renderSplitPagesInline(workspace, rangeStr) {
        if (workspace.selectedFiles.length === 0) return;
        const fileObj = workspace.selectedFiles[0];
        const container = document.getElementById('custom-workspace-split');
        if (!container) return;

        // 이전 파일 선택 상태 초기화
        splitSelectedItems.clear();
        splitLastClickedItem = null;

        const i18n = PDFDesk.i18n;
        const t = (k) => i18n ? i18n.t(k) : k;

        // Render header (filename)
        const sizeMb = (fileObj.file.size / 1024 / 1024).toFixed(2);
        container.innerHTML = `
            <div class="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    </div>
                    <div>
                        <div class="font-body-md font-bold text-on-surface">${fileObj.file.name}</div>
                        <div class="text-[11px] text-on-surface-variant">${sizeMb} MB</div>
                    </div>
                </div>
                ${ui.button({ id: 'btn-clear-split-file', text: t('ws_modal_close'), icon: 'close', variant: 'danger' })}
            </div>
            
            <!-- 빠른 선택 툴바 -->
            <div class="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant shadow-sm mb-4">
                <div class="flex items-center gap-2 font-body-sm text-on-surface">
                    <span class="material-symbols-outlined text-primary text-[20px]">checklist</span>
                    <span>${t('ws_selected_files')} <strong id="split-selected-count" class="text-primary font-bold">0</strong></span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    ${ui.button({ id: 'btn-split-select-all', text: t('ws_split_quick_all'), icon: 'select_all', variant: 'tonal', extraClasses: '!py-1.5 !px-3 text-xs whitespace-nowrap' })}
                    ${ui.button({ id: 'btn-split-select-none', text: t('ws_split_quick_clear'), icon: 'deselect', variant: 'ghost', extraClasses: '!py-1.5 !px-3 text-xs whitespace-nowrap' })}
                    ${ui.button({ id: 'btn-split-select-odd', text: t('ws_split_quick_odd'), icon: 'filter_1', variant: 'ghost', extraClasses: '!py-1.5 !px-3 text-xs whitespace-nowrap' })}
                    ${ui.button({ id: 'btn-split-select-even', text: t('ws_split_quick_even'), icon: 'filter_2', variant: 'ghost', extraClasses: '!py-1.5 !px-3 text-xs whitespace-nowrap' })}
                </div>
            </div>
            
            <div class="mb-4">
                ${ui.infoBox({ text: i18n && i18n.getLang() === 'en' ? '<b>Only selected pages will be extracted.</b> Use the toolbar above or click thumbnails (with Ctrl/Shift) to select pages.' : '<b>선택된 페이지만 개별 PDF로 분할됩니다.</b> 상단 툴바를 이용하거나 마우스 클릭(Ctrl, Shift 조합)으로 추출할 페이지를 선택하세요.', type: 'info', icon: 'lightbulb' })}
            </div>
            
            <div id="inline-preview-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <div class="col-span-full text-center py-10 text-on-surface-variant">${i18n && i18n.getLang() === 'en' ? 'Rendering pages...' : '페이지 렌더링 중...'}</div>
            </div>
        `;

        document.getElementById('btn-clear-split-file').addEventListener('click', () => {
            splitSelectedItems.clear();
            splitLastClickedItem = null;
            workspace.selectedFiles = [];
            workspace.updateUI();
        });

        // 빠른 선택 툴바 이벤트 바인딩
        document.getElementById('btn-split-select-all').addEventListener('click', () => {
            currentSplitTargetPages.forEach(p => splitSelectedItems.add(p));
            updateSplitSelectionUI();
        });

        document.getElementById('btn-split-select-none').addEventListener('click', () => {
            splitSelectedItems.clear();
            splitLastClickedItem = null;
            updateSplitSelectionUI();
        });

        document.getElementById('btn-split-select-odd').addEventListener('click', () => {
            splitSelectedItems.clear();
            splitLastClickedItem = null;
            currentSplitTargetPages.filter(p => p % 2 !== 0).forEach(p => splitSelectedItems.add(p));
            updateSplitSelectionUI();
        });

        document.getElementById('btn-split-select-even').addEventListener('click', () => {
            splitSelectedItems.clear();
            splitLastClickedItem = null;
            currentSplitTargetPages.filter(p => p % 2 === 0).forEach(p => splitSelectedItems.add(p));
            updateSplitSelectionUI();
        });

        const grid = document.getElementById('inline-preview-grid');

        try {
            const arrayBuffer = await fileObj.file.arrayBuffer();

            // 기존 옵저버 초기화
            if (splitIntersectionObserver) {
                splitIntersectionObserver.disconnect();
            }

            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            const pdfjsTask = pdfjsLib.getDocument({ 
                data: arrayBuffer.slice(0),
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });
            const pdfjsDoc = await pdfjsTask.promise;
            
            const totalPages = pdfjsDoc.numPages;
            const pageNumbers = parseRange(rangeStr, totalPages);
            currentSplitTargetPages = [...pageNumbers];

            grid.innerHTML = '';
            
            if (currentSplitTargetPages.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant">해당 범위의 페이지가 존재하지 않습니다.</div>';
                return;
            }

            // Lazy Loading을 위한 Intersection Observer 생성
            splitIntersectionObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        obs.unobserve(target); // 렌더링 시작하면 감시 해제
                        const pageNum = parseInt(target.dataset.page);
                        renderSinglePage(target, pageNum, pdfjsDoc);
                    }
                });
            }, { rootMargin: '300px' }); // 화면에 보이기 300px 전부터 렌더링 시작

            async function renderSinglePage(itemDiv, pageNum, pdfjsDoc) {
                try {
                    const page = await pdfjsDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const scale = 200 / viewport.width; 
                    const scaledViewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;
                    canvas.className = 'w-full h-auto border border-outline-variant/30 rounded';

                    const renderContext = { canvasContext: context, viewport: scaledViewport };
                    await page.render(renderContext).promise;
                    
                    // 렌더링 성공 후 Placeholder 내용 비우기
                    itemDiv.innerHTML = '';
                    itemDiv.className = 'relative flex flex-col items-center gap-2 group cursor-pointer';

                    const label = document.createElement('div');
                    label.className = 'text-[12px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded';
                    label.textContent = `Page ${pageNum}`;

                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'relative w-full bg-surface-bright rounded shadow-sm overflow-hidden p-1 border border-outline-variant/50 group-hover:border-primary/50 transition-colors';
                    imgContainer.appendChild(canvas);
                    
                    itemDiv.appendChild(imgContainer);
                    itemDiv.appendChild(label);

                    itemDiv.addEventListener('click', (e) => {
                        if (e.target.closest('button')) return;
                        const grid = document.getElementById('inline-preview-grid');
                        
                        if (e.shiftKey && splitLastClickedItem !== null) {
                            const allPages = Array.from(grid.children).map(child => parseInt(child.dataset.page)).filter(p => !isNaN(p));
                            const idx1 = allPages.indexOf(splitLastClickedItem);
                            const idx2 = allPages.indexOf(pageNum);
                            
                            if (idx1 !== -1 && idx2 !== -1) {
                                const start = Math.min(idx1, idx2);
                                const end = Math.max(idx1, idx2);
                                
                                if (!e.ctrlKey && !e.metaKey) {
                                    splitSelectedItems.clear();
                                }
                                
                                for (let i = start; i <= end; i++) {
                                    splitSelectedItems.add(allPages[i]);
                                }
                            }
                        } else if (e.ctrlKey || e.metaKey) {
                            if (splitSelectedItems.has(pageNum)) {
                                splitSelectedItems.delete(pageNum);
                            } else {
                                splitSelectedItems.add(pageNum);
                            }
                            splitLastClickedItem = pageNum;
                        } else {
                            splitSelectedItems.clear();
                            splitSelectedItems.add(pageNum);
                            splitLastClickedItem = pageNum;
                        }
                        
                        updateSplitSelectionUI();
                    });
                } catch (err) {
                    console.error(`Page ${pageNum} render error:`, err);
                    itemDiv.innerHTML = '<div class="text-error text-[10px] font-bold">렌더링 실패</div>';
                }
            }

            // 모든 페이지에 대해 즉시 Placeholder 생성 후 옵저버 등록 (순식간에 처리됨)
            for (const pageNum of pageNumbers) {
                if (pageNum > totalPages) continue;
                
                const itemDiv = document.createElement('div');
                // Placeholder 스타일 (임시 높이 지정으로 스크롤 생성)
                itemDiv.className = 'relative flex flex-col items-center justify-center gap-2 w-full aspect-[1/1.4] bg-surface-container-lowest border border-outline-variant/30 rounded animate-pulse';
                itemDiv.dataset.page = pageNum;
                itemDiv.innerHTML = '<span class="text-on-surface-variant text-[11px] flex items-center gap-1"><span class="material-symbols-outlined text-[14px] animate-spin">sync</span> Loading...</span>';
                
                grid.appendChild(itemDiv);
                splitIntersectionObserver.observe(itemDiv);
            }

        } catch (err) {
            console.error('미리보기 렌더링 에러:', err);
            let errMsg = '미리보기를 불러오는 중 오류가 발생했습니다.';
            if (err.message && err.message.toLowerCase().includes('encrypted')) {
                errMsg = '보안(암호)이 설정된 PDF는 처리할 수 없습니다.';
            }
            if(grid) grid.innerHTML = `<div class="col-span-full text-center py-10 text-error font-bold">${errMsg}</div>`;
        }
    }

    PDFDesk.initSplit = function() {
        const workspace = new PDFDesk.WorkspaceTool({
            id: 'split',
            singleFile: true,
            titleKey: 'ws_split_title',
            title: '대용량 PDF 문서 분할',
            executeBtnKey: 'ws_split_btn',
            executeBtnText: '선택 페이지 분할 다운로드 (ZIP)',
            settingsHtml: getSplitSettingsHtml,
            hideDefaultGrid: true,
            onFilesChanged: (files, workspace) => {
                splitSelectedItems.clear();
                splitLastClickedItem = null;
                if (files.length > 0) {
                    const inputFilename = document.getElementById('input-filename-split');
                    if (!inputFilename.value) {
                        const fileObj = files[0];
                        const originalName = fileObj.file.name.replace(/\.[^/.]+$/, "");
                        inputFilename.value = `${originalName}_Split`;
                    }
                    const rangeStr = ""; // 전체 페이지 렌더링
                    renderSplitPagesInline(workspace, rangeStr);
                }
            },
            onExecute: async (workspace) => {
                if (workspace.selectedFiles.length === 0) return;
                const fileObj = workspace.selectedFiles[0];
                
                try {
                    workspace.showProgress();
                    workspace.setProgress(0, '파일 분석 중...');

                    const { PDFDocument } = window.PDFLib;
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const pdfDoc = await PDFDesk.Utils.loadPdfSafely(arrayBuffer, {}, (cur, tot, msg) => {
                        workspace.setProgress(Math.round((cur / tot) * 10), msg);
                    });
                    const totalPages = pdfDoc.getPageCount();

                    // 타겟 페이지 결정 (마우스로 선택한 페이지들)
                    let targetPages = [];
                    if (splitSelectedItems.size > 0) {
                        targetPages = Array.from(splitSelectedItems).sort((a,b) => a - b);
                    }

                    if (targetPages.length === 0) {
                        alert('분할할 페이지를 최소 1개 이상 마우스로 클릭하여 선택해주세요.');
                        workspace.hideProgress();
                        return;
                    }

                    let outputName = document.getElementById('input-filename-split').value.trim();
                    let baseName = outputName.replace(/\.zip$/i, '');
                    if (!baseName) {
                        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                        const originalName = fileObj.file.name.replace(/\.[^/.]+$/, "");
                        baseName = `${originalName}_Split_${dateStr}`;
                    }

                    workspace.setProgress(10, 'ZIP 압축 준비 중...');
                    const zip = new JSZip();

                    for (let i = 0; i < targetPages.length; i++) {
                        const pageNum = targetPages[i];
                        workspace.setProgress(10 + Math.round((i / targetPages.length) * 70), `Page ${pageNum} 분할 및 압축 중...`);
                        
                        const newPdf = await PDFDocument.create();
                        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
                        newPdf.addPage(copiedPage);
                        const pdfBytes = await newPdf.save();
                        
                        const paddedIndex = String(i + 1).padStart(3, '0');
                        zip.file(`${baseName}_${paddedIndex}.pdf`, pdfBytes);
                    }

                    workspace.setProgress(85, '최종 ZIP 파일 생성 중... (잠시 멈출 수 있습니다)');
                    const zipContent = await zip.generateAsync({ type: 'blob' });

                    workspace.setProgress(100, '완료! 다운로드가 시작됩니다.');

                    const finalZipName = `${baseName}.zip`;
                    PDFDesk.Utils.downloadFile(zipContent, finalZipName, 'application/zip');

                    workspace.completeProgress('분할이 성공적으로 완료되었습니다!');
                } catch (error) {
                    PDFDesk.Utils.handlePdfError(error, workspace);
                }
            }
        });
        return workspace;
    };
})();
