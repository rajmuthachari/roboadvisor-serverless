import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import yfinance as yf
from scipy.optimize import minimize
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Define the output JSON path
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
        "iShares Barclays Capital USD Asia High Yield Bond Index ETF": "This ETF seeks to track the performance of an index composed of USD-denominated high yield bonds issued by Asian governments and Asian-domiciled corporations."
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
        "iShares Barclays Capital USD Asia High Yield Bond Index ETF": "Equity - US"
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
        'iShares Barclays Capital USD Asia High Yield Bond Index ETF': 'QL3.SI'
    }
    
    try:
        # 1. Fetch data from Yahoo Finance
        prices_df = fetch_fund_data(funds_with_tickers)
        print(f"Loaded price data with shape: {prices_df.shape}")
        
        # Save the data to CSV (optional)
        #prices_df.to_csv("close_prices.csv")
        #print("Saved price data to close_prices.csv")
        
        # 2. Calculate daily returns
        returns_df = prices_df.pct_change().dropna()
        print(f"Calculated returns with shape: {returns_df.shape}")
        
        # 3. Calculate fund metrics
        fund_metrics = calculate_metrics(returns_df, risk_free_rate=0.03)
        
        # 4. Calculate covariance matrix
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # 5. Efficient frontier analysis
        ef_results = efficient_frontier(returns_df, cov_matrix)
        
        # 6. Prepare data for JSON export
        output_data = prepare_output_data(
            fund_metrics, 
            cov_matrix, 
            ef_results, 
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

def fetch_fund_data(fund_tickers):
    """
    Fetch historical price data for a list of funds using Yahoo Finance
    
    Parameters:
    -----------
    fund_tickers : dict
        Dictionary with fund names as keys and their tickers as values
        
    Returns:
    --------
    prices_df : pandas.DataFrame
        DataFrame containing closing prices for all funds
    """
    # Set the date range for historical data (2 years of data)
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=2*365)).strftime('%Y-%m-%d')
    
    print(f"Fetching fund data from {start_date} to {end_date}...")
    
    fund_data = {}
    
    for fund_name, ticker in fund_tickers.items():
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(start=start_date, end=end_date)
            
            if not hist.empty:
                fund_data[fund_name] = hist['Close'].copy()
                print(f"Successfully fetched data for {fund_name} ({ticker})")
            else:
                print(f"No data available for {fund_name} ({ticker})")
        except Exception as e:
            print(f"Error fetching data for {fund_name} ({ticker}): {e}")
    
    # Convert to a DataFrame for easier analysis
    prices_df = pd.DataFrame(fund_data)
    
    # Fill any missing values using forward fill method
    prices_df = prices_df.fillna(method='ffill')
    
    return prices_df

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
    
    # Function to minimize portfolio volatility for a given target return
    def portfolio_volatility(weights, mean_returns, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    # Function to calculate portfolio return
    def portfolio_return(weights, mean_returns):
        return np.sum(mean_returns * weights)
    
    # Function for portfolio volatility optimization
    def min_volatility(target_return, mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, mean_returns, cov_matrix)
        
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
        
        return result['fun'], result['x']
    
    # Find the Global Minimum Variance Portfolio (GMVP)
    def find_gmvp(mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, mean_returns, cov_matrix)
        
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
            port_volatility = portfolio_volatility(weights, mean_returns, cov_matrix)
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
        
        port_vol = portfolio_volatility(result['x'], mean_returns, cov_matrix)
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
    target_returns_with_short = np.linspace(
        gmvp_with_short['return'], 
        max(mean_returns) * 1.2,  # Go a bit beyond the highest return
        points
    )
    
    ef_volatility_with_short = []
    ef_returns_with_short = []
    
    for target in target_returns_with_short:
        try:
            volatility, _ = min_volatility(target, mean_returns, cov_matrix, constraint_set_with_short)
            ef_volatility_with_short.append(volatility)
            ef_returns_with_short.append(target)
        except:
            # Skip if optimization fails for a target return
            pass
    
    # Generate efficient frontier points without short sales
    target_returns_no_short = np.linspace(
        gmvp_no_short['return'],
        max(mean_returns),
        points
    )
    
    ef_volatility_no_short = []
    ef_returns_no_short = []
    
    for target in target_returns_no_short:
        try:
            volatility, _ = min_volatility(target, mean_returns, cov_matrix, constraint_set_no_short)
            ef_volatility_no_short.append(volatility)
            ef_returns_no_short.append(target)
        except:
            # Skip if optimization fails for a target return
            pass
    
    return {
        'ef_with_short': {
            'returns': ef_returns_with_short,
            'volatilities': ef_volatility_with_short
        },
        'ef_no_short': {
            'returns': ef_returns_no_short,
            'volatilities': ef_volatility_no_short
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

def prepare_output_data(fund_metrics, cov_matrix, ef_results, fund_descriptions, fund_asset_classes, funds_with_tickers):
    """Prepare data for JSON export"""
    # Convert covariance matrix to list of lists
    cov_matrix_list = cov_matrix.values.tolist()
    
    # Define expense ratios (normally these would come from another source)
    # Here we're just setting some reasonable defaults
    expense_ratios = {fund: 0.0035 for fund in fund_metrics.keys()}
    
    # Prepare the fund data structure
    fund_data = {}
    for fund, metrics in fund_metrics.items():
        fund_data[fund] = {
            'annualizedReturn': metrics['annualizedReturn'],
            'annualizedVolatility': metrics['annualizedVolatility'],
            'sharpeRatio': metrics['sharpeRatio'],
            'maxDrawdown': metrics['maxDrawdown'],
            'description': fund_descriptions.get(fund, "No description available."),
            'assetClass': fund_asset_classes.get(fund, "Equity"),
        }
    
    # Prepare the final data structure
    output_data = {
        'fundData': fund_data,
        'covarianceMatrix': cov_matrix_list,
        'fundsWithTickers': funds_with_tickers,
        'fundDescriptions': fund_descriptions,
        'fundAssetClasses': fund_asset_classes,
        'efficientFrontier': ef_results
    }
    
    return output_data

if __name__ == "__main__":
    main()