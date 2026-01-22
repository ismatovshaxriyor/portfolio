const revealItems = document.querySelectorAll("[data-animate]");
const typedElement = document.getElementById("typed-text");
const cursorElement = document.getElementById("typed-cursor");
const REVEAL_DURATION = 1100;
const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const GLITCH_RANDOM_RANGE = [4, 5];
const GLITCH_RANDOM_DELAY = [10, 30];
const GLITCH_DELETE_DELAY = [10, 20];
const GLITCH_SETTLE_DELAY = [30, 50];
const GLITCH_TOTAL_TARGET = 4200;

const randomBetween = ([min, max]) =>
  min + Math.floor(Math.random() * (max - min + 1));

const revealElement = (element) => {
  element.classList.remove("opacity-0", "translate-y-6");
  element.classList.add("opacity-100", "translate-y-0");
};

const getDelayMs = (element) => {
  for (const className of element.classList) {
    if (className.startsWith("delay-[")) {
      const match = className.match(/delay-\\[(\\d+)ms\\]/);
      if (match) {
        return Number(match[1]) || 0;
      }
    }

    if (className.startsWith("delay-")) {
      const value = Number(className.replace("delay-", ""));
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }

  return 0;
};

const normalizeHoverTiming = (element) => {
  if (!element.hasAttribute("data-hover")) return;
  const delayMs = getDelayMs(element);

  window.setTimeout(() => {
    [...element.classList].forEach((className) => {
      if (className.startsWith("delay-")) {
        element.classList.remove(className);
      }
      if (className.startsWith("duration-")) {
        element.classList.remove(className);
      }
    });

    element.classList.add("duration-500");
  }, REVEAL_DURATION + delayMs);
};

if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        normalizeHoverTiming(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const elementInViewport = (element) => {
  const rects = element.getClientRects();
  if (!rects.length) return false;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  for (const rect of rects) {
    if (rect.bottom <= 0 || rect.top >= viewportHeight) continue;
    if (rect.right <= 0 || rect.left >= viewportWidth) continue;
    return true;
  }
  return false;
};

let cursorFrame = null;
const positionCursor = () => {
  if (!typedElement || !cursorElement) return;
  const container = typedElement.closest("h1") || typedElement.parentElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(typedElement);
  const rects = range.getClientRects();
  const lastRect = rects.length ? rects[rects.length - 1] : null;

  let anchorRect = lastRect;
  if (!anchorRect) {
    const fallbackRect = typedElement.getBoundingClientRect();
    if (fallbackRect.width || fallbackRect.height) {
      anchorRect = fallbackRect;
    } else {
      const computed = window.getComputedStyle(container);
      const lineHeight = Number.parseFloat(computed.lineHeight);
      const height = Number.isFinite(lineHeight)
        ? lineHeight
        : containerRect.height;
      cursorElement.style.transform = "translate(0px, 0px)";
      cursorElement.style.height = `${height}px`;
      return;
    }
  }

  const left = anchorRect.right - containerRect.left;
  const top = anchorRect.top - containerRect.top;
  const height = anchorRect.height || containerRect.height;

  cursorElement.style.transform = `translate(${left}px, ${top}px)`;
  cursorElement.style.height = `${height}px`;
};

const scheduleCursorPosition = () => {
  if (cursorFrame) return;
  cursorFrame = window.requestAnimationFrame(() => {
    cursorFrame = null;
    positionCursor();
  });
};

if (typedElement && cursorElement) {
  scheduleCursorPosition();
  window.addEventListener("resize", scheduleCursorPosition);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleCursorPosition);
  }
}

const getVisibleTextNodes = () => {
  const nodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tagName = parent.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest("#typed-text")) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        if (!elementInViewport(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    nodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  return nodes;
};

const getAllTextNodes = () => {
  const nodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tagName = parent.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest("#typed-text")) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    nodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  return nodes;
};

const getViewportElements = (elements) => {
  const visible = [];
  elements.forEach((element) => {
    if (!elementInViewport(element)) return;
    visible.push(element);
  });
  return visible;
};

const lockElementHeight = (element, lockMap) => {
  if (lockMap.has(element)) return;
  const rect = element.getBoundingClientRect();
  if (!rect.height) return;
  const currentStyle = element.style.minHeight;
  lockMap.set(element, currentStyle);
  element.style.minHeight = `${rect.height}px`;
};

const glitchTextNode = (node, startDelay, charStagger) => {
  const originalText = node.nodeValue;
  const characters = Array.from(originalText);
  const display = characters.map((char) => (char === " " ? " " : ""));
  node.nodeValue = display.join("");

  let endTime = startDelay;

  characters.forEach((char, index) => {
    const baseDelay = startDelay + index * charStagger;

    if (char === " " || char === "\n" || char === "\t") {
      display[index] = char;
      return;
    }

    let time = baseDelay;
    const randomCount = randomBetween(GLITCH_RANDOM_RANGE);

    for (let i = 0; i < randomCount; i += 1) {
      time += randomBetween(GLITCH_RANDOM_DELAY);
      window.setTimeout(() => {
        const randomChar =
          GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        display[index] = randomChar;
        node.nodeValue = display.join("");
      }, time);

      time += randomBetween(GLITCH_DELETE_DELAY);
      window.setTimeout(() => {
        display[index] = "";
        node.nodeValue = display.join("");
      }, time);
    }

    time += randomBetween(GLITCH_SETTLE_DELAY);
    window.setTimeout(() => {
      display[index] = char;
      node.nodeValue = display.join("");
    }, time);

    if (time > endTime) {
      endTime = time;
    }
  });

  window.setTimeout(() => {
    node.nodeValue = originalText;
  }, endTime + 30);

  return endTime;
};

