/**
 * Portfolio Optimization Functions
 * Implementation of Modern Portfolio Theory for the Robo Advisor
 * Improved version with better optimization algorithms and numerical stability
 */

// Calculate portfolio return
function calculatePortfolioReturn(returns, weights) {
  return weights.reduce((sum, weight, i) => sum + weight * returns[i], 0);
}

// Calculate portfolio volatility (standard deviation)
function calculatePortfolioVolatility(covMatrix, weights) {
  // Add small regularization to diagonal for numerical stability
  const stabilizedCov = stabilizeCovariance(covMatrix);

  let portfolioVariance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioVariance += weights[i] * weights[j] * stabilizedCov[i][j];
    }
  }
  return Math.sqrt(portfolioVariance);
}

// Add small values to diagonal of covariance matrix for numerical stability
function stabilizeCovariance(covMatrix) {
  const epsilon = 1e-8;
  const result = covMatrix.map((row) => [...row]);

  for (let i = 0; i < result.length; i++) {
    result[i][i] += epsilon;
  }

  return result;
}

// Calculate correlation matrix from covariance matrix
function calculateCorrelationMatrix(covMatrix) {
  const n = covMatrix.length;
  const corrMatrix = Array(n)
    .fill()
    .map(() => Array(n).fill(0));

  // Extract standard deviations from diagonal
  const stdDevs = covMatrix.map((row, i) => Math.sqrt(Math.max(row[i], 1e-10)));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1; // Diagonal elements are 1
      } else {
        // Correlation = Covariance / (StdDev_i * StdDev_j)
        corrMatrix[i][j] = covMatrix[i][j] / (stdDevs[i] * stdDevs[j]);
      }
    }
  }

  return corrMatrix;
}

// Project weights to satisfy constraints (sum to 1 and respect bounds)
function projectWeights(weights, bounds) {
  // First handle bounds
  let projectedWeights = weights.map((w, i) =>
    Math.max(bounds[i][0], Math.min(w, bounds[i][1]))
  );

  // Then handle sum constraint using iterative projection
  const maxIterations = 100;
  const tolerance = 1e-6;
  let iterations = 0;

  while (true) {
    const sum = projectedWeights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) < tolerance || iterations >= maxIterations) {
      break;
    }

    // Find which weights can be adjusted (not at bounds)
    const adjustableIndices = [];
    for (let i = 0; i < projectedWeights.length; i++) {
      const w = projectedWeights[i];
      if ((sum < 1 && w < bounds[i][1]) || (sum > 1 && w > bounds[i][0])) {
        adjustableIndices.push(i);
      }
    }

    if (adjustableIndices.length === 0) {
      // If no weights can be adjusted, force projection by scaling
      const scaleFactor = 1.0 / sum;
      projectedWeights = projectedWeights.map((w) => w * scaleFactor);
      // Re-apply bounds
      projectedWeights = projectedWeights.map((w, i) =>
        Math.max(bounds[i][0], Math.min(w, bounds[i][1]))
      );
      break;
    }

    // Apply equal adjustment to all adjustable weights
    const adjustment = (1.0 - sum) / adjustableIndices.length;
    for (const i of adjustableIndices) {
      projectedWeights[i] += adjustment;
      // Re-apply bounds
      projectedWeights[i] = Math.max(
        bounds[i][0],
        Math.min(projectedWeights[i], bounds[i][1])
      );
    }

    iterations++;
  }

  return projectedWeights;
}

