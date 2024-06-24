const dropZone = document.getElementById("dropZone");
const pdfFileInput = document.getElementById("pdfFile");
const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");
const pdfIcon = document.getElementById("pdfIcon");
const progressBarContainer = document.getElementById("progressBarContainer");
const progressBar = document.getElementById("progressBar");

dropZone.addEventListener("click", () => pdfFileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("dragover")
);

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  if (e.dataTransfer.files.length > 0) {
    pdfFileInput.files = e.dataTransfer.files;
    uploadBtn.disabled = false;
    pdfIcon.style.display = "block";
  }
});

pdfFileInput.addEventListener("change", () => {
  if (pdfFileInput.files.length > 0) {
    uploadBtn.disabled = false;
    pdfIcon.style.display = "block";
  } else {
    uploadBtn.disabled = true;
    pdfIcon.style.display = "none";
  }
});

uploadBtn.addEventListener("click", () => {
  const formData = new FormData();
  formData.append("pdf", pdfFileInput.files[0]);

  progressBarContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressBar.textContent = "0%";

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const reader = response.body.getReader();
      const contentLength = +response.headers.get("Content-Length");

      let receivedLength = 0;
      let chunks = [];

      return new Response(
        new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                chunks.push(value);
                receivedLength += value.length;
                progressBar.style.width = `${
                  (receivedLength / contentLength) * 100
                }%`;
                progressBar.textContent = `${Math.round(
                  (receivedLength / contentLength) * 100
                )}%`;
                push();
              });
            }
            push();
          },
        })
      ).blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = "converted.docx";
      downloadBtn.style.display = "inline-block";
      progressBarContainer.style.display = "none";
    })
    .catch((error) => {
      console.error("Error:", error);
      progressBarContainer.style.display = "none";
    });
});
