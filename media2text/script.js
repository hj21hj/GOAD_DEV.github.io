// 스크립트 로드 확인용 로그
console.log("script.js loaded successfully");

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const resultArea = document.getElementById("resultArea");

// 전역 오류 핸들러 추가
window.onerror = (message, source, lineno, colno, error) => {
    console.error("Global error:", message, "at", source, "line", lineno);
    resultArea.textContent = "스크립트 실행 중 오류가 발생했습니다. 콘솔을 확인해 주세요.";
};

// Web Speech API 지원 여부 확인
if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.error("SpeechRecognition not supported");
    resultArea.textContent = "이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome 브라우저를 사용해 주세요.";
    throw new Error("SpeechRecognition not supported");
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'ko-KR'; // 한국어 설정

recognition.onresult = (event) => {
    console.log("Recognition result received");
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + '\n';
        } else {
            interimTranscript += transcript;
        }
    }

    resultArea.textContent = finalTranscript + interimTranscript;
};

recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    if (event.error === 'not-allowed') {
        resultArea.textContent = "마이크 권한이 허용되지 않았습니다. 브라우저 설정에서 마이크 접근을 허용해 주세요.";
    } else {
        resultArea.textContent = `오류 발생: ${event.error}`;
    }
};

recognition.onstart = () => {
    console.log("Speech recognition started");
};

recognition.onend = () => {
    console.log("Speech recognition ended");
};

// 마이크 권한 확인 함수
async function checkMicPermission() {
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        console.log("Microphone permission state:", permissionStatus.state);
        if (permissionStatus.state === 'denied') {
            resultArea.textContent = "마이크 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용해 주세요.";
            return false;
        } else if (permissionStatus.state === 'prompt') {
            resultArea.textContent = "마이크 권한을 요청합니다. 허용해 주세요.";
        }
        return true;
    } catch (error) {
        console.error("Permission check error:", error);
        resultArea.textContent = "마이크 권한 확인 중 오류가 발생했습니다.";
        return false;
    }
}

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

    // 마이크 권한 확인
    const hasPermission = await checkMicPermission();
    if (!hasPermission) return;

    if (validAudioTypes.includes(file.type)) {
        processAudio(file);
    } else if (validVideoTypes.includes(file.type)) {
        processVideo(file);
    } else {
        resultArea.textContent = "지원되지 않는 파일 형식입니다. MP3, WAV, MP4 파일을 업로드해주세요.";
    }
}

// 오디오 파일 처리
function processAudio(file) {
    console.log("Processing audio file:", file.name);
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadeddata = () => {
        console.log("Audio loaded, starting recognition...");
        try {
            recognition.start();
            audio.play();
            audio.onended = () => {
                console.log("Audio ended, stopping recognition...");
                recognition.stop();
            };
        } catch (error) {
            console.error("Recognition start error:", error);
            resultArea.textContent = "음성 인식 시작 중 오류가 발생했습니다.";
        }
    };
    audio.onerror = (e) => {
        console.error("Audio error:", e);
        resultArea.textContent = "오디오 파일 처리 중 오류가 발생했습니다.";
    };
}

// 비디오 파일 처리
function processVideo(file) {
    console.log("Processing video file:", file.name);
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
        console.log("Video loaded, starting recognition...");
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(video);
            source.connect(audioContext.destination);
            recognition.start();
            video.play();
            video.onended = () => {
                console.log("Video ended, stopping recognition...");
                recognition.stop();
            };
        } catch (error) {
            console.error("Recognition start error:", error);
            resultArea.textContent = "음성 인식 시작 중 오류가 발생했습니다.";
        }
    };
    video.onerror = (e) => {
        console.error("Video error:", e);
        resultArea.textContent = "비디오 파일 처리 중 오류가 발생했습니다.";
    };
}

// 초기화 함수
function resetAll() {
    recognition.stop();
    resultArea.textContent = "여기에 추출된 텍스트가 표시됩니다.";
    fileInput.value = "";
}

// 페이지 로드 시 초기 권한 확인
window.onload = async () => {
    console.log("Page loaded, checking permissions...");
    await checkMicPermission();
};