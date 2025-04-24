import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import yfinance as yf
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Import PyPortfolioOpt modules
from pypfopt import EfficientFrontier, risk_models, expected_returns
from pypfopt import CLA, plotting
from pypfopt.efficient_frontier import EfficientCVaR

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
        "iShares Barclays Capital USD Asia High Yield Bond Index ETF": "Fixed Income - High Yield"
    }
        
    funds_with_tickers = {
        "SPDR Gold Shares": "GSD.SI",
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
        
        # 2. Calculate daily returns
        returns_df = prices_df.pct_change().dropna()
        print(f"Calculated returns with shape: {returns_df.shape}")
        
        # 3. Calculate fund metrics
        fund_metrics = calculate_metrics(returns_df, risk_free_rate=0.0255)
        
        # 4. Calculate covariance matrix using PyPortfolioOpt
        # Use PyPortfolioOpt's risk_models to compute a more robust covariance matrix
        cov_matrix = risk_models.sample_cov(prices_df, returns_data=False, frequency=252)
        
        # 5. Efficient frontier analysis using PyPortfolioOpt
        ef_results = efficient_frontier_analysis(prices_df, returns_df, cov_matrix)
        
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

        plot_efficient_frontier(ef_results, fund_metrics)
        
    except Exception as e:
        print(f"Error during portfolio analysis: {e}")
        import traceback
        traceback.print_exc()

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
    end_date="2025-04-24"
    start_date="2023-04-21"
    
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

def calculate_metrics(returns_df, risk_free_rate=0.0255):
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

def efficient_frontier_analysis(prices_df, returns_df, cov_matrix, rf_rate=0.0255, points=500):
    """
    Generate the efficient frontier with and without short sales using PyPortfolioOpt
    """
    # Get expected returns using mean historical return method
    # For more robust results, we use PyPortfolioOpt's expected_returns module
    mean_returns = expected_returns.mean_historical_return(prices_df, frequency=252)
    
    # Number of assets
    n_assets = len(mean_returns)
    asset_names = mean_returns.index.tolist()
    
    # Generate efficient frontier with short sales allowed
    # We'll use the CLA (Critical Line Algorithm) which is more efficient for this
    # Create the efficient frontier object with short sales allowed
    ef_with_short = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(-1, 1))
    
    # Find the Global Minimum Variance Portfolio (GMVP) with short sales
    ef_with_short.min_volatility()
    gmvp_with_short_weights = ef_with_short.clean_weights()
    gmvp_with_short_performance = ef_with_short.portfolio_performance()
    
    # Store the results
    gmvp_with_short = {
        'volatility': gmvp_with_short_performance[1],
        'return': gmvp_with_short_performance[0],
        'weights': [gmvp_with_short_weights.get(asset, 0) for asset in asset_names]
    }
    
    # Find the Market Portfolio (tangent/max Sharpe ratio) with short sales
    ef_with_short = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(-1, 1))
    ef_with_short.max_sharpe(risk_free_rate=rf_rate)
    market_portfolio_with_short_weights = ef_with_short.clean_weights()
    market_portfolio_with_short_performance = ef_with_short.portfolio_performance()
    
    # Store the results
    market_portfolio_with_short = {
        'volatility': market_portfolio_with_short_performance[1],
        'return': market_portfolio_with_short_performance[0],
        'weights': [market_portfolio_with_short_weights.get(asset, 0) for asset in asset_names],
        'sharpe': market_portfolio_with_short_performance[2]
    }
    
    # Generate efficient frontier without short sales (long only)
    ef_no_short = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(0, 1))
    
    # Find the Global Minimum Variance Portfolio (GMVP) without short sales
    ef_no_short.min_volatility()
    gmvp_no_short_weights = ef_no_short.clean_weights()
    gmvp_no_short_performance = ef_no_short.portfolio_performance()
    
    # Store the results
    gmvp_no_short = {
        'volatility': gmvp_no_short_performance[1],
        'return': gmvp_no_short_performance[0],
        'weights': [gmvp_no_short_weights.get(asset, 0) for asset in asset_names]
    }
    
    # Find the Market Portfolio (tangent/max Sharpe ratio) without short sales
    ef_no_short = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(0, 1))
    ef_no_short.max_sharpe(risk_free_rate=rf_rate)
    market_portfolio_no_short_weights = ef_no_short.clean_weights()
    market_portfolio_no_short_performance = ef_no_short.portfolio_performance()
    
    # Store the results
    market_portfolio_no_short = {
        'volatility': market_portfolio_no_short_performance[1],
        'return': market_portfolio_no_short_performance[0],
        'weights': [market_portfolio_no_short_weights.get(asset, 0) for asset in asset_names],
        'sharpe': market_portfolio_no_short_performance[2]
    }
    
    # Generate efficient frontier points with short sales
    # Use CLA for more efficient generation of the entire frontier
    cla_with_short = CLA(mean_returns, cov_matrix, weight_bounds=(-1, 1))
    
    # We want to generate specific points along the frontier for JSON export
    # Define return targets between GMVP return and slightly above the highest return asset
    min_ret = gmvp_with_short['return']
    max_ret = max(mean_returns) * 1.2  # Go a bit beyond the highest return
    
    target_returns_with_short = np.linspace(min_ret, max_ret, points)
    ef_volatility_with_short = []
    ef_returns_with_short = []
    
    # Create a new EF object for each target return
    for target_return in target_returns_with_short:
        try:
            ef = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(-1, 1))
            ef.efficient_return(target_return)
            ret, vol, _ = ef.portfolio_performance()
            ef_returns_with_short.append(ret)
            ef_volatility_with_short.append(vol)
        except Exception:
            # Skip if optimization fails for a target return
            pass
    
    # Generate efficient frontier points without short sales
    # Define return targets between GMVP return and max return asset
    min_ret = gmvp_no_short['return']
    max_ret = max(mean_returns)
    
    target_returns_no_short = np.linspace(min_ret, max_ret, points)
    ef_volatility_no_short = []
    ef_returns_no_short = []
    
    # Create a new EF object for each target return
    for target_return in target_returns_no_short:
        try:
            ef = EfficientFrontier(mean_returns, cov_matrix, weight_bounds=(0, 1))
            ef.efficient_return(target_return)
            ret, vol, _ = ef.portfolio_performance()
            ef_returns_no_short.append(ret)
            ef_volatility_no_short.append(vol)
        except Exception:
            # Skip if optimization fails for a target return
            pass
    
    # Prepare the final results
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
            'names': asset_names
        }
    }

