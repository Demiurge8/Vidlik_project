import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo@vidlik.dk";
const DEMO_PASS = "demo1234";

test.describe("Auth flow", () => {
  test("login redirects to home and shows user state, logout restores CTA", async ({
    page,
  }) => {
    // чистий стан
    await page.goto("about:blank");
    await page.evaluate(() => localStorage.clear());

    // вхід
    await page.goto("/auth");
    await page.getByRole("button", { name: "Вхід" }).click();
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Пароль").fill(DEMO_PASS);
    await page.getByRole("button", { name: "Увійти" }).click();

    await page.waitForURL("**/");

    await expect(page.getByText("Demo Vidlik")).toBeVisible();

    // вихід
    await page.getByRole("button", { name: "Вийти" }).click();

    await expect(
      page.getByRole("button", { name: "Авторизуватися" })
    ).toBeVisible();
  });
});
