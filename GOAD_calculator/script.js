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
    calculateMetrics(); // 매체 입력 업데이트 시 차트 갱신
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
        'Reach3+': false, 'GRP': false, 'CPRP': false, 'CPL': false, 'CPE': false, 'CPS': false
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
        'CPRP': 'GRP 1점당 비용',
        'CPL': '리드 1건당 비용 (원)',
        'CPE': '참여 1건당 비용 (원)',
        'CPS': '공유 1건당 비용 (원)'
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
        const leads = data['리드 수'] || 0;
        const engagements = (data['좋아요 수'] || 0) + (data['댓글 수'] || 0);
        const shares = data['공유 수'] || 0;

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

        if (reach > 0 && impressions > 0) {
            row.avgFrequency = impressions / reach;
            metricsAvailable['평균 빈도'] = true;
        } else if (!missingInputs['평균 빈도']) missingInputs['평균 빈도'] = ['노출 수', '도달 수'];

        if (reach > 0) {
            row.reach1Plus = reach;
            metricsAvailable['Reach1+'] = true;
        } else if (!missingInputs['Reach1+']) missingInputs['Reach1+'] = ['도달 수'];

        if (reach > 0 && impressions > 0) {
            row.reach3Plus = row.avgFrequency >= 3 ? reach * (impressions / (reach * 3)) : 0;
            metricsAvailable['Reach3+'] = true;
        } else if (!missingInputs['Reach3+']) missingInputs['Reach3+'] = ['노출 수', '도달 수'];

        if (reach > 0 && impressions > 0) {
            row.grp = (impressions / reach) * 100;
            metricsAvailable['GRP'] = true;
        } else if (!missingInputs['GRP']) missingInputs['GRP'] = ['노출 수', '도달 수'];

        if (cost > 0 && row.grp > 0) {
            row.cprp = cost / row.grp;
            metricsAvailable['CPRP'] = true;
        } else if (!missingInputs['CPRP']) missingInputs['CPRP'] = ['광고 비용', 'GRP'];

        if (cost > 0 && leads > 0) {
            row.cpl = cost / leads;
            metricsAvailable['CPL'] = true;
        } else if (!missingInputs['CPL']) missingInputs['CPL'] = ['광고 비용', '리드 수'];

        if (cost > 0 && engagements > 0) {
            row.cpe = cost / engagements;
            metricsAvailable['CPE'] = true;
        } else if (!missingInputs['CPE']) missingInputs['CPE'] = ['광고 비용', '좋아요 수 또는 댓글 수'];

        if (cost > 0 && shares > 0) {
            row.cps = cost / shares;
            metricsAvailable['CPS'] = true;
        } else if (!missingInputs['CPS']) missingInputs['CPS'] = ['광고 비용', '공유 수'];

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
        if (metricsAvailable['CPL']) tableHTML += `<td>${row.cpl ? Number(row.cpl.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPE']) tableHTML += `<td>${row.cpe ? Number(row.cpe.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
        if (metricsAvailable['CPS']) tableHTML += `<td>${row.cps ? Number(row.cps.toFixed(2)).toLocaleString('ko-KR') : '-'}</td>`;
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

    // 차트 렌더링
    const ctx = document.getElementById('metricsChart').getContext('2d');
    if (!ctx) {
        console.error('Canvas context를 찾을 수 없습니다.');
        return;
    }

    console.log('chartData:', chartData); // 디버깅용 데이터 출력
    if (chartData.labels.length === 0 || chartData.datasets.length === 0) {
        console.warn('차트에 표시할 데이터가 없습니다.');
        document.getElementById('results').innerHTML += '<p class="missing-data">차트에 표시할 데이터가 없습니다.</p>';
        return;
    }

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
    console.log('Chart instance created:', chartInstance); // 차트 생성 확인
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
            <ul>
                <li><strong>CPM</strong>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (광고 비용 ÷ 노출 수) × 1,000</p>
                        <p><strong>설명:</strong> 광고가 1,000번 노출될 때 드는 비용입니다.</p>
                    </div>
                </li>
                <!-- ... 나머지 지표 설명은 동일 ... -->
            </ul>
        </body>
        </html>
    `);
    metricsWindow.document.close();
}

window.onload = function() {
    updateMediaInputs();
    calculateMetrics(); // 초기 렌더링 보장
};