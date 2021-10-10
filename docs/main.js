
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const progress = document.querySelector("progress");
const result = document.getElementById('result');

let isAnalyzing = false;

window.addEventListener("paste", function(e) {
    e.preventDefault();

    if (isAnalyzing) {
        return;
    }
    
    const items = e.clipboardData.items;
    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") !== -1) {
            imageItem = items[i];
            break;
        }
    }
    if (imageItem === null) {
        return;
    }

    const blob = imageItem.getAsFile();
    const blobURL = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = function () {
        canvas.width = this.width;
        canvas.height = this.height;
        context.drawImage(image, 0, 0);

        analysis(canvas);
    };
    image.src = blobURL;
}, false);

window.addEventListener("dragover", function(e) {
    e.preventDefault();
}, false);

window.addEventListener("drop", function(e) {
    e.preventDefault();

    if (isAnalyzing) {
        return;
    }

    const file = e.dataTransfer.files[0];
    if (file.type.indexOf("image/") === -1) return;

    const reader = new FileReader();
    const image = new Image();
    
    reader.onload = function (e) {
        image.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            context.drawImage(image, 0, 0);

            analysis(canvas);
        }
        image.src = e.target.result;
    }
    reader.readAsDataURL(file);
});

const analysis = function(canvas) {
    isAnalyzing = true;
    progress.value = 0;
    result.innerText = "解析中…";

    const worker = Tesseract.createWorker({
        logger: function(m) {
            if (m.status === "recognizing text") {
                progress.value = m.progress;
            }
        }
    });
    (async () => {
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const { data: { text } } = await worker.recognize(canvas.toDataURL());
        result.innerHTML = text.replace(/\r?\n/g, "<br>");
        await worker.terminate();
        isAnalyzing = false;
    })();
};
