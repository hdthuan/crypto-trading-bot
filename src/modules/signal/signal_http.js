module.exports = class SignalHttp {
  constructor(signalRepository) {
    this.signalRepository = signalRepository;
  }

  async getSignals(since, exchange = null, symbol = null, strategy = null) {
    return await this.signalRepository.getSignals(since, exchange, symbol, strategy);
  }

  async getAllSymbols(){
    return await this.signalRepository.getAllSymbols()
  }

  async getAllExchanges(){
    return await this.signalRepository.getAllExchanges()
  }

  async getAllStrategies(){
    return await this.signalRepository.getAllStrategies()
  }
};
