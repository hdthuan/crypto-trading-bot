module.exports = class Reporting {
  constructor(
    exchangeManager,
    closedPositionRepository,
    logger,
    eventEmitter
  ) {
    this.exchangeManager = exchangeManager;
    this.closedPositionRepository = closedPositionRepository;
    this.logger = logger;
    this.init = false
    this.positions = {};
    this.eventEmitter = eventEmitter;
  }

  storePosition(exchangePosition) {
    if (!exchangePosition.getExchange() || !exchangePosition.getPosition()) {
      return;
    }
    const key = exchangePosition.getKey()
    const position = exchangePosition.getPosition();
    const profit = position.getProfit()
    const symbol = position.getSymbol();
    const entry = position.getEntry();
    const side = position.getSide();
    const amount = position.getAmount();
    const createdAt = position.getCreatedAt();
    const updatedAt = position.getUpdatedAt();
    let currentPosition = this.positions[key]
    if (!currentPosition) {
      currentPosition = {};
      this.positions[key] = currentPosition;
    }
    currentPosition.exchange = exchangePosition.getExchange()
    if (profit) {
      currentPosition.profit = profit;
    }
    if (symbol) {
      currentPosition.symbol = symbol;
    }
    if (entry) {
      currentPosition.entry = entry;
    }
    if (createdAt) {
      currentPosition.createdAt = createdAt;
    }
    if (updatedAt) {
      currentPosition.updatedAt = updatedAt;
    }
    if (side) {
      currentPosition.side = side;
    }
    if (amount) {
      currentPosition.amount = amount;
    }
  }

  start() {
    this.logger.debug('Reporting module started');

    process.on('SIGINT', async () => {
      // force exit in any case
      setTimeout(() => {
        process.exit();
      }, 7500);
      process.exit();
    });

    const me = this;

    // cronjob like tasks
    setInterval(async () => {
      try {
        const positions = await me.exchangeManager.getPositions();
        if (!me.init) {
          positions.forEach(position => {
            me.storePosition(position)
          });
          me.init = true;
        }
        const currentOpen = [];

        for (const position of positions) {
          const key = position.getKey();
          currentOpen.push(key);
          me.storePosition(position)
        }

        for (const [key, position] of Object.entries(me.positions)) {
          if (!currentOpen.includes(key)) {
            try {
              me.logger.info(`position closed: ${JSON.stringify(position)}`)
              await me.closedPositionRepository.insertClosedPosition(
                position.exchange,
                position
              )
            } catch (e) {
              me.logger.error('insertClosedPosition: ' + String(e));
            }
            me.eventEmitter.emit('position.closed', position)
            delete me.positions[key];
          }
        }
      } catch (e) {
        me.logger.error('Reporting tick errors: ' + String(e));
      }
    }, 1000);
  }
};
