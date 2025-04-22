/**
 * Enhanced Optimization Functions for Client-Side Use
 *
 * This module provides improved optimization algorithms that can be used
 * within the browser environment without requiring a server-side component.
 *
 * It implements more robust optimization techniques similar to those in Project 1,
 * but adapted to work entirely in JavaScript.
 */

// Import math.js library for matrix operations
// This should be included in your index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/10.0.0/math.min.js"></script>

// Enhanced optimization using a more sophisticated numerical approach
function enhancedOptimize(
  objective,
  initialGuess,
  constraints,
  bounds,
  options = {}
) {
  const n = initialGuess.length;
  const maxIterations = options.maxIterations || 1000;
  const tolerance = options.tolerance || 1e-6;
  const functionTolerance = options.functionTolerance || 1e-8;

  // Initialize with the initial guess
  let x = [...initialGuess];

  // Project the initial point to satisfy constraints
  x = projectToConstraints(x, constraints, bounds);

  // Initialize optimization state
  let iteration = 0;
  let prevX = [...x];
  let prevValue = objective(x);

  // Initialize the inverse Hessian approximation to identity matrix
  let H = math.identity(n)._data; // Get raw array data from math.js matrix

  // Main optimization loop (BFGS method)
  while (iteration < maxIterations) {
    // 1. Compute gradient at current point
    const gradient = computeGradient(objective, x, prevValue);

    // 2. Determine search direction: p = -H*g
    const searchDirection = computeSearchDirection(H, gradient);

    // 3. Perform line search to find step size
    const { newX, newValue, alpha } = lineSearch(
      objective,
      x,
      searchDirection,
      prevValue,
      gradient
    );

    // 4. Check convergence
    const xDiff = math.norm(math.subtract(newX, x));
    const fDiff = Math.abs(newValue - prevValue);

    if (xDiff < tolerance && fDiff < functionTolerance) {
      x = newX;
      break;
    }

    // 5. Compute s_k = x_{k+1} - x_k and y_k = g_{k+1} - g_k
    const s = math.subtract(newX, x);
    const newGradient = computeGradient(objective, newX, newValue);
    const y = math.subtract(newGradient, gradient);

    // 6. Update inverse Hessian approximation using BFGS formula
    H = updateBFGS(H, s, y);

    // 7. Update for next iteration
    x = newX;
    prevValue = newValue;
    iteration++;
  }

  // Final projection to ensure constraints are satisfied
  return projectToConstraints(x, constraints, bounds);
}

// Compute numerical gradient
function computeGradient(f, x, fx = null) {
  const n = x.length;
  const gradient = new Array(n);
  const h = 1e-8; // Small step size

  const f0 = fx !== null ? fx : f(x);

  for (let i = 0; i < n; i++) {
    const xPlus = [...x];
    xPlus[i] += h;
    const fPlus = f(xPlus);
    gradient[i] = (fPlus - f0) / h;
  }

  return gradient;
}

// Compute search direction p = -H*g
function computeSearchDirection(H, gradient) {
  // Compute -H*g using math.js
  return math.multiply(math.multiply(-1, H), gradient);
}

// Line search using backtracking with Armijo condition
function lineSearch(f, x, direction, fx, gradient) {
  const alpha0 = 1.0; // Initial step size
  const rho = 0.5; // Backtracking factor
  const c = 1e-4; // Armijo parameter

  let alpha = alpha0;
  const directionalDerivative = math.dot(gradient, direction);

  // Continue backtracking until we find a good step size or hit a minimum
  for (let i = 0; i < 20; i++) {
    // Limit backtracking iterations
    const newX = math.add(x, math.multiply(alpha, direction));

    // Project to constraints (bounds only for line search)
    const projectedX = projectToBounds(newX, bounds);

    const newValue = f(projectedX);

    // Armijo condition: f(x_new) <= f(x) + c*alpha*grad(f(x))^T*d
    if (newValue <= fx + c * alpha * directionalDerivative) {
      return { newX: projectedX, newValue, alpha };
    }

    // Reduce step size
    alpha *= rho;

    // Stop if step becomes too small
    if (alpha < 1e-10) {
      return { newX: x, newValue: fx, alpha: 0 };
    }
  }

  // If we exit the loop without finding a good step,
  // return the original point
  return { newX: x, newValue: fx, alpha: 0 };
}

