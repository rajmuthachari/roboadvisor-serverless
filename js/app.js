/**
 * Main Application for Rainy Hills Robo Advisor
 * Initializes and coordinates all components
 */

// Global application state
const appState = {
  currentSection: "section-intro",
  currentQuestionIndex: 0,
  questionResponses: [],
  riskProfile: null,
  riskAversion: null,
  optimalPortfolio: null,
  progress: 0,
  investmentGoals: {
    type: "retirement",
    amount: 100000,
    timeHorizon: 10,
    initialInvestment: 10000,
    monthlyContribution: 500,
  },
  currentScenario: "base",
  knowledgeLevel: null,
  timeHorizon: null,
};

// When the document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the application
  initializeApp();

  // Event listeners for navigation buttons
  document
    .getElementById("btn-start-questionnaire")
    .addEventListener("click", () => navigateTo("section-funds"));
  document
    .getElementById("btn-view-funds")
    .addEventListener("click", () => navigateTo("section-funds"));
  document
    .getElementById("btn-back-to-intro")
    .addEventListener("click", () => navigateTo("section-intro"));
  document
    .getElementById("btn-to-questionnaire")
    .addEventListener("click", () => navigateTo("section-questionnaire"));
  document
    .getElementById("btn-prev-question")
    .addEventListener("click", handlePrevQuestion);
  document
    .getElementById("btn-next-question")
    .addEventListener("click", handleNextQuestion);
  document
    .getElementById("btn-retake-questionnaire")
    .addEventListener("click", () => {
      resetQuestionnaire();
      navigateTo("section-questionnaire");
    });
  document
    .getElementById("btn-to-portfolio")
    .addEventListener("click", () => navigateTo("section-portfolio"));
  document
    .getElementById("btn-back-to-risk-profile")
    .addEventListener("click", () => navigateTo("section-risk-profile"));
  document
    .getElementById("btn-download-report")
    .addEventListener("click", handleDownloadReport);
  document
    .getElementById("btn-back-to-portfolio")
    .addEventListener("click", () => navigateTo("section-portfolio"));

  // Event listeners for modals
  document
    .getElementById("btn-open-goal-modal")
    .addEventListener("click", () => {
      document.getElementById("goal-modal").classList.remove("hidden");
    });
  document
    .getElementById("btn-close-goal-modal")
    .addEventListener("click", () => {
      document.getElementById("goal-modal").classList.add("hidden");
    });
  document
    .getElementById("btn-open-methodology")
    .addEventListener("click", () => navigateTo("section-methodology"));

  // Event listeners for forms
  document.getElementById("goal-form").addEventListener("submit", function (e) {
    e.preventDefault();
    saveGoals();
    document.getElementById("goal-modal").classList.add("hidden");
  });

  // Event listeners for sorting
  document
    .getElementById("btn-sort-return")
    .addEventListener("click", () => sortFunds("annualizedReturn", true));
  document
    .getElementById("btn-sort-risk")
    .addEventListener("click", () => sortFunds("annualizedVolatility", false));
  document
    .getElementById("btn-sort-sharpe")
    .addEventListener("click", () => sortFunds("sharpeRatio", true));

  // Event listeners for scenarios
  document.querySelectorAll(".scenario-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const scenario = this.dataset.scenario;
      changeScenario(scenario);
    });
  });

  // Event listener for time horizon slider
  document
    .getElementById("goal-time-horizon")
    .addEventListener("input", function () {
      document.getElementById(
        "time-horizon-value"
      ).textContent = `${this.value} years`;
    });
});

// Initialize the application
function initializeApp() {
  // Populate fund cards
  populateFundCards();

  // Create correlation heatmap
  createCorrelationHeatmap();

  // Create risk-return scatter plot
  createRiskReturnScatter();

  // Initialize the questionnaire
  showCurrentQuestion();

  // Update progress
  updateProgress(0);
}

// Navigate to a section
function navigateTo(sectionId) {
  // Hide current section
  document.getElementById(appState.currentSection).classList.remove("active");

  // Show new section
  document.getElementById(sectionId).classList.add("active");

  // Update state
  appState.currentSection = sectionId;

  // Perform section-specific actions
  switch (sectionId) {
    case "section-questionnaire":
      updateProgress(20);
      break;
    case "section-risk-profile":
      updateProgress(60);
      if (
        appState.questionResponses.length === questionnaireData.questions.length
      ) {
        calculateRiskProfile();
      }
      break;
    case "section-portfolio":
      updateProgress(80);
      if (appState.riskAversion) {
        calculateOptimalPortfolio();
      }
      break;
    case "section-methodology":
      updateProgress(100);
      break;
    case "section-funds":
      updateProgress(10);
      break;
    case "section-intro":
      updateProgress(0);
      break;
  }
}

// Update progress bar
function updateProgress(progress) {
  appState.progress = progress;

  // Update progress bar
  document.getElementById("progress-bar").style.width = `${progress}%`;
  document.getElementById("progress-percentage").textContent = `${progress}%`;

  // Update progress text
  let progressText;
  if (progress === 0) progressText = "Step 1: Introduction";
  else if (progress < 20) progressText = "Step 2: Fund Information";
  else if (progress < 60) progressText = "Step 3: Risk Profiling";
  else if (progress < 80) progressText = "Step 4: Risk Profile Results";
  else if (progress < 100) progressText = "Step 5: Portfolio Recommendations";
  else progressText = "Step 6: Methodology";

  document.getElementById("progress-text").textContent = progressText;
}

// Populate fund cards
function populateFundCards() {
  const container = document.getElementById("fund-cards-container");
  container.innerHTML = "";

  const fundNames = Object.keys(fundData);

  fundNames.forEach((fundName) => {
    const fund = fundData[fundName];
    const card = document.createElement("div");
    card.className = "fund-card";

    // Set background color based on asset class
    let bgColor = "bg-white";
    if (fund.assetClass.includes("Equity")) bgColor = "bg-blue-50";
    else if (fund.assetClass.includes("Fixed Income")) bgColor = "bg-green-50";
    else if (fund.assetClass.includes("Alternative")) bgColor = "bg-yellow-50";

    card.classList.add(bgColor);

    // Create card content - REMOVED expense ratio section
    card.innerHTML = `
            <h4 class="font-semibold text-md mb-2">${fundName}</h4>
            <div class="text-xs text-gray-500 mb-2">${fund.assetClass}</div>
            <div class="grid grid-cols-2 gap-1 mb-2">
                <div>
                    <div class="text-xs text-gray-500">Annual Return</div>
                    <div class="font-medium ${
                      fund.annualizedReturn >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }">
                        ${(fund.annualizedReturn * 100).toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Volatility</div>
                    <div class="font-medium">${(
                      fund.annualizedVolatility * 100
                    ).toFixed(2)}%</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-1 mb-2">
                <div>
                    <div class="text-xs text-gray-500">Sharpe Ratio</div>
                    <div class="font-medium ${
                      fund.sharpeRatio >= 0 ? "text-green-600" : "text-red-600"
                    }">
                        ${fund.sharpeRatio.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div class="text-xs text-gray-500">Max Drawdown</div>
                    <div class="font-medium text-red-600">${(
                      fund.maxDrawdown * 100
                    ).toFixed(2)}%</div>
                </div>
            </div>
            <p class="text-xs text-gray-600 line-clamp-2">${
              fund.description
            }</p>
        `;

    container.appendChild(card);
  });
}

