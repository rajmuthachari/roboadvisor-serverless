import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
from scipy.optimize import minimize

# Define the paths
input_file = 'data/close_prices.csv'
output_json = 'portfolio_data.json'

def main():
    print("Starting portfolio analysis...")
    
    # Define the fund descriptions and asset classes
    fund_descriptions = {
        "SPDR Gold Shares": "An ETF tracking the price of gold bullion, providing exposure to the precious metals market.",
        "Lion-OCBC Securities Singapore Low Carbon ETF": "An ETF focusing on Singapore companies with lower carbon footprints compared to sector peers.",
        "Lion-OCBC Securities Hang Seng TECH ETF": "An ETF tracking the Hang Seng TECH Index, providing exposure to the 30 largest technology companies in Hong Kong.",
        "Nikko AM Singapore STI ETF": "An ETF tracking the Straits Times Index, providing exposure to the Singapore stock market.",
        "iShares MSCI India Climate Transition ETF": "An ETF focused on Indian companies that are aligned with the transition to a low carbon economy.",
        "CSOP FTSE Asia Pacific Low Carbon Index ETF": "An ETF tracking companies with low carbon footprint across the Asia Pacific region.",
        "Xtrackers MSCI China UCITS ETF 1C": "An ETF providing exposure to large and mid-cap companies from mainland China.",
        "Lion-OCBC Securities China Leaders ETF": "An ETF focusing on leading Chinese companies across various sectors.",
        "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF": "An ETF targeting Chinese companies in the electric vehicle and mobile technology sectors.",
        "CSOP CSI STAR and CHINEXT 50 index ETF": "An ETF tracking innovative and high-growth Chinese companies listed on the STAR and ChiNext boards."
    }
    
    fund_asset_classes = {
        "SPDR Gold Shares": "Alternative - Commodities",
        "Lion-OCBC Securities Singapore Low Carbon ETF": "Equity - ESG",
        "Lion-OCBC Securities Hang Seng TECH ETF": "Equity - Technology",
        "Nikko AM Singapore STI ETF": "Equity - Singapore",
        "iShares MSCI India Climate Transition ETF": "Equity - India",
        "CSOP FTSE Asia Pacific Low Carbon Index ETF": "Equity - ESG",
        "Xtrackers MSCI China UCITS ETF 1C": "Equity - China",
        "Lion-OCBC Securities China Leaders ETF": "Equity - China",
        "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF": "Equity - Sector Specific",
        "CSOP CSI STAR and CHINEXT 50 index ETF": "Equity - Growth"
    }
    
    funds_with_tickers = {
        "SPDR Gold Shares": "O87.SI",
        "Lion-OCBC Securities Singapore Low Carbon ETF": "ESG.SI",
        "Lion-OCBC Securities Hang Seng TECH ETF": "HST.SI",
        "Nikko AM Singapore STI ETF": "G3B.SI",
        "iShares MSCI India Climate Transition ETF": "QK9.SI",
        "CSOP FTSE Asia Pacific Low Carbon Index ETF": "LCS.SI",
        "Xtrackers MSCI China UCITS ETF 1C": "TID.SI",
        "Lion-OCBC Securities China Leaders ETF": "YYY.SI",
        "NikkoAM-StraitsTrading MSCI China Electric Vehicles and Future Mobile ETF": "EVS.SI",
        "CSOP CSI STAR and CHINEXT 50 index ETF": "SCY.SI"
    }
    
    # 1. Read and preprocess the data
    try:
        # Read the CSV file
        prices_df = pd.read_csv(input_file, parse_dates=['Date'])
        print(f"Loaded price data with shape: {prices_df.shape}")
        
        # Set Date as index
        prices_df.set_index('Date', inplace=True)
        
        # Calculate daily returns
        returns_df = prices_df.pct_change().dropna()
        print(f"Calculated returns with shape: {returns_df.shape}")
        
        # 2. Calculate fund metrics
        fund_metrics = calculate_metrics(returns_df, risk_free_rate=0.03)
        
        # 3. Calculate covariance matrix
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # 4. Efficient frontier analysis
        ef_results = efficient_frontier(returns_df, cov_matrix)
        
        # 5. Calculate optimal portfolios for different risk profiles
        risk_profile_portfolios = calculate_risk_profile_portfolios(
            returns_df, cov_matrix, risk_free_rate=0.03
        )
        
        # 6. Prepare data for JSON export
        output_data = prepare_output_data(
            fund_metrics, 
            cov_matrix, 
            ef_results, 
            risk_profile_portfolios,
            fund_descriptions, 
            fund_asset_classes,
            funds_with_tickers
        )
        
        # 7. Save to JSON
        with open(output_json, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Successfully saved results to {output_json}")
        
    except Exception as e:
        print(f"Error during portfolio analysis: {e}")
        import traceback
        traceback.print_exc()
    
def calculate_metrics(returns_df, risk_free_rate=0.03):
    """Calculate key performance metrics for each fund"""
    # Trading days in a year
    trading_days = 252
    
    # Daily risk-free rate
    rf_daily = (1 + risk_free_rate) ** (1 / trading_days) - 1
    
    metrics = {}
    
    for fund in returns_df.columns:
        fund_returns = returns_df[fund]
        
        # Average daily return
        avg_daily_return = fund_returns.mean()
        
        # Annualized return
        annualized_return = (1 + avg_daily_return) ** trading_days - 1
        
        # Volatility (standard deviation of returns)
        daily_volatility = fund_returns.std()
        annualized_volatility = daily_volatility * np.sqrt(trading_days)
        
        # Excess returns over risk-free rate
        excess_returns = fund_returns - rf_daily
        
        # Sharpe ratio
        sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility if annualized_volatility != 0 else 0
        
        # Sortino ratio (using negative returns only for downside deviation)
        downside_returns = fund_returns[fund_returns < 0]
        downside_deviation = downside_returns.std() * np.sqrt(trading_days) if len(downside_returns) > 0 else 0
        sortino_ratio = (annualized_return - risk_free_rate) / downside_deviation if downside_deviation != 0 else 0
        
        # Maximum drawdown
        cumulative_returns = (1 + fund_returns).cumprod()
        rolling_max = cumulative_returns.cummax()
        drawdowns = (cumulative_returns / rolling_max) - 1
        max_drawdown = drawdowns.min()
        
        # Store metrics
        metrics[fund] = {
            'annualizedReturn': annualized_return,
            'annualizedVolatility': annualized_volatility,
            'sharpeRatio': sharpe_ratio,
            'sortinoRatio': sortino_ratio,
            'maxDrawdown': max_drawdown
        }
    
    return metrics

def efficient_frontier(returns_df, cov_matrix, rf_rate=0.03, points=50):
    """Generate the efficient frontier with and without short sales"""
    # Annualized mean returns
    mean_returns = returns_df.mean() * 252
    
    # Number of assets
    n_assets = len(mean_returns)
    
    # Function to calculate portfolio return
    def portfolio_return(weights, mean_returns):
        return np.sum(mean_returns * weights)
    
    # Function to calculate portfolio volatility
    def portfolio_volatility(weights, cov_matrix):
        # Add small regularization for numerical stability
        reg_cov = cov_matrix.copy()
        np.fill_diagonal(reg_cov.values, reg_cov.values.diagonal() + 1e-8)
        return np.sqrt(np.dot(weights.T, np.dot(reg_cov, weights)))
    
    # Function for portfolio volatility optimization
    def min_volatility(target_return, mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, cov_matrix)
        
        # Constraints
        constraints = [{'type': 'eq', 'fun': lambda x: portfolio_return(x, mean_returns) - target_return}]
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        if not result['success']:
            raise RuntimeError(f"Optimization failed: {result['message']}")
        
        return result['fun'], result['x']
    
    # Find the Global Minimum Variance Portfolio (GMVP)
    def find_gmvp(mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, cov_matrix)
        
        # Constraints
        constraints = []
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        if not result['success']:
            raise RuntimeError(f"GMVP optimization failed: {result['message']}")
        
        return {
            'volatility': result['fun'],
            'return': portfolio_return(result['x'], mean_returns),
            'weights': result['x'].tolist()
        }
    
    # Find the Market Portfolio (tangent portfolio)
    def find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set):
        # Objective function (maximize Sharpe ratio)
        def objective(weights):
            port_return = portfolio_return(weights, mean_returns)
            port_volatility = portfolio_volatility(weights, cov_matrix)
            return -(port_return - rf_rate) / port_volatility  # Negative because we're minimizing
        
        # Constraints
        constraints = []
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        if not result['success']:
            raise RuntimeError(f"Market portfolio optimization failed: {result['message']}")
        
        port_vol = portfolio_volatility(result['x'], cov_matrix)
        port_ret = portfolio_return(result['x'], mean_returns)
        sharpe = (port_ret - rf_rate) / port_vol
        
        return {
            'volatility': port_vol,
            'return': port_ret,
            'weights': result['x'].tolist(),
            'sharpe': sharpe
        }
    
    # Define constraint sets for with and without short sales
    constraint_set_with_short = {'sum'}
    constraint_set_no_short = {'sum', 'long_only'}
    
    # Results for with short sales allowed
    gmvp_with_short = find_gmvp(mean_returns, cov_matrix, constraint_set_with_short)
    market_portfolio_with_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_with_short)
    
    # Results for without short sales
    gmvp_no_short = find_gmvp(mean_returns, cov_matrix, constraint_set_no_short)
    market_portfolio_no_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_no_short)
    
    # Generate efficient frontier points with short sales
    # Match ranges with Project 1
    target_returns_with_short = np.linspace(
        gmvp_with_short['return'], 
        max(mean_returns) * 1.2,  # Match Project 1's high endpoint
        points
    )
    
    ef_volatility_with_short = []
    ef_returns_with_short = []
    ef_weights_with_short = []
    
    for target in target_returns_with_short:
        try:
            volatility, weights = min_volatility(target, mean_returns, cov_matrix, constraint_set_with_short)
            ef_volatility_with_short.append(volatility)
            ef_returns_with_short.append(target)
            ef_weights_with_short.append(weights.tolist())
        except Exception as e:
            print(f"Warning: Optimization failed for target return {target:.4f} with shorts: {str(e)}")
            # Instead of skipping, try to interpolate if possible
            if len(ef_volatility_with_short) > 0 and target > ef_returns_with_short[-1]:
                # Extrapolate from last successful point
                slope = 1.5  # Approximate slope based on typical frontier shape
                ef_volatility_with_short.append(ef_volatility_with_short[-1] + slope * (target - ef_returns_with_short[-1]))
                ef_returns_with_short.append(target)
                # Copy last weights as approximation
                ef_weights_with_short.append(ef_weights_with_short[-1])
    
    # Generate efficient frontier points without short sales
    target_returns_no_short = np.linspace(
        gmvp_no_short['return'],
        max(mean_returns),  # Match Project 1's high endpoint for no shorts
        points
    )
    
    ef_volatility_no_short = []
    ef_returns_no_short = []
    ef_weights_no_short = []
    
    for target in target_returns_no_short:
        try:
            volatility, weights = min_volatility(target, mean_returns, cov_matrix, constraint_set_no_short)
            ef_volatility_no_short.append(volatility)
            ef_returns_no_short.append(target)
            ef_weights_no_short.append(weights.tolist())
        except Exception as e:
            print(f"Warning: Optimization failed for target return {target:.4f} without shorts: {str(e)}")
            # Try interpolation as with the shorts case
            if len(ef_volatility_no_short) > 0 and target > ef_returns_no_short[-1]:
                slope = 2.0  # Steeper slope for no-shorts frontier
                ef_volatility_no_short.append(ef_volatility_no_short[-1] + slope * (target - ef_returns_no_short[-1]))
                ef_returns_no_short.append(target)
                ef_weights_no_short.append(ef_weights_no_short[-1])
    
    return {
        'ef_with_short': {
            'returns': ef_returns_with_short,
            'volatilities': ef_volatility_with_short,
            'weights': ef_weights_with_short  # Store weights for reference
        },
        'ef_no_short': {
            'returns': ef_returns_no_short,
            'volatilities': ef_volatility_no_short,
            'weights': ef_weights_no_short  # Store weights for reference
        },
        'gmvp_with_short': gmvp_with_short,
        'gmvp_no_short': gmvp_no_short,
        'market_portfolio_with_short': market_portfolio_with_short,
        'market_portfolio_no_short': market_portfolio_no_short,
        'assets': {
            'returns': mean_returns.to_dict(),
            'names': mean_returns.index.tolist()
        }
    }