const runInitialGlitch = () => {
  if (!document.body) return Promise.resolve(false);

  const introItems = getViewportElements(revealItems);
  introItems.forEach((item) => {
    revealElement(item);
    item.classList.add("transition-none");
  });

  const textNodes = getVisibleTextNodes();
  if (!textNodes.length) {
    const fallbackNodes = getAllTextNodes();
    if (!fallbackNodes.length) {
      introItems.forEach((item) => {
        item.classList.remove("transition-none");
      });
      return Promise.resolve(false);
    }

    textNodes.push(...fallbackNodes);
  }

  const maxLength = Math.max(
    ...textNodes.map((node) => node.nodeValue.trim().length)
  );
  const averageCycleDuration =
    ((GLITCH_RANDOM_RANGE[0] + GLITCH_RANDOM_RANGE[1]) / 2) *
      ((GLITCH_RANDOM_DELAY[0] + GLITCH_RANDOM_DELAY[1]) / 2 +
        (GLITCH_DELETE_DELAY[0] + GLITCH_DELETE_DELAY[1]) / 2) +
    (GLITCH_SETTLE_DELAY[0] + GLITCH_SETTLE_DELAY[1]) / 2;
  const charStagger = Math.min(
    70,
    Math.max(
      30,
      Math.floor((GLITCH_TOTAL_TARGET - averageCycleDuration) / maxLength)
    )
  );

  const lockedElements = new Map();
  textNodes.forEach((node) => {
    if (node.parentElement) {
      lockElementHeight(node.parentElement, lockedElements);
    }
  });

  let longestEnd = 0;
  textNodes.forEach((node, index) => {
    const startDelay = Math.min(index * 40, 320);
    const endTime = glitchTextNode(node, startDelay, charStagger);
    if (endTime > longestEnd) {
      longestEnd = endTime;
    }
  });

  return new Promise((resolve) => {
    window.setTimeout(() => {
      lockedElements.forEach((minHeight, element) => {
        element.style.minHeight = minHeight;
      });
      introItems.forEach((item) => {
        item.classList.remove("transition-none");
      });
      resolve(true);
    }, longestEnd + 60);
  });
};

const createTypewriter = (element, { onUpdate } = {}) => {
  if (!element) return null;

  const phrases = [
    "Hi everyone, I'm\u00A0Shaxriyor",
    "Building resilient systems for modern digital experiences",
    "Crafting scalable backend solutions with Python",
    "Turning complex problems into elegant code",
  ];

  const typingSpeed = 80;
  const typingVariance = 20;
  const deleteSpeed = 50;
  const deleteVariance = 10;
  const pauseAfterType = 1500;
  const pauseAfterDelete = 150;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingTimer = null;

  const scheduleNext = (delay) => {
    typingTimer = window.setTimeout(typeLoop, delay);
  };

  const notifyUpdate = () => {
    if (typeof onUpdate === "function") {
      onUpdate();
    }
  };

  const getTypingDelay = () =>
    typingSpeed + Math.random() * typingVariance;
  const getDeleteDelay = () =>
    deleteSpeed + Math.random() * deleteVariance;

  const typeLoop = () => {
    const phrase = phrases[phraseIndex];

    if (!isDeleting) {
      charIndex += 1;
      element.textContent = phrase.slice(0, charIndex);
      notifyUpdate();

      if (charIndex >= phrase.length) {
        isDeleting = true;
        scheduleNext(pauseAfterType);
        return;
      }

      scheduleNext(getTypingDelay());
      return;
    }

    charIndex -= 1;
    element.textContent = phrase.slice(0, charIndex);
    notifyUpdate();

    if (charIndex <= 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      scheduleNext(pauseAfterDelete);
      return;
    }

    scheduleNext(getDeleteDelay());
  };

  const stop = () => {
    if (!typingTimer) return;
    window.clearTimeout(typingTimer);
    typingTimer = null;
  };

  const start = ({ startFromFull = false } = {}) => {
    if (typingTimer) return;

    if (startFromFull) {
      phraseIndex = 0;
      charIndex = phrases[0].length;
      isDeleting = true;
      element.textContent = phrases[0];
      notifyUpdate();
      scheduleNext(pauseAfterType);
      return;
    }

    element.textContent = "";
    charIndex = 0;
    isDeleting = false;
    notifyUpdate();
    scheduleNext(getTypingDelay());
  };

  const setStatic = () => {
    element.textContent = phrases[0];
    notifyUpdate();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      return;
    }

    if (!typingTimer) {
      scheduleNext(getTypingDelay());
    }
  });

  return { start, stop, setStatic };
};

const startIntroSequence = () => {
  let typingStarted = false;
  let typewriter = null;

  const startTyping = () => {
    if (typingStarted) return;
    const typedElement = document.getElementById("typed-text");
    if (!typedElement) return;

    if (!typewriter) {
      typewriter = createTypewriter(typedElement, {
        onUpdate: scheduleCursorPosition,
      });
    }
    if (!typewriter) return;

    typingStarted = true;
    typewriter.start({ startFromFull: true });
  };

  const glitchPromise = runInitialGlitch();
  const glitchTimeout = new Promise((resolve) => {
    window.setTimeout(resolve, GLITCH_TOTAL_TARGET + 800);
  });

  Promise.race([glitchPromise, glitchTimeout]).then(startTyping);
  window.setTimeout(startTyping, GLITCH_TOTAL_TARGET + 1200);
};

let introHasRun = false;
const runIntroOnce = () => {
  if (introHasRun) return;
  introHasRun = true;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(startIntroSequence, 120);
    });
  });
};

if (document.readyState !== "loading") {
  runIntroOnce();
} else {
  document.addEventListener("DOMContentLoaded", runIntroOnce, { once: true });
}

window.addEventListener("load", runIntroOnce, { once: true });
