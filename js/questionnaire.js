/**
 * Questionnaire Handling Functions for Robo Advisor
 * Manages the risk profiling questionnaire and risk profile calculation
 * Improved version to match Project 1's approach for calculating risk aversion
 */

// Show current question
function showCurrentQuestion() {
  const questionContainer = document.getElementById("question-container");
  const currentQuestionIndex = appState.currentQuestionIndex;

  if (currentQuestionIndex < questionnaireData.questions.length) {
    const question = questionnaireData.questions[currentQuestionIndex];
    const options = questionnaireData.options[currentQuestionIndex];

    // Create question HTML
    let html = `
            <div class="mb-4">
                <h3 class="text-xl font-semibold">Question ${
                  currentQuestionIndex + 1
                } of ${questionnaireData.questions.length}</h3>
                <p class="text-lg mt-2">${question}</p>
            </div>
            <div class="space-y-3">
        `;

    // Add options
    options.forEach((option, index) => {
      const isSelected =
        appState.questionResponses[currentQuestionIndex] === index + 1;
      html += `
                <div class="p-3 rounded-lg ${
                  isSelected
                    ? "bg-blue-100 border-blue-500 border-2"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }" 
                     data-option="${index + 1}" 
                     onclick="selectOption(${index + 1})">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="question-${currentQuestionIndex}" value="${
        index + 1
      }" 
                               ${isSelected ? "checked" : ""} class="mr-2">
                        <span>${option}</span>
                    </label>
                </div>
            `;
    });

    html += "</div>";

    // Update container
    questionContainer.innerHTML = html;

    // Update progress
    document.getElementById("question-progress").textContent = `Question ${
      currentQuestionIndex + 1
    } of ${questionnaireData.questions.length}`;
    const progressPercentage =
      ((currentQuestionIndex + 1) / questionnaireData.questions.length) * 100;
    document.getElementById(
      "question-progress-bar"
    ).style.width = `${progressPercentage}%`;

    // Update buttons
    document.getElementById("btn-prev-question").disabled =
      currentQuestionIndex === 0;
    document.getElementById("btn-next-question").textContent =
      currentQuestionIndex === questionnaireData.questions.length - 1
        ? "Submit"
        : "Next Question";
  }
}

// Handle option selection
function selectOption(optionValue) {
  // Update response for current question
  appState.questionResponses[appState.currentQuestionIndex] = optionValue;

  // Update UI to show selection
  const options = document.querySelectorAll(
    "#question-container [data-option]"
  );
  options.forEach((option) => {
    if (parseInt(option.dataset.option) === optionValue) {
      option.classList.add("bg-blue-100", "border-blue-500", "border-2");
      option.classList.remove(
        "bg-white",
        "border-gray-300",
        "hover:bg-gray-50"
      );
      option.querySelector("input").checked = true;
    } else {
      option.classList.remove("bg-blue-100", "border-blue-500", "border-2");
      option.classList.add("bg-white", "border-gray-300", "hover:bg-gray-50");
      option.querySelector("input").checked = false;
    }
  });

  // Enable next button automatically when an option is selected
  document.getElementById("btn-next-question").disabled = false;
}
// Handle previous question button
function handlePrevQuestion() {
  if (appState.currentQuestionIndex > 0) {
    appState.currentQuestionIndex--;
    showCurrentQuestion();
  }
}

function handleNextQuestion() {
  // If no option is selected, show alert
  if (!appState.questionResponses[appState.currentQuestionIndex]) {
    alert("Please select an option before proceeding.");
    return;
  }

  // If this is the last question, submit questionnaire
  if (
    appState.currentQuestionIndex ===
    questionnaireData.questions.length - 1
  ) {
    // This line is critical - call calculateRiskProfile directly here
    calculateRiskProfile();
    // Then navigate to the risk profile section
    navigateTo("section-risk-profile");
    return;
  }

  // Otherwise, go to next question
  appState.currentQuestionIndex++;
  showCurrentQuestion();

  // Update progress
  const progress = Math.min(
    20 +
      Math.floor(
        40 *
          (appState.currentQuestionIndex / questionnaireData.questions.length)
      ),
    60
  );
  updateProgress(progress);
}

// Reset questionnaire
function resetQuestionnaire() {
  appState.currentQuestionIndex = 0;
  appState.questionResponses = Array(questionnaireData.questions.length).fill(
    0
  );
  showCurrentQuestion();
  updateProgress(20); // Reset progress bar
}