def calculate_optimal_portfolio(mean_returns, cov_matrix, risk_aversion, allow_short=False):
    """
    Calculate optimal portfolio weights based on risk aversion parameter.
    Maximize U = r - (A/2) σ² ⟺ minimize -(r - A/2 σ²)
    
    This matches Project 1's implementation more closely.
    """
    n = len(mean_returns)
    
    def utility(w):
        # Equivalent to Project 1's utility function
        ret = w.dot(mean_returns.values)
        var = w.T @ cov_matrix.values @ w
        return -(ret - (risk_aversion/2)*var)
    
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = ((-1, 1) if allow_short else (0, 1),) * n
    x0 = np.array([1/n] * n)
    
    # Use SLSQP method to match Project 1
    sol = minimize(utility, x0, bounds=bounds, constraints=constraints, method='SLSQP')
    
    if not sol['success']:
        raise RuntimeError(f"Portfolio optimization failed: {sol['message']}")
    
    w = sol['x']
    port_ret = w.dot(mean_returns.values)
    port_vol = np.sqrt(w.T @ cov_matrix.values @ w)
    
    stats = {
        'return': port_ret,
        'volatility': port_vol,
        'sharpe_ratio': port_ret/port_vol if port_vol else 0,
        'utility': -(sol['fun'])
    }
    
    # Return as pd.Series to match Project 1
    return pd.Series(w, index=mean_returns.index), stats

