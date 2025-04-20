/**
 * Efficient Frontier Calculation Functions
 * Implements the portfolio optimization techniques from Modern Portfolio Theory
 */

// Generate the efficient frontier
function generateEfficientFrontier(returns, covMatrix, rfRate = 0.03, points = 50, allowShort = false) {
  console.log("Generating efficient frontier...");
  
  const fundNames = Object.keys(returns);
  const meanReturns = fundNames.map(fund => returns[fund]);
  const n = meanReturns.length;
  
  // Define constraint sets
  const constraintSetWithShort = { sum: true };
  const constraintSetNoShort = { sum: true, longOnly: true };
  
  // Find the Global Minimum Variance Portfolio (GMVP) with and without short sales
  const gmvpWithShort = findGMVP(meanReturns, covMatrix, constraintSetWithShort);
  const gmvpNoShort = findGMVP(meanReturns, covMatrix, constraintSetNoShort);
  
  // Find the Market Portfolio (tangent portfolio) with and without short sales
  const marketPortfolioWithShort = findMarketPortfolio(meanReturns, covMatrix, rfRate, constraintSetWithShort);
  const marketPortfolioNoShort = findMarketPortfolio(meanReturns, covMatrix, rfRate, constraintSetNoShort);
  
  // Generate efficient frontier points with short sales
  const targetReturnsWithShort = linspace(
      gmvpWithShort.return,
      Math.max(...meanReturns) * 1.2, // Go a bit beyond the highest return
      points
  );
  
  const efVolatilityWithShort = [];
  const efReturnsWithShort = [];
  
  for (const target of targetReturnsWithShort) {
      try {
          const result = minimizeVolatility(meanReturns, covMatrix, target, constraintSetWithShort);
          efVolatilityWithShort.push(result.volatility);
          efReturnsWithShort.push(target);
      } catch (error) {
          console.error("Error calculating efficient frontier point:", error);
      }
  }
  
  // Generate efficient frontier points without short sales
  const targetReturnsNoShort = linspace(
      gmvpNoShort.return,
      Math.max(...meanReturns),
      points
  );
  
  const efVolatilityNoShort = [];
  const efReturnsNoShort = [];
  
  for (const target of targetReturnsNoShort) {
      try {
          const result = minimizeVolatility(meanReturns, covMatrix, target, constraintSetNoShort);
          efVolatilityNoShort.push(result.volatility);
          efReturnsNoShort.push(target);
      } catch (error) {
          console.error("Error calculating efficient frontier point:", error);
      }
  }
  
  // Return the results
  return {
      efWithShort: {
          returns: efReturnsWithShort,
          volatilities: efVolatilityWithShort
      },
      efNoShort: {
          returns: efReturnsNoShort,
          volatilities: efVolatilityNoShort
      },
      gmvpWithShort: gmvpWithShort,
      gmvpNoShort: gmvpNoShort,
      marketPortfolioWithShort: marketPortfolioWithShort,
      marketPortfolioNoShort: marketPortfolioNoShort
  };
}

// Calculate portfolio return
function portfolioReturn(weights, returns) {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
      sum += weights[i] * returns[i];
  }
  return sum;
}

// Calculate portfolio volatility
function portfolioVolatility(weights, covMatrix) {
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
          variance += weights[i] * weights[j] * covMatrix[i][j];
      }
  }
  return Math.sqrt(variance);
}

// Generate a linearly spaced array (similar to numpy.linspace)
function linspace(start, end, n) {
  const result = [];
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) {
      result.push(start + i * step);
  }
  return result;
}

