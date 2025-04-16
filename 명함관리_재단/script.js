// DOM 요소 선택
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const downloadButton = document.getElementById('downloadExcel');
const tableBody = document.getElementById('tableBody');
const logArea = document.getElementById('logArea');

// 추출된 명함 데이터 배열
let extractedData = [];

// 엑셀 출력시 사용할 헤더 (필드 순서)
const excelHeaders = [
  "분류", "이름", "핸드폰", "전자우편주소", "집전화", "집주소",
  "우편번호(집)", "회사", "홈페이지", "직위", "부서",
  "회사전화", "팩스(회사)", "회사주소", "우편번호(회사)"
];

/* ================ 파일 업로드/드래그앤드롭 이벤트 ================ */

// 드래그앤드롭 영역 클릭 시 파일 입력창 열기
dropZone.addEventListener('click', () => fileInput.click());

// 드래그 오버, 리브 이벤트로 스타일 변경
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('hover');
});
dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('hover');
});

// 파일 드롭 이벤트
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('hover');
  const files = e.dataTransfer.files;
  handleFiles(files);
});

// 파일 입력 변경 이벤트
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  handleFiles(files);
});

// 파일 처리 함수 (이미지 파일만 처리)
function handleFiles(files) {
  for (let file of files) {
    if (!file.type.startsWith('image/')) {
      log(`이미지 파일이 아닙니다: ${file.name}`);
      continue;
    }
    processImage(file);
  }
}

/* ================= 이미지 OCR 및 데이터 파싱 ================= */

// 개별 이미지 파일을 읽어 OCR 수행
function processImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    log(`처리 중: ${file.name} (OCR 시작)`);
    // Tesseract.js를 이용하여 OCR 처리 (언어: 'kor' 사용, 필요시 'eng+kor' 조합 가능)
    Tesseract.recognize(e.target.result, 'kor', {
      logger: m => {
        if (m.status === 'recognizing text') {
          log(`인식 진행: ${ (m.progress * 100).toFixed(2) }%`);
        }
      }
    }).then(({ data: { text } }) => {
      log(`완료: ${file.name} (OCR 종료)`);
      // OCR 결과 텍스트 파싱하여 명함 정보 객체 생성
      const cardData = parseBusinessCard(text);
      extractedData.push(cardData);
      addToTable(cardData);
      downloadButton.disabled = (extractedData.length === 0);
    }).catch(err => {
      log(`오류 (${file.name}): ${err}`);
    });
  };
  reader.readAsDataURL(file);
}

// OCR 결과 텍스트를 파싱하여 명함 정보 추출 (필요시 로직 수정)
function parseBusinessCard(text) {
  // 모든 필드를 공란으로 초기화한 객체 생성
  let card = {
    "분류": "",
    "이름": "",
    "핸드폰": "",
    "전자우편주소": "",
    "집전화": "",
    "집주소": "",
    "우편번호(집)": "",
    "회사": "",
    "홈페이지": "",
    "직위": "",
    "부서": "",
    "회사전화": "",
    "팩스(회사)": "",
    "회사주소": "",
    "우편번호(회사)": ""
  };

  // 텍스트를 줄 단위로 나누고 불필요한 공백 제거
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // 간단한 예시 파싱 로직
  lines.forEach(line => {
    // 핸드폰 번호 추출 (예시: 010-1234-5678 또는 01012345678)
    const mobile = line.match(/01[0-9]-?\d{3,4}-?\d{4}/);
    if (mobile) card["핸드폰"] = mobile[0];

    // 이메일 주소 추출 (문자열에 "@"가 포함된 경우)
    if (line.includes('@')) {
      card["전자우편주소"] = line;
    }

    // 홈페이지 URL 추출 (http://, https://, www. 시작하는 경우)
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('www.')) {
      card["홈페이지"] = line;
    }

    // 간단 예시: '회사'라는 단어가 포함되면 회사명으로 지정 (필요시 변경)
    if (!card["회사"] && line.includes("회사")) {
      card["회사"] = line;
    }
  });

  // 간단 예시: 첫번째 줄을 이름으로 가정 (필요시 정교화)
  if (lines.length > 0 && !card["이름"]) {
    card["이름"] = lines[0];
  }
  // 분류는 임의로 "기본"으로 지정
  card["분류"] = "기본";

  return card;
}

// 파싱된 정보를 테이블에 추가
function addToTable(card) {
  const tr = document.createElement('tr');
  excelHeaders.forEach(field => {
    const td = document.createElement('td');
    td.textContent = card[field] || "";
    tr.appendChild(td);
  });
  tableBody.appendChild(tr);
}

/* ================= 엑셀 다운로드 (SheetJS) ================= */

// 엑셀 다운로드 버튼 이벤트 처리
downloadButton.addEventListener('click', () => {
  if (extractedData.length === 0) return;

  // 새로운 워크북 생성
  const wb = XLSX.utils.book_new();
  // 시트용 데이터 배열 생성 (첫 행은 헤더)
  const wsData = [excelHeaders];
  extractedData.forEach(card => {
    const row = excelHeaders.map(field => card[field] || "");
    wsData.push(row);
  });
  // 워크시트 생성 후 워크북에 추가
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "명함정보");
  // 엑셀 파일 다운로드
  XLSX.writeFile(wb, "명함정보.xlsx");
});

/* ================= 로그 함수 ================= */

// 로그 메시지를 출력하여 진행 상황을 표시
function log(msg) {
  logArea.textContent += msg + "\n";
}
