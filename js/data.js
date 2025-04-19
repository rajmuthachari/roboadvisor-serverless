/**
 * Data for Rainy Hills Robo Advisor
 * Contains fund data, covariance matrix, risk profiles, and questionnaire data
 */

// Fund data (from the Python notebook)
const fundData = {
    'SPDR Straits Times Index ETF': {
        annualizedReturn: 0.117487,
        annualizedVolatility: 0.100101,
        sharpeRatio: 0.873987,
        maxDrawdown: -0.095195,
        description: 'A benchmark ETF tracking the Straits Times Index, comprising the top 30 companies listed on the Singapore Exchange.',
        assetClass: 'Equity - Singapore',
        expenseRatio: 0.0030
    },
    'Nikko AM Singapore STI ETF': {
        annualizedReturn: 0.120937,
        annualizedVolatility: 0.107122,
        sharpeRatio: 0.848912,
        maxDrawdown: -0.097916,
        description: 'An ETF tracking the Straits Times Index, providing exposure to the Singapore stock market.',
        assetClass: 'Equity - Singapore',
        expenseRatio: 0.0035
    },
    'Lion-OCBC Securities Singapore Low Carbon ETF': {
        annualizedReturn: 0.022609,
        annualizedVolatility: 0.217102,
        sharpeRatio: -0.034046,
        maxDrawdown: -0.383698,
        description: 'An ETF focusing on Singapore companies with lower carbon footprints compared to sector peers.',
        assetClass: 'Equity - ESG',
        expenseRatio: 0.0045
    },
    'Lion-Phillip S-REIT ETF': {
        annualizedReturn: -0.036011,
        annualizedVolatility: 0.137193,
        sharpeRatio: -0.481158,
        maxDrawdown: -0.210929,
        description: 'An ETF investing in Singapore Real Estate Investment Trusts (REITs) that offer attractive yields.',
        assetClass: 'Real Estate',
        expenseRatio: 0.0050
    },
    'NikkoAM-StraitsTrading Asia ex Japan REIT ETF': {
        annualizedReturn: -0.046661,
        annualizedVolatility: 0.121205,
        sharpeRatio: -0.632490,
        maxDrawdown: -0.262084,
        description: 'An ETF tracking REITs across Asia excluding Japan, providing exposure to real estate markets.',
        assetClass: 'Real Estate',
        expenseRatio: 0.0055
    },
    'CapitaLand Integrated Commercial Trust': {
        annualizedReturn: 0.035029,
        annualizedVolatility: 0.188276,
        sharpeRatio: 0.026711,
        maxDrawdown: -0.235201,
        description: 'One of the largest REITs in Singapore focusing on integrated developments, shopping malls, and commercial properties.',
        assetClass: 'Real Estate',
        expenseRatio: 0.0032
    },
    'Mapletree Industrial Trust': {
        annualizedReturn: -0.003318,
        annualizedVolatility: 0.167200,
        sharpeRatio: -0.199272,
        maxDrawdown: -0.214022,
        description: 'A REIT investing in industrial properties and data centers in Singapore and North America.',
        assetClass: 'Real Estate',
        expenseRatio: 0.0038
    },
    'ABF Singapore Bond Index Fund': {
        annualizedReturn: 0.031736,
        annualizedVolatility: 0.054141,
        sharpeRatio: 0.032066,
        maxDrawdown: -0.060224,
        description: 'An ETF tracking Singapore government and quasi-government bonds, providing stable income with low risk.',
        assetClass: 'Fixed Income',
        expenseRatio: 0.0025
    },
    'NikkoAM-ICBCChina Bond ETF SGD': {
        annualizedReturn: 0.043304,
        annualizedVolatility: 0.026737,
        sharpeRatio: 0.497604,
        maxDrawdown: -0.003731,
        description: 'An ETF providing exposure to China government and policy bank bonds, denominated in SGD.',
        assetClass: 'Fixed Income',
        expenseRatio: 0.0030
    },
    'Lion-OCBC Securities Hang Seng TECH ETF': {
        annualizedReturn: 0.191904,
        annualizedVolatility: 0.372115,
        sharpeRatio: 0.435091,
        maxDrawdown: -0.431193,
        description: 'An ETF tracking the Hang Seng TECH Index, providing exposure to the 30 largest technology companies in Hong Kong.',
        assetClass: 'Equity - Technology',
        expenseRatio: 0.0045
    }
};

