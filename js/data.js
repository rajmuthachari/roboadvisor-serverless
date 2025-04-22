/**
 * Data and Calculation Engine for Rainy Hills Robo Advisor
 * Contains fund data loading, processing, and efficient frontier calculations
 */

// Define the list of recommended funds with their tickers
const fundsWithTickers = {
  "SPDR Gold Shares": "O87.SI",
  "Lion-OCBC Securities Singapore Low Carbon ETF": "ESG.SI",
  "Lion-OCBC Securities Hang Seng TECH ETF": "HST.SI",
  "Nikko AM Singapore STI ETF": "G3B.SI",
  "iShares MSCI India Climate Transition ETF": "QK9.SI",
  "CSOP FTSE Asia Pacific Low Carbon Index ETF": "LCS.SI",
  "Xtrackers MSCI China UCITS ETF 1C": "TID.SI",
  "Lion-OCBC Securities China Leaders ETF": "YYY.SI",
  "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF":
    "EVS.SI",
  "CSOP CSI STAR and CHINEXT 50 index ETF": "SCY.SI",
};

// Fund descriptions (this can be expanded with more detailed information)
const fundDescriptions = {
  "SPDR Gold Shares":
    "An ETF tracking the price of gold bullion, providing exposure to the precious metals market.",
  "Lion-OCBC Securities Singapore Low Carbon ETF":
    "An ETF focusing on Singapore companies with lower carbon footprints compared to sector peers.",
  "Lion-OCBC Securities Hang Seng TECH ETF":
    "An ETF tracking the Hang Seng TECH Index, providing exposure to the 30 largest technology companies in Hong Kong.",
  "Nikko AM Singapore STI ETF":
    "An ETF tracking the Straits Times Index, providing exposure to the Singapore stock market.",
  "iShares MSCI India Climate Transition ETF":
    "An ETF focused on Indian companies that are aligned with the transition to a low carbon economy.",
  "CSOP FTSE Asia Pacific Low Carbon Index ETF":
    "An ETF tracking companies with low carbon footprint across the Asia Pacific region.",
  "Xtrackers MSCI China UCITS ETF 1C":
    "An ETF providing exposure to large and mid-cap companies from mainland China.",
  "Lion-OCBC Securities China Leaders ETF":
    "An ETF focusing on leading Chinese companies across various sectors.",
  "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF":
    "An ETF targeting Chinese companies in the electric vehicle and mobile technology sectors.",
  "CSOP CSI STAR and CHINEXT 50 index ETF":
    "An ETF tracking innovative and high-growth Chinese companies listed on the STAR and ChiNext boards.",
};

// Asset class categorizations
const fundAssetClasses = {
  "SPDR Gold Shares": "Alternative - Commodities",
  "Lion-OCBC Securities Singapore Low Carbon ETF": "Equity - ESG",
  "Lion-OCBC Securities Hang Seng TECH ETF": "Equity - Technology",
  "Nikko AM Singapore STI ETF": "Equity - Singapore",
  "iShares MSCI India Climate Transition ETF": "Equity - India",
  "CSOP FTSE Asia Pacific Low Carbon Index ETF": "Equity - ESG",
  "Xtrackers MSCI China UCITS ETF 1C": "Equity - China",
  "Lion-OCBC Securities China Leaders ETF": "Equity - China",
  "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF":
    "Equity - Sector Specific",
  "CSOP CSI STAR and CHINEXT 50 index ETF": "Equity - Growth",
};

// Expense ratios for funds
const fundExpenseRatios = {
  "SPDR Gold Shares": 0.004,
  "Lion-OCBC Securities Singapore Low Carbon ETF": 0.0045,
  "Lion-OCBC Securities Hang Seng TECH ETF": 0.0045,
  "Nikko AM Singapore STI ETF": 0.0035,
  "iShares MSCI India Climate Transition ETF": 0.005,
  "CSOP FTSE Asia Pacific Low Carbon Index ETF": 0.0045,
  "Xtrackers MSCI China UCITS ETF 1C": 0.006,
  "Lion-OCBC Securities China Leaders ETF": 0.0055,
  "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF": 0.007,
  "CSOP CSI STAR and CHINEXT 50 index ETF": 0.008,
};

// Historical data placeholders - to be populated by fetchHistoricalData
let fundData = {};
let covarianceMatrix = [];

// Placeholder for prices DataFrame
let pricesDataFrame = {};

<<<<<<< Updated upstream
// State to track data initialization
const dataState = {
  initialized: false,
  loading: false,
  error: null,
};
=======
// Add this function to data.js
async function updatePortfolioData() {
  try {
    const response = await fetch("/api/update-portfolio-data");
    const result = await response.json();

    if (result.success) {
      console.log("Portfolio data updated successfully");
      return true;
    } else {
      console.error("Failed to update portfolio data:", result.error);
      return false;
    }
  } catch (error) {
    console.error("Error calling update API:", error);
    return false;
  }
}

