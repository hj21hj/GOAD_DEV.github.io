console.log("HJ made this! - Page loaded successfully");

const metricOptions = [
    '광고 매출', '광고 비용', '노출 수', '도달 수', '영상 조회 수', 
    '완료 시청 수', '전환 수', '클릭 수'
].sort();

let currentMediaData = {};

function formatNumber(input) {
    let value = input.value.replace(/,/g, '');
    if (!isNaN(value) && value !== '') {
        input.value = Number(value).toLocaleString('ko-KR');
        console.log("Developed by HJ - Number formatting triggered");
    }
    saveCurrentData();
    calculateMetrics();
}

function saveCurrentData() {
    const mediaCount = parseInt(document.getElementById('mediaCount').value);
    for (let i = 0; i < 10; i++) {
        const mediaSection = document.getElementById(`mediaSection${i}`);
        if (!mediaSection) continue;
        const mediaName = document.getElementById(`mediaName${i}`).value || `매체 ${i + 1}`;
        const metricRows = document.getElementById(`metricRows${i}`).children;
        const metrics = {};

        for (let row of metricRows) {
            const metric = row.querySelector('select').value;
            const value = row.querySelector('input').value.replace(/,/g, '');
            if (metric && value) metrics[metric] = value;
        }
        currentMediaData[i] = { name: mediaName, metrics };
    }
}

