var CACHE_STATIC_NAME = 'static-v8';
var CACHE_DYNAMIC_NAME = 'dynamic-v6';

self.addEventListener('install', (event) => {
	console.log('[Service Worker] installing Service worker ...', event);

	event.waitUntil(
		// waitUntil: dont finish the installation event until the given promise is done
		caches.open(CACHE_STATIC_NAME).then(function (cache) {
			console.log('[Service Worker] Precaching App Shell');
			// cache.add and cache.addAll store both the key (request) and fetches the response for that request and stores it too
			// vs
			// cache.put, for which we need to provide what we want to store
			cache.addAll([
				'/',
				'/index.html', // we are caching requests/url
				'/offline.html',
				'/src/js/app.js',
				'/src/js/feed.js',
				'/src/js/material.min.js',
				'/src/css/app.css',
				'/src/css/feed.css',
				'/src/images/main-image.jpg',
				'https://fonts.googleapis.com/css?family=Roboto',
				'https://fonts.googleapis.com/icon?family=Material+Icons',
				'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
			]);
		})
	);
});

self.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activating Service worker...', event);

	event.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log('[Service Worker] Removing old cache: ', key);
						return caches.delete(key);
					}
				})
			);
		})
	);

	return self.clients.claim();
});

// Cache first with Network fallback strategy
// self.addEventListener('fetch', (event) => {
// 	if (!(event.request.url.indexOf('http') === 0)) return; // dont cache for non-http requests

// 	event.respondWith(
// 		caches.match(event.request).then((response) => {
// 			if (response) {
// 				return response;
// 			} else {
// 				return fetch(event.request)
// 					.then((res) => {
// 						return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
// 							cache.put(event.request.url, res.clone());
// 							return res;
// 						});
// 					})
// 					.catch((err) => {
// 						return caches.open(CACHE_STATIC_NAME).then((cache) => {
// 							return cache.match('/offline.html');
// 						});
// 					});
// 			}
// 		})
// 	);
// });

// Cache - then network
self.addEventListener('fetch', (event) => {
	const url = 'https://httpbin.org/get';

	if (!(event.request.url.indexOf('http') === 0)) return; // dont cache for non-http requests

	// if the request matches the url -> use Cache With Network
	// else use Cache first then Network Strategy
	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
				return fetch(event.request).then((res) => {
					cache.put(event.request, res.clone());
					return res;
				});
			})
		);
	} else {
		event.respondWith(
			caches
				.match(event.request)
				.then((response) => {
					if (response) {
						return response;
					} else {
						return fetch(event.request).then((res) =>
							caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
								cache.put(event.request.url, res.clone());
								return res;
							})
						);
					}
				})
				.catch((err) => {
					return caches.open(CACHE_STATIC_NAME).then((cache) => {
						if (event.request.url.indexOf('/help')) {
							return cache.match('/offline.html');
						}
					});
				})
		);
	}
});

// Network First with Cache fallback strategy - gives a bad UX when there is a slow network, or request fails/timesout after a long time.
// self.addEventListener('fetch', (event) => {
// 	if (!(event.request.url.indexOf('http') === 0)) return; // dont cache for non-http requests

// 	event.respondWith(
// 		fetch(event.request)
// 			.then((res) => {
// 				return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
// 					cache.put(event.request.url, res.clone());
// 					return res;
// 				});
// 			})
// 			.catch((err) => {
// 				return caches.match(event.request);
// 			})
// 	);
// });