/**
 * Calculate risk profile based on questionnaire responses
 * Fixed version that properly handles the scoring (no inversion)
 */
function calculateRiskProfile() {
  // First, ensure we have all responses
  const missingResponses = appState.questionResponses.findIndex((r) => !r);
  if (missingResponses >= 0) {
    alert(`Please answer question ${missingResponses + 1} before continuing.`);
    appState.currentQuestionIndex = missingResponses;
    showCurrentQuestion();
    return;
  }

  // Calculate total score from responses
  const totalScore = appState.questionResponses.reduce(
    (sum, response) => sum + response,
    0
  );

  // Here's the critical fix - do NOT invert the score
  // If the questionnaire is designed so higher numbers = more risk tolerance,
  // then we should directly use the score without inversion
  const finalScore = totalScore; // Directly use totalScore instead of 96-totalScore

  // Map the score to risk profile and risk aversion
  // These thresholds would need to be adjusted based on the questionnaire's design
  // Assuming a 16-question, 5-point questionnaire with max score of 80
  // Adjust these thresholds to match your specific questionnaire
  let riskProfile, riskAversion;

  if (finalScore >= 65) {
    riskProfile = "Aggressive";
    riskAversion = 1.5;
  } else if (finalScore >= 55) {
    riskProfile = "Growth-Oriented";
    riskAversion = 2.5;
  } else if (finalScore >= 45) {
    riskProfile = "Moderate";
    riskAversion = 3.5;
  } else if (finalScore >= 35) {
    riskProfile = "Conservative";
    riskAversion = 6.0;
  } else {
    riskProfile = "Very Conservative";
    riskAversion = 12.0;
  }

  // Extract investment knowledge and time horizon from responses
  const knowledgeLevel = appState.questionResponses[3]; // Question 4
  const timeHorizon = appState.questionResponses[1]; // Question 2

  const knowledgeLabels = [
    "Very Limited",
    "Basic",
    "Moderate",
    "Good",
    "Advanced",
  ];
  const timeHorizonLabels = [
    "< 3 years",
    "3-5 years",
    "6-10 years",
    "11-20 years",
    "> 20 years",
  ];

  // Update application state
  appState.riskProfile = riskProfile;
  appState.riskAversion = riskAversion;
  appState.knowledgeLevel = knowledgeLabels[knowledgeLevel - 1];
  appState.timeHorizon = timeHorizonLabels[timeHorizon - 1];
  appState.riskProfileScore = finalScore;

  // Update UI - using the original app.js expected function
  updateRiskProfileUI();
  updateProgress(80); // Update progress after risk profile calculation
}

// Calculate optimal portfolio using the improved portfolio.js functions
function calculateOptimalPortfolio(returns, covMatrix, riskAversion) {
  // Use our utility-based optimization
  const result = optimizePortfolioByRiskAversion(
    returns,
    covMatrix,
    riskAversion
  );

  // Match Project 1's approach for filtering significant weights
  const significantWeights = {};
  let significantSum = 0;

  // Map weight indices back to fund names
  const fundNames = Object.keys(portfolioData.fundData);

  result.weights.forEach((weight, index) => {
    if (weight > 0.01) {
      // Only keep weights > 1%
      significantWeights[fundNames[index]] = weight;
      significantSum += weight;
    }
  });

  // Normalize weights to sum to 1
  const normalizedWeights = {};
  Object.entries(significantWeights).forEach(([fund, weight]) => {
    normalizedWeights[fund] =
      Math.round((weight / significantSum) * 10000) / 10000;
  });

  return {
    full_allocation: Object.fromEntries(
      result.weights.map((w, i) => [fundNames[i], w])
    ),
    recommended_allocation: normalizedWeights,
    portfolio_stats: result.stats,
  };
}

