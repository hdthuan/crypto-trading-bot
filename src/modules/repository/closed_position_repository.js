module.exports = class ClosedPositionRepository {
  constructor(db) {
    this.db = db;
  }

  insertClosedPosition(exchange, position) {
    const stmt = this.db.prepare(
      'INSERT INTO closed_position'+
      '(exchange, symbol, side, amount, entry, profit, created_at, closed_at) '+
      'VALUES ($exchange, $symbol, $side, $amount, $entry, $profit, $createdAt, $closedAt)'
    );

    stmt.run({
      exchange: exchange,
      symbol: position.getSymbol(),
      side: position.getSide(),
      amount: position.getAmount(),
      entry: position.getEntry(),
      profit: position.getProfit(),
      createdAt: position.getCreatedAt(),
      closedAt: new Date(),
    });
  }

  getLatestClosedPositions(includes, limit = 200) {
    return new Promise(resolve => {
      let sql = `SELECT * from closed_positions order by closed_at DESC LIMIT ${limit}`;

      const parameters = {};

      if (includes.length > 0) {
        sql = `SELECT * from logs WHERE level IN (${includes
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
