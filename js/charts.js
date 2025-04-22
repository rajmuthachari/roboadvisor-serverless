/**
 * Chart Creation Functions for Robo Advisor
 * Creates and updates all visualization elements
 */

// Create correlation heatmap
function createCorrelationHeatmap() {
  // Prepare data for heatmap
  const fundNames = Object.keys(fundData);

  // Calculate correlation matrix from covariance matrix
  const correlationMatrix = calculateCorrelationMatrix(covarianceMatrix);

  // Create shortened fund names for better display
  const shortFundNames = fundNames.map((name) => {
    // Extract the first part of the name (before the first hyphen or space)
    const shortName = name.split(/[ -]/)[0];
    return shortName;
  });

  // Create heatmap data
  const data = [
    {
      z: correlationMatrix,
      x: shortFundNames,
      y: shortFundNames,
      type: "heatmap",
      colorscale: [
        [0, "rgb(0, 0, 255)"],
        [0.5, "rgb(255, 255, 255)"],
        [1, "rgb(255, 0, 0)"],
      ],
      zmin: -1,
      zmax: 1,
    },
  ];

  // Create layout
  const layout = {
    margin: {
      l: 50,
      r: 20,
      b: 50,
      t: 20,
      pad: 4,
    },
    xaxis: {
      tickangle: -45,
    },
  };

  // Create heatmap
  Plotly.newPlot("correlation-heatmap", data, layout, { responsive: true });
}

// Create risk-return scatter plot
function createRiskReturnScatter() {
  const fundNames = Object.keys(fundData);
  const returns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const volatilities = fundNames.map(
    (fund) => fundData[fund].annualizedVolatility
  );
  const sharpeRatios = fundNames.map((fund) => fundData[fund].sharpeRatio);

  // Create shortened fund names for better display
  const shortFundNames = fundNames.map((name) => {
    // Extract the first part of the name (before the first hyphen or space)
    const shortName = name.split(/[ -]/)[0];
    return shortName;
  });

  // Calculate sizes based on sharpe ratio
  const normalizedSharpe = sharpeRatios.map((ratio) => {
    return Math.max(10, 20 + ratio * 20); // Min size 10, scale based on sharpe
  });

  // Create marker colors based on asset class
  const markerColors = fundNames.map((fund) => {
    const assetClass = fundData[fund].assetClass;
    if (assetClass.includes("Equity")) return "rgb(59, 130, 246)"; // Blue
    if (assetClass.includes("Fixed Income")) return "rgb(16, 185, 129)"; // Green
    if (assetClass.includes("Real Estate")) return "rgb(245, 158, 11)"; // Yellow
<<<<<<< Updated upstream
    if (assetClass.includes("Alternative")) return "rgb(139, 92, 246)"; // Purple
=======
>>>>>>> Stashed changes
    return "rgb(156, 163, 175)"; // Gray
  });

  // Create scatter plot data
  const data = [
    {
      x: volatilities,
      y: returns,
      mode: "markers+text",
      type: "scatter",
      text: shortFundNames,
      textposition: "top",
      marker: {
        size: normalizedSharpe,
        color: markerColors,
        opacity: 0.8,
        line: {
          width: 1,
          color: "rgb(229, 231, 235)",
        },
      },
      hovertemplate:
        "<b>%{text}</b><br>" +
        "Return: %{y:.2%}<br>" +
        "Volatility: %{x:.2%}<br>" +
        "<extra></extra>",
    },
  ];

  // Create layout
  const layout = {
    margin: {
      l: 50,
      r: 20,
      b: 50,
      t: 20,
      pad: 4,
    },
    xaxis: {
      title: "Volatility (Risk)",
      tickformat: ".0%",
    },
    yaxis: {
      title: "Annual Return",
      tickformat: ".0%",
    },
    hovermode: "closest",
    showlegend: false,
  };

  // Create scatter plot
  Plotly.newPlot("risk-return-scatter", data, layout, { responsive: true });
}

