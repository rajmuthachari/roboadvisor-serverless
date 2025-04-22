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
        //calculateOptimalPortfolio();
        calculateEnhancedOptimalPortfolio();
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
    else if (fund.assetClass.includes("Real Estate")) bgColor = "bg-yellow-50";

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

// Calculate optimal portfolio based on risk aversion
function calculateOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  const { weights } = enhancedOptimization.optimizePortfolio(
    meanReturns,
    covarianceMatrix,
    appState.riskAversion
  );
  const optimalWeights = weights;

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

/**
 * Enhanced Portfolio Optimization Functions
 * Incorporates time horizon and goal type considerations
 */

// Adjust risk aversion based on time horizon
function adjustRiskAversionForTimeHorizon(baseRiskAversion, timeHorizonLabel) {
  // Convert time horizon label to numeric years
  let timeHorizonYears;
  switch (timeHorizonLabel) {
    case "< 3 years":
      timeHorizonYears = 2;
      break;
    case "3-5 years":
      timeHorizonYears = 4;
      break;
    case "6-10 years":
      timeHorizonYears = 8;
      break;
    case "11-20 years":
      timeHorizonYears = 15;
      break;
    case "> 20 years":
      timeHorizonYears = 25;
      break;
    default:
      timeHorizonYears = 10;
  }

  // Adjust risk aversion based on time horizon
  if (timeHorizonYears < 5) {
    // Shorter time horizons should be more conservative (higher risk aversion)
    return baseRiskAversion * (1 + (5 - timeHorizonYears) * 0.1);
  } else if (timeHorizonYears > 15) {
    // Longer time horizons can be more aggressive (lower risk aversion)
    return (
      baseRiskAversion * Math.max(0.85, 1 - (timeHorizonYears - 15) * 0.01)
    );
  }

  // No adjustment for medium time horizons
  return baseRiskAversion;
}

// Adjust risk aversion based on goal type
function adjustRiskAversionForGoalType(riskAversion, goalType) {
  switch (goalType) {
    case "retirement":
      // Retirement typically has longer time horizons, can be slightly more aggressive
      return riskAversion * 0.95;

    case "education":
      // Education has a fixed deadline, should be more conservative
      return riskAversion * 1.1;

    case "home_purchase":
      // Home purchase typically needs more stability and liquidity
      return riskAversion * 1.2;

    case "emergency_fund":
      // Emergency funds need high stability and liquidity
      return riskAversion * 1.5;

    default:
      return riskAversion;
  }
}

// Enhanced portfolio optimization with time horizon and goal considerations
function calculateEnhancedOptimalPortfolio() {
  const fundNames = Object.keys(fundData);
  const numAssets = fundNames.length;

  // Extract annualized returns
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Start with base risk aversion from risk profile
  let riskAversion = appState.riskAversion;
  console.log(`Base risk aversion: ${riskAversion}`);

  // Adjust for time horizon
  const timeHorizonAdjustedRiskAversion = adjustRiskAversionForTimeHorizon(
    riskAversion,
    appState.timeHorizon
  );
  console.log(
    `After time horizon adjustment: ${timeHorizonAdjustedRiskAversion}`
  );

  // Adjust for goal type
  const finalRiskAversion = adjustRiskAversionForGoalType(
    timeHorizonAdjustedRiskAversion,
    appState.investmentGoals.type
  );
  console.log(`After goal type adjustment: ${finalRiskAversion}`);

  // Calculate optimal portfolio using adjusted risk aversion
  const optimalWeights = optimizePortfolio(
    meanReturns,
    covarianceMatrix,
    finalRiskAversion
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
    adjustments: {
      baseRiskAversion: appState.riskAversion,
      timeHorizonAdjustedRiskAversion: timeHorizonAdjustedRiskAversion,
      finalRiskAversion: finalRiskAversion,
      timeHorizon: appState.timeHorizon,
      goalType: appState.investmentGoals.type,
    },
  };

  // Update UI
  updatePortfolioUI();
  updatePortfolioExplanation();
}

