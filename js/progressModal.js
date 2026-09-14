/**
 * PDFDesk - ProgressModal 모듈
 * 모든 처리는 100% 브라우저 클라이언트 사이드에서 이루어집니다.
 */
window.PDFDesk = window.PDFDesk || {};

(function() {
    class ProgressModal {
        static init() {
            const container = document.getElementById('global-modal-container');
            if(!container) return;
            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
            container.innerHTML = `
                <div id="progress-modal-backdrop" class="fixed inset-0 bg-surface-lowest/80 backdrop-blur-sm z-50 hidden flex-col items-center justify-center p-4">
                    <div class="bg-surface-bright w-full max-w-2xl rounded-2xl shadow-xl flex flex-col overflow-hidden border border-outline-variant">
                        <!-- Header -->
                        <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                            <h3 id="progress-modal-title" class="font-headline-md text-headline-sm font-bold text-on-surface">${t('ws_modal_processing', '작업 처리 중...')}</h3>
                            <button id="progress-modal-close" class="text-on-surface-variant hover:text-error transition-colors hidden">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <!-- Ad Slot -->
                        <div class="px-6 py-2 bg-surface-container-low border-b border-outline-variant flex justify-center">
                            ${window.PDFDesk.UI ? window.PDFDesk.UI.adSlot({ id: 'ad-slot-progress-modal', label: '작업 처리 중 광고 영역 (300x250)', format: 'box' }) : '<div class="h-40 flex items-center justify-center text-xs text-on-surface-variant">[광고 영역]</div>'}
                        </div>
                        
                        <!-- Progress Area -->
                        <div class="p-6 bg-surface-container-lowest">
                            <div id="progress-modal-info" class="flex justify-between items-end mb-2">
                                <span id="progress-modal-text" class="font-body-md text-on-surface font-medium">${t('ws_modal_ready', '준비 중...')}</span>
                                <span id="progress-modal-percent" class="font-headline-sm text-primary font-bold">0%</span>
                            </div>
                            <div class="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                                <div id="progress-modal-bar" class="bg-primary h-3 rounded-full w-0 transition-all duration-300"></div>
                            </div>
                        </div>
                        
                        <div id="progress-modal-actions" class="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant hidden flex-col items-center justify-center gap-3">
                            <p class="font-body-md text-on-surface-variant">${t('ws_modal_download_complete', '다운로드가 완료되었습니다.')}</p>
                            <button id="progress-modal-btn-close" class="px-6 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-bold transition-colors">
                                ${t('ws_modal_close', '닫기')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('progress-modal-close').addEventListener('click', ProgressModal.hide);
            document.getElementById('progress-modal-btn-close').addEventListener('click', () => {
                ProgressModal.hide();
                if (window.PDFDesk && typeof window.PDFDesk.closeWorkspace === 'function') {
                    window.PDFDesk.closeWorkspace(true);
                } else {
                    const workspaceContainer = document.getElementById('workspace-container');
                    const landingView = document.getElementById('landing-view');
                    if (workspaceContainer && landingView) {
                        workspaceContainer.classList.add('hidden');
                        workspaceContainer.innerHTML = '';
                        landingView.classList.remove('hidden');
                        landingView.classList.add('block');
                        window.scrollTo(0, 0);
                    }
                }
            });
        }

        static show(title = null) {
            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
            const defaultTitle = t('ws_modal_processing', '작업 처리 중...');
            document.getElementById('progress-modal-title').textContent = title || defaultTitle;
            document.getElementById('progress-modal-text').textContent = t('ws_modal_ready', '준비 중...');
            document.getElementById('progress-modal-percent').textContent = "0%";
            document.getElementById('progress-modal-bar').style.width = "0%";
            
            document.getElementById('progress-modal-close').classList.add('hidden');
            document.getElementById('progress-modal-actions').classList.add('hidden');
            document.getElementById('progress-modal-actions').classList.remove('flex');
            
            document.getElementById('progress-modal-info').classList.remove('hidden');
            document.getElementById('progress-modal-bar').parentElement.classList.remove('hidden');

            document.getElementById('progress-modal-backdrop').classList.remove('hidden');
            document.getElementById('progress-modal-backdrop').classList.add('flex');

            if (window.PDFDesk.Utils && typeof window.PDFDesk.Utils.refreshAds === 'function') {
                window.PDFDesk.Utils.refreshAds(document.getElementById('progress-modal-backdrop'));
            }
        }

        static update(percent, text) {
            const safePercent = Math.min(100, Math.max(0, percent));
            document.getElementById('progress-modal-percent').textContent = `${Math.round(safePercent)}%`;
            document.getElementById('progress-modal-bar').style.width = `${safePercent}%`;
            if (text) document.getElementById('progress-modal-text').textContent = text;
        }

        static complete(successText = null) {
            const t = (key, fallback) => PDFDesk.i18n ? PDFDesk.i18n.t(key, fallback) : fallback;
            const defaultSuccess = t('ws_modal_download_complete', '다운로드가 완료되었습니다.');
            const finalSuccessText = successText || defaultSuccess;
            
            document.getElementById('progress-modal-title').textContent = t('ws_modal_complete', '작업 완료!');
            document.getElementById('progress-modal-text').textContent = finalSuccessText;
            document.getElementById('progress-modal-percent').textContent = "100%";
            document.getElementById('progress-modal-bar').style.width = "100%";
            
            setTimeout(() => {
                document.getElementById('progress-modal-close').classList.remove('hidden');
                
                document.getElementById('progress-modal-info').classList.add('hidden');
                document.getElementById('progress-modal-bar').parentElement.classList.add('hidden');
                
                const actionsEl = document.getElementById('progress-modal-actions');
                actionsEl.querySelector('p').textContent = finalSuccessText;
                const closeBtn = document.getElementById('progress-modal-btn-close');
                if (closeBtn) closeBtn.textContent = t('ws_modal_close', '닫기');
                
                actionsEl.classList.remove('hidden');
                actionsEl.classList.add('flex');
            }, 800); 
        }

        static hide() {
            document.getElementById('progress-modal-backdrop').classList.add('hidden');
            document.getElementById('progress-modal-backdrop').classList.remove('flex');
        }
    }

    window.PDFDesk.ProgressModal = ProgressModal;
})();
