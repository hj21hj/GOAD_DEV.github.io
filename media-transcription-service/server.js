const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS 활성화
app.use(cors());

// 정적 파일 제공
app.use(express.static(__dirname));

// 업로드 폴더를 정적 경로로 제공
app.use('/uploads', express.static('uploads'));

// 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

// /transcribe 엔드포인트: 파일 업로드 후 URL 반환
app.post('/transcribe', upload.single('media'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (error) {
    next(error);
  }
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 내부 오류:', err);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});