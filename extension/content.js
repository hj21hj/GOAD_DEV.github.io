function injectDragOverlay(type, buttonId, step) {
  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.1)";
  overlay.style.zIndex = "9999";
  document.body.appendChild(overlay);

  let isDragging = false;
  let startX, startY;
  let box = null;

  function startDrag(event) {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;

    box = document.createElement("div");
    box.style.position = "absolute";
    box.style.border = "3px solid red";
    box.style.background = "rgba(255, 0, 0, 0.2)";
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    overlay.appendChild(box);
  }

  function drag(event) {
    if (!isDragging) return;
    let width = event.clientX - startX;
    let height = event.clientY - startY;

    if (width < 0) {
      box.style.left = `${event.clientX}px`;
      width = Math.abs(width);
    }
    if (height < 0) {
      box.style.top = `${event.clientY}px`;
      height = Math.abs(height);
    }

    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }

  function stopDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    const rect = {
      x: parseInt(box.style.left),
      y: parseInt(box.style.top),
      width: parseInt(box.style.width),
      height: parseInt(box.style.height)
    };
    document.body.removeChild(overlay);

    chrome.runtime.sendMessage({
      type: "areaSelected",
      data: { type, rect, buttonId, step }
    });
  }

  overlay.addEventListener("mousedown", startDrag);
  overlay.addEventListener("mousemove", drag);
  overlay.addEventListener("mouseup", stopDrag);
}
