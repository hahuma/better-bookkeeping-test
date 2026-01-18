import { test, expect } from "./fixtures/test-fixtures";

test.describe("Workouts", () => {
  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();

      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
    });

    test("should show the workout date after starting", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();

      const today = new Date();
      const expectedDatePart = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      await expect(authenticatedPage.getByText(expectedDatePart)).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display the current active workout", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();

      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await expect(authenticatedPage.getByText("No sets yet")).toBeVisible();
    });

    test("should show 'No active workout' when none exists", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: "Start Workout" })).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    });
  });

  test.describe("complete", () => {
    test("should mark the current workout as completed", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();

      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();

      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();
    });

    test("should move completed workout to history", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      const today = new Date();
      const expectedDatePart = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      await expect(authenticatedPage.getByText(expectedDatePart)).toBeVisible();
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.locator("tbody tr").first().getByRole("checkbox").check();
      await authenticatedPage.getByRole("button", { name: /Delete Selected/ }).click();

      await expect(authenticatedPage.getByText("No completed workouts yet")).toBeVisible();
    });

    test("should allow selecting multiple workouts for deletion", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.locator("tbody tr")).toHaveCount(2);

      await authenticatedPage.locator("thead").getByRole("checkbox").check();
      await expect(authenticatedPage.getByRole("button", { name: /Delete Selected \(2\)/ })).toBeVisible();

      await authenticatedPage.getByRole("button", { name: /Delete Selected/ }).click();

      await expect(authenticatedPage.getByText("No completed workouts yet")).toBeVisible();
    });
  });
});
