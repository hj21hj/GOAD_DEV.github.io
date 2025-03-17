const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors'); // CORS 설정 추가

const app = express();
const port = process.env.PORT || 3000;

// 모든 요청에 대해 CORS 활성화 (프론트엔드와 백엔드가 다른 도메인인 경우 유용)
app.use(cors());

// 정적 파일 제공 (index.html 등)
app.use(express.static(__dirname));

// 파일 업로드 처리를 위한 multer 설정
const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('media'), async (req, res) => {
  // 파일이 업로드되지 않았을 경우 에러 반환
  if (!req.file) {
    return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
  }
  
  const filePath = req.file.path;
  
  // 실제 음성 인식 API 연동 시, 아래 부분에서 파일을 전송하여 음성 인식 결과를 받아옵니다.
  // 이 예제에서는 데모 목적으로 더미 텍스트를 반환합니다.
  
  // 업로드된 파일은 처리 후 삭제 (파일 저장소 관리)
  fs.unlink(filePath, (err) => {
    if (err) console.error('파일 삭제 중 오류:', err);
  });
  
  res.json({ transcript: "여기에 음성 인식 결과가 표시됩니다." });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
