// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
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
        log.debug("First Run");

        if (this.settings.initialStopValue == 0) {
          log.debug("No initial stop value configured");
          if (this.settings.buyPrice > 0) {
            log.debug("Use configured buy price as bases for stop price");
            this.trend.stopValue = this.settings.buyPrice - this.settings.trailingValueIncrement;
          }
          else {
            log.debug("Use last close value as bases for stop price");
            this.trend.stopValue = this.trend.currentValue - this.settings.trailingValueIncrement;
          }

          log.debug("New StopValue:" + this.trend.stopValue);
        }
        else {
          log.debug("Use configured initial stop value");
          this.trend.stopValue = this.settings.initialStopValue;
          log.debug("Stop value is now " + this.settings.initialStopValue);
        }
      }
      else {
        log.debug("Non initial values");

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
      return;
    }
    else if (this.settings.buy && this.trend.currentValue >= this.settings.buyPrice && !this.trend.purchased) {
      this.advice("long");

      if (this.settings.movingStopValue) {
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

module.exports = strat;