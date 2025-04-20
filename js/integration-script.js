/**
 * Integration Script for Rainy Hills Robo Advisor
 * Connects the calculation engine with the user interface
 */

// Flag to track initialization
let isInitialized = false;

// Main initialization function
async function initializeRoboAdvisor() {
  if (isInitialized) {
    return;
  }

  try {
    // Initialize data first
    await initializeData();

    // Load the efficient frontier module
    loadEfficientFrontierModule();

    // Mark as initialized
    isInitialized = true;

    console.log("Robo advisor successfully initialized.");

    // Hide loading overlay if present
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }

    // Fire an event to notify that initialization is complete
    document.dispatchEvent(new CustomEvent("roboAdvisorReady"));
  } catch (error) {
    console.error("Failed to initialize robo advisor:", error);

    // Show error in loading overlay
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
                <div class="bg-white p-8 rounded-lg shadow-xl text-center">
                    <div class="text-red-600 text-5xl mb-4">⚠️</div>
                    <h2 class="text-2xl font-bold mb-2">Initialization Error</h2>
                    <p class="text-gray-600 mb-2">We encountered an error while initializing the portfolio engine.</p>
                    <p class="text-gray-500 mb-4">${
                      error.message || "Unknown error"
                    }</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded">Retry</button>
                </div>
            `;
    }
  }
}

// Load the efficient frontier module
function loadEfficientFrontierModule() {
  if (typeof generateEfficientFrontier !== "function") {
    console.warn("Efficient frontier module not loaded yet. Waiting...");

    // Try again in 500ms
    setTimeout(loadEfficientFrontierModule, 500);
    return;
  }

  console.log("Efficient frontier module successfully loaded.");

  // Test run of the efficient frontier calculation with a subset of funds
  const testFunds = Object.keys(fundData).slice(0, 3);
  const testReturns = {};
  testFunds.forEach((fund) => {
    testReturns[fund] = fundData[fund].annualizedReturn;
  });

  // Create a small test covariance matrix
  const testCovMatrix = [];
  for (let i = 0; i < testFunds.length; i++) {
    testCovMatrix[i] = [];
    for (let j = 0; j < testFunds.length; j++) {
      testCovMatrix[i][j] = covarianceMatrix[i][j];
    }
  }

  try {
    const testResults = generateEfficientFrontier(testReturns, testCovMatrix);
    console.log("Efficient frontier test calculation successful:", testResults);
  } catch (error) {
    console.error("Efficient frontier test calculation failed:", error);
  }
}

// Add a loading overlay
function createLoadingOverlay() {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.className =
    "fixed inset-0 bg-blue-800 bg-opacity-90 flex items-center justify-center z-50";
  loadingOverlay.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid mx-auto mb-4"></div>
            <h2 class="text-2xl font-bold mb-2">Initializing Portfolio Engine</h2>
            <p class="text-gray-600 mb-2">Please wait while we prepare your personalized portfolio advisor.</p>
            <p class="text-sm text-gray-500">Loading financial data and optimization models...</p>
        </div>
    `;
  document.body.appendChild(loadingOverlay);
}

// Create a function to run on page load
function onPageLoad() {
  // Add loading overlay
  createLoadingOverlay();

  // Initialize the robo advisor
  initializeRoboAdvisor();
}

// Start initialization when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onPageLoad);
} else {
  onPageLoad();
}
