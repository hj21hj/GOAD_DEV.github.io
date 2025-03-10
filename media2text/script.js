console.log("HJ made this!");

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const resultArea = document.getElementById("resultArea");

// Web Speech API 초기화
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'ko-KR'; // 한국어 설정

recognition.onresult = (event) => {
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
    resultArea.textContent = `오류 발생: ${event.error}`;
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
function handleFile(file) {
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    const validVideoTypes = ['video/mp4'];

    if (!file) return;

    resultArea.textContent = "파일을 처리 중입니다...";

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
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadeddata = () => {
        recognition.start();
        audio.play();
        audio.onended = () => recognition.stop();
    };
}

// 비디오 파일 처리 (오디오 추출 후 처리)
function processVideo(file) {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        source.connect(audioContext.destination);
        recognition.start();
        video.play();
        video.onended = () => recognition.stop();
    };
}

// 초기화 함수
function resetAll() {
    recognition.stop();
    resultArea.textContent = "여기에 추출된 텍스트가 표시됩니다.";
    fileInput.value = "";
}