function minimize(objective, initialGuess, constraints, bounds, additionalParams = {}) {
  // For simplicity, we'll implement a primitive version of sequential least squares programming
  // This is a very basic implementation and won't work well for complex problems
  // In a real application, you would use a more sophisticated optimization library
  
  const n = initialGuess.length;
  const maxIterations = 1000;
  const tolerance = 1e-6;
  
  // Extract additional parameters
  const meanReturns = additionalParams.meanReturns;
  const targetReturn = additionalParams.targetReturn;
  
  // Current solution
  let x = [...initialGuess];
  let iterations = 0;
  let fVal = objective(x);
  
  // Function to check if constraints are satisfied
  function constraintsSatisfied(x, tol = 1e-4) {
      for (const constraint of constraints) {
          const value = constraint.fun(x);
          if (constraint.type === 'eq' && Math.abs(value) > tol) {
              return false;
          }
      }
      return true;
  }
  
  // Function to project onto bounds
  function projectToBounds(x) {
      for (let i = 0; i < n; i++) {
          if (x[i] < bounds[i][0]) x[i] = bounds[i][0];
          if (x[i] > bounds[i][1]) x[i] = bounds[i][1];
      }
      return x;
  }
  
  // Sequential quadratic programming (very simplified)
  while (iterations < maxIterations) {
      iterations++;
      
      // Compute gradient numerically
      const gradient = [];
      const h = 1e-8;  // Small step for numerical differentiation
      
      for (let i = 0; i < n; i++) {
          const x1 = [...x];
          const x2 = [...x];
          x1[i] += h;
          x2[i] -= h;
          const f1 = objective(x1);
          const f2 = objective(x2);
          gradient.push((f1 - f2) / (2 * h));
      }
      
      // Simple gradient descent step
      const stepSize = 0.01;
      const xNew = [];
      
      for (let i = 0; i < n; i++) {
          xNew[i] = x[i] - stepSize * gradient[i];
      }
      
      // Project to bounds
      const xProjBounds = projectToBounds(xNew);
      
      // Project to satisfy constraints (very simplified)
      let xProj = [...xProjBounds];
      
      // Handle sum-to-one constraint by normalization
      const sumConstraint = constraints.find(c => 
          c.type === 'eq' && 
          c.fun.toString().includes('reduce')
      );
      
      if (sumConstraint) {
          const sum = xProj.reduce((a, b) => a + b, 0);
          if (Math.abs(sum - 1) > tolerance) {
              xProj = xProj.map(w => w / sum);
          }
      }
      
      // Handle target return constraint by iterative adjustment
      const returnConstraint = constraints.find(c => 
          c.type === 'eq' && 
          c.fun.toString().includes('portfolioReturn')
      );
      
      if (returnConstraint && meanReturns && targetReturn !== undefined) {
          const currentReturn = portfolioReturn(xProj, meanReturns);
          
          // Simple iterative adjustment (this is very crude)
          if (Math.abs(currentReturn - targetReturn) > tolerance) {
              const returnStep = 0.001;
              const direction = currentReturn < targetReturn ? 1 : -1;
              
              for (let iter = 0; iter < 100; iter++) {
                  // Find asset with highest or lowest return depending on adjustment needed
                  const assetIndices = [...Array(n).keys()].sort((i, j) => 
                      direction * (meanReturns[j] - meanReturns[i])
                  );
                  
                  // Adjust weights
                  xProj[assetIndices[0]] += returnStep;
                  xProj[assetIndices[n-1]] -= returnStep;
                  
                  // Re-normalize
                  const sum = xProj.reduce((a, b) => a + b, 0);
                  xProj = xProj.map(w => w / sum);
                  
                  // Check if we're close enough
                  const newReturn = portfolioReturn(xProj, meanReturns);
                  if (Math.abs(newReturn - targetReturn) <= tolerance) {
                      break;
                  }
              }
          }
      }
      
      // Evaluate new point
      const fValNew = objective(xProj);
      
      // Check for convergence
      if (Math.abs(fValNew - fVal) < tolerance) {
          break;
      }
      
      // Accept new point
      if (fValNew < fVal || constraintsSatisfied(xProj)) {
          x = xProj;
          fVal = fValNew;
      }
  }
  
  return {
      x: x,
      fun: fVal,
      success: true,
      iterations: iterations
  };
}
}

// Function to calculate optimal portfolio for a given risk aversion parameter
function calculateOptimalPortfolio(meanReturns, covMatrix, riskAversion) {
  const n = meanReturns.length;
  
  // Objective function: maximize utility = r - (A/2) * σ²
  function objective(weights) {
      const portReturn = portfolioReturn(weights, meanReturns);
      const portVariance = Math.pow(portfolioVolatility(weights, covMatrix), 2);
      
      // Negative because we're minimizing
      return -(portReturn - (riskAversion / 2) * portVariance);
  }
  
  // Initial guess: equal weights
  const initialGuess = Array(n).fill(1/n);
  
  // Constraints: weights sum to 1
  const constraints = [{
      type: 'eq',
      fun: function(weights) {
          return weights.reduce((a, b) => a + b, 0) - 1;
      }
  }];
  
  // Bounds: all weights between 0 and 1 (no short sales)
  const bounds = Array(n).fill([0, 1]);
  
  // Optimize
  const result = minimize(objective, initialGuess, constraints, bounds);
  
  return {
      weights: result.x,
      return: portfolioReturn(result.x, meanReturns),
      volatility: portfolioVolatility(result.x, covMatrix),
      utility: -result.fun
  };
}
}

