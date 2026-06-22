/**
 * PDFDesk - 상수 정의
 * 모든 처리는 100% 브라우저 클라이언트 사이드에서 이루어집니다.
 */
window.PDFDesk = window.PDFDesk || {};

window.PDFDesk.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB 경고용

// A 규격 Point 사이즈 (1 pt = 1/72 inch)
window.PDFDesk.PAGE_SIZES = {
    'A4': [595.28, 841.89],
    'A3': [841.89, 1190.55],
    'A2': [1190.55, 1683.78],
    'A1': [1683.78, 2383.94],
    'A0': [2383.94, 3370.39]
};
