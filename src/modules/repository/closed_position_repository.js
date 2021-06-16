module.exports = class ClosedPositionRepository {
  constructor(db) {
    this.db = db;
  }

  insertClosedPosition(exchange, position) {
    const stmt = this.db.prepare(
      'INSERT INTO closed_positions' +
      '(exchange, symbol, side, amount, [entry], profit, created_at, closed_at) ' +
      'VALUES ($exchange, $symbol, $side, $amount, $entry, $profit, $createdAt, $closedAt)'
    );

    stmt.run({
      exchange: exchange,
      symbol: position.symbol,
      side: position.side,
      amount: position.amount,
      entry: position.entry,
      profit: position.profit,
      createdAt: position.createdAt ? Math.floor(position.createdAt.getTime() / 1000) : Math.floor(new Date().getTime() / 1000),
      closedAt: Math.floor(new Date().getTime() / 1000),
    });
  }

  getLatestClosedPositions(includes, limit = 200) {
    return new Promise(resolve => {
      let sql = `SELECT * from closed_positions order by closed_at DESC LIMIT ${limit}`;

      const parameters = {};

      if (includes.length > 0) {
        sql = `SELECT * from closed_positions WHERE symbol IN (${includes
          .map((_, index) => `$symbol_${index}`)
          .join(', ')}) order by created_at DESC LIMIT ${limit}`;

        includes.forEach((include, index) => {
          parameters[`symbol_${index}`] = include;
        });
      }

      const stmt = this.db.prepare(sql);
      resolve(stmt.all(parameters));
    });
  }

  getSymbols() {
    return new Promise(resolve => {
      const stmt = this.db.prepare('SELECT symbol from closed_positions GROUP BY symbol');
      resolve(stmt.all().map(r => r.symbol));
    });
  }
};
