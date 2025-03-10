console.log("HJ made this! - Page loaded successfully");

const metricOptions = [
    '광고 매출', '광고 비용', '노출 수', '도달 수', '영상 조회 수', 
    '완료 시청 수', '전환 수', '클릭 수'
].sort();

function formatNumber(input) {
    let value = input.value.replace(/,/g, '');
    if (!isNaN(value) && value !== '') {
        input.value = Number(value).toLocaleString('ko-KR');
    }
    calculateMetrics();
}

function updateMediaInputs() {
    const mediaCount = parseInt(document.getElementById('mediaCount').value);
    const mediaInputsDiv = document.getElementById('mediaInputs');
    mediaInputsDiv.innerHTML = '';

    for (let i = 0; i < mediaCount; i++) {
        mediaInputsDiv.innerHTML += `
            <div class="media-section" id="mediaSection${i}">
                <div class="input-group">
                    <label>매체 ${i + 1} 이름:</label>
                    <input type="text" id="mediaName${i}" placeholder="예: Google Ads" oninput="calculateMetrics()">
                </div>
                <div id="metricRows${i}"></div>
                <button onclick="addMetricRow(${i})">지표 추가</button>
            </div>
        `;
        addMetricRow(i); // 기본 행 추가
    }
    calculateMetrics();
}

function addMetricRow(mediaIndex) {
    const metricRowsDiv = document.getElementById(`metricRows${mediaIndex}`);
    const rowId = `metricRow${mediaIndex}_${metricRowsDiv.children.length}`;
    metricRowsDiv.insertAdjacentHTML('beforeend', `
        <div class="metric-row" id="${rowId}">
            <select onchange="checkDuplicate(this, ${mediaIndex}); calculateMetrics()">
                <option value="">지표 선택</option>
                ${metricOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
            <input type="text" placeholder="숫자 입력" oninput="formatNumber(this)">
            <button class="remove-btn" onclick="removeMetricRow('${rowId}', ${mediaIndex})">X</button>
        </div>
    `);
    updateRemoveButtons(mediaIndex);
}

function checkDuplicate(select, mediaIndex) {
    const rows = document.getElementById(`metricRows${mediaIndex}`).children;
    const selectedValue = select.value;
    for (let row of rows) {
        const otherSelect = row.querySelector('select');
        if (otherSelect !== select && otherSelect.value === selectedValue && selectedValue !== '') {
            alert('이미 선택된 지표입니다.');
            select.value = '';
            break;
        }
    }
}

function removeMetricRow(rowId, mediaIndex) {
    const metricRowsDiv = document.getElementById(`metricRows${mediaIndex}`);
    if (metricRowsDiv.children.length > 1) {
        document.getElementById(rowId).remove();
        updateRemoveButtons(mediaIndex);
        calculateMetrics();
    }
}

function updateRemoveButtons(mediaIndex) {
    const metricRowsDiv = document.getElementById(`metricRows${mediaIndex}`);
    const removeButtons = metricRowsDiv.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => btn.disabled = metricRowsDiv.children.length === 1);
}

let chartInstance = null;

