window.PDFDesk = window.PDFDesk || {};

(function() {
    const PDFDesk = window.PDFDesk;

    // 2. 공용 워크스페이스 클래스 정의
    class WorkspaceTool {
        constructor(config) {
            this.id = config.id;
            this.title = config.title;
            this.titleKey = config.titleKey;
            this.settingsHtml = config.settingsHtml;
            this.executeBtnText = config.executeBtnText;
            this.executeBtnKey = config.executeBtnKey;
            this.onExecute = config.onExecute;
            this.onRender = config.onRender;
            this.onFilesChanged = config.onFilesChanged;
            this.singleFile = config.singleFile || false;
            this.hideDefaultGrid = config.hideDefaultGrid || false;
            this.acceptTypes = config.acceptTypes || 'application/pdf';
            this.acceptValidation = config.acceptValidation || ((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

            this.selectedFiles = [];
            this.selectedItems = new Set();
            this.activeItemIndex = 0;
            this.lastClickedItem = null;
            this.onActiveItemChanged = config.onActiveItemChanged;
            this.dragSrcEl = null;
        }

        render() {
            this.clearWorkspace();
            // 메인 템플릿 생성
            const ui = PDFDesk.UI;
            const i18n = PDFDesk.i18n;

            // 동적 언어 번역 지원
            const currentTitle = typeof this.title === 'function' ? this.title() : (this.titleKey && i18n ? i18n.t(this.titleKey) : this.title);
            const currentExecuteBtnText = typeof this.executeBtnText === 'function' ? this.executeBtnText() : (this.executeBtnKey && i18n ? i18n.t(this.executeBtnKey) : this.executeBtnText);
            const currentSettingsHtml = typeof this.settingsHtml === 'function' ? this.settingsHtml() : this.settingsHtml;
            const backText = i18n ? i18n.t('ws_back') : '돌아가기';
            const settingsTitle = i18n ? i18n.t('ws_settings') : '작업 설정';
            const defaultDropzoneText = this.singleFile 
                ? (i18n ? i18n.t('ws_dropzone_pdf_single') : '여기로 1개의 PDF 파일을 드래그하세요')
                : (i18n ? i18n.t('ws_dropzone_pdf_multi') : '여기로 PDF 파일을 드래그하세요');
            const dropzoneSubText = this.singleFile 
                ? `<span class="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[11px]">${i18n ? i18n.t('ws_single_file_notice') : '※ 범위 및 미리보기 적용을 위해 1개의 파일만 업로드 가능합니다.'}</span>`
                : `${i18n ? i18n.t('ws_multi_files_notice') : '(여러 파일 동시 선택 가능)'}`;
            const selectedFilesText = i18n ? i18n.t('ws_selected_files') : '선택된 파일:';
            const btnAddText = i18n ? i18n.t('ws_btn_add') : '추가';
            const btnDeleteSelectedText = i18n ? i18n.t('ws_btn_delete_selected') : '선택 지우기';
            const btnClearAllText = i18n ? i18n.t('ws_btn_clear_all') : '모두 지우기';
            const gridHintText = i18n ? i18n.t('ws_grid_hint') : '아래의 파일을 마우스와 Ctrl, Shift를 이용해서 다중 선택하고, Delete 키로 삭제할 수 있습니다.';

            const html = `
                <div id="workspace-${this.id}" class="max-w-container-max mx-auto px-margin-mobile py-8 md:py-12 min-h-[60vh]">
                    <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            ${ui.button({ id: `btn-back-${this.id}`, text: backText, icon: 'arrow_back', variant: 'ghost', extraClasses: 'border border-outline-variant/60 shadow-xs hover:border-primary/40 shrink-0' })}
                            <h2 class="font-headline-md text-headline-md text-on-surface truncate hidden sm:block" title="${currentTitle}">${currentTitle}</h2>
                        </div>
                        ${ui.adSlot({ id: `ad-top-${this.id}`, label: '상단 광고 영역', format: 'banner', extraClasses: 'hidden md:flex shrink-0 w-80 lg:w-96 max-w-full' })}
                    </div>

                    <div class="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                        <!-- Left: Action Sidebar -->
                        <div class="w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col gap-4 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-8rem)] md:overflow-y-auto custom-scrollbar pr-2 pb-2">
                            <div class="relative bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                                <h3 class="font-body-lg font-bold text-on-surface mb-4 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-primary">settings</span> ${settingsTitle}
                                    </div>
                                    <div id="settings-header-actions"></div>
                                </h3>
                                
                                <!-- Custom Settings injected here -->
                                ${currentSettingsHtml}

                                <div class="mt-4">
                                    ${ui.button({ id: `btn-run-${this.id}`, text: currentExecuteBtnText, icon: 'play_arrow', iconPosition: 'right', variant: 'primary', extraClasses: 'w-full py-4 text-body-md', disabled: true })}
                                </div>
                            </div>
                            ${ui.adSlot({ id: `ad-sidebar-${this.id}`, label: '사이드바 광고 영역', format: 'sidebar', extraClasses: 'w-full mt-3' })}
                        </div>

                        <!-- Right: Visual Grid Area -->
                        <div class="flex-1 flex flex-col gap-4 w-full md:max-h-[calc(100vh-8rem)] md:overflow-y-auto custom-scrollbar pr-2 pb-2">
                            <!-- Dropzone Area -->
                            <div class="w-full">
                                <div id="dropzone-empty-${this.id}" class="border-2 border-dashed border-primary/30 bg-surface-container-lowest rounded-xl p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/60 hover:bg-surface-container-low transition-colors group">
                                    <div class="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mb-4">
                                        <span class="material-symbols-outlined text-primary text-4xl">note_add</span>
                                    </div>
                                    <h3 id="dropzone-title-${this.id}" class="font-headline-md text-body-lg font-bold text-on-surface mb-2">
                                        ${this.dropzoneText || defaultDropzoneText}
                                    </h3>
                                    <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">
                                        ${dropzoneSubText}
                                    </p>
                                    <input type="file" id="file-input-${this.id}" ${this.singleFile ? '' : 'multiple'} accept="${this.acceptTypes}" class="hidden">
                                </div>
                            </div>

                            <!-- Visual Grid Area -->
                            <div class="w-full">
                                <div id="thumbnail-workspace-${this.id}" class="hidden flex-col gap-4">
                                    <div id="default-header-${this.id}" class="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant ${this.hideDefaultGrid ? 'hidden' : ''}">
                                        <div class="font-body-sm text-on-surface">${selectedFilesText} <strong id="file-count-${this.id}" class="text-primary">0</strong></div>
                                        <div class="flex gap-2">
                                            ${ui.button({ id: `btn-add-more-${this.id}`, text: btnAddText, icon: 'add', variant: 'secondary' })}
                                            ${ui.button({ id: `btn-delete-selected-${this.id}`, text: btnDeleteSelectedText, icon: 'delete_sweep', variant: 'danger', extraClasses: 'hidden' })}
                                            ${ui.button({ id: `btn-clear-files-${this.id}`, text: btnClearAllText, icon: 'delete', variant: 'danger' })}
                                        </div>
                                    </div>
                                    <div class="${this.hideDefaultGrid ? 'hidden' : ''}">
                                        ${ui.infoBox({ text: gridHintText, type: 'info', icon: 'lightbulb' })}
                                    </div>
                                    <ul id="file-grid-${this.id}" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 ${this.hideDefaultGrid ? 'hidden' : ''}">
                                    </ul>
                                    <!-- Custom Area for Split Workspace -->
                                    <div id="custom-workspace-${this.id}" class="w-full ${this.hideDefaultGrid ? 'block' : 'hidden'}"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const workspaceContainer = document.getElementById('workspace-container');
            workspaceContainer.innerHTML = html;
            this.container = document.getElementById(`workspace-${this.id}`);
            this.bindEvents();

            // 언어 변경 리스너 등록 (현재 활성화된 워크스페이스 자동 갱신)
            if (!this._langListenerBound) {
                window.addEventListener('pdfdesk:lang-changed', () => {
                    const wsEl = document.getElementById(`workspace-${this.id}`);
                    if (wsEl && !wsEl.closest('.hidden')) {
                        // 현재 워크스페이스가 화면에 노출 중일 때만 리렌더링
                        const prevFiles = [...this.selectedFiles];
                        this.render();
                        if (prevFiles.length > 0) {
                            this.handleFiles(prevFiles);
                        }
                    }
                });
                this._langListenerBound = true;
            }
            if (this.onRender) this.onRender(this);
            if (window.PDFDesk.Utils && typeof window.PDFDesk.Utils.refreshAds === 'function') {
                window.PDFDesk.Utils.refreshAds(this.container);
            }
        }

        bindEvents() {
            const btnBack = document.getElementById(`btn-back-${this.id}`);
            const dropzoneEmpty = document.getElementById(`dropzone-empty-${this.id}`);
            const fileInput = document.getElementById(`file-input-${this.id}`);
            const btnAddMore = document.getElementById(`btn-add-more-${this.id}`);
            const btnDeleteSelected = document.getElementById(`btn-delete-selected-${this.id}`);
            const btnClearFiles = document.getElementById(`btn-clear-files-${this.id}`);
            const btnRun = document.getElementById(`btn-run-${this.id}`);

            if (btnDeleteSelected) {
                btnDeleteSelected.addEventListener('click', () => {
                    this.deleteSelectedItems();
                });
            }

            if (window._workspaceKeydownHandler) {
                window.removeEventListener('keydown', window._workspaceKeydownHandler);
            }
            window._workspaceKeydownHandler = (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
                    if (document.getElementById(`workspace-${this.id}`)) {
                        this.deleteSelectedItems();
                    }
                }
            };
            window.addEventListener('keydown', window._workspaceKeydownHandler);

            // 돌아가기
            btnBack.addEventListener('click', () => {
                if (window.PDFDesk && typeof window.PDFDesk.closeWorkspace === 'function') {
                    window.PDFDesk.closeWorkspace();
                } else {
                    this.clearWorkspace();
                    const workspaceContainer = document.getElementById('workspace-container');
                    const landingView = document.getElementById('landing-view');
                    workspaceContainer.classList.add('hidden');
                    workspaceContainer.innerHTML = ''; // 메모리 정리
                    landingView.classList.remove('hidden');
                    landingView.classList.add('block');
                    window.scrollTo(0, 0);
                }
            });

            // 파일 입력 트리거
            dropzoneEmpty.addEventListener('click', () => fileInput.click());
            btnAddMore.addEventListener('click', () => fileInput.click());

            // 전역 드래그 앤 드롭 차단
            const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                window.addEventListener(eventName, preventDefaults, false);
            });

            const thumbnailWorkspace = document.getElementById(`thumbnail-workspace-${this.id}`);

            // 드롭존 및 썸네일 워크스페이스 시각 효과
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzoneEmpty.addEventListener(eventName, () => {
                    dropzoneEmpty.classList.add('border-primary', 'bg-surface-container-low');
                });
            });

            thumbnailWorkspace.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.singleFile && this.selectedFiles.length > 0) return;
                thumbnailWorkspace.classList.add('border-primary', 'bg-primary/5');
            });

            thumbnailWorkspace.addEventListener('dragleave', (e) => {
                e.preventDefault();
                thumbnailWorkspace.classList.remove('border-primary', 'bg-primary/5');
            });

            thumbnailWorkspace.addEventListener('drop', (e) => {
                e.preventDefault();
                thumbnailWorkspace.classList.remove('border-primary', 'bg-primary/5');
                if (this.singleFile && this.selectedFiles.length > 0) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFiles(Array.from(e.dataTransfer.files));
                }
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzoneEmpty.addEventListener(eventName, () => {
                    dropzoneEmpty.classList.remove('border-primary', 'bg-surface-container-low');
                });
            });

            // 실제 파일 드롭 및 변경 (초기 화면)
            dropzoneEmpty.addEventListener('drop', (e) => {
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFiles(Array.from(e.dataTransfer.files));
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(Array.from(e.target.files));
                }
                fileInput.value = ''; 
            });

            // 모두 지우기
            btnClearFiles.addEventListener('click', () => {
                if(confirm('모든 파일을 목록에서 지우시겠습니까?')) {
                    this.clearWorkspace();
                    this.updateUI();
                    if(this.onActiveItemChanged) this.onActiveItemChanged(this.activeItemIndex, this);
                }
            });

            // 실행
            btnRun.addEventListener('click', () => {
                this.onExecute(this);
            });
        }

        async handleFiles(files) {
            let totalSize = 0;
            const validFiles = files.filter(f => {
                if (!this.acceptValidation(f)) return false;
                totalSize += f.size;
                return true;
            });

            if (validFiles.length < files.length) alert('지원하지 않는 파일 형식이 포함되어 있습니다.');
            if (totalSize > PDFDesk.MAX_FILE_SIZE) alert('총 용량이 50MB를 초과하면 브라우저가 느려질 수 있습니다.');

            let filesToProcess = validFiles;
            if (this.singleFile) {
                if (this.selectedFiles.length > 0 || validFiles.length > 1) {
                    alert('이 작업은 하나의 파일만 처리할 수 있습니다. 가장 첫 번째 파일만 추가됩니다.');
                }
                if (validFiles.length > 0 && this.selectedFiles.length === 0) {
                    filesToProcess = [validFiles[0]];
                } else {
                    filesToProcess = [];
                }
            }

            const currentClearId = this.clearId || 0;
            
            for (const file of filesToProcess) {
                if (currentClearId !== (this.clearId || 0)) break; // 삭제/초기화 시 추가 중단
                
                const fileObj = {
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    file: file,
                    thumbnailDataUrl: null
                };
                this.selectedFiles.push(fileObj);
                this.updateUI(); 
                if(!this.hideDefaultGrid) {
                    fileObj.thumbnailDataUrl = await this.generateThumbnail(file);
                    if (currentClearId !== (this.clearId || 0)) break; // 썸네일 생성 중 삭제/초기화 시 렌더링 중단
                    this.updateUI(); 
                }
            }
            if (currentClearId === (this.clearId || 0) && this.onFilesChanged) {
                this.onFilesChanged(this.selectedFiles, this);
            }
        }
        
        clearWorkspace() {
            this.selectedFiles = [];
            this.selectedItems.clear();
            this.activeItemIndex = 0;
            this.lastClickedItem = null;
            this.clearId = (this.clearId || 0) + 1;
        }

        deleteSelectedItems() {
            if (this.selectedItems.size === 0) return;
            const indicesToDelete = Array.from(this.selectedItems).sort((a,b) => b-a);
            
            // Check if active item is deleted
            let activeDeleted = this.selectedItems.has(this.activeItemIndex);
            
            indicesToDelete.forEach(idx => {
                this.selectedFiles.splice(idx, 1);
            });
            this.selectedItems.clear();
            this.lastClickedItem = null;

            if (activeDeleted) {
                this.activeItemIndex = 0;
            } else {
                // Adjust activeItemIndex based on deletions before it
                const numDeletedBeforeActive = indicesToDelete.filter(idx => idx < this.activeItemIndex).length;
                this.activeItemIndex -= numDeletedBeforeActive;
            }
            if (this.selectedFiles.length === 0) this.activeItemIndex = 0;

            this.updateUI();
            if(this.onActiveItemChanged) this.onActiveItemChanged(this.activeItemIndex, this);
        }

        updateSelectionUI() {
            const fileGrid = document.getElementById(`file-grid-${this.id}`);
            if (!fileGrid) return;

            const btnDeleteSelected = document.getElementById(`btn-delete-selected-${this.id}`);
            if (btnDeleteSelected) {
                if (this.selectedItems.size > 0) {
                    btnDeleteSelected.classList.remove('hidden');
                    btnDeleteSelected.classList.add('flex');
                } else {
                    btnDeleteSelected.classList.add('hidden');
                    btnDeleteSelected.classList.remove('flex');
                }
            }

            Array.from(fileGrid.children).forEach(child => {
                const idx = parseInt(child.dataset.index);
                if (isNaN(idx)) return;
                
                const isActive = (idx === this.activeItemIndex && (this.id === 'masking' || this.id === 'watermark'));
                const isSelected = this.selectedItems.has(idx);

                // Update styles
                if (isSelected) {
                    child.classList.add('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
                    child.classList.remove('border-outline-variant');
                } else if (isActive) {
                    child.classList.add('border-primary');
                    child.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'border-outline-variant');
                } else {
                    child.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
                    child.classList.add('border-outline-variant');
                }
            });
        }

        async generateThumbnail(file) {
            try {
                if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png)$/i)) {
                    // 이미지 파일인 경우 직접 캔버스에 그려서 리사이즈 후 썸네일 생성
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const scale = Math.min(300 / img.width, 400 / img.height);
                            const width = img.width * scale;
                            const height = img.height * scale;
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            URL.revokeObjectURL(img.src);
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(img.src);
                            resolve(null);
                        };
                        img.src = URL.createObjectURL(file);
                    });
                } else {
                    // PDF 파일인 경우 기존 pdf.js 로직 사용
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    const arrayBuffer = await file.arrayBuffer();
                    const loadingTask = pdfjsLib.getDocument({ 
                        data: arrayBuffer.slice(0),
                        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                        cMapPacked: true
                    });
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    
                    const viewport = page.getViewport({ scale: 1.0 });
                    const scale = 300 / viewport.width; 
                    const scaledViewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = scaledViewport.height;
                    canvas.width = scaledViewport.width;

                    const renderContext = { canvasContext: context, viewport: scaledViewport };
                    await page.render(renderContext).promise;
                    return canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (err) {
                console.error('썸네일 생성 실패:', err);
                return false;
            }
        }

        updateUI() {
            const dropzoneEmpty = document.getElementById(`dropzone-empty-${this.id}`);
            const thumbnailWorkspace = document.getElementById(`thumbnail-workspace-${this.id}`);
            const fileGrid = document.getElementById(`file-grid-${this.id}`);
            const fileCountEl = document.getElementById(`file-count-${this.id}`);
            const btnRun = document.getElementById(`btn-run-${this.id}`);

            fileCountEl.textContent = this.selectedFiles.length;
            
            if (this.selectedFiles.length === 0) {
                dropzoneEmpty.classList.remove('hidden');
                dropzoneEmpty.classList.add('flex');
                thumbnailWorkspace.classList.add('hidden');
                thumbnailWorkspace.classList.remove('flex');
                btnRun.disabled = true;
                if(this.onFilesChanged) this.onFilesChanged(this.selectedFiles, this);
            } else {
                dropzoneEmpty.classList.add('hidden');
                dropzoneEmpty.classList.remove('flex');
                thumbnailWorkspace.classList.remove('hidden');
                thumbnailWorkspace.classList.add('flex');
                btnRun.disabled = false;
                
                const btnAddFile = document.getElementById(`btn-add-file-${this.id}`);
                if (btnAddFile) {
                    if (this.singleFile) {
                        btnAddFile.classList.add('hidden');
                        btnAddFile.classList.remove('flex');
                    } else {
                        btnAddFile.classList.remove('hidden');
                        btnAddFile.classList.add('flex');
                    }
                }
                
                if (!this.hideDefaultGrid) {
                    fileGrid.innerHTML = '';
                    this.selectedFiles.forEach((fObj, index) => {
                        const li = document.createElement('li');
                        li.className = 'relative bg-surface-bright border border-outline-variant rounded-lg p-2 hover:border-primary/50 transition-colors group cursor-grab shadow-sm flex flex-col gap-2 aspect-[1/1.3]';
                        li.draggable = true;
                        li.dataset.index = index;

                        const sizeMb = (fObj.file.size / 1024 / 1024).toFixed(2);
                        let thumbHtml = '';
                        if (fObj.thumbnailDataUrl) {
                            thumbHtml = `<img src="${fObj.thumbnailDataUrl}" class="w-full h-full object-cover rounded pointer-events-none border border-outline-variant/30">`;
                        } else if (fObj.thumbnailDataUrl === false) {
                            thumbHtml = `<div class="w-full h-full flex flex-col items-center justify-center bg-surface-container-lowest rounded border border-outline-variant/30 pointer-events-none text-on-surface-variant">
                                <span class="material-symbols-outlined text-outline text-2xl mb-1">image_not_supported</span>
                                <span class="text-[10px] text-outline">미리보기 불가</span>
                            </div>`;
                        } else {
                            thumbHtml = `<div class="w-full h-full flex flex-col items-center justify-center bg-surface-container-lowest rounded border border-outline-variant/30 pointer-events-none animate-pulse">
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1.5">
                                    <span class="material-symbols-outlined text-primary text-[18px] animate-spin">sync</span>
                                </div>
                                <span class="text-[10px] font-medium text-on-surface-variant">생성 중...</span>
                            </div>`;
                        }

                        const isActive = (index === this.activeItemIndex && (this.id === 'masking' || this.id === 'watermark'));

                        li.innerHTML = `
                            <div class="absolute top-1 left-1 bg-surface-bright/90 backdrop-blur text-on-surface text-[10px] font-bold px-1.5 py-0.5 rounded border border-outline-variant/50 shadow-sm z-10 pointer-events-none">
                                ${index + 1}
                            </div>
                            <button class="absolute top-1 right-1 bg-error/90 text-on-error w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-error shadow-sm btn-remove" data-index="${index}">
                                <span class="material-symbols-outlined text-[14px]">close</span>
                            </button>
                            <div class="flex-1 w-full relative overflow-hidden bg-surface-container-lowest rounded flex items-center justify-center">
                                ${thumbHtml}
                                <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none flex items-center justify-center">
                                    <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-50 text-4xl">drag_pan</span>
                                </div>
                            </div>
                            <div class="h-10 flex flex-col justify-end">
                                <div class="text-[11px] font-semibold text-on-surface truncate w-full" title="${fObj.file.name}">${fObj.file.name}</div>
                                <div class="text-[10px] text-on-surface-variant">${sizeMb} MB</div>
                            </div>
                        `;

                        // Add selection click listener
                        li.addEventListener('click', (e) => {
                            if (e.target.closest('.btn-remove')) return;
                            
                            const fileGrid = document.getElementById(`file-grid-${this.id}`);
                            if (!fileGrid) return;
                            
                            let activeChanged = false;

                            if (e.shiftKey && this.lastClickedItem !== null) {
                                const allIndices = Array.from(fileGrid.children).map(c => parseInt(c.dataset.index)).filter(n => !isNaN(n));
                                const idx1 = allIndices.indexOf(this.lastClickedItem);
                                const idx2 = allIndices.indexOf(index);
                                
                                if (idx1 !== -1 && idx2 !== -1) {
                                    const start = Math.min(idx1, idx2);
                                    const end = Math.max(idx1, idx2);
                                    
                                    if (!e.ctrlKey && !e.metaKey) {
                                        this.selectedItems.clear();
                                    }
                                    
                                    for (let i = start; i <= end; i++) {
                                        this.selectedItems.add(allIndices[i]);
                                    }
                                }
                                if (this.activeItemIndex !== index) {
                                    this.activeItemIndex = index;
                                    activeChanged = true;
                                }
                            } else if (e.ctrlKey || e.metaKey) {
                                if (this.selectedItems.has(index)) {
                                    this.selectedItems.delete(index);
                                } else {
                                    this.selectedItems.add(index);
                                }
                                this.lastClickedItem = index;
                            } else {
                                this.selectedItems.clear();
                                this.selectedItems.add(index);
                                this.lastClickedItem = index;
                                if (this.activeItemIndex !== index) {
                                    this.activeItemIndex = index;
                                    activeChanged = true;
                                }
                            }
                            
                            this.updateSelectionUI();
                            if (activeChanged) {
                                // re-render to update the active badge
                                this.updateUI();
                                if(this.onActiveItemChanged) this.onActiveItemChanged(this.activeItemIndex, this);
                            }
                        });

                        li.addEventListener('dragstart', (e) => this.handleDragStart(e, li));
                        li.addEventListener('dragover', this.handleDragOver);
                        li.addEventListener('drop', (e) => this.handleDrop(e, li));
                        li.addEventListener('dragenter', (e) => this.handleDragEnter(e, li));
                        li.addEventListener('dragleave', (e) => this.handleDragLeave(e, li));

                        fileGrid.appendChild(li);
                    });

                    this.updateSelectionUI();

                    document.querySelectorAll(`#file-grid-${this.id} .btn-remove`).forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const idx = parseInt(e.currentTarget.dataset.index);
                            
                            // Remove from selectedItems and adjust indices
                            if (this.selectedItems.has(idx)) {
                                this.selectedItems.delete(idx);
                            }
                            const newSelectedItems = new Set();
                            this.selectedItems.forEach(sIdx => {
                                if (sIdx > idx) newSelectedItems.add(sIdx - 1);
                                else newSelectedItems.add(sIdx);
                            });
                            this.selectedItems = newSelectedItems;

                            // Adjust activeItemIndex
                            let activeChanged = false;
                            if (idx === this.activeItemIndex) {
                                this.activeItemIndex = 0;
                                activeChanged = true;
                            } else if (idx < this.activeItemIndex) {
                                this.activeItemIndex--;
                            }
                            
                            if (this.lastClickedItem === idx) this.lastClickedItem = null;
                            else if (this.lastClickedItem > idx) this.lastClickedItem--;

                            this.selectedFiles.splice(idx, 1);
                            if (this.selectedFiles.length === 0) this.activeItemIndex = 0;
                            
                            this.updateUI();
                            if(activeChanged && this.onActiveItemChanged) this.onActiveItemChanged(this.activeItemIndex, this);
                        });
                    });
                }
            }
        }

        // Drag handlers
        handleDragStart(e, el) {
            this.dragSrcEl = el;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', el.dataset.index);
            el.classList.add('opacity-40');
            
            // Drag end listener just once per drag
            const handleDragEnd = () => {
                document.querySelectorAll(`#file-grid-${this.id} li`).forEach(li => {
                    li.classList.remove('opacity-40', 'border-2', 'border-primary', 'scale-105');
                });
                document.removeEventListener('dragend', handleDragEnd);
            };
            document.addEventListener('dragend', handleDragEnd);
        }
        handleDragOver(e) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        }
        handleDragEnter(e, el) { el.classList.add('border-2', 'border-primary', 'scale-105'); }
        handleDragLeave(e, el) { el.classList.remove('border-2', 'border-primary', 'scale-105'); }
        handleDrop(e, el) {
            if (e.stopPropagation) e.stopPropagation();
            el.classList.remove('border-2', 'border-primary', 'scale-105');
            
            if (this.dragSrcEl !== el) {
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(el.dataset.index);
                const [movedItem] = this.selectedFiles.splice(fromIndex, 1);
                this.selectedFiles.splice(toIndex, 0, movedItem);
                this.updateUI();
            }
            return false;
        }

        // Progress UI helpers
        // Progress UI helpers
        setProgress(percent, text) {
            PDFDesk.ProgressModal.update(percent, text);
        }
        showProgress(title = "작업 처리 중...") {
            PDFDesk.ProgressModal.show(title);
        }
        hideProgress() {
            PDFDesk.ProgressModal.hide();
        }
        completeProgress(successText) {
            PDFDesk.ProgressModal.complete(successText);
        }
    }

    PDFDesk.WorkspaceTool = WorkspaceTool;
})();