// Update BFGS inverse Hessian approximation
function updateBFGS(H, s, y) {
  // Check for sufficient curvature
  const ys = math.dot(y, s);

  if (ys < 1e-10) {
    // Not enough curvature, skip the update
    return H;
  }

  // BFGS update formula
  // H_{k+1} = (I - rho*s*y^T)H_k(I - rho*y*s^T) + rho*s*s^T
  // where rho = 1/y^T*s

  const n = H.length;
  const rho = 1 / ys;

  // Compute v = I - rho*y*s^T
  const I = math.identity(n)._data;
  const sy_T = math.multiply(
    math.matrix([s]),
    math.matrix([y]).transpose()
  )._data;
  const ys_T = math.multiply(
    math.matrix([y]),
    math.matrix([s]).transpose()
  )._data;

  const V = math.subtract(I, math.multiply(rho, ys_T));
  const V_T = math.subtract(I, math.multiply(rho, sy_T));

  // Compute V*H*V^T
  const VH = math.multiply(V, H);
  const VHV_T = math.multiply(VH, V_T);

  // Compute rho*s*s^T
  const ss_T = math.multiply(
    math.matrix([s]),
    math.matrix([s]).transpose()
  )._data;
  const rho_ss_T = math.multiply(rho, ss_T);

  // H_{k+1} = V*H*V^T + rho*s*s^T
  return math.add(VHV_T, rho_ss_T);
}

// Project point to satisfy bounds
function projectToBounds(x, bounds) {
  return x.map((xi, i) => Math.max(bounds[i][0], Math.min(xi, bounds[i][1])));
}

// Project point to satisfy all constraints
function projectToConstraints(x, constraints, bounds) {
  // First apply bounds constraints
  let projected = projectToBounds(x, bounds);

  // Handle equality constraints (simplified approach)
  // This is a basic projection that works well for the portfolio weight sum constraint
  for (const constraint of constraints) {
    if (constraint.type === "eq" && constraint.fun) {
      // For the sum-to-1 constraint, which is common in portfolio optimization
      if (
        constraint.name === "sum" ||
        constraint.fun.toString().includes("sum") ||
        constraint.fun.toString().includes("reduce")
      ) {
        // Calculate current sum
        const sum = projected.reduce((a, b) => a + b, 0);

        if (Math.abs(sum - 1) > 1e-10) {
          // Normalize to sum to 1
          projected = projected.map((w) => w / sum);

          // Reapply bounds
          projected = projectToBounds(projected, bounds);

          // Iterative correction to simultaneously satisfy bounds and sum
          let iterations = 0;
          while (
            Math.abs(projected.reduce((a, b) => a + b, 0) - 1) > 1e-10 &&
            iterations < 100
          ) {
            // Find adjustable weights (not at bounds)
            const adjustable = projected.map((w, i) => {
              if (w <= bounds[i][0] + 1e-10) return false; // At lower bound
              if (w >= bounds[i][1] - 1e-10) return false; // At upper bound
              return true;
            });

            const numAdjustable = adjustable.filter((x) => x).length;

            if (numAdjustable === 0) break; // Can't adjust further

            // Calculate needed adjustment
            const currentSum = projected.reduce((a, b) => a + b, 0);
            const adjustmentPerWeight = (1 - currentSum) / numAdjustable;

            // Apply adjustment
            projected = projected.map((w, i) =>
              adjustable[i] ? w + adjustmentPerWeight : w
            );

            // Reapply bounds
            projected = projectToBounds(projected, bounds);

            iterations++;
          }
        }
      }
    }
  }

  return projected;
}

