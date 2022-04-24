var onApply;

function stopEventPropagation(event) {
    event.stopImmediatePropagation();
}

function showPopup(contentHtml, applyText, applyCallback) {
    document.getElementById("popup-gradient").style.display = "block";
    document.getElementById("popup-content").innerHTML = contentHtml;
    selectText("popup-share-link");
    document.body.oncontextmenu = null;
    window.addEventListener("mousemove", stopEventPropagation, true); //disable background elements activity
    onApply = applyCallback;
    if (applyCallback) {
        document.getElementById("popup-edit").style.display = "inline-block";
        document.getElementById("popup-apply").textContent = applyText;
        document.getElementById("popup-apply").style.display = "inline-block";
        document.getElementById("popup-close").style.display = "none";
    } else {
        document.getElementById("popup-edit").style.display = "none";
        document.getElementById("popup-apply").style.display = "none";
        document.getElementById("popup-close").style.display = "block";
    }
}

function closePopup(id, apply) {
    window.removeEventListener("mousemove", stopEventPropagation, true); //enable background elements activity
    clearSelection();
    document.getElementById(id).style.display = "none";
    document.body.oncontextmenu = function () {
        return false;
    };
    if (apply && onApply) {
        var edit = document.getElementById("popup-edit");
        if (edit) {
            onApply(edit.value);
            edit.value = "";
        }
    }
    onApply = null;
}

function selectText(containerId) {
    var node = document.getElementById(containerId);
    if (!node) {
        return
    }
    var range;
    if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(node);
        window.getSelection().addRange(range);
    }
}

function clearSelection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {
        document.selection.empty();
    }
}
