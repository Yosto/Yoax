const preloadProgressItemSize = 40;
const preloadProgressWidth = 500;
const preloadImagesCount = 3 * preloadProgressWidth / preloadProgressItemSize;
const preloadRight = preloadProgressWidth - 4;
const jsLoadingCoefficient = 0.5;

var jsLoaded = false;
var jsLoadingProgress = 0;

function createImageElement(imgPath) {
    var image = document.createElement("img");
    image.setAttribute("src", imgPath);
    image.style.position = "absolute";
    return image;
}

function drawPreloadProgress(progress) {
    var allDivs = document.getElementById("preload-progress").children;
    for (var i = 0; i < allDivs.length; i++) {
        var drawProgress;
        if (jsLoaded) {
            drawProgress = jsLoadingCoefficient + progress * (1 - jsLoadingCoefficient);
        } else {
            drawProgress = jsLoadingCoefficient * progress;
        }
        allDivs[i].style.marginLeft = (preloadRight * i * drawProgress / allDivs.length) + "px";
    }
}

function initPreloadProgress() {
    var container = document.getElementById("preload-progress");
    for (var i = 0; i < preloadImagesCount - 1; i++) {
        container.appendChild(createImageElement("/images/progress_default.png"));
    }
    container.appendChild(createImageElement("/images/progress_eyes.png"));
}

function animateJsLoading() {
    jsLoadingProgress += 0.01;
    if (jsLoadingProgress <= jsLoadingCoefficient && !jsLoaded) {
        drawPreloadProgress(jsLoadingProgress);
        setTimeout(animateJsLoading, 10);
    }
}