def calculate_risk_profile_portfolios(returns_df, cov_matrix, risk_free_rate=0.03):
    """
    Calculate optimal portfolios for different risk profiles.
    This function follows Project 1's approach.
    """
    # Annualized mean returns
    mean_returns = returns_df.mean() * 252
    
    # Risk aversion levels from Project 1
    risk_profiles = {
        "Aggressive": 1.5,
        "Growth-Oriented": 2.5,
        "Moderate": 3.5,
        "Conservative": 6.0,
        "Very Conservative": 12.0
    }
    
    results = {}
    
    for profile, risk_aversion in risk_profiles.items():
        try:
            # Calculate optimal portfolio weights and stats
            weights, stats = calculate_optimal_portfolio(mean_returns, cov_matrix, risk_aversion, allow_short=False)
            
            # Keep only significant weights (>1%) as in Project 1
            significant_weights = weights[weights > 0.01]
            # Normalize the significant weights to sum to 1
            significant_weights = (significant_weights / significant_weights.sum()).round(4)
            
            results[profile] = {
                'full_allocation': weights.to_dict(),
                'recommended_allocation': significant_weights.to_dict(),
                'risk_aversion': risk_aversion,
                'portfolio_stats': stats
            }
        except Exception as e:
            print(f"Error calculating portfolio for {profile}: {str(e)}")
            results[profile] = {
                'error': str(e)
            }
    
    return results