// Create portfolio allocation chart
function createPortfolioAllocationChart() {
  // Group funds by asset class
  const assetClassAllocation = {};

  appState.optimalPortfolio.recommendedAllocation.forEach((item) => {
    const fund = item.fund;
    const assetClass = fundData[fund].assetClass.split(" - ")[0]; // Get main asset class

    if (!assetClassAllocation[assetClass]) {
      assetClassAllocation[assetClass] = 0;
    }

    assetClassAllocation[assetClass] += item.weight;
  });

  // Prepare data for chart
  const assetClasses = Object.keys(assetClassAllocation);
  const values = Object.values(assetClassAllocation);

  // Define colors for asset classes
  const colors = {
    Equity: "rgb(59, 130, 246)",
    "Fixed Income": "rgb(16, 185, 129)",
    "Real Estate": "rgb(245, 158, 11)",
<<<<<<< Updated upstream
    Alternative: "rgb(139, 92, 246)",
=======
    Alternatives: "rgb(139, 92, 246)",
>>>>>>> Stashed changes
    Cash: "rgb(156, 163, 175)",
  };

  const colorArray = assetClasses.map(
    (assetClass) => colors[assetClass] || "rgb(156, 163, 175)"
  );

  // Create chart data
  const data = [
    {
      values: values,
      labels: assetClasses,
      type: "pie",
      hole: 0.4,
      textinfo: "label+percent",
      textposition: "outside",
      marker: {
        colors: colorArray,
      },
    },
  ];

  // Create layout
  const layout = {
    showlegend: false,
    margin: {
      l: 20,
      r: 20,
      b: 20,
      t: 20,
    },
    annotations: [
      {
        font: {
          size: 14,
        },
        showarrow: false,
        text: appState.riskProfile,
        x: 0.5,
        y: 0.5,
      },
    ],
  };

  // Create chart
  Plotly.newPlot("portfolio-allocation-chart", data, layout, {
    responsive: true,
  });
}

