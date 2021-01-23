// let plotData;
const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD}")
const tzDate = ts => uPlot.tzDate(new Date(ts * 1e3), "Etc/UTC")
const width = 800

fetch("https://covid-19-greece.herokuapp.com/all")
  .then(response => response.json())
  .then(data => {
    const dates = data.cases.map(d => new Date(d.date).getTime() / 1000)

    // cumulative cases
    let plotData = [dates, data.cases.map(d => d.confirmed)]
    let opts = {
      width: width,
      height: width * 0.75,
      series: [
        {
          label: "Date",
          value: (u, ts) => fmtDate(tzDate(ts)),
        },
        {
          label: "Cumulative Confirmed Cases",
          stroke: "blue",
          width: 1,
          fill: "rgba(0, 0, 255, 0.3)",
        },
      ],
    }
    new uPlot(opts, plotData, document.getElementById("cumulative-cases"))

    // cumulative deaths
    plotData = [dates, data.cases.map(d => d.deaths)]
    opts = {
      width: width,
      height: width * 0.75,
      series: [
        {
          label: "Date",
          value: (u, ts) => fmtDate(tzDate(ts)),
        },
        {
          label: "Cumulative Deaths",
          stroke: "red",
          width: 1,
          fill: "rgba(255, 0, 0, 0.3)",
        },
      ],
    }
    new uPlot(opts, plotData, document.getElementById("cumulative-deaths"))
  })

fetch("https://covid-19-greece.herokuapp.com/intensive-care")
  .then(response => response.json())
  .then(data => {
    const dates = data.cases.map(d => new Date(d.date).getTime() / 1000)

    // current patients in icu
    let plotData = [dates, data.cases.map(d => d.intensive_care)]
    let opts = {
      width: width,
      height: width * 0.75,
      series: [
        {
          label: "Date",
          value: (u, ts) => fmtDate(tzDate(ts)),
        },
        {
          label: "Patients in ICU",
          stroke: "blue",
          width: 1,
          fill: "rgba(0, 0, 255, 0.3)",
        },
      ],
    }
    new uPlot(opts, plotData, document.getElementById("current-icu"))
  })

fetch("https://covid-19-greece.herokuapp.com/total-tests")
  .then(response => response.json())
  .then(data => {
    const dates = data.total_tests.map(d => new Date(d.date).getTime() / 1000).slice(1)

    let plotData = [
      dates,
      data.total_tests
        .slice(1)
        .map((d, i) => d["rapid-tests"] - data.total_tests[i]["rapid-tests"]),
      data.total_tests.slice(1).map((d, i) => {
        // catch some erratic cases where result turned out negative
        if (d["tests"] - data.total_tests[i]["tests"] < 0) {
          return 0
        }
        return d["tests"] - data.total_tests[i]["tests"]
      }),
      data.total_tests.slice(1).map((d, i) => d["tests"]),
    ]
    let opts = {
      width: width,
      height: width * 0.75,
      series: [
        {
          label: "Date",
          value: (u, ts) => fmtDate(tzDate(ts)),
        },
        {
          label: "Daily Rapid Tests",
          stroke: "blue",
          width: 1,
          fill: "rgba(0, 0, 255, 0.3)",
        },
        {
          label: "Daily Regular Tests",
          stroke: "green",
          width: 1,
          fill: "rgba(0, 255, 0, 0.3)",
        },
      ],
    }
    new uPlot(opts, plotData, document.getElementById("total-tests"))
  })