function updateMediaInputs() {
    const mediaCount = parseInt(document.getElementById('mediaCount').value);
    const mediaInputsDiv = document.getElementById('mediaInputs');
    mediaInputsDiv.innerHTML = '';

    for (let i = 0; i < mediaCount; i++) {
        const savedData = currentMediaData[i] || { name: '', metrics: {} };
        mediaInputsDiv.innerHTML += `
            <div class="media-section" id="mediaSection${i}">
                <div class="input-group">
                    <label>매체 ${i + 1} 이름:</label>
                    <input type="text" id="mediaName${i}" value="${savedData.name}" placeholder="예: Google Ads" oninput="saveCurrentData(); calculateMetrics()">
                </div>
                <div id="metricRows${i}"></div>
                <button onclick="addMetricRow(${i})">지표 추가</button>
            </div>
        `;
        
        const metricRowsDiv = document.getElementById(`metricRows${i}`);
        if (Object.keys(savedData.metrics).length === 0) {
            addMetricRow(i);
        } else {
            for (let metric in savedData.metrics) {
                const rowId = `metricRow${i}_${metricRowsDiv.children.length}`;
                const value = Number(savedData.metrics[metric]).toLocaleString('ko-KR');
                metricRowsDiv.innerHTML += `
                    <div class="metric-row" id="${rowId}">
                        <select onchange="checkDuplicate(this, ${i}); saveCurrentData(); calculateMetrics()">
                            <option value="">지표 선택</option>
                            ${metricOptions.map(opt => `<option value="${opt}" ${opt === metric ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                        <input type="text" value="${value}" placeholder="숫자 입력" oninput="formatNumber(this)">
                        <button class="remove-btn" onclick="removeMetricRow('${rowId}', ${i})">X</button>
                    </div>
                `;
            }
        }
        updateRemoveButtons(i);
    }
    calculateMetrics();
}

function addMetricRow(mediaIndex) {
    const metricRowsDiv = document.getElementById(`metricRows${mediaIndex}`);
    const rowId = `metricRow${mediaIndex}_${metricRowsDiv.children.length}`;
    metricRowsDiv.insertAdjacentHTML('beforeend', `
        <div class="metric-row" id="${rowId}">
            <select onchange="checkDuplicate(this, ${mediaIndex}); saveCurrentData(); calculateMetrics()">
                <option value="">지표 선택</option>
                ${metricOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
            <input type="text" placeholder="숫자 입력" oninput="formatNumber(this)">
            <button class="remove-btn" onclick="removeMetricRow('${rowId}', ${mediaIndex})">X</button>
        </div>
    `);
    updateRemoveButtons(mediaIndex);
    calculateMetrics();
    console.log("HJ made this! - Added a new metric row");
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
        saveCurrentData();
        calculateMetrics();
    }
}

function updateRemoveButtons(mediaIndex) {
    const metricRowsDiv = document.getElementById(`metricRows${mediaIndex}`);
    const removeButtons = metricRowsDiv.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.disabled = metricRowsDiv.children.length === 1;
    });
}

function calculateMetrics() {
    console.log("Developed by HJ - Real-time metrics calculation");

    const mediaCount = parseInt(document.getElementById('mediaCount').value);
    let metricsAvailable = {
        'CPM': false, 'CPC': false, 'CTR': false, 'CPA': false, 'ROAS': false,
        'CPV': false, 'VTR': false, '평균 빈도': false, 'Reach1+': false,
        'Reach3+': false, 'GRP': false, 'CPRP': false
    };
    let missingInputs = {};

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th title="매체 이름">매체</th>
    `;

    const metricDescriptions = {
        'CPM': '1,000회 노출당 비용',
        'CPC': '클릭 1회당 비용',
        'CTR': '노출 대비 클릭 비율 (%)',
        'CPA': '전환 1건당 비용',
        'ROAS': '광고비 대비 매출 비율 (%)',
        'CPV': '영상 조회 1회당 비용',
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

        if (impressions > 0 && cost > 0) {
            row.cpm = (cost / impressions) * 1000;
            metricsAvailable['CPM'] = true;
        } else if (!missingInputs['CPM']) missingInputs['CPM'] = "광고 비용, 노출 수";

        if (clicks > 0 && cost > 0) {
            row.cpc = cost / clicks;
            metricsAvailable['CPC'] = true;
        } else if (!missingInputs['CPC']) missingInputs['CPC'] = "광고 비용, 클릭 수";

        if (impressions > 0 && clicks >= 0) {
            row.ctr = (clicks / impressions) * 100;
            metricsAvailable['CTR'] = true;
        } else if (!missingInputs['CTR']) missingInputs['CTR'] = "노출 수";

        if (conversions > 0 && cost > 0) {
            row.cpa = cost / conversions;
            metricsAvailable['CPA'] = true;
        } else if (!missingInputs['CPA']) missingInputs['CPA'] = "광고 비용, 전환 수";

        if (cost > 0 && revenue > 0) {
            row.roas = (revenue / cost) * 100;
            metricsAvailable['ROAS'] = true;
        } else if (!missingInputs['ROAS']) missingInputs['ROAS'] = "광고 비용, 광고 매출";

        if (views > 0 && cost > 0) {
            row.cpv = cost / views;
            metricsAvailable['CPV'] = true;
        } else if (!missingInputs['CPV']) missingInputs['CPV'] = "광고 비용, 영상 조회 수";

        if (impressions > 0 && completedViews >= 0) {
            row.vtr = (completedViews / impressions) * 100;
            metricsAvailable['VTR'] = true;
        } else if (!missingInputs['VTR']) missingInputs['VTR'] = "노출 수";

        if (reach > 0 && impressions > 0) {
            row.avgFrequency = impressions / reach;
            row.reach1Plus = reach;
            row.reach3Plus = row.avgFrequency >= 3 ? reach * (impressions / (reach * 3)) : 0;
            row.grp = (impressions / reach) * 100;
            metricsAvailable['평균 빈도'] = true;
            metricsAvailable['Reach1+'] = true;
            metricsAvailable['Reach3+'] = true;
            metricsAvailable['GRP'] = true;
        } else if (!missingInputs['평균 빈도']) missingInputs['평균 빈도'] = "노출 수, 도달 수";

        if (row.grp > 0 && cost > 0) {
            row.cprp = cost / row.grp;
            metricsAvailable['CPRP'] = true;
        } else if (!missingInputs['CPRP']) missingInputs['CPRP'] = "광고 비용, 도달 수";

        rows.push(row);
    }

    for (const metric in metricsAvailable) {
        if (metricsAvailable[metric]) {
            tableHTML += `<th>${metric}<span class="tooltip">${metricDescriptions[metric]}</span></th>`;
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
            missingMessage += `<p>"${metric}" 지표를 계산하려면 "${missingInputs[metric]}" 값을 입력하세요.</p>`;
        }
    }
    if (missingMessage) {
        tableHTML += `<div class="missing-data">${missingMessage}</div>`;
    }

    document.getElementById('results').innerHTML = tableHTML;
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
                        <p><strong>설명:</strong> 광고가 사용자 화면에 노출된 총 횟수를 의미합니다. 예를 들어, 한 사람이 광고를 3번 본 경우 노출 수는 3으로 계산됩니다. 캠페인의 전체 노출 범위를 평가하는 데 유용하며, 도달률(Reach)과는 달리 중복 노출도 포함됩니다.</p>
                        <p><strong>📌 참고:</strong> 노출 수는 광고의 빈도와 도달 범위를 분석할 때 기본 데이터로 사용되며, CPM 계산의 핵심 요소입니다.</p>
                    </div>
                </li>
                <li><strong>Quality Score (품질 점수)</strong> <a href="https://support.google.com/google-ads/answer/6167118" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 클릭률(CTR), 광고 관련성, 랜딩 페이지 경험의 조합 (1~10점)</p>
                        <p><strong>설명:</strong> 키워드와 광고, 랜딩 페이지의 품질을 종합적으로 평가한 점수입니다. 예: CTR이 높고, 광고가 키워드와 관련성이 높으며, 랜딩 페이지가 빠르고 유용하면 점수가 높아집니다. 품질 점수가 높을수록 CPC가 낮아지고 광고 순위가 개선됩니다.</p>
                        <p><strong>📌 참고:</strong> Google Ads에서 비용 효율성을 높이기 위해 반드시 관리해야 하는 지표입니다.</p>
                    </div>
                </li>
                <li><strong>Impression Share (노출 점유율)</strong> <a href="https://support.google.com/google-ads/answer/2497703" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (실제 노출 수 ÷ 받을 수 있었던 총 노출 수) × 100</p>
                        <p><strong>설명:</strong> 광고가 노출될 수 있었던 모든 기회 중 실제로 노출된 비율을 나타냅니다. 예: 50,000번 노출됐고, 총 기회가 100,000번이었다면 노출 점유율은 50%입니다. 예산 부족이나 입찰 경쟁력 부족으로 손실된 기회를 파악할 수 있습니다.</p>
                        <p><strong>📌 참고:</strong> 손실된 점유율(Lost IS)은 예산 손실(Budget)과 순위 손실(Rank)로 구분됩니다.</p>
                    </div>
                </li>
                <li><strong>Conversion Value (전환 가치)</strong> <a href="https://support.google.com/google-ads/answer/3419241" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 전환으로 발생한 총 매출액 (사용자 정의 설정 필요)</p>
                        <p><strong>설명:</strong> 광고로 인해 발생한 전환(구매, 가입 등)의 금전적 가치를 합산한 값입니다. 예: 전환 10건, 건당 50,000원 매출이면 전환 가치는 500,000원입니다. ROAS 계산의 핵심 데이터로, 캠페인의 수익성을 직접 평가합니다.</p>
                        <p><strong>📌 참고:</strong> 전환 추적 태그 설정이 필요하며, 이커머스 캠페인에서 특히 중요합니다.</p>
                    </div>
                </li>
                <li><strong>Cost Per Conversion (CPA)</strong> <a href="https://support.google.com/google-ads/answer/6396841" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ 전환 수</p>
                        <p><strong>설명:</strong> 전환 1건을 얻기 위해 지출한 평균 비용입니다. 예: 비용 100,000원, 전환 10건이면 CPA는 10,000원입니다. 목표 전환 비용을 설정하고 캠페인 효율성을 판단하는 데 사용됩니다.</p>
                        <p><strong>📌 참고:</strong> CPA가 목표보다 높으면 타겟팅이나 랜딩 페이지 최적화가 필요합니다.</p>
                    </div>
                </li>
                <li><strong>CPM (Cost Per Mille)</strong> <a href="https://support.google.com/google-ads/answer/6310" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (광고 비용 ÷ 노출 수) × 1,000</p>
                        <p><strong>설명:</strong> 광고가 1,000번 노출될 때 드는 비용입니다. 예: 비용 100,000원, 노출 50,000번이면 CPM은 2,000원입니다. 디스플레이 및 영상 광고의 노출 비용 효율성을 측정합니다.</p>
                        <p><strong>📌 참고:</strong> 브랜드 인지도 캠페인에서 효과적인 지표로, CTR과 함께 비교하면 좋습니다.</p>
                    </div>
                </li>
                <li><strong>CPV (Cost Per View)</strong> <a href="https://support.google.com/google-ads/answer/6320" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ 영상 조회 수</p>
                        <p><strong>설명:</strong> 영상 광고가 1회 조회될 때 드는 평균 비용입니다. 예: 비용 50,000원, 조회 1,000번이면 CPV는 50원입니다. 영상 캠페인의 비용 효율성을 평가하며, 조회 기준은 플랫폼 정책에 따라 다릅니다(예: 30초 이상 시청).</p>
                        <p><strong>📌 참고:</strong> VTR과 함께 보면 영상 콘텐츠의 참여도를 더 잘 이해할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>VTR (View-Through Rate)</strong> <a href="https://support.google.com/google-ads/answer/6270" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (완료 시청 수 ÷ 노출 수) × 100</p>
                        <p><strong>설명:</strong> 영상 광고가 끝까지 시청된 비율을 나타냅니다. 예: 노출 10,000번, 완료 시청 2,000번이면 VTR은 20%입니다. 영상 콘텐츠의 몰입도와 품질을 평가하는 데 유용합니다.</p>
                        <p><strong>📌 참고:</strong> VTR이 낮으면 영상 초반 이탈이 많음을 의미하므로 콘텐츠 개선이 필요할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>Reach1+ (1회 이상 도달)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 최소 1회 노출된 고유 사용자 수</p>
                        <p><strong>설명:</strong> 광고를 최소 1번 이상 본 고유 사용자 수입니다. 예: 도달한 사용자 50,000명, 총 타겟 오디언스 200,000명이라면 도달률은 (50,000 ÷ 200,000) × 100 = 25%입니다. 캠페인의 커버리지와 인지도 효과를 측정합니다.</p>
                        <p><strong>📌 참고:</strong> 노출 수와 달리 중복을 제외한 고유 사용자 수를 기준으로 하며, 타겟 오디언스는 캠페인 설정에 따라 정의됩니다.</p>
                    </div>
                </li>
                <li><strong>Reach3+ (3회 이상 도달)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 3회 이상 노출된 고유 사용자 수 (정확한 데이터 필요, 근사치로 계산 가능)</p>
                        <p><strong>설명:</strong> 광고를 3번 이상 본 고유 사용자 수를 의미합니다. 예: 평균 빈도가 3 이상인 경우, Reach1+와 노출 수를 이용해 근사치를 구할 수 있습니다. 반복 노출로 인한 브랜드 인식 강화를 평가합니다.</p>
                        <p><strong>📌 참고:</strong> 빈도(Frequency)와 연계해 분석하며, 과도한 빈도는 사용자 피로를 유발할 수 있습니다.</p>
                    </div>
                </li>
                <li><strong>Average Frequency (평균 노출 빈도)</strong> <a href="https://support.google.com/google-ads/answer/2472716" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 노출 수 ÷ 도달 수</p>
                        <p><strong>설명:</strong> 한 사용자당 평균 노출 횟수입니다. 예: 노출 100,000번, 도달 20,000명이면 평균 빈도는 5회입니다. 광고 반복 노출 정도를 파악하며, 최적 빈도 설정에 활용됩니다.</p>
                        <p><strong>📌 참고:</strong> 빈도가 너무 높으면 광고 피로도가 증가할 수 있으므로 주의가 필요합니다.</p>
                    </div>
                </li>
                <li><strong>GRP (Gross Rating Point)</strong> <a href="https://support.google.com/google-ads/answer/1726755" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> (노출 수 ÷ 도달 수) × 100</p>
                        <p><strong>설명:</strong> 도달률과 빈도의 곱으로, 광고의 총 도달 영향을 나타냅니다. 예: 노출 100,000번, 도달 20,000명이면 GRP는 500입니다. TV 광고에서 흔히 사용되며, 디지털 캠페인에서도 도달 효과를 비교할 때 유용합니다.</p>
                        <p><strong>📌 참고:</strong> GRP는 단순 노출량이 아닌 도달과 빈도의 종합적 지표로 해석해야 합니다.</p>
                    </div>
                </li>
                <li><strong>CPRP (Cost Per Rating Point)</strong> <a href="https://support.google.com/google-ads/answer/1726755" target="_blank">참고 자료</a>
                    <div class="metric-box">
                        <p><strong>산출 공식:</strong> 광고 비용 ÷ GRP</p>
                        <p><strong>설명:</strong> GRP 1점당 비용을 의미합니다. 예: 비용 100,000원, GRP 500이면 CPRP는 200원입니다. 광고 도달 효과 대비 비용 효율성을 평가하며, GRP와 함께 사용됩니다.</p>
                        <p><strong>📌 참고:</strong> CPRP가 낮을수록 동일한 도달 효과를 더 저렴하게 달성한 것입니다.</p>
                    </div>
                </li>
            </ul>
        </body>
        </html>
    `);
    metricsWindow.document.close();
}

window.onload = updateMediaInputs;