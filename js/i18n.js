/**
 * PDFDesk 초경량 다국어(i18n) 시스템 (js/i18n.js)
 * 
 * - 외부 라이브러리 없는 순수 Vanilla JS 기반 제로 디펜던시
 * - 메인 랜딩 및 6대 세부 워크스페이스 전면 다국어(한국어/영어) 지원
 * - 브라우저 기본 언어 감지 및 로컬스토리지(pdfdesk_lang) 영구 저장
 */

(function () {
    'use strict';

    window.PDFDesk = window.PDFDesk || {};

    const DICTIONARY = {
        ko: {
            // 헤더 & 공통
            nav_install_app: "앱 설치",
            nav_back: "돌아가기",
            nav_start: "시작하기",
            free_badge: "완전 무료",
            ad_notice: "정보 / 스폰서",

            // 상단 광고 Fallback 배너
            ad_top_title: "100% 브라우저 로컬 보안 처리",
            ad_top_desc: "업로드한 도면과 문서는 외부 서버로 절대 전송되지 않고 로컬 메모리에서 안전하게 보호됩니다.",
            ad_top_badge: "안전 보장",

            // 중간 광고 Fallback 배너
            ad_mid_title: "실무자 TIP: 도면 A4 일괄 규격화",
            ad_mid_desc: "CAD 도면(A0~A3)을 인쇄용 A4로 변환 시 자동 목차(TOC)를 함께 생성하면 관공서/감리 제출이 간편해집니다.",
            ad_mid_badge: "생산성 팁",

            // 하단 광고 Fallback 배너
            ad_bottom_title: "기업 및 관공서 100% 무료 이용",
            ad_bottom_desc: "상업적 이용 제한 및 회원가입 없이 모든 PDF 실무 편집 기능을 자유롭게 활용하세요.",
            ad_bottom_badge: "완전 무료",

            // 히어로 섹션
            hero_badge: "보안을 최우선으로, 로컬에서 처리하는 가장 안전한 PDF 솔루션",
            hero_title: "전문가를 위한 PDF 편집 솔루션",
            hero_desc: "건축 및 엔지니어링 도면, 계약서 등 모든 문서를 외부 서버 전송 없이 로컬 메모리 환경에서 안전하고 빠르게 처리하세요.",

            // 6대 기능 카드
            tool_batch_title: "🌟 올인원 파이프라인",
            tool_batch_desc: "여러 작업을 자유롭게 추가하여 한 번에 일괄 처리합니다.",
            tool_resize_title: "1. 리사이징 및 병합",
            tool_resize_desc: "대량의 PDF 파일을 단일 사이즈(A4 등)로 통일하고 하나의 파일로 병합합니다. (원본 크기 유지 가능)",
            tool_masking_title: "2. 문서 마스킹 (Flatten)",
            tool_masking_desc: "민감한 단가나 개인정보를 가리고, 텍스트 복사가 불가능하도록 영구 평탄화(Flatten)합니다.",
            tool_split_title: "3. 문서 분할",
            tool_split_desc: "대용량 PDF 문서에서 원하는 페이지만 골라 개별 파일로 분할 추출(ZIP 압축)합니다.",
            tool_watermark_title: "4. 워터마크",
            tool_watermark_desc: "저작권 보호를 위해 파일에 텍스트 워터마크를 일괄 적용합니다.",
            tool_convert_title: "5. 포맷 변환 (이미지 ↔ PDF)",
            tool_convert_desc: "다중 PDF를 이미지(ZIP)로 추출하거나, 여러 이미지 파일들을 병합해 PDF로 만듭니다.",

            // 실무 지침 아티클 섹션
            guide_tag: "실무 가이드 & 인사이트",
            guide_title: "도면 및 문서 보안을 위한 실무 지침",
            guide_card1_title: "도면 규격 통일 & 자동 목차",
            guide_card1_desc: "A0, A1, A2, A3 등 프로젝트마다 규격이 다른 CAD 변환 도면을 출력 및 인쇄 표준인 A4 규격으로 원본 비율 손실 없이 자동 맞춤 변환합니다. 파일명이 깨지지 않는 한글 목차(TOC)를 생성하여 공공기관 및 감리 제출용 보고서를 손쉽게 제작할 수 있습니다.",
            guide_card2_title: "영구 마스킹(Flatten)의 원리",
            guide_card2_desc: "일반 PDF 편집기에서 검은 도형을 위에 덮는 방식은 텍스트 레이어가 그대로 남아 복사가 가능합니다. KEP PDF는 대상 페이지를 고해상도 캔버스로 재렌더링한 후 이미지로 영구 구워내어(Flatten), 계약 단가나 개인정보가 어떤 도구로도 추출되지 않도록 완전 무력화합니다.",
            guide_card3_title: "100% 브라우저 메모리 보안",
            guide_card3_desc: "일반 클라우드 변환 사이트는 파일을 외부 서버로 전송하여 보관하므로 기업 보안 규정을 위반할 수 있습니다. KEP PDF는 최신 브라우저 메모리 기술을 활용해 사용자의 컴퓨터 내부에서만 처리되므로, 파일 데이터가 외부로 유출될 위험이 0%입니다.",

            // FAQ 섹션
            faq_title: "자주 묻는 질문",
            faq_q1: "업로드한 파일은 외부로 유출될 위험이 없나요?",
            faq_a1: "네, 전혀 없습니다. KEP PDF는 파일을 외부 서버로 일절 전송하지 않습니다. 모든 작업은 오직 사용자 PC 브라우저 메모리상에서만 직접 처리되므로 기밀 도면이나 개인정보가 100% 안전하게 보호됩니다.",
            faq_q2: "기업이나 공공기관에서 상업적으로 무료 이용 가능한가요?",
            faq_a2: "네, 개인과 기업, 공공기관 모두 제한 없이 100% 무료로 사용하실 수 있습니다. 별도의 회원가입이나 유료 결제 없이 모든 기능을 자유롭게 업무에 활용하세요.",
            faq_q3: "대용량 도면 문서도 처리가 가능한가요?",
            faq_a3: "네, 최적화된 스트리밍 렌더링으로 처리됩니다. 다만 브라우저가 사용할 수 있는 RAM 메모리 한계가 있으므로 단일 파일 기준 50MB 이내, 총합 100MB 이내의 작업을 권장합니다.",
            faq_q4: "암호(보안)가 걸린 PDF 문서도 편집할 수 있나요?",
            faq_a4: "열기 암호나 편집 제한 암호가 설정된 문서는 브라우저 보안 규정상 읽기가 차단됩니다. 해당 문서의 암호를 먼저 해제하신 후 파일을 업로드해 주시기 바랍니다.",
            faq_q5: "어떤 브라우저 환경을 권장하나요?",
            faq_a5: "최신 웹 표준(WebAssembly, Canvas 2D)을 완벽히 지원하는 Google Chrome, Microsoft Edge, Safari, Naver Whale 브라우저의 최신 버전을 권장합니다.",

            // 푸터
            footer_desc: "KEP PDF는 엔지니어와 실무자를 위해 서버 전송 없이 로컬 브라우저에서 100% 안전하게 동작하는 무료 PDF 도구입니다.",
            footer_privacy: "개인정보처리방침",
            footer_terms: "서비스 이용약관",
            footer_contact: "문의 및 피드백: support@kendp.com",

            // ==========================================
            // 워크스페이스 공통 UI (Workspace Common)
            // ==========================================
            ws_back: "돌아가기",
            ws_settings: "작업 설정",
            ws_dropzone_pdf_multi: "여기로 PDF 파일을 드래그하세요",
            ws_dropzone_pdf_single: "여기로 1개의 PDF 파일을 드래그하세요",
            ws_dropzone_img_multi: "여기로 이미지 파일들을 드래그하세요",
            ws_single_file_notice: "※ 범위 및 미리보기 적용을 위해 1개의 파일만 업로드 가능합니다.",
            ws_multi_files_notice: "(여러 파일 동시 선택 가능)",
            ws_selected_files: "선택된 파일:",
            ws_btn_add: "추가",
            ws_btn_delete_selected: "선택 지우기",
            ws_btn_clear_all: "모두 지우기",
            ws_grid_hint: "아래의 파일을 마우스와 Ctrl, Shift를 이용해서 다중 선택하고, Delete 키로 삭제할 수 있습니다.",
            ws_filename_label: "저장할 파일 이름",
            ws_filename_placeholder: "기본값: 자동으로 생성됨",

            // 1. 리사이징 및 병합 워크스페이스
            ws_resize_title: "용지 크기 통일 & 병합",
            ws_resize_btn: "병합 실행하기",
            ws_resize_paper_size: "용지 크기",
            ws_resize_size_a4: "A4 사이즈 (강제 맞춤)",
            ws_resize_size_a3: "A3 사이즈",
            ws_resize_size_a2: "A2 사이즈",
            ws_resize_size_a1: "A1 사이즈",
            ws_resize_size_a0: "A0 사이즈",
            ws_resize_size_orig: "원본 사이즈 유지 (가장 빠름)",
            ws_resize_orientation: "용지 방향",
            ws_resize_orient_auto: "자동 (원본 방향에 맞춤)",
            ws_resize_orient_port: "세로 고정 (Portrait)",
            ws_resize_orient_land: "가로 고정 (Landscape)",
            ws_resize_toc: "자동 목차(TOC) 생성",
            ws_resize_toc_desc: "병합된 파일의 맨 앞 장에 각 파일의 시작 페이지를 알려주는 목차를 추가합니다.",

            // 2. 분할 워크스페이스
            ws_split_title: "대용량 PDF 문서 분할",
            ws_split_btn: "선택 페이지 분할 다운로드 (ZIP)",
            ws_split_quick_all: "전체 선택",
            ws_split_quick_clear: "선택 해제",
            ws_split_quick_odd: "홀수 페이지",
            ws_split_quick_even: "짝수 페이지",
            ws_split_selected_badge: "선택됨",
            ws_split_range_label: "분할 범위 직접 입력",
            ws_split_range_placeholder: "예: 1-5, 8, 11-13 (비워두면 썸네일 기준)",

            // 3. 마스킹 워크스페이스
            ws_masking_title: "문서 마스킹 (Flatten)",
            ws_masking_btn: "마스킹 문서 내보내기",
            ws_masking_tool: "가림 도구",
            ws_masking_rect: "사각 가림",
            ws_masking_circle: "원형 가림",
            ws_masking_highlighter: "형광펜",
            ws_masking_eraser: "지우개",
            ws_masking_clear: "전체 지우기",
            ws_masking_options: "옵션 설정",
            ws_masking_stroke_width: "형광펜 굵기",
            ws_masking_color: "마스킹 색상",
            ws_masking_quality: "출력 해상도 (DPI)",
            ws_masking_quality_normal: "표준 품질 (150 DPI)",
            ws_masking_quality_high: "고품질 (200 DPI - 도면 권장)",
            viewer_nav_page: "페이지 이동",
            viewer_nav_prev: "이전 페이지/파일",
            viewer_nav_next: "다음 페이지/파일",

            // 4. 워터마크 워크스페이스
            ws_watermark_title: "텍스트/이미지 워터마크",
            ws_watermark_btn: "워터마크 일괄 적용하기",
            ws_watermark_type: "워터마크 타입",
            ws_watermark_type_text: "텍스트",
            ws_watermark_type_image: "이미지",
            ws_watermark_font_win: "윈도우 기본 폰트",
            ws_watermark_font_mac: "맥(Mac) 기본 폰트",
            ws_watermark_font_web: "안드로이드/웹 기본 폰트",
            ws_watermark_font_en: "영문 유명 폰트",
            ws_watermark_font_standard: "영문 표준 폰트",
            ws_watermark_font_korean: "한글 시스템 폰트 (Windows/Mac)",
            ws_watermark_font_custom: "직접 입력...",
            ws_watermark_font_placeholder: "폰트명 입력",
            ws_watermark_text: "워터마크 텍스트",
            ws_watermark_text_placeholder: "워터마크 텍스트 입력",
            ws_watermark_select_img: "이미지 파일 선택 (PNG/JPG)",
            ws_watermark_scale: "크기 배율",
            ws_watermark_width_ratio: "장평 (가로 폭)",
            ws_watermark_rotate: "회전 각도",
            ws_watermark_opacity: "불투명도",
            ws_watermark_preview_title: "실시간 워터마크 미리보기",
            ws_watermark_preview_desc: "파일을 선택하고 마우스 드래그로 워터마크 위치를 조정하세요.",
            ws_watermark_reset_title: "워터마크 위치/설정 초기화",
            ws_watermark_color_title: "워터마크 색상",
            ws_watermark_alert_nofile: "파일을 먼저 업로드해 주세요.",
            ws_watermark_alert_noimg: "워터마크로 사용할 이미지를 업로드해 주세요.",
            ws_watermark_alert_notext: "워터마크 텍스트를 입력해 주세요.",
            ws_watermark_success: "워터마크가 성공적으로 적용되었습니다!",

            // 5. 변환 워크스페이스
            ws_convert_title: "포맷 변환 (PDF ↔ 이미지)",
            ws_convert_btn: "변환 시작",
            ws_convert_mode: "변환 모드 선택",
            ws_convert_pdf2img: "PDF → 이미지 추출 (ZIP)",
            ws_convert_img2pdf: "이미지 → PDF 병합",
            ws_convert_format: "추출 이미지 포맷",
            ws_convert_format_jpg: "JPG (권장, 빠른 속도, 작은 용량)",
            ws_convert_format_png: "PNG (고화질, 무손실)",
            ws_convert_alert_nofile: "파일을 추가해주세요.",
            ws_convert_alert_pdfonly: "PDF에서 이미지로 변환하려면 PDF 파일만 올려주세요.",
            ws_convert_alert_imgonly: "이미지에서 PDF로 변환하려면 이미지 파일(JPG, PNG)만 올려주세요.",
            ws_convert_dropzone_pdf: "여기로 PDF 파일을 드래그하세요",
            ws_convert_dropzone_img: "여기로 이미지 파일(JPG, PNG)을 드래그하세요",

            // 6. 올인원 파이프라인
            ws_batch_title: "올인원 파이프라인 (단계별 마법사)",
            ws_batch_btn_ready: "파이프라인 시작하기",
            ws_batch_btn_step: "이 단계 적용",
            ws_batch_btn_download: "결과물 다운로드",
            ws_batch_step1_label: "1. 파이프라인 단계 구성",
            ws_batch_btn_add: "기능 추가",
            ws_batch_empty_msg: "추가된 작업이 없습니다.<br>우측 상단의 '기능 추가' 버튼을 누르세요.",
            ws_batch_all_added: "모든 기능이 추가되었습니다.",
            ws_batch_task_delete: "작업 삭제",
            ws_batch_finish_title: "모든 파이프라인 완료!",
            ws_batch_finish_desc: "성공적으로 파일이 처리되었습니다.",
            ws_batch_btn_restart: "처음부터 다시하기",
            ws_batch_dropzone_mixed: "여기로 파일(이미지, PDF)을 드래그하세요",
            ws_batch_dropzone_pdf: "여기로 PDF 파일을 드래그하세요",
            ws_batch_dropzone_waiting: "현재 파이프라인에 대기 중인 파일:",
            ws_batch_dropzone_done: "작업이 완료되었습니다. 좌측 하단에서 다운로드 하세요.",
            ws_batch_task_imgtopdf_title: "이미지 → PDF 변환",
            ws_batch_task_imgtopdf_desc: "업로드된 이미지를 PDF로 변환합니다.",
            ws_batch_task_imgtopdf_info: "추가 설정이 필요하지 않습니다. 원본 이미지를 A4 사이즈 기반의 PDF로 변환합니다.",
            ws_batch_task_merge_title: "파일 병합",
            ws_batch_task_merge_desc: "모든 파일을 하나의 PDF로 병합합니다.",
            ws_batch_task_merge_toc: "자동 목차(TOC) 첫 페이지에 생성",
            ws_batch_task_merge_toc_desc: "합쳐진 문서의 첫 페이지에 한글 파일명과 페이지 번호가 포함된 목차를 자동 생성합니다.",
            ws_batch_task_resize_title: "용지 리사이징",
            ws_batch_task_resize_desc: "PDF 페이지 크기를 통일합니다.",
            ws_batch_task_resize_size: "용지 규격",
            ws_batch_task_resize_ori: "용지 방향",
            ws_batch_task_resize_auto: "방향 자동 회전 (권장)",
            ws_batch_task_resize_port: "세로 방향 고정",
            ws_batch_task_resize_land: "가로 방향 고정",
            ws_batch_task_wm_title: "워터마크",
            ws_batch_task_wm_desc: "텍스트 워터마크를 삽입합니다.",
            ws_batch_task_wm_text: "워터마크 문구",
            ws_batch_task_wm_pos: "배치 위치",
            ws_batch_task_wm_pos_center: "정중앙 (크게)",
            ws_batch_task_wm_pos_diag: "대각선 패턴",
            ws_batch_task_wm_pos_br: "우측 하단 (작게)",
            ws_batch_task_wm_pos_tl: "좌측 상단 (작게)",
            ws_batch_task_wm_color: "색상",
            ws_batch_task_masking_title: "마스킹 (복사방지)",
            ws_batch_task_masking_desc: "텍스트와 이미지를 병합하여 복사를 방지합니다.",
            ws_batch_task_masking_info: "마스킹(래스터화) 작업은 시간이 다소 소요될 수 있으며, 텍스트 복사를 방지하기 위해 전체 페이지를 고해상도 이미지로 변환합니다.",
            ws_batch_task_split_title: "페이지 분할",
            ws_batch_task_split_desc: "PDF를 여러 파일로 쪼갭니다.",
            ws_batch_task_split_mode: "분할 단위",
            ws_batch_task_split_1: "1페이지씩 개별 분할",
            ws_batch_task_split_2: "2페이지씩 묶어서 분할",
            ws_batch_task_pdftoimg_title: "PDF → 이미지 변환",
            ws_batch_task_pdftoimg_desc: "최종 PDF를 이미지 파일로 변환합니다.",
            ws_batch_task_pdftoimg_format: "출력 이미지 포맷",
            ws_batch_task_pdftoimg_jpg: "고해상도 JPG 포맷 (빠르고 가벼움)",
            ws_batch_task_pdftoimg_png: "고해상도 PNG 포맷 (무손실)",

            // 진행 모달
            ws_modal_processing: "작업 처리 중...",
            ws_modal_complete: "작업 완료!",
            ws_modal_download: "결과 파일 다운로드",
            ws_modal_download_complete: "다운로드가 완료되었습니다.",
            ws_modal_ready: "준비 중...",
            ws_modal_close: "닫기"
        },
        en: {
            // Header & Common
            nav_install_app: "Install App",
            nav_back: "Back",
            nav_start: "Start",
            free_badge: "100% Free",
            ad_notice: "INFO / SPONSORED",

            // Top Ad Fallback Banner
            ad_top_title: "100% Browser Local Security",
            ad_top_desc: "Uploaded drawings and documents are never sent to external servers. Everything is processed safely in your browser memory.",
            ad_top_badge: "Secure Guaranteed",

            // Middle Ad Fallback Banner
            ad_mid_title: "Pro TIP: Standardize Drawings to A4",
            ad_mid_desc: "When converting CAD drawings (A0-A3) to standard A4, generate an automatic Table of Contents (TOC) for instant audit submission.",
            ad_mid_badge: "Pro Tip",

            // Bottom Ad Fallback Banner
            ad_bottom_title: "100% Free for Business & Enterprise",
            ad_bottom_desc: "Use all professional PDF utilities freely without sign-up or commercial restrictions.",
            ad_bottom_badge: "100% Free",

            // Hero Section
            hero_badge: "Security First: The Most Secure Local PDF Solution",
            hero_title: "Professional PDF Solution for Engineers",
            hero_desc: "Process architectural blueprints, CAD drawings, and confidential contracts directly in your local browser memory without server transfers.",

            // 6 Tool Cards
            tool_batch_title: "🌟 All-in-One Pipeline",
            tool_batch_desc: "Chain multiple PDF tasks freely and execute them all in a single automated batch.",
            tool_resize_title: "1. Resize & Merge",
            tool_resize_desc: "Standardize mixed PDF sizes (A0~A3) to uniform A4 and merge with auto Table of Contents.",
            tool_masking_title: "2. Redaction & Flatten",
            tool_masking_desc: "Permanently flatten and burn redacted areas into raster canvas so text can never be copied.",
            tool_split_title: "3. Split PDF",
            tool_split_desc: "Visually select specific pages from large PDFs and extract them into individual files (ZIP).",
            tool_watermark_title: "4. Watermark",
            tool_watermark_desc: "Batch apply customizable text watermarks across all pages for copyright protection.",
            tool_convert_title: "5. Format Conversion (PDF ↔ Image)",
            tool_convert_desc: "Extract PDF pages into JPG/PNG images (ZIP) or combine multiple photos into a single PDF.",

            // Educational Section
            guide_tag: "Practical Guides & Insights",
            guide_title: "Security Guidelines for Blueprints & Contracts",
            guide_card1_title: "Standardizing Blueprints & Auto TOC",
            guide_card1_desc: "Automatically fits large CAD drawings (A0, A1, A2, A3) into standard A4 without aspect distortion. Generates clean Table of Contents for official audit submissions.",
            guide_card2_title: "The Principle of Permanent Flattening",
            guide_card2_desc: "Drawing black boxes in regular PDF editors leaves text selectable underneath. KEP PDF re-renders pages onto high-res canvas and bakes them into raster images to permanently neutralize data extraction.",
            guide_card3_title: "100% In-Memory Local Security",
            guide_card3_desc: "Traditional cloud PDF services upload your files to remote servers. KEP PDF processes everything strictly within your computer RAM, guaranteeing 0% data leakage risk.",

            // FAQ Section
            faq_title: "Frequently Asked Questions",
            faq_q1: "Is there any risk of file leakage?",
            faq_a1: "None at all. KEP PDF never sends your files to any server. Everything is executed entirely within your browser memory, keeping your documents 100% secure.",
            faq_q2: "Can corporations or institutions use this for free?",
            faq_a2: "Yes, KEP PDF is completely free for both personal and commercial use without account registration or subscription fees.",
            faq_q3: "Can it handle large drawing documents?",
            faq_a3: "Yes, it uses optimized streaming rendering. We recommend files up to 50MB per document (total 100MB) due to browser RAM limits.",
            faq_q4: "Can it edit password-protected PDFs?",
            faq_a4: "Encrypted documents cannot be opened due to browser security protocols. Please remove the password before uploading.",
            faq_q5: "Which browsers are recommended?",
            faq_a5: "We recommend modern browsers supporting WebAssembly and Canvas 2D: Google Chrome, Microsoft Edge, Safari, and Brave.",

            // Footer
            footer_desc: "KEP PDF is a serverless, 100% client-side PDF utility built for engineers and professionals.",
            footer_privacy: "Privacy Policy",
            footer_terms: "Terms of Service",
            footer_contact: "Contact & Feedback: support@kendp.com",

            // ==========================================
            // Workspace Common UI
            // ==========================================
            ws_back: "Back",
            ws_settings: "Settings",
            ws_dropzone_pdf_multi: "Drag and drop PDF files here",
            ws_dropzone_pdf_single: "Drag and drop a single PDF file here",
            ws_dropzone_img_multi: "Drag and drop image files here",
            ws_single_file_notice: "※ Only 1 file is supported for preview & range selection.",
            ws_multi_files_notice: "(Multiple files allowed)",
            ws_selected_files: "Selected Files:",
            ws_btn_add: "Add Files",
            ws_btn_delete_selected: "Delete Selected",
            ws_btn_clear_all: "Clear All",
            ws_grid_hint: "Select files using Click, Ctrl, or Shift. Press Delete to remove.",
            ws_filename_label: "Output Filename",
            ws_filename_placeholder: "Default: Auto generated",

            // 1. Resize & Merge Workspace
            ws_resize_title: "Resize & Merge",
            ws_resize_btn: "Run Merge",
            ws_resize_paper_size: "Paper Size",
            ws_resize_size_a4: "A4 Size (Force Fit)",
            ws_resize_size_a3: "A3 Size",
            ws_resize_size_a2: "A2 Size",
            ws_resize_size_a1: "A1 Size",
            ws_resize_size_a0: "A0 Size",
            ws_resize_size_orig: "Keep Original Size (Fastest)",
            ws_resize_orientation: "Orientation",
            ws_resize_orient_auto: "Auto (Match Original)",
            ws_resize_orient_port: "Portrait",
            ws_resize_orient_land: "Landscape",
            ws_resize_toc: "Generate Table of Contents (TOC)",
            ws_resize_toc_desc: "Adds a TOC page at the beginning indicating start page of each file.",

            // 2. Split Workspace
            ws_split_title: "Split PDF Document",
            ws_split_btn: "Download Selected Pages (ZIP)",
            ws_split_quick_all: "Select All",
            ws_split_quick_clear: "Clear",
            ws_split_quick_odd: "Odd Pages",
            ws_split_quick_even: "Even Pages",
            ws_split_selected_badge: "Selected",
            ws_split_range_label: "Custom Page Range",
            ws_split_range_placeholder: "e.g. 1-5, 8, 11-13 (Leave blank for thumbnails)",

            // 3. Masking Workspace
            ws_masking_title: "Redaction & Flatten",
            ws_masking_btn: "Export Flattened PDF",
            ws_masking_tool: "Redaction Tool",
            ws_masking_rect: "Rectangle",
            ws_masking_circle: "Circle",
            ws_masking_highlighter: "Highlight",
            ws_masking_eraser: "Eraser",
            ws_masking_clear: "Clear All",
            ws_masking_options: "Options",
            ws_masking_stroke_width: "Stroke Width",
            ws_masking_color: "Mask Color",
            ws_masking_quality: "Resolution (DPI)",
            ws_masking_quality_normal: "Standard (150 DPI)",
            ws_masking_quality_high: "High-Res (200 DPI - Blueprints)",
            viewer_nav_page: "Page Navigation",
            viewer_nav_prev: "Previous Page/File",
            viewer_nav_next: "Next Page/File",


            // 4. Watermark Workspace
            ws_watermark_title: "Text & Image Watermark",
            ws_watermark_btn: "Apply Watermark to All",
            ws_watermark_type: "Watermark Type",
            ws_watermark_type_text: "Text",
            ws_watermark_type_image: "Image",
            ws_watermark_font_win: "Windows Fonts",
            ws_watermark_font_mac: "Mac Fonts",
            ws_watermark_font_web: "Android / Web Fonts",
            ws_watermark_font_en: "Western Fonts",
            ws_watermark_font_standard: "Standard Western Fonts",
            ws_watermark_font_korean: "Korean System Fonts (Windows/Mac)",
            ws_watermark_font_custom: "Custom Font...",
            ws_watermark_font_placeholder: "Enter font family",
            ws_watermark_text: "Watermark Text",
            ws_watermark_text_placeholder: "Enter watermark text",
            ws_watermark_select_img: "Select Image File (PNG/JPG)",
            ws_watermark_scale: "Scale Multiplier",
            ws_watermark_width_ratio: "Width Ratio",
            ws_watermark_rotate: "Rotation Angle",
            ws_watermark_opacity: "Opacity",
            ws_watermark_preview_title: "Live Watermark Preview",
            ws_watermark_preview_desc: "Select a file and drag on canvas to adjust watermark position.",
            ws_watermark_reset_title: "Reset Watermark Position/Settings",
            ws_watermark_color_title: "Watermark Color",
            ws_watermark_alert_nofile: "Please upload files first.",
            ws_watermark_alert_noimg: "Please select an image for watermark.",
            ws_watermark_alert_notext: "Please enter watermark text.",
            ws_watermark_success: "Watermark applied successfully!",

            // 5. Convert Workspace
            ws_convert_title: "Format Conversion (PDF ↔ Image)",
            ws_convert_btn: "Start Conversion",
            ws_convert_mode: "Conversion Mode",
            ws_convert_pdf2img: "PDF → Image Extract (ZIP)",
            ws_convert_img2pdf: "Images → Single PDF",
            ws_convert_format: "Extracted Image Format",
            ws_convert_format_jpg: "JPG (Fast, Compact size)",
            ws_convert_format_png: "PNG (Lossless, High Quality)",
            ws_convert_alert_nofile: "Please add files first.",
            ws_convert_alert_pdfonly: "Please upload PDF files only for PDF to Image conversion.",
            ws_convert_alert_imgonly: "Please upload image files (JPG, PNG) only for Image to PDF conversion.",
            ws_convert_dropzone_pdf: "Drag and drop PDF files here",
            ws_convert_dropzone_img: "Drag and drop image files (JPG, PNG) here",

            // 6. Batch Workspace
            ws_batch_title: "All-in-One Pipeline (Step-by-Step Wizard)",
            ws_batch_btn_ready: "Start Pipeline",
            ws_batch_btn_step: "Apply This Step",
            ws_batch_btn_download: "Download Result",
            ws_batch_step1_label: "1. Pipeline Steps",
            ws_batch_btn_add: "Add Step",
            ws_batch_empty_msg: "No steps added yet.<br>Click the 'Add Step' button above.",
            ws_batch_all_added: "All available steps have been added.",
            ws_batch_task_delete: "Remove Step",
            ws_batch_finish_title: "All Pipeline Steps Complete!",
            ws_batch_finish_desc: "Files have been processed successfully.",
            ws_batch_btn_restart: "Restart from Beginning",
            ws_batch_dropzone_mixed: "Drag and drop files (PDF, Images) here",
            ws_batch_dropzone_pdf: "Drag and drop PDF files here",
            ws_batch_dropzone_waiting: "Files currently waiting in pipeline:",
            ws_batch_dropzone_done: "Processing complete. Download from bottom left.",
            ws_batch_task_imgtopdf_title: "Images → PDF",
            ws_batch_task_imgtopdf_desc: "Converts uploaded images into a PDF.",
            ws_batch_task_imgtopdf_info: "No additional settings required. Converts original images to an A4-based PDF.",
            ws_batch_task_merge_title: "Merge Files",
            ws_batch_task_merge_desc: "Merges all files into a single PDF.",
            ws_batch_task_merge_toc: "Generate Table of Contents (TOC) on first page",
            ws_batch_task_merge_toc_desc: "Automatically creates a TOC with filenames and page numbers on page 1.",
            ws_batch_task_resize_title: "Resize Pages",
            ws_batch_task_resize_desc: "Standardizes PDF page dimensions.",
            ws_batch_task_resize_size: "Paper Size",
            ws_batch_task_resize_ori: "Orientation",
            ws_batch_task_resize_auto: "Auto Orientation (Recommended)",
            ws_batch_task_resize_port: "Portrait Fixed",
            ws_batch_task_resize_land: "Landscape Fixed",
            ws_batch_task_wm_title: "Watermark",
            ws_batch_task_wm_desc: "Inserts custom text watermark.",
            ws_batch_task_wm_text: "Watermark Text",
            ws_batch_task_wm_pos: "Placement",
            ws_batch_task_wm_pos_center: "Center (Large)",
            ws_batch_task_wm_pos_diag: "Diagonal Pattern",
            ws_batch_task_wm_pos_br: "Bottom-Right (Small)",
            ws_batch_task_wm_pos_tl: "Top-Left (Small)",
            ws_batch_task_wm_color: "Color",
            ws_batch_task_masking_title: "Redaction & Flatten",
            ws_batch_task_masking_desc: "Flattens text and layers to prevent copying.",
            ws_batch_task_masking_info: "Flattening converts all pages to raster images to permanently prevent text extraction. This may take some time.",
            ws_batch_task_split_title: "Split PDF",
            ws_batch_task_split_desc: "Splits the PDF into multiple files.",
            ws_batch_task_split_mode: "Split Interval",
            ws_batch_task_split_1: "Split each single page",
            ws_batch_task_split_2: "Split every 2 pages",
            ws_batch_task_pdftoimg_title: "PDF → Images",
            ws_batch_task_pdftoimg_desc: "Converts final PDF pages to image files.",
            ws_batch_task_pdftoimg_format: "Output Format",
            ws_batch_task_pdftoimg_jpg: "High-Res JPG (Fast & Lightweight)",
            ws_batch_task_pdftoimg_png: "High-Res PNG (Lossless)",

            // Progress Modal
            ws_modal_processing: "Processing...",
            ws_modal_complete: "Complete!",
            ws_modal_download: "Download Result",
            ws_modal_download_complete: "Download has been completed.",
            ws_modal_ready: "Preparing...",
            ws_modal_close: "Close"
        }
    };

    class I18nManager {
        constructor() {
            this.storageKey = 'pdfdesk_lang';
            this.currentLang = this.detectInitialLanguage();
        }

        detectInitialLanguage() {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && (saved === 'ko' || saved === 'en')) {
                return saved;
            }
            const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
            return navLang.startsWith('ko') ? 'ko' : 'en';
        }

        getLang() {
            return this.currentLang;
        }

        setLang(lang) {
            if (lang !== 'ko' && lang !== 'en') return;
            this.currentLang = lang;
            localStorage.setItem(this.storageKey, lang);
            this.applyTranslations();
            this.updateLanguageToggleUI();

            // 언어 변경 커스텀 이벤트 발행 (열린 워크스페이스 실시간 리렌더링)
            window.dispatchEvent(new CustomEvent('pdfdesk:lang-changed', { detail: { lang } }));
        }

        t(key) {
            const dict = DICTIONARY[this.currentLang] || DICTIONARY.ko;
            return dict[key] !== undefined ? dict[key] : key;
        }

        applyTranslations() {
            document.documentElement.lang = this.currentLang;

            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                const text = this.t(key);
                if (text && text !== key) {
                    el.textContent = text;
                }
            });

            const titleElements = document.querySelectorAll('[data-i18n-title]');
            titleElements.forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                const text = this.t(key);
                if (text && text !== key) {
                    el.setAttribute('title', text);
                }
            });

            const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
            placeholderElements.forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                const text = this.t(key);
                if (text && text !== key) {
                    el.setAttribute('placeholder', text);
                }
            });
        }

        updateLanguageToggleUI() {
            const btnKo = document.getElementById('lang-btn-ko');
            const btnEn = document.getElementById('lang-btn-en');
            if (!btnKo || !btnEn) return;

            if (this.currentLang === 'ko') {
                btnKo.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-primary text-on-primary transition-all shadow-sm';
                btnEn.className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-on-surface-variant hover:text-on-surface transition-all';
            } else {
                btnKo.className = 'px-2.5 py-1 text-xs font-semibold rounded-md text-on-surface-variant hover:text-on-surface transition-all';
                btnEn.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-primary text-on-primary transition-all shadow-sm';
            }
        }

        init() {
            this.applyTranslations();
            this.updateLanguageToggleUI();

            const btnKo = document.getElementById('lang-btn-ko');
            const btnEn = document.getElementById('lang-btn-en');
            if (btnKo) {
                btnKo.addEventListener('click', () => this.setLang('ko'));
            }
            if (btnEn) {
                btnEn.addEventListener('click', () => this.setLang('en'));
            }
        }
    }

    window.PDFDesk.i18n = new I18nManager();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.PDFDesk.i18n.init());
    } else {
        window.PDFDesk.i18n.init();
    }
})();