// Enhanced portfolio optimization function
function optimizePortfolio(
  returns,
  covMatrix,
  riskAversion,
  allowShort = false
) {
  const n = returns.length;

  // Define objective function: maximize utility = r - (A/2) * sigma^2
  function objectiveFunction(weights) {
    // Portfolio return
    const portfolioReturn = math.dot(weights, returns);

    // Portfolio variance
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
      }
    }

    // Utility = return - (riskAversion/2) * variance
    // We minimize negative utility
    return -(portfolioReturn - (riskAversion / 2) * portfolioVariance);
  }

  // Initial guess: equal weights
  const initialGuess = Array(n).fill(1 / n);

  // Bounds for weights
  const bounds = Array(n).fill(allowShort ? [-1, 1] : [0, 1]);

  // Constraint: weights sum to 1
  const constraints = [
    {
      type: "eq",
      name: "sum",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
  ];

  // Run optimization
  const weights = enhancedOptimize(
    objectiveFunction,
    initialGuess,
    constraints,
    bounds,
    { maxIterations: 500, tolerance: 1e-8 }
  );

  // Calculate portfolio statistics
  const portfolioReturn = math.dot(weights, returns);

  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
    }
  }

  const portfolioVolatility = Math.sqrt(portfolioVariance);
  const sharpeRatio = (portfolioReturn - 0.03) / portfolioVolatility; // Assuming 3% risk-free rate

  return {
    weights: weights,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: sharpeRatio,
      utility: portfolioReturn - (riskAversion / 2) * portfolioVariance,
    },
  };
}

// Generate efficient frontier points
function generateEfficientFrontier(
  returns,
  covMatrix,
  riskFreeRate = 0.03,
  numPoints = 50,
  allowShort = false
) {
  const n = returns.length;

  // Find minimum variance portfolio
  const minVarPortfolio = findMinimumVariancePortfolio(
    returns,
    covMatrix,
    allowShort
  );

  // Find maximum Sharpe ratio portfolio
  const maxSharpePortfolio = findMaximumSharpePortfolio(
    returns,
    covMatrix,
    riskFreeRate,
    allowShort
  );

  // Find maximum return portfolio (100% in highest return asset)
  const maxReturnIndex = returns.indexOf(Math.max(...returns));
  const maxReturnWeights = Array(n).fill(0);
  maxReturnWeights[maxReturnIndex] = 1;
  const maxReturn = returns[maxReturnIndex];

  // Generate target returns for efficient frontier
  // Match Project 1's approach for range
  const minReturn = minVarPortfolio.stats.return;
  const stepSize = (maxReturn - minReturn) / (numPoints - 1);

  const targetReturns = Array(numPoints)
    .fill(0)
    .map((_, i) => minReturn + i * stepSize);

  // Find minimum variance portfolios for each target return
  const efficientFrontierPoints = [];

  for (const targetReturn of targetReturns) {
    try {
      const portfolio = findMinimumVarianceForTargetReturn(
        returns,
        covMatrix,
        targetReturn,
        allowShort
      );

      efficientFrontierPoints.push({
        return: portfolio.stats.return,
        volatility: portfolio.stats.volatility,
        weights: portfolio.weights,
      });
    } catch (e) {
      console.warn(
        `Could not find efficient frontier point for return ${targetReturn}:`,
        e
      );
      // Use interpolation/extrapolation if optimization fails
      // This keeps the frontier continuous
    }
  }

  // Fill in any missing points with interpolation (for numerical stability)
  const completeEfficientFrontier = fillMissingFrontierPoints(
    efficientFrontierPoints,
    targetReturns
  );

  return {
    points: completeEfficientFrontier,
    minVariancePortfolio: minVarPortfolio,
    maxSharpePortfolio: maxSharpePortfolio,
    returns: targetReturns,
    allowShort: allowShort,
  };
}

