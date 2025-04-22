/**
 * Questionnaire Handling Functions for Robo Advisor
 * Manages the risk profiling questionnaire and risk profile calculation
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
}

// Handle previous question button
function handlePrevQuestion() {
  if (appState.currentQuestionIndex > 0) {
    appState.currentQuestionIndex--;
    showCurrentQuestion();
  }
}

// Handle next question button
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
  appState.questionResponses = [];
  showCurrentQuestion();
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
    riskAversion = 3.0;
  } else if (finalScore >= 45) {
    riskProfile = "Moderate";
    riskAversion = 5.0; //4.5
  } else if (finalScore >= 35) {
    riskProfile = "Conservative";
    riskAversion = 8.0; //7.0
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

// Update risk profile UI
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

  // Create risk dial chart
  createRiskDialChart(appState.riskProfile);
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

  /*
  ctx.textAlign = "center";
  ctx.fillText(shortLabels[0], centerX - radius * 0.8, labelY);
  ctx.fillText(shortLabels[1], centerX - radius * 0.4, labelY);
  ctx.fillText(shortLabels[2], centerX, labelY);
  ctx.fillText(shortLabels[3], centerX + radius * 0.4, labelY);
  ctx.fillText(shortLabels[4], centerX + radius * 0.8, labelY);
  */
}

// Create allocation pie chart with improved visualization
function createAllocationPieChart(allocation) {
  const canvas = document.getElementById("allocation-pie-chart");
  if (!canvas || !canvas.getContext) return;

  // Set up canvas
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Convert allocation to array of [fund, weight] pairs
  const allocations = Object.entries(allocation);

  // Define colors for pie slices
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
    "#8B5CF6",
    "#14B8A6",
    "#F97316",
    "#06B6D4",
  ];

  // Calculate total (should be 1, but just in case)
  const total = allocations.reduce((sum, [_, weight]) => sum + weight, 0);

  // Draw pie chart
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  let startAngle = 0;

  // Draw each slice
  allocations.forEach(([fund, weight], index) => {
    const sliceAngle = (weight / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    // Fill slice
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    // Add fund name if slice is large enough
    if (weight / total > 0.05) {
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Truncate fund name if needed
      const maxLength = 12;
      const displayName =
        fund.length > maxLength ? fund.substring(0, maxLength) + "..." : fund;

      ctx.fillText(displayName, labelX, labelY);
    }

    startAngle = endAngle;
  });

  // Add legend
  const legendX = 10;
  let legendY = height - 10 - allocations.length * 25;

  // Ensure legend doesn't go too high
  if (legendY < 10) legendY = 10;

  // Draw legend
  allocations.forEach(([fund, weight], index) => {
    const color = colors[index % colors.length];
    const percentage = (weight * 100).toFixed(1);

    // Draw color box
    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY, 15, 15);

    // Draw text
    ctx.font = "12px Arial";
    ctx.fillStyle = "#374151";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Truncate fund name if needed
    const maxLength = 15;
    const displayName =
      fund.length > maxLength ? fund.substring(0, maxLength) + "..." : fund;

    ctx.fillText(
      `${displayName} (${percentage}%)`,
      legendX + 25,
      legendY + 7.5
    );

    legendY += 25;
  });
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
