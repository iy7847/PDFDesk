window.PDFDesk = window.PDFDesk || {};

(function () {
    'use strict';

    PDFDesk.initConvert = function () {
        function getConvertSettingsHtml() {
            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
            return `
                ${PDFDesk.UI.radioGroup({
                    name: 'convert-direction',
                    label: t('ws_convert_mode', '변환 모드 선택'),
                    icon: 'swap_horiz',
                    options: [
                        { value: 'pdf-to-img', label: t('ws_convert_pdf2img', 'PDF → 이미지 추출 (ZIP)'), checked: true },
                        { value: 'img-to-pdf', label: t('ws_convert_img2pdf', '이미지 → PDF 병합') }
                    ]
                })}
                
                <div id="convert-settings-pdf-to-img">
                    ${PDFDesk.UI.select({
                        id: 'select-convert-format',
                        label: t('ws_convert_format', '추출 이미지 포맷'),
                        icon: 'image',
                        options: [
                            { value: 'jpeg', label: t('ws_convert_format_jpg', 'JPG (권장, 빠른 속도, 작은 용량)'), selected: true },
                            { value: 'png', label: t('ws_convert_format_png', 'PNG (고화질, 무손실)') }
                        ]
                    })}
                </div>

                ${PDFDesk.UI.filenameInput({
                    id: 'input-filename-convert',
                    placeholder: t('ws_filename_placeholder', '입력하지 않으면 자동 생성됨')
                })}
            `;
        }

        const convertWorkspace = new PDFDesk.WorkspaceTool({
            id: 'convert',
            title: '포맷 변환 (PDF ↔ 이미지)',
            titleKey: 'ws_convert_title',
            executeBtnText: '변환 시작',
            executeBtnKey: 'ws_convert_btn',
            acceptTypes: 'application/pdf',
            acceptValidation: (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
            settingsHtml: getConvertSettingsHtml,
            onExecute: async (workspace) => {
                const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                const files = workspace.selectedFiles;
                if (files.length === 0) {
                    alert(t('ws_convert_alert_nofile', '파일을 추가해주세요.'));
                    return;
                }

                const directionRadios = document.getElementsByName('convert-direction');
                let direction = 'pdf-to-img';
                for (const r of directionRadios) {
                    if (r.checked) direction = r.value;
                }

                const filenameInput = document.getElementById('input-filename-convert').value.trim();

                try {
                    workspace.showProgress();

                    if (direction === 'pdf-to-img') {
                        // Validate files
                        const pdfFiles = files.filter(f => f.file.type === 'application/pdf' || f.file.name.toLowerCase().endsWith('.pdf'));
                        if (pdfFiles.length === 0) {
                            alert(t('ws_convert_alert_pdfonly', 'PDF에서 이미지로 변환하려면 PDF 파일만 올려주세요.'));
                            workspace.hideProgress();
                            return;
                        }

                        const format = document.getElementById('select-convert-format').value;
                        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                        const ext = format === 'png' ? 'png' : 'jpg';

                        const zip = new JSZip();
                        let totalPagesToProcess = 0;
                        const parsedDocs = [];

                        workspace.setProgress(10, 'PDF 파일 분석 중...');
                        
                        const pdfjsLib = window['pdfjs-dist/build/pdf'];
                        for (const f of pdfFiles) {
                            const arrayBuffer = await f.file.arrayBuffer();
                            const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                            totalPagesToProcess += pdfJsDoc.numPages;
                            parsedDocs.push({ doc: pdfJsDoc, name: f.file.name.replace(/\.pdf$/i, '') });
                        }

                        let pagesProcessed = 0;
                        for (let d = 0; d < parsedDocs.length; d++) {
                            const pdfDoc = parsedDocs[d].doc;
                            const baseName = parsedDocs[d].name;
                            const numPages = pdfDoc.numPages;

                            for (let p = 1; p <= numPages; p++) {
                                const page = await pdfDoc.getPage(p);
                                const scale = 2.0; // High res
                                const viewport = page.getViewport({ scale: scale });

                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = viewport.width;
                                canvas.height = viewport.height;

                                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                                const dataUrl = canvas.toDataURL(mimeType, 0.9);
                                const base64Data = dataUrl.split(',')[1];
                                
                                const fileName = parsedDocs.length === 1 && numPages === 1 
                                    ? `${baseName}.${ext}`
                                    : `${baseName}_page_${p}.${ext}`;
                                    
                                zip.file(fileName, base64Data, { base64: true });

                                pagesProcessed++;
                                workspace.setProgress(10 + Math.floor((pagesProcessed / totalPagesToProcess) * 70), `이미지 변환 중... (${pagesProcessed}/${totalPagesToProcess})`);
                            }
                        }

                        workspace.setProgress(85, 'ZIP 파일 압축 중...');
                        const zipBlob = await zip.generateAsync({ type: "blob" });
                        
                        workspace.setProgress(100, '완료!');
                        const outName = filenameInput ? (filenameInput.endsWith('.zip') ? filenameInput : filenameInput + '.zip') : 'converted_images.zip';
                        PDFDesk.Utils.downloadFile(zipBlob, outName, 'application/zip');

                    } else if (direction === 'img-to-pdf') {
                        // Validate files
                        const imgFiles = files.filter(f => f.file.type.startsWith('image/') || f.file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/));
                        if (imgFiles.length === 0) {
                            alert(t('ws_convert_alert_imgonly', '이미지에서 PDF로 변환하려면 이미지 파일(JPG, PNG)만 올려주세요.'));
                            workspace.hideProgress();
                            return;
                        }

                        workspace.setProgress(20, 'PDF 생성 준비 중...');
                        const pdfDoc = await window.PDFLib.PDFDocument.create();

                        let processed = 0;
                        for (const f of imgFiles) {
                            const arrayBuffer = await f.file.arrayBuffer();
                            let image;
                            try {
                                if (f.file.type === 'image/png' || f.file.name.toLowerCase().endsWith('.png')) {
                                    image = await pdfDoc.embedPng(arrayBuffer);
                                } else {
                                    image = await pdfDoc.embedJpg(arrayBuffer);
                                }
                                
                                const page = pdfDoc.addPage([image.width, image.height]);
                                page.drawImage(image, {
                                    x: 0,
                                    y: 0,
                                    width: image.width,
                                    height: image.height
                                });
                                processed++;
                            } catch (err) {
                                console.error('Image embed error for', f.file.name, err);
                                alert(`'${f.file.name}' 파일을 분석하는 중 오류가 발생했습니다. (지원하지 않는 포맷이거나 파일이 손상되었을 수 있습니다.)`);
                            }
                            
                            workspace.setProgress(20 + Math.floor(((imgFiles.indexOf(f) + 1) / imgFiles.length) * 60), `PDF 페이지 생성 중... (${imgFiles.indexOf(f) + 1}/${imgFiles.length})`);
                        }

                        if (processed === 0) {
                            alert('변환할 수 있는 이미지가 없습니다.');
                            workspace.hideProgress();
                            return;
                        }

                        workspace.setProgress(85, 'PDF 저장 중...');
                        const pdfBytes = await pdfDoc.save();
                        
                        workspace.setProgress(100, '완료!');
                        const outName = filenameInput ? (filenameInput.endsWith('.pdf') ? filenameInput : filenameInput + '.pdf') : 'merged_images.pdf';
                        PDFDesk.Utils.downloadFile(pdfBytes, outName, 'application/pdf');
                    }

                    setTimeout(() => {
                        workspace.hideProgress();
                    }, 500);

                } catch (error) {
                    PDFDesk.Utils.handlePdfError(error, workspace);
                }
            },
            onRender: () => {
                const workspaceEl = document.getElementById('workspace-convert');
                const pdfToImgSettings = document.getElementById('convert-settings-pdf-to-img');
                if (workspaceEl) {
                    workspaceEl.addEventListener('change', (e) => {
                        if (e.target.name === 'convert-direction') {
                            const fileInput = document.getElementById(`file-input-${convertWorkspace.id}`);
                            const dropzoneTitle = document.getElementById(`dropzone-title-${convertWorkspace.id}`);
                            
                            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
                            if (e.target.value === 'pdf-to-img') {
                                if (pdfToImgSettings) pdfToImgSettings.style.display = 'block';
                                convertWorkspace.acceptTypes = 'application/pdf';
                                convertWorkspace.acceptValidation = (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
                                if (fileInput) fileInput.accept = 'application/pdf';
                                if (dropzoneTitle) dropzoneTitle.innerText = t('ws_convert_dropzone_pdf', '여기로 PDF 파일을 드래그하세요');
                            } else {
                                if (pdfToImgSettings) pdfToImgSettings.style.display = 'none';
                                convertWorkspace.acceptTypes = 'image/png,image/jpeg,image/jpg';
                                convertWorkspace.acceptValidation = (f) => f.type.startsWith('image/') || f.name.toLowerCase().match(/\.(jpg|jpeg|png)$/);
                                if (fileInput) fileInput.accept = 'image/png,image/jpeg,image/jpg';
                                if (dropzoneTitle) dropzoneTitle.innerText = t('ws_convert_dropzone_img', '여기로 이미지 파일(JPG, PNG)을 드래그하세요');
                            }
                            
                            // Remove incompatible files
                            const prevCount = convertWorkspace.selectedFiles.length;
                            convertWorkspace.selectedFiles = convertWorkspace.selectedFiles.filter(fObj => convertWorkspace.acceptValidation(fObj.file));
                            if (convertWorkspace.selectedFiles.length !== prevCount) {
                                convertWorkspace.updateUI();
                            }
                        }
                    });
                }
            }
        });

        return convertWorkspace;
    };
})();
