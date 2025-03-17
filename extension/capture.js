let selectedAreas = [];
let currentStep = 1;
let fullPageDataUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("fullPageDataUrl", (result) => {
    fullPageDataUrl = result.fullPageDataUrl;
    if (!fullPageDataUrl) {
      document.getElementById("status").textContent = "상태: 캡처된 이미지가 없습니다.";
      return;
    }
    document.getElementById("screenshot").src = fullPageDataUrl;
    document.getElementById("status").textContent = "상태: '① 제호' 지정 대기 중";
    document.getElementById("highlightTitle").disabled = false;
  });

  const titleBtn = document.getElementById("highlightTitle");
  const adBtn = document.getElementById("highlightAd");
  const dateBtn = document.getElementById("highlightDate");
  const downloadBtn = document.getElementById("downloadBtn");

  titleBtn.addEventListener("click", () => startHighlighting("제호", "highlightTitle", 1));
  adBtn.addEventListener("click", () => startHighlighting("배너", "highlightAd", 2));
  dateBtn.addEventListener("click", () => startHighlighting("게재일자", "highlightDate", 3));
  downloadBtn.addEventListener("click", downloadImage);

  chrome.runtime.sendMessage({ type: "getAreas" }, (response) => {
    selectedAreas = response.areas || [];
    updateUI();
  });
});

function startHighlighting(type, buttonId, step) {
  if (step !== currentStep) {
    alert(`⚠️ "${currentStep}번" 영역부터 지정해주세요.`);
    return;
  }
  document.getElementById("status").textContent = `상태: 페이지에서 "${type}" 영역을 드래그로 지정하세요`;
  injectDragOverlay(type, buttonId, step);
}

function updateUI() {
  currentStep = selectedAreas.length + 1;
  const buttons = ["highlightTitle", "highlightAd", "highlightDate"];
  buttons.forEach((id, index) => {
    const button = document.getElementById(id);
    if (index < selectedAreas.length) {
      button.textContent = `${button.textContent.split(" ")[0]} (지정됨)`;
      button.classList.add("completed");
      button.disabled = true;
    } else if (index === selectedAreas.length && fullPageDataUrl) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  });
  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.disabled = selectedAreas.length !== 3 || !fullPageDataUrl;
  if (!downloadBtn.disabled) {
    document.getElementById("status").textContent = "상태: 다운로드 준비 완료";
  } else if (fullPageDataUrl) {
    document.getElementById("status").textContent = `상태: "${currentStep}번" 지정 대기 중`;
  }
}

function downloadImage() {
  const img = new Image();
  img.src = fullPageDataUrl;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height + selectedAreas.length * 100;

    ctx.drawImage(img, 0, 0);
    selectedAreas.forEach((area, index) => {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(area.rect.x, area.rect.y, area.rect.width, area.rect.height);

      const yOffset = img.height + index * 100;
      ctx.drawImage(img, area.rect.x, area.rect.y, area.rect.width, area.rect.height, 0, yOffset, area.rect.width, area.rect.height);
      ctx.fillStyle = "white";
      ctx.fillRect(area.rect.width, yOffset, canvas.width - area.rect.width, 100);
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(`${area.type} (확인용)`, area.rect.width + 10, yOffset + 50);
    });

    const dataUrl = canvas.toDataURL("image/jpeg");
    chrome.downloads.download({
      url: dataUrl,
      filename: "webpage_capture.jpg"
    });
    document.getElementById("status").textContent = "상태: 다운로드 완료";

    chrome.runtime.sendMessage({ type: "resetAreas" });
    resetUI();
  };
}

function resetUI() {
  selectedAreas = [];
  currentStep = 1;
  const buttons = ["highlightTitle", "highlightAd", "highlightDate"];
  buttons.forEach((id, index) => {
    const button = document.getElementById(id);
    if (id === "highlightTitle") {
      button.textContent = "① 제호 지정";
    } else if (id === "highlightAd") {
      button.textContent = "② 배너 지정";
    } else if (id === "highlightDate") {
      button.textContent = "③ 게재일자 지정";
    }
    button.classList.remove("completed");
    button.disabled = index !== 0 || !fullPageDataUrl;
  });
  document.getElementById("downloadBtn").disabled = true;
  document.getElementById("status").textContent = fullPageDataUrl ? "상태: '① 제호' 지정 대기 중" : "상태: 캡처된 이미지가 없습니다.";
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "updateAreas") {
    selectedAreas = message.data;
    updateUI();
  }
});
