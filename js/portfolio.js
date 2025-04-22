/**
 * Portfolio Optimization Functions
 * Implementation of Modern Portfolio Theory for the Robo Advisor
 */

// Calculate portfolio return
function calculatePortfolioReturn(returns, weights) {
  let portfolioReturn = 0;
  for (let i = 0; i < returns.length; i++) {
    portfolioReturn += returns[i] * weights[i];
  }
  return portfolioReturn;
}

// Calculate portfolio volatility (standard deviation)
function calculatePortfolioVolatility(covMatrix, weights) {
  let portfolioVariance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  return Math.sqrt(portfolioVariance);
}

// Calculate correlation matrix from covariance matrix
function calculateCorrelationMatrix(covMatrix) {
  const n = covMatrix.length;
  const corrMatrix = Array(n)
    .fill()
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1; // Diagonal elements are 1
      } else {
        // Correlation = Covariance / (StdDev_i * StdDev_j)
        const stdDev_i = Math.sqrt(covMatrix[i][i]);
        const stdDev_j = Math.sqrt(covMatrix[j][j]);
        corrMatrix[i][j] = covMatrix[i][j] / (stdDev_i * stdDev_j);
      }
    }
  }

  return corrMatrix;
}

// Optimize portfolio based on risk aversion parameter
/*function optimizePortfolio(returns, covMatrix, riskAversion) {
  // Linear map of A ∈ [1.5,12] → target return
  const maxRet = Math.max(...returns);
  const minRet = Math.min(...returns);
  const t = (riskAversion - 1.5) / (12 - 1.5); // normalize to [0,1]
  const targetReturn = maxRet - t * (maxRet - minRet);

  // Use your existing solver
  return minimizeVolatilityForTargetReturn(returns, covMatrix, targetReturn);
  // const n = returns.length;

  // // Define objective function: maximize utility = r - (A/2) * sigma^2
  // function objectiveFunction(weights) {
  //   const portfolioReturn = calculatePortfolioReturn(returns, weights);
  //   const portfolioVariance =
  //     calculatePortfolioVolatility(covMatrix, weights) ** 2;

  //   return -(portfolioReturn - (riskAversion / 2) * portfolioVariance);
  // }

  // // Initial guess: equal weights
  // const initialWeights = Array(n).fill(1 / n);

  // // Constraints: weights sum to 1 and all weights >= 0
  // const constraints = [];

  // // Sum of weights = 1
  // const sumConstraint = {
  //   type: "eq",
  //   fun: function (weights) {
  //     return math.sum(weights) - 1;
  //   },
  // };
  // constraints.push(sumConstraint);

  // // Bounds: all weights between 0 and 1
  // const bounds = Array(n).fill([0, 1]);

  // // Use a simple optimization approach for the browser
  // const optimizedWeights = minimizeNelderMead(
  //   objectiveFunction,
  //   initialWeights,
  //   constraints,
  //   bounds
  // );

  // return optimizedWeights;
}
*/
function optimizePortfolio(
  returns,
  covMatrix,
  riskAversion,
  customConstraints = []
) {
  // Find the global minimum variance portfolio's return as lower bound
  const minVolWeights = minimizeVolatility(returns, covMatrix);
  const minVolReturn = calculatePortfolioReturn(returns, minVolWeights);

  // Find maximum Sharpe ratio portfolio's return as upper bound
  const maxSharpeWeights = maximizeSharpeRatio(returns, covMatrix);
  const maxSharpeReturn = calculatePortfolioReturn(returns, maxSharpeWeights);

  // Map risk aversion to target return between these meaningful bounds
  // Higher risk aversion (conservative) -> closer to min variance
  // Lower risk aversion (aggressive) -> closer to max Sharpe
  const t = (riskAversion - 1.5) / (12 - 1.5); // normalize to [0,1]
  const targetReturn = maxSharpeReturn - t * (maxSharpeReturn - minVolReturn);

  // Use existing solver with additional constraints
  return minimizeVolatilityForTargetReturn(
    returns,
    covMatrix,
    targetReturn,
    customConstraints
  );
}

