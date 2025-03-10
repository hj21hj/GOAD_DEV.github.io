console.log("script.js loaded successfully");

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const resultArea = document.getElementById("resultArea");

// 전역 오류 핸들러
window.onerror = (message, source, lineno, colno, error) => {
    console.error("Global error:", message, "at", source, "line", lineno);
    resultArea.textContent = "스크립트 실행 중 오류가 발생했습니다. 콘솔을 확인해 주세요.";
};

// 드래그 앤 드롭 이벤트
dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#f0f0f0";
});

dropArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#fff";
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#fff";
    const files = e.dataTransfer.files;
    handleFile(files[0]);
});

dropArea.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// 파일 처리 함수
async function handleFile(file) {
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    const validVideoTypes = ['video/mp4'];

    if (!file) return;

    console.log("Handling file:", file.name);
    resultArea.textContent = "파일을 처리 중입니다...";

    if (validAudioTypes.includes(file.type) || validVideoTypes.includes(file.type)) {
        await uploadFile(file);
    } else {
        resultArea.textContent = "지원되지 않는 파일 형식입니다. MP3, WAV, MP4 파일을 업로드해주세요.";
    }
}

// 백엔드로 파일 업로드 및 텍스트 추출
async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("YOUR_WHISPER_BACKEND_ENDPOINT", { // 예: "https://your-heroku-app.herokuapp.com/upload"
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }

        const data = await response.json();
        console.log("Text extracted:", data.text);
        resultArea.textContent = data.text || "텍스트를 추출하지 못했습니다.";
    } catch (error) {
        console.error("Upload error:", error);
        resultArea.textContent = "파일 처리 중 오류가 발생했습니다. 서버를 확인해 주세요.";
    }
}

// 초기화 함수
function resetAll() {
    resultArea.textContent = "여기에 추출된 텍스트가 표시됩니다.";
    fileInput.value = "";
}

// 페이지 로드 시 초기 메시지
window.onload = () => {
    console.log("Page loaded");
};