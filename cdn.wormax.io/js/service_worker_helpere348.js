function registerServiceWorker(title, message, icon, host, ttl) {
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register("./service_worker.js", {scope: "./"}).then(function (serviceWorker) {
            // TODO AS: do this without setInterval
            var intervalFunction = setInterval(function checkController() {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        command: "notification",
                        title: title,
                        message: message,
                        icon: icon,
                        host: host,
                        ttl: ttl
                    });
                    clearInterval(intervalFunction);
                }
            }, 100);
        });
    }
}