// Covariance matrix (from the Python notebook)
const covarianceMatrix = [
    [0.010020, 0.009775, 0.002019, 0.006986, 0.006545, 0.008796, 0.006841, 0.000324, 0.000086, 0.013181],
    [0.009775, 0.011475, 0.001436, 0.007540, 0.007078, 0.009538, 0.007345, 0.000437, 0.000103, 0.014447],
    [0.002019, 0.001436, 0.047133, 0.002562, 0.002675, 0.003782, 0.004454, 0.000400, 0.000319, 0.000833],
    [0.006986, 0.007540, 0.002562, 0.018822, 0.014553, 0.018603, 0.017404, 0.001892, 0.000049, 0.014653],
    [0.006545, 0.007078, 0.002675, 0.014553, 0.014691, 0.017258, 0.015291, 0.001593, 0.000121, 0.017688],
    [0.008796, 0.009538, 0.003782, 0.018603, 0.017258, 0.035448, 0.019809, 0.002363, 0.000202, 0.017495],
    [0.006841, 0.007345, 0.004454, 0.017404, 0.015291, 0.019809, 0.027956, 0.002346, 0.000072, 0.013341],
    [0.000324, 0.000437, 0.000400, 0.001892, 0.001593, 0.002363, 0.002346, 0.002931, -0.000084, -0.000846],
    [0.000086, 0.000103, 0.000319, 0.000049, 0.000121, 0.000202, 0.000072, -0.000084, 0.000715, 0.000229],
    [0.013181, 0.014447, 0.000833, 0.014653, 0.017688, 0.017495, 0.013341, -0.000846, 0.000229, 0.138470]
];

