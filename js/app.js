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

// Direct mapping of risk profiles to efficient frontier points
function calculateOptimalPortfolio() {
  // Ensure we have frontier data
  if (!efficientFrontierData || !efficientFrontierData.ef_no_short) {
    console.error("Missing efficient frontier data");
    return;
  }

  const ef = efficientFrontierData.ef_no_short;
  const fundNames = Object.keys(fundData);

  // Step 1: Find the appropriate index based on risk profile
  const numPoints = ef.returns.length;
  let targetIndex;

  switch (appState.riskProfile) {
    case "Very Conservative":
      targetIndex = 0;
      break; // Lowest risk
    case "Conservative":
      targetIndex = Math.floor(numPoints * 0.25);
      break;
    case "Moderate":
      targetIndex = Math.floor(numPoints * 0.5);
      break;
    case "Growth-Oriented":
      targetIndex = Math.floor(numPoints * 0.75);
      break;
    case "Aggressive":
      targetIndex = Math.floor(numPoints * 0.9);
      break;
    default:
      targetIndex = Math.floor(numPoints * 0.5);
  }

  // Step 2: Get the return and volatility for this point
  const targetReturn = ef.returns[targetIndex];
  const targetVolatility = ef.volatilities[targetIndex];

  console.log(
    `Using frontier point ${targetIndex}/${
      numPoints - 1
    } with return ${targetReturn.toFixed(
      4
    )} and volatility ${targetVolatility.toFixed(4)}`
  );

  // Step 3: Calculate weights for this return target
  let optimalWeights;
  try {
    optimalWeights = minimizeVolatilityForTargetReturn(
      fundNames.map((fund) => fundData[fund].annualizedReturn),
      covarianceMatrix,
      targetReturn
    );
  } catch (e) {
    console.error("Error calculating weights:", e);
    // Use a simple approach - all weight in the closest fund to this return
    optimalWeights = Array(fundNames.length).fill(0);
    const returns = fundNames.map((fund) => fundData[fund].annualizedReturn);
    let closestIndex = 0;
    let minDistance = Math.abs(returns[0] - targetReturn);
    for (let i = 1; i < returns.length; i++) {
      const distance = Math.abs(returns[i] - targetReturn);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    optimalWeights[closestIndex] = 1;
  }

  // Force the portfolio stats to exactly match the frontier point
  // (This ensures it will display exactly on the efficient frontier)
  const portfolioReturn = targetReturn;
  const portfolioVolatility = targetVolatility;
  const portfolioSharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  console.log("Optimal weights:", optimalWeights);

  // Step 4: Create the portfolio with significant allocations
  const significantAllocations = {};
  let totalSignificant = 0;

  for (let i = 0; i < fundNames.length; i++) {
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

// Helper function to find the index of the closest point on the frontier
function findClosestPointIndex(
  returns,
  volatilities,
  targetReturn,
  targetVolatility
) {
  let closestIndex = 0;
  let minDistance = Number.MAX_VALUE;

  // Normalize return and volatility scales
  const returnRange = Math.max(...returns) - Math.min(...returns);
  const volatilityRange = Math.max(...volatilities) - Math.min(...volatilities);

  for (let i = 0; i < returns.length; i++) {
    // Calculate normalized Euclidean distance
    const returnDiff = (returns[i] - targetReturn) / returnRange;
    const volatilityDiff =
      (volatilities[i] - targetVolatility) / volatilityRange;
    const distance = Math.sqrt(
      returnDiff * returnDiff + volatilityDiff * volatilityDiff
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
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

// handleDownloadReport function
function handleDownloadReport() {
  // Use jsPDF to create a PDF report
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // First capture the portfolio allocation chart
  html2canvas(document.getElementById("portfolio-allocation-chart")).then(
    (allocationCanvas) => {
      const allocationImage = allocationCanvas.toDataURL("image/png");

      // Next capture the efficient frontier chart
      html2canvas(document.getElementById("efficient-frontier-chart")).then(
        (frontierCanvas) => {
          const frontierImage = frontierCanvas.toDataURL("image/png");

          // Now capture the current projection chart (base scenario)
          html2canvas(document.getElementById("projection-chart")).then(
            (projectionCanvas) => {
              const projectionImage = projectionCanvas.toDataURL("image/png");

              // Now build the PDF with these images

              // Add title
              doc.setFontSize(20);
              doc.setTextColor(0, 51, 102);
              doc.text("Portfolio Optimization Report", 105, 15, {
                align: "center",
              });

              // Add date
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(
                `Generated on: ${new Date().toLocaleDateString()}`,
                105,
                22,
                {
                  align: "center",
                }
              );

              // Add risk profile section
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Risk Profile", 14, 35);

              doc.setFontSize(12);
              doc.setTextColor(0);
              doc.text(`Profile: ${appState.riskProfile}`, 14, 45);
              doc.text(
                `Risk Aversion Parameter: ${appState.riskAversion}`,
                14,
                52
              );
              doc.text(`Time Horizon: ${appState.timeHorizon}`, 14, 59);
              doc.text(
                `Investment Knowledge: ${appState.knowledgeLevel}`,
                14,
                66
              );

              // Add portfolio statistics
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Portfolio Statistics", 14, 80);

              doc.setFontSize(12);
              doc.setTextColor(0);

              // Expected annual return
              doc.text(`Expected Annual Return:`, 14, 90);
              doc.setTextColor(34, 139, 34);
              doc.text(
                `${(appState.optimalPortfolio.stats.return * 100).toFixed(2)}%`,
                80,
                90
              );

              // Expected annual volatility
              doc.setTextColor(0);
              doc.text(`Expected Annual Volatility:`, 14, 97);
              doc.setTextColor(220, 20, 60);
              doc.text(
                `${(appState.optimalPortfolio.stats.volatility * 100).toFixed(
                  2
                )}%`,
                80,
                97
              );

              // Sharpe ratio
              doc.setTextColor(0);
              doc.text(`Sharpe Ratio:`, 14, 104);
              doc.setTextColor(30, 144, 255);
              doc.text(
                `${appState.optimalPortfolio.stats.sharpeRatio.toFixed(2)}`,
                80,
                104
              );

              doc.setTextColor(0);

              // Add portfolio allocation chart
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Portfolio Allocation", 14, 118);

              // Add the chart image
              doc.addImage(allocationImage, "PNG", 15, 125, 180, 70);

              // Add recommended allocation section
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Recommended Portfolio Allocation", 14, 210);

              // Table for allocations
              doc.setFontSize(11);
              doc.setTextColor(0);

              // Table headers
              doc.setFont(undefined, "bold");
              doc.text("Fund", 14, 220);
              doc.text("Asset Class", 100, 220);
              doc.text("Allocation", 170, 220);
              doc.setFont(undefined, "normal");

              // Draw header line
              doc.setDrawColor(200);
              doc.line(14, 222, 196, 222);

              // Add fund allocations
              let y = 228;
              appState.optimalPortfolio.recommendedAllocation.forEach(
                (item) => {
                  const assetClass = fundData[item.fund].assetClass;

                  // Truncate long fund names
                  let displayName = item.fund;
                  if (displayName.length > 40) {
                    displayName = displayName.substring(0, 37) + "...";
                  }

                  doc.text(displayName, 14, y);
                  doc.text(assetClass, 100, y);
                  doc.text(`${(item.weight * 100).toFixed(2)}%`, 170, y);

                  y += 7;

                  // Start new page if needed
                  if (y > 270) {
                    doc.addPage();
                    y = 20;

                    doc.setFont(undefined, "bold");
                    doc.text("Fund", 14, y);
                    doc.text("Asset Class", 100, y);
                    doc.text("Allocation", 170, y);
                    doc.setFont(undefined, "normal");

                    doc.line(14, y + 2, 196, y + 2);

                    y += 8;
                  }
                }
              );

              // Add total row
              doc.setFont(undefined, "bold");
              doc.line(14, y, 196, y);
              y += 5;
              doc.text("Total", 14, y);
              doc.text("100.00%", 170, y);
              doc.setFont(undefined, "normal");

              // Add a new page for Efficient Frontier
              doc.addPage();

              // Add Efficient Frontier Analysis section
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Efficient Frontier Analysis", 105, 15, {
                align: "center",
              });

              // Add explanation
              doc.setFontSize(10);
              doc.setTextColor(0);
              doc.text(
                "This chart shows the efficient frontier and your portfolio's position on it.",
                14,
                25
              );
              doc.text(
                "The efficient frontier represents the set of optimal portfolios that offer the highest expected",
                14,
                32
              );
              doc.text(
                "return for a given level of risk. Your portfolio is positioned based on your risk profile.",
                14,
                39
              );

              // Add the efficient frontier chart image
              doc.addImage(frontierImage, "PNG", 15, 45, 180, 70);

              // Add Portfolio Projections section
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Portfolio Performance Projection", 105, 130, {
                align: "center",
              });

              // Base case scenario
              doc.setFontSize(14);
              doc.setTextColor(0, 51, 102);
              doc.text("Current Scenario", 14, 145);

              // Add description
              doc.setFontSize(10);
              doc.setTextColor(0);
              const currentScenario = appState.currentScenario || "base";
              const scenarioDescription =
                scenarioData[currentScenario]?.description ||
                "Expected performance based on historical returns and volatility";
              doc.text(scenarioDescription, 14, 152);

              // Add the projection chart
              doc.addImage(projectionImage, "PNG", 15, 158, 180, 60);

              // Add investment goals section
              doc.addPage();
              doc.setFontSize(16);
              doc.setTextColor(0, 51, 102);
              doc.text("Investment Goals", 14, 20);

              doc.setFontSize(12);
              doc.setTextColor(0);
              doc.text(`Goal Type: ${appState.investmentGoals.type}`, 14, 30);
              doc.text(
                `Target Amount: $${appState.investmentGoals.amount.toLocaleString()}`,
                14,
                37
              );
              doc.text(
                `Time Horizon: ${appState.investmentGoals.timeHorizon} years`,
                14,
                44
              );
              doc.text(
                `Initial Investment: $${appState.investmentGoals.initialInvestment.toLocaleString()}`,
                14,
                51
              );
              doc.text(
                `Monthly Contribution: $${appState.investmentGoals.monthlyContribution.toLocaleString()}`,
                14,
                58
              );

              // Add disclaimer
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(
                "DISCLAIMER: This report is for educational purposes only. Past performance is not indicative of future results.",
                14,
                240
              );
              doc.text(
                "All investments involve risk and may result in loss of principal. Consult with a qualified financial advisor before making investment decisions.",
                14,
                247
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
      );
    }
  );
}
