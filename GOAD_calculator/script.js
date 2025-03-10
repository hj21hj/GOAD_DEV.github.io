console.log("HJ made this! - Page loaded successfully");

const metricOptions = [
    '광고 매출', '광고 비용', '노출 수', '도달 수', '영상 조회 수', 
    '완료 시청 수', '전환 수', '클릭 수', '좋아요 수', '댓글 수', 
    '공유 수', '구매 전환 수', '리드 수'
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
        addMetricRow(i);
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
        'CPV': false, 'VTR': false, '평균 빈도': false, 'Reach1+': false,
        'Reach3+': false, 'GRP': false, 'CPRP': false
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
        'VTR': '영상 완료 시청 비율 (%)',
        '평균 빈도': '사용자당 평균 노출 횟수',
        'Reach1+': '1회 이상 노출된 고유 사용자 수',
        'Reach3+': '3회 이상 노출된 고유 사용자 수',
        'GRP': '도달률과 빈도의 총합',
        'CPRP': 'GRP 1점당 비용'
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
        const reach = data['도달 수'] || 0;

        // 지표 계산 공식 (2개 입력값 조합)
        if (cost > 0 && impressions > 0) { // CPM = 광고 비용 ÷ 노출 수 × 1000
            row.cpm = (cost / impressions) * 1000;
            metricsAvailable['CPM'] = true;
        } else if (!missingInputs['CPM']) missingInputs['CPM'] = ['광고 비용', '노출 수'];

        if (cost > 0 && clicks > 0) { // CPC = 광고 비용 ÷ 클릭 수
            row.cpc = cost / clicks;
            metricsAvailable['CPC'] = true;
        } else if (!missingInputs['CPC']) missingInputs['CPC'] = ['광고 비용', '클릭 수'];

        if (impressions > 0 && clicks >= 0) { // CTR = (클릭 수 ÷ 노출 수) × 100
            row.ctr = (clicks / impressions) * 100;
            metricsAvailable['CTR'] = true;
        } else if (!missingInputs['CTR']) missingInputs['CTR'] = ['노출 수', '클릭 수'];

        if (cost > 0 && conversions > 0) { // CPA = 광고 비용 ÷ 전환 수
            row.cpa = cost / conversions;
            metricsAvailable['CPA'] = true;
        } else if (!missingInputs['CPA']) missingInputs['CPA'] = ['광고 비용', '전환 수'];

        if (revenue > 0 && cost > 0) { // ROAS = (광고 매출 ÷ 광고 비용) × 100
            row.roas = (revenue / cost) * 100;
            metricsAvailable['ROAS'] = true;
        } else if (!missingInputs['ROAS']) missingInputs['ROAS'] = ['광고 매출', '광고 비용'];

        if (cost > 0 && views > 0) { // CPV = 광고 비용 ÷ 영상 조회 수
            row.cpv = cost / views;
            metricsAvailable['CPV'] = true;
        } else if (!missingInputs['CPV']) missingInputs['CPV'] = ['광고 비용', '영상 조회 수'];

        if (impressions > 0 && completedViews >= 0) { // VTR = (완료 시청 수 ÷ 노출 수) × 100
            row.vtr = (completedViews / impressions) * 100;
            metricsAvailable['VTR'] = true;
        } else if (!missingInputs['VTR']) missingInputs['VTR'] = ['노출 수', '완료 시청 수'];

        if (reach > 0 && impressions > 0) { // 평균 빈도 = 노출 수 ÷ 도달 수
            row.avgFrequency = impressions / reach;
            metricsAvailable['평균 빈도'] = true;
        } else if (!missingInputs['평균 빈도']) missingInputs['평균 빈도'] = ['노출 수', '도달 수'];

        if (reach > 0) { // Reach1+ = 도달 수 (1회 이상 노출된 고유 사용자 수)
            row.reach1Plus = reach;
            metricsAvailable['Reach1+'] = true;
        } else if (!missingInputs['Reach1+']) missingInputs['Reach1+'] = ['도달 수'];

        if (reach > 0 && impressions > 0) { // Reach3+ = 평균 빈도 ≥ 3일 때 근사치 계산
            row.reach3Plus = row.avgFrequency >= 3 ? reach * (impressions / (reach * 3)) : 0;
            metricsAvailable['Reach3+'] = true;
        } else if (!missingInputs['Reach3+']) missingInputs['Reach3+'] = ['노출 수', '도달 수'];

        if (reach > 0 && impressions > 0) { // GRP = (노출 수 ÷ 도달 수) × 100
            row.grp = (impressions / reach) * 100;
            metricsAvailable['GRP'] = true;
        } else if (!missingInputs['GRP']) missingInputs['GRP'] = ['노출 수', '도달 수'];

        if (cost > 0 && row.grp > 0) { // CPRP = 광고 비용 ÷ GRP
            row.cprp = cost / row.grp;
            metricsAvailable['CPRP'] = true;
        } else if (!missingInputs['CPRP']) missingInputs['CPRP'] = ['광고 비용', 'GRP'];

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
        if (metricsAvailable['CPM']) tableHTML += `<td>${row.cpm ? Number(row.cpm.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPC']) tableHTML += `<td>${row.cpc ? Number(row.cpc.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CTR']) tableHTML += `<td>${row.ctr ? Number(row.ctr.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPA']) tableHTML += `<td>${row.cpa ? Number(row.cpa.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['ROAS']) tableHTML += `<td>${row.roas ? Number(row.roas.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPV']) tableHTML += `<td>${row.cpv ? Number(row.cpv.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['VTR']) tableHTML += `<td>${row.vtr ? Number(row.vtr.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['평균 빈도']) tableHTML += `<td>${row.avgFrequency ? Number(row.avgFrequency.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['Reach1+']) tableHTML += `<td>${row.reach1Plus ? Number(row.reach1Plus).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['Reach3+']) tableHTML += `<td>${row.reach3Plus ? Math.round(row.reach3Plus).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['GRP']) tableHTML += `<td>${row.grp ? Number(row.grp.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPRP']) tableHTML += `<td>${row.cprp ? Number(row.cprp.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
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
    console.log("HJ made this! - Opening Google Ads metrics window");
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
                .metric-box strong { color: #333; }
                .metric-box p { margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>Google Ads 주요 지표 설명</h2>
            <!-- Developed by HJ - Enhanced Metrics List -->
            <ul>
                <li><strong>Impressions (노출 수)</strong> <a href="https://support.google.com/google-ads/answer/6320" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고가 화면에 표시된 총 횟수 (고유 값 아님)</p>
                        <p><strong>설명:</strong> 광고가 사용자 화면에 노출된 총 횟수를 의미합니다. 예를 들어, 한 사람이 광고를 3번 본 경우 노출 수는 3으로 계산됩니다.</p>
                        <p><strong>📌 참고:</strong> 노출 수는 CPM 계산의 핵심 요소입니다.</p>
                    </div>
                </li>
                <li><strong>Conversion Value (전환 가치)</strong> <a href="https://support.google.com/google-ads/answer/3419241" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 전환으로 발생한 총 매출액 (사용자 정의 설정 필요)</p>
                        <p><strong>설명:</strong> 광고로 인해 발생한 전환(구매, 가입 등)의 금전적 가치를 합산한 값입니다.</p>
                        <p><strong>📌 참고:</strong> ROAS 계산의 핵심 데이터입니다.</p>
                    </div>
                </li>
                <li><strong>Cost Per Conversion (CPA)</strong> <a href="https://support.google.com/google-ads/answer/6396841" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ 전환 수</p>
                        <p><strong>설명:</strong> 전환 1건을 얻기 위해 지출한 평균 비용입니다.</p>
                        <p><strong>📌 참고:</strong> CPA가 목표보다 높으면 타겟팅 최적화가 필요합니다.</p>
                    </div>
                </li>
                <li><strong>CPM (Cost Per Mille)</strong> <a href="https://support.google.com/google-ads/answer/6310" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (광고 비용 ÷ 노출 수) × 1,000</p>
                        <p><strong>설명:</strong> 광고가 1,000번 노출될 때 드는 비용입니다.</p>
                        <p><strong>📌 참고:</strong> 브랜드 인지도 캠페인에서 유용합니다.</p>
                    </div>
                </li>
                <li><strong>CPV (Cost Per View)</strong> <a href="https://support.google.com/google-ads/answer/6320" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ 영상 조회 수</p>
                        <p><strong>설명:</strong> 영상 광고가 1회 조회될 때 드는 평균 비용입니다.</p>
                        <p><strong>📌 참고:</strong> VTR과 함께 보면 참여도를 이해할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>VTR (View-Through Rate)</strong> <a href="https://support.google.com/google-ads/answer/6270" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (완료 시청 수 ÷ 노출 수) × 100</p>
                        <p><strong>설명:</strong> 영상 광고가 끝까지 시청된 비율을 나타냅니다.</p>
                        <p><strong>📌 참고:</strong> VTR이 낮으면 영상 콘텐츠 개선이 필요할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>Average Frequency (평균 빈도)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 노출 수 ÷ 도달 수</p>
                        <p><strong>설명:</strong> 한 사용자당 평균 노출 횟수입니다.</p>
                        <p><strong>📌 참고:</strong> 빈도가 너무 높으면 광고 피로도가 증가할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>Reach1+ (1회 이상 도달)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 최소 1회 노출된 고유 사용자 수</p>
                        <p><strong>설명:</strong> 광고를 최소 1번 이상 본 고유 사용자 수입니다.</p>
                        <p><strong>📌 참고:</strong> 캠페인의 커버리지를 측정합니다.</p>
                    </div>
                </li>
                <li><strong>Reach3+ (3회 이상 도달)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 3회 이상 노출된 고유 사용자 수 (근사치 계산)</p>
                        <p><strong>설명:</strong> 광고를 3번 이상 본 고유 사용자 수를 의미합니다.</p>
                        <p><strong>📌 참고:</strong> 반복 노출로 인한 브랜드 인식 강화를 평가합니다.</p>
                    </div>
                </li>
                <li><strong>GRP (Gross Rating Point)</strong> <a href="https://support.google.com/google-ads/answer/1726755" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (노출 수 ÷ 도달 수) × 100</p>
                        <p><strong>설명:</strong> 도달률과 빈도의 곱으로, 광고의 총 도달 영향을 나타냅니다.</p>
                        <p><strong>📌 참고:</strong> 디지털 캠페인에서도 도달 효과를 비교할 때 유용합니다.</p>
                    </div>
                </li>
                <li><strong>CPRP (Cost Per Rating Point)</strong> <a href="https://support.google.com/google-ads/answer/1726755" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ GRP</p>
                        <p><strong>설명:</strong> GRP 1점당 비용을 의미합니다.</p>
                        <p><strong>📌 참고:</strong> CPRP가 낮을수록 도달 효과를 더 저렴하게 달성한 것입니다.</p>
                    </div>
                </li>
            </ul>
        </body>
        </html>
    `);
    metricsWindow.document.close();
}

window.onload = updateMediaInputs;