$(document).ready(function () {
  var timeData = [],
    temperatureData = [],
    FlowRateData = [];
  var data = {
    labels: timeData,
    datasets: [
      {
        fill: false,
        label: 'Temperature',
        yAxisID: 'Temperature',
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        data: temperatureData
      },
      {
        fill: false,
        label: 'Flowrate',
        yAxisID: 'FlowRate',
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        data: FlowRateData
      }
    ]
  }

  var basicOption = {
    title: {
      display: true,
      text: 'Temperature & Flow Rate 37', //+ process.env.CUSTOMER,
      fontSize: 24
    },
     subtitle: {
      display: true,
      text: 'Temperature & Flow Rate ', //+ process.env.CUSTOMER,
      fontSize: 24
    },
    scales: {
      yAxes: [{
        id: 'Temperature',
        type: 'linear',
        scaleLabel: {
          labelString: 'Temperature(F)',
          display: true
        },
        position: 'left',
      },
      {
        id: 'FlowRate',
        type: 'linear',
        scaleLabel: {
          labelString: 'FlowRate(MCFD)',
          display: true
        },
        position: 'right'
      }]
    }
  }

  //Get the context of the canvas element we want to select
  var ctx = document.getElementById("myChart").getContext("2d");
  var optionsNoAnimation = { animation: false }
  var myLineChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: basicOption
  });

  var warningRaised = false;
  var errorRaised = false;

  var ws = new WebSocket('wss://' + location.host);
  ws.onopen = function () {
    console.log('Successfully connect WebSocket!!!');
  }
  // Websocket receive --------------------------------
  ws.onmessage = function (message) {
    console.log('receive message' + message.data);
    
    try {
      var obj = JSON.parse(message.data);
      if(!obj.time || !obj.temperature) {
        //return;
      }
      //console.log('obj: ' + obj.d.customer);
      
      var cdat = document.getElementById("myData");
      var ctxdat = cdat.getContext("2d");
      ctxdat.font = "24px Arial";
      ctxdat.clearRect(0, 0, 400, 150);
      ctxdat.fillText("Temperature: " + obj.d.Temperature.toFixed(2),10,50);
      ctxdat.fillText("FlowRate: " + obj.d.FlowRate.toFixed(2),10,100);
      
      timeData.push(obj.time);
      temperatureData.push(obj.d.Temperature);
      FlowRateData.push(obj.d.FlowRate);
      // only keep no more than 50 points in the line chart
      const maxLen = 50;
      var len = timeData.length;
      if (len > maxLen) {
        timeData.shift();
        temperatureData.shift();
        FlowRateData.shift();
      }

      myLineChart.update();


      if (!warningRaised && obj.temperature>25){
        console.log('Warning!');
        alertify.warning('Warning! Temperature reached ' + obj.temperature );
        warningRaised = true;
      }

      if (!errorRaised && obj.temperature>27){
        alertify.error('Temperature reached @ High of ' +obj.temperature );
        errorRaised = true;
        
        alertify.alert("FNOL Raised","Due to high temperature, First Notification of Loss Raised, <br/> Please note claim number is <b>TMP0934586M.</b>  ");

      }
      
    } catch (err) {
      console.error(err);
    }
  }
});
