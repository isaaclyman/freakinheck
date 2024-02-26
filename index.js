const config = {
  basePerspectiveDuration: 120,
  charFadeDuration: 10,
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

  const traceline = document.createElement("div");
  traceline.classList.add("traceline");
  traceline.style.setProperty("left", x0 + "px");
  traceline.style.setProperty("font-size", size + "px");
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

  let outOfBounds = false;
  const t0 = document.timeline.currentTime;

  leaveChar({
    el: tracer,
    container: traceline,
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

      setTimeout(() => {
        traceline.remove();
      }, (config.charFadeDuration + 1) * 1000);
    }
  }, 1000);
}

function leaveChar({ el, container, size, t0, lastEl, messageIx, shouldStop }) {
  requestAnimationFrame(() => {
    messageIx = messageIx || (Math.floor(Math.random() * config.message.length));

    const vMargin = 0.2 * size;
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

      let hasFaded = false;
      setTimeout(() => {
        hasFaded = true;
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
