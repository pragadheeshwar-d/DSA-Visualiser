const sortingAlgorithms = {
  bubble: { name: "Bubble Sort", time: "O(n^2)", space: "O(1)" },
  selection: { name: "Selection Sort", time: "O(n^2)", space: "O(1)" },
  insertion: { name: "Insertion Sort", time: "O(n^2)", space: "O(1)" },
  merge: { name: "Merge Sort", time: "O(n log n)", space: "O(n)" },
  quick: { name: "Quick Sort", time: "O(n log n) average", space: "O(log n)" },
};

const sortingState = {
  array: [],
  steps: [],
  stepIndex: 0,
  running: false,
  paused: false,
  timeoutId: null,
};

const stackState = { items: [], capacity: 7 };
const queueState = { items: [], capacity: 8 };

const graphState = {
  nodes: [],
  edges: [
    ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"],
    ["D", "G"], ["E", "H"], ["F", "I"], ["G", "H"], ["H", "I"],
  ],
  steps: [],
  stepIndex: 0,
  running: false,
  paused: false,
  timeoutId: null,
};

const barsContainer = document.getElementById("bars-container");
const arraySizeInput = document.getElementById("array-size");
const sortingSpeedInput = document.getElementById("sorting-speed");
const sortingAlgorithmSelect = document.getElementById("sorting-algorithm");
const sortingStepText = document.getElementById("sorting-step");
const sortingStatusText = document.getElementById("sorting-status");
const sortingComplexityCard = document.getElementById("sorting-complexity");

const stackContainer = document.getElementById("stack-container");
const stackInput = document.getElementById("stack-input");
const stackCapacityInput = document.getElementById("stack-capacity");
const stackStepText = document.getElementById("stack-step");
const stackTopText = document.getElementById("stack-top");
const stackMessageText = document.getElementById("stack-message");

const queueContainer = document.getElementById("queue-container");
const queueInput = document.getElementById("queue-input");
const queueCapacityInput = document.getElementById("queue-capacity");
const queueStepText = document.getElementById("queue-step");
const queuePointersText = document.getElementById("queue-pointers");
const queueMessageText = document.getElementById("queue-message");

const graphSvg = document.getElementById("graph-svg");
const graphAlgorithmSelect = document.getElementById("graph-algorithm");
const graphStartNodeSelect = document.getElementById("graph-start-node");
const graphSpeedInput = document.getElementById("graph-speed");
const graphStepText = document.getElementById("graph-step");
const graphOrderText = document.getElementById("graph-order");

const hasSortingPage = Boolean(barsContainer && arraySizeInput && sortingSpeedInput && sortingAlgorithmSelect);
const hasStackPage = Boolean(stackContainer && stackInput && stackCapacityInput);
const hasQueuePage = Boolean(queueContainer && queueInput && queueCapacityInput);
const hasGraphPage = Boolean(graphSvg && graphAlgorithmSelect && graphStartNodeSelect && graphSpeedInput);

function createRandomArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function updateSortingComplexity() {
  const current = sortingAlgorithms[sortingAlgorithmSelect.value];
  sortingComplexityCard.innerHTML = `
    <h4>Complexity</h4>
    <p><span>Time:</span> ${current.time}</p>
    <p><span>Space:</span> ${current.space}</p>
  `;
}