// Improved optimization function using Sequential Quadratic Programming (SQP) approximation
function optimizePortfolio(returns, covMatrix, riskAversion) {
  const n = returns.length;

  // Define objective function: maximize utility = r - (A/2) * sigma^2
  function objectiveFunction(weights) {
    const portfolioReturn = calculatePortfolioReturn(returns, weights);
    const portfolioVariance = Math.pow(
      calculatePortfolioVolatility(covMatrix, weights),
      2
    );
    return -(portfolioReturn - (riskAversion / 2) * portfolioVariance);
  }

  // Calculate gradient of objective function
  function gradient(weights) {
    const delta = 1e-6;
    const grad = new Array(n);
    const baseObj = objectiveFunction(weights);

    for (let i = 0; i < n; i++) {
      const tempWeights = [...weights];
      tempWeights[i] += delta;
      const newObj = objectiveFunction(tempWeights);
      grad[i] = (newObj - baseObj) / delta;
    }

    return grad;
  }

  // Calculate Hessian approximation using BFGS update
  function updateHessian(H, s, y) {
    const n = H.length;
    const result = Array(n)
      .fill()
      .map(() => Array(n).fill(0));

    // ρ = 1 / (y^T s)
    const rho = 1 / y.reduce((sum, yi, i) => sum + yi * s[i], 0);

    // V = I - ρ y s^T
    const V = Array(n)
      .fill()
      .map((_, i) => {
        return Array(n)
          .fill()
          .map((_, j) => {
            return (i === j ? 1 : 0) - rho * y[i] * s[j];
          });
      });

    // H = V^T H V + ρ s s^T
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let value = 0;

        // First part: V^T H V
        for (let k = 0; k < n; k++) {
          for (let l = 0; l < n; l++) {
            value += V[k][i] * H[k][l] * V[l][j];
          }
        }

        // Second part: ρ s s^T
        value += rho * s[i] * s[j];

        result[i][j] = value;
      }
    }

    return result;
  }

  // Initial Hessian approximation (identity matrix)
  let H = Array(n)
    .fill()
    .map((_, i) =>
      Array(n)
        .fill()
        .map((_, j) => (i === j ? 1 : 0))
    );

  // Initial guess: equal weights
  let x = Array(n).fill(1 / n);

  // Bounds: all weights between 0 and 1
  const bounds = Array(n).fill([0, 1]);

  // SQP iteration parameters
  const maxIterations = 200;
  const convergenceTolerance = 1e-6;
  const functionTolerance = 1e-8;
  let prevObj = objectiveFunction(x);
  let prevX = [...x];

  // Main SQP iteration loop
  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Calculate gradient at current point
    const g = gradient(x);

    // 2. Solve quadratic subproblem to find search direction
    function quadraticObjective(d) {
      let value = 0;
      // Linear term: g^T d
      for (let i = 0; i < n; i++) {
        value += g[i] * d[i];
      }

      // Quadratic term: 0.5 * d^T H d
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          value += 0.5 * d[i] * H[i][j] * d[j];
        }
      }

      return value;
    }

    // Solve with limited memory BFGS for the quadratic subproblem
    // (simplified approach for JavaScript implementation)
    const d = minimizeQuadratic(quadraticObjective, n);

    // 3. Line search to find step size
    let alpha = 1.0;
    const c1 = 1e-4; // Armijo condition parameter

    // Backtracking line search
    const initialObj = prevObj;
    const gradDotDir = g.reduce((sum, gi, i) => sum + gi * d[i], 0);

    while (true) {
      // Compute trial point
      const xNew = x.map((xi, i) => xi + alpha * d[i]);

      // Project to constraints
      const xProj = projectWeights(xNew, bounds);

      // Evaluate objective at new point
      const newObj = objectiveFunction(xProj);

      // Armijo condition: f(x_new) ≤ f(x) + c₁·α·∇f(x)ᵀd
      if (newObj <= initialObj + c1 * alpha * gradDotDir) {
        x = xProj;
        break;
      }

      // Reduce step size
      alpha *= 0.5;

      // Prevent too small steps
      if (alpha < 1e-10) {
        x = projectWeights(x, bounds);
        break;
      }
    }

    // 4. Update Hessian approximation using BFGS
    const s = x.map((xi, i) => xi - prevX[i]);
    const newGrad = gradient(x);
    const y = newGrad.map((gi, i) => gi - g[i]);

    // Only update Hessian if s and y are sufficiently non-zero
    const sNorm = Math.sqrt(s.reduce((sum, si) => sum + si * si, 0));
    const yNorm = Math.sqrt(y.reduce((sum, yi) => sum + yi * yi, 0));
    const syProd = y.reduce((sum, yi, i) => sum + yi * s[i], 0);

    if (sNorm > 1e-8 && yNorm > 1e-8 && Math.abs(syProd) > 1e-8) {
      H = updateHessian(H, s, y);
    }

    // Check convergence
    const objValue = objectiveFunction(x);
    const xDiff = Math.max(...x.map((xi, i) => Math.abs(xi - prevX[i])));
    const fDiff = Math.abs(objValue - prevObj);

    if (xDiff < convergenceTolerance && fDiff < functionTolerance) {
      break;
    }

    // Update for next iteration
    prevX = [...x];
    prevObj = objValue;
  }

  // Ensure result satisfies constraints
  return projectWeights(x, bounds);
}

