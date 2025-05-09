/**
 * Chart Creation Functions for Robo Advisor
 * Creates and updates all visualization elements
 */

// Create correlation heatmap
function createCorrelationHeatmap() {
  // 1) get your fund names and tickers
  const fundNames = Object.keys(fundData);
  // if you have a mapping name→ticker, use it; otherwise fall back to full name
  const labels = fundNames.map(
    (nm) => (fundsWithTickers && fundsWithTickers[nm]) || nm
  );

  // 2) compute the correlation matrix
  const corr = calculateCorrelationMatrix(covarianceMatrix);

  // 3) build the Plotly trace
  const trace = {
    z: corr,
    x: labels,
    y: labels,
    type: "heatmap",
    colorscale: [
      [0, "rgb(33,102,172)"], // deep blue at -1
      [0.5, "rgb(255,255,255)"], // white at 0
      [1, "rgb(178,24,43)"], // deep red at +1
    ],
    zmin: -1,
    zmax: 1,
    hovertemplate: "x: %{x}<br>y: %{y}<br>corr: %{z:.2f}<extra></extra>",
  };

  // 4) layout tweaks
  const layout = {
    title: "Fund Correlation Matrix",
    xaxis: { tickangle: -45 },
    yaxis: { autorange: "reversed" }, // so the first label is at top
    margin: { l: 80, b: 100, t: 50, r: 50 },
  };

  // 5) render it
  Plotly.newPlot("correlation-heatmap", [trace], layout, { responsive: true });
}