// Find minimum variance portfolio (global minimum variance portfolio)
function findMinimumVariancePortfolio(returns, covMatrix, allowShort = false) {
  const n = returns.length;

  // Objective function: minimize portfolio variance
  function objectiveFunction(weights) {
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
      }
    }
    return portfolioVariance;
  }

  // Initial guess: equal weights
  const initialGuess = Array(n).fill(1 / n);

  // Bounds for weights
  const bounds = Array(n).fill(allowShort ? [-1, 1] : [0, 1]);

  // Constraint: weights sum to 1
  const constraints = [
    {
      type: "eq",
      name: "sum",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
  ];

  // Run optimization
  const weights = enhancedOptimize(
    objectiveFunction,
    initialGuess,
    constraints,
    bounds,
    { maxIterations: 500, tolerance: 1e-8 }
  );

  // Calculate portfolio statistics
  const portfolioReturn = math.dot(weights, returns);

  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
    }
  }

  const portfolioVolatility = Math.sqrt(portfolioVariance);

  return {
    weights: weights,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      variance: portfolioVariance,
    },
  };
}

// Find maximum Sharpe ratio portfolio
function findMaximumSharpePortfolio(
  returns,
  covMatrix,
  riskFreeRate = 0.03,
  allowShort = false
) {
  const n = returns.length;

  // Objective function: minimize negative Sharpe ratio
  function objectiveFunction(weights) {
    const portfolioReturn = math.dot(weights, returns);

    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance);

    // Avoid division by zero
    if (portfolioVolatility < 1e-8) return -1000000;

    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;
    return -sharpeRatio; // Minimize negative Sharpe ratio
  }

  // Initial guess: equal weights
  const initialGuess = Array(n).fill(1 / n);

  // Bounds for weights
  const bounds = Array(n).fill(allowShort ? [-1, 1] : [0, 1]);

  // Constraint: weights sum to 1
  const constraints = [
    {
      type: "eq",
      name: "sum",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
  ];

  // Run optimization
  const weights = enhancedOptimize(
    objectiveFunction,
    initialGuess,
    constraints,
    bounds,
    { maxIterations: 500, tolerance: 1e-8 }
  );

  // Calculate portfolio statistics
  const portfolioReturn = math.dot(weights, returns);

  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
    }
  }

  const portfolioVolatility = Math.sqrt(portfolioVariance);
  const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;

  return {
    weights: weights,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio: sharpeRatio,
    },
  };
}

// Find minimum variance portfolio for a target return
function findMinimumVarianceForTargetReturn(
  returns,
  covMatrix,
  targetReturn,
  allowShort = false
) {
  const n = returns.length;

  // Objective function: minimize portfolio variance
  function objectiveFunction(weights) {
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
      }
    }
    return portfolioVariance;
  }

  // Initial guess: equal weights
  const initialGuess = Array(n).fill(1 / n);

  // Bounds for weights
  const bounds = Array(n).fill(allowShort ? [-1, 1] : [0, 1]);

  // Constraints: weights sum to 1 and portfolio return equals target return
  const constraints = [
    {
      type: "eq",
      name: "sum",
      fun: function (weights) {
        return math.sum(weights) - 1;
      },
    },
    {
      type: "eq",
      name: "return",
      fun: function (weights) {
        return math.dot(weights, returns) - targetReturn;
      },
    },
  ];

  // Run optimization
  const weights = enhancedOptimize(
    objectiveFunction,
    initialGuess,
    constraints,
    bounds,
    { maxIterations: 500, tolerance: 1e-8 }
  );

  // Calculate portfolio statistics
  const portfolioReturn = math.dot(weights, returns);

  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * covMatrix[i][j] * weights[j];
    }
  }

  const portfolioVolatility = Math.sqrt(portfolioVariance);

  return {
    weights: weights,
    stats: {
      return: portfolioReturn,
      volatility: portfolioVolatility,
      variance: portfolioVariance,
    },
  };
}