// Find the Global Minimum Variance Portfolio (GMVP)
function findGMVP(meanReturns, covMatrix, constraintSet) {
  const n = meanReturns.length;
  
  // Objective function (minimize volatility)
  function objective(weights) {
      return portfolioVolatility(weights, covMatrix);
  }
  
  // Initial guess
  const initialGuess = Array(n).fill(1/n);
  
  // Bounds for weights
  let bounds;
  if (constraintSet.longOnly) {
      bounds = Array(n).fill([0, 1]); // No short sales
  } else {
      bounds = Array(n).fill([-1, 1]); // Allow short sales
  }
  
  // Constraints
  const constraints = [];
  
  // Add constraint that portfolio return equals target return
  constraints.push({
      type: 'eq',
      fun: function(weights) {
          return portfolioReturn(weights, meanReturns) - targetReturn;
      }
  });
  
  // Optimize
  const result = minimize(objective, initialGuess, constraints, bounds, { meanReturns });
  
  return {
      volatility: portfolioVolatility(result.x, covMatrix),
      weights: result.x
  }; that weights sum to 1
  if (constraintSet.sum) {
      constraints.push({
          type: 'eq',
          fun: function(weights) {
              return weights.reduce((a, b) => a + b, 0) - 1;
          }
      });
  }
  
  // Optimize
  const result = minimize(objective, initialGuess, constraints, bounds);
  
  return {
      volatility: portfolioVolatility(result.x, covMatrix),
      return: portfolioReturn(result.x, meanReturns),
      weights: result.x
  };
}

// Find the Market Portfolio (tangent portfolio)
function findMarketPortfolio(meanReturns, covMatrix, rfRate, constraintSet) {
  const n = meanReturns.length;
  
  // Objective function (maximize Sharpe ratio)
  function objective(weights) {
      const portReturn = portfolioReturn(weights, meanReturns);
      const portVolatility = portfolioVolatility(weights, covMatrix);
      
      // Avoid division by zero
      if (portVolatility < 0.0001) return -999999;
      
      // Negative because we're minimizing
      return -(portReturn - rfRate) / portVolatility;
  }
  
  // Initial guess
  const initialGuess = Array(n).fill(1/n);
  
  // Bounds for weights
  let bounds;
  if (constraintSet.longOnly) {
      bounds = Array(n).fill([0, 1]); // No short sales
  } else {
      bounds = Array(n).fill([-1, 1]); // Allow short sales
  }
  
  // Constraints
  const constraints = [];
  
  // Add constraint that weights sum to 1
  if (constraintSet.sum) {
      constraints.push({
          type: 'eq',
          fun: function(weights) {
              return weights.reduce((a, b) => a + b, 0) - 1;
          }
      });
  }
  
  // Optimize
  const result = minimize(objective, initialGuess, constraints, bounds);
  
  const portVolatility = portfolioVolatility(result.x, covMatrix);
  const portReturn = portfolioReturn(result.x, meanReturns);
  const sharpe = (portReturn - rfRate) / portVolatility;
  
  return {
      volatility: portVolatility,
      return: portReturn,
      weights: result.x,
      sharpe: sharpe
  };
}

// Minimize volatility for a target return
function minimizeVolatility(meanReturns, covMatrix, targetReturn, constraintSet) {
  const n = meanReturns.length;
  
  // Objective function (minimize volatility)
  function objective(weights) {
      return portfolioVolatility(weights, covMatrix);
  }
  
  // Initial guess
  const initialGuess = Array(n).fill(1/n);
  
  // Bounds for weights
  let bounds;
  if (constraintSet.longOnly) {
      bounds = Array(n).fill([0, 1]); // No short sales
  } else {
      bounds = Array(n).fill([-1, 1]); // Allow short sales
  }
  
  // Constraints
  const constraints = [];
  
  // Add constraint that weights sum to 1
  if (constraintSet.sum) {
      constraints.push({
          type: 'eq',
          fun: function(weights) {
              return weights.reduce((a, b) => a + b, 0) - 1;
          }
      });
  }
  
  // Add constraint