// Create efficient frontier chart
function createEfficientFrontierChart() {
<<<<<<< Updated upstream
  // Extract returns
  const fundNames = Object.keys(fundData);
  const returns = {};
  fundNames.forEach((fund) => {
    returns[fund] = fundData[fund].annualizedReturn;
  });

  // Generate efficient frontier points
  const efResults = generateEfficientFrontier(returns, covarianceMatrix);
=======
  // Extract returns for all funds
  const fundNames = Object.keys(fundData);
  const returns = fundNames.map((fund) => fundData[fund].annualizedReturn);

  // Generate efficient frontier points
  const frontierPoints = generateEfficientFrontier(returns, covarianceMatrix);
>>>>>>> Stashed changes

  // Get individual funds data
  const fundReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const fundVolatilities = fundNames.map(
    (fund) => fundData[fund].annualizedVolatility
  );

  // Create shortened fund names for better display
  const shortFundNames = fundNames.map((name) => {
    const shortName = name.split(/[ -]/)[0];
    return shortName;
  });

  // Create data for scatter plot
  const data = [
<<<<<<< Updated upstream
    // Efficient frontier with short sales
    {
      x: efResults.efWithShort.volatilities,
      y: efResults.efWithShort.returns,
      mode: "lines",
      name: "Efficient Frontier (With Short Sales)",
=======
    // Efficient frontier
    {
      x: frontierPoints.volatilities,
      y: frontierPoints.returns,
      mode: "lines",
      name: "Efficient Frontier",
>>>>>>> Stashed changes
      line: {
        color: "rgba(59, 130, 246, 0.7)",
        width: 3,
      },
    },
<<<<<<< Updated upstream
    // Efficient frontier without short sales
    {
      x: efResults.efNoShort.volatilities,
      y: efResults.efNoShort.returns,
      mode: "lines",
      name: "Efficient Frontier (No Short Sales)",
      line: {
        color: "rgba(16, 185, 129, 0.7)",
        width: 3,
      },
    },
    // Capital Market Line
    {
      x: [0, efResults.marketPortfolioNoShort.volatility * 1.5],
      y: [
        0.03,
        0.03 +
          efResults.marketPortfolioNoShort.sharpe *
            efResults.marketPortfolioNoShort.volatility *
=======
    // Capital Market Line
    {
      x: [0, frontierPoints.maxSharpeVolatility * 1.5],
      y: [
        0.03,
        0.03 +
          frontierPoints.maxSharpeRatio *
            frontierPoints.maxSharpeVolatility *
>>>>>>> Stashed changes
            1.5,
      ],
      mode: "lines",
      name: "Capital Market Line",
      line: {
        color: "rgba(220, 38, 38, 0.7)",
        width: 2,
        dash: "dash",
      },
    },
    // Individual funds
    {
      x: fundVolatilities,
      y: fundReturns,
      mode: "markers+text",
      name: "Individual Funds",
      text: shortFundNames,
      textposition: "top",
      marker: {
        size: 8,
        color: "rgba(107, 114, 128, 0.7)",
      },
    },
<<<<<<< Updated upstream
    // Optimal portfolio (from risk aversion)
=======
    // Optimal portfolio
>>>>>>> Stashed changes
    {
      x: [appState.optimalPortfolio.stats.volatility],
      y: [appState.optimalPortfolio.stats.return],
      mode: "markers",
      name: "Your Portfolio",
      marker: {
        size: 12,
        color: "rgba(16, 185, 129, 1)",
        symbol: "star",
      },
    },
<<<<<<< Updated upstream
    // Global Minimum Variance Portfolio (No Short Sales)
    {
      x: [efResults.gmvpNoShort.volatility],
      y: [efResults.gmvpNoShort.return],
      mode: "markers",
      name: "Min Variance",
      marker: {
        size: 10,
        color: "rgba(245, 158, 11, 1)",
        symbol: "circle",
      },
    },
    // Market Portfolio (No Short Sales)
    {
      x: [efResults.marketPortfolioNoShort.volatility],
      y: [efResults.marketPortfolioNoShort.return],
=======
    // Maximum Sharpe Ratio Portfolio
    {
      x: [frontierPoints.maxSharpeVolatility],
      y: [frontierPoints.maxSharpeReturn],
>>>>>>> Stashed changes
      mode: "markers",
      name: "Max Sharpe Ratio",
      marker: {
        size: 10,
        color: "rgba(220, 38, 38, 1)",
        symbol: "diamond",
      },
    },
<<<<<<< Updated upstream
=======
    // Minimum Variance Portfolio
    {
      x: [frontierPoints.minVarianceVolatility],
      y: [frontierPoints.minVarianceReturn],
      mode: "markers",
      name: "Min Variance",
      marker: {
        size: 10,
        color: "rgba(245, 158, 11, 1)",
        symbol: "circle",
      },
    },
>>>>>>> Stashed changes
  ];

  // Create layout
  const layout = {
    title: "Efficient Frontier Analysis",
    xaxis: {
      title: "Expected Volatility",
      tickformat: ".0%",
    },
    yaxis: {
      title: "Expected Return",
      tickformat: ".0%",
    },
    legend: {
      x: 0.05,
      y: 0.95,
      bordercolor: "rgba(0, 0, 0, 0.1)",
      borderwidth: 1,
    },
    shapes: [
      // Add a shape to highlight your portfolio risk tolerance area
      {
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: 0,
        y0: 0,
        x1: appState.optimalPortfolio.stats.volatility,
        y1: 1,
        fillcolor: "rgba(16, 185, 129, 0.1)",
        line: {
          width: 0,
        },
      },
    ],
    annotations: [
      {
        x: appState.optimalPortfolio.stats.volatility / 2,
        y: 1,
        xref: "x",
        yref: "paper",
        text: "Your Risk Tolerance",
        showarrow: false,
        font: {
          size: 12,
          color: "rgba(16, 185, 129, 1)",
        },
      },
    ],
  };

  // Create scatter plot
  Plotly.newPlot("efficient-frontier-chart", data, layout, {
    responsive: true,
  });
}

// Create projection chart
function createProjectionChart(scenario) {
  // Get scenario data
  const scenarioInfo = scenarioData[scenario];

  // Get portfolio stats
  const portfolioReturn =
    appState.optimalPortfolio.stats.return * scenarioInfo.returnMultiplier;
  const portfolioVolatility =
    appState.optimalPortfolio.stats.volatility *
    scenarioInfo.volatilityMultiplier;

  // Calculate projections
  const projections = calculateProjections(
    appState.investmentGoals.initialInvestment,
    appState.investmentGoals.monthlyContribution,
    portfolioReturn,
    portfolioVolatility,
    appState.investmentGoals.timeHorizon
  );

  // Create chart data
  const data = [
    // Expected growth
    {
      x: projections.years,
      y: projections.expected,
      type: "scatter",
      mode: "lines",
      name: "Expected Growth",
      line: {
        color: "rgba(59, 130, 246, 1)",
        width: 3,
      },
    },
    // Upper bound (75th percentile)
    {
      x: projections.years,
      y: projections.upperBound,
      type: "scatter",
      mode: "lines",
      name: "Optimistic (75th Percentile)",
      line: {
        color: "rgba(16, 185, 129, 0.7)",
        width: 2,
      },
    },
    // Lower bound (25th percentile)
    {
      x: projections.years,
      y: projections.lowerBound,
      type: "scatter",
      mode: "lines",
      name: "Conservative (25th Percentile)",
      line: {
        color: "rgba(245, 158, 11, 0.7)",
        width: 2,
      },
    },
    // Target amount
    {
      x: projections.years,
      y: Array(projections.years.length).fill(appState.investmentGoals.amount),
      type: "scatter",
      mode: "lines",
      name: "Target Amount",
      line: {
        color: "rgba(220, 38, 38, 0.7)",
        width: 2,
        dash: "dash",
      },
    },
  ];

  // Fill between upper and lower bounds
  const upperTrace = {
    x: [...projections.years, ...projections.years.slice().reverse()],
    y: [...projections.upperBound, ...projections.lowerBound.slice().reverse()],
    fill: "toself",
    fillcolor: "rgba(59, 130, 246, 0.1)",
    line: { color: "transparent" },
    showlegend: false,
    name: "Projection Range",
  };

  data.unshift(upperTrace); // Add to beginning so it's behind other traces

  // Add final values annotation
  const finalExpected = projections.expected[projections.expected.length - 1];
  const finalUpper = projections.upperBound[projections.upperBound.length - 1];
  const finalLower = projections.lowerBound[projections.lowerBound.length - 1];
  const targetAmount = appState.investmentGoals.amount;

  // Determine if target is met
  const targetMet = finalExpected >= targetAmount;
  const targetMetProbability =
    ((finalExpected - finalLower) / (finalUpper - finalLower)) * 100;

  // Create layout
  const layout = {
    title: `${scenarioInfo.name} - Portfolio Projection`,
    xaxis: {
      title: "Years",
      tickmode: "linear",
      dtick: Math.ceil(projections.years.length / 10),
    },
    yaxis: {
      title: "Portfolio Value",
      tickformat: "$,.0f",
    },
    legend: {
      x: 0.05,
      y: 0.95,
    },
    annotations: [
      {
        x: projections.years.length - 1,
        y: finalExpected,
        text: `$${Math.round(finalExpected).toLocaleString()}`,
        showarrow: true,
        arrowhead: 4,
        ax: 40,
        ay: 0,
        font: {
          color: "rgba(59, 130, 246, 1)",
        },
      },
      {
        x: projections.years.length - 1,
        y: targetAmount,
        text: `Target: $${targetAmount.toLocaleString()}`,
        showarrow: true,
        arrowhead: 4,
        ax: -40,
        ay: 0,
        font: {
          color: "rgba(220, 38, 38, 1)",
        },
      },
    ],
  };

  // Create chart
  Plotly.newPlot("projection-chart", data, layout, { responsive: true });

  // Add projection summary info
  const projectionContainer =
    document.querySelector("#projection-chart").parentNode;

  // Remove existing summary if present
  const existingSummary = projectionContainer.querySelector(
    ".projection-summary"
  );
  if (existingSummary) {
    existingSummary.remove();
  }

  // Create summary element
  const summaryDiv = document.createElement("div");
  summaryDiv.className =
    "projection-summary mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm";

  summaryDiv.innerHTML = `
        <div class="font-semibold mb-1">${scenarioInfo.name} Scenario:</div>
        <p class="mb-2">${scenarioInfo.description}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <div>Expected Value after ${
                  appState.investmentGoals.timeHorizon
                } years:</div>
                <div class="font-bold text-blue-600">$${Math.round(
                  finalExpected
                ).toLocaleString()}</div>
            </div>
            <div>
                <div>Target Goal: $${targetAmount.toLocaleString()}</div>
                <div class="font-bold ${
                  targetMet ? "text-green-600" : "text-red-600"
                }">
                    ${targetMet ? "On Track" : "Not On Track"} 
                    (${Math.round(targetMetProbability)}% probability)
                </div>
            </div>
        </div>
    `;

  projectionContainer.appendChild(summaryDiv);
}

<<<<<<< Updated upstream
// Create risk dial chart
function createRiskDialChart(riskProfile) {
  const canvas = document.getElementById("risk-dial-chart");
  const ctx = canvas.getContext("2d");

  // Define risk levels and their positions
  const riskLevels = [
    "Very Conservative",
    "Conservative",
    "Moderate",
    "Growth-Oriented",
    "Aggressive",
  ];
  const riskIndex = riskLevels.indexOf(riskProfile);

  // Create gauge chart
  const gauge = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [1, 1, 1, 1, 1, 4], // 5 segments + empty center
          backgroundColor: [
            "#1E40AF", // Very Conservative - Dark Blue
            "#3B82F6", // Conservative - Blue
            "#10B981", // Moderate - Green
            "#F59E0B", // Growth-Oriented - Yellow
            "#EF4444", // Aggressive - Red
            "rgba(0, 0, 0, 0)", // Transparent center
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      circumference: 180,
      rotation: -90,
      cutout: "70%",
      plugins: {
        tooltip: {
          enabled: false,
        },
        legend: {
          display: false,
        },
      },
    },
  });

  // Add needle
  const angle = Math.PI * (0.5 - riskIndex / 5);
  const needleLength = 90;
  const centerX = canvas.width / 2;
  const centerY = canvas.height - 30;

  // Clear previous needle
  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw new needle
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(needleLength * Math.cos(angle), -needleLength * Math.sin(angle));
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Add needle center point
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();

  ctx.restore();

  // Add labels
  ctx.textAlign = "center";
  ctx.font = "10px Arial";

  const labelRadius = 115;
  for (let i = 0; i < riskLevels.length; i++) {
    const labelAngle = Math.PI * (0.5 - i / 5);
    const x = centerX + labelRadius * Math.cos(labelAngle);
    const y = centerY - labelRadius * Math.sin(labelAngle);

    ctx.fillStyle = i === riskIndex ? "black" : "#666";
    ctx.font = i === riskIndex ? "bold 10px Arial" : "10px Arial";
    ctx.fillText(riskLevels[i], x, y);
  }
}

// Calculate projections for portfolio growth
function calculateProjections(
  initialInvestment,
  monthlyContribution,
  annualReturn,
  annualVolatility,
  years
) {
  const yearsArray = Array.from({ length: years + 1 }, (_, i) => i);
  const expected = [];
  const upperBound = [];
  const lowerBound = [];

  // Monthly return and volatility
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthlyVolatility = annualVolatility / Math.sqrt(12);

  // Calculate values for each year
  for (let year = 0; year <= years; year++) {
    // Number of months
    const months = year * 12;

    // Expected value
    let expectedValue = initialInvestment * Math.pow(1 + monthlyReturn, months);

    // Add monthly contributions
    if (monthlyContribution > 0) {
      // Future value of annuity formula
      expectedValue +=
        monthlyContribution *
        ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
    }

    // Calculate bounds using log-normal distribution properties
    const timeInYears = year;
    const mu =
      Math.log(initialInvestment) +
      (annualReturn - 0.5 * Math.pow(annualVolatility, 2)) * timeInYears;
    const sigma = annualVolatility * Math.sqrt(timeInYears);

    // 25th and 75th percentiles
    const z25 = -0.675; // Approximate z-score for 25th percentile
    const z75 = 0.675; // Approximate z-score for 75th percentile

    let lowerValue = Math.exp(mu + sigma * z25);
    let upperValue = Math.exp(mu + sigma * z75);

    // Add monthly contributions to bounds (simplified)
    if (monthlyContribution > 0 && year > 0) {
      const contributionGrowth =
        monthlyContribution *
        ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
      lowerValue +=
        contributionGrowth *
        (1 + z25 * annualVolatility * Math.sqrt(timeInYears / 2));
      upperValue +=
        contributionGrowth *
        (1 + z75 * annualVolatility * Math.sqrt(timeInYears / 2));
    }

    expected.push(expectedValue);
    lowerBound.push(Math.max(lowerValue, 0)); // Ensure non-negative
    upperBound.push(upperValue);
  }

  return {
    years: yearsArray,
    expected,
    lowerBound,
    upperBound,
  };
}
=======
/*
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
*/
>>>>>>> Stashed changes