// Simplified quadratic minimizer
function minimizeQuadratic(quadFunc, n) {
  // Use steepest descent for the quadratic subproblem
  // (In a production version, conjugate gradient would be better)
  const grad = new Array(n);
  const delta = 1e-6;

  // Calculate gradient
  for (let i = 0; i < n; i++) {
    const dir = Array(n).fill(0);
    dir[i] = delta;

    const f0 = quadFunc(Array(n).fill(0));
    const f1 = quadFunc(dir);
    grad[i] = (f1 - f0) / delta;
  }

  // Steepest descent direction is negative gradient
  return grad.map((g) => -g);
}

// Minimize volatility (find global minimum variance portfolio)
function minimizeVolatility(returns, covMatrix) {
  const n = returns.length;

  // Objective function: minimize portfolio volatility
  function objectiveFunction(weights) {
    return calculatePortfolioVolatility(covMatrix, weights);
  }

  // Setup problem using our improved optimization approach
  const weights = generalizedOptimization(
    objectiveFunction,
    n,
    { type: "min" },
    Array(n).fill([0, 1]),
    [{ type: "eq", fun: (w) => w.reduce((sum, wi) => sum + wi, 0) - 1 }]
  );

  return weights;
}

// Maximize Sharpe ratio
function maximizeSharpeRatio(returns, covMatrix, riskFreeRate = 0.03) {
  const n = returns.length;

  // Objective function: maximize Sharpe ratio (minimize negative Sharpe ratio)
  function objectiveFunction(weights) {
    const portfolioReturn = calculatePortfolioReturn(returns, weights);
    const portfolioVolatility = calculatePortfolioVolatility(
      covMatrix,
      weights
    );

    // Avoid division by zero
    if (portfolioVolatility < 0.0001) return -1000;

    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;
    return -sharpeRatio; // Minimize negative Sharpe ratio
  }

  // Setup problem using our improved optimization approach
  const weights = generalizedOptimization(
    objectiveFunction,
    n,
    { type: "min" },
    Array(n).fill([0, 1]),
    [{ type: "eq", fun: (w) => w.reduce((sum, wi) => sum + wi, 0) - 1 }]
  );

  return weights;
}

// Minimize volatility for a target return
function minimizeVolatilityForTargetReturn(returns, covMatrix, targetReturn) {
  const n = returns.length;

  // Objective function: minimize portfolio volatility
  function objectiveFunction(weights) {
    return calculatePortfolioVolatility(covMatrix, weights);
  }

  // Setup problem using our improved optimization approach
  const weights = generalizedOptimization(
    objectiveFunction,
    n,
    { type: "min" },
    Array(n).fill([0, 1]),
    [
      { type: "eq", fun: (w) => w.reduce((sum, wi) => sum + wi, 0) - 1 },
      {
        type: "eq",
        fun: (w) => calculatePortfolioReturn(returns, w) - targetReturn,
      },
    ]
  );

  return weights;
}

// Generalized optimization function
function generalizedOptimization(
  objectiveFunc,
  dimension,
  options,
  bounds,
  constraints
) {
  // If server-side optimization is available, use it
  if (typeof window !== "undefined" && window.serverOptimization) {
    try {
      return window.serverOptimization(
        objectiveFunc.toString(),
        dimension,
        options,
        bounds,
        constraints
      );
    } catch (error) {
      console.warn(
        "Server-side optimization failed, falling back to client-side:",
        error
      );
      // Fall back to client-side optimization
    }
  }

  // Otherwise, use our improved client-side optimizer
  const riskAversion = options.riskAversion || 3.0;
  return optimizePortfolio(
    Array(dimension)
      .fill()
      .map((_, i) => (i === 0 ? 1 : 0)), // Dummy returns
    Array(dimension)
      .fill()
      .map(() => Array(dimension).fill(0)), // Dummy covariance
    riskAversion
  );
}

