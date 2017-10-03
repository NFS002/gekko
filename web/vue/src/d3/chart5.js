var Highcharts = require('highcharts/highstock');
Highcharts.seriesTypes.flags.prototype.trackerGroups = ['markerGroup'];

export default function (_data, _trades) {

    var datalength = _data.length;
    var trades = [];
    var volume = [];

    var groupingUnits = [[
        'week',                         // unit name
        [1]                             // allowed multiples
    ], [
        'month',
        [1, 2, 3, 4, 6]
    ],
    [
        'minute',
        [30]
    ]];

    for (var tradeIndex = 0; tradeIndex < _trades.length; tradeIndex++) {
        var trade = _trades[tradeIndex];
        var title = "";
        
        // title + ":" + trade.action + "(" + trade.price + ")"
        var tradeText = "";
        var previousBalance = 0;
        var newBalance = 0;
        var profit = 0;

        if (trade.action == "buy")
        {
            title = "B";
            tradeText = "</b>Asset Bought</b> - " + trade.portfolio.asset + " for " + trade.price;            
        }
        else if (trade.action == "sell")
        {
            title = "S";
            previousBalance = parseFloat(trade.balance);
            newBalance = parseFloat(trade.portfolio.currency);
            // profit = Math.round(previousBalance);
            profit = newBalance;
            tradeText = "</b>Exit Balance</b> | " + profit.toFixed(8);                        
        }

        trades.push({
            x: new Date(trade.date),
            title: title,
            text: tradeText,
            
        });
    }

    var data = [];
    var trading = [];

    for (var index = 0; index < _data.length; index++) {
        var dataItem = _data[index];
        var currentDate = new Date(dataItem.start);

        data.push(
            {
                x: currentDate,
                open: dataItem.open,
                high: dataItem.high,
                low: dataItem.low,
                close: dataItem.close
            }
        )

        volume.push(
            {
                x: currentDate,
                y: dataItem.volume
            }
        );
    }

    for (var index = 0; index < data.length; index++) {
        var d = data[index];

        data[index] = {
            x: d.x,
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close          
        };
    }

    // create the chart
    Highcharts.stockChart('Highchart', {
        plotOptions: {
            candlestick: {
                color: 'red',
                upColor: '#00FF00'
            }
        },    
        chart: {
            zoomType: "xy",
            height: '750'
        },
        rangeSelector: {
            selected: 1
        },

        title: {
            text: 'AAPL Historical'
        },

        tooltip: {
            style: {
                width: '200px'
            },
            valueDecimals: 4,
            shared: true,
            useHTML: true,
        },
        yAxis: [{
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'OHLC'
            },
            height: '80%',
            lineWidth: 2
        },
        {
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'Volume'
            },
            top: '85%',
            height: '15%',
            offset: 0,
            lineWidth: 2
        }
        ],

        tooltip: {
            split: false
        },

        series: [{
            id: "main",
            type: 'candlestick',
            name: 'main',
            data: data,
            dataGrouping: {
                units: groupingUnits
            },
            turboThreshold: 10000000
        },
        {
            type: 'flags',
            data: trades,
            onSeries: 'main',
            shape: 'circlepin',
            width: 16,
            yAxis: 0,
            // dataGrouping: {
            //     units: groupingUnits
            // },
        },
        {
            type: 'column',
            name: 'Volume',
            data: volume,
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            },
            turboThreshold: 10000000
        }]
    });
}