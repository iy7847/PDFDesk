window.PDFDesk = window.PDFDesk || {};

(function() {
    const PDFDesk = window.PDFDesk;

    // 2. 공용 워크스페이스 클래스 정의
    class WorkspaceTool {
        constructor(config) {
            this.id = config.id;
            this.title = config.title;
            this.settingsHtml = config.settingsHtml;
            this.executeBtnText = config.executeBtnText;
            this.onExecute = config.onExecute;
            this.onRender = config.onRender;
            this.onFilesChanged = config.onFilesChanged;
            this.singleFile = config.singleFile || false;
            this.hideDefaultGrid = config.hideDefaultGrid || false;

            this.selectedFiles = [];
            this.selectedItems = new Set();
            this.activeItemIndex = 0;
            this.lastClickedItem = null;
            this.onActiveItemChanged = config.onActiveItemChanged;
            this.dragSrcEl = null;
        }

        render() {
            // 메인 템플릿 생성
            const html = `
                <div id="workspace-${this.id}" class="max-w-container-max mx-auto px-margin-mobile py-8 md:py-12 min-h-[60vh]">
                    <div class="mb-6 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button id="btn-back-${this.id}" class="text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors bg-surface-container-low px-4 py-2 rounded-lg">
                                <span class="material-symbols-outlined">arrow_back</span> 돌아가기
                            </button>
                            <h2 class="font-headline-md text-headline-md text-on-surface hidden sm:block">${this.title}</h2>
                        </div>
                        <div class="hidden md:flex h-12 w-[320px] bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant font-body-sm text-xs rounded">
                            [상단 광고 영역]
                        </div>
                    </div>

                    <div class="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                        <!-- Left: Action Sidebar -->
                        <div class="w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col gap-4 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-8rem)] md:overflow-y-auto custom-scrollbar pr-2 pb-2">
                            <div class="relative bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
                                <h3 class="font-body-lg font-bold text-on-surface mb-4 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-primary">settings</span> 작업 설정
                                    </div>
                                    <div id="settings-header-actions"></div>
                                </h3>
                                
                                <!-- Custom Settings injected here -->
                                ${this.settingsHtml}

                                <button id="btn-run-${this.id}" class="w-full bg-primary-container text-on-primary px-6 py-4 rounded-xl font-headline-md text-body-md font-bold shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none" disabled>
                                    ${this.executeBtnText}
                                    <span class="material-symbols-outlined">play_arrow</span>
                                </button>
                            </div>
                            <div class="w-full h-[250px] shrink-0 bg-surface-container-low border border-dashed border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant font-body-sm shadow-sm mb-4">
                                [사이드바 광고 영역]
                            </div>
                        </div>

                        <!-- Right: Visual Grid Area -->
                        <div class="flex-1 flex flex-col gap-4 w-full md:max-h-[calc(100vh-8rem)] md:overflow-y-auto custom-scrollbar pr-2 pb-2">
                            <!-- Dropzone Area -->
                            <div class="w-full">
                                <div id="dropzone-empty-${this.id}" class="border-2 border-dashed border-primary/30 bg-surface-container-lowest rounded-xl p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/60 hover:bg-surface-container-low transition-colors group">
                                    <div class="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mb-4">
                                        <span class="material-symbols-outlined text-primary text-4xl">note_add</span>
                                    </div>
                                    <h3 class="font-headline-md text-body-lg font-bold text-on-surface mb-2">
                                        ${this.singleFile ? '여기로 1개의 PDF 파일을 드래그하세요' : '여기로 PDF 파일을 드래그하세요'}
                                    </h3>
                                    <p class="font-body-sm text-on-surface-variant text-center">
                                        또는 클릭하여 파일 선택 <br>
                                        ${this.singleFile ? '<span class="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-[11px]">※ 범위 및 미리보기 적용을 위해 1개의 파일만 업로드 가능합니다.</span>' : '(여러 파일 동시 선택 가능)'}
                                    </p>
                                    <input type="file" id="file-input-${this.id}" ${this.singleFile ? '' : 'multiple'} accept="application/pdf" class="hidden">
                                </div>
                            </div>

                            <!-- Visual Grid Area -->
                            <div class="w-full">
                                <div id="thumbnail-workspace-${this.id}" class="hidden flex-col gap-4">
                                    <div id="default-header-${this.id}" class="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant ${this.hideDefaultGrid ? 'hidden' : ''}">
                                        <div class="font-body-sm text-on-surface">선택된 파일: <strong id="file-count-${this.id}" class="text-primary">0</strong>개</div>
                                        <div class="flex gap-2">
                                            <button id="btn-add-more-${this.id}" class="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[18px]">add</span> 추가
                                            </button>
                                            <button id="btn-delete-selected-${this.id}" class="text-error text-sm font-semibold hover:underline flex items-center gap-1 hidden">
                                                <span class="material-symbols-outlined text-[18px]">delete_sweep</span> 선택 지우기
                                            </button>
                                            <button id="btn-clear-files-${this.id}" class="text-error text-sm font-semibold hover:underline flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[18px]">delete</span> 모두 지우기
                                            </button>
                                        </div>
                                    </div>
                                    <p class="text-[11px] text-primary leading-tight font-medium bg-primary/5 p-2 rounded border border-primary/20 ${this.hideDefaultGrid ? 'hidden' : ''}">💡 아래의 페이지를 마우스와 Ctrl, Shift를 이용해서 선택하고, Delete 키로 삭제 할 수 있습니다.</p>
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
            if (this.onRender) this.onRender(this);
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
                const workspaceContainer = document.getElementById('workspace-container');
                const landingView = document.getElementById('landing-view');
                workspaceContainer.classList.add('hidden');
                workspaceContainer.innerHTML = ''; // 메모리 정리
                landingView.classList.remove('hidden');
                landingView.classList.add('block');
                window.scrollTo(0, 0);
            });

            // 파일 입력 트리거
            dropzoneEmpty.addEventListener('click', () => fileInput.click());
            btnAddMore.addEventListener('click', () => fileInput.click());

            // 전역 드래그 앤 드롭 차단
            const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                window.addEventListener(eventName, preventDefaults, false);
            });

            // 드롭존 시각 효과
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzoneEmpty.classList.add('border-primary', 'bg-surface-container-low');
            });
            ['dragleave', 'drop'].forEach(eventName => {
                dropzoneEmpty.classList.remove('border-primary', 'bg-surface-container-low');
            });

            // 실제 파일 드롭 및 변경
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
                    this.selectedFiles = [];
                    this.selectedItems.clear();
                    this.activeItemIndex = 0;
                    this.lastClickedItem = null;
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
            const pdfFiles = files.filter(f => {
                if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return false;
                totalSize += f.size;
                return true;
            });

            if (pdfFiles.length < files.length) alert('PDF 파일만 선택 가능합니다.');
            if (totalSize > PDFDesk.MAX_FILE_SIZE) alert('총 용량이 50MB를 초과하면 브라우저가 느려질 수 있습니다.');

            let filesToProcess = pdfFiles;
            if (this.singleFile) {
                if (filesToProcess.length > 0) {
                    filesToProcess = [filesToProcess[0]];
                    this.selectedFiles = []; // 기존 파일 교체
                }
            }

            for (const file of filesToProcess) {
                const fileObj = {
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    file: file,
                    thumbnailDataUrl: null
                };
                this.selectedFiles.push(fileObj);
                this.updateUI(); 
                if(!this.hideDefaultGrid) {
                    fileObj.thumbnailDataUrl = await this.generateThumbnail(file);
                    this.updateUI(); 
                }
            }
            if(this.onFilesChanged) this.onFilesChanged(this.selectedFiles, this);
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
            } catch (err) {
                console.error('썸네일 생성 실패:', err);
                return null;
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
                        } else {
                            thumbHtml = `<div class="w-full h-full flex flex-col items-center justify-center bg-surface-container-lowest rounded border border-outline-variant/30 pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-3xl mb-1 ${fObj.thumbnailDataUrl === null ? '' : 'animate-spin'}">
                                    ${fObj.thumbnailDataUrl === null ? 'image_not_supported' : 'sync'}
                                </span>
                                <span class="text-[10px] text-outline">Loading...</span>
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