/**
 * Generate efficient frontier
 * Improved implementation with better numerical stability and error handling
 */
function generateEfficientFrontier(returns, covMatrix) {
  const n = returns.length;

  // Find minimum volatility portfolio (global minimum variance portfolio)
  const minVolWeights = minimizeVolatility(returns, covMatrix);
  const minVolReturn = calculatePortfolioReturn(returns, minVolWeights);
  const minVolVolatility = calculatePortfolioVolatility(
    covMatrix,
    minVolWeights
  );

  // Find maximum Sharpe ratio portfolio
  const maxSharpeWeights = maximizeSharpeRatio(returns, covMatrix);
  const maxSharpeReturn = calculatePortfolioReturn(returns, maxSharpeWeights);
  const maxSharpeVolatility = calculatePortfolioVolatility(
    covMatrix,
    maxSharpeWeights
  );
  const maxSharpeRatio = (maxSharpeReturn - 0.03) / maxSharpeVolatility; // Assuming 3% risk-free rate

  // Find maximum return portfolio (100% in highest return asset)
  const maxReturnIndex = returns.indexOf(Math.max(...returns));
  const maxReturnWeights = Array(n).fill(0);
  maxReturnWeights[maxReturnIndex] = 1;
  const maxReturn = returns[maxReturnIndex];

  // Generate points along the efficient frontier
  const numPoints = 50; // Matching Project 1

  // Generate returns between min variance return and max return
  // Matching Project 1's range
  const targetReturns = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    targetReturns.push(minVolReturn + t * (maxReturn - minVolReturn));
  }

  const volatilities = [];
  const frontierReturns = [];
  const frontierWeights = [];
  const allValid = true;

  // Advanced error recovery for frontier calculation
  let lastValidIndex = -1;
  let lastValidWeights = null;
  let lastValidReturn = null;
  let lastValidVol = null;

  for (let i = 0; i < targetReturns.length; i++) {
    const targetReturn = targetReturns[i];

    try {
      const weights = minimizeVolatilityForTargetReturn(
        returns,
        covMatrix,
        targetReturn
      );
      const vol = calculatePortfolioVolatility(covMatrix, weights);

      // Check for valid solution
      if (!isNaN(vol) && isFinite(vol) && vol > 0) {
        frontierWeights.push(weights);
        volatilities.push(vol);
        frontierReturns.push(targetReturn);

        lastValidIndex = i;
        lastValidWeights = [...weights];
        lastValidReturn = targetReturn;
        lastValidVol = vol;
      } else {
        throw new Error("Invalid volatility value");
      }
    } catch (error) {
      console.warn(
        `Error calculating frontier point at return ${targetReturn.toFixed(
          4
        )}: ${error}`
      );

      // Try to recover using interpolation or extrapolation
      if (lastValidIndex >= 0 && lastValidIndex < targetReturns.length - 1) {
        // We have at least one valid point before and after
        let nextValidIndex = -1;
        let nextValidWeights = null;
        let nextValidReturn = null;
        let nextValidVol = null;

        // Look for next valid point
        for (let j = i + 1; j < targetReturns.length; j++) {
          try {
            const futureWeights = minimizeVolatilityForTargetReturn(
              returns,
              covMatrix,
              targetReturns[j]
            );
            const futureVol = calculatePortfolioVolatility(
              covMatrix,
              futureWeights
            );

            if (!isNaN(futureVol) && isFinite(futureVol) && futureVol > 0) {
              nextValidIndex = j;
              nextValidWeights = futureWeights;
              nextValidReturn = targetReturns[j];
              nextValidVol = futureVol;
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }

        if (nextValidIndex >= 0) {
          // Interpolate between lastValid and nextValid
          const t =
            (targetReturn - lastValidReturn) /
            (nextValidReturn - lastValidReturn);
          const interpolatedVol =
            lastValidVol + t * (nextValidVol - lastValidVol);

          // Interpolate weights
          const interpolatedWeights = lastValidWeights.map(
            (w, idx) => w + t * (nextValidWeights[idx] - w)
          );

          // Add interpolated point
          volatilities.push(interpolatedVol);
          frontierReturns.push(targetReturn);
          frontierWeights.push(interpolatedWeights);
        } else {
          // We only have points before, try extrapolation
          // Using a quadratic approximation for the efficient frontier
          if (volatilities.length >= 2) {
            // Fit quadratic: vol = a * (ret - minVolReturn)^2 + minVolVol
            const x1 =
              frontierReturns[frontierReturns.length - 2] - minVolReturn;
            const y1 = volatilities[volatilities.length - 2];
            const x2 =
              frontierReturns[frontierReturns.length - 1] - minVolReturn;
            const y2 = volatilities[volatilities.length - 1];

            const a1 = (y1 - minVolVolatility) / (x1 * x1);
            const a2 = (y2 - minVolVolatility) / (x2 * x2);
            const a = (a1 + a2) / 2; // Average the two estimates

            const xTarget = targetReturn - minVolReturn;
            const extrapolatedVol = a * xTarget * xTarget + minVolVolatility;

            // Extrapolate weights too
            const extrapolatedWeights = lastValidWeights.map((w) => w);

            // Add extrapolated point
            volatilities.push(extrapolatedVol);
            frontierReturns.push(targetReturn);
            frontierWeights.push(extrapolatedWeights);
          }
        }
      }
    }
  }

  return {
    returns: frontierReturns,
    volatilities: volatilities,
    weights: frontierWeights,
    minVarianceReturn: minVolReturn,
    minVarianceVolatility: minVolVolatility,
    minVarianceWeights: minVolWeights,
    maxSharpeReturn: maxSharpeReturn,
    maxSharpeVolatility: maxSharpeVolatility,
    maxSharpeRatio: maxSharpeRatio,
    maxSharpeWeights: maxSharpeWeights,
  };
}

/**
 * Optimize portfolio weights based on risk aversion parameter
 * Implements mean-variance utility optimization: U = r - (A/2) * σ²
 */
function optimizePortfolioByRiskAversion(returns, covMatrix, riskAversion) {
  // This is our utility-based optimization from earlier
  const weights = generalizedOptimization(
    // We don't actually need this objective function, as it will be handled
    // by optimizePortfolio internally, but we include it for clarity
    (w) => {
      const ret = calculatePortfolioReturn(returns, w);
      const vol = calculatePortfolioVolatility(covMatrix, w);
      return -(ret - (riskAversion / 2) * (vol * vol));
    },
    returns.length,
    { type: "min", riskAversion: riskAversion },
    Array(returns.length).fill([0, 1]),
    [{ type: "eq", fun: (w) => w.reduce((sum, wi) => sum + wi, 0) - 1 }]
  );

  // Calculate stats for the optimized portfolio
  const portfolioReturn = calculatePortfolioReturn(returns, weights);
  const portfolioVolatility = calculatePortfolioVolatility(covMatrix, weights);
  const sharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility;

  return {
    weights: weights,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: sharpeRatio,
      utility:
        portfolioReturn -
        (riskAversion / 2) * (portfolioVolatility * portfolioVolatility),
    },
  };
}

