var fs = require("fs");
const persitedTopProfits = require("../../../temp/top-profits.json");

module.exports = class TrailingStopCalculator {
  constructor(
    logger,
    eventEmitter
  ) {
    this.logger = logger;
    this.topProfits = persitedTopProfits
    this.logger.info(`TOP PROFITS: ${JSON.stringify(this.topProfits)}`)
    this.eventEmitter = eventEmitter;
    const me = this;
    this.eventEmitter.on('position.closed', (position) => {
      const positionIndicatorKey = me.getPositionIndicatorKey(position);
      const symbol = `${position.exchange}_${positionIndicatorKey}`
      if (me.topProfits[symbol]) {
        delete me.topProfits[symbol];
        me.persitTopProfitsAsync();
      }
    })
    this.eventEmitter.on('position.profit.changed', (position) => {
      const positionIndicatorKey = me.getPositionIndicatorKey(position);
      const exchangeSymbol = `${position.exchange}_${positionIndicatorKey}`
      const topProfit = this.topProfits[exchangeSymbol] || 0;
      const profit = position.profit;
      if (profit > topProfit) {
        this.logger.debug(`TrailingStopCalculator: new profit top reached: ${exchangeSymbol} - ${profit}`);
        this.topProfits[exchangeSymbol] = profit;
        this.persitTopProfitsAsync();
      }
    })
  }

  getPositionIndicatorKey(position) {
    return `${position.symbol}_${position.side}_${position.entry}`;
  }

  getTopProfitForPosition(exchange, position) {
    const indicatorKey = this.getPositionIndicatorKey(position)
    return this.topProfits[`${exchange}_${indicatorKey}`]
  }

  collectPositionProfit(exchange, ticker, position) {
    const profit = position.profit;
    this.logger.debug(`TrailingStopCalculator: currentProfit: ${profit}`);
    const exchangeSymbol = `${exchange.getName()}_${this.getPositionIndicatorKey(position)}`;
    const topProfit = this.topProfits[exchangeSymbol] || 0;
    if (profit > topProfit) {
      this.logger.debug(`TrailingStopCalculator: new profit top reached: ${exchangeSymbol} - ${profit}`);

      this.topProfits[exchangeSymbol] = profit;
      this.persitTopProfitsAsync();
    }
    return profit;
  }

  calculateStopProfitOffset(exchange, position, config) {
    const { target_percent, down_percent } = config;
    const exchangeSymbol = `${exchange.getName()}_${this.getPositionIndicatorKey(position)}`;
    const topProfit = this.topProfits[exchangeSymbol] || 0;
    this.logger.debug(`TrailingStopCalculator: currentTopProfit: ${topProfit}`);
    if (topProfit < target_percent) {
      return;
    }
    return topProfit * (1 - down_percent);
  }

  cleanUpTopProfit(exchange, position) {
    const exchangeSymbol = `${exchange.getName()}_${this.getPositionIndicatorKey(position)}`;
    delete this.topProfits[exchangeSymbol];
    this.persitTopProfitsAsync();
  }

  persitTopProfitsAsync() {
    this.logger.debug(`Start persit top-profits: ${JSON.stringify(this.topProfits)}`)
    fs.writeFile("./temp/top-profits.json", JSON.stringify(this.topProfits), "utf8", () => { });
  }
}