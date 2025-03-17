const cors = require('cors'); // 추가: CORS 모듈 임포트
app.use(cors());            // 추가: 모든 요청에 대해 CORS 활성화

app.post('/transcribe', upload.single('media'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
    }
    
    const filePath = req.file.path;
    // 실제 음성 인식 API 연동 시 로직 추가. 이 예제에서는 데모 목적으로 더미 텍스트 사용
    const dummyTranscript = "여기에 음성 인식 결과가 표시됩니다.";
    
    // 업로드된 파일은 처리 후 삭제 (파일 저장소 관리)
    fs.unlink(filePath, (err) => {
      if (err) console.error('파일 삭제 중 오류:', err);
    });
    
    res.json({ transcript: dummyTranscript });
  } catch (error) {
    next(error);
  }
});

// 추가: 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 내부 오류:', err);
  res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
});