// Update risk profile UI with improved visualization
function updateRiskProfileUI() {
  // Update risk profile result
  const riskProfileResult = document.getElementById("risk-profile-result");
  riskProfileResult.innerHTML = `
        <h3 class="text-2xl font-bold mb-3">Your Risk Profile: <span class="text-blue-700">${
          appState.riskProfile
        }</span></h3>
        <p class="mb-3">Risk Aversion Parameter: ${appState.riskAversion}</p>
        <p class="mb-3">${riskProfiles[appState.riskProfile].description}</p>
        <div class="bg-blue-100 p-3 rounded">
            <h4 class="font-semibold mb-1">Recommended Asset Allocation:</h4>
            <p>${riskProfiles[appState.riskProfile].recommendedAssetMix}</p>
        </div>
    `;

  // Update risk profile explanation
  const riskProfileExplanation = document.getElementById(
    "risk-profile-explanation"
  );
  riskProfileExplanation.innerHTML = `
        <p class="mb-4">Based on your responses to our comprehensive questionnaire, we've determined that your investment approach aligns with a <strong>${appState.riskProfile}</strong> risk profile. This assessment considers your time horizon, investment knowledge, financial situation, and psychological comfort with market fluctuations.</p>
        <p>Your profile suggests you should consider a portfolio that balances risk and return in a way that aligns with your personal preferences and financial goals.</p>
        <p class="mt-4">Your risk profile score is <strong>${appState.riskProfileScore}</strong> out of 96, with higher scores indicating higher risk tolerance.</p>
    `;

  // Update time horizon content
  const timeHorizonContent = document.getElementById("time-horizon-content");
  timeHorizonContent.innerHTML = `
        <p class="mb-2">Your selected time horizon: <strong>${
          appState.timeHorizon
        }</strong></p>
        <p>${riskProfiles[appState.riskProfile].timeHorizonAdvice}</p>
    `;

  // Update investment knowledge content
  const investmentKnowledgeContent = document.getElementById(
    "investment-knowledge-content"
  );
  investmentKnowledgeContent.innerHTML = `
        <p class="mb-2">Your investment knowledge: <strong>${
          appState.knowledgeLevel
        }</strong></p>
        <p>${riskProfiles[appState.riskProfile].knowledgeAdvice}</p>
    `;

  // Display recommended portfolio if available
  if (appState.recommendedPortfolio) {
    displayRecommendedPortfolio(appState.recommendedPortfolio);
  }

  // Create risk dial chart
  createRiskDialChart(appState.riskProfile);
}

