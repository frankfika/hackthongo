module.exports = {
  id: "hackthongo-ui-regression",
  viewports: [
    { label: "xs-320", width: 320, height: 740 },
    { label: "sm-375", width: 375, height: 812 },
    { label: "md-768", width: 768, height: 900 },
    { label: "lg-1024", width: 1024, height: 900 },
    { label: "xl-1440", width: 1440, height: 1000 },
    { label: "xxl-1920", width: 1920, height: 1080 }
  ],
  onBeforeScript: "puppet/onBefore.js",
  onReadyScript: "puppet/onReady.js",
  scenarios: [
    {
      label: "signin",
      url: "http://127.0.0.1:3000/zh/auth/signin",
      readySelector: "main"
    },
    {
      label: "footer-short",
      url: "http://127.0.0.1:3000/zh/footer-test/short",
      readySelector: "footer"
    },
    {
      label: "footer-long",
      url: "http://127.0.0.1:3000/zh/footer-test/long",
      readySelector: "footer"
    },
    {
      label: "overlay-page",
      url: "http://127.0.0.1:3000/zh/ui-test/overlays",
      readySelector: "main"
    },
    {
      label: "submit",
      url: "http://127.0.0.1:3000/zh/submit",
      readySelector: "form"
    },
    {
      label: "privacy",
      url: "http://127.0.0.1:3000/zh/privacy",
      readySelector: "main"
    }
  ],
  scenarioDefaults: {
    misMatchThreshold: 1
  },
  paths: {
    bitmaps_reference: "backstop_data/bitmaps_reference",
    bitmaps_test: "backstop_data/bitmaps_test",
    engine_scripts: "backstop_data/engine_scripts",
    html_report: "backstop_data/html_report",
    ci_report: "backstop_data/ci_report"
  },
  report: ["browser", "CI"],
  engine: "playwright",
  engineOptions: {
    browser: "chromium"
  },
  asyncCaptureLimit: 1,
  asyncCompareLimit: 10,
  debug: false,
  debugWindow: false
};