// Fill in missing frontier points using interpolation/extrapolation
function fillMissingFrontierPoints(points, targetReturns) {
  // Sort points by return
  points.sort((a, b) => a.return - b.return);

  // Create a complete set of points
  const complete = [];

  // For each target return, find or interpolate a point
  for (const target of targetReturns) {
    // Find exact match or closest points
    const exactMatch = points.find((p) => Math.abs(p.return - target) < 1e-10);

    if (exactMatch) {
      complete.push(exactMatch);
      continue;
    }

    // Find bracketing points
    let lowerPoint = null;
    let upperPoint = null;

    for (let i = 0; i < points.length; i++) {
      if (points[i].return < target) {
        lowerPoint = points[i];
      } else {
        upperPoint = points[i];
        break;
      }
    }

    // Interpolate or extrapolate
    if (lowerPoint && upperPoint) {
      // Interpolate
      const t =
        (target - lowerPoint.return) / (upperPoint.return - lowerPoint.return);

      const interpolatedPoint = {
        return: target,
        volatility:
          lowerPoint.volatility +
          t * (upperPoint.volatility - lowerPoint.volatility),
        weights: lowerPoint.weights.map(
          (w, i) => w + t * (upperPoint.weights[i] - w)
        ),
      };

      complete.push(interpolatedPoint);
    } else if (lowerPoint) {
      // Extrapolate upward (using quadratic approximation)
      if (lowerPoint.index > 0) {
        const prevPoint = points[lowerPoint.index - 1];
        const dr1 = lowerPoint.return - prevPoint.return;
        const dv1 = lowerPoint.volatility - prevPoint.volatility;

        // Increase volatility at slightly increasing rate
        const t = (target - lowerPoint.return) / dr1;
        const extrapolatedVolatility =
          lowerPoint.volatility + t * dv1 * (1 + 0.1 * t);

        // Extrapolate weights
        const extrapolatedWeights = lowerPoint.weights.map((w, i) => w);

        complete.push({
          return: target,
          volatility: extrapolatedVolatility,
          weights: extrapolatedWeights,
        });
      } else {
        // Just copy last point with adjusted return
        complete.push({
          return: target,
          volatility: lowerPoint.volatility,
          weights: [...lowerPoint.weights],
        });
      }
    } else if (upperPoint) {
      // Extrapolate downward (using quadratic approximation)
      if (upperPoint.index < points.length - 1) {
        const nextPoint = points[upperPoint.index + 1];
        const dr1 = nextPoint.return - upperPoint.return;
        const dv1 = nextPoint.volatility - upperPoint.volatility;

        // Decrease volatility at slightly increasing rate
        const t = (upperPoint.return - target) / dr1;
        const extrapolatedVolatility =
          upperPoint.volatility - t * dv1 * (1 + 0.1 * t);

        // Extrapolate weights
        const extrapolatedWeights = upperPoint.weights.map((w, i) => w);

        complete.push({
          return: target,
          volatility: extrapolatedVolatility,
          weights: extrapolatedWeights,
        });
      } else {
        // Just copy last point with adjusted return
        complete.push({
          return: target,
          volatility: upperPoint.volatility,
          weights: [...upperPoint.weights],
        });
      }
    } else {
      // No points at all, shouldn't happen but handle gracefully
      complete.push({
        return: target,
        volatility: 0,
        weights: Array(points[0]?.weights.length || 0).fill(0),
      });
    }
  }

  return complete;
}

// Export functions
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    optimizePortfolio,
    generateEfficientFrontier,
    findMinimumVariancePortfolio,
    findMaximumSharpePortfolio,
    findMinimumVarianceForTargetReturn,
  };
} else {
  // Add to window object for browser use
  window.enhancedOptimization = {
    optimizePortfolio,
    generateEfficientFrontier,
    findMinimumVariancePortfolio,
    findMaximumSharpePortfolio,
    findMinimumVarianceForTargetReturn,
  };
}