// Add a liquidity buffer for near-term goals
function addLiquidityBuffer(allocation, timeHorizonLabel, goalType) {
  // Only apply for short time horizons
  if (timeHorizonLabel === "< 3 years" || timeHorizonLabel === "3-5 years") {
    const adjustedAllocation = { ...allocation };
    const fundNames = Object.keys(allocation);

    // Identify liquid and non-liquid assets
    const liquidAssets = fundNames.filter(
      (fund) =>
        fundData[fund].assetClass.includes("Fixed Income") ||
        fundData[fund].assetClass.includes("Cash")
    );

    const nonLiquidAssets = fundNames.filter(
      (fund) => !liquidAssets.includes(fund)
    );

    // Calculate current liquid allocation
    let currentLiquidAllocation = 0;
    liquidAssets.forEach((fund) => {
      currentLiquidAllocation += allocation[fund] || 0;
    });

    // Determine target liquid allocation based on goal type and time horizon
    let targetLiquidAllocation = 0.3; // Default 30%

    if (goalType === "home_purchase") {
      targetLiquidAllocation = 0.5; // 50% for home purchase
    } else if (goalType === "education" && timeHorizonLabel === "< 3 years") {
      targetLiquidAllocation = 0.6; // 60% for imminent education needs
    } else if (goalType === "emergency_fund") {
      targetLiquidAllocation = 0.8; // 80% for emergency funds
    }

    // If we need to increase liquid allocation
    if (currentLiquidAllocation < targetLiquidAllocation) {
      const shortfall = targetLiquidAllocation - currentLiquidAllocation;

      // Reduce non-liquid assets proportionally
      let totalNonLiquid = 0;
      nonLiquidAssets.forEach((fund) => {
        totalNonLiquid += allocation[fund] || 0;
      });

      // Redistribute from non-liquid to liquid assets
      nonLiquidAssets.forEach((fund) => {
        if (allocation[fund]) {
          const reductionFactor = shortfall / totalNonLiquid;
          adjustedAllocation[fund] = allocation[fund] * (1 - reductionFactor);
        }
      });

      // Add to liquid assets proportionally
      if (liquidAssets.length > 0) {
        const addPerLiquid = shortfall / liquidAssets.length;
        liquidAssets.forEach((fund) => {
          adjustedAllocation[fund] = (allocation[fund] || 0) + addPerLiquid;
        });
      }
    }

    return adjustedAllocation;
  }

  // No adjustment needed for longer time horizons
  return allocation;
}