// Risk profiles
const riskProfiles = {
    "Very Conservative": {
        description: "You prioritize capital preservation above all. You're uncomfortable with significant market fluctuations and prefer stable, low-risk investments.",
        riskAversion: 12.0,
        recommendedAssetMix: "80% fixed income, 15% defensive equities, 5% cash",
        timeHorizonAdvice: "This profile is suitable for short investment horizons (1-3 years) or for investors who cannot tolerate volatility regardless of time horizon.",
        knowledgeAdvice: "Consider educational resources about the relationship between risk and return to understand how a very conservative approach may limit long-term growth potential."
    },
    "Conservative": {
        description: "You prefer stability but are willing to accept small fluctuations for modest growth potential. You focus on preserving capital with some growth.",
        riskAversion: 6.0,
        recommendedAssetMix: "60% fixed income, 35% equities, 5% alternatives",
        timeHorizonAdvice: "This profile is appropriate for investment horizons of 3-5 years, balancing modest growth with relatively low volatility.",
        knowledgeAdvice: "Expanding your knowledge of how diversification can reduce portfolio risk may help you become comfortable with slightly more growth-oriented allocations."
    },
    "Moderate": {
        description: "You seek a balance between stability and growth. You can tolerate some market volatility in exchange for potential long-term growth.",
        riskAversion: 3.5,
        recommendedAssetMix: "40% fixed income, 55% equities, 5% alternatives",
        timeHorizonAdvice: "This balanced approach is suitable for medium-term investment horizons of 5-10 years, providing a mix of growth and income.",
        knowledgeAdvice: "Your moderate approach reflects a good understanding of investment fundamentals. Consider learning more about different equity markets to optimize your growth allocation."
    },
    "Growth-Oriented": {
        description: "You focus primarily on long-term growth and can tolerate significant market fluctuations. You understand market volatility is normal for long-term investing.",
        riskAversion: 2.5,
        recommendedAssetMix: "20% fixed income, 75% equities, 5% alternatives",
        timeHorizonAdvice: "This growth-focused approach is appropriate for investment horizons of 10-15 years, allowing time to recover from market downturns.",
        knowledgeAdvice: "With your growth orientation, you could benefit from deeper knowledge of factor investing and how to evaluate equity investments across different markets."
    },
    "Aggressive": {
        description: "You seek maximum long-term growth and can tolerate substantial market volatility. You're comfortable with significant short-term losses for potential higher returns.",
        riskAversion: 1.5,
        recommendedAssetMix: "5% fixed income, 90% equities, 5% alternatives",
        timeHorizonAdvice: "This aggressive approach is best suited for long investment horizons of 15+ years, giving you ample time to recover from market cycles.",
        knowledgeAdvice: "Your aggressive stance indicates investment sophistication. Consider expanding your knowledge of international markets, emerging sectors, and alternative investments."
    }
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
        "The table below shows five hypothetical portfolios. Which would you choose?"
    ],
    options: [
        ["Under 30", "30-40", "41-50", "51-60", "Over 60"],
        ["Less than 3 years", "3-5 years", "6-10 years", "11-20 years", "More than 20 years"],
        ["None", "1", "2", "3", "4 or more"],
        ["Very limited - I'm new to investing", "Basic - I understand simple investment concepts", 
         "Moderate - I understand different investment types", 
         "Good - I understand diversification and asset allocation", 
         "Advanced - I understand complex investment strategies"],
        ["Savings accounts and fixed deposits only", "Unit trusts and bonds", "Stocks and ETFs", 
         "Options, futures, or forex", "Private equity, hedge funds, or venture capital"],
        ["Very unstable - irregular or uncertain income", "Somewhat unstable - some risk to income", 
         "Moderate - generally stable but not guaranteed", 
         "Stable - secure employment or reliable income sources", 
         "Very stable - guaranteed income or multiple secure sources"],
        ["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "More than 12 months"],
        ["Over 75%", "50-75%", "25-50%", "10-25%", "Less than 10%"],
        ["Sell everything immediately", "Sell a portion to reduce risk", 
         "Do nothing and wait to see what happens", "Wait for recovery and then reassess strategy", 
         "Buy more at the lower price"],
        ["Extremely uncomfortable - I would have trouble sleeping", 
         "Very uncomfortable - I would worry a lot", "Moderately uncomfortable but manageable", 
         "Slightly uncomfortable but not worried", 
         "Comfortable - I understand downturns are part of investing"],
        ["I keep all my money in savings accounts, fixed deposits, or government bonds",
         "I invest mostly in conservative instruments with a small portion in blue-chip stocks",
         "I have a balanced mix of stocks and bonds in my portfolio",
         "I invest primarily in stocks with some allocation to more speculative investments",
         "I actively seek high-risk, high-reward investments including emerging markets, small caps, or cryptocurrencies"],
        ["I cannot tolerate any investment losses", "I can tolerate small losses occasionally",
         "I can accept moderate losses if the long-term outlook is positive",
         "I can accept significant short-term losses for long-term growth",
         "I focus on maximum long-term returns regardless of short-term losses"],
        ["Preserve capital - avoid loss at all costs", "Income generation - steady income with minimal growth",
         "Balanced - moderate growth with some income", "Growth - focus on long-term capital appreciation",
         "Aggressive growth - maximize returns at all costs"],
        ["Very important - I may need immediate access to all funds", 
         "Important - I may need access to most funds within a year",
         "Somewhat important - I may need partial access occasionally",
         "Less important - I likely won't need access for several years",
         "Not important - This is purely long-term money"],
        ["Guaranteed return of $1,500 (total: $11,500) with no possibility of loss",
         "90% chance of gaining $3,000 (total: $13,000), but 10% chance of losing $500 (total: $9,500)",
         "80% chance of gaining $5,000 (total: $15,000), but 20% chance of losing $1,000 (total: $9,000)",
         "70% chance of gaining $7,500 (total: $17,500), but 30% chance of losing $2,000 (total: $8,000)",
         "60% chance of gaining $10,000 (total: $20,000), but 40% chance of losing $3,000 (total: $7,000)"],
        ["Portfolio A: 4% Expected Return, -5% Worst Case, 13% Best Case",
         "Portfolio B: 6% Expected Return, -10% Worst Case, 20% Best Case",
         "Portfolio C: 8% Expected Return, -15% Worst Case, 28% Best Case",
         "Portfolio D: 10% Expected Return, -25% Worst Case, 35% Best Case",
         "Portfolio E: 12% Expected Return, -35% Worst Case, 45% Best Case"]
    ]
};

// Portfolio scenario data
const scenarioData = {
    'base': {
        name: 'Base Case',
        returnMultiplier: 1.0,
        volatilityMultiplier: 1.0,
        description: 'Expected performance based on historical returns and volatility'
    },
    'bull': {
        name: 'Bull Market',
        returnMultiplier: 1.5,
        volatilityMultiplier: 0.8,
        description: 'Strong economic growth with above-average returns and below-average volatility'
    },
    'bear': {
        name: 'Bear Market',
        returnMultiplier: 0.5,
        volatilityMultiplier: 1.5,
        description: 'Economic contraction with below-average returns and above-average volatility'
    }
};