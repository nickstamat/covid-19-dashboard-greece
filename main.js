function calcSize() {
  const width = window.innerWidth - 200
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

  const dataCases = await resAll.json()
  const dataIntensiveCare = await resIntensiveCare.json()
  const dataTests = await resTotalTests.json()

  return {
    dataCases,
    dataIntensiveCare,
    dataTests,
  }
}

fetchData().then(({ dataCases, dataIntensiveCare, dataTests }) => {
  const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD}")
  const tzDate = ts => uPlot.tzDate(new Date(ts * 1e3), "Etc/UTC")
  const plots = []

  let seriesX
  let seriesY
  let opts

  // cumulative cases
  seriesX = dataCases.cases.map(d => new Date(d.date).getTime() / 1000)
  seriesY = dataCases.cases.map(d => d.confirmed)
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
  plots.push(new uPlot(opts, [seriesX, seriesY], document.getElementById("cumulative-cases")))

  // cumulative deaths
  seriesY = dataCases.cases.map(d => d.deaths)
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
  plots.push(new uPlot(opts, [seriesX, seriesY], document.getElementById("cumulative-deaths")))

  // current patients in ICU
  seriesX = dataIntensiveCare.cases.map(d => new Date(d.date).getTime() / 1000)
  seriesY = dataIntensiveCare.cases.map(d => d.intensive_care)
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
  plots.push(new uPlot(opts, [seriesX, seriesY], document.getElementById("current-icu")))

  // tests
  seriesX = dataTests.total_tests.map(d => new Date(d.date).getTime() / 1000).slice(1)
  seriesY = [
    dataTests.total_tests.slice(1).map((d, i) => {
      const delta = d["rapid-tests"] - dataTests.total_tests[i]["rapid-tests"]
      return delta < 0 ? 0 : delta
    }),
    dataTests.total_tests.slice(1).map((d, i) => {
      const delta = d["tests"] - dataTests.total_tests[i]["tests"]
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
  plots.push(new uPlot(opts, [seriesX, ...seriesY], document.getElementById("daily-tests")))

  // add resize listeners for all plots
  plots.forEach(u =>
    window.addEventListener(
      "resize",
      _.debounce(() => u.setSize(calcSize()), 200)
    )
  )
})
