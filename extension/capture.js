// capture.js
(function() {
  function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }
  
  const captureId = getQueryParam('id');
  const originalUrl = getQueryParam('url'); // 필요 시 참고
  
  if (!captureId) {
    alert("캡처 ID가 없습니다.");
    return;
  }
  
  chrome.storage.local.get(captureId, function(result) {
    const dataUrl = result[captureId];
    if (!dataUrl) {
      alert("캡처 데이터를 찾을 수 없습니다.");
      return;
    }
    initCanvas(dataUrl);
  });
  
  function initCanvas(dataUrl) {
    const canvas = document.getElementById('captureCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
    
    let step = 0;
    const regions = [];
    const instructions = document.getElementById('instructions');
    
    canvas.addEventListener('click', function(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      step++;
      regions.push({ x, y, label: step });
      ctx.font = '30px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText(step.toString(), x, y);
      if (step === 1) {
        instructions.textContent = '2. 게재일자 영역을 클릭하세요.';
      } else if (step === 2) {
        instructions.textContent = '3. 광고 배너 영역을 클릭하세요.';
      } else if (step === 3) {
        instructions.textContent = '완료! PDF 다운로드 버튼을 클릭하세요.';
      }
    });
    
    document.getElementById('downloadBtn').addEventListener('click', function() {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('capture.pdf');
    });
    
    document.getElementById('closeBtn').addEventListener('click', function() {
      window.close();
    });
  }
})();
