// PocketSphinx 초기화
let recognizer;
let audioContext;

async function initRecognizer() {
  const config = new pocketsphinx.Config();
  config.setString('-hmm', 'https://raw.githubusercontent.com/hj21hj/media-transcription-service/main/ko-kr/acoustic-model');
  config.setString('-lm', 'https://raw.githubusercontent.com/hj21hj/media-transcription-service/main/ko-kr/language-model.bin');
  config.setString('-dict', 'https://raw.githubusercontent.com/hj21hj/media-transcription-service/main/ko-kr/dictionary.dict');
  recognizer = new pocketsphinx.Recognizer(config);

  audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
}

document.getElementById('audioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const audioFile = document.getElementById('audioFile').files[0];
  const resultDiv = document.getElementById('result');

  if (!audioFile) {
    alert('WAV 파일(16kHz, 모노)을 선택해주세요.');
    return;
  }

  resultDiv.textContent = '처리 중입니다...';
  resultDiv.classList.add('loading');

  try {
    if (!recognizer) {
      await initRecognizer();
    }

    // 오디오 파일 로드 및 전처리 (참고 저장소 반영)
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 16kHz, 모노 확인 및 변환
    if (audioBuffer.sampleRate !== 16000 || audioBuffer.numberOfChannels !== 1) {
      throw new Error('오디오 파일은 16kHz 모노 형식이어야 합니다.');
    }

    // 오디오 데이터를 PocketSphinx에 전달
    const float32Array = audioBuffer.getChannelData(0);
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.max(-32768, Math.min(32767, Math.round(float32Array[i] * 32768)));
    }

    recognizer.start();
    recognizer.process(int16Array);
    const hypothesis = recognizer.getHypothesis();
    recognizer.stop();

    resultDiv.textContent = hypothesis || '변환된 텍스트가 없습니다.';
    resultDiv.classList.remove('loading');
  } catch (err) {
    resultDiv.textContent = `오류 발생: ${err.message}`;
    resultDiv.classList.add('error');
  }
});