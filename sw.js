/**
 * KEP PDF - Service Worker (sw.js)
 * 100% 클라이언트 사이드 오프라인 실행 및 PWA 앱 설치 지원
 */

const CACHE_NAME = 'kep-pdf-v1.0.156';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './kep_logo.png',
    './favicon.ico',
    './js/constants.js',
    './js/i18n.js',
    './js/uiComponents.js',
    './js/sharedViewer.js',
    './js/progressModal.js',
    './js/workspaceTool.js',
    './js/resizeWorkspace.js',
    './js/splitWorkspace.js',
    './js/maskingWorkspace.js',
    './js/watermarkWorkspace.js',
    './js/convertWorkspace.js',
    './js/batchWorkspace.js',
    './js/app.js'
];

// 설치 단계 (Install)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 활성화 단계 (Activate - 구 캐시 정리)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 요청 가로채기 (Fetch - Network First with Cache Fallback)
self.addEventListener('fetch', (event) => {
    // CDN 및 외부 요청(구글 폰트, 애드센스 등)은 일반 네트워크 요청 처리
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
