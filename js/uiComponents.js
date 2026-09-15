/**
 * PDFDesk - UI Components & Common Utilities
 * 머티리얼 디자인 3(MD3) 및 Tailwind CSS 기반의 전역 재사용 컴포넌트 모듈
 * 100% 브라우저 클라이언트 사이드 동작
 */
window.PDFDesk = window.PDFDesk || {};

(function () {
    'use strict';

    // 전역 설정 (애드센스 및 환경 설정)
    window.PDFDesk.Config = window.PDFDesk.Config || {
        adClient: 'ca-pub-1161759322819526', // 구글 애드센스 공식 게시자 ID
        isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };

    // =========================================================================
    // 1. 공용 UI 컴포넌트 라이브러리 (PDFDesk.UI)
    // =========================================================================
    const UI = {
        /**
         * 버튼 컴포넌트
         * @param {Object} options
         * @param {string} options.id - 버튼 DOM ID
         * @param {string} options.text - 버튼 텍스트
         * @param {string} [options.icon] - Material Symbol 아이콘 이름
         * @param {'primary'|'secondary'|'ghost'|'danger'|'icon'} [options.variant='primary'] - 버튼 스타일 변형
         * @param {string} [options.extraClasses=''] - 추가 CSS 클래스
         * @param {boolean} [options.disabled=false] - 비활성화 여부
         * @param {string} [options.title=''] - 툴팁
         * @param {'left'|'right'} [options.iconPosition='left'] - 아이콘 위치
         * @returns {string} HTML 문자열
         */
        button({
            id = '',
            text = '',
            icon = '',
            variant = 'primary',
            extraClasses = '',
            classes = '',
            disabled = false,
            title = '',
            iconPosition = 'left'
        }) {
            const idAttr = id ? `id="${id}"` : '';
            const titleAttr = title ? `title="${title}"` : '';
            const disabledAttr = disabled ? 'disabled' : '';
            const customClasses = `${extraClasses} ${classes}`.trim();

            // 자식 아이콘 및 텍스트에 pointer-events-none 및 select-none을 적용하여 마우스 클릭 시 텍스트 셀렉션으로 인한 클릭 무시 현상 방지
            const iconHtml = icon
                ? `<span class="material-symbols-outlined text-[18px] shrink-0 pointer-events-none select-none">${icon}</span>`
                : '';

            const textHtml = text ? `<span class="pointer-events-none select-none">${text}</span>` : '';

            const content = iconPosition === 'right'
                ? `${textHtml}${iconHtml}`
                : `${iconHtml}${textHtml}`;

            let baseClasses = 'inline-flex items-center justify-center gap-2 font-body-sm font-semibold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

            let variantClasses = '';
            switch (variant) {
                case 'primary':
                    variantClasses = 'bg-primary-container text-on-primary hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 hover:shadow-md px-5 py-3 font-bold';
                    break;
                case 'secondary':
                    variantClasses = 'bg-primary/10 text-primary hover:bg-primary/20 px-3.5 py-2 font-bold';
                    break;
                case 'tonal':
                    variantClasses = 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 px-3.5 py-2 font-bold';
                    break;
                case 'ghost':
                    variantClasses = 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container px-3.5 py-2';
                    break;
                case 'danger':
                    variantClasses = 'bg-error/10 text-error hover:bg-error/20 border border-error/20 px-3.5 py-2 font-bold';
                    break;
                case 'icon':
                    baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all cursor-pointer focus:outline-none disabled:opacity-50 select-none active:scale-95';
                    variantClasses = 'w-9 h-9 text-on-surface-variant hover:text-error hover:bg-error/10 border border-outline-variant bg-surface-bright shadow-sm';
                    break;
                default:
                    variantClasses = 'bg-primary text-on-primary px-4 py-2';
            }

            return `<button type="button" ${idAttr} ${titleAttr} ${disabledAttr} class="${baseClasses} ${variantClasses} ${customClasses}">${icon ? (variant === 'icon' ? iconHtml : content) : textHtml}</button>`;
        },

        /**
         * 카드/섹션 컨테이너 컴포넌트
         */
        card({
            id = '',
            title = '',
            icon = '',
            content = '',
            extraClasses = '',
            headerActions = ''
        }) {
            const idAttr = id ? `id="${id}"` : '';
            const headerHtml = title
                ? `
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/30">
                        <div class="flex items-center gap-2 font-body-md font-bold text-on-surface">
                            ${icon ? `<span class="material-symbols-outlined text-primary text-[20px]">${icon}</span>` : ''}
                            <span>${title}</span>
                        </div>
                        ${headerActions ? `<div class="flex items-center gap-2">${headerActions}</div>` : ''}
                    </div>
                `
                : '';

            return `
                <div ${idAttr} class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-5 shadow-sm mb-4 ${extraClasses}">
                    ${headerHtml}
                    ${content}
                </div>
            `;
        },

        /**
         * 텍스트 인풋 컴포넌트
         */
        textInput({
            id,
            label = '',
            icon = '',
            placeholder = '',
            value = '',
            hint = '',
            type = 'text',
            extraClasses = '',
            inputClasses = ''
        }) {
            const labelHtml = label
                ? `
                    <label for="${id}" class="block font-body-sm text-on-surface font-bold mb-1.5 flex items-center gap-1.5">
                        ${icon ? `<span class="material-symbols-outlined text-[16px] text-primary">${icon}</span>` : ''}
                        <span>${label}</span>
                    </label>
                `
                : '';

            const hintHtml = hint
                ? `<p class="text-[11px] text-on-surface-variant mt-1 leading-tight">${hint}</p>`
                : '';

            return `
                <div class="mb-4 ${extraClasses}">
                    ${labelHtml}
                    <input type="${type}" id="${id}" value="${value}" placeholder="${placeholder}" 
                        class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow ${inputClasses}">
                    ${hintHtml}
                </div>
            `;
        },

        /**
         * 출력 파일명 공통 입력 필드 컴포넌트 (모든 워크스페이스 공통)
         */
        filenameInput({
            id,
            label = '',
            placeholder = '',
            hint = '',
            value = ''
        }) {
            const i18n = window.PDFDesk && window.PDFDesk.i18n;
            const finalLabel = label || (i18n ? i18n.t('ws_filename_label') : '출력 파일명');
            const finalPlaceholder = placeholder || (i18n ? i18n.t('ws_filename_placeholder') : '입력하지 않으면 자동 생성됨');
            return this.textInput({
                id,
                label: finalLabel,
                icon: 'save_as',
                placeholder: finalPlaceholder,
                value,
                hint
            });
        },

        /**
         * 셀렉트 드롭다운 컴포넌트
         * @param {Array<{value: string, label: string, selected?: boolean}>} options
         */
        select({
            id,
            label = '',
            icon = '',
            options = [],
            hint = '',
            extraClasses = ''
        }) {
            const labelHtml = label
                ? `
                    <label for="${id}" class="block font-body-sm text-on-surface font-bold mb-1.5 flex items-center gap-1.5">
                        ${icon ? `<span class="material-symbols-outlined text-[16px] text-primary">${icon}</span>` : ''}
                        <span>${label}</span>
                    </label>
                `
                : '';

            const optionsHtml = options.map(opt => `
                <option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.label}</option>
            `).join('');

            const hintHtml = hint
                ? `<p class="text-[11px] text-on-surface-variant mt-1 leading-tight">${hint}</p>`
                : '';

            return `
                <div class="mb-4 ${extraClasses}">
                    ${labelHtml}
                    <select id="${id}" class="w-full border border-outline-variant bg-surface-bright text-on-surface rounded-lg p-2.5 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-shadow">
                        ${optionsHtml}
                    </select>
                    ${hintHtml}
                </div>
            `;
        },

        /**
         * 체크박스 컴포넌트
         */
        checkbox({
            id,
            label = '',
            description = '',
            checked = false,
            extraClasses = ''
        }) {
            return `
                <div class="mb-4 ${extraClasses}">
                    <label class="flex items-center gap-2.5 cursor-pointer group select-none">
                        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} 
                            class="w-4 h-4 text-primary bg-surface-bright border-outline-variant rounded focus:ring-primary focus:ring-2 cursor-pointer transition-colors">
                        <span class="font-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors">${label}</span>
                    </label>
                    ${description ? `<p class="text-[11px] text-on-surface-variant mt-1 ml-6 leading-tight">${description}</p>` : ''}
                </div>
            `;
        },

        /**
         * 라디오 그룹 (세그먼트 탭 스타일)
         * @param {Array<{value: string, label: string, checked?: boolean}>} options
         */
        radioGroup({
            name,
            label = '',
            icon = '',
            options = [],
            extraClasses = ''
        }) {
            const labelHtml = label
                ? `
                    <label class="block font-body-sm text-on-surface font-bold mb-2 flex items-center gap-1.5">
                        ${icon ? `<span class="material-symbols-outlined text-[16px] text-primary">${icon}</span>` : ''}
                        <span>${label}</span>
                    </label>
                `
                : '';

            const optionsHtml = options.map(opt => `
                <label class="flex-1 text-center border border-outline-variant rounded-lg p-2.5 cursor-pointer hover:bg-surface-container-low transition-all has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:text-primary select-none">
                    <input type="radio" name="${name}" value="${opt.value}" class="hidden" ${opt.checked ? 'checked' : ''}>
                    <span class="font-body-sm font-semibold">${opt.label}</span>
                </label>
            `).join('');

            return `
                <div class="mb-4 ${extraClasses}">
                    ${labelHtml}
                    <div class="flex gap-2">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        },

        /**
         * 레인지 슬라이더 컴포넌트 (실시간 값 배지 내장)
         */
        slider({
            id,
            label = '',
            valueId,
            min = 0,
            max = 100,
            step = 1,
            value = 50,
            displayValue = '',
            extraClasses = ''
        }) {
            const valDisplay = displayValue || value;
            return `
                <div class="mb-4 ${extraClasses}">
                    <div class="flex justify-between items-center mb-1.5">
                        <label for="${id}" class="font-body-sm text-on-surface font-bold text-xs">${label}</label>
                        <span id="${valueId}" class="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">${valDisplay}</span>
                    </div>
                    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" 
                        class="w-full accent-primary cursor-pointer">
                </div>
            `;
        },

        /**
         * 알림 / 정보 / 경고 박스 컴포넌트
         */
        infoBox({
            text,
            type = 'info',
            icon = '',
            extraClasses = ''
        }) {
            let typeClasses = '';
            let defaultIcon = '';

            switch (type) {
                case 'warning':
                    typeClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
                    defaultIcon = 'warning';
                    break;
                case 'error':
                    typeClasses = 'bg-error/10 text-error border-error/20';
                    defaultIcon = 'error';
                    break;
                case 'success':
                    typeClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
                    defaultIcon = 'check_circle';
                    break;
                case 'info':
                default:
                    typeClasses = 'bg-primary/5 text-primary border-primary/20';
                    defaultIcon = 'info';
                    break;
            }

            const iconName = icon || defaultIcon;

            return `
                <div class="p-3 rounded-lg border text-[11px] leading-relaxed font-medium flex items-start gap-2 ${typeClasses} ${extraClasses}">
                    <span class="material-symbols-outlined text-[16px] shrink-0 mt-0.5">${iconName}</span>
                    <div class="flex-1">${text}</div>
                </div>
            `;
        },

        /**
         * 구글 애드센스 광고 슬롯 및 승인 전 세련된 Fallback 팁 배너
         * @param {Object} options
         * @param {string} [options.id] - 광고 영역 고유 DOM ID
         * @param {string} [options.label='광고 영역'] - 플레이스홀더 라벨
         * @param {string} [options.slot] - 구글 애드센스 data-ad-slot ID
         * @param {'banner'|'sidebar'|'in-feed'|'box'} [options.format='banner'] - 광고 규격 포맷
         * @param {string} [options.extraClasses=''] - 추가 CSS 클래스
         */
        adSlot({
            id = '',
            label = '',
            slot = '',
            format = 'banner',
            extraClasses = ''
        } = {}) {
            const config = window.PDFDesk.Config || {};
            const idAttr = id ? `id="${id}"` : '';
            
            // 실제 배포 환경에서 애드센스 클라이언트 ID가 설정된 경우
            if (config.adClient && !config.isDev) {
                return `
                    <div ${idAttr} class="w-full flex flex-col items-center justify-center my-3 ${extraClasses}">
                        <span class="text-[10px] text-on-surface-variant/60 tracking-wider mb-1 uppercase font-semibold">AD</span>
                        <ins class="adsbygoogle block w-full text-center"
                            data-ad-client="${config.adClient}"
                            ${slot ? `data-ad-slot="${slot}"` : ''}
                            data-ad-format="${format === 'sidebar' ? 'rectangle' : 'auto'}"
                            data-full-width-responsive="true"></ins>
                    </div>
                `;
            }

            // 애드센스 승인 전 / 개발 모드: 전문성과 신뢰도를 높이는 실무 보안 & 팁 Fallback 배너
            const i18n = window.PDFDesk && window.PDFDesk.i18n;
            const t = (k, fb) => i18n ? i18n.t(k) : fb;
            const adNotice = t('ad_notice', 'INFO / SPONSORED');

            let fallbackContent = '';
            if (format === 'sidebar') {
                fallbackContent = `
                    <div class="w-full bg-gradient-to-br from-primary/5 via-surface-container-lowest to-primary-container/10 border border-outline-variant/60 rounded-xl p-4 flex flex-col items-center text-center gap-2.5 shadow-sm">
                        <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <span class="material-symbols-outlined text-[20px]">lightbulb</span>
                        </div>
                        <h4 class="font-body-sm font-bold text-on-surface text-xs">${t('ad_mid_title', 'KEP PDF 실무 꿀팁')}</h4>
                        <p class="font-body-sm text-on-surface-variant text-[11px] leading-relaxed">
                            ${t('ad_mid_desc', "CAD 도면을 인쇄용 A4로 변환할 때 '자동 목차(TOC)'를 함께 생성하면 보고서 제출 시 매우 편리합니다.")}
                        </p>
                    </div>
                `;
            } else {
                fallbackContent = `
                    <div class="w-full bg-gradient-to-r from-primary/5 via-surface-container-low to-primary-container/10 border border-outline-variant/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <span class="material-symbols-outlined text-[18px]">verified_user</span>
                            </div>
                            <div class="text-left min-w-0">
                                <span class="font-body-sm font-bold text-on-surface text-xs block truncate">${t('ad_top_title', '100% 브라우저 로컬 보안 처리')}</span>
                                <span class="font-body-sm text-on-surface-variant text-[11px] leading-tight block line-clamp-2">${t('ad_top_desc', '업로드한 도면과 문서는 외부 서버로 절대 전송되지 않고 안전하게 보호됩니다.')}</span>
                            </div>
                        </div>
                        <div class="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-bright border border-outline-variant text-[10px] text-primary font-semibold shrink-0">
                            <span class="material-symbols-outlined text-[13px]">shield</span>
                            <span>${t('ad_top_badge', '안전 보장')}</span>
                        </div>
                    </div>
                `;
            }

            return `
                <div ${idAttr} class="${format === 'sidebar' ? 'w-full' : ''} flex flex-col items-center justify-center my-2.5 ${extraClasses}">
                    <span class="text-[9px] text-on-surface-variant/40 tracking-widest mb-1 uppercase font-semibold">${adNotice}</span>
                    ${fallbackContent}
                </div>
            `;
        },

        /**
         * 개인정보처리방침 / 서비스 이용약관 공용 팝업 모달 (다국어 지원)
         * @param {string} title - 모달 제목
         * @param {string} contentHtml - 모달 본문 HTML
         * @param {string} [confirmText] - 확인 버튼 라벨 (선택)
         */
        showLegalModal(title, contentHtml, confirmText = null) {
            let container = document.getElementById('global-modal-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'global-modal-container';
                document.body.appendChild(container);
            }

            const isEn = (window.PDFDesk?.i18n?.currentLang === 'en');
            const closeTooltip = isEn ? 'Close' : '닫기';
            const defaultConfirm = isEn ? 'Close' : '확인';
            const btnLabel = confirmText || defaultConfirm;

            container.innerHTML = `
                <div id="legal-modal-backdrop" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div class="bg-surface-bright border border-outline-variant rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
                        <!-- Modal Header -->
                        <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
                            <h3 class="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary text-[22px]">policy</span>
                                <span>${title}</span>
                            </h3>
                            <button id="btn-close-legal-modal" class="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer" title="${closeTooltip}">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <!-- Modal Body (Scrollable) -->
                        <div class="p-6 overflow-y-auto custom-scrollbar font-body-sm text-on-surface-variant leading-relaxed space-y-4 text-left">
                            ${contentHtml}
                        </div>
                        <!-- Modal Footer -->
                        <div class="px-6 py-3 border-t border-outline-variant/40 bg-surface-container-low flex justify-end">
                            <button id="btn-confirm-legal-modal" class="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors cursor-pointer text-sm">${btnLabel}</button>
                        </div>
                    </div>
                </div>
            `;

            const closeModal = () => {
                const backdrop = document.getElementById('legal-modal-backdrop');
                if (backdrop) backdrop.remove();
            };

            document.getElementById('btn-close-legal-modal')?.addEventListener('click', closeModal);
            document.getElementById('btn-confirm-legal-modal')?.addEventListener('click', closeModal);
            document.getElementById('legal-modal-backdrop')?.addEventListener('click', (e) => {
                if (e.target.id === 'legal-modal-backdrop') closeModal();
            });
        }
    };

    // =========================================================================
    // 2. 공용 비즈니스 유틸리티 (PDFDesk.Utils)
    // =========================================================================
    const Utils = {
        /**
         * 브라우저 메모리 상의 데이터를 안전하게 파일로 다운로드
         * @param {Blob|Uint8Array|ArrayBuffer} data - 바이너리 데이터
         * @param {string} filename - 다운로드 파일명
         * @param {string} [mimeType='application/pdf'] - MIME 타입
         */
        downloadFile(data, filename, mimeType = 'application/pdf') {
            const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            // 메모리 안전 해제
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },

        /**
         * 손상되거나 비표준인 PDF를 pdf.js를 통해 자체 자가 치유(Auto-Repair)하여 표준 PDFDocument로 재조합
         * @param {ArrayBuffer} arrayBuffer - 원본 파일 버퍼
         * @param {Function} [onProgress] - 진행률 콜백 (current, total, message)
         * @returns {Promise<PDFDocument>} 복구된 깨끗한 PDFDocument 인스턴스
         */
        async repairPdfWithPdfJs(arrayBuffer, onProgress = null) {
            console.warn('🛠️ [자가 치유] 비표준/손상된 PDF 감지 - pdf.js 기반 자동 복구 엔진 가동');
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer.slice(0),
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });
            const pdfjsDoc = await loadingTask.promise;
            const totalPages = pdfjsDoc.numPages;

            const { PDFDocument } = window.PDFLib;
            const repairedPdf = await PDFDocument.create();

            for (let p = 1; p <= totalPages; p++) {
                if (onProgress) {
                    onProgress(p, totalPages, `비표준 문서 자동 복구 중 (${p}/${totalPages})...`);
                }
                const page = await pdfjsDoc.getPage(p);
                const origViewport = page.getViewport({ scale: 1.0 });
                // 150% 스케일로 선명도와 성능의 균형 확보
                const renderViewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                canvas.width = renderViewport.width;
                canvas.height = renderViewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

                // 고화질 JPEG 압축으로 임베딩
                const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const embeddedImg = await repairedPdf.embedJpg(imgDataUrl);
                const newPage = repairedPdf.addPage([origViewport.width, origViewport.height]);
                newPage.drawImage(embeddedImg, {
                    x: 0,
                    y: 0,
                    width: origViewport.width,
                    height: origViewport.height
                });

                // 메모리 해제
                canvas.width = 0;
                canvas.height = 0;
                if (typeof page.cleanup === 'function') page.cleanup();
            }

            console.log(`✅ [자가 치유 완료] 총 ${totalPages}페이지 표준 PDFDocument 복구 완료`);
            return repairedPdf;
        },

        /**
         * 안전한 PDF 로더 (비표준/손상된 PDF 발견 시 자가 치유 엔진 자동 연동)
         * @param {File|Blob|ArrayBuffer|Object} fileOrBuffer - 파일 또는 버퍼
         * @param {Object} [options={}] - PDFDocument.load 옵션
         * @param {Function} [onProgress] - 진행률 콜백
         * @returns {Promise<PDFDocument>} PDFDocument 인스턴스
         */
        async loadPdfSafely(fileOrBuffer, options = {}, onProgress = null) {
            const { PDFDocument } = window.PDFLib;
            let arrayBuffer;
            if (fileOrBuffer instanceof ArrayBuffer) {
                arrayBuffer = fileOrBuffer;
            } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
                arrayBuffer = await fileOrBuffer.arrayBuffer();
            } else if (fileOrBuffer && fileOrBuffer.file instanceof File) {
                arrayBuffer = await fileOrBuffer.file.arrayBuffer();
            } else if (fileOrBuffer && fileOrBuffer.arrayBuffer) {
                arrayBuffer = await fileOrBuffer.arrayBuffer();
            } else {
                throw new Error('지원하지 않는 파일 형식입니다.');
            }

            try {
                // 1차 표준 고속 로드
                const pdfDoc = await PDFDocument.load(arrayBuffer, {
                    ignoreEncryption: true,
                    throwOnInvalidObject: false,
                    ...options
                });
                // 중요: pdf-lib은 getPageCount() 호출 시 내부 페이지 트리를 지연 평가(populate)하므로,
                // 비표준/손상 여부를 사전에 즉각 검증하여 손상 파일일 경우 catch 블록의 자가 치유로 유도합니다.
                pdfDoc.getPageCount();
                return pdfDoc;
            } catch (primaryError) {
                const errMsg = (primaryError.message || '').toLowerCase();
                // 암호화된 문서는 복구 불가하므로 사용자 안내를 위해 throw
                if (errMsg.includes('encrypted') || errMsg.includes('password')) {
                    throw primaryError;
                }
                // 그 외 모든 비표준/손상 PDF는 pdf.js 기반 자동 자가 치유 가동
                return await this.repairPdfWithPdfJs(arrayBuffer, onProgress);
            }
        },

        /**
         * PDF 처리 공통 에러 핸들러 (사용자 친화적 한국어 안내)
         * @param {Error} error - 발생한 오류 객체
         * @param {Object} [workspace] - WorkspaceTool 인스턴스 (hideProgress 호출용)
         */
        handlePdfError(error, workspace = null) {
            console.error('PDF 처리 오류:', error);
            let errMsg = '처리 중 오류가 발생했습니다.';

            if (error.message) {
                const msg = error.message.toLowerCase();
                if (msg.includes('expected instance') || msg.includes('invalid object') || msg.includes('corrupt')) {
                    errMsg = '일부 PDF 파일의 내부 구조가 손상되었거나 표준 규격과 맞지 않아 처리할 수 없습니다.\n\n해결 방법: 크롬 브라우저에서 해당 PDF를 열고 [인쇄] -> [PDF로 저장]하여 새 파일로 생성한 후 다시 시도해 보세요.';
                } else if (msg.includes('encrypted') || msg.includes('password')) {
                    errMsg = '보안(암호)이 설정된 PDF 문서는 처리할 수 없습니다. 암호를 해제한 후 업로드해 주세요.';
                } else if (msg.includes('jpg') || msg.includes('png')) {
                    errMsg = error.message;
                }
            }

            alert(errMsg);
            if (workspace && typeof workspace.hideProgress === 'function') {
                workspace.hideProgress();
            }
        },

        /**
         * 파일 확장자 보장 및 자동 생성 헬퍼
         * @param {string} inputName - 사용자 입력명
         * @param {string} fallbackPrefix - 기본 접두사
         * @param {string} ext - 확장자 (.pdf, .zip 등)
         * @returns {string} 완성된 파일명
         */
        buildFilename(inputName, fallbackPrefix, ext = '.pdf') {
            let name = (inputName || '').trim();
            if (!name) {
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                name = `KEP_PDF_${fallbackPrefix}_${dateStr}`;
            }
            if (!name.toLowerCase().endsWith(ext.toLowerCase())) {
                name += ext;
            }
            return name;
        },

        /**
         * SPA 화면 전환 후 동적으로 삽입된 구글 애드센스 광고를 안전하게 활성화
         * @param {HTMLElement} [container=document]
         */
        refreshAds(container = document) {
            try {
                if (window.adsbygoogle && window.PDFDesk.Config && window.PDFDesk.Config.adClient && !window.PDFDesk.Config.isDev) {
                    const adElements = container.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');
                    adElements.forEach(() => {
                        try {
                            (window.adsbygoogle = window.adsbygoogle || []).push({});
                        } catch (e) {
                            console.warn('애드센스 광고 푸시 스킵:', e);
                        }
                    });
                }
            } catch (err) {
                console.warn('광고 갱신 처리 중 오류:', err);
            }
        }
    };

    window.PDFDesk.UI = UI;
    window.PDFDesk.Utils = Utils;
})();
