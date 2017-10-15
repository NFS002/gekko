// This is an initial implementation of a Trailing stop order strategy.
// If buy is set to true the strategy will attempt to buy the currency at the specified buyPrice.
// If things go as expected and sell is set to true, the stock will be sold at the specified sellPrice.   
// Lastly, if things don't go that well the stock will be sold at it's stopValue.
// The stopValue is calcualted as follows:
//    if movingStopValue is true, it will be a trailing stopValue(StopValue = HighestValue - trailingValueIncrement),
//    if not it will be a fixed value specified by initialStopValue.
// Status:
//    This has had minimal testing so don't trust it.
//Known Issues:
//If initial market value is larger than the buy value, Gekko will immediately purchase which could lead to a significant loss
var log = require('../core/log');

var strat = {};

// Prepare everything our method needs
strat.init = function () {
  console.log("Init Strategy");
  this.requiredHistory = 0;

  this.trend = {
    direction: 'none',
    highestValue: 0,
    currentValue: 0,
    stopValue: 0,
    purchased: false,
    currentTrend: "none",
    completed: false
  };

  if (this.trend.buy && this.trend.buyPrice == 0) {
    this.trend.buy = false;
  }

  if (this.trend.sell && this.trend.sellPrice == 0) {
    this.trend.sell = false;
  }
}

// What happens on every new candle?
strat.update = function (candle) {
  if (!this.trend.completed) {
    log.debug("Updating Strategy");
    // log.debug("Updating Strategy:" + JSON.stringify(candle));
    this.trend.currentValue = candle.close;
    log.debug("Current Value:" + this.trend.currentValue);

    if (this.trend.currentValue >= this.trend.highestValue) {
      log.debug("New highest value");

      if (this.trend.highestValue == 0) {
        this.configureFirstRun(this.settings, this.trend);
      }
      else {
        //
        if (this.trend.movingStopValue) {
          this.trend.stopValue = this.trend.currentValue - this.this.settings.trailingValueIncrement;
          log.debug("Updating StopValue to " + this.trend.stopValue);
        }
      }

      this.trend.highestValue = this.trend.currentValue;
      log.debug("Highest Value:" + this.trend.highestValue);
    }
  }
}

// For debugging purposes.
strat.log = function () {
  if (!this.trend.completed) {
    log.debug("Logging Strategy");
  }
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function () {
  if (!this.trend.completed) {
    log.debug("Checking Strategy");
    log.debug("Completed: " + this.trend.completed);
    if ((this.trend.currentValue <= this.trend.stopValue) || (this.settings.sell && this.trend.currentValue >= this.settings.sellPrice)) {
      this.advice("short");
      this.trend.completed = true;

      log.debug("Selling @", this.trend.currentValue);
      log.debug("Profit:", (this.trend.currentValue - this.settings.buyPrice));
      log.debug("Trading Finished");
      return;
    }
    else if (this.shouldBuy(this.settings, this.trend)) {
      this.advice("long");

      if (this.settings.movingStopValue) {
        // Trade starts here, reset stop value
        this.trend.stopValue = this.trend.currentValue - this.settings.trailingValueIncrement;
      }

      this.trend.purchased = true;
      log.debug("buying @", this.trend.currentValue);
      return;
    }
    else {
      log.debug("No Action");
    }
  }

  this.advice();
}

strat.shouldBuy = function (settings, trend) {
  return settings.buy && trend.currentValue >= settings.buyPrice && !trend.purchased;
}

strat.configureFirstRun = function (settings, trend) {
  log.debug("First Run");

  if (settings.initialStopValue == 0) {
    log.debug("No initial stop value configured");
    if (settings.buyPrice > 0) {
      log.debug("Use configured buy price as bases for stop price");
      trend.stopValue = settings.buyPrice - settings.trailingValueIncrement;
    }
    else {
      log.debug("Use last close value as bases for stop price");
      trend.stopValue = trend.currentValue - settings.trailingValueIncrement;
    }

    log.debug("New StopValue:" + trend.stopValue);
  }
  else {
    log.debug("Use configured initial stop value");
    trend.stopValue = settings.initialStopValue;
    log.debug("New StopValue:" + settings.initialStopValue);
  }
}

module.exports = strat;
