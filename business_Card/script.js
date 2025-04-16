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
      // OCR 결과 텍스트 파싱하여 명함 정보 객체 생성 (개선된 파싱 로직 적용)
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

/**
 * parseBusinessCard
 *
 * OCR 결과 텍스트를 파싱하여 명함 정보를 추출합니다.
 * 개선 사항:
 * - 휴대전화: /(?:010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/
 * - 사무실 번호(회사전화): /(?:02|031|032|033|041|042|043|051|052|053|054|055|061|062|063|064)[-\s]?\d{3,4}[-\s]?\d{4}/
 * - 이메일: 일반적인 이메일 정규식 사용
 * - 이름: 한글만 포함하며 길이가 2~4 글자인 경우로 검증
 */
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

  // 개선된 정규식 패턴
  const mobileRegex = /(?:010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}/;
  const officeRegex = /(?:02|031|032|033|041|042|043|051|052|053|054|055|061|062|063|064)[-\s]?\d{3,4}[-\s]?\d{4}/;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  // 이름: 한글만 포함하며 2~4글자인 경우 (특수문자나 숫자 제외)
  const nameRegex = /^[가-힣]{2,4}$/;

  lines.forEach(line => {
    // 휴대전화 추출 (010, 011, 016~019 형식)
    let mobileMatch = line.match(mobileRegex);
    if (mobileMatch && !card["핸드폰"]) {
      card["핸드폰"] = mobileMatch[0];
    }

    // 사무실 전화번호(회사전화) 추출 (지역번호 포함)
    let officeMatch = line.match(officeRegex);
    if (officeMatch && !card["회사전화"]) {
      card["회사전화"] = officeMatch[0];
    }

    // 이메일 주소 추출
    let emailMatch = line.match(emailRegex);
    if (emailMatch && !card["전자우편주소"]) {
      card["전자우편주소"] = emailMatch[0];
    }

    // 홈페이지 URL 추출 (http://, https://, www. 로 시작하는 경우)
    if (!card["홈페이지"] && (line.startsWith("http://") || line.startsWith("https://") || line.startsWith("www."))) {
      card["홈페이지"] = line;
    }

    // 회사 정보 추출: "회사"라는 키워드가 포함된 경우
    if (!card["회사"] && line.includes("회사")) {
      card["회사"] = line;
    }

    // 이름 추출: 해당 줄이 한글만 포함되고 길이가 2~4글자인 경우, 이름으로 간주
    if (!card["이름"] && nameRegex.test(line)) {
      card["이름"] = line;
    }
  });

  // 만약 이름이 추출되지 않았다면 첫 번째 줄을 기본값으로 사용
  if (!card["이름"] && lines.length > 0) {
    card["이름"] = lines[0];
  }
  // 분류는 기본값 "기본"으로 지정
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

// 진행 상황을 표시하기 위한 로그 함수
function log(msg) {
  logArea.textContent += msg + "\n";
}