function renderBars(array = sortingState.array, highlights = {}) {
  barsContainer.innerHTML = "";
  const widthScale = Math.max(2, Math.floor(100 / array.length));

  array.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${value * 3}px`;
    bar.style.flexBasis = `${widthScale}%`;

    if (highlights.comparing?.includes(index)) bar.classList.add("comparing");
    if (highlights.swapping?.includes(index)) bar.classList.add("swapping");
    if (highlights.pivot?.includes(index)) bar.classList.add("pivot");
    if (highlights.sorted?.includes(index)) bar.classList.add("sorted");

    barsContainer.appendChild(bar);
  });
}

function pushSortingStep(array, highlights, explanation, status) {
  // Each step stores a snapshot so playback can pause and resume cleanly.
  sortingState.steps.push({
    array: [...array],
    highlights: {
      comparing: [...(highlights.comparing || [])],
      swapping: [...(highlights.swapping || [])],
      sorted: [...(highlights.sorted || [])],
      pivot: [...(highlights.pivot || [])],
    },
    explanation,
    status,
  });
}

function buildBubbleSteps() {
  const arr = [...sortingState.array];
  const sorted = [];
  sortingState.steps = [];

  for (let i = 0; i < arr.length; i += 1) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j += 1) {
      pushSortingStep(arr, { comparing: [j, j + 1], sorted }, `Comparing ${arr[j]} and ${arr[j + 1]}.`, "Comparing");
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        pushSortingStep(arr, { swapping: [j, j + 1], sorted }, "Swapped to move the larger value rightward.", "Swapping");
      }
    }
    sorted.unshift(arr.length - i - 1);
    pushSortingStep(arr, { sorted }, `Position ${arr.length - i} is now fixed.`, "Pass complete");
    if (!swapped) break;
  }

  pushSortingStep(arr, { sorted: arr.map((_, index) => index) }, "Array is fully sorted.", "Completed");
}

function buildSelectionSteps() {
  const arr = [...sortingState.array];
  const sorted = [];
  sortingState.steps = [];

  for (let i = 0; i < arr.length; i += 1) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j += 1) {
      pushSortingStep(arr, { comparing: [minIndex, j], sorted }, `Scanning for the minimum from index ${i}.`, "Scanning");
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        pushSortingStep(arr, { comparing: [i, minIndex], sorted }, `New minimum found: ${arr[minIndex]}.`, "New minimum");
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      pushSortingStep(arr, { swapping: [i, minIndex], sorted }, `Placed the minimum value at index ${i}.`, "Swapping");
    }
    sorted.push(i);
    pushSortingStep(arr, { sorted }, `Left section through index ${i} is sorted.`, "Pass complete");
  }

  pushSortingStep(arr, { sorted: arr.map((_, index) => index) }, "Array is fully sorted.", "Completed");
}

function buildInsertionSteps() {
  const arr = [...sortingState.array];
  sortingState.steps = [];

  pushSortingStep(arr, { sorted: [0] }, "Start with the first element as a sorted subarray.", "Initializing");

  for (let i = 1; i < arr.length; i += 1) {
    const key = arr[i];
    let j = i - 1;
    const leftSorted = Array.from({ length: i }, (_, index) => index);
    pushSortingStep(arr, { comparing: [i], sorted: leftSorted }, `Insert ${key} into the sorted left side.`, "Selecting key");

    while (j >= 0 && arr[j] > key) {
      pushSortingStep(arr, { comparing: [j, j + 1], sorted: leftSorted }, `Shift ${arr[j]} right because it is larger than ${key}.`, "Shifting");
      arr[j + 1] = arr[j];
      pushSortingStep(arr, { swapping: [j, j + 1], sorted: leftSorted }, `Moved ${arr[j]} one position to the right.`, "Shifted");
      j -= 1;
    }

    arr[j + 1] = key;
    pushSortingStep(arr, { swapping: [j + 1], sorted: Array.from({ length: i + 1 }, (_, index) => index) }, `${key} is inserted at the correct position.`, "Inserted");
  }

  pushSortingStep(arr, { sorted: arr.map((_, index) => index) }, "Array is fully sorted.", "Completed");
}

function buildMergeSteps() {
  const arr = [...sortingState.array];
  sortingState.steps = [];

  function merge(left, mid, right) {
    // Merge the two sorted halves while recording each visible write.
    const leftPart = arr.slice(left, mid + 1);
    const rightPart = arr.slice(mid + 1, right + 1);
    let i = 0;
    let j = 0;
    let k = left;

    while (i < leftPart.length && j < rightPart.length) {
      pushSortingStep(arr, { comparing: [left + i, mid + 1 + j] }, `Compare left ${leftPart[i]} with right ${rightPart[j]}.`, "Merging");
      if (leftPart[i] <= rightPart[j]) {
        arr[k] = leftPart[i];
        pushSortingStep(arr, { swapping: [k] }, `Placed ${leftPart[i]} into the merged range.`, "Writing");
        i += 1;
      } else {
        arr[k] = rightPart[j];
        pushSortingStep(arr, { swapping: [k] }, `Placed ${rightPart[j]} into the merged range.`, "Writing");
        j += 1;
      }
      k += 1;
    }

    while (i < leftPart.length) {
      arr[k] = leftPart[i];
      pushSortingStep(arr, { swapping: [k] }, `Copied remaining left value ${leftPart[i]}.`, "Copying");
      i += 1;
      k += 1;
    }

    while (j < rightPart.length) {
      arr[k] = rightPart[j];
      pushSortingStep(arr, { swapping: [k] }, `Copied remaining right value ${rightPart[j]}.`, "Copying");
      j += 1;
      k += 1;
    }

    pushSortingStep(arr, { sorted: Array.from({ length: right - left + 1 }, (_, index) => left + index) }, `Merged section ${left} to ${right}.`, "Merged");
  }

  function mergeSort(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    merge(left, mid, right);
  }

  mergeSort(0, arr.length - 1);
  pushSortingStep(arr, { sorted: arr.map((_, index) => index) }, "Array is fully sorted.", "Completed");
}

function buildQuickSteps() {
  const arr = [...sortingState.array];
  sortingState.steps = [];

  function partition(low, high) {
    const pivot = arr[high];
    let i = low - 1;
    pushSortingStep(arr, { pivot: [high] }, `Selected pivot ${pivot} at index ${high}.`, "Choosing pivot");

    for (let j = low; j < high; j += 1) {
      pushSortingStep(arr, { comparing: [j, high], pivot: [high] }, `Compare ${arr[j]} with pivot ${pivot}.`, "Partitioning");
      if (arr[j] <= pivot) {
        i += 1;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        pushSortingStep(arr, { swapping: [i, j], pivot: [high] }, `Moved ${arr[i]} into the left partition.`, "Swapping");
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    pushSortingStep(arr, { swapping: [i + 1, high], sorted: [i + 1] }, `Placed pivot ${pivot} into its final position.`, "Pivot placed");
    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pivotIndex = partition(low, high);
      quickSort(low, pivotIndex - 1);
      quickSort(pivotIndex + 1, high);
    }
  }

  quickSort(0, arr.length - 1);
  pushSortingStep(arr, { sorted: arr.map((_, index) => index) }, "Array is fully sorted.", "Completed");
}

function buildSortingSteps() {
  const type = sortingAlgorithmSelect.value;
  if (type === "bubble") buildBubbleSteps();
  if (type === "selection") buildSelectionSteps();
  if (type === "insertion") buildInsertionSteps();
  if (type === "merge") buildMergeSteps();
  if (type === "quick") buildQuickSteps();
}

function getSortingDelay() {
  return 15 + (101 - Number(sortingSpeedInput.value)) * 8;
}

function playSorting() {
  if (!sortingState.running || sortingState.paused) return;
  if (sortingState.stepIndex >= sortingState.steps.length) {
    sortingState.running = false;
    sortingStatusText.textContent = "Completed";
    return;
  }

  const step = sortingState.steps[sortingState.stepIndex];
  renderBars(step.array, step.highlights);
  sortingStepText.textContent = step.explanation;
  sortingStatusText.textContent = `${step.status} (${sortingState.stepIndex + 1}/${sortingState.steps.length})`;
  sortingState.stepIndex += 1;
  sortingState.timeoutId = setTimeout(playSorting, getSortingDelay());
}

function resetSortingPlayback(message = "Idle") {
  sortingState.running = false;
  sortingState.paused = false;
  sortingState.stepIndex = 0;
  clearTimeout(sortingState.timeoutId);
  sortingStatusText.textContent = message;
}

function initializeSortingArray() {
  sortingState.array = createRandomArray(Number(arraySizeInput.value));
  resetSortingPlayback("Idle");
  renderBars();
  sortingStepText.textContent = "Generate a random array and choose an algorithm to begin.";
}

function startSorting() {
  if (!sortingState.running) {
    buildSortingSteps();
    sortingState.running = true;
    sortingState.paused = false;
    sortingState.stepIndex = 0;
    playSorting();
    return;
  }

  if (sortingState.paused) {
    sortingState.paused = false;
    sortingStatusText.textContent = "Resuming";
    playSorting();
  }
}

function pauseSorting() {
  if (!sortingState.running) return;
  sortingState.paused = !sortingState.paused;
  sortingStatusText.textContent = sortingState.paused ? "Paused" : "Resuming";
  if (!sortingState.paused) playSorting();
}

function renderStack() {
  stackContainer.innerHTML = "";
  stackState.items.forEach((item, index) => {
    const box = document.createElement("div");
    box.className = "stack-item";
    if (index === stackState.items.length - 1) box.classList.add("top");
    box.textContent = item;
    stackContainer.appendChild(box);
  });
  stackTopText.textContent = stackState.items.length ? stackState.items[stackState.items.length - 1] : "None";
}

function updateStackMessage(message, step, isWarning = false) {
  stackMessageText.textContent = message;
  stackStepText.textContent = step;
  stackMessageText.style.color = isWarning ? "#ffcfaa" : "#9cb0c7";
}

function pushStackValue(value) {
  stackState.capacity = Number(stackCapacityInput.value);
  if (!value) {
    updateStackMessage("Please enter a value before pushing.", "Push requires an input value.", true);
    return;
  }
  if (stackState.items.length >= stackState.capacity) {
    updateStackMessage("Stack Overflow: capacity reached.", "No more values can be pushed until one is popped.", true);
    return;
  }
  stackState.items.push(value);
  renderStack();
  updateStackMessage("Value pushed successfully.", `${value} was added to the top of the stack.`);
}

function popStackValue() {
  if (!stackState.items.length) {
    updateStackMessage("Stack Underflow: nothing to pop.", "The stack is empty.", true);
    return;
  }
  const removed = stackState.items.pop();
  renderStack();
  updateStackMessage("Value popped successfully.", `${removed} was removed from the top of the stack.`);
}

function peekStackValue() {
  if (!stackState.items.length) {
    updateStackMessage("Stack Underflow: nothing to peek.", "The stack is empty.", true);
    return;
  }
  const top = stackState.items[stackState.items.length - 1];
  updateStackMessage("Peek completed.", `The current top value is ${top}.`);
}

function resetStack() {
  stackState.capacity = Number(stackCapacityInput.value);
  stackState.items = [];
  renderStack();
  updateStackMessage("No errors.", "The stack is empty and ready for operations.");
}

function randomFillStack() {
  resetStack();
  const target = Math.min(stackState.capacity, Math.floor(Math.random() * stackState.capacity) + 1);
  for (let i = 0; i < target; i += 1) {
    stackState.items.push(String(Math.floor(Math.random() * 90) + 10));
  }
  renderStack();
  updateStackMessage("No errors.", "The stack was randomly filled for a quick demo.");
}

function renderQueue() {
  queueContainer.innerHTML = "";

  for (let i = 0; i < queueState.capacity; i += 1) {
    const slot = document.createElement("div");
    slot.className = "queue-slot";

    if (queueState.items[i] !== undefined) {
      const card = document.createElement("div");
      card.className = "queue-item";
      card.textContent = queueState.items[i];
      slot.appendChild(card);
    }

    if (i === 0 && queueState.items.length) {
      const front = document.createElement("div");
      front.className = "indicator front";
      front.textContent = "Front";
      slot.appendChild(front);
    }

    if (i === queueState.items.length - 1 && queueState.items.length) {
      const rear = document.createElement("div");
      rear.className = "indicator rear";
      rear.textContent = "Rear";
      slot.appendChild(rear);
    }

    queueContainer.appendChild(slot);
  }

  if (queueState.items.length) {
    queuePointersText.textContent = `Front: ${queueState.items[0]} | Rear: ${queueState.items[queueState.items.length - 1]}`;
  } else {
    queuePointersText.textContent = "Front: None | Rear: None";
  }
}

function updateQueueMessage(message, step, isWarning = false) {
  queueMessageText.textContent = message;
  queueStepText.textContent = step;
  queueMessageText.style.color = isWarning ? "#ffcfaa" : "#9cb0c7";
}

function enqueueValue(value) {
  queueState.capacity = Number(queueCapacityInput.value);
  if (!value) {
    updateQueueMessage("Please enter a value before enqueue.", "Enqueue requires an input value.", true);
    return;
  }
  if (queueState.items.length >= queueState.capacity) {
    updateQueueMessage("Queue Overflow: capacity reached.", "Dequeue an item before adding another.", true);
    return;
  }
  queueState.items.push(value);
  renderQueue();
  updateQueueMessage("Enqueue completed.", `${value} joined the rear of the queue.`);
}

function dequeueValue() {
  if (!queueState.items.length) {
    updateQueueMessage("Queue Underflow: nothing to dequeue.", "The queue is empty.", true);
    return;
  }
  const removed = queueState.items.shift();
  renderQueue();
  updateQueueMessage("Dequeue completed.", `${removed} left the front of the queue.`);
}

function resetQueue() {
  queueState.capacity = Number(queueCapacityInput.value);
  queueState.items = [];
  renderQueue();
  updateQueueMessage("No errors.", "The queue is empty and waiting for input.");
}

function randomFillQueue() {
  resetQueue();
  const target = Math.min(queueState.capacity, Math.floor(Math.random() * queueState.capacity) + 1);
  for (let i = 0; i < target; i += 1) {
    queueState.items.push(String(Math.floor(Math.random() * 90) + 10));
  }
  renderQueue();
  updateQueueMessage("No errors.", "The queue was randomly filled for a quick demo.");
}

function generateGraphNodes() {
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const columns = 3;
  const cellWidth = 240;
  const cellHeight = 120;

  graphState.nodes = labels.map((label, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const jitterX = Math.floor(Math.random() * 40) - 20;
    const jitterY = Math.floor(Math.random() * 30) - 15;

    return {
      id: label,
      x: 130 + column * cellWidth + jitterX,
      y: 90 + row * cellHeight + jitterY,
      state: "idle",
    };
  });
}

function buildAdjacencyMap() {
  const map = new Map();
  graphState.nodes.forEach((node) => map.set(node.id, []));
  graphState.edges.forEach(([from, to]) => {
    map.get(from).push(to);
    map.get(to).push(from);
  });
  map.forEach((neighbors) => neighbors.sort());
  return map;
}

function drawGraph() {
  graphSvg.innerHTML = "";

  graphState.edges.forEach(([from, to]) => {
    const fromNode = graphState.nodes.find((node) => node.id === from);
    const toNode = graphState.nodes.find((node) => node.id === to);
    const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    edge.setAttribute("x1", fromNode.x);
    edge.setAttribute("y1", fromNode.y);
    edge.setAttribute("x2", toNode.x);
    edge.setAttribute("y2", toNode.y);
    edge.setAttribute("class", "graph-edge");
    graphSvg.appendChild(edge);
  });

  graphState.nodes.forEach((node) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

    group.style.cursor = "pointer";
    group.addEventListener("click", () => {
      graphStartNodeSelect.value = node.id;
      graphStepText.textContent = `Start node set to ${node.id}.`;
      graphOrderText.textContent = "None";
    });

    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", 28);
    circle.setAttribute("class", `graph-node ${node.state}`);

    label.setAttribute("x", node.x);
    label.setAttribute("y", node.y);
    label.setAttribute("class", "graph-label");
    label.textContent = node.id;

    group.appendChild(circle);
    group.appendChild(label);
    graphSvg.appendChild(group);
  });
}

function resetGraphNodes() {
  graphState.nodes.forEach((node) => {
    node.state = "idle";
  });
  graphOrderText.textContent = "None";
  graphStepText.textContent = "Choose BFS or DFS and pick a starting node.";
  drawGraph();
}

function buildGraphSteps() {
  // BFS uses a queue and DFS uses a stack, but both share the same playback format.
  const adjacency = buildAdjacencyMap();
  const start = graphStartNodeSelect.value;
  const type = graphAlgorithmSelect.value;
  const visited = new Set();
  const order = [];
  graphState.steps = [];

  if (type === "bfs") {
    const queue = [start];
    visited.add(start);

    while (queue.length) {
      const current = queue.shift();
      order.push(current);
      graphState.steps.push({
        active: current,
        visited: [...order],
        explanation: `Visit ${current} and expand its nearest unvisited neighbors.`,
      });

      adjacency.get(current).forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          graphState.steps.push({
            active: neighbor,
            visited: [...order],
            explanation: `Add ${neighbor} to the BFS queue from ${current}.`,
          });
        }
      });
    }
  } else {
    const stack = [start];

    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      order.push(current);
      graphState.steps.push({
        active: current,
        visited: [...order],
        explanation: `Visit ${current} and dive deeper along this branch.`,
      });

      [...adjacency.get(current)].reverse().forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
          graphState.steps.push({
            active: neighbor,
            visited: [...order],
            explanation: `Push ${neighbor} onto the DFS stack from ${current}.`,
          });
        }
      });
    }
  }

  graphState.steps.push({
    active: null,
    visited: [...order],
    explanation: `${type.toUpperCase()} traversal completed.`,
  });
}

function getGraphDelay() {
  return 90 + (101 - Number(graphSpeedInput.value)) * 10;
}

function playGraph() {
  if (!graphState.running || graphState.paused) return;
  if (graphState.stepIndex >= graphState.steps.length) {
    graphState.running = false;
    return;
  }

  const step = graphState.steps[graphState.stepIndex];
  graphState.nodes.forEach((node) => {
    node.state = "idle";
    if (step.visited.includes(node.id)) node.state = "visited";
    if (step.active === node.id) node.state = "active";
  });

  drawGraph();
  graphStepText.textContent = step.explanation;
  graphOrderText.textContent = step.visited.length ? step.visited.join(" -> ") : "None";
  graphState.stepIndex += 1;
  graphState.timeoutId = setTimeout(playGraph, getGraphDelay());
}

function startGraphTraversal() {
  if (!graphState.running) {
    buildGraphSteps();
    graphState.running = true;
    graphState.paused = false;
    graphState.stepIndex = 0;
    playGraph();
    return;
  }

  if (graphState.paused) {
    graphState.paused = false;
    playGraph();
  }
}

function pauseGraphTraversal() {
  if (!graphState.running) return;
  graphState.paused = !graphState.paused;
  if (!graphState.paused) playGraph();
}

function resetGraphTraversal() {
  graphState.running = false;
  graphState.paused = false;
  graphState.stepIndex = 0;
  clearTimeout(graphState.timeoutId);
  resetGraphNodes();
}

function fillGraphStartOptions() {
  graphStartNodeSelect.innerHTML = graphState.nodes
    .map((node) => `<option value="${node.id}">${node.id}</option>`)
    .join("");
}

function bindEvents() {
  document.querySelectorAll(".nav-card").forEach((card) => {
    const target = card.dataset.href;
    if (!target) return;
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, label, option")) return;
      window.location.href = target;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = target;
      }
    });
  });

  if (hasSortingPage) {
    document.getElementById("sorting-randomize").addEventListener("click", initializeSortingArray);
    document.getElementById("sorting-start").addEventListener("click", startSorting);
    document.getElementById("sorting-pause").addEventListener("click", pauseSorting);
    document.getElementById("sorting-reset").addEventListener("click", initializeSortingArray);
    arraySizeInput.addEventListener("input", initializeSortingArray);
    sortingAlgorithmSelect.addEventListener("change", () => {
      updateSortingComplexity();
      resetSortingPlayback("Idle");
      sortingStepText.textContent = "Algorithm changed. Press Start to generate a new walkthrough.";
      renderBars();
    });
  }

  if (hasStackPage) {
    document.getElementById("stack-push").addEventListener("click", () => {
      pushStackValue(stackInput.value.trim());
      stackInput.value = "";
    });
    document.getElementById("stack-pop").addEventListener("click", popStackValue);
    document.getElementById("stack-peek").addEventListener("click", peekStackValue);
    document.getElementById("stack-reset").addEventListener("click", resetStack);
    document.getElementById("stack-random").addEventListener("click", randomFillStack);
    stackCapacityInput.addEventListener("change", resetStack);
  }

  if (hasQueuePage) {
    document.getElementById("queue-enqueue").addEventListener("click", () => {
      enqueueValue(queueInput.value.trim());
      queueInput.value = "";
    });
    document.getElementById("queue-dequeue").addEventListener("click", dequeueValue);
    document.getElementById("queue-reset").addEventListener("click", resetQueue);
    document.getElementById("queue-random").addEventListener("click", randomFillQueue);
    queueCapacityInput.addEventListener("change", resetQueue);
  }

  if (hasGraphPage) {
    document.getElementById("graph-start").addEventListener("click", startGraphTraversal);
    document.getElementById("graph-pause").addEventListener("click", pauseGraphTraversal);
    document.getElementById("graph-reset").addEventListener("click", resetGraphTraversal);
    document.getElementById("graph-random").addEventListener("click", () => {
      generateGraphNodes();
      fillGraphStartOptions();
      resetGraphTraversal();
    });
  }
}

function initializeApp() {
  if (hasSortingPage) {
    updateSortingComplexity();
    initializeSortingArray();
  }
  if (hasStackPage) {
    resetStack();
  }
  if (hasQueuePage) {
    resetQueue();
  }
  if (hasGraphPage) {
    generateGraphNodes();
    fillGraphStartOptions();
    resetGraphTraversal();
  }
  bindEvents();
}

initializeApp();
