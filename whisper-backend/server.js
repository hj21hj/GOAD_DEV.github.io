const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    exec(`whisper ${filePath} --language ko --output_format txt`, (err, stdout, stderr) => {
        if (err) {
            console.error(stderr);
            return res.status(500).json({ error: '텍스트 추출 실패' });
        }
        const textFile = `${filePath}.txt`;
        const text = fs.readFileSync(textFile, 'utf8');
        fs.unlinkSync(filePath); // 업로드 파일 삭제
        fs.unlinkSync(textFile); // 텍스트 파일 삭제
        res.json({ text });
    });
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));