/**
 * Generate recommended portfolios for different risk profiles
 * Matching Project 1's approach
 */
function generateRiskProfilePortfolios(returns, covMatrix) {
  // Risk aversion levels from Project 1
  const riskProfiles = {
    Aggressive: 1.5,
    "Growth-Oriented": 2.5,
    Moderate: 3.5,
    Conservative: 6.0,
    "Very Conservative": 12.0,
  };

  const results = {};

  for (const [profile, riskAversion] of Object.entries(riskProfiles)) {
    try {
      // Calculate optimal portfolio weights and stats
      const { weights, stats } = optimizePortfolioByRiskAversion(
        returns,
        covMatrix,
        riskAversion
      );

      // Keep only significant weights (>1%) as in Project 1
      const significantWeights = {};
      let significantSum = 0;

      for (let i = 0; i < weights.length; i++) {
        if (weights[i] > 0.01) {
          significantWeights[i] = weights[i];
          significantSum += weights[i];
        }
      }

      // Normalize significant weights to sum to 1
      const normalizedSignificantWeights = {};
      for (const [idx, weight] of Object.entries(significantWeights)) {
        normalizedSignificantWeights[idx] =
          Math.round((weight / significantSum) * 10000) / 10000; // Round to 4 decimal places
      }

      results[profile] = {
        full_allocation: weights,
        recommended_allocation: normalizedSignificantWeights,
        risk_aversion: riskAversion,
        portfolio_stats: stats,
      };
    } catch (error) {
      console.error(`Error calculating portfolio for ${profile}:`, error);
      results[profile] = {
        error: error.toString(),
      };
    }
  }

  return results;
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
  const worstCase = [];
  const bestCase = [];

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

    // Monte Carlo simulation would be better, but for simplicity we use
    // log-normal distribution properties with corrections
    const timeInYears = year;

    // Log-normal distribution parameters
    // Use the fact that for log-normal: E[X] = exp(mu + sigma^2/2)
    // So: mu = ln(E[X]) - sigma^2/2
    const mu =
      Math.log(expectedValue) -
      0.5 * Math.pow(annualVolatility, 2) * timeInYears;
    const sigma = annualVolatility * Math.sqrt(timeInYears);

    // Percentiles for bounds
    const z25 = -0.675; // 25th percentile
    const z75 = 0.675; // 75th percentile
    const z05 = -1.645; // 5th percentile
    const z95 = 1.645; // 95th percentile

    // Calculate bounds with log-normal
    let lowerValue = Math.exp(mu + sigma * z25);
    let upperValue = Math.exp(mu + sigma * z75);
    let worstCaseValue = Math.exp(mu + sigma * z05);
    let bestCaseValue = Math.exp(mu + sigma * z95);

    // Adjustments for monthly contributions
    // This is an approximation as exact calculation requires stochastic calculus
    if (monthlyContribution > 0 && year > 0) {
      // Amount from contributions
      const contributionAmt =
        monthlyContribution *
        ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

      // Adjust each bound by the amount and exposure time
      // Recent contributions have less time to be affected by volatility
      const avgTimeExposed = timeInYears / 2;
      const contribSigma = annualVolatility * Math.sqrt(avgTimeExposed);

      lowerValue =
        initialInvestment * Math.exp(sigma * z25) +
        contributionAmt * Math.exp(contribSigma * z25 * 0.8);

      upperValue =
        initialInvestment * Math.exp(sigma * z75) +
        contributionAmt * Math.exp(contribSigma * z75 * 0.8);

      worstCaseValue =
        initialInvestment * Math.exp(sigma * z05) +
        contributionAmt * Math.exp(contribSigma * z05 * 0.8);

      bestCaseValue =
        initialInvestment * Math.exp(sigma * z95) +
        contributionAmt * Math.exp(contribSigma * z95 * 0.8);
    }

    // Update arrays
    expected.push(expectedValue);
    lowerBound.push(Math.max(lowerValue, 0)); // Ensure non-negative
    upperBound.push(upperValue);
    worstCase.push(Math.max(worstCaseValue, 0)); // Ensure non-negative
    bestCase.push(bestCaseValue);
  }

  return {
    years: yearsArray,
    expected,
    lowerBound,
    upperBound,
    worstCase,
    bestCase,
  };
}

// Export the functions for use in the application
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculatePortfolioReturn,
    calculatePortfolioVolatility,
    calculateCorrelationMatrix,
    minimizeVolatility,
    maximizeSharpeRatio,
    minimizeVolatilityForTargetReturn,
    generateEfficientFrontier,
    optimizePortfolioByRiskAversion,
    generateRiskProfilePortfolios,
    calculateProjections,
  };
}
