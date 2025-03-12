async function logVisit() {
  const logData = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer || "direct",
    userAgent: navigator.userAgent,
  };

  try {
    // GitHub API로 dispatch 이벤트만 트리거
    // 토큰은 클라이언트에서 제거
    await fetch("https://api.github.com/repos/hj21hj/GOAD_DEV.github.io/dispatches", {
      method: "POST",
      headers: {
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
