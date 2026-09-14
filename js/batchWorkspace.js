window.PDFDesk = window.PDFDesk || {};

(function() {
    'use strict';
    
    const PDFDesk = window.PDFDesk;
    const ui = PDFDesk.UI;
    const TASK_ORDER = ['imgToPdf', 'merge', 'resize', 'watermark', 'masking', 'split', 'pdfToImg'];
    
    function getTaskInfo(taskId) {
        const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
        const map = {
            'imgToPdf': { icon: 'image', title: t('ws_batch_task_imgtopdf_title', '이미지 → PDF 변환'), desc: t('ws_batch_task_imgtopdf_desc', '업로드된 이미지를 PDF로 변환합니다.') },
            'merge': { icon: 'merge', title: t('ws_batch_task_merge_title', '파일 병합'), desc: t('ws_batch_task_merge_desc', '모든 파일을 하나의 PDF로 병합합니다.') },
            'resize': { icon: 'crop', title: t('ws_batch_task_resize_title', '용지 리사이징'), desc: t('ws_batch_task_resize_desc', 'PDF 페이지 크기를 통일합니다.') },
            'watermark': { icon: 'branding_watermark', title: t('ws_batch_task_wm_title', '워터마크'), desc: t('ws_batch_task_wm_desc', '텍스트 워터마크를 삽입합니다.') },
            'masking': { icon: 'security', title: t('ws_batch_task_masking_title', '마스킹 (복사방지)'), desc: t('ws_batch_task_masking_desc', '텍스트와 이미지를 병합하여 복사를 방지합니다.') },
            'split': { icon: 'cut', title: t('ws_batch_task_split_title', '페이지 분할'), desc: t('ws_batch_task_split_desc', 'PDF를 여러 파일로 쪼갭니다.') },
            'pdfToImg': { icon: 'image', title: t('ws_batch_task_pdftoimg_title', 'PDF → 이미지 변환'), desc: t('ws_batch_task_pdftoimg_desc', '최종 PDF를 이미지 파일로 변환합니다.') }
        };
        return map[taskId] || { icon: 'task', title: taskId, desc: '' };
    }

    function getTaskTemplate(taskId) {
        const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
        switch(taskId) {
            case 'imgToPdf':
                return ui.infoBox({
                    text: t('ws_batch_task_imgtopdf_info', '추가 설정이 필요하지 않습니다. 원본 이미지를 A4 사이즈 기반의 PDF로 변환합니다.'),
                    type: 'info'
                });
            case 'merge':
                return ui.checkbox({
                    id: 'batch-merge-toc',
                    label: t('ws_batch_task_merge_toc', '자동 목차(TOC) 첫 페이지에 생성'),
                    description: t('ws_batch_task_merge_toc_desc', '합쳐진 문서의 첫 페이지에 한글 파일명과 페이지 번호가 포함된 목차를 자동 생성합니다.')
                });
            case 'resize':
                return `
                    ${ui.select({
                        id: 'batch-resize-size',
                        label: t('ws_batch_task_resize_size', '용지 규격'),
                        options: [
                            { value: 'A4', label: 'A4 사이즈 (210 x 297mm)', selected: true },
                            { value: 'A3', label: 'A3 사이즈 (297 x 420mm)' },
                            { value: 'ORIGINAL', label: t('ws_resize_size_orig', '원본 비율 유지') }
                        ]
                    })}
                    ${ui.select({
                        id: 'batch-resize-ori',
                        label: t('ws_batch_task_resize_ori', '용지 방향'),
                        options: [
                            { value: 'AUTO', label: t('ws_batch_task_resize_auto', '방향 자동 회전 (권장)'), selected: true },
                            { value: 'PORTRAIT', label: t('ws_batch_task_resize_port', '세로 방향 고정') },
                            { value: 'LANDSCAPE', label: t('ws_batch_task_resize_land', '가로 방향 고정') }
                        ]
                    })}
                `;
            case 'watermark':
                return `
                    ${ui.textInput({
                        id: 'batch-wm-text',
                        label: t('ws_batch_task_wm_text', '워터마크 문구'),
                        placeholder: 'CONFIDENTIAL',
                        icon: 'edit'
                    })}
                    <div class="flex gap-3 items-center mb-4">
                        <div class="flex-1">
                            ${ui.select({
                                id: 'batch-wm-pos',
                                label: t('ws_batch_task_wm_pos', '배치 위치'),
                                options: [
                                    { value: 'center', label: t('ws_batch_task_wm_pos_center', '정중앙 (크게)'), selected: true },
                                    { value: 'diagonal', label: t('ws_batch_task_wm_pos_diag', '대각선 패턴') },
                                    { value: 'bottom-right', label: t('ws_batch_task_wm_pos_br', '우측 하단 (작게)') },
                                    { value: 'top-left', label: t('ws_batch_task_wm_pos_tl', '좌측 상단 (작게)') }
                                ]
                            })}
                        </div>
                        <div class="shrink-0">
                            <label class="block font-body-sm text-on-surface font-bold mb-1.5">${t('ws_batch_task_wm_color', '색상')}</label>
                            <input type="color" id="batch-wm-color" value="#FF0000" class="w-12 h-11 p-1 border border-outline-variant bg-surface-bright rounded-lg cursor-pointer">
                        </div>
                    </div>
                `;
            case 'masking':
                return ui.infoBox({
                    text: t('ws_batch_task_masking_info', '마스킹(래스터화) 작업은 시간이 다소 소요될 수 있으며, 텍스트 복사를 방지하기 위해 전체 페이지를 고해상도 이미지로 변환합니다.'),
                    type: 'warning'
                });
            case 'split':
                return ui.select({
                    id: 'batch-split-mode',
                    label: t('ws_batch_task_split_mode', '분할 단위'),
                    icon: 'cut',
                    options: [
                        { value: '1', label: t('ws_batch_task_split_1', '1페이지씩 개별 분할'), selected: true },
                        { value: '2', label: t('ws_batch_task_split_2', '2페이지씩 묶어서 분할') }
                    ]
                });
            case 'pdfToImg':
                return ui.select({
                    id: 'batch-pdfToImg-format',
                    label: t('ws_batch_task_pdftoimg_format', '출력 이미지 포맷'),
                    icon: 'image',
                    options: [
                        { value: 'image/jpeg', label: t('ws_batch_task_pdftoimg_jpg', '고해상도 JPG 포맷 (빠르고 가벼움)'), selected: true },
                        { value: 'image/png', label: t('ws_batch_task_pdftoimg_png', '고해상도 PNG 포맷 (무손실)') }
                    ]
                });
            default:
                return '';
        }
    }

    PDFDesk.initBatch = function() {
        let activeTasks = [];
        let currentStepIndex = -1; // -1: Setup, 0~N-1: Task Execution, N: Finished
        let pipelineFiles = []; 
        
        const workspace = new PDFDesk.WorkspaceTool({
            id: 'batch',
            title: '올인원 파이프라인 (단계별 마법사)',
            titleKey: 'ws_batch_title',
            executeBtnText: '파이프라인 시작하기',
            executeBtnKey: 'ws_batch_btn_ready',
            settingsHtml: '<div id="wizard-container"></div>', 
            acceptTypes: 'application/pdf,image/png,image/jpeg,image/jpg',
            acceptValidation: (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf') || f.type.startsWith('image/') || f.name.toLowerCase().match(/\.(jpg|jpeg|png)$/),
            
            onRender: (ws) => {
                const container = document.getElementById('wizard-container');
                const execBtn = document.getElementById(`btn-run-${ws.id}`);
                const dropzoneTitle = document.getElementById(`dropzone-title-${ws.id}`);

                const renderSetupView = () => {
                    const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                    container.innerHTML = `
                        <div class="mb-4 animate-fade-in">
                            <div class="relative mb-3">
                                <div class="flex items-center justify-between gap-2">
                                    <label class="block font-body-sm text-on-surface font-bold truncate flex-1 min-w-0" title="${t('ws_batch_step1_label', '1. 파이프라인 단계 구성')}">${t('ws_batch_step1_label', '1. 파이프라인 단계 구성')}</label>
                                    ${ui.button({
                                        id: 'btn-add-batch-task',
                                        text: t('ws_batch_btn_add', '기능 추가'),
                                        icon: 'add',
                                        variant: 'tonal',
                                        extraClasses: '!text-xs !py-1 !px-2 !gap-1 whitespace-nowrap shrink-0'
                                    })}
                                </div>
                                <div id="batch-task-dropdown" class="hidden absolute left-0 right-0 top-full mt-2 bg-surface-bright border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden custom-scrollbar max-h-80"></div>
                            </div>
                            <div id="batch-task-list" class="flex flex-col gap-2 min-h-[120px] rounded-xl p-3 bg-surface-container-lowest/50 border border-outline-variant/50">
                                <div id="batch-empty-msg" class="text-center text-on-surface-variant text-sm py-6">${t('ws_batch_empty_msg', "추가된 작업이 없습니다.<br>우측 상단의 '기능 추가' 버튼을 누르세요.")}</div>
                            </div>
                        </div>
                    `;

                    const btnAdd = document.getElementById('btn-add-batch-task');
                    const dropdown = document.getElementById('batch-task-dropdown');
                    const taskList = document.getElementById('batch-task-list');
                    const emptyMsg = document.getElementById('batch-empty-msg');

                    const renderDropdown = () => {
                        dropdown.innerHTML = '';
                        TASK_ORDER.forEach(taskId => {
                            if (activeTasks.includes(taskId)) return;
                            const info = getTaskInfo(taskId);
                            const btn = document.createElement('button');
                            btn.className = 'w-full text-left px-4 py-3 text-sm hover:bg-surface-container flex items-center gap-3 text-on-surface border-b border-outline-variant/30 last:border-0';
                            btn.innerHTML = `<div class="bg-primary-container/20 p-1.5 rounded-md shrink-0"><span class="material-symbols-outlined text-[18px] text-primary block">${info.icon}</span></div> <div class="flex flex-col min-w-0"><span class="font-bold truncate">${info.title}</span><span class="text-[11px] text-on-surface-variant truncate mt-0.5">${info.desc}</span></div>`;
                            btn.onclick = () => {
                                activeTasks.push(taskId);
                                dropdown.classList.add('hidden');
                                updateView();
                            };
                            dropdown.appendChild(btn);
                        });
                        if (dropdown.children.length === 0) dropdown.innerHTML = `<div class="px-4 py-4 text-sm text-on-surface-variant text-center font-bold">${t('ws_batch_all_added', '모든 기능이 추가되었습니다.')}</div>`;
                    };

                    btnAdd.addEventListener('click', (e) => {
                        e.stopPropagation();
                        renderDropdown();
                        dropdown.classList.toggle('hidden');
                    });
                    
                    document.addEventListener('click', (e) => {
                        if (dropdown && !e.target.closest('#batch-dropdown-container') && !e.target.closest('#btn-add-batch-task')) {
                            dropdown.classList.add('hidden');
                        }
                    });

                    activeTasks.sort((a, b) => TASK_ORDER.indexOf(a) - TASK_ORDER.indexOf(b));
                    
                    if (activeTasks.length > 0) emptyMsg.style.display = 'none';
                    else emptyMsg.style.display = 'block';

                    activeTasks.forEach((taskId, index) => {
                        const info = getTaskInfo(taskId);
                        const card = document.createElement('div');
                        card.className = 'bg-surface-bright border border-outline-variant rounded-xl p-3 flex flex-col relative animate-fade-in group shadow-sm';
                        card.innerHTML = `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3 font-body-sm font-bold text-on-surface">
                                    <span class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold">${index + 1}</span>
                                    <span class="material-symbols-outlined text-[20px] text-primary">${info.icon}</span>
                                    <span class="text-base">${info.title}</span>
                                </div>
                                <button class="btn-remove-task text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10" data-task="${taskId}" title="${t('ws_batch_task_delete', '작업 삭제')}">
                                    <span class="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        `;
                        taskList.appendChild(card);
                    });

                    document.querySelectorAll('.btn-remove-task').forEach(btn => {
                        btn.onclick = (e) => {
                            const tId = e.currentTarget.dataset.task;
                            activeTasks = activeTasks.filter(t => t !== tId);
                            updateView();
                        };
                    });

                    if (execBtn) {
                        execBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">rocket_launch</span> ${t('ws_batch_btn_ready', '파이프라인 시작하기')}`;
                        execBtn.className = 'btn-execute w-full bg-primary text-on-primary rounded-xl py-4 font-bold font-body-lg hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
                        execBtn.disabled = !(ws.selectedFiles.length > 0 && activeTasks.length > 0);
                    }
                };

                const renderStepView = () => {
                    const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                    const taskId = activeTasks[currentStepIndex];
                    const info = getTaskInfo(taskId);
                    container.innerHTML = `
                        <div class="animate-slide-up bg-surface-bright border border-outline-variant rounded-2xl p-5 shadow-sm">
                            <div class="text-xs font-bold text-primary mb-2 tracking-wider">STEP ${currentStepIndex + 1} OF ${activeTasks.length}</div>
                            <div class="flex items-center gap-3 mb-2">
                                <span class="material-symbols-outlined text-[28px] text-primary">${info.icon}</span>
                                <h2 class="text-xl font-bold text-on-surface">${info.title}</h2>
                            </div>
                            <p class="text-sm text-on-surface-variant mb-4">${info.desc}</p>
                            <div class="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden mb-6">
                                <div class="bg-primary h-full transition-all duration-500" style="width: ${((currentStepIndex) / activeTasks.length) * 100}%"></div>
                            </div>
                            <div class="pt-4 border-t border-outline-variant/30">
                                ${getTaskTemplate(taskId)}
                            </div>
                        </div>
                    `;
                    
                    if (execBtn) {
                        execBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">play_arrow</span> ${t('ws_batch_btn_step', '이 단계 적용')} (${currentStepIndex + 1}/${activeTasks.length})`;
                        execBtn.disabled = false;
                    }
                };

                const renderFinishView = () => {
                    const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                    container.innerHTML = `
                        <div class="animate-fade-in bg-surface-bright border border-outline-variant rounded-2xl p-6 shadow-sm text-center">
                            <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="material-symbols-outlined text-[32px] text-primary">task_alt</span>
                            </div>
                            <h2 class="text-2xl font-bold text-on-surface mb-2">${t('ws_batch_finish_title', '모든 파이프라인 완료!')}</h2>
                            <p class="text-sm text-on-surface-variant mb-6">${pipelineFiles.length} ${t('ws_batch_finish_desc', '성공적으로 파일이 처리되었습니다.')}</p>
                            
                            <div class="text-left mb-6 border border-outline-variant/50 rounded-xl p-4 bg-surface-container-lowest">
                                <label class="block font-body-sm text-on-surface font-bold mb-2">${t('ws_filename_label', '출력 파일명 설정 (선택)')}</label>
                                <input type="text" id="input-filename-batch" placeholder="${t('ws_filename_placeholder', '기본값: 자동으로 생성됨')}" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-xl p-3 font-body-sm focus:outline-none focus:border-primary focus:ring-1 transition-shadow">
                            </div>
                            
                            <button id="btn-batch-reset" class="w-full border border-outline-variant text-on-surface bg-surface-container hover:bg-surface-container-high rounded-xl py-3 font-bold transition-colors">
                                ${t('ws_batch_btn_restart', '처음부터 다시하기')}
                            </button>
                        </div>
                    `;
                    
                    document.getElementById('btn-batch-reset').onclick = () => {
                        currentStepIndex = -1;
                        activeTasks = [];
                        pipelineFiles = [];
                        ws.clearFiles();
                        updateView();
                    };

                    if (execBtn) {
                        execBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">download</span> ${t('ws_batch_btn_download', '결과물 다운로드')}`;
                        execBtn.disabled = false;
                    }
                };

                const updateView = () => {
                    const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                    if (currentStepIndex === -1) {
                        renderSetupView();
                        if (dropzoneTitle) dropzoneTitle.innerText = activeTasks.includes('imgToPdf') ? t('ws_batch_dropzone_mixed', '여기로 파일(이미지, PDF)을 드래그하세요') : t('ws_batch_dropzone_pdf', '여기로 PDF 파일을 드래그하세요');
                    } else if (currentStepIndex < activeTasks.length) {
                        renderStepView();
                        if (dropzoneTitle) dropzoneTitle.innerHTML = `${t('ws_batch_dropzone_waiting', '현재 파이프라인에 대기 중인 파일:')} <span class="text-primary font-bold">${pipelineFiles.length}</span>`;
                    } else {
                        renderFinishView();
                        if (dropzoneTitle) dropzoneTitle.innerHTML = t('ws_batch_dropzone_done', '작업이 완료되었습니다. 좌측 하단에서 다운로드 하세요.');
                    }
                };

                ws.updateWizardView = updateView;
                updateView();

                window.addEventListener('pdfdesk:lang-changed', () => {
                    const el = document.getElementById(`workspace-${ws.id}`);
                    if (el && !el.classList.contains('hidden')) {
                        updateView();
                    }
                });
            },
            
            onExecute: async (workspace) => {
                try {
                    const { degrees, PDFDocument, rgb, StandardFonts } = window.PDFLib;
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];

                    if (currentStepIndex === -1) {
                        workspace.setProgress(10, '파일 분석 및 메모리 로드 중...');
                        pipelineFiles = [];
                        for (let i = 0; i < workspace.selectedFiles.length; i++) {
                            const f = workspace.selectedFiles[i].file;
                            const buffer = await f.arrayBuffer();
                            pipelineFiles.push({
                                name: f.name,
                                bytes: new Uint8Array(buffer),
                                isImage: f.type.startsWith('image/') || f.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)
                            });
                        }
                        
                        const remainingImages = pipelineFiles.filter(f => f.isImage);
                        if (remainingImages.length > 0 && activeTasks[0] !== 'imgToPdf') {
                            alert("경고: 이미지 파일이 포함되어 있습니다. 파이프라인 첫 단계가 '이미지 → PDF 변환'이 아니면 에러가 발생할 수 있습니다.");
                        }

                        currentStepIndex = 0;
                        workspace.updateWizardView();
                        return;
                    }

                    if (currentStepIndex >= activeTasks.length) {
                        const outputFilenameInput = document.getElementById('input-filename-batch').value.trim();
                        if (pipelineFiles.length === 1 && !pipelineFiles[0].isImage) {
                            const outName = outputFilenameInput ? (outputFilenameInput.endsWith('.pdf') ? outputFilenameInput : `${outputFilenameInput}.pdf`) : pipelineFiles[0].name;
                            PDFDesk.Utils.downloadFile(pipelineFiles[0].bytes, outName, 'application/pdf');
                        } else if (pipelineFiles.length === 1 && pipelineFiles[0].isImage) {
                            const ext = pipelineFiles[0].name.split('.').pop();
                            const outName = outputFilenameInput ? (outputFilenameInput.endsWith('.' + ext) ? outputFilenameInput : `${outputFilenameInput}.${ext}`) : pipelineFiles[0].name;
                            PDFDesk.Utils.downloadFile(pipelineFiles[0].bytes, outName, `image/${ext}`);
                        } else {
                            const zip = new JSZip();
                            pipelineFiles.forEach(f => zip.file(f.name, f.bytes));
                            const zipBlob = await zip.generateAsync({ type: 'blob' });
                            const zipName = outputFilenameInput ? (outputFilenameInput.endsWith('.zip') ? outputFilenameInput : `${outputFilenameInput}.zip`) : 'Batch_Result.zip';
                            PDFDesk.Utils.downloadFile(zipBlob, zipName, 'application/zip');
                        }
                        return;
                    }

                    const taskId = activeTasks[currentStepIndex];
                    const info = TASK_INFO[taskId];
                    workspace.showProgress(info.title + ' 실행 중...');
                    workspace.setProgress(10, '준비 중...');
                    
                    let newFiles = []; 

                    if (taskId === 'imgToPdf') {
                        workspace.setProgress(30, '이미지를 PDF로 렌더링 중...');
                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage) {
                                const pdfDoc = await PDFDocument.create();
                                let image = fileItem.name.toLowerCase().endsWith('.png') ? await pdfDoc.embedPng(fileItem.bytes) : await pdfDoc.embedJpg(fileItem.bytes);
                                const page = pdfDoc.addPage([image.width, image.height]);
                                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                                fileItem.bytes = await pdfDoc.save();
                                fileItem.isImage = false;
                                fileItem.name = fileItem.name.substring(0, fileItem.name.lastIndexOf('.')) + '.pdf';
                            }
                        }
                        newFiles = pipelineFiles;
                    } 
                    else if (taskId === 'merge') {
                        workspace.setProgress(30, '문서 합치는 중...');
                        const includeToc = document.getElementById('batch-merge-toc').checked;
                        const mergedPdf = await PDFDocument.create();
                        const tocData = [];
                        let currentOutputPageNumber = 1;

                        for (const fileItem of pipelineFiles) {
                            if (fileItem.isImage) continue;
                            const pdfDoc = await PDFDesk.Utils.loadPdfSafely(fileItem.bytes);
                            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                            tocData.push({ filename: fileItem.name, startPage: currentOutputPageNumber });
                            copiedPages.forEach((page) => { mergedPdf.addPage(page); currentOutputPageNumber++; });
                        }

                        if (includeToc && tocData.length > 0) {
                            const tocPage = mergedPdf.insertPage(0, [595.28, 841.89]);
                            const { width, height } = tocPage.getSize();
                            
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const scale = 2; // High resolution
                            canvas.width = width * scale;
                            canvas.height = height * scale;
                            ctx.scale(scale, scale);
                            
                            ctx.fillStyle = 'black';
                            ctx.font = 'bold 24px sans-serif';
                            ctx.fillText('Table of Contents', 50, 80);
                            
                            ctx.font = '12px sans-serif';
                            let yPosition = 130;
                            tocData.forEach((item, idx) => {
                                const safeName = item.filename; // 한글 파일명도 정상 출력
                                ctx.fillText(`${idx + 1}. ${safeName}`.substring(0, 50), 50, yPosition);
                                ctx.fillText(`Page ${item.startPage + 1}`, width - 100, yPosition);
                                yPosition += 20;
                            });
                            
                            const dataUrl = canvas.toDataURL('image/png');
                            const base64Data = dataUrl.split(',')[1];
                            const binaryString = window.atob(base64Data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
                            
                            const tocImage = await mergedPdf.embedPng(bytes);
                            tocPage.drawImage(tocImage, { x: 0, y: 0, width: width, height: height });
                        }
                        newFiles = [{
                            name: pipelineFiles.length > 0 ? `Merged_${pipelineFiles[0].name}` : 'Merged.pdf',
                            bytes: await mergedPdf.save(),
                            isImage: false
                        }];
                    }
                    else if (taskId === 'resize') {
                        workspace.setProgress(30, '페이지 규격 변경 중...');
                        const targetSizeFormat = document.getElementById('batch-resize-size').value;
                        const targetOrientation = document.getElementById('batch-resize-ori').value;
                        const sizes = { 'A4': [595.28, 841.89], 'A3': [841.89, 1190.55] };

                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage || targetSizeFormat === 'ORIGINAL') continue;

                            const pdfDoc = await PDFDesk.Utils.loadPdfSafely(fileItem.bytes);
                            const resizedPdf = await PDFDocument.create();
                            const pageCount = pdfDoc.getPageCount();

                            for (let p = 0; p < pageCount; p++) {
                                const [embeddedPage] = await resizedPdf.embedPdf(fileItem.bytes, [p]);
                                const { width, height } = embeddedPage.size();
                                let targetWidth = sizes[targetSizeFormat][0];
                                let targetHeight = sizes[targetSizeFormat][1];
                                let needsRotation = false;

                                if (targetOrientation === 'LANDSCAPE') { targetWidth = sizes[targetSizeFormat][1]; targetHeight = sizes[targetSizeFormat][0]; } 
                                else if (targetOrientation === 'AUTO') { if (width > height) { targetWidth = sizes[targetSizeFormat][1]; targetHeight = sizes[targetSizeFormat][0]; } }

                                if (width > height && targetWidth < targetHeight) needsRotation = true;
                                if (width <= height && targetWidth > targetHeight) needsRotation = true;

                                const newPage = resizedPdf.addPage([targetWidth, targetHeight]);
                                const scale = Math.min(targetWidth / (needsRotation?height:width), targetHeight / (needsRotation?width:height));
                                const scaledWidth = width * scale, scaledHeight = height * scale;

                                if (needsRotation) {
                                    newPage.drawPage(embeddedPage, { x: (targetWidth - scaledHeight) / 2 + scaledHeight, y: (targetHeight - scaledWidth) / 2, width: scaledWidth, height: scaledHeight, rotate: degrees(90) });
                                } else {
                                    newPage.drawPage(embeddedPage, { x: (targetWidth - scaledWidth) / 2, y: (targetHeight - scaledHeight) / 2, width: scaledWidth, height: scaledHeight });
                                }
                            }
                            fileItem.bytes = await resizedPdf.save();
                        }
                        newFiles = pipelineFiles;
                    }
                    else if (taskId === 'watermark') {
                        workspace.setProgress(40, '워터마크 각인 중...');
                        const text = document.getElementById('batch-wm-text').value || 'Watermark';
                        const pos = document.getElementById('batch-wm-pos').value;
                        const colorHex = document.getElementById('batch-wm-color').value;

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const refFontSize = 100;
                        ctx.font = `bold ${refFontSize}px sans-serif`;
                        const metrics = ctx.measureText(text);
                        const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
                        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

                        canvas.width = textWidth + 40;
                        canvas.height = textHeight + 40;

                        ctx.font = `bold ${refFontSize}px sans-serif`;
                        ctx.fillStyle = colorHex;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

                        const dataUrl = canvas.toDataURL('image/png');
                        const base64Data = dataUrl.split(',')[1];
                        const binaryString = window.atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let j = 0; j < binaryString.length; j++) { bytes[j] = binaryString.charCodeAt(j); }

                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage) continue;

                            const pdfDoc = await PDFDesk.Utils.loadPdfSafely(fileItem.bytes);
                            const customImage = await pdfDoc.embedPng(bytes);

                            pdfDoc.getPages().forEach(page => {
                                const { width, height } = page.getSize();
                                
                                let targetWidth = width * 0.8;
                                let scaleRatio = targetWidth / canvas.width;
                                let targetHeight = canvas.height * scaleRatio;
                                
                                let x, y, rotate = degrees(0);

                                if (pos === 'center') { 
                                    x = (width - targetWidth) / 2; 
                                    y = (height - targetHeight) / 2; 
                                } else if (pos === 'bottom-right') { 
                                    targetWidth = width * 0.4;
                                    scaleRatio = targetWidth / canvas.width;
                                    targetHeight = canvas.height * scaleRatio;
                                    x = width - targetWidth - 20; 
                                    y = 20; 
                                } else if (pos === 'top-left') { 
                                    targetWidth = width * 0.4;
                                    scaleRatio = targetWidth / canvas.width;
                                    targetHeight = canvas.height * scaleRatio;
                                    x = 20; 
                                    y = height - targetHeight - 20; 
                                } else if (pos === 'diagonal') { 
                                    x = (width - targetWidth) / 2; 
                                    y = (height - targetHeight) / 2; 
                                    rotate = degrees(45); 
                                }

                                page.drawImage(customImage, { x, y, width: targetWidth, height: targetHeight, opacity: 0.3, rotate });
                            });
                            fileItem.bytes = await pdfDoc.save();
                        }
                        newFiles = pipelineFiles;
                    }
                    else if (taskId === 'masking') {
                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage) continue;

                            const loadingTask = pdfjsLib.getDocument({ data: fileItem.bytes });
                            const pdf = await loadingTask.promise;
                            const newPdfDoc = await PDFDocument.create();

                            for (let p = 1; p <= pdf.numPages; p++) {
                                workspace.setProgress(10 + (p / pdf.numPages * 80), `페이지 복사 방지 처리 중 (${p}/${pdf.numPages})...`);
                                const page = await pdf.getPage(p);
                                const viewport = page.getViewport({ scale: 2.0 });
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = viewport.width; canvas.height = viewport.height;

                                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                                const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                                const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
                                const jpgImage = await newPdfDoc.embedJpg(imgBytes);

                                const newPage = newPdfDoc.addPage([viewport.width / 2.0, viewport.height / 2.0]);
                                newPage.drawImage(jpgImage, { x: 0, y: 0, width: viewport.width / 2.0, height: viewport.height / 2.0 });
                            }
                            fileItem.bytes = await newPdfDoc.save();
                        }
                        newFiles = pipelineFiles;
                    }
                    else if (taskId === 'split') {
                        workspace.setProgress(40, '문서 자르는 중...');
                        const pagesPerSplit = parseInt(document.getElementById('batch-split-mode').value, 10);
                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage) { newFiles.push(fileItem); continue; }

                            const pdfDoc = await PDFDesk.Utils.loadPdfSafely(fileItem.bytes);
                            const totalPages = pdfDoc.getPageCount();
                            
                            if (isNaN(pagesPerSplit) || pagesPerSplit <= 0) { newFiles.push(fileItem); } 
                            else {
                                for (let start = 0; start < totalPages; start += pagesPerSplit) {
                                    const splitPdf = await PDFDocument.create();
                                    const end = Math.min(start + pagesPerSplit, totalPages);
                                    const indices = []; for (let p = start; p < end; p++) indices.push(p);
                                    
                                    const copiedPages = await splitPdf.copyPages(pdfDoc, indices);
                                    copiedPages.forEach(p => splitPdf.addPage(p));
                                    
                                    const baseName = fileItem.name.replace(/\.[^/.]+$/, "");
                                    newFiles.push({ name: `${baseName}_part${start/pagesPerSplit + 1}.pdf`, bytes: await splitPdf.save(), isImage: false });
                                }
                            }
                        }
                    }
                    else if (taskId === 'pdfToImg') {
                        const format = document.getElementById('batch-pdfToImg-format').value;
                        const ext = format === 'image/png' ? 'png' : 'jpg';

                        for (let i = 0; i < pipelineFiles.length; i++) {
                            const fileItem = pipelineFiles[i];
                            if (fileItem.isImage) { newFiles.push(fileItem); continue; }

                            const loadingTask = pdfjsLib.getDocument({ data: fileItem.bytes });
                            const pdf = await loadingTask.promise;
                            const baseName = fileItem.name.replace(/\.[^/.]+$/, "");

                            for (let p = 1; p <= pdf.numPages; p++) {
                                workspace.setProgress(10 + (p / pdf.numPages * 80), `고화질 이미지 렌더링 중 (${p}/${pdf.numPages})...`);
                                const page = await pdf.getPage(p);
                                const viewport = page.getViewport({ scale: 2.0 });
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = viewport.width; canvas.height = viewport.height;

                                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                                const imgBlob = await new Promise(resolve => canvas.toBlob(resolve, format, 0.9));
                                
                                newFiles.push({ name: pdf.numPages > 1 ? `${baseName}_page${p}.${ext}` : `${baseName}.${ext}`, bytes: imgBlob, isImage: true });
                            }
                        }
                    }

                    pipelineFiles = newFiles;
                    workspace.setProgress(100, '적용 완료!');
                    
                    setTimeout(() => {
                        workspace.hideProgress();
                        currentStepIndex++;
                        workspace.updateWizardView();
                    }, 500);

                } catch (error) {
                    PDFDesk.Utils.handlePdfError(error, workspace);
                }
            }
        });

        workspace.onFilesChanged = () => {
            if (currentStepIndex === -1 && workspace.updateWizardView) workspace.updateWizardView();
        };

        return workspace;
    };
})();