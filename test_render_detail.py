from playwright.sync_api import sync_playwright
import time

def test_visual_render():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", timeout=60000, wait_until="domcontentloaded")

        print("Waiting for R3F canvas to attach...")
        page.wait_for_selector("canvas", state="attached", timeout=60000)

        print("Waiting 15 seconds for models and textures to fully render...")
        time.sleep(15)

        print("Pressing 3 to select Earth...")
        page.keyboard.press("Digit3")

        print("Waiting 10 seconds for camera to zoom in...")
        time.sleep(10)

        print("Taking screenshot...")
        page.screenshot(path="render_test_detail.png")
        print("Screenshot saved to render_test_detail.png")

        browser.close()

if __name__ == "__main__":
    test_visual_render()
