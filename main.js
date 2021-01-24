function calcSize() {
  const width = window.innerWidth * 0.8
  let height = width * 0.75

  if (height > window.innerHeight - 300) {
    height = window.innerHeight - 300
  }

  return {
    width,
    height,
  }
}

async function fetchData() {
  const [resAll, resIntensiveCare, resTotalTests] = await Promise.all([
    fetch("https://covid-19-greece.herokuapp.com/all"),
    fetch("https://covid-19-greece.herokuapp.com/intensive-care"),
    fetch("https://covid-19-greece.herokuapp.com/total-tests"),
  ])

  let dataCases = (await resAll.json()).cases
  let dataIntensiveCare = (await resIntensiveCare.json()).cases
  let dataTests = (await resTotalTests.json()).total_tests

  dataCases = _.intersectionWith(dataCases, dataIntensiveCare, dataTests, (a, b) => a.date == b.date)
  dataIntensiveCare = _.intersectionWith(dataIntensiveCare, dataCases, dataTests, (a, b) => a.date == b.date)
  dataTests = _.intersectionWith(dataTests, dataCases, dataIntensiveCare, (a, b) => a.date == b.date)

  return {
    dataCases,
    dataIntensiveCare,
    dataTests,
  }
}

fetchData().then(({ dataCases, dataIntensiveCare, dataTests }) => {
  const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD}")
  const tzDate = ts => uPlot.tzDate(new Date(ts * 1e3), "Etc/UTC")
  const dates = dataCases.map(d => new Date(d.date).getTime() / 1000)
  const plots = []

  let series
  let opts

  // cumulative cases
  series = [dataCases.map(d => d.confirmed)]
  opts = {
    ...calcSize(),
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
  plots.push(new uPlot(opts, [dates, ...series], document.getElementById("cumulative-cases")))

  // cumulative deaths
  series = [dataCases.map(d => d.deaths)]
  opts = {
    ...calcSize(),
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
  plots.push(new uPlot(opts, [dates, ...series], document.getElementById("cumulative-deaths")))

  // current patients in ICU
  series = [dataIntensiveCare.map(d => d.intensive_care)]
  opts = {
    ...calcSize(),
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
  plots.push(new uPlot(opts, [dates, ...series], document.getElementById("current-icu")))

  // tests
  series = [
    dataTests.slice(1).map((d, i) => {
      const delta = d["rapid-tests"] - dataTests[i]["rapid-tests"]
      return delta < 0 ? 0 : delta
    }),
    dataTests.slice(1).map((d, i) => {
      const delta = d["tests"] - dataTests[i]["tests"]
      return delta < 0 ? 0 : delta
    }),
  ]
  opts = {
    ...calcSize(),
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
  plots.push(new uPlot(opts, [dates, ...series], document.getElementById("daily-tests")))

  // add resize listeners for all plots
  plots.forEach(u =>
    window.addEventListener(
      "resize",
      _.debounce(() => u.setSize(calcSize()), 200)
    )
  )
})
