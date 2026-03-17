describe("quality metrics", () => {
  const pages = ["/", "/docs", "/leaderboard", "/submit", "/privacy", "/auth/signin"];

  pages.forEach((path) => {
    it(`basic accessibility structure on ${path}`, () => {
      cy.viewport(1024, 900);
      cy.visit(path);
      cy.get("main").should("exist");
      cy.get("a,button").filter(":visible").each(($el) => {
        const label = $el.attr("aria-label") || $el.text().trim() || $el.attr("title");
        expect(Boolean(label)).to.eq(true);
      });
      cy.get("body").then(($body) => {
        const images = $body.find("img");
        if (images.length > 0) {
          Cypress.$(images).each((_, image) => {
            const alt = image.getAttribute("alt");
            expect(typeof alt === "string").to.eq(true);
          });
        }
      });
    });
  });

  it("collects web-vitals style metrics on home", () => {
    cy.viewport(1440, 1000);
    cy.visit("/");
    cy.window().then((win) => {
      const navEntries = win.performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const nav = navEntries[0];
      expect(nav.loadEventEnd).to.be.greaterThan(0);
      expect(nav.domContentLoadedEventEnd).to.be.greaterThan(0);
      const lcpEntries = win.performance.getEntriesByType("largest-contentful-paint") as Array<{ startTime: number }>;
      if (lcpEntries.length > 0) {
        const lcp = lcpEntries[lcpEntries.length - 1].startTime;
        expect(lcp).to.be.lessThan(4000);
      }
      const clsEntries = win.performance.getEntriesByType("layout-shift") as Array<{ hadRecentInput?: boolean; value?: number }>;
      const cls = clsEntries
        .filter((entry) => !entry.hadRecentInput)
        .reduce((sum, entry) => sum + (entry.value ?? 0), 0);
      expect(cls).to.be.lessThan(0.2);
    });
  });
});
