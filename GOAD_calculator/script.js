// 기존 코드 유지 (상단 부분 생략)

function calculateMetrics() {
    console.log("Developed by HJ - Real-time metrics calculation");

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
        chartData.labels.push(mediaName);
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

    // 그래프 데이터 준비
    const datasets = [];
    if (metricsAvailable['CPM']) {
        datasets.push({
            label: 'CPM',
            data: rows.map(row => row.cpm || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
        });
    }
    if (metricsAvailable['CPC']) {
        datasets.push({
            label: 'CPC',
            data: rows.map(row => row.cpc || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
        });
    }
    if (metricsAvailable['CTR']) {
        datasets.push({
            label: 'CTR',
            data: rows.map(row => row.ctr || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
        });
    }

    // 기존 차트 삭제 후 새로 생성
    const chartCanvas = document.getElementById('metricsChart');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '값' }
                },
                x: {
                    title: { display: true, text: '매체' }
                }
            },
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '광고 지표 비교' }
            }
        }
    });
}

// 기존 코드 유지 (하단 부분 생략)