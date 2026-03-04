from playwright.sync_api import Page, expect, sync_playwright

def test_scene_renders(page: Page):
  page.goto("http://localhost:3000", timeout=120000)

  # Check if we have an error first
  if page.locator("text=Error:").is_visible() or page.locator("text=Unhandled Runtime Error").is_visible():
    print("Detected error overlay on page")
    page.screenshot(path="/app/verification/solar_system_scene.png", timeout=120000)
    return

  # Wait for loading overlay to disappear
  page.locator("text=Loading 3D Scene...").wait_for(state="detached", timeout=120000)

  # Wait for canvas to be present
  canvas = page.locator("canvas")
  expect(canvas).to_be_visible(timeout=60000)

  # Sleep slightly longer just in case textures need to pop in
  page.wait_for_timeout(5000)

  # Take a screenshot to verify the scene, bypass font loading timeout
  page.screenshot(path="/app/verification/solar_system_scene.png", timeout=120000)

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_scene_renders(page)
    finally:
      browser.close()