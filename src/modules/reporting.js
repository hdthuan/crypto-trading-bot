module.exports = class Reporting {
  constructor(
    exchangeManager,
    closedPositionRepository,
    logger,
  ) {
    this.exchangeManager = exchangeManager;
    this.closedPositionRepository = closedPositionRepository;
    this.logger = logger;
    this.init = false
    this.positions = {};
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
            me.positions[position.getReportingKey()] = position;
          });
          me.init = true;
        }
        const currentOpen = [];

        for (const position of positions) {
          const key = position.getReportingKey();
          currentOpen.push(key);

          if (!(key in me.positions)) {
            // new position
            const currentPosition = me.positions[position.getReportingKey()]
            me.positions[position.getReportingKey()] = { ...currentPosition, ...position };
          }
        }

        for (const [key, position] of Object.entries(me.positions)) {
          if (!currentOpen.includes(key)) {
            try {
              if (key !== "__UNSAFE__") {
                me.logger.info(`position closed: ${JSON.stringify([position.getExchange(), position.getPosition()])}`)
                await me.closedPositionRepository.insertClosedPosition(position.getExchange(), position.getPosition())
              }
            } catch (e) {
              me.logger.error('insertClosedPosition: ' + String(e));
            }
            delete me.positions[key];
          }
        }
      } catch (e) {
        me.logger.error('Reporting tick errors: ' + String(e));
      }
    }, 1000);
  }
};
