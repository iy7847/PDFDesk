/**
 * PDFDesk Main Application Logic (Entry Point)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. pdf.js workerSrc 설정
    const setupPdfJs = setInterval(() => {
        if (window['pdfjs-dist/build/pdf']) {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            clearInterval(setupPdfJs);
            console.log('pdf.js workerSrc 설정 완료');
        }
    }, 100);

    const landingView = document.getElementById('landing-view');
    const workspaceContainer = document.getElementById('workspace-container');

    // Initialize Shared Modals
    window.PDFDesk.ProgressModal.init();
    window.PDFDesk.PagePreviewModal.init();

    // Initialize Feature Workspaces
    const resizeWorkspace = window.PDFDesk.initResize();
    const splitWorkspace = window.PDFDesk.initSplit();
    const maskingWorkspace = window.PDFDesk.initMasking();
    const watermarkWorkspace = window.PDFDesk.initWatermark();

    // 4. 네비게이션 연결 (렌더링 트리거)
    const btnNavResize = document.getElementById('nav-btn-resize');
    btnNavResize.addEventListener('click', () => {
        landingView.classList.add('hidden');
        workspaceContainer.classList.remove('hidden');
        resizeWorkspace.render(); 
        window.scrollTo(0, 0);
    });

    const btnNavSplit = document.getElementById('nav-btn-split');
    if (btnNavSplit) {
        btnNavSplit.addEventListener('click', () => {
            landingView.classList.add('hidden');
            workspaceContainer.classList.remove('hidden');
            splitWorkspace.render();
            window.scrollTo(0, 0);
        });
    }

    const btnNavMasking = document.getElementById('nav-btn-masking');
    if (btnNavMasking) {
        btnNavMasking.addEventListener('click', () => {
            landingView.classList.add('hidden');
            workspaceContainer.classList.remove('hidden');
            maskingWorkspace.render();
            window.scrollTo(0, 0);
        });
    }

    const btnNavWatermark = document.getElementById('nav-btn-watermark');
    if (btnNavWatermark) {
        btnNavWatermark.addEventListener('click', () => {
            landingView.classList.add('hidden');
            workspaceContainer.classList.remove('hidden');
            watermarkWorkspace.render();
            window.scrollTo(0, 0);
        });
    }

    // 5. 상단 로고 및 돌아가기 버튼 (전략 1 연장선: 강제 새로고침으로 홈 이동)
    const btnBackToMain = document.getElementById('btn-back-to-main');
    const logoLink = document.getElementById('logo-link');

    const goHome = (e) => {
        if(e) e.preventDefault();
        // hash(#) 등 찌꺼기를 날리고 무조건 완전 초기 상태로 이동하면서 강제 새로고침
        window.location.href = window.location.pathname; 
    };

    if (btnBackToMain) btnBackToMain.addEventListener('click', goHome);
    if (logoLink) logoLink.addEventListener('click', goHome);
});
