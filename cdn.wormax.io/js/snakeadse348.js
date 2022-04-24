function SnakeAds(gameContainer, adContainer, extendedLoggingEnabled) {
    var adsLoader;
    var adsManager;
    var inProgress;
    var requestedTime;
    var timeoutTask;
    var canceledByTimeout;
    var onStatusCallback = function () {
    };

    window.addEventListener("error", function (e) {
        if (inProgress) {
            onStatusCallback("WINDOW_EXCEPTION", {name: "WindowErrorListener: " + e.error.toString(), message: e.error.toString(), stack: e.error.stack});
        }
    });

    (function () {
        var adDisplayContainer = new google.ima.AdDisplayContainer(adContainer);
        adDisplayContainer.initialize();
        adsLoader = new google.ima.AdsLoader(adDisplayContainer);
        adsLoader.getSettings().setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.INSECURE);
        adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded);
        adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

        function onAdsManagerLoaded(adsManagerLoadedEvent) {
            if (canceledByTimeout) {
                return
            }
            adsManager = adsManagerLoadedEvent.getAdsManager(gameContainer);
            adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
            adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
            adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
            adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onContentStarted);
            adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, reportStatus("SKIPPED"));
            adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, reportStatus("CLICK"));
            adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, reportStatus("PAUSED"));
            adsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, reportStatus("RESUMED"));
            adsManager.addEventListener(google.ima.AdEvent.Type.FIRST_QUARTILE, reportStatus("FIRST_QUARTILE"));
            adsManager.addEventListener(google.ima.AdEvent.Type.MIDPOINT, reportStatus("MIDPOINT"));
            adsManager.addEventListener(google.ima.AdEvent.Type.THIRD_QUARTILE, reportStatus("THIRD_QUARTILE"));
            adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, reportStatus("LOADED"));
            adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, reportStatus("COMPLETE"));
            try {
                adsManager.init(gameContainer.offsetWidth, gameContainer.offsetHeight, google.ima.ViewMode.NORMAL);
                adsManager.start();
            } catch (adError) {
                callOnStatusException(adError);
            }

            function reportStatus(name) {
                return function () {
                    onStatusCallback(name);
                }
            }
        }
    })();

    window.addEventListener("resize", function () {
        if (adsManager) {
            adsManager.resize(gameContainer.offsetWidth, gameContainer.offsetHeight, google.ima.ViewMode.NORMAL);
        }
    });

    function callOnStatusException(e) {
        onStatusCallback("EXCEPTION", {name: e.name, message: e.message, stack: e.stack});
    }

    function onContentPauseRequested(event) {
        cancelTimeoutTask();
        adContainer.style.display = "block";
        adsLoader.contentComplete();

        var contentType = "";
        var minSuggestedDuration = "";
        var creativeId = "";
        try {
            contentType = event.getAd().getContentType();
            minSuggestedDuration = event.getAd().getMinSuggestedDuration();
            creativeId = event.getAd().getCreativeId();
        } catch (adInfoError) {
            callOnStatusException(adInfoError);
        }
        onStatusCallback("CONTENT_PAUSE_REQUESTED", {contentType: contentType, creativeId: creativeId, minSuggestedDuration: minSuggestedDuration});
    }

    function onContentStarted(event) {
        if (extendedLoggingEnabled) {
            try {
                console.log("MediaUrl: " + event.getAd().getMediaUrl() + "; AdvertiserName: " + event.getAd().getAdvertiserName()
                    + "; Description: " + event.getAd().getDescription() + "; Title: " + event.getAd().getTitle());
            } catch (adInfoError) {
                callOnStatusException(adInfoError);
            }
        }
        onStatusCallback("STARTED");
    }

    function onContentResumeRequested() {
        adContainer.style.display = "none";
        adsLoader.contentComplete();
        adsManager.destroy();
        onStatusCallback("CONTENT_RESUME_REQUESTED");
        inProgress = false;
    }

    function onAdError(adErrorEvent) {
        cancelTimeoutTask();
        adContainer.style.display = "none";

        console.log(adErrorEvent.getError());
        if (adsManager) {
            adsManager.destroy();
        }

        var timeElapsed = new Date().getTime() - requestedTime;
        if (adErrorEvent.getError().getErrorCode() == 1012 && timeElapsed >= 0 && timeElapsed < 800) { //  1012=ADS_REQUEST_NETWORK_ERROR (not defined in HTML5 SDK)
            onStatusCallback("BLOCKED", {timeElapsed: timeElapsed});
        } else if (adErrorEvent.getError().getErrorCode() == google.ima.AdError.ErrorCode.VAST_EMPTY_RESPONSE
            || adErrorEvent.getError().getErrorCode() == 901 && adErrorEvent.getError().getInnerError() && adErrorEvent.getError().getInnerError().message == "Error: No ads available"
        ) {
            onStatusCallback("NO_ADS", {
                errorCode: adErrorEvent.getError().getErrorCode(),
                message: adErrorEvent.getError().getMessage(),
                innerError: adErrorEvent.getError().getInnerError(),
                vastErrorCode: adErrorEvent.getError().getVastErrorCode(),
                timeElapsed: timeElapsed
            });
        } else {
            onStatusCallback("ERROR", {
                errorCode: adErrorEvent.getError().getErrorCode(),
                message: adErrorEvent.getError().getMessage(),
                innerError: adErrorEvent.getError().getInnerError(),
                vastErrorCode: adErrorEvent.getError().getVastErrorCode(),
                timeElapsed: timeElapsed
            });
        }
        inProgress = false;
    }

    function onTimeout() {
        canceledByTimeout = true;
        inProgress = false;

        adContainer.style.display = "none";
        adsLoader.contentComplete();
        if (adsManager) {
            adsManager.destroy();
        }

        onStatusCallback("TIMEOUT");
    }

    function cancelTimeoutTask() {
        if (timeoutTask) {
            clearTimeout(timeoutTask);
            timeoutTask = null;
        }
    }

    this.requestAds = function (adTagUrl, onStatus, props) {
        onStatusCallback = onStatus;

        adContainer.style.display = "block";

        requestedTime = new Date().getTime();

        var adsRequest = new google.ima.AdsRequest();
        adsRequest.adTagUrl = adTagUrl;
        adsRequest.linearAdSlotWidth = gameContainer.offsetWidth;
        adsRequest.linearAdSlotHeight = gameContainer.offsetHeight;
        adsRequest.nonLinearAdSlotWidth = gameContainer.offsetWidth;
        adsRequest.nonLinearAdSlotHeight = gameContainer.offsetHeight;
        adsRequest.forceNonLinearFullSlot = true;
        adsLoader.requestAds(adsRequest);

        timeoutTask = setTimeout(onTimeout, parseInt(props.timeout) || 10000);
        canceledByTimeout = false;
        inProgress = true;
    };

}

