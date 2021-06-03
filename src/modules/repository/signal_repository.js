module.exports = class SignalRepository {
  constructor(db) {
    this.db = db;
  }

  getSignals(since, exchange = null, symbol = null, strategy = null) {
    return new Promise(resolve => {
      let exchangeQuery = !exchange ? '' : ' AND exchange = $exchange';
      let symbolQuery = !symbol ? '' : ' AND symbol = $symbol';
      let strategyQuery = !strategy ? '' : ' AND strategy = $strategy';
      let sql = `SELECT * from signals where income_at > $since${exchangeQuery
        }${symbolQuery
        }${strategyQuery
        } order by income_at DESC LIMIT 100`;
      const stmt = this.db.prepare(sql);
      resolve(stmt.all({ since, exchange, symbol, strategy }));
    });
  }

  insertSignal(exchange, symbol, options, side, strategy) {
    const stmt = this.db.prepare(
      'INSERT INTO signals(exchange, symbol, options, side, strategy, income_at) VALUES ($exchange, $symbol, $options, $side, $strategy, $income_at)'
    );

    stmt.run({
      exchange: exchange,
      symbol: symbol,
      options: JSON.stringify(options || {}),
      side: side,
      strategy: strategy,
      income_at: Math.floor(Date.now() / 1000)
    });
  }

  getAllExchanges(){
    return new Promise(resolve => {
      const stmt = this.db.prepare('SELECT exchange from signals GROUP BY exchange');
      resolve(stmt.all().map(r => r.exchange));
    });
  }

  getAllSymbols(){
    return new Promise(resolve => {
      const stmt = this.db.prepare('SELECT symbol from signals GROUP BY symbol');
      resolve(stmt.all().map(r => r.symbol));
    });
  }

  getAllStrategies(){
    return new Promise(resolve => {
      const stmt = this.db.prepare('SELECT strategy from signals GROUP BY strategy');
      resolve(stmt.all().map(r => r.strategy));
    });
  }
};
