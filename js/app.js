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

    // Initialize Shared Modal
    window.PDFDesk.ProgressModal.init();

    // Initialize Feature Workspaces
    const workspaces = {
        batch: window.PDFDesk.initBatch(),
        resize: window.PDFDesk.initResize(),
        split: window.PDFDesk.initSplit(),
        masking: window.PDFDesk.initMasking(),
        watermark: window.PDFDesk.initWatermark(),
        convert: window.PDFDesk.initConvert()
    };

    // 현재 활성화된 워크스페이스 추적
    let currentWorkspace = null;

    // 공용 워크스페이스 닫기 (홈으로 복귀)
    const closeWorkspace = (updateHistory = true) => {
        if (currentWorkspace && typeof currentWorkspace.clearWorkspace === 'function') {
            currentWorkspace.clearWorkspace();
        }
        currentWorkspace = null;
        workspaceContainer.classList.add('hidden');
        workspaceContainer.innerHTML = '';
        landingView.classList.remove('hidden');
        landingView.classList.add('block');
        window.scrollTo(0, 0);

        if (updateHistory && window.location.hash) {
            history.pushState(null, '', window.location.pathname + window.location.search);
        }
    };

    // 공용 워크스페이스 열기 (데스크톱 및 모바일 공용)
    const openWorkspace = (ws, updateHistory = true) => {
        if (!ws) return;
        if (currentWorkspace && currentWorkspace !== ws && typeof currentWorkspace.clearWorkspace === 'function') {
            currentWorkspace.clearWorkspace();
        }
        currentWorkspace = ws;
        landingView.classList.add('hidden');
        landingView.classList.remove('block');
        workspaceContainer.classList.remove('hidden');
        ws.render();
        window.scrollTo(0, 0);

        if (updateHistory && window.location.hash !== `#${ws.id}`) {
            history.pushState({ workspaceId: ws.id }, '', `#${ws.id}`);
        }
    };

    // 전역 노출 (workspaceTool 등에서 접근 가능)
    window.PDFDesk.closeWorkspace = closeWorkspace;
    window.PDFDesk.openWorkspace = openWorkspace;

    // 데스크톱 및 모바일 네비게이션 바인딩
    Object.keys(workspaces).forEach(id => {
        const ws = workspaces[id];
        
        // 1) 데스크톱 메인 카드 버튼
        const deskBtn = document.getElementById(`nav-btn-${id}`);
        if (deskBtn) {
            deskBtn.addEventListener('click', () => openWorkspace(ws));
        }

        // 2) 모바일 하단 네비게이션 버튼
        const mobileBtn = document.getElementById(`mobile-nav-${id}`);
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => openWorkspace(ws));
        }
    });

    // 브라우저 뒤로가기 / 앞으로가기 및 마우스 뒤로가기 버튼(Mouse 4th button) 완벽 지원
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && workspaces[hash]) {
            openWorkspace(workspaces[hash], false);
        } else {
            closeWorkspace(false);
        }
    });

    // 초기 URL 해시 확인 (새로고침 또는 딥링크 접속 시 해당 화면 열기)
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && workspaces[initialHash]) {
        openWorkspace(workspaces[initialHash], false);
    }

    // 상단 로고 클릭 시 홈 이동
    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeWorkspace(true);
        });
    }

    // ----------------------------------------------------
    // 푸터 법적 고지 모달 바인딩 (구글 애드센스 승인 필수 요건 & 다국어 완벽 지원)
    // ----------------------------------------------------
    const ui = window.PDFDesk.UI;

    const LEGAL_CONTENTS = {
        privacy: {
            ko: {
                title: '개인정보처리방침 (Privacy Policy)',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">1. 100% 로컬 브라우저 처리 및 무수집 원칙</h4>
                            <p>KEP PDF(이하 '서비스')는 이용자의 프라이버시와 문서 보안을 최우선으로 여깁니다. 본 서비스에서 처리되는 모든 PDF 문서, 이미지, 텍스트 데이터는 **외부 웹 서버로 단 1바이트도 전송되거나 저장되지 않으며**, 전적으로 이용자의 PC 브라우저 메모리(RAM) 환경에서만 연산됩니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">2. 구글 애드센스 및 광고 쿠키(Cookie) 안내</h4>
                            <p>본 서비스는 지속 가능한 무료 도구 제공을 위해 구글 애드센스(Google AdSense) 광고 플랫폼을 운영하고 있습니다. Google을 포함한 제3자 공급업체는 쿠키를 사용하여 사용자의 이전 웹사이트 방문 기록을 기반으로 광고를 게재할 수 있습니다. 사용자는 <a href="https://www.google.com/settings/ads" target="_blank" class="text-primary underline">Google 광고 설정</a>에서 맞춤형 광고를 비활성화하거나, 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">3. 개인정보의 파기 및 제3자 제공</h4>
                            <p>본 서비스는 서버에 개인 식별 정보나 문서 파일을 보관하지 않으므로 브라우저 탭을 닫거나 새로고침하는 즉시 모든 메모리 데이터는 완전히 소멸됩니다. 따라서 제3자에게 개인정보를 제공하거나 위탁하지 않습니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">4. 개인정보 보호책임자 및 문의</h4>
                            <p>서비스 이용 중 발생하는 보안 및 개인정보 관련 문의사항은 아래 공식 이메일로 접수해 주시기 바랍니다.<br>
                            - 공식 문의: <b class="text-on-surface">support@kendp.com</b></p>
                        </div>
                        <div class="text-[11px] text-on-surface-variant/70 pt-2 border-t border-outline-variant/30">
                            본 방침은 2026년 9월 14일부터 시행됩니다.
                        </div>
                    </div>
                `
            },
            en: {
                title: 'Privacy Policy',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">1. 100% Client-Side Processing & Zero Data Collection</h4>
                            <p>KEP PDF (the 'Service') places the utmost priority on user privacy and document confidentiality. All PDF files, images, and text data processed through this service are <b>never transmitted or stored on any external web servers (0 bytes sent)</b>, operating strictly within the user's PC browser memory (RAM).</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">2. Google AdSense & Advertising Cookies</h4>
                            <p>This Service utilizes the Google AdSense advertising platform to maintain sustainable and free access for all users. Third-party vendors, including Google, use cookies to serve relevant ads based on prior visits to websites. Users may opt out of personalized advertising via <a href="https://www.google.com/settings/ads" target="_blank" class="text-primary underline">Google Ads Settings</a>, or configure browser settings to decline cookie storage.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">3. Destruction of Data & Non-Disclosure to Third Parties</h4>
                            <p>Because the Service stores zero personal identification records or file copies on web servers, all in-memory data is instantly and irrevocably destroyed upon closing or reloading the browser tab. We never provide, sell, or entrust user data to any third party.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">4. Privacy Officer & Inquiries</h4>
                            <p>For any inquiries or feedback regarding privacy and security while using the service, please contact us at our official channel:<br>
                            - Official Contact: <b class="text-on-surface">support@kendp.com</b></p>
                        </div>
                        <div class="text-[11px] text-on-surface-variant/70 pt-2 border-t border-outline-variant/30">
                            Effective Date: September 14, 2026.
                        </div>
                    </div>
                `
            }
        },
        terms: {
            ko: {
                title: '서비스 이용약관 (Terms of Service)',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">제1조 (목적)</h4>
                            <p>본 약관은 KEP가 웹 브라우저를 통해 제공하는 KEP PDF 문서 가공 및 편의 기능(리사이징, 마스킹, 분할, 병합, 워터마크 등)의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">제2조 (이용의 원칙 및 비용)</h4>
                            <p>본 서비스는 개인, 기업, 공공기관 등 모든 이용자에게 조건 없이 100% 무료로 제공됩니다. 별도의 회원가입이나 라이선스 구매 없이 자유롭게 업무에 활용하실 수 있습니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">제3조 (이용자의 의무 및 제한)</h4>
                            <p>이용자는 관련 법령을 위반하거나 타인의 지적 재산권, 저작권, 영업비밀을 침해하는 불법적인 문서를 가공하는 행위를 하여서는 안 되며, 서비스의 정상적인 운영을 방해하는 비정상적 트래픽 공격을 시도할 수 없습니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">제4조 (지적재산권)</h4>
                            <p>이용자가 가공한 원본 문서 및 산출물에 대한 모든 권리와 저작권은 이용자 본인에게 귀속됩니다. 서비스 제공자는 이용자의 파일에 대해 어떠한 권리도 주장하지 않습니다.</p>
                        </div>
                    </div>
                `
            },
            en: {
                title: 'Terms of Service',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">Article 1 (Purpose)</h4>
                            <p>These Terms govern the conditions and rules for utilizing the browser-based PDF processing tools (resizing, masking, splitting, merging, watermarking, format conversion, etc.) provided by KEP.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">Article 2 (Free Usage & Commercial Accessibility)</h4>
                            <p>This Service is provided 100% free of charge without any restrictions to all individuals, commercial enterprises, and public entities. You may freely use all features for everyday professional workflows without registration or software license purchases.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">Article 3 (User Responsibilities & Restrictions)</h4>
                            <p>Users must not process illicit documents that violate applicable laws or infringe on third-party intellectual property, copyrights, or trade secrets. Users shall not execute malicious automated traffic attacks that impair service reliability.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">Article 4 (Intellectual Property & Ownership)</h4>
                            <p>All legal rights, titles, and copyrights to original files and converted outputs remain exclusively with the user. The service provider claims zero ownership or rights over user content.</p>
                        </div>
                    </div>
                `
            }
        },
        security: {
            ko: {
                title: '보안 정책 및 면책조항 (Security & Disclaimer)',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">1. 엔드-투-엔드(End-to-End) 로컬 보안 아키텍처</h4>
                            <p>KEP PDF는 클라우드 방식이 아닌 **클라이언트 사이드 전용 엔진**으로 작동합니다. 이용자가 드래그 앤 드롭한 도면 및 계약서는 인터넷 통신망을 타지 않으므로, 사내 망분리 환경이나 엄격한 보안 감사 기준이 적용되는 산업군에서도 안전하게 사용하실 수 있습니다.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">2. 브라우저 자원 한계 및 면책</h4>
                            <p>본 서비스는 이용자의 웹 브라우저 가상 머신(V8 엔진)에서 실행되므로, 컴퓨터의 가용 메모리(RAM)를 초과하는 극단적인 대용량 도면(단일 파일 100MB 이상 등) 작업 시 브라우저 강제 종료가 발생할 수 있습니다. 중요한 원본 파일은 사전에 백업해 두실 것을 권장하며, 기기 성능 한계로 인한 작업 손실에 대해 서비스는 책임을 지지 않습니다.</p>
                        </div>
                    </div>
                `
            },
            en: {
                title: 'Security Policy & Disclaimer',
                html: `
                    <div class="space-y-4 text-[13px] leading-relaxed">
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">1. End-to-End Local Security Architecture</h4>
                            <p>KEP PDF operates exclusively via a **pure client-side engine**, unlike conventional cloud upload services. Architectural drawings and sensitive contracts uploaded by users never traverse external networks, ensuring full compliance within air-gapped corporate intranets and rigorous security audit environments.</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-sm mb-1">2. Browser Resource Boundaries & Disclaimer of Liability</h4>
                            <p>Because the Service runs within the web browser's virtual machine (V8 engine), processing extremely heavy engineering drawings (e.g. single files over 100MB) exceeding physical RAM may lead to browser crashes. We strongly recommend maintaining backups of critical original files. KEP is not liable for operational disruptions resulting from local hardware or memory limits.</p>
                        </div>
                    </div>
                `
            }
        }
    };

    // 1) 개인정보처리방침
    document.getElementById('btn-footer-privacy')?.addEventListener('click', () => {
        if (!ui || !ui.showLegalModal) return;
        const lang = window.PDFDesk?.i18n?.currentLang === 'en' ? 'en' : 'ko';
        const content = LEGAL_CONTENTS.privacy[lang];
        ui.showLegalModal(content.title, content.html);
    });

    // 2) 서비스 이용약관
    document.getElementById('btn-footer-terms')?.addEventListener('click', () => {
        if (!ui || !ui.showLegalModal) return;
        const lang = window.PDFDesk?.i18n?.currentLang === 'en' ? 'en' : 'ko';
        const content = LEGAL_CONTENTS.terms[lang];
        ui.showLegalModal(content.title, content.html);
    });

    // 3) 보안 정책 및 면책
    document.getElementById('btn-footer-security')?.addEventListener('click', () => {
        if (!ui || !ui.showLegalModal) return;
        const lang = window.PDFDesk?.i18n?.currentLang === 'en' ? 'en' : 'ko';
        const content = LEGAL_CONTENTS.security[lang];
        ui.showLegalModal(content.title, content.html);
    });

    // ----------------------------------------------------
    // PWA Service Worker 등록 및 설치 프롬프트 바인딩
    // ----------------------------------------------------
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('KEP PDF Service Worker 등록 완료:', reg.scope))
                .catch((err) => console.warn('KEP PDF Service Worker 등록 실패:', err));
        });
    }

    let deferredPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');

    window.addEventListener('beforeinstallprompt', (e) => {
        // 브라우저 기본 미니 정보 표시줄 방지
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.classList.add('inline-flex');
        }
    });

    installBtn?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            if (installBtn) installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        if (installBtn) installBtn.classList.add('hidden');
        deferredPrompt = null;
    });
});
