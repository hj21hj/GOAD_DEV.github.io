<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>정부광고<sup style="font-size: 0.5em;">DEV_파일병합</sup></title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
        .container { text-align: center; }
        #fileList { text-align: left; margin: 20px 0; min-height: 100px; border: 1px dashed #ccc; padding: 10px; }
        .file-item { margin: 5px 0; padding: 5px; background: #f9f9f9; cursor: move; display: flex; justify-content: space-between; }
        .file-item.invalid { background: #ffe6e6; cursor: default; }
        .file-item button { background: #ff6347; color: white; border: none; cursor: pointer; padding: 2px 5px; }
        .file-item button:hover { background: #ff4500; }
        button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        .warning { color: #ff4500; font-size: 0.9em; }
        #dropArea { border: 2px dashed #aaa; padding: 20px; margin-top: 20px; cursor: pointer; }
        h1 { cursor: pointer; }
        .info-box { 
            font-size: 0.8em; /* 기본 글자 크기보다 작게 설정 */
            border: 1px solid #ccc; 
            padding: 10px; 
            margin: 10px auto; 
            width: 90%; /* 박스가 컨테이너의 90%를 차지하도록 설정 */
            background: #f5f5f5; 
            text-align: justify; /* 텍스트를 양쪽 정렬로 박스 채우기 */
            line-height: 1.3; /* 줄 간격 조정 */
            letter-spacing: 0.5px; /* 자간 미세 조정 */
        }
        .info-box a { color: #1e90ff; text-decoration: none; }
        .info-box a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1 onclick="resetAll()">정부광고<sup style="font-size: 0.5em;">DEV_파일병합</sup></h1>
        <div class="info-box">
            정부광고DEV(정부광고 Develope)는 정부광고 업무 효율과 생산성을 효과적으로 개선하기 위한 정부광고1팀의 프로젝트입니다. 
            정부광고DEV는 공개된 정보만을 활용하여 정부광고GPT(<a href="https://chatgpt.com/g/g-Bj9hMsIVZ-jeongbugwanggogpt-v1-4-7">링크</a>)를 통해 개발되었습니다. 
            많은 관심과 이용 부탁드립니다.<br>
            ㅇ (문의) 정부광고1팀 정동욱 팀장(841), 황재 과장(847)
        </div>
        <p>PDF 및 이미지(JPG, PNG 등)는 직접 병합 가능합니다. HWP, PPTX, Word 파일은 PDF로 변환 후 업로드해주세요.</p>
        
        <div id="dropArea">파일을 여기에 드래그 앤 드롭</div>
        
        <div id="fileList"></div>
        <button onclick="mergeFiles()">파일 병합하기</button>
        <a id="downloadLink" style="display: none;">병합된 PDF 다운로드</a>
    </div>

    <script src="https://unpkg.com/pdf-lib@1.17.0/dist/pdf-lib.min.js"></script>
    <script>
        console.log("HJ made this!");

        async function mergeFiles() {
            console.log("Merging files...");
            
            const fileList = document.querySelectorAll('.file-item:not(.invalid)');
            if (fileList.length === 0) {
                alert("유효한 파일을 추가해주세요!");
                return;
            }
            
            const pdfDocs = [];
            for (let fileItem of fileList) {
                const fileName = fileItem.querySelector("span").textContent;
                const file = fileItem.file;
                const fileBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
                pdfDocs.push(pdfDoc);
            }

            const mergedPdf = await PDFLib.PDFDocument.create();
            for (let pdfDoc of pdfDocs) {
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPages().map((_, i) => i));
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const downloadLink = document.getElementById("downloadLink");
            downloadLink.href = url;
            downloadLink.download = "정부광고_DEV_merge.pdf";
            downloadLink.style.display = "inline";
            downloadLink.textContent = "병합된 PDF 다운로드";
        }

        const dropArea = document.getElementById("dropArea");

        dropArea.addEventListener("dragover", function(e) {
            e.preventDefault();
            dropArea.style.backgroundColor = "#f0f0f0";
        });

        dropArea.addEventListener("dragleave", function(e) {
            e.preventDefault();
            dropArea.style.backgroundColor = "#fff";
        });

        dropArea.addEventListener("drop", function(e) {
            e.preventDefault();
            dropArea.style.backgroundColor = "#fff";
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        function handleFiles(files) {
            const fileList = document.getElementById("fileList");
            const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

            for (let i = 0; i < files.length; i++) {
                const fileItem = document.createElement("div");
                fileItem.classList.add("file-item");
                
                const fileName = files[i].name;
                const fileExtension = fileName.split('.').pop().toLowerCase();
                const fileNameSpan = document.createElement("span");

                if (validExtensions.includes(fileExtension)) {
                    fileNameSpan.textContent = fileName;
                    fileItem.file = files[i];
                } else {
                    fileItem.classList.add("invalid");
                    fileNameSpan.textContent = `${fileName} (병합 불가: PDF 또는 이미지로 변환 후 업로드해주세요)`;
                }

                fileItem.appendChild(fileNameSpan);

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "X";
                deleteButton.onclick = function() {
                    fileItem.remove();
                };
                fileItem.appendChild(deleteButton);

                fileList.appendChild(fileItem);
            }
        }

        function resetAll() {
            console.log("Resetting all...");
            const fileList = document.getElementById("fileList");
            fileList.innerHTML = "";
            const downloadLink = document.getElementById("downloadLink");
            downloadLink.style.display = "none";
            downloadLink.href = "";
            downloadLink.textContent = "병합된 PDF 다운로드";
        }
    </script>
</body>
</html>