// Minimize volatility (find global minimum variance portfolio)
function minimizeVolatility(returns, covMatrix) {
  const n = returns.length;

  // Objective function: minimize portfolio volatility
  function objectiveFunction(weights) {
    return calculatePortfolioVolatility(covMatrix, weights);
  }

  // Initial guess: equal weights
  const initialWeights = Array(n).fill(1 / n);

  // Constraints: weights sum to 1 and all weights >= 0
  const constraints = [
    {
      type: "eq",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
  ];

  // Bounds: all weights between 0 and 1
  const bounds = Array(n).fill([0, 1]);

  // Optimize
  return minimizeNelderMead(
    objectiveFunction,
    initialWeights,
    constraints,
    bounds
  );
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

  // Initial guess: equal weights
  const initialWeights = Array(n).fill(1 / n);

  // Constraints: weights sum to 1 and all weights >= 0
  const constraints = [
    {
      type: "eq",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
  ];

  // Bounds: all weights between 0 and 1
  const bounds = Array(n).fill([0, 1]);

  // Optimize
  return minimizeNelderMead(
    objectiveFunction,
    initialWeights,
    constraints,
    bounds
  );
}

// Minimize volatility for a target return
/*function minimizeVolatilityForTargetReturn(returns, covMatrix, targetReturn) {
  const n = returns.length;

  // Objective function: minimize portfolio volatility
  function objectiveFunction(weights) {
    return calculatePortfolioVolatility(covMatrix, weights);
  }

  // Initial guess: equal weights
  const initialWeights = Array(n).fill(1 / n);

  // Constraints: weights sum to 1, all weights >= 0, and portfolio return = targetReturn
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
        return calculatePortfolioReturn(returns, weights) - targetReturn;
      },
    },
  ];

  // Bounds: all weights between 0 and 1
  const bounds = Array(n).fill([0, 1]);

  // Optimize
  return minimizeNelderMead(
    objectiveFunction,
    initialWeights,
    constraints,
    bounds
  );
}
*/
function minimizeVolatilityForTargetReturn(
  returns,
  covMatrix,
  targetReturn,
  customConstraints = []
) {
  const n = returns.length;

  // Objective function: minimize portfolio volatility
  function objectiveFunction(weights) {
    return calculatePortfolioVolatility(covMatrix, weights);
  }

  // Initial guess: equal weights
  const initialWeights = Array(n).fill(1 / n);

  // Basic constraints: weights sum to 1, all weights >= 0, and portfolio return = targetReturn
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
        return calculatePortfolioReturn(returns, weights) - targetReturn;
      },
    },
    // Add any custom constraints
    ...customConstraints,
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

// Simple Nelder-Mead optimizer (a simplified version for browser environment)
/*function minimizeNelderMead(func, initialX, constraints, bounds, options = {}) {
  const maxIterations = options.maxIterations || 1000;
  const tolerance = options.tolerance || 1e-6;

  // For simplicity, we'll use a penalty method to handle constraints
  function penalizedFunc(x) {
    let penalty = 0;

    // Add penalty for violating bounds
    for (let i = 0; i < x.length; i++) {
      if (x[i] < bounds[i][0]) penalty += 10000 * (bounds[i][0] - x[i]) ** 2;
      if (x[i] > bounds[i][1]) penalty += 10000 * (x[i] - bounds[i][1]) ** 2;
    }

    // Add penalty for violating constraints
    for (const constraint of constraints) {
      if (constraint.type === "eq") {
        const value = constraint.fun(x);
        penalty += 10000 * value ** 2;
      }
    }

    return func(x) + penalty;
  }

  // Very simple optimization approach - gradient descent with projected gradients
  let x = [...initialX];
  let iterCount = 0;
  let step = 0.01;
  let prevValue = penalizedFunc(x);

  while (iterCount < maxIterations) {
    iterCount++;

    // Try to improve each dimension separately
    for (let i = 0; i < x.length; i++) {
      const oldX = x[i];

      // Try a step in positive direction
      x[i] = oldX + step;
      let newValue = penalizedFunc(x);

      // If it doesn't improve, try negative direction
      if (newValue >= prevValue) {
        x[i] = oldX - step;
        newValue = penalizedFunc(x);

        // If neither direction improves, restore original value
        if (newValue >= prevValue) {
          x[i] = oldX;
          continue;
        }
      }

      prevValue = newValue;
    }

    // Reduce step size over time
    step *= 0.95;

    // Check if we've converged
    if (step < tolerance) break;
  }

  // Project back to satisfy the sum constraint (weights sum to 1)
  const sum = math.sum(x);
  if (Math.abs(sum - 1) > tolerance) {
    for (let i = 0; i < x.length; i++) {
      x[i] = x[i] / sum;
    }
  }

  return x;
}
*/
function minimizeNelderMead(func, initialX, constraints, bounds, options = {}) {
  const maxIterations = options.maxIterations || 2000; // Increase iterations
  const tolerance = options.tolerance || 1e-8; // Increase precision

  // For simplicity, we'll use a penalty method to handle constraints
  function penalizedFunc(x) {
    let penalty = 0;

    // Add penalty for violating bounds
    for (let i = 0; i < x.length; i++) {
      if (x[i] < bounds[i][0]) penalty += 10000 * (bounds[i][0] - x[i]) ** 2;
      if (x[i] > bounds[i][1]) penalty += 10000 * (x[i] - bounds[i][1]) ** 2;
    }

    // Add penalty for violating constraints
    for (const constraint of constraints) {
      if (constraint.type === "eq") {
        const value = constraint.fun(x);
        penalty += 10000 * value ** 2;
      } else if (constraint.type === "ineq") {
        // For inequality constraints, penalty if < 0 (constraint violated)
        const value = constraint.fun(x);
        if (value < 0) {
          penalty += 10000 * value ** 2;
        }
      }
    }

    return func(x) + penalty;
  }

  // Very simple optimization approach - gradient descent with projected gradients
  let x = [...initialX];
  let iterCount = 0;
  let step = 0.01;
  let prevValue = penalizedFunc(x);

  // Add convergence history tracking
  let history = [];
  let converged = false;

  while (iterCount < maxIterations && !converged) {
    iterCount++;

    // Try to improve each dimension separately
    for (let i = 0; i < x.length; i++) {
      const oldX = x[i];

      // Try a step in positive direction
      x[i] = oldX + step;
      let newValue = penalizedFunc(x);

      // If it doesn't improve, try negative direction
      if (newValue >= prevValue) {
        x[i] = oldX - step;
        newValue = penalizedFunc(x);

        // If neither direction improves, restore original value
        if (newValue >= prevValue) {
          x[i] = oldX;
          continue;
        }
      }

      prevValue = newValue;
    }

    // Reduce step size over time
    step *= 0.95;

    // Track function value history
    history.push(prevValue);

    // Check for convergence over recent iterations
    if (history.length > 10) {
      const recentValues = history.slice(-10);
      const range = Math.max(...recentValues) - Math.min(...recentValues);
      if (range < tolerance) {
        converged = true;
      }
    }

    // Check if we've converged
    if (step < tolerance) break;
  }

  // Add restart mechanism for potential local minima
  if (!converged && options.restarts) {
    // Try with a different starting point
    const perturbedStart = initialX.map((v) => v + (Math.random() - 0.5) * 0.2);
    return minimizeNelderMead(func, perturbedStart, constraints, bounds, {
      ...options,
      restarts: options.restarts - 1,
    });
  }

  // Project back to satisfy the sum constraint (weights sum to 1)
  const sum = math.sum(x);
  if (Math.abs(sum - 1) > tolerance) {
    for (let i = 0; i < x.length; i++) {
      x[i] = x[i] / sum;
    }
  }

  return x;
}

// Generate efficient frontier
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
  const numPoints = 50;
  const targetReturns = [];

  // Generate returns between min variance return and max return
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    targetReturns.push(minVolReturn + t * (maxReturn - minVolReturn));
  }

  const volatilities = [];
  const frontierReturns = [];

  for (const targetReturn of targetReturns) {
    try {
      const weights = minimizeVolatilityForTargetReturn(
        returns,
        covMatrix,
        targetReturn
      );
      const vol = calculatePortfolioVolatility(covMatrix, weights);
      volatilities.push(vol);
      frontierReturns.push(targetReturn);
    } catch (e) {
      console.error("Error generating frontier point:", e);
    }
  }

  return {
    returns: frontierReturns,
    volatilities: volatilities,
    minVarianceReturn: minVolReturn,
    minVarianceVolatility: minVolVolatility,
    maxSharpeReturn: maxSharpeReturn,
    maxSharpeVolatility: maxSharpeVolatility,
    maxSharpeRatio: maxSharpeRatio,
  };
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