// Create risk-return scatter plot
function createRiskReturnScatter() {
  const fundNames = Object.keys(fundData);
  const labels = fundNames.map(
    (nm) => (fundsWithTickers && fundsWithTickers[nm]) || nm
  );

  const returns = fundNames.map((nm) => fundData[nm].annualizedReturn);
  const vols = fundNames.map((nm) => fundData[nm].annualizedVolatility);
  const sharpes = fundNames.map((nm) => fundData[nm].sharpeRatio);

  // 3) bubble sizes (min 10 → max ~30)
  const sizes = sharpes.map((s) => Math.max(10, 10 + 20 * s));

  const colors = fundNames.map((nm) => {
    const ac = fundData[nm].assetClass.toLowerCase();
    if (ac.includes("equity")) return "rgb(59,130,246)"; // blue
    if (ac.includes("fixed income")) return "rgb(16,185,129)"; // green
    if (ac.includes("alternative")) return "rgb(245,158,11)"; // yellow
    return "rgb(156,163,175)"; // gray
  });

  const trace = {
    x: vols,
    y: returns,
    mode: "markers+text",
    type: "scatter",
    text: labels,
    textposition: "top center",
    hovertemplate:
      "<b>%{text}</b><br>" +
      "Return: %{y:.2%}<br>" +
      "Volatility: %{x:.2%}<br>" +
      "Sharpe: %{marker.size:.0f}<extra></extra>",
    marker: {
      size: sizes,
      color: colors,
      opacity: 0.8,
      line: { width: 1, color: "rgb(229,231,235)" },
    },
  };

  const layout = {
    title: "Risk vs. Return",
    xaxis: {
      title: "Annualized Volatility",
      tickformat: ".0%",
      zeroline: true, // ← show the 0% vertical line
      zerolinecolor: "#ccc",
      zerolinewidth: 1,
      showgrid: true,
    },
    yaxis: {
      title: "Annualized Return",
      tickformat: ".0%",
      zeroline: true, // ← show the 0% horizontal line
      zerolinecolor: "#ccc",
      zerolinewidth: 1,
      showgrid: true,
    },
    margin: { l: 60, r: 20, t: 40, b: 60 },
    hovermode: "closest",
  };

  Plotly.newPlot("risk-return-scatter", [trace], layout, { responsive: true });
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
    Alternative: "rgb(139, 92, 246)",
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

// Streamlined createEfficientFrontierChart function
function createEfficientFrontierChart() {
  // Get the container element
  const container = document.getElementById("efficient-frontier-chart");

  // Set a taller height for the chart
  container.style.height = "500px";

  // Use the existing efficient frontier data from portfolio_data.json
  if (
    !efficientFrontierData ||
    Object.keys(efficientFrontierData).length === 0
  ) {
    console.error("Efficient frontier data not available");
    return;
  }

  const fundNames = Object.keys(fundData);

  // Extract annualized returns and volatilities for individual funds
  const meanReturns = fundNames.map((fund) => fundData[fund].annualizedReturn);
  const volatilities = fundNames.map(
    (fund) => fundData[fund].annualizedVolatility
  );

  // Get the efficient frontier data (use no short sales version)
  const ef = efficientFrontierData.ef_no_short;

  // Get key portfolio points
  const gmvp = efficientFrontierData.gmvp_no_short;
  const marketPortfolio = efficientFrontierData.market_portfolio_no_short;

  // Risk-free rate and calculate Capital Market Line
  const riskFreeRate = 0.0255; // 2.55% risk-free rate
  const cmlVolatilities = [0, marketPortfolio.volatility * 2];
  const cmlReturns = cmlVolatilities.map(
    (vol) => riskFreeRate + marketPortfolio.sharpe * vol
  );

  // Current Portfolio from app state
  const currentReturn = appState.optimalPortfolio.stats.return;
  const currentVolatility = appState.optimalPortfolio.stats.volatility;

  // Create the plot data
  const data = [
    // Efficient Frontier
    {
      x: ef.volatilities,
      y: ef.returns,
      mode: "lines",
      name: "Efficient Frontier",
      line: {
        color: "rgb(0, 150, 136)",
        width: 3,
        shape: "spline", // Use spline interpolation for smoother curve
        smoothing: 1.3, // Add smoothing for a nicer curve
      },
    },
    // Capital Market Line
    {
      x: cmlVolatilities,
      y: cmlReturns,
      mode: "lines",
      name: "Capital Market Line",
      line: {
        color: "rgb(255, 152, 0)",
        width: 2,
        dash: "dash",
      },
    },
    // Global Minimum Variance Portfolio
    {
      x: [gmvp.volatility],
      y: [gmvp.return],
      mode: "markers",
      name: "Global Minimum Variance Portfolio",
      marker: {
        color: "rgb(3, 169, 244)",
        size: 12,
        symbol: "diamond",
      },
    },
    // Market Portfolio (Maximum Sharpe)
    {
      x: [marketPortfolio.volatility],
      y: [marketPortfolio.return],
      mode: "markers",
      name: "Market Portfolio",
      marker: {
        color: "rgb(255, 193, 7)",
        size: 12,
        symbol: "star",
      },
    },
    // Current Portfolio - centered exactly on the frontier
    {
      x: [currentVolatility],
      y: [currentReturn],
      mode: "markers",
      name: `${appState.riskProfile} Portfolio (Current)`,
      marker: {
        color: "rgb(76, 175, 80)",
        size: 15,
        symbol: "circle",
        line: {
          color: "black",
          width: 2,
        },
      },
    },
    // Individual Funds
    {
      x: volatilities,
      y: meanReturns,
      mode: "markers+text",
      name: "Individual Funds",
      text: fundNames.map((name) => name.split(" ")[0]), // First word of fund name
      textposition: "top",
      hoverinfo: "text+x+y",
      marker: {
        color: "rgb(158, 158, 158)",
        size: 8,
        symbol: "circle",
      },
    },
  ];

  // Create the layout
  const layout = {
    title: "Efficient Frontier Analysis",
    xaxis: {
      title: "Annualized Volatility (Risk)",
      tickformat: ".1%",
      zeroline: false,
      rangemode: "tozero",
    },
    yaxis: {
      title: "Annualized Return",
      tickformat: ".1%",
      zeroline: false,
    },
    showlegend: true,
    legend: {
      x: 0.01,
      y: 0.99,
      bgcolor: "rgba(255, 255, 255, 0.8)",
      bordercolor: "rgba(0, 0, 0, 0.1)",
      borderwidth: 1,
    },
    hovermode: "closest",
    height: 500, // Taller chart
    plot_bgcolor: "rgba(240, 242, 245, 0.8)",
    paper_bgcolor: "rgba(255, 255, 255, 1)",
    annotations: [
      {
        x: gmvp.volatility,
        y: gmvp.return,
        xref: "x",
        yref: "y",
        text: "GMVP",
        showarrow: true,
        arrowhead: 2,
        ax: -15,
        ay: -30,
      },
      {
        x: marketPortfolio.volatility,
        y: marketPortfolio.return,
        xref: "x",
        yref: "y",
        text: "Market Portfolio",
        showarrow: true,
        arrowhead: 2,
        ax: 25,
        ay: -30,
      },
      {
        x: currentVolatility,
        y: currentReturn,
        xref: "x",
        yref: "y",
        text: appState.riskProfile + " Portfolio",
        showarrow: true,
        arrowhead: 2,
        ax: 25,
        ay: 30,
      },
      {
        x: 0.01,
        y: 0.0255,
        xref: "paper",
        yref: "paper",
        text: "Risk-Free Rate: 2.55%",
        showarrow: false,
        font: {
          size: 12,
          color: "rgba(100, 100, 100, 1)",
        },
        bgcolor: "rgba(255, 255, 255, 0.7)",
        borderpad: 4,
      },
    ],
  };

  // Create the plot
  Plotly.newPlot(container, data, layout, { responsive: true });
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
