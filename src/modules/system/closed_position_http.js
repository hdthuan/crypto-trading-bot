const _ = require('lodash');

module.exports = class ClosedPositionHttp {
  constructor(closedPositionRepository) {
    this.closedPositionRepository = closedPositionRepository;
  }

  async getClosedPositionsPageVariables(request, response) {
    let includeSymbols = request.query.include_symbold || [];
    let limit = 200

    if(request.query.limit) {
      limit = parseInt(request.query.limit)
    }

    return {
      logs: await this.closedPositionRepository.getLatestClosedPositions(includeSymbols, limit),
      symbols: await this.closedPositionRepository.getSymbols(),
      form: {
        includeSymbols: includeSymbols
      }
    };
  }
};