// Update portfolio explanation with time horizon and goal type considerations
function updatePortfolioExplanation() {
  const explanationEl = document.getElementById("investment-recommendation");
  if (!explanationEl) return;

  // Get the portfolio adjustments
  const adjustments = appState.optimalPortfolio.adjustments;

  // Determine if any adjustments were made
  const timeHorizonAdjusted =
    adjustments.timeHorizonAdjustedRiskAversion !==
    adjustments.baseRiskAversion;
  const goalTypeAdjusted =
    adjustments.finalRiskAversion !==
    adjustments.timeHorizonAdjustedRiskAversion;

  // Create explanation text
  let explanationHTML = `
    <p class="mb-3">Based on your <strong>${appState.riskProfile}</strong> risk profile and investment goals, we recommend the following optimized portfolio allocation:</p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
  `;

  // Add allocation cards
  appState.optimalPortfolio.recommendedAllocation.forEach((item) => {
    explanationHTML += `
      <div class="bg-white p-2 rounded border border-gray-200">
        <div class="font-semibold">${item.fund}</div>
        <div class="text-blue-600 font-bold">${(item.weight * 100).toFixed(
          2
        )}%</div>
      </div>
    `;
  });

  explanationHTML += `</div>`;

  // Add explanation of adjustments
  explanationHTML += `
    <p class="mb-3">This portfolio is optimized to provide the best expected return for your risk tolerance, with an expected annual return of ${(
      appState.optimalPortfolio.stats.return * 100
    ).toFixed(2)}% and volatility of ${(
    appState.optimalPortfolio.stats.volatility * 100
  ).toFixed(2)}%.</p>
  `;

  if (timeHorizonAdjusted || goalTypeAdjusted) {
    explanationHTML += `<div class="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
      <h4 class="font-semibold mb-2">Portfolio Customizations:</h4>
      <ul class="list-disc pl-5">
    `;

    if (timeHorizonAdjusted) {
      const direction =
        adjustments.timeHorizonAdjustedRiskAversion >
        adjustments.baseRiskAversion
          ? "more conservative"
          : "more aggressive";
      explanationHTML += `
        <li>Your time horizon of <strong>${adjustments.timeHorizon}</strong> has made your portfolio ${direction}.</li>
      `;
    }

    if (goalTypeAdjusted) {
      const direction =
        adjustments.finalRiskAversion >
        adjustments.timeHorizonAdjustedRiskAversion
          ? "more conservative"
          : "more aggressive";
      explanationHTML += `
        <li>Your goal type of <strong>${adjustments.goalType}</strong> has made your portfolio ${direction}.</li>
      `;
    }

    explanationHTML += `</ul></div>`;
  }

  // Add rebalancing recommendation
  explanationHTML += `
    <p>For best results, we recommend rebalancing this portfolio quarterly to maintain the target allocation. As your financial situation or goals change, you should reassess your risk profile and adjust your portfolio accordingly.</p>
  `;

  // If near-term goal, add liquidity recommendation
  if (
    adjustments.timeHorizon === "< 3 years" ||
    adjustments.timeHorizon === "3-5 years"
  ) {
    explanationHTML += `
      <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-3">
        <h4 class="font-semibold mb-2">Short-Term Goal Considerations:</h4>
        <p>Since your time horizon is relatively short (${adjustments.timeHorizon}), we've increased allocation to more liquid and stable assets. This helps protect your capital as you approach your goal date.</p>
      </div>
    `;
  }

  // Update the element
  explanationEl.innerHTML = explanationHTML;
}

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
    else if (assetClass.includes("Real Estate")) colorClass = "text-yellow-600";

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
  // Use jsPDF to create a PDF report
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text("Portfolio Optimization Report", 105, 15, { align: "center" });

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, {
    align: "center",
  });

  // Add risk profile section
  doc.setFontSize(16);
  doc.text("Risk Profile", 14, 35);

  doc.setFontSize(12);
  doc.text(`Profile: ${appState.riskProfile}`, 14, 45);
  doc.text(`Risk Aversion Parameter: ${appState.riskAversion}`, 14, 52);
  doc.text(`Time Horizon: ${appState.timeHorizon}`, 14, 59);
  doc.text(`Investment Knowledge: ${appState.knowledgeLevel}`, 14, 66);

  // Add recommended allocation section
  doc.setFontSize(16);
  doc.text("Recommended Portfolio Allocation", 14, 80);

  doc.setFontSize(12);
  let y = 90;

  appState.optimalPortfolio.recommendedAllocation.forEach((item) => {
    doc.text(`${item.fund}: ${(item.weight * 100).toFixed(2)}%`, 14, y);
    y += 7;
  });

  // Add portfolio statistics
  doc.setFontSize(16);
  doc.text("Portfolio Statistics", 14, y + 10);

  doc.setFontSize(12);
  y += 20;
  doc.text(
    `Expected Annual Return: ${(
      appState.optimalPortfolio.stats.return * 100
    ).toFixed(2)}%`,
    14,
    y
  );
  y += 7;
  doc.text(
    `Expected Annual Volatility: ${(
      appState.optimalPortfolio.stats.volatility * 100
    ).toFixed(2)}%`,
    14,
    y
  );
  y += 7;
  doc.text(
    `Sharpe Ratio: ${appState.optimalPortfolio.stats.sharpeRatio.toFixed(2)}`,
    14,
    y
  );

  // Add investment goals section
  doc.setFontSize(16);
  y += 17;
  doc.text("Investment Goals", 14, y);

  doc.setFontSize(12);
  y += 10;
  doc.text(`Goal Type: ${appState.investmentGoals.type}`, 14, y);
  y += 7;
  doc.text(
    `Target Amount: ${appState.investmentGoals.amount.toLocaleString()}`,
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
    `Initial Investment: ${appState.investmentGoals.initialInvestment.toLocaleString()}`,
    14,
    y
  );
  y += 7;
  doc.text(
    `Monthly Contribution: ${appState.investmentGoals.monthlyContribution.toLocaleString()}`,
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