def prepare_output_data(fund_metrics, cov_matrix, ef_results, fund_descriptions, fund_asset_classes, funds_with_tickers):
    """Prepare data for JSON export"""
    # Convert covariance matrix to list of lists
    cov_matrix_list = cov_matrix.values.tolist()
    
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
        'fundsWithTickers': funds_with_tickers,
        'fundDescriptions': fund_descriptions,
        'fundAssetClasses': fund_asset_classes,
        'efficientFrontier': ef_results
    }
    
    return output_data

def plot_efficient_frontier(ef_results, fund_metrics):
    """
    Create a visual representation of the efficient frontier, individual assets,
    and key portfolios (GMVP and market portfolio)
    """
    plt.figure(figsize=(12, 8))
    
    # Plot the efficient frontiers
    plt.plot(
        ef_results['ef_with_short']['volatilities'],
        ef_results['ef_with_short']['returns'],
        'b-', label='Efficient Frontier (with short sales)'
    )
    plt.plot(
        ef_results['ef_no_short']['volatilities'],
        ef_results['ef_no_short']['returns'],
        'g-', label='Efficient Frontier (no short sales)'
    )
    
    # Plot individual assets
    asset_returns = list(ef_results['assets']['returns'].values())
    asset_vols = [fund_metrics[fund]['annualizedVolatility'] for fund in ef_results['assets']['names']]
    plt.scatter(asset_vols, asset_returns, c='red', marker='o', label='Individual Assets')
    
    # Add asset labels
    for i, txt in enumerate(ef_results['assets']['names']):
        plt.annotate(txt, (asset_vols[i], asset_returns[i]), fontsize=8)
    
    # Plot GMVP
    plt.scatter(
        ef_results['gmvp_with_short']['volatility'],
        ef_results['gmvp_with_short']['return'],
        c='blue', marker='*', s=100, label='GMVP (with short sales)'
    )
    plt.scatter(
        ef_results['gmvp_no_short']['volatility'],
        ef_results['gmvp_no_short']['return'],
        c='green', marker='*', s=100, label='GMVP (no short sales)'
    )
    
    # Plot Market Portfolio
    plt.scatter(
        ef_results['market_portfolio_with_short']['volatility'],
        ef_results['market_portfolio_with_short']['return'],
        c='blue', marker='d', s=100, label='Market Portfolio (with short sales)'
    )
    plt.scatter(
        ef_results['market_portfolio_no_short']['volatility'],
        ef_results['market_portfolio_no_short']['return'],
        c='green', marker='d', s=100, label='Market Portfolio (no short sales)'
    )
    
    # Add Capital Market Line
    rf_rate = 0.0255  # Risk-free rate
    # With short sales
    mp_with_short = ef_results['market_portfolio_with_short']
    max_vol_with_short = max(ef_results['ef_with_short']['volatilities']) * 1.2
    cml_x_with_short = [0, mp_with_short['volatility'], max_vol_with_short]
    cml_y_with_short = [
        rf_rate,
        mp_with_short['return'],
        rf_rate + (mp_with_short['return'] - rf_rate) / mp_with_short['volatility'] * max_vol_with_short
    ]
    plt.plot(cml_x_with_short, cml_y_with_short, 'b--', label='CML (with short sales)')
    
    # Without short sales
    mp_no_short = ef_results['market_portfolio_no_short']
    max_vol_no_short = max(ef_results['ef_no_short']['volatilities']) * 1.2
    cml_x_no_short = [0, mp_no_short['volatility'], max_vol_no_short]
    cml_y_no_short = [
        rf_rate,
        mp_no_short['return'],
        rf_rate + (mp_no_short['return'] - rf_rate) / mp_no_short['volatility'] * max_vol_no_short
    ]
    plt.plot(cml_x_no_short, cml_y_no_short, 'g--', label='CML (no short sales)')
    
    # Add labels and title
    plt.xlabel('Annualized Volatility')
    plt.ylabel('Annualized Return')
    plt.title('Efficient Frontier Analysis')
    plt.grid(True)
    plt.legend()
    
    # Save the plot
    plt.savefig('efficient_frontier.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print("Efficient frontier plot saved as 'efficient_frontier.png'")

if __name__ == "__main__":
    main()