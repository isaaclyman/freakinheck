const config = {
  basePerspectiveDuration: 60,
  charFadeDuration: 5,
  maxFontSize: 30,
  message: "FREAKIN HECK ",
  minFontSize: 4,
  tracerChangeInterval: 200,
};

const alphabet = "abcdefghijklmnopqrstuvwxyz";

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
  }, 4000 / startingLines);
})();

/*
  Text lines and animations
*/

function createLine() {
  const bodyWidth = document.body.offsetWidth;
  const bodyHeight = document.body.offsetHeight;

  const minX = 0.05 * bodyWidth;
  const maxX = bodyWidth - minX;

  const x0 = Math.random() * (maxX - minX) + minX;
  const size = Math.round(
    Math.random() * (config.maxFontSize - config.minFontSize) +
      config.minFontSize
  );
  const speed = 220 / size;

  const tracer = document.createElement("div");
  tracer.classList.add("tracer");

  document.body.appendChild(tracer);
  tracer.style.setProperty("font-size", size + "px");
  tracer.style.setProperty("left", x0 + "px");
  tracer.style.setProperty("animation-duration", speed + "s");

  let alphabetIx = Math.floor(Math.random() * alphabet.length);
  tracer.setAttribute("data-content", alphabet[alphabetIx % alphabet.length]);

  const tracerChange = setInterval(() => {
    tracer.setAttribute(
      "data-content",
      alphabet[++alphabetIx % alphabet.length]
    );
  }, config.tracerChangeInterval);

  let outOfBounds = false;
  const t0 = document.timeline.currentTime;
  perspectiveMove({
    el: tracer,
    size,
    x0,
    t0,
    shouldStop: () => outOfBounds,
  });

  leaveChar({
    el: tracer,
    size,
    t0,
    shouldStop: () => outOfBounds,
  });

  const checkOutOfBounds = setInterval(() => {
    if (
      tracer.offsetTop > bodyHeight ||
      tracer.offsetLeft < -1 * config.maxFontSize ||
      tracer.offsetLeft > bodyWidth
    ) {
      outOfBounds = true;
      clearInterval(tracerChange);
      clearInterval(checkOutOfBounds);
      tracer.remove();
    }
  }, 1000);
}

function perspectiveMove({ el, size, x0, t0, shouldStop }) {
  requestAnimationFrame(() => {
    const elapsed = document.timeline.currentTime - t0;

    // Move left/right
    const bodyWidth = document.body.offsetWidth;
    const centerX = bodyWidth / 2 - size / 2;
    const shouldMoveRight = x0 > centerX;
    const totalDistance = shouldMoveRight ? bodyWidth - centerX : centerX;
    const distancePerSecond = totalDistance / config.basePerspectiveDuration;

    const distance = distancePerSecond * (elapsed / 1000);
    const scaledDistance =
      distance * (size / config.maxFontSize) * (shouldMoveRight ? 1 : -1);
    el.style.setProperty("left", x0 + scaledDistance + "px");

    // Move closer to viewer
    const growthPerSecond = 1;
    const growth = growthPerSecond * (elapsed / 1000);
    const scaledGrowth = growth * (size / config.maxFontSize);
    el.style.setProperty("font-size", size + scaledGrowth + "px");

    if (!shouldStop()) {
      perspectiveMove({ el, size, x0, t0, shouldStop });
    }
  });
}

function leaveChar({ el, size, t0, lastEl, messageIx, shouldStop }) {
  requestAnimationFrame(() => {
    messageIx = messageIx || 0;

    const vMargin = 0.2 * size;
    const currentX = el.offsetLeft;
    const currentY = el.offsetTop;
    const shouldLeaveChar =
      !lastEl || currentY > lastEl.offsetTop + size + vMargin;

    if (shouldLeaveChar) {
      const nextEl = document.createElement("div");
      document.body.appendChild(nextEl);
      nextEl.classList.add("char");
      nextEl.style.setProperty("left", currentX + "px");
      nextEl.style.setProperty("top", currentY + "px");
      nextEl.style.setProperty("font-size", size + "px");
      nextEl.style.setProperty(
        "animation-duration",
        config.charFadeDuration + "s"
      );

      let hasFaded = false;
      setTimeout(() => {
        hasFaded = true;
        nextEl.remove();
      }, (config.charFadeDuration + 1) * 1000);

      nextEl.innerText = config.message[++messageIx % config.message.length];

      perspectiveMove({
        el: nextEl,
        size,
        x0: currentX,
        t0: document.timeline.currentTime,
        shouldStop: () => shouldStop() || hasFaded,
      })

      lastEl = nextEl;
    }

    if (!shouldStop()) {
      leaveChar({ el, size, t0, lastEl, messageIx, shouldStop });
    }
  });
}
