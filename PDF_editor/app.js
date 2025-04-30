// app.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let pdfBytes = null;
let pdfDocLib = null;
let currentPage = 1;

const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const annotationInput = document.getElementById('annotation');
const addTextBtn = document.getElementById('add-text');
const downloadBtn = document.getElementById('download-pdf');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pdfBytes = await file.arrayBuffer();
  pdfDocLib = await PDFLib.PDFDocument.load(pdfBytes);
  await renderPage(currentPage);
});

async function renderPage(pageNum) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
}

addTextBtn.addEventListener('click', async () => {
  if (!pdfDocLib) return alert('먼저 PDF를 업로드하세요.');
  const text = annotationInput.value.trim();
  if (!text) return alert('추가할 텍스트를 입력하세요.');
  const pages = pdfDocLib.getPages();
  const firstPage = pages[0];
  const helveticaFont = await pdfDocLib.embedFont(PDFLib.StandardFonts.Helvetica);
  firstPage.drawText(text, { x: 50, y: 50, size: 18, font: helveticaFont });
  pdfBytes = await pdfDocLib.save();
  await renderPage(currentPage);
  annotationInput.value = '';
});

downloadBtn.addEventListener('click', () => {
  if (!pdfBytes) return alert('다운로드할 PDF가 없습니다.');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'edited.pdf';
  link.click();
});