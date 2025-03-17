// Web Speech API 초기화
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ko-KR';
recognition.continuous = true;
recognition.interimResults = true;

const resultDiv = document.getElementById('result');
let transcript = '';

// 음성 인식 결과 처리
recognition.onresult = (event) => {
  transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('\n');
  resultDiv.textContent = transcript || '변환된 텍스트가 없습니다.';
};

recognition.onerror = (event) => {
  resultDiv.textContent = `오류 발생: ${event.error}`;
  resultDiv.classList.add('error');
};

recognition.onend = () => {
  resultDiv.classList.remove('loading');
};

// 오디오 파일 처리
document.getElementById('audioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const audioFile = document.getElementById('audioFile').files[0];
  const audioPlayer = document.getElementById('audioPlayer');

  if (!audioFile) {
    alert('오디오 파일을 선택해주세요.');
    return;
  }

  resultDiv.textContent = '처리 중입니다...';
  resultDiv.classList.add('loading');
  transcript = '';

  // 오디오 파일을 Blob URL로 변환
  const audioUrl = URL.createObjectURL(audioFile);
  audioPlayer.src = audioUrl;

  // 마이크 권한 요청 및 인식 시작
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    audioPlayer.play();
    recognition.start();

    audioPlayer.onended = () => {
      recognition.stop();
      URL.revokeObjectURL(audioUrl);
    };
  } catch (err) {
    resultDiv.textContent = `마이크 접근 오류: ${err.message}`;
    resultDiv.classList.add('error');
  }
});

// 브라우저 지원 여부 확인
if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
  resultDiv.textContent = '이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome을 사용해 주세요.';
  resultDiv.classList.add('error');
}