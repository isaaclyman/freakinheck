const config = {
  basePerspectiveDuration: 120,
  charFadeDuration: 7,
  maxFontSize: 30,
  message: "FREAKIN HECK ",
  minFontSize: 4,
  tracerChangeInterval: 200,
};

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const filledXPositions = [];

(function main() {
  const bodyWidth = document.body.offsetWidth;
  const startingLines = bodyWidth / (config.maxFontSize * 4);

  for (let l = 0; l < startingLines; l++) {
    createLine();
  }

  setInterval(() => {
    if (document.visibilityState === "visible") {
      createLine();
    }
  }, 8000 / startingLines);
})();

/*
  Text lines and animations
*/

function createLine(retries = 0) {
  if (retries > 5) {
    return;
  }

  const bodyWidth = document.body.offsetWidth;

  const minX = 0.05 * bodyWidth;
  const maxX = bodyWidth - minX;

  const x0 = Math.random() * (maxX - minX) + minX;
  const size = Math.round(
    Math.random() * (config.maxFontSize - config.minFontSize) +
      config.minFontSize
  );

  if (
    filledXPositions.some(
      ([otherX, otherSize]) => Math.abs(otherX - x0) < Math.max(otherSize, size)
    )
  ) {
    createLine(++retries);
    return;
  }

  const position = [x0, size];
  filledXPositions.push(position);
  setTimeout(() => {
    filledXPositions.splice(filledXPositions.indexOf(position), 1);
  }, 10_000);

  const speed = 220 / size;

  const traceline = document.createElement("div");
  traceline.classList.add("traceline");
  traceline.style.setProperty("left", x0 + "px");
  traceline.style.setProperty("font-size", size + "px");
  traceline.style.setProperty("transform", "scale(1)");
  document.body.appendChild(traceline);

  const tracer = document.createElement("div");
  tracer.classList.add("tracer");

  traceline.appendChild(tracer);
  tracer.style.setProperty("animation-duration", speed + "s");

  let alphabetIx = Math.floor(Math.random() * alphabet.length);
  tracer.setAttribute("data-content", alphabet[alphabetIx % alphabet.length]);

  const tracerChange = setInterval(() => {
    tracer.setAttribute(
      "data-content",
      alphabet[++alphabetIx % alphabet.length]
    );
  }, config.tracerChangeInterval);

  const t0 = document.timeline.currentTime;

  let endTraceline = false;
  perspectiveMove({
    el: traceline,
    size,
    x0,
    t0,
    bodyWidth,
    shouldStop: () => endTraceline,
  });

  let outOfBounds = false;
  leaveChar({
    el: tracer,
    container: traceline,
    size,
    t0,
    shouldStop: () => outOfBounds,
  });

  const checkOutOfBounds = setInterval(() => {
    if (
      tracer.offsetTop > document.body.offsetHeight ||
      tracer.offsetLeft < -1 * config.maxFontSize ||
      tracer.offsetLeft > document.body.offsetWidth
    ) {
      outOfBounds = true;
      tracer.remove();
      clearInterval(tracerChange);
      clearInterval(checkOutOfBounds);

      setTimeout(() => {
        endTraceline = true;
        traceline.remove();
      }, (config.charFadeDuration + 1) * 1000);
    }
  }, 1000);
}

function perspectiveMove({ el, size, x0, t0, bodyWidth, shouldStop }) {
  requestAnimationFrame(() => {
    const elapsed = document.timeline.currentTime - t0;

    // Move left/right
    const centerX = bodyWidth / 2 - size / 2;
    const shouldMoveRight = x0 > centerX;
    const totalDistance = shouldMoveRight ? bodyWidth - centerX : centerX;
    const distancePerSecond = totalDistance / config.basePerspectiveDuration;

    const distance = distancePerSecond * (elapsed / 1000);
    const scaledDistance =
      distance *
      (Math.abs(el.offsetLeft - centerX) / centerX) *
      (shouldMoveRight ? 1 : -1);
    el.style.setProperty("left", x0 + scaledDistance + "px");

    // Move closer to viewer
    const growthMultiple = elapsed / 1000;
    const scaledGrowth = 0.01 * (size / config.maxFontSize) * growthMultiple;
    el.style.setProperty("transform", `scale(${1 + scaledGrowth})`);

    if (!shouldStop()) {
      perspectiveMove({ el, size, x0, t0, bodyWidth, shouldStop });
    }
  });
}

function leaveChar({ el, container, size, t0, lastEl, messageIx, shouldStop }) {
  requestAnimationFrame(() => {
    messageIx = messageIx || Math.floor(Math.random() * config.message.length);

    const vMargin = Math.max(0.2 * size, 2);
    const currentX = el.offsetLeft;
    const currentY = el.offsetTop;
    const shouldLeaveChar =
      !lastEl || currentY > lastEl.offsetTop + size + vMargin;

    if (shouldLeaveChar) {
      const nextEl = document.createElement("div");
      container.appendChild(nextEl);
      nextEl.classList.add("char");
      nextEl.style.setProperty("left", currentX + "px");
      nextEl.style.setProperty("top", currentY + "px");
      nextEl.style.setProperty(
        "animation-duration",
        config.charFadeDuration + "s"
      );

      setTimeout(() => {
        nextEl.remove();
      }, (config.charFadeDuration + 1) * 1000);

      nextEl.innerText = config.message[++messageIx % config.message.length];
      lastEl = nextEl;
    }

    if (!shouldStop()) {
      leaveChar({ el, container, size, t0, lastEl, messageIx, shouldStop });
    }
  });
}
