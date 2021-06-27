const SignalResult = require('../dict/signal_result');

module.exports = class CCI {
  getName() {
    return 'cci_dead';
  }

  buildIndicator(indicatorBuilder, options) {
    if (!options.period) {
      throw 'Invalid period';
    }

    indicatorBuilder.add('cci', 'cci', options.period);

    indicatorBuilder.add('sma200', 'sma', options.period, {
      length: 200
    });

    indicatorBuilder.add('ema200', 'ema', options.period, {
      length: 200
    });
  }

  period(indicatorPeriod, options) {
    return this.cci(
      indicatorPeriod.getPrice(),
      indicatorPeriod.getIndicator('sma200'),
      indicatorPeriod.getIndicator('ema200'),
      indicatorPeriod.getIndicator('cci'),
      indicatorPeriod.getLastSignal(),
      options
    );
  }

  async cci(_price, sma200Full, ema200Full, cciFull, lastSignal, options) {
    if (
      !cciFull ||
      !sma200Full ||
      !ema200Full ||
      cciFull.length <= 0 ||
      sma200Full.length < 2 ||
      ema200Full.length < 2
    ) {
      return;
    }

    // remove incomplete candle
    const sma200 = sma200Full.slice(0, -1);
    const ema200 = ema200Full.slice(0, -1);
    const cci = cciFull.slice();

    const debug = {
      sma200: sma200.slice(-1)[0],
      ema200: ema200.slice(-1)[0],
      cci: cci.slice(-1)[0]
    };

    const last = cci.slice(-1)[0];

    const isCciNotSafe = Math.abs(last) < options.safe
    debug.isCciNotSafe = isCciNotSafe

    const isLastSignalLong = lastSignal === "long"
    const isLastSignalShort = lastSignal === "short"

    // // trend change
    // if (isCciNotSafe) {
    //   if (isLastSignalLong || isLastSignalShort) {
    //     return SignalResult.createSignal('close', debug);
    //   }
    //   return SignalResult.createEmptySignal(debug);
    // }

    const isCciOver = Math.abs(last) > options.over
    const isCciDown = last < 0;
    const isCciUp = !isCciDown

    if (isCciOver) {
      const newSignal = isCciUp ? 'short' : 'long';
      if (lastSignal === newSignal) {
        // empty signal if it's the same with the last
        return SignalResult.createEmptySignal(debug);
      }
      if (lastSignal && lastSignal !== newSignal) {
        // close if the last is present but not same with new
        return SignalResult.createSignal('close', debug);
      }
      return SignalResult.createSignal(newSignal, debug);
    }

    return SignalResult.createEmptySignal(debug);
  }

  getBacktestColumns() {
    return [
      {
        label: 'cci',
        value: 'cci',
        type: 'oscillator',
        range: [100, -100]
      }
    ];
  }

  getOptions() {
    return {
      period: '15m',
      safe: 110,
      over: 150
    };
  }
};