function calculateMetrics() {
    const mediaCount = parseInt(document.getElementById('mediaCount').value);
    let metricsAvailable = {
        'CPM': false, 'CPC': false, 'CTR': false, 'CPA': false, 'ROAS': false,
        'CPV': false, 'VTR': false
    };
    let missingInputs = {};
    let chartData = { labels: [], datasets: [] };

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th title="매체 이름">매체</th>
    `;

    const metricDescriptions = {
        'CPM': '1,000회 노출당 비용 (원)',
        'CPC': '클릭 1회당 비용 (원)',
        'CTR': '노출 대비 클릭 비율 (%)',
        'CPA': '전환 1건당 비용 (원)',
        'ROAS': '광고비 대비 매출 비율 (%)',
        'CPV': '영상 조회 1회당 비용 (원)',
        'VTR': '영상 완료 시청 비율 (%)'
    };

    let rows = [];
    for (let i = 0; i < mediaCount; i++) {
        const mediaSection = document.getElementById(`mediaSection${i}`);
        if (!mediaSection) continue;
        const mediaName = document.getElementById(`mediaName${i}`).value || `매체 ${i + 1}`;
        const metricRows = document.getElementById(`metricRows${i}`).children;
        const data = {};

        for (let row of metricRows) {
            const metric = row.querySelector('select').value;
            const value = parseFloat(row.querySelector('input').value.replace(/,/g, '')) || 0;
            if (metric) data[metric] = value;
        }

        const row = { mediaName };
        const cost = data['광고 비용'] || 0;
        const impressions = data['노출 수'] || 0;
        const clicks = data['클릭 수'] || 0;
        const conversions = data['전환 수'] || 0;
        const revenue = data['광고 매출'] || 0;
        const views = data['영상 조회 수'] || 0;
        const completedViews = data['완료 시청 수'] || 0;

        if (cost > 0 && impressions > 0) {
            row.cpm = (cost / impressions) * 1000;
            metricsAvailable['CPM'] = true;
        } else if (!missingInputs['CPM']) missingInputs['CPM'] = ['광고 비용', '노출 수'];

        if (cost > 0 && clicks > 0) {
            row.cpc = cost / clicks;
            metricsAvailable['CPC'] = true;
        } else if (!missingInputs['CPC']) missingInputs['CPC'] = ['광고 비용', '클릭 수'];

        if (impressions > 0 && clicks >= 0) {
            row.ctr = (clicks / impressions) * 100;
            metricsAvailable['CTR'] = true;
        } else if (!missingInputs['CTR']) missingInputs['CTR'] = ['노출 수', '클릭 수'];

        if (cost > 0 && conversions > 0) {
            row.cpa = cost / conversions;
            metricsAvailable['CPA'] = true;
        } else if (!missingInputs['CPA']) missingInputs['CPA'] = ['광고 비용', '전환 수'];

        if (revenue > 0 && cost > 0) {
            row.roas = (revenue / cost) * 100;
            metricsAvailable['ROAS'] = true;
        } else if (!missingInputs['ROAS']) missingInputs['ROAS'] = ['광고 매출', '광고 비용'];

        if (cost > 0 && views > 0) {
            row.cpv = cost / views;
            metricsAvailable['CPV'] = true;
        } else if (!missingInputs['CPV']) missingInputs['CPV'] = ['광고 비용', '영상 조회 수'];

        if (impressions > 0 && completedViews >= 0) {
            row.vtr = (completedViews / impressions) * 100;
            metricsAvailable['VTR'] = true;
        } else if (!missingInputs['VTR']) missingInputs['VTR'] = ['노출 수', '완료 시청 수'];

        rows.push(row);
        chartData.labels.push(mediaName);
    }

    for (const metric in metricsAvailable) {
        if (metricsAvailable[metric]) {
            tableHTML += `<th>${metric}<span class="tooltip">${metricDescriptions[metric]}</span></th>`;
            const dataset = {
                label: metric,
                data: rows.map(row => row[metric.toLowerCase()] || 0),
                backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`,
                borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
                borderWidth: 1
            };
            chartData.datasets.push(dataset);
        }
    }
    tableHTML += `</tr></thead><tbody>`;

    rows.forEach(row => {
        tableHTML += `<tr><td>${row.mediaName}</td>`;
        if (metricsAvailable['CPM']) tableHTML += `<td>${row.cpm ? row.cpm.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPC']) tableHTML += `<td>${row.cpc ? row.cpc.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CTR']) tableHTML += `<td>${row.ctr ? row.ctr.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPA']) tableHTML += `<td>${row.cpa ? row.cpa.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['ROAS']) tableHTML += `<td>${row.roas ? row.roas.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPV']) tableHTML += `<td>${row.cpv ? row.cpv.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['VTR']) tableHTML += `<td>${row.vtr ? row.vtr.toFixed(2).toLocaleString('ko-KR') : '-'}</td>`;
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;

    let missingMessage = '';
    for (const metric in missingInputs) {
        if (!metricsAvailable[metric]) {
            missingMessage += `<p>"${metric}" 지표를 계산하려면 "${missingInputs[metric].join('", "')}" 값을 입력하세요.</p>`;
        }
    }
    if (missingMessage) {
        tableHTML += `<div class="missing-data">${missingMessage}</div>`;
    }

    document.getElementById('results').innerHTML = tableHTML;

    // 차트 업데이트
    const ctx = document.getElementById('metricsChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '매체별 광고 지표' }
            }
        }
    });
}

function showGoogleAdsMetrics() {
    const metricsWindow = window.open('', '_blank');
    metricsWindow.document.write(`
        <html>
        <head>
            <title>Google Ads 지표 설명</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
                h2 { color: #333; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 25px 0; }
                a { color: #007BFF; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .metric-box { 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    background-color: #f9f9f9; 
                    border-radius: 5px; 
                    margin-top: 10px; 
                    line-height: 1.5; 
                }
            </style>
        </head>
        <body>
            <h2>Google Ads 주요 지표 설명</h2>
            <ul>
                <li><strong>CPM</strong><div class="metric-box">1,000회 노출당 비용</div></li>
                <li><strong>CPC</strong><div class="metric-box">클릭 1회당 비용</div></li>
                <li><strong>CTR</strong><div class="metric-box">노출 대비 클릭 비율</div></li>
                <li><strong>CPA</strong><div class="metric-box">전환 1건당 비용</div></li>
                <li><strong>ROAS</strong><div class="metric-box">광고비 대비 매출 비율</div></li>
                <li><strong>CPV</strong><div class="metric-box">영상 조회 1회당 비용</div></li>
                <li><strong>VTR</strong><div class="metric-box">영상 완료 시청 비율</div></li>
            </ul>
        </body>
        </html>
    `);
    metricsWindow.document.close();
}

window.onload = updateMediaInputs;