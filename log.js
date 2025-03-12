async function logVisit() {
  const logData = {
    timestamp: new Date().toISOString(), // 방문 시간
    url: window.location.href, // 방문한 URL
    referrer: document.referrer || "direct", // 어디서 왔는지
    userAgent: navigator.userAgent, // 브라우저 정보
  };

  try {
    await fetch("https://api.github.com/repos/hj21hj/log-storage/dispatches", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_PERSONAL_ACCESS_TOKEN", // 2단계에서 생성한 토큰
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
      },
      body: JSON.stringify({
        event_type: "log-event",
        client_payload: logData,
      }),
    });
  } catch (error) {
    console.error("Log failed:", error);
  }
}

window.addEventListener("load", logVisit);
