/**
 * PDFDesk - PagePreviewModal 모듈
 * 모든 처리는 100% 브라우저 클라이언트 사이드에서 이루어집니다.
 */
window.PDFDesk = window.PDFDesk || {};

(function() {
    // 1.6. 페이지 미리보기 모달 (Page Preview Modal)
    class PagePreviewModal {
        static init() {
            const container = document.getElementById('global-modal-container');
            if(!container) return;
            const modalHtml = `
                <div id="preview-modal-backdrop" class="fixed inset-0 bg-surface-lowest/80 backdrop-blur-sm z-50 hidden flex-col items-center justify-center p-4">
                    <div class="bg-surface-bright w-full max-w-5xl h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-outline-variant">
                        <!-- Header -->
                        <div class="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
                            <div class="flex justify-between items-center mb-1">
                                <h3 class="font-headline-md text-headline-sm font-bold text-on-surface flex items-center gap-2">
                                    <span class="material-symbols-outlined text-primary">preview</span>
                                    선택된 페이지 확인 및 제외
                                </h3>
                                <button id="preview-modal-close" class="text-on-surface-variant hover:text-error transition-colors">
                                    <span class="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <p class="text-sm text-on-surface-variant ml-8">썸네일 우측 상단의 <span class="material-symbols-outlined text-[14px] text-error align-middle">delete</span> 버튼을 눌러 최종 분할 대상에서 제외시킬 수 있습니다.</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
                            <div id="preview-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                <!-- Thumbnails injected here -->
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest shrink-0 flex justify-end">
                            <button id="preview-modal-apply" class="px-6 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-bold transition-colors">
                                적용하기
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('preview-modal-close').addEventListener('click', PagePreviewModal.hide);
            document.getElementById('preview-modal-apply').addEventListener('click', () => {
                if (PagePreviewModal.onApplyCallback) PagePreviewModal.onApplyCallback(PagePreviewModal.currentPages);
                PagePreviewModal.hide();
            });
        }

        static async show(file, pageNumbers, onApply) {
            PagePreviewModal.currentPages = [...pageNumbers];
            PagePreviewModal.onApplyCallback = onApply;
            
            const grid = document.getElementById('preview-grid');
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant">로딩 중...</div>';
            
            document.getElementById('preview-modal-backdrop').classList.remove('hidden');
            document.getElementById('preview-modal-backdrop').classList.add('flex');

            try {
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ 
                    data: arrayBuffer.slice(0),
                    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true
                });
                const pdf = await loadingTask.promise;
                
                grid.innerHTML = '';
                
                for (const pageNum of pageNumbers) {
                    if (pageNum > pdf.numPages) continue;
                    
                    const page = await pdf.getPage(pageNum);
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
                    
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'relative flex flex-col items-center gap-2 group';
                    itemDiv.dataset.page = pageNum;
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'absolute top-1 right-1 bg-error/90 text-on-error w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error shadow-sm';
                    deleteBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">delete</span>';
                    
                    deleteBtn.addEventListener('click', () => {
                        PagePreviewModal.currentPages = PagePreviewModal.currentPages.filter(p => p !== pageNum);
                        itemDiv.remove();
                    });

                    const label = document.createElement('div');
                    label.className = 'text-[12px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded';
                    label.textContent = `Page ${pageNum}`;

                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'relative w-full bg-surface-bright rounded shadow-sm overflow-hidden p-1';
                    imgContainer.appendChild(canvas);
                    imgContainer.appendChild(deleteBtn);
                    
                    itemDiv.appendChild(imgContainer);
                    itemDiv.appendChild(label);
                    
                    grid.appendChild(itemDiv);
                }
                
                if (PagePreviewModal.currentPages.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant">해당 범위의 페이지가 존재하지 않습니다.</div>';
                }

            } catch (err) {
                console.error(err);
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-error">미리보기를 불러오는 중 오류가 발생했습니다.</div>';
            }
        }

        static hide() {
            document.getElementById('preview-modal-backdrop').classList.add('hidden');
            document.getElementById('preview-modal-backdrop').classList.remove('flex');
        }
    }

    window.PDFDesk.PagePreviewModal = PagePreviewModal;
})();
