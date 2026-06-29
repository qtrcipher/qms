import { expect, test } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "http://localhost:3000";

test("customer ticket can be called by staff and shown on the display", async ({ browser, page, request }) => {
  await expect.poll(async () => {
    try {
      return (await request.get(`${apiURL}/health`)).ok();
    } catch {
      return false;
    }
  }, { timeout: 30_000 }).toBe(true);

  await page.goto("/kiosk");
  await expect(page).toHaveTitle("Kiosk | QMS");
  await expect(page.getByRole("heading", { name: "Choose a service" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kiosk" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();

  await page.getByLabel("Email").fill("customer@example.com");
  await page.getByLabel("Phone").fill("+97455550000");
  await page.getByRole("button", { name: /General Service/ }).click();
  const ticketCode = (await page.locator(".ticket-preview strong").textContent())?.trim();
  expect(ticketCode).toMatch(/^A-\d{3}$/);
  await expect(page.getByRole("link", { name: "Track ticket" })).toBeVisible();

  const staff = await browser.newPage();
  await staff.goto("/staff");
  await expect(staff).toHaveTitle("Staff | QMS");
  await staff.getByRole("button", { name: "Sign in" }).click();
  await expect(staff.getByText("Admin")).toBeVisible();
  await expect(staff.getByRole("link", { name: "Staff" })).toHaveAttribute("aria-current", "page");

  const counterSelect = staff.getByLabel("Counter");
  await expect(counterSelect.locator("option")).toHaveCount(2);
  const selectedCounterName = (await counterSelect.locator("option").nth(1).textContent())?.trim() ?? "Counter";
  await counterSelect.selectOption({ index: 1 });
  await staff.getByRole("button", { name: /Call next .* A .* General Service/ }).click();
  await expect(staff.getByRole("status")).toContainText(`Called ${ticketCode}`);
  await expect(staff.locator(".ticket-row", { hasText: ticketCode })).toContainText("CALLED");

  const display = await browser.newPage();
  await display.goto("/display");
  await expect(display.locator(".display-ticket", { hasText: ticketCode })).toContainText(selectedCounterName);

  await staff.locator(".ticket-row", { hasText: ticketCode }).getByLabel(`Transfer ${ticketCode}`).selectOption({ label: "B" });
  await expect(staff.getByRole("status")).toContainText("Ticket transferred");
  await expect(staff.locator(".ticket-row", { hasText: "TRANSFERRED · B" })).toBeVisible();
});