// Sort funds by a specific metric
function sortFunds(metric, descending = true) {
  const container = document.getElementById("fund-cards-container");
  const cards = Array.from(container.children);

  // Sort the cards based on the fund data
  cards.sort((a, b) => {
    const fundNameA = a.querySelector("h4").textContent;
    const fundNameB = b.querySelector("h4").textContent;

    const valueA = fundData[fundNameA][metric];
    const valueB = fundData[fundNameB][metric];

    return descending ? valueB - valueA : valueA - valueB;
  });

  // Re-append the cards in the sorted order
  cards.forEach((card) => container.appendChild(card));
}

// Old -Calculate optimal portfolio based on risk aversion
/*function calculateOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Calculate optimal portfolio
  const optimalWeights = optimizePortfolio(
    meanReturns,
    covarianceMatrix,
    appState.riskAversion
  );

  // Calculate portfolio statistics
  const portfolioReturn = calculatePortfolioReturn(meanReturns, optimalWeights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    optimalWeights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility; // Assuming 3% risk-free rate

  // Filter for significant allocations (> 1%)
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < numAssets; i++) {
    if (optimalWeights[i] > 0.01) {
      significantAllocations[fundNames[i]] = optimalWeights[i];
      totalSignificant += optimalWeights[i];
    }
  }

  // Normalize significant allocations
  for (const fund in significantAllocations) {
    significantAllocations[fund] =
      significantAllocations[fund] / totalSignificant;
  }

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: optimalWeights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: Object.entries(significantAllocations).map(
      ([fund, weight]) => ({ fund, weight })
    ),
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
  };

  // Update UI
  updatePortfolioUI();
}
*/

// v2-working
/*function calculateOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Check for sufficient fixed income options for conservative portfolios
  const fixedIncomeCount = fundNames.filter((fund) =>
    fundData[fund].assetClass.includes("Fixed Income")
  ).length;

  if (
    (appState.riskProfile === "Very Conservative" ||
      appState.riskProfile === "Conservative") &&
    fixedIncomeCount < 2
  ) {
    console.log(
      "Not enough fixed income options for conservative portfolio. Using special allocation."
    );
    applySpecialConservativeAllocation();
    return;
  }

  // Continue with original optimization if enough fixed income options are available
  // Add risk profile based constraints
  let customConstraints = [];

  // Helper function to find indices of funds by asset class
  function findIndicesOfFundsByAssetClass(assetClassSubstring) {
    return fundNames.reduce((indices, fundName, index) => {
      if (fundData[fundName].assetClass.includes(assetClassSubstring)) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  // Get indices for different asset classes
  const equityFundIndices = findIndicesOfFundsByAssetClass("Equity");
  const fixedIncomeFundIndices = findIndicesOfFundsByAssetClass("Fixed Income");
  const alternativeFundIndices = findIndicesOfFundsByAssetClass("Alternative");

  // Add constraints based on risk profile
  if (appState.riskProfile === "Very Conservative") {
    // For very conservative, use heavy fixed income allocation
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.2 - equityExposure; // Equity ≤ 20%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return fixedIncomeExposure - 0.7; // Fixed Income ≥ 70%
      },
    });
  } else if (appState.riskProfile === "Conservative") {
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.4 - equityExposure; // Equity ≤ 40%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return fixedIncomeExposure - 0.5; // Fixed Income ≥ 50%
      },
    });
  } else if (appState.riskProfile === "Moderate") {
    // Ensure balanced allocation for moderate profiles
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.3; // Equity ≥ 30%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.7 - equityExposure; // Equity ≤ 70%
      },
    });
  } else if (appState.riskProfile === "Growth-Oriented") {
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.6; // Equity ≥ 60%
      },
    });
  } else if (appState.riskProfile === "Aggressive") {
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.7; // Equity ≥ 70%
      },
    });
  }

  // Calculate optimal portfolio with constraints
  const optimalWeights = optimizePortfolio(
    meanReturns,
    covarianceMatrix,
    appState.riskAversion,
    customConstraints
  );

  // Calculate portfolio statistics
  const portfolioReturn = calculatePortfolioReturn(meanReturns, optimalWeights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    optimalWeights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility; // Assuming 3% risk-free rate

  // Filter for significant allocations (> 1%)
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < numAssets; i++) {
    if (optimalWeights[i] > 0.01) {
      significantAllocations[fundNames[i]] = optimalWeights[i];
      totalSignificant += optimalWeights[i];
    }
  }

  // Normalize significant allocations
  for (const fund in significantAllocations) {
    significantAllocations[fund] =
      significantAllocations[fund] / totalSignificant;
  }

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: optimalWeights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: Object.entries(significantAllocations).map(
      ([fund, weight]) => ({ fund, weight })
    ),
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
  };

  // Validate the portfolio
  validateOptimalPortfolio();

  // Update UI
  updatePortfolioUI();
}
*/