// Modify your loadPortfolioData function to include refresh button functionality
async function loadPortfolioData() {
  try {
    // Fetch the JSON file
    const response = await fetch("portfolio_data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
>>>>>>> Stashed changes

// Risk profiles
const riskProfiles = {
  "Very Conservative": {
    description:
      "You prioritize capital preservation above all. You're uncomfortable with significant market fluctuations and prefer stable, low-risk investments.",
    riskAversion: 12.0,
    recommendedAssetMix: "80% fixed income, 15% defensive equities, 5% cash",
    timeHorizonAdvice:
      "This profile is suitable for short investment horizons (1-3 years) or for investors who cannot tolerate volatility regardless of time horizon.",
    knowledgeAdvice:
      "Consider educational resources about the relationship between risk and return to understand how a very conservative approach may limit long-term growth potential.",
  },
  Conservative: {
    description:
      "You prefer stability but are willing to accept small fluctuations for modest growth potential. You focus on preserving capital with some growth.",
    riskAversion: 6.0,
    recommendedAssetMix: "60% fixed income, 35% equities, 5% alternatives",
    timeHorizonAdvice:
      "This profile is appropriate for investment horizons of 3-5 years, balancing modest growth with relatively low volatility.",
    knowledgeAdvice:
      "Expanding your knowledge of how diversification can reduce portfolio risk may help you become comfortable with slightly more growth-oriented allocations.",
  },
  Moderate: {
    description:
      "You seek a balance between stability and growth. You can tolerate some market volatility in exchange for potential long-term growth.",
    riskAversion: 3.5,
    recommendedAssetMix: "40% fixed income, 55% equities, 5% alternatives",
    timeHorizonAdvice:
      "This balanced approach is suitable for medium-term investment horizons of 5-10 years, providing a mix of growth and income.",
    knowledgeAdvice:
      "Your moderate approach reflects a good understanding of investment fundamentals. Consider learning more about different equity markets to optimize your growth allocation.",
  },
  "Growth-Oriented": {
    description:
      "You focus primarily on long-term growth and can tolerate significant market fluctuations. You understand market volatility is normal for long-term investing.",
    riskAversion: 2.5,
    recommendedAssetMix: "20% fixed income, 75% equities, 5% alternatives",
    timeHorizonAdvice:
      "This growth-focused approach is appropriate for investment horizons of 10-15 years, allowing time to recover from market downturns.",
    knowledgeAdvice:
      "With your growth orientation, you could benefit from deeper knowledge of factor investing and how to evaluate equity investments across different markets.",
  },
  Aggressive: {
    description:
      "You seek maximum long-term growth and can tolerate substantial market volatility. You're comfortable with significant short-term losses for potential higher returns.",
    riskAversion: 1.5,
    recommendedAssetMix: "5% fixed income, 90% equities, 5% alternatives",
    timeHorizonAdvice:
      "This aggressive approach is best suited for long investment horizons of 15+ years, giving you ample time to recover from market cycles.",
    knowledgeAdvice:
      "Your aggressive stance indicates investment sophistication. Consider expanding your knowledge of international markets, emerging sectors, and alternative investments.",
  },
};

// Questionnaire data
const questionnaireData = {
  questions: [
    "What is your age?",
    "When do you expect to start withdrawing from this investment?",
    "How many financial dependents do you have (children, elderly parents, etc.)?",
    "How would you rate your investment knowledge?",
    "Which investments have you had experience with? (Select the most advanced)",
    "How stable is your current and future income?",
    "How many months of expenses do you have in emergency savings?",
    "What percentage of your net worth does this investment represent?",
    "If your investment suddenly lost 20% of its value, what would you do?",
    "How would you feel if your investment dropped 15% in a month?",
    "Which of these statements best describes your current investment approach?",
    "Which statement best describes your investment philosophy?",
    "What is your primary investment objective?",
    "How important is liquidity in this investment?",
    "Imagine you have $10,000 to invest for 5 years. Which option would you choose?",
    "The table below shows five hypothetical portfolios. Which would you choose?",
  ],
  options: [
    ["Under 30", "30-40", "41-50", "51-60", "Over 60"],
    [
      "Less than 3 years",
      "3-5 years",
      "6-10 years",
      "11-20 years",
      "More than 20 years",
    ],
    ["None", "1", "2", "3", "4 or more"],
    [
      "Very limited - I'm new to investing",
      "Basic - I understand simple investment concepts",
      "Moderate - I understand different investment types",
      "Good - I understand diversification and asset allocation",
      "Advanced - I understand complex investment strategies",
    ],
    [
      "Savings accounts and fixed deposits only",
      "Unit trusts and bonds",
      "Stocks and ETFs",
      "Options, futures, or forex",
      "Private equity, hedge funds, or venture capital",
    ],
    [
      "Very unstable - irregular or uncertain income",
      "Somewhat unstable - some risk to income",
      "Moderate - generally stable but not guaranteed",
      "Stable - secure employment or reliable income sources",
      "Very stable - guaranteed income or multiple secure sources",
    ],
    [
      "Less than 1 month",
      "1-3 months",
      "3-6 months",
      "6-12 months",
      "More than 12 months",
    ],
    ["Over 75%", "50-75%", "25-50%", "10-25%", "Less than 10%"],
    [
      "Sell everything immediately",
      "Sell a portion to reduce risk",
      "Do nothing and wait to see what happens",
      "Wait for recovery and then reassess strategy",
      "Buy more at the lower price",
    ],
    [
      "Extremely uncomfortable - I would have trouble sleeping",
      "Very uncomfortable - I would worry a lot",
      "Moderately uncomfortable but manageable",
      "Slightly uncomfortable but not worried",
      "Comfortable - I understand downturns are part of investing",
    ],
    [
      "I keep all my money in savings accounts, fixed deposits, or government bonds",
      "I invest mostly in conservative instruments with a small portion in blue-chip stocks",
      "I have a balanced mix of stocks and bonds in my portfolio",
      "I invest primarily in stocks with some allocation to more speculative investments",
      "I actively seek high-risk, high-reward investments including emerging markets, small caps, or cryptocurrencies",
    ],
    [
      "I cannot tolerate any investment losses",
      "I can tolerate small losses occasionally",
      "I can accept moderate losses if the long-term outlook is positive",
      "I can accept significant short-term losses for long-term growth",
      "I focus on maximum long-term returns regardless of short-term losses",
    ],
    [
      "Preserve capital - avoid loss at all costs",
      "Income generation - steady income with minimal growth",
      "Balanced - moderate growth with some income",
      "Growth - focus on long-term capital appreciation",
      "Aggressive growth - maximize returns at all costs",
    ],
    [
      "Very important - I may need immediate access to all funds",
      "Important - I may need access to most funds within a year",
      "Somewhat important - I may need partial access occasionally",
      "Less important - I likely won't need access for several years",
      "Not important - This is purely long-term money",
    ],
    [
      "Guaranteed return of $1,500 (total: $11,500) with no possibility of loss",
      "90% chance of gaining $3,000 (total: $13,000), but 10% chance of losing $500 (total: $9,500)",
      "80% chance of gaining $5,000 (total: $15,000), but 20% chance of losing $1,000 (total: $9,000)",
      "70% chance of gaining $7,500 (total: $17,500), but 30% chance of losing $2,000 (total: $8,000)",
      "60% chance of gaining $10,000 (total: $20,000), but 40% chance of losing $3,000 (total: $7,000)",
    ],
    [
      "Portfolio A: 4% Expected Return, -5% Worst Case, 13% Best Case",
      "Portfolio B: 6% Expected Return, -10% Worst Case, 20% Best Case",
      "Portfolio C: 8% Expected Return, -15% Worst Case, 28% Best Case",
      "Portfolio D: 10% Expected Return, -25% Worst Case, 35% Best Case",
      "Portfolio E: 12% Expected Return, -35% Worst Case, 45% Best Case",
    ],
  ],
};

// Portfolio scenario data
const scenarioData = {
  base: {
    name: "Base Case",
    returnMultiplier: 1.0,
    volatilityMultiplier: 1.0,
    description:
      "Expected performance based on historical returns and volatility",
  },
  bull: {
    name: "Bull Market",
    returnMultiplier: 1.5,
    volatilityMultiplier: 0.8,
    description:
      "Strong economic growth with above-average returns and below-average volatility",
  },
  bear: {
    name: "Bear Market",
    returnMultiplier: 0.5,
    volatilityMultiplier: 1.5,
    description:
      "Economic contraction with below-average returns and above-average volatility",
  },
};

// Initialize the data
async function initializeData() {
  if (dataState.initialized || dataState.loading) {
    return;
  }

  dataState.loading = true;

  try {
    // Generate synthetic historical data
    await generateSyntheticData();

    // Calculate key metrics for each fund
    calculateFundMetrics();

    // Calculate covariance matrix
    calculateCovarianceMatrix();

    dataState.initialized = true;
  } catch (error) {
    console.error("Error initializing data:", error);
    dataState.error = error;
  } finally {
    dataState.loading = false;
  }

  return fundData;
}

// Generate synthetic data since we don't have real historical data
async function generateSyntheticData() {
  console.log("Generating synthetic historical data...");

  const fundNames = Object.keys(fundsWithTickers);
  const numFunds = fundNames.length;

  // Generate 3 years of daily returns (approx. 756 trading days)
  const numDays = 756;
  const dates = Array.from({ length: numDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (numDays - i));
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  });

  // Create synthetic price data
  pricesDataFrame = {
    dates: dates,
    data: {},
  };

  // Generate synthetic price data for each fund
  for (const fund of fundNames) {
    // Generate parameters for each fund's price movement
    const volatility = Math.random() * 0.3 + 0.1; // 10% to 40% annual volatility
    const annualReturn = Math.random() * 0.25 - 0.05; // -5% to 20% annual return
    const dailyReturn = Math.pow(1 + annualReturn, 1 / 252) - 1;
    const dailyVolatility = volatility / Math.sqrt(252);

    // Start with an initial price of 100
    let price = 100;
    const prices = [price];

    // Generate price series
    for (let i = 1; i < numDays; i++) {
      // Generate a random return with normal distribution
      const randomReturn = dailyReturn + dailyVolatility * randNormal();
      price = price * (1 + randomReturn);
      prices.push(price);
    }

    pricesDataFrame.data[fund] = prices;
  }

  console.log(
    "Generated synthetic data for",
    numFunds,
    "funds over",
    numDays,
    "days"
  );
}

// Standard normal distribution random number generator (Box-Muller transform)
function randNormal() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Calculate metrics for each fund
function calculateFundMetrics() {
  const fundNames = Object.keys(fundsWithTickers);

  // Calculate returns from prices
  const returns = {};

  for (const fund of fundNames) {
    const prices = pricesDataFrame.data[fund];
    const returnValues = [];

    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = prices[i] / prices[i - 1] - 1;
      returnValues.push(dailyReturn);
    }

    returns[fund] = returnValues;
  }

  // Calculate fund metrics
  for (const fund of fundNames) {
    const returnValues = returns[fund];

    // Calculate annualized metrics
    const avgDailyReturn =
      returnValues.reduce((sum, r) => sum + r, 0) / returnValues.length;
    const annualizedReturn = Math.pow(1 + avgDailyReturn, 252) - 1;

    const variance =
      returnValues.reduce(
        (sum, r) => sum + Math.pow(r - avgDailyReturn, 2),
        0
      ) / returnValues.length;
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252);

    // Calculate Sharpe ratio (assuming 3% risk-free rate)
    const riskFreeRate = 0.03;
    const sharpeRatio =
      (annualizedReturn - riskFreeRate) / annualizedVolatility;

    // Calculate maximum drawdown
    const prices = pricesDataFrame.data[fund];
    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      } else {
        const drawdown = (peak - prices[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    // Create fund data object
    fundData[fund] = {
      annualizedReturn: annualizedReturn,
      annualizedVolatility: annualizedVolatility,
      sharpeRatio: sharpeRatio,
      maxDrawdown: -maxDrawdown, // Negative value to match the standard convention
      description: fundDescriptions[fund] || "No description available.",
      assetClass: fundAssetClasses[fund] || "Other",
      expenseRatio: fundExpenseRatios[fund] || 0.005,
    };
  }

  console.log("Calculated metrics for all funds:", fundData);
}

// Calculate the covariance matrix
function calculateCovarianceMatrix() {
  const fundNames = Object.keys(fundsWithTickers);
  const numFunds = fundNames.length;

  // Extract returns
  const returnsArray = [];
  for (const fund of fundNames) {
    const prices = pricesDataFrame.data[fund];
    const returns = [];

    for (let i = 1; i < prices.length; i++) {
      returns.push(prices[i] / prices[i - 1] - 1);
    }

    returnsArray.push(returns);
  }

  // Calculate covariance matrix
  covarianceMatrix = Array(numFunds)
    .fill()
    .map(() => Array(numFunds).fill(0));

  for (let i = 0; i < numFunds; i++) {
    for (let j = 0; j < numFunds; j++) {
      covarianceMatrix[i][j] = calculateCovariance(
        returnsArray[i],
        returnsArray[j]
      );
    }
  }

  // Annualize covariance matrix
  for (let i = 0; i < numFunds; i++) {
    for (let j = 0; j < numFunds; j++) {
      covarianceMatrix[i][j] *= 252; // Multiply by trading days in a year
    }
  }

  console.log("Calculated covariance matrix:", covarianceMatrix);
}

// Calculate covariance between two arrays
function calculateCovariance(array1, array2) {
  if (array1.length !== array2.length) {
    throw new Error("Arrays must have the same length");
  }

  const mean1 = array1.reduce((sum, val) => sum + val, 0) / array1.length;
  const mean2 = array2.reduce((sum, val) => sum + val, 0) / array2.length;

  let covariance = 0;
  for (let i = 0; i < array1.length; i++) {
    covariance += (array1[i] - mean1) * (array2[i] - mean2);
  }

  return covariance / array1.length;
}

// Initialize data when the script is loaded
window.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing data...");
  initializeData();
});