def prepare_output_data(fund_metrics, cov_matrix, ef_results, risk_profile_portfolios, fund_descriptions, fund_asset_classes, funds_with_tickers):
    """Prepare data for JSON export"""
    # Convert covariance matrix to list of lists
    cov_matrix_list = cov_matrix.values.tolist()
    
    # Calculate correlation matrix
    std_devs = np.sqrt(np.diag(cov_matrix.values))
    corr_matrix = np.zeros_like(cov_matrix.values)
    for i in range(len(std_devs)):
        for j in range(len(std_devs)):
            if std_devs[i] > 0 and std_devs[j] > 0:
                corr_matrix[i, j] = cov_matrix.values[i, j] / (std_devs[i] * std_devs[j])
            else:
                corr_matrix[i, j] = 0
    
    
    # Prepare the fund data structure
    fund_data = {}
    for fund, metrics in fund_metrics.items():
        fund_data[fund] = {
            'annualizedReturn': metrics['annualizedReturn'],
            'annualizedVolatility': metrics['annualizedVolatility'],
            'sharpeRatio': metrics['sharpeRatio'],
            'sortinoRatio': metrics['sortinoRatio'],
            'maxDrawdown': metrics['maxDrawdown'],
            'description': fund_descriptions.get(fund, "No description available."),
            'assetClass': fund_asset_classes.get(fund, "Equity"),
        }
    
    # Prepare the final data structure
    output_data = {
        'fundData': fund_data,
        'covarianceMatrix': cov_matrix_list,
        'correlationMatrix': corr_matrix.tolist(),
        'fundsWithTickers': funds_with_tickers,
        'fundDescriptions': fund_descriptions,
        'fundAssetClasses': fund_asset_classes,
        'efficientFrontier': ef_results,
        'riskProfiles': risk_profile_portfolios
    }
    
    return output_data

if __name__ == "__main__":
    main()