// Calculate optimal portfolio based on risk aversion using enhanced MPT approach
function calculateOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns and volatilities for diagnostics
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const volatilities = fundNames.map(
    (fund) => fundData[fund].annualizedVolatility
  );

  // Log key fund characteristics for diagnostics
  console.log("Fund universe characteristics:");
  console.log(
    "Min return:",
    Math.min(...meanReturns),
    "Max return:",
    Math.max(...meanReturns)
  );
  console.log(
    "Min volatility:",
    Math.min(...volatilities),
    "Max volatility:",
    Math.max(...volatilities)
  );

  // First, calculate key portfolios on the efficient frontier
  const minVolWeights = minimizeVolatility(meanReturns, covarianceMatrix);
  const minVolReturn = calculatePortfolioReturn(meanReturns, minVolWeights);
  const minVolRisk = calculatePortfolioVolatility(
    covarianceMatrix,
    minVolWeights
  );

  const maxSharpeWeights = maximizeSharpeRatio(meanReturns, covarianceMatrix);
  const maxSharpeReturn = calculatePortfolioReturn(
    meanReturns,
    maxSharpeWeights
  );
  const maxSharpeRisk = calculatePortfolioVolatility(
    covarianceMatrix,
    maxSharpeWeights
  );

  // Maximum return portfolio (single asset, highest return)
  const maxReturnIndex = meanReturns.indexOf(Math.max(...meanReturns));
  const maxReturnWeights = Array(numAssets).fill(0);
  maxReturnWeights[maxReturnIndex] = 1;
  const maxReturn = meanReturns[maxReturnIndex];
  const maxReturnRisk = Math.sqrt(
    covarianceMatrix[maxReturnIndex][maxReturnIndex]
  );

  // Log key portfolios for diagnostics
  console.log(
    "Minimum Variance Portfolio - Return:",
    minVolReturn,
    "Risk:",
    minVolRisk
  );
  console.log(
    "Maximum Sharpe Portfolio - Return:",
    maxSharpeReturn,
    "Risk:",
    maxSharpeRisk
  );
  console.log(
    "Maximum Return Portfolio - Return:",
    maxReturn,
    "Risk:",
    maxReturnRisk
  );

  // Calculate return range for all risk profiles
  const returnRange = maxReturn - minVolReturn;

  // If the return range is very small, we need a different approach
  if (returnRange < 0.02) {
    // Less than 2% difference between min and max return
    console.warn(
      "Very small return range detected. Using alternative approach."
    );
    // Use a risk-based approach instead of return-based
    return calculateRiskBasedPortfolio();
  }

  // Generate a series of portfolios along the efficient frontier
  const numPortfolios = 20;
  const efficientFrontierReturns = [];
  const efficientFrontierRisks = [];
  const efficientFrontierWeights = [];

  // Create portfolios from min variance to max return
  for (let i = 0; i < numPortfolios; i++) {
    const t = i / (numPortfolios - 1);
    const targetReturn = minVolReturn + t * (maxReturn - minVolReturn);

    try {
      const weights = minimizeVolatilityForTargetReturn(
        meanReturns,
        covarianceMatrix,
        targetReturn
      );
      const risk = calculatePortfolioVolatility(covarianceMatrix, weights);

      efficientFrontierReturns.push(targetReturn);
      efficientFrontierRisks.push(risk);
      efficientFrontierWeights.push(weights);
    } catch (e) {
      console.warn(
        `Could not calculate portfolio for return ${targetReturn}`,
        e
      );
    }
  }

  // Log efficient frontier
  console.log(
    "Generated Efficient Frontier - Points:",
    efficientFrontierReturns.length
  );

  // Find portfolio based on risk profile
  let selectedPortfolioIndex;

  switch (appState.riskProfile) {
    case "Very Conservative":
      // Use the portfolio closest to 10% along efficient frontier
      selectedPortfolioIndex = Math.floor(
        0.1 * (efficientFrontierWeights.length - 1)
      );
      break;
    case "Conservative":
      // Use the portfolio closest to 25% along efficient frontier
      selectedPortfolioIndex = Math.floor(
        0.25 * (efficientFrontierWeights.length - 1)
      );
      break;
    case "Moderate":
      // Use the portfolio closest to 50% along efficient frontier
      selectedPortfolioIndex = Math.floor(
        0.5 * (efficientFrontierWeights.length - 1)
      );
      break;
    case "Growth-Oriented":
      // Use the portfolio closest to 75% along efficient frontier
      selectedPortfolioIndex = Math.floor(
        0.75 * (efficientFrontierWeights.length - 1)
      );
      break;
    case "Aggressive":
      // Use the portfolio closest to 90% along efficient frontier
      selectedPortfolioIndex = Math.floor(
        0.9 * (efficientFrontierWeights.length - 1)
      );
      break;
    default:
      // Default to middle of frontier
      selectedPortfolioIndex = Math.floor(
        0.5 * (efficientFrontierWeights.length - 1)
      );
  }

  // Ensure we have a valid index
  if (
    selectedPortfolioIndex < 0 ||
    selectedPortfolioIndex >= efficientFrontierWeights.length
  ) {
    selectedPortfolioIndex = 0; // Fallback to the safest portfolio
  }

  // Get the optimal weights
  const optimalWeights = efficientFrontierWeights[selectedPortfolioIndex];

  // Log selected portfolio
  console.log("Selected Portfolio for " + appState.riskProfile + ":");
  console.log("Return:", efficientFrontierReturns[selectedPortfolioIndex]);
  console.log("Risk:", efficientFrontierRisks[selectedPortfolioIndex]);

  // Calculate portfolio statistics
  const portfolioReturn = calculatePortfolioReturn(meanReturns, optimalWeights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    optimalWeights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  // Filter for significant allocations (> 1%)
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < numAssets; i++) {
    if (optimalWeights[i] > 0.01) {
      significantAllocations[fundNames[i]] = optimalWeights[i];
      totalSignificant += optimalWeights[i];
    }
  }

  // Normalize significant allocations
  for (const fund in significantAllocations) {
    significantAllocations[fund] =
      significantAllocations[fund] / totalSignificant;
  }

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: optimalWeights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: Object.entries(significantAllocations).map(
      ([fund, weight]) => ({ fund, weight })
    ),
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
  };

  // Update UI
  updatePortfolioUI();
}

// Alternative approach based on risk level rather than return targets
function calculateRiskBasedPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Calculate global minimum variance portfolio
  const minVolWeights = minimizeVolatility(meanReturns, covarianceMatrix);
  const minVolRisk = calculatePortfolioVolatility(
    covarianceMatrix,
    minVolWeights
  );

  // Calculate maximum return portfolio (single highest return asset)
  const maxReturnIndex = meanReturns.indexOf(Math.max(...meanReturns));
  const maxReturnWeights = Array(numAssets).fill(0);
  maxReturnWeights[maxReturnIndex] = 1;
  const maxReturnRisk = Math.sqrt(
    covarianceMatrix[maxReturnIndex][maxReturnIndex]
  );

  // Calculate target risk level based on risk profile
  let targetRisk;

  switch (appState.riskProfile) {
    case "Very Conservative":
      targetRisk = minVolRisk * 1.1; // Just slightly above minimum risk
      break;
    case "Conservative":
      targetRisk = minVolRisk + 0.25 * (maxReturnRisk - minVolRisk);
      break;
    case "Moderate":
      targetRisk = minVolRisk + 0.5 * (maxReturnRisk - minVolRisk);
      break;
    case "Growth-Oriented":
      targetRisk = minVolRisk + 0.75 * (maxReturnRisk - minVolRisk);
      break;
    case "Aggressive":
      targetRisk = minVolRisk + 0.9 * (maxReturnRisk - minVolRisk);
      break;
    default:
      targetRisk = minVolRisk + 0.5 * (maxReturnRisk - minVolRisk);
  }

  console.log(
    "Target risk level for " + appState.riskProfile + ":",
    targetRisk
  );

  // Find portfolio that maximizes return for target risk level
  const optimalWeights = maximizeReturnForTargetRisk(
    meanReturns,
    covarianceMatrix,
    targetRisk
  );

  // Continue with the same post-processing as original function...
  const portfolioReturn = calculatePortfolioReturn(meanReturns, optimalWeights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    optimalWeights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  // Filter for significant allocations
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < numAssets; i++) {
    if (optimalWeights[i] > 0.01) {
      significantAllocations[fundNames[i]] = optimalWeights[i];
      totalSignificant += optimalWeights[i];
    }
  }

  // Normalize significant allocations
  for (const fund in significantAllocations) {
    significantAllocations[fund] =
      significantAllocations[fund] / totalSignificant;
  }

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: optimalWeights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: Object.entries(significantAllocations).map(
      ([fund, weight]) => ({ fund, weight })
    ),
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
  };

  // Update UI
  updatePortfolioUI();
}

