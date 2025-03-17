document.addEventListener("DOMContentLoaded", () => {
  const capturePreviewBtn = document.getElementById("capturePreviewBtn");
  capturePreviewBtn.addEventListener("click", captureFullPage);
});

function captureFullPage() {
  document.getElementById("status").textContent = "상태: 전체 페이지 캡처 중...";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let tab = tabs[0];
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getPageDimensions
    }, (results) => {
      let dims = results[0].result;
      let { pageWidth, pageHeight, viewportWidth, viewportHeight } = dims;
      let yPositions = [];
      for (let y = 0; y < pageHeight; y += viewportHeight) {
        yPositions.push(y);
      }
      let shots = [];
      function captureAt(index) {
        if (index >= yPositions.length) {
          stitchImages(shots, viewportWidth, pageHeight, yPositions);
          return;
        }
        let y = yPositions[index];
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: scrollToPosition,
          args: [y]
        }, () => {
          setTimeout(() => {
            chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
              shots.push(dataUrl);
              captureAt(index + 1);
            });
          }, 500); // 스크롤 후 500ms 지연
        });
      }
      captureAt(0);
    });
  });
}

function getPageDimensions() {
  return {
    pageWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
}

function scrollToPosition(y) {
  window.scrollTo(0, y);
}

function stitchImages(shots, width, totalHeight, yPositions) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = totalHeight;
  let ctx = canvas.getContext("2d");
  let images = shots.map(src => {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  });
  Promise.all(images).then(imgs => {
    imgs.forEach((img, index) => {
      ctx.drawImage(img, 0, 0, width, img.height, 0, yPositions[index], width, img.height);
    });
    let finalDataUrl = canvas.toDataURL("image/png");
    chrome.storage.local.set({ fullPageDataUrl: finalDataUrl }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
    });
  }).catch(err => {
    console.error(err);
    document.getElementById("status").textContent = "상태: 캡처 오류 발생";
  });
}