// Display recommended portfolio allocations with improved visualization
function displayRecommendedPortfolio(portfolio) {
  const container = document.getElementById("recommended-portfolio");
  if (!container) return;

  // Format weights into HTML
  const allocations = Object.entries(portfolio.recommended_allocation)
    .sort((a, b) => b[1] - a[1]) // Sort by weight descending
    .map(([fund, weight]) => {
      const percentage = (weight * 100).toFixed(1);
      const fundData = portfolioData.fundData[fund];
      const assetClass = portfolioData.fundAssetClasses[fund];

      // Get color based on asset class
      const colorClass = getAssetClassColor(assetClass);

      return `
                <div class="mb-3 p-3 rounded border ${colorClass}">
                    <div class="flex justify-between mb-1">
                        <span class="font-semibold">${fund}</span>
                        <span class="font-bold">${percentage}%</span>
                    </div>
                    <div class="text-sm text-gray-600">${assetClass}</div>
                    <div class="mt-2 bg-gray-200 rounded-full h-2.5">
                        <div class="h-2.5 rounded-full bg-blue-600" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
    })
    .join("");

  // Add portfolio statistics
  const stats = portfolio.portfolio_stats;
  const portfolioStats = `
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-lg font-semibold mb-3">Expected Portfolio Performance</h4>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-white rounded shadow-sm">
                    <div class="text-sm text-gray-500">Annual Return</div>
                    <div class="text-xl font-bold">${(
                      stats.return * 100
                    ).toFixed(2)}%</div>
                </div>
                <div class="p-3 bg-white rounded shadow-sm">
                    <div class="text-sm text-gray-500">Annual Volatility</div>
                    <div class="text-xl font-bold">${(
                      stats.volatility * 100
                    ).toFixed(2)}%</div>
                </div>
                <div class="p-3 bg-white rounded shadow-sm">
                    <div class="text-sm text-gray-500">Sharpe Ratio</div>
                    <div class="text-xl font-bold">${stats.sharpeRatio.toFixed(
                      2
                    )}</div>
                </div>
                <div class="p-3 bg-white rounded shadow-sm">
                    <div class="text-sm text-gray-500">Utility Score</div>
                    <div class="text-xl font-bold">${stats.utility.toFixed(
                      4
                    )}</div>
                </div>
            </div>
        </div>
    `;

  // Add a note about rebalancing
  const rebalancingNote = `
        <div class="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 class="font-semibold text-yellow-800">Rebalancing Recommendation</h4>
            <p class="mt-1 text-yellow-700">
                To maintain this optimal allocation, consider rebalancing your portfolio quarterly or when any position drifts more than 5% from its target weight.
            </p>
        </div>
    `;

  // Update the container
  container.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Recommended Portfolio Allocation</h3>
        <p class="mb-4">Based on your ${appState.riskProfile} risk profile, we recommend the following portfolio allocation:</p>
        ${allocations}
        ${portfolioStats}
        ${rebalancingNote}
    `;

  // Create allocation pie chart
  createAllocationPieChart(portfolio.recommended_allocation);
}

// Helper function to get color class based on asset class
function getAssetClassColor(assetClass) {
  const assetClassColors = {
    "Alternative - Commodities": "bg-amber-50 border-amber-200",
    "Equity - ESG": "bg-green-50 border-green-200",
    "Equity - Technology": "bg-purple-50 border-purple-200",
    "Equity - Singapore": "bg-red-50 border-red-200",
    "Equity - India": "bg-orange-50 border-orange-200",
    "Equity - China": "bg-blue-50 border-blue-200",
    "Equity - Sector Specific": "bg-indigo-50 border-indigo-200",
    "Equity - Growth": "bg-pink-50 border-pink-200",
  };

  return assetClassColors[assetClass] || "bg-gray-50 border-gray-200";
}

// Create risk dial chart with fixed label positioning
function createRiskDialChart(riskProfile) {
  const canvas = document.getElementById("risk-dial-chart");
  if (!canvas || !canvas.getContext) return;

  // Make sure canvas has adequate size to display everything
  if (canvas.width < 300) canvas.width = 300;
  if (canvas.height < 200) canvas.height = 200;

  // Get risk level index
  const riskLevels = [
    "Very Conservative",
    "Conservative",
    "Moderate",
    "Growth-Oriented",
    "Aggressive",
  ];
  const shortLabels = [
    "V.Conservative",
    "Conservative",
    "Moderate",
    "Growth-Oriented",
    "Aggressive",
  ];
  const riskIndex = riskLevels.indexOf(riskProfile);

  // Set up canvas
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw arc background
  const centerX = width / 2;
  const centerY = height - 30; // Move center lower
  const radius = Math.min(height - 60, width / 2 - 20); // Ensure radius fits within canvas
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  // Draw segments
  const segmentCount = 5;
  const segmentAngle = (endAngle - startAngle) / segmentCount;

  const colors = ["#10B981", "#60A5FA", "#FBBF24", "#F97316", "#EF4444"];

  for (let i = 0; i < segmentCount; i++) {
    const segStart = startAngle + i * segmentAngle;
    const segEnd = segStart + segmentAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, segStart, segEnd);
    ctx.lineWidth = 25; // Slightly thinner lines
    ctx.strokeStyle = colors[i];
    ctx.stroke();
  }

  // Draw needle
  const needleAngle = startAngle + (riskIndex + 0.5) * segmentAngle;
  const needleLength = radius - 10;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + needleLength * Math.cos(needleAngle),
    centerY + needleLength * Math.sin(needleAngle)
  );
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1F2937";
  ctx.stroke();

  // Draw center point
  ctx.beginPath();
  ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
  ctx.fillStyle = "#1F2937";
  ctx.fill();

  // Position labels with more precise placement
  ctx.font = "11px Arial"; // Smaller font
  ctx.fillStyle = "#374151";

  // Place labels manually with proper positioning
  const labelY = centerY - radius - 15; // Place all labels at top

  ctx.textAlign = "center";
  ctx.fillText(shortLabels[0], centerX - radius * 0.8, labelY);
  ctx.fillText(shortLabels[1], centerX - radius * 0.4, labelY);
  ctx.fillText(shortLabels[2], centerX, labelY);
  ctx.fillText(shortLabels[3], centerX + radius * 0.4, labelY);
  ctx.fillText(shortLabels[4], centerX + radius * 0.8, labelY);
}

// Export functions for use in the application
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showCurrentQuestion,
    selectOption,
    handlePrevQuestion,
    handleNextQuestion,
    resetQuestionnaire,
    calculateRiskProfile,
    updateRiskProfileUI,
  };
}
