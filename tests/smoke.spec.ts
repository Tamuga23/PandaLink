import { test, expect } from "@playwright/test";

// Smoke test: la app monta sin crashear y termina en un estado válido.
// No depende de datos: pasa con catálogo lleno, vacío, o incluso sin conexión
// a Firestore (en ese caso muestra el estado de error, que también es válido).
test("la app carga y muestra el shell", async ({ page }) => {
  const erroresJs: string[] = [];
  page.on("pageerror", (e) => erroresJs.push(String(e)));

  await page.goto("/");

  // El top bar (logo) se renderiza siempre, con o sin datos.
  await expect(page.locator('img[alt="PandaStore"]').first()).toBeVisible();

  // La app termina en alguno de sus estados conocidos.
  await expect(
    page
      .getByText(/¿Cómo llega el cliente\?|Cargando catálogo|No se pudo cargar|Catálogo vacío/)
      .first(),
  ).toBeVisible({ timeout: 15_000 });

  // Sin excepciones de JS sin capturar.
  expect(erroresJs).toEqual([]);
});