// New function: Maximize return for a target risk level
function maximizeReturnForTargetRisk(returns, covMatrix, targetRisk) {
  const n = returns.length;

  // Objective function: maximize portfolio return (minimize negative return)
  function objectiveFunction(weights) {
    return -calculatePortfolioReturn(returns, weights);
  }

  // Initial guess: equal weights
  const initialWeights = Array(n).fill(1 / n);

  // Constraints: weights sum to 1, all weights >= 0, and portfolio risk = targetRisk
  const constraints = [
    {
      type: "eq",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
    {
      type: "eq",
      fun: function (weights) {
        return calculatePortfolioVolatility(covMatrix, weights) - targetRisk;
      },
    },
  ];

  // Bounds: all weights between 0 and 1
  const bounds = Array(n).fill([0, 1]);

  // Optimize with multiple restarts for better convergence
  return minimizeNelderMead(
    objectiveFunction,
    initialWeights,
    constraints,
    bounds,
    { restarts: 3 }
  );
}

// Last best working: Complete updated calculateOptimalPortfolio function
/*function calculateOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Check for sufficient fixed income options for conservative portfolios
  const fixedIncomeCount = fundNames.filter((fund) =>
    fundData[fund].assetClass.includes("Fixed Income")
  ).length;

  if (
    (appState.riskProfile === "Very Conservative" ||
      appState.riskProfile === "Conservative") &&
    fixedIncomeCount < 2
  ) {
    console.log(
      "Not enough fixed income options for conservative portfolio. Using special allocation."
    );
    applySpecialConservativeAllocation();
    return;
  }

  // Add risk profile based constraints
  let customConstraints = [];

  // Helper function to find indices of funds by asset class
  function findIndicesOfFundsByAssetClass(assetClassSubstring) {
    return fundNames.reduce((indices, fundName, index) => {
      if (fundData[fundName].assetClass.includes(assetClassSubstring)) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  // Get indices for different asset classes
  const equityFundIndices = findIndicesOfFundsByAssetClass("Equity");
  const fixedIncomeFundIndices = findIndicesOfFundsByAssetClass("Fixed Income");
  const alternativeFundIndices = findIndicesOfFundsByAssetClass("Alternative");

  // Adjust risk aversion values with better separation
  let riskAversionValue;

  switch (appState.riskProfile) {
    case "Very Conservative":
      riskAversionValue = 12.0; // High but achievable
      break;
    case "Conservative":
      riskAversionValue = 8.0; // Clear separation from Very Conservative
      break;
    case "Moderate":
      riskAversionValue = 5.0; // Middle of the range
      break;
    case "Growth-Oriented":
      riskAversionValue = 3.0; // Increased from 2.5 for better separation from Aggressive
      break;
    case "Aggressive":
      riskAversionValue = 1.5; // Lower bound of original range
      break;
    default:
      riskAversionValue = appState.riskAversion; // Fallback to original
  }

  // Add constraints based on risk profile
  if (appState.riskProfile === "Very Conservative") {
    // For very conservative, use heavy fixed income allocation
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.2 - equityExposure; // Equity <= 20%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return fixedIncomeExposure - 0.7; // Fixed Income >= 70%
      },
    });
  } else if (appState.riskProfile === "Conservative") {
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.4 - equityExposure; // Equity <= 40%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return fixedIncomeExposure - 0.5; // Fixed Income >= 50%
      },
    });
  } else if (appState.riskProfile === "Moderate") {
    // Ensure balanced allocation for moderate profiles
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.4; // Equity <= 40%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.6 - equityExposure; // Equity <= 60%
      },
    });
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return fixedIncomeExposure - 0.3; // Fixed Income >= 30%
      },
    });
  } else if (appState.riskProfile === "Growth-Oriented") {
    // For Growth-Oriented, require substantial but moderate equity (65-75%)
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.65; // Equity >= 65%
      },
    });

    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return 0.75 - equityExposure; // Equity <= 75%
      },
    });

    // Also require more fixed income (15-25%) than Aggressive
    if (fixedIncomeFundIndices.length > 0) {
      customConstraints.push({
        type: "ineq",
        fun: function (weights) {
          const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
            (sum, idx) => sum + weights[idx],
            0
          );
          return fixedIncomeExposure - 0.15; // Fixed Income >= 15%
        },
      });

      customConstraints.push({
        type: "ineq",
        fun: function (weights) {
          const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
            (sum, idx) => sum + weights[idx],
            0
          );
          return 0.25 - fixedIncomeExposure; // Fixed Income <= 25%
        },
      });
    }
  } else if (appState.riskProfile === "Aggressive") {
    // For Aggressive profiles, require MORE equity exposure (at least 80%)
    customConstraints.push({
      type: "ineq",
      fun: function (weights) {
        const equityExposure = equityFundIndices.reduce(
          (sum, idx) => sum + weights[idx],
          0
        );
        return equityExposure - 0.8; // Equity >= 80%
      },
    });

    // Also limit fixed income to max 10%
    if (fixedIncomeFundIndices.length > 0) {
      customConstraints.push({
        type: "ineq",
        fun: function (weights) {
          const fixedIncomeExposure = fixedIncomeFundIndices.reduce(
            (sum, idx) => sum + weights[idx],
            0
          );
          return 0.1 - fixedIncomeExposure; // Fixed Income <= 10%
        },
      });
    }
  }

  // For extreme profiles, consider direct target return approach
  let customTargetReturn;

  // For Very Conservative, directly target lower return/risk point
  if (
    appState.riskProfile === "Very Conservative" &&
    customTargetReturn === undefined
  ) {
    // Find min variance portfolio
    const minVolWeights = minimizeVolatility(meanReturns, covarianceMatrix);
    const minVolReturn = calculatePortfolioReturn(meanReturns, minVolWeights);

    // Target 110% of min variance return to keep it conservative but not extreme
    customTargetReturn = minVolReturn * 1.1;
  }

  // For Aggressive, directly target a higher return than otherwise calculated
  else if (
    appState.riskProfile === "Aggressive" &&
    customTargetReturn === undefined
  ) {
    // Find max Sharpe ratio portfolio
    const maxSharpeWeights = maximizeSharpeRatio(meanReturns, covarianceMatrix);
    const maxSharpeReturn = calculatePortfolioReturn(
      meanReturns,
      maxSharpeWeights
    );

    // Target slightly higher than max Sharpe for more aggressive stance
    customTargetReturn = maxSharpeReturn * 1.1;
  }

  // Use either custom target return or standard optimization
  let optimalWeights;
  if (customTargetReturn !== undefined) {
    try {
      optimalWeights = minimizeVolatilityForTargetReturn(
        meanReturns,
        covarianceMatrix,
        customTargetReturn,
        customConstraints
      );
    } catch (e) {
      console.warn(
        "Error with custom target return optimization, falling back to standard method",
        e
      );
      optimalWeights = optimizePortfolio(
        meanReturns,
        covarianceMatrix,
        riskAversionValue,
        customConstraints
      );
    }
  } else {
    optimalWeights = optimizePortfolio(
      meanReturns,
      covarianceMatrix,
      riskAversionValue,
      customConstraints
    );
  }

  // Check if optimization succeeded (not all NaN or very small values)
  const isValidOptimization = !optimalWeights.every(
    (w) => isNaN(w) || Math.abs(w) < 1e-6
  );

  if (!isValidOptimization) {
    console.warn(
      "Optimization failed to produce valid weights. Using special allocation."
    );
    applySpecialConservativeAllocation();
    return;
  }

  // Calculate portfolio statistics
  const portfolioReturn = calculatePortfolioReturn(meanReturns, optimalWeights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    optimalWeights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility; // Assuming 3% risk-free rate

  // Filter for significant allocations (> 1%)
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < numAssets; i++) {
    if (optimalWeights[i] > 0.01) {
      significantAllocations[fundNames[i]] = optimalWeights[i];
      totalSignificant += optimalWeights[i];
    }
  }

  // Normalize significant allocations
  for (const fund in significantAllocations) {
    significantAllocations[fund] =
      significantAllocations[fund] / totalSignificant;
  }

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: optimalWeights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: Object.entries(significantAllocations).map(
      ([fund, weight]) => ({ fund, weight })
    ),
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
  };

  // Validate the portfolio
  validateOptimalPortfolio();

  // Update UI
  updatePortfolioUI();
}
*/

/* Last best working: part
// Add this validation function to app.js
function validateOptimalPortfolio() {
  // Check if portfolio makes sense for the risk profile
  const equityExposure = appState.optimalPortfolio.recommendedAllocation.reduce(
    (sum, item) => {
      return (
        sum +
        (fundData[item.fund].assetClass.includes("Equity") ? item.weight : 0)
      );
    },
    0
  );

  const fixedIncomeExposure =
    appState.optimalPortfolio.recommendedAllocation.reduce((sum, item) => {
      return (
        sum +
        (fundData[item.fund].assetClass.includes("Fixed Income")
          ? item.weight
          : 0)
      );
    }, 0);

  console.log(
    `Portfolio validation - Risk profile: ${appState.riskProfile}, Equity: ${(
      equityExposure * 100
    ).toFixed(2)}%, Fixed Income: ${(fixedIncomeExposure * 100).toFixed(2)}%`
  );

  let isValid = true;
  let warning = "";

  // Check if allocation aligns with risk profile
  if (appState.riskProfile === "Very Conservative" && equityExposure > 0.25) {
    isValid = false;
    warning = "Very Conservative portfolio has too much equity exposure";
  } else if (appState.riskProfile === "Conservative" && equityExposure > 0.45) {
    isValid = false;
    warning = "Conservative portfolio has too much equity exposure";
  } else if (appState.riskProfile === "Aggressive" && equityExposure < 0.6) {
    isValid = false;
    warning = "Aggressive portfolio has insufficient equity exposure";
  }

  if (!isValid) {
    console.warn(warning);
    // Apply fallback allocations
    applySpecialConservativeAllocation();
  }

  return isValid;
}

// Add this special allocation function to app.js
function applySpecialConservativeAllocation() {
  const fundNames = Object.keys(fundData);

  // Find the fixed income fund(s)
  const fixedIncomeFunds = fundNames.filter((fund) =>
    fundData[fund].assetClass.includes("Fixed Income")
  );

  // Find alternative investments
  const alternativeFunds = fundNames.filter((fund) =>
    fundData[fund].assetClass.includes("Alternative")
  );

  // Find the lowest volatility equity funds
  const equityFunds = fundNames
    .filter((fund) => fundData[fund].assetClass.includes("Equity"))
    .sort(
      (a, b) =>
        fundData[a].annualizedVolatility - fundData[b].annualizedVolatility
    );

  // Sort all funds by volatility
  const allFundsByVolatility = [...fundNames].sort(
    (a, b) =>
      fundData[a].annualizedVolatility - fundData[b].annualizedVolatility
  );

  // Sort all funds by Sharpe ratio
  const allFundsBySharpe = [...fundNames].sort(
    (a, b) => fundData[b].sharpeRatio - fundData[a].sharpeRatio
  );

  let allocation = [];

  if (appState.riskProfile === "Very Conservative") {
    // Use as much fixed income as available
    if (fixedIncomeFunds.length > 0) {
      allocation.push({
        fund: fixedIncomeFunds[0],
        weight: 0.7, // 70% to fixed income
      });

      // Add some alternative if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1, // 10% to alternatives
        });

        // Remaining 20% to lowest volatility equity funds
        allocation.push({
          fund: equityFunds[0],
          weight: 0.1,
        });
        if (equityFunds.length > 1) {
          allocation.push({
            fund: equityFunds[1],
            weight: 0.1,
          });
        } else {
          // Increase weight of first equity fund if only one available
          allocation[allocation.length - 1].weight += 0.1;
        }
      } else {
        // No alternatives, split 30% among lowest volatility equity
        if (equityFunds.length >= 3) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.1,
          });
          allocation.push({
            fund: equityFunds[1],
            weight: 0.1,
          });
          allocation.push({
            fund: equityFunds[2],
            weight: 0.1,
          });
        } else if (equityFunds.length == 2) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.15,
          });
          allocation.push({
            fund: equityFunds[1],
            weight: 0.15,
          });
        } else if (equityFunds.length == 1) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.3,
          });
        }
      }
    } else {
      // No fixed income available at all - use lowest volatility options
      // at least 80% in the 3 lowest volatility assets
      allocation.push({
        fund: allFundsByVolatility[0],
        weight: 0.5,
      });

      allocation.push({
        fund: allFundsByVolatility[1],
        weight: 0.3,
      });

      // Remaining 20% split between alternatives and another equity
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1,
        });

        if (allFundsByVolatility.length > 2) {
          allocation.push({
            fund: allFundsByVolatility[2],
            weight: 0.1,
          });
        } else {
          // Add more to existing funds
          allocation[0].weight += 0.05;
          allocation[1].weight += 0.05;
        }
      } else {
        // No alternatives either
        if (allFundsByVolatility.length > 2) {
          allocation.push({
            fund: allFundsByVolatility[2],
            weight: 0.2,
          });
        } else {
          // Add more to existing funds
          allocation[0].weight += 0.1;
          allocation[1].weight += 0.1;
        }
      }
    }
  } else if (appState.riskProfile === "Conservative") {
    // Conservative profile logic
    // Use fixed income if available
    if (fixedIncomeFunds.length > 0) {
      allocation.push({
        fund: fixedIncomeFunds[0],
        weight: 0.5, // 50% to fixed income
      });

      // Add some alternative if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1, // 10% to alternatives
        });

        // Remaining 40% to equity funds, favoring lower volatility
        if (equityFunds.length >= 4) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.1,
          });
          allocation.push({
            fund: equityFunds[1],
            weight: 0.1,
          });
          allocation.push({
            fund: equityFunds[2],
            weight: 0.1,
          });
          allocation.push({
            fund: equityFunds[3],
            weight: 0.1,
          });
        } else if (equityFunds.length == 3) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.14,
          });
          allocation.push({
            fund: equityFunds[1],
            weight: 0.13,
          });
          allocation.push({
            fund: equityFunds[2],
            weight: 0.13,
          });
        } else if (equityFunds.length == 2) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.2,
          });
          allocation.push({
            fund: equityFunds[1],
            weight: 0.2,
          });
        } else if (equityFunds.length == 1) {
          allocation.push({
            fund: equityFunds[0],
            weight: 0.4,
          });
        }
      } else {
        // No alternatives, split 50% among equity
        if (equityFunds.length >= 5) {
          for (let i = 0; i < 5; i++) {
            allocation.push({
              fund: equityFunds[i],
              weight: 0.1,
            });
          }
        } else if (equityFunds.length > 0) {
          const equityWeight = 0.5 / equityFunds.length;
          for (let i = 0; i < equityFunds.length; i++) {
            allocation.push({
              fund: equityFunds[i],
              weight: equityWeight,
            });
          }
        }
      }
    } else {
      // No fixed income - use lowest volatility options and more diversification
      if (allFundsByVolatility.length >= 3) {
        allocation.push({
          fund: allFundsByVolatility[0],
          weight: 0.4,
        });

        allocation.push({
          fund: allFundsByVolatility[1],
          weight: 0.3,
        });

        allocation.push({
          fund: allFundsByVolatility[2],
          weight: 0.1,
        });
      }

      // Add some alternatives if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1,
        });
      }

      // Add higher Sharpe ratio funds for remaining allocation
      if (allFundsBySharpe.length > 0) {
        // Find a high Sharpe fund not already in the allocation
        const existingFunds = allocation.map((item) => item.fund);
        const remainingFunds = allFundsBySharpe.filter(
          (fund) => !existingFunds.includes(fund)
        );

        if (remainingFunds.length > 0) {
          allocation.push({
            fund: remainingFunds[0],
            weight: 0.1,
          });
        } else {
          // If all funds already used, add more to top two funds
          allocation[0].weight += 0.05;
          allocation[1].weight += 0.05;
        }
      } else {
        // If no more funds available, add to existing allocations
        allocation[0].weight += 0.1;
      }
    }
  } else if (appState.riskProfile === "Moderate") {
    // Moderate profile - more balanced approach
    // Start with some fixed income if available
    if (fixedIncomeFunds.length > 0) {
      allocation.push({
        fund: fixedIncomeFunds[0],
        weight: 0.3, // 30% to fixed income
      });

      let remainingWeight = 0.7;

      // Add some alternative if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1, // 10% to alternatives
        });
        remainingWeight -= 0.1;
      }

      // Distribute remaining to equity, mixing low volatility and high Sharpe
      // Get top equities by Sharpe
      const topEquityBySharpe = equityFunds
        .sort((a, b) => fundData[b].sharpeRatio - fundData[a].sharpeRatio)
        .slice(0, 4);

      if (topEquityBySharpe.length >= 4) {
        const equityWeight = remainingWeight / 4;
        for (let i = 0; i < 4; i++) {
          allocation.push({
            fund: topEquityBySharpe[i],
            weight: equityWeight,
          });
        }
      } else {
        const equityWeight = remainingWeight / topEquityBySharpe.length;
        for (let i = 0; i < topEquityBySharpe.length; i++) {
          allocation.push({
            fund: topEquityBySharpe[i],
            weight: equityWeight,
          });
        }
      }
    } else {
      // No fixed income - create balanced allocation using volatility and return
      // 40% to low volatility funds
      if (allFundsByVolatility.length >= 2) {
        allocation.push({
          fund: allFundsByVolatility[0],
          weight: 0.25,
        });

        allocation.push({
          fund: allFundsByVolatility[1],
          weight: 0.15,
        });
      }

      // 10% to alternatives if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1,
        });
      }

      // Remaining 50% to high Sharpe ratio funds
      let remainingWeight = alternativeFunds.length > 0 ? 0.5 : 0.6;

      if (allFundsBySharpe.length >= 3) {
        // Make sure we don't duplicate funds
        const existingFunds = allocation.map((item) => item.fund);
        const remainingFunds = allFundsBySharpe
          .filter((fund) => !existingFunds.includes(fund))
          .slice(0, 3);

        if (remainingFunds.length > 0) {
          const sharpeWeight = remainingWeight / remainingFunds.length;
          for (let i = 0; i < remainingFunds.length; i++) {
            allocation.push({
              fund: remainingFunds[i],
              weight: sharpeWeight,
            });
          }
        } else {
          // If all funds already used, distribute among existing
          const additionalWeight = remainingWeight / allocation.length;
          for (let i = 0; i < allocation.length; i++) {
            allocation[i].weight += additionalWeight;
          }
        }
      } else {
        // If not enough funds, add to existing allocations
        const additionalWeight = remainingWeight / allocation.length;
        for (let i = 0; i < allocation.length; i++) {
          allocation[i].weight += additionalWeight;
        }
      }
    }
  } else if (appState.riskProfile === "Growth-Oriented") {
    // Growth-Oriented profile - equity focused with some stability
    // Start with some fixed income if available (20%)
    if (fixedIncomeFunds.length > 0) {
      allocation.push({
        fund: fixedIncomeFunds[0],
        weight: 0.2, // 20% to fixed income
      });

      let remainingWeight = 0.8;

      // Add some alternative if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1, // 10% to alternatives
        });
        remainingWeight -= 0.1;
      }

      // Distribute remaining to equity, focusing on growth
      // Get top equities by return
      const topEquityByReturn = equityFunds
        .sort(
          (a, b) => fundData[b].annualizedReturn - fundData[a].annualizedReturn
        )
        .slice(0, 5);

      if (topEquityByReturn.length >= 5) {
        const equityWeight = remainingWeight / 5;
        for (let i = 0; i < 5; i++) {
          allocation.push({
            fund: topEquityByReturn[i],
            weight: equityWeight,
          });
        }
      } else {
        const equityWeight = remainingWeight / topEquityByReturn.length;
        for (let i = 0; i < topEquityByReturn.length; i++) {
          allocation.push({
            fund: topEquityByReturn[i],
            weight: equityWeight,
          });
        }
      }
    } else {
      // No fixed income - allocate primarily to growth-oriented equity
      // 70% to high return funds
      const topReturnFunds = allFundsByVolatility
        .sort(
          (a, b) => fundData[b].annualizedReturn - fundData[a].annualizedReturn
        )
        .slice(0, 4);

      if (topReturnFunds.length >= 4) {
        let returnWeight = 0.7 / 4;
        for (let i = 0; i < 4; i++) {
          allocation.push({
            fund: topReturnFunds[i],
            weight: returnWeight,
          });
        }
      } else {
        let returnWeight = 0.7 / topReturnFunds.length;
        for (let i = 0; i < topReturnFunds.length; i++) {
          allocation.push({
            fund: topReturnFunds[i],
            weight: returnWeight,
          });
        }
      }

      // 10% to alternatives if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1,
        });
      }

      // Remaining 20% to high Sharpe ratio funds
      let remainingWeight = alternativeFunds.length > 0 ? 0.2 : 0.3;

      // Find high Sharpe funds not already in the allocation
      const existingFunds = allocation.map((item) => item.fund);
      const remainingFundsBySharpe = allFundsBySharpe
        .filter((fund) => !existingFunds.includes(fund))
        .slice(0, 2);

      if (remainingFundsBySharpe.length > 0) {
        const sharpeWeight = remainingWeight / remainingFundsBySharpe.length;
        for (let i = 0; i < remainingFundsBySharpe.length; i++) {
          allocation.push({
            fund: remainingFundsBySharpe[i],
            weight: sharpeWeight,
          });
        }
      } else {
        // If all funds already used, distribute among existing
        const additionalWeight = remainingWeight / allocation.length;
        for (let i = 0; i < allocation.length; i++) {
          allocation[i].weight += additionalWeight;
        }
      }
    }
  } else if (appState.riskProfile === "Aggressive") {
    // Aggressive profile - maximum growth focus
    // Small fixed income portion if available (10%)
    if (fixedIncomeFunds.length > 0) {
      allocation.push({
        fund: fixedIncomeFunds[0],
        weight: 0.1, // 10% to fixed income
      });

      let remainingWeight = 0.9;

      // Small alternative allocation if available
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.05, // 5% to alternatives
        });
        remainingWeight -= 0.05;
      }

      // Distribute remaining to aggressive growth equity
      // Get top equities by return, slightly more concentrated
      const topEquityByReturn = equityFunds
        .sort(
          (a, b) => fundData[b].annualizedReturn - fundData[a].annualizedReturn
        )
        .slice(0, 4);

      if (topEquityByReturn.length >= 4) {
        // Concentrate more in top performers
        allocation.push({
          fund: topEquityByReturn[0],
          weight: remainingWeight * 0.35,
        });

        allocation.push({
          fund: topEquityByReturn[1],
          weight: remainingWeight * 0.3,
        });

        allocation.push({
          fund: topEquityByReturn[2],
          weight: remainingWeight * 0.2,
        });

        allocation.push({
          fund: topEquityByReturn[3],
          weight: remainingWeight * 0.15,
        });
      } else {
        // Distribute evenly if not enough funds
        const equityWeight = remainingWeight / topEquityByReturn.length;
        for (let i = 0; i < topEquityByReturn.length; i++) {
          allocation.push({
            fund: topEquityByReturn[i],
            weight: equityWeight,
          });
        }
      }
    } else {
      // No fixed income - focus entirely on aggressive growth
      // 85% to high return funds
      const topReturnFunds = [...fundNames]
        .sort(
          (a, b) => fundData[b].annualizedReturn - fundData[a].annualizedReturn
        )
        .slice(0, 4);

      if (topReturnFunds.length >= 4) {
        // Concentrate more in top performers
        allocation.push({
          fund: topReturnFunds[0],
          weight: 0.3,
        });

        allocation.push({
          fund: topReturnFunds[1],
          weight: 0.25,
        });

        allocation.push({
          fund: topReturnFunds[2],
          weight: 0.2,
        });

        allocation.push({
          fund: topReturnFunds[3],
          weight: 0.15,
        });
      } else {
        // Distribute proportionally if not enough funds
        const weights = [0.5, 0.3, 0.2]; // Default weights for 1-3 funds
        for (let i = 0; i < topReturnFunds.length; i++) {
          allocation.push({
            fund: topReturnFunds[i],
            weight: weights[i] || weights[weights.length - 1],
          });
        }
      }

      // 10% to alternatives if available, otherwise add to top performer
      if (alternativeFunds.length > 0) {
        allocation.push({
          fund: alternativeFunds[0],
          weight: 0.1,
        });
      } else if (allocation.length > 0) {
        allocation[0].weight += 0.1;
      }
    }
  }

  // Calculate portfolio statistics
  const weights = Array(fundNames.length).fill(0);
  allocation.forEach((item) => {
    const index = fundNames.indexOf(item.fund);
    weights[index] = item.weight;
  });

  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const portfolioReturn = calculatePortfolioReturn(meanReturns, weights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    weights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  // Update application state
  appState.optimalPortfolio = {
    fullAllocation: weights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: allocation,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
    isSpecialAllocation: true,
  };

  // Update UI
  updatePortfolioUI();
}

// Add this fallback function to app.js
function applyFallbackAllocation() {
  const fundNames = Object.keys(fundData);

  // Create template allocations by risk profile
  const templates = {
    "Very Conservative": {
      Equity: 0.15,
      "Fixed Income": 0.75,
      Alternative: 0.1,
    },
    Conservative: {
      Equity: 0.35,
      "Fixed Income": 0.55,
      Alternative: 0.1,
    },
    Moderate: {
      Equity: 0.5,
      "Fixed Income": 0.4,
      Alternative: 0.1,
    },
    "Growth-Oriented": {
      Equity: 0.7,
      "Fixed Income": 0.2,
      Alternative: 0.1,
    },
    Aggressive: {
      Equity: 0.85,
      "Fixed Income": 0.1,
      Alternative: 0.05,
    },
  };

  // Get template for current risk profile
  const template = templates[appState.riskProfile];

  // Group funds by asset class
  const fundsByClass = {
    Equity: [],
    "Fixed Income": [],
    Alternative: [],
    Other: [],
  };

  // Sort funds into asset classes
  fundNames.forEach((fundName) => {
    const fund = fundData[fundName];
    if (fund.assetClass.includes("Equity")) {
      fundsByClass["Equity"].push(fundName);
    } else if (fund.assetClass.includes("Fixed Income")) {
      fundsByClass["Fixed Income"].push(fundName);
    } else if (fund.assetClass.includes("Alternative")) {
      fundsByClass["Alternative"].push(fundName);
    } else {
      fundsByClass["Other"].push(fundName);
    }
  });

  // Sort each asset class by Sharpe ratio
  Object.keys(fundsByClass).forEach((assetClass) => {
    fundsByClass[assetClass].sort(
      (a, b) => fundData[b].sharpeRatio - fundData[a].sharpeRatio
    );
  });

  // Create allocation with top funds in each asset class
  const recommendedAllocation = [];

  Object.keys(template).forEach((assetClass) => {
    if (fundsByClass[assetClass].length > 0) {
      // Get top 2 funds in asset class (or fewer if not available)
      const topFunds = fundsByClass[assetClass].slice(
        0,
        Math.min(2, fundsByClass[assetClass].length)
      );

      // Allocate the asset class weight among the top funds
      const weightPerFund = template[assetClass] / topFunds.length;

      topFunds.forEach((fund) => {
        recommendedAllocation.push({
          fund: fund,
          weight: weightPerFund,
        });
      });
    }
  });

  // Calculate portfolio statistics for this allocation
  const weights = Array(fundNames.length).fill(0);
  recommendedAllocation.forEach((item) => {
    const index = fundNames.indexOf(item.fund);
    weights[index] = item.weight;
  });

  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const portfolioReturn = calculatePortfolioReturn(meanReturns, weights);
  const portfolioVolatility = calculatePortfolioVolatility(
    covarianceMatrix,
    weights
  );
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  // Update application state with fallback portfolio
  appState.optimalPortfolio = {
    fullAllocation: weights.map((weight, i) => ({
      fund: fundNames[i],
      weight,
    })),
    recommendedAllocation: recommendedAllocation,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: portfolioSharpeRatio,
    },
    isFallback: true, // Flag to indicate this is a fallback allocation
  };

  console.log(
    "Applied fallback allocation for " + appState.riskProfile + " risk profile"
  );
}

*/
// Update portfolio UI
function updatePortfolioUI() {
  // Update portfolio information
  document.getElementById("portfolio-risk-profile").textContent =
    appState.riskProfile;
  document.getElementById("portfolio-return").textContent = `${(
    appState.optimalPortfolio.stats.return * 100
  ).toFixed(2)}%`;
  document.getElementById("portfolio-risk").textContent = `${(
    appState.optimalPortfolio.stats.volatility * 100
  ).toFixed(2)}%`;
  document.getElementById("portfolio-sharpe").textContent =
    appState.optimalPortfolio.stats.sharpeRatio.toFixed(2);

  // Update portfolio allocation chart
  createPortfolioAllocationChart();

  // Update allocation table
  updateAllocationTable();

  // Create efficient frontier chart
  createEfficientFrontierChart();

  // Create projection chart
  createProjectionChart(appState.currentScenario);

  // Update investment recommendation
  const investmentRecommendation = document.getElementById(
    "investment-recommendation"
  );
  investmentRecommendation.innerHTML = `
        <p class="mb-3">Based on your <strong>${
          appState.riskProfile
        }</strong> risk profile and investment goals, we recommend the following optimized portfolio allocation:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            ${appState.optimalPortfolio.recommendedAllocation
              .map(
                (item) => `
                    <div class="bg-white p-2 rounded border border-gray-200">
                        <div class="font-semibold">${item.fund}</div>
                        <div class="text-blue-600 font-bold">${(
                          item.weight * 100
                        ).toFixed(2)}%</div>
                    </div>
                `
              )
              .join("")}
        </div>
        <p class="mb-3">This portfolio is optimized to provide the best expected return for your level of risk tolerance, with an expected annual return of ${(
          appState.optimalPortfolio.stats.return * 100
        ).toFixed(2)}% and volatility of ${(
    appState.optimalPortfolio.stats.volatility * 100
  ).toFixed(2)}%.</p>
        <p>For best results, we recommend rebalancing this portfolio annually to maintain the target allocation. As your financial situation or goals change, you should reassess your risk profile and adjust your portfolio accordingly.</p>
    `;
}

// Update allocation table
function updateAllocationTable() {
  const allocationTable = document.getElementById("allocation-table");

  // Sort allocations by weight
  const sortedAllocations = [
    ...appState.optimalPortfolio.recommendedAllocation,
  ].sort((a, b) => b.weight - a.weight);

  let tableHTML = `
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-gray-300">
                    <th class="text-left py-2">Fund</th>
                    <th class="text-right py-2">Allocation</th>
                </tr>
            </thead>
            <tbody>
    `;

  // Add rows for each fund (without expense ratio)
  sortedAllocations.forEach((item) => {
    const fund = fundData[item.fund];
    const assetClass = fund.assetClass;

    // Determine color based on asset class
    let colorClass = "";
    if (assetClass.includes("Equity")) colorClass = "text-blue-600";
    else if (assetClass.includes("Fixed Income")) colorClass = "text-green-600";
    else if (assetClass.includes("Alternative")) colorClass = "text-yellow-600";

    tableHTML += `
            <tr class="border-b border-gray-200">
                <td class="py-2">
                    <div>${item.fund}</div>
                    <div class="text-xs text-gray-500">${assetClass}</div>
                </td>
                <td class="py-2 text-right">
                    <div class="font-bold ${colorClass}">${(
      item.weight * 100
    ).toFixed(2)}%</div>
                </td>
            </tr>
        `;
  });

  // No weighted expense ratio calculation or display
  tableHTML += `
            </tbody>
            <tfoot>
                <tr class="bg-gray-50">
                    <td class="py-2 font-semibold">Total</td>
                    <td class="py-2 text-right font-bold">100.00%</td>
                </tr>
            </tfoot>
        </table>
    `;

  allocationTable.innerHTML = tableHTML;
}

// Change the projection scenario
function changeScenario(scenario) {
  // Update scenario buttons
  document.querySelectorAll(".scenario-btn").forEach((btn) => {
    if (btn.dataset.scenario === scenario) {
      btn.classList.add("bg-blue-600", "text-white");
      btn.classList.remove("bg-gray-300", "text-gray-800");
    } else {
      btn.classList.remove("bg-blue-600", "text-white");
      btn.classList.add("bg-gray-300", "text-gray-800");
    }
  });

  // Update state
  appState.currentScenario = scenario;

  // Update projection chart
  createProjectionChart(scenario);
}

// Save investment goals from form
function saveGoals() {
  // Get values from form
  const goalType = document.getElementById("goal-type").value;
  const goalAmount =
    parseInt(document.getElementById("goal-amount").value) || 100000;
  const timeHorizon =
    parseInt(document.getElementById("goal-time-horizon").value) || 10;
  const initialInvestment =
    parseInt(document.getElementById("goal-initial").value) || 10000;
  const monthlyContribution =
    parseInt(document.getElementById("goal-monthly").value) || 500;

  // Update state
  appState.investmentGoals = {
    type: goalType,
    amount: goalAmount,
    timeHorizon: timeHorizon,
    initialInvestment: initialInvestment,
    monthlyContribution: monthlyContribution,
  };

  // If portfolio has been calculated, update projection
  if (appState.optimalPortfolio) {
    createProjectionChart(appState.currentScenario);
  }
}

// Handle download report
function handleDownloadReport() {
  // First, capture the portfolio allocation chart as an image
  html2canvas(document.getElementById("portfolio-allocation-chart")).then(
    (canvas) => {
      // Convert the chart to a data URL
      const chartImageData = canvas.toDataURL("image/png");

      // Use jsPDF to create a PDF report
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102); // Set title color to match dashboard
      doc.text("Portfolio Optimization Report", 105, 15, { align: "center" });

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, {
        align: "center",
      });

      // Add risk profile header
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("Risk Profile", 14, 35);

      // Add risk profile section with matching styles
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Profile: ${appState.riskProfile}`, 14, 45);
      doc.text(`Risk Aversion Parameter: ${appState.riskAversion}`, 14, 52);
      doc.text(`Time Horizon: ${appState.timeHorizon}`, 14, 59);
      doc.text(`Investment Knowledge: ${appState.knowledgeLevel}`, 14, 66);

      // Add portfolio statistics with matching colors
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("Portfolio Statistics", 14, 80);

      doc.setFontSize(12);
      doc.setTextColor(0);

      // Expected annual return (green color)
      doc.text(`Expected Annual Return:`, 14, 90);
      doc.setTextColor(34, 139, 34); // Green color for returns
      doc.text(
        `${(appState.optimalPortfolio.stats.return * 100).toFixed(2)}%`,
        80,
        90
      );

      // Expected annual volatility (red color)
      doc.setTextColor(0);
      doc.text(`Expected Annual Volatility:`, 14, 97);
      doc.setTextColor(220, 20, 60); // Red color for risk
      doc.text(
        `${(appState.optimalPortfolio.stats.volatility * 100).toFixed(2)}%`,
        80,
        97
      );

      // Sharpe ratio (blue color)
      doc.setTextColor(0);
      doc.text(`Sharpe Ratio:`, 14, 104);
      doc.setTextColor(30, 144, 255); // Blue color for Sharpe
      doc.text(
        `${appState.optimalPortfolio.stats.sharpeRatio.toFixed(2)}`,
        80,
        104
      );

      // Reset text color
      doc.setTextColor(0);

      // Add portfolio allocation chart
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("Portfolio Allocation", 14, 118);

      // Add the chart image
      doc.addImage(chartImageData, "PNG", 15, 125, 180, 90);

      // Add recommended allocation section
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("Recommended Portfolio Allocation", 14, 225);

      // Create a table for the allocations
      doc.setFontSize(11);
      doc.setTextColor(0);

      // Table headers
      doc.setFont(undefined, "bold");
      doc.text("Fund", 14, 235);
      doc.text("Asset Class", 100, 235);
      doc.text("Allocation", 170, 235);
      doc.setFont(undefined, "normal");

      // Draw header line
      doc.setDrawColor(200);
      doc.line(14, 237, 196, 237);

      // Add fund allocations as a table
      let y = 243;
      appState.optimalPortfolio.recommendedAllocation.forEach((item) => {
        const assetClass = fundData[item.fund].assetClass;

        // Truncate long fund names to fit the page
        let displayName = item.fund;
        if (displayName.length > 40) {
          displayName = displayName.substring(0, 37) + "...";
        }

        doc.text(displayName, 14, y);
        doc.text(assetClass, 100, y);
        doc.text(`${(item.weight * 100).toFixed(2)}%`, 170, y);

        y += 7;

        // If we're about to run off the page, start a new page
        if (y > 270) {
          doc.addPage();
          y = 20;

          // Add continuation headers
          doc.setFont(undefined, "bold");
          doc.text("Fund", 14, y);
          doc.text("Asset Class", 100, y);
          doc.text("Allocation", 170, y);
          doc.setFont(undefined, "normal");

          // Draw header line
          doc.line(14, y + 2, 196, y + 2);

          y += 8;
        }
      });

      // Add total row
      doc.setFont(undefined, "bold");
      doc.line(14, y, 196, y);
      y += 5;
      doc.text("Total", 14, y);
      doc.text("100.00%", 170, y);
      doc.setFont(undefined, "normal");

      // Add investment goals section if not on a new page already
      if (y > 240) {
        doc.addPage();
        y = 20;
      } else {
        y += 15;
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("Investment Goals", 14, y);
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Goal Type: ${appState.investmentGoals.type}`, 14, y);
      y += 7;
      doc.text(
        `Target Amount: $${appState.investmentGoals.amount.toLocaleString()}`,
        14,
        y
      );
      y += 7;
      doc.text(
        `Time Horizon: ${appState.investmentGoals.timeHorizon} years`,
        14,
        y
      );
      y += 7;
      doc.text(
        `Initial Investment: $${appState.investmentGoals.initialInvestment.toLocaleString()}`,
        14,
        y
      );
      y += 7;
      doc.text(
        `Monthly Contribution: $${appState.investmentGoals.monthlyContribution.toLocaleString()}`,
        14,
        y
      );

      // Add disclaimer
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        "DISCLAIMER: This report is for educational purposes only. Past performance is not indicative of future results.",
        14,
        y
      );
      y += 5;
      doc.text(
        "All investments involve risk and may result in loss of principal. Consult with a qualified financial advisor before making investment decisions.",
        14,
        y
      );

      // Save the PDF
      doc.save(
        `portfolio_report_${appState.riskProfile
          .toLowerCase()
          .replace(/\s+/g, "_")}.pdf`
      );
    }
  );
}
