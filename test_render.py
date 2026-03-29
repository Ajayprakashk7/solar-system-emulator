from playwright.sync_api import sync_playwright
import time

def test_visual_render():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:3000...")
        # Add longer timeout and wait until DOM content loaded instead of full load
        page.goto("http://localhost:3000", timeout=60000, wait_until="domcontentloaded")

        print("Waiting for R3F canvas to attach...")
        page.wait_for_selector("canvas", state="attached", timeout=60000)

        print("Waiting 20 seconds for models and textures to fully render...")
        time.sleep(20)

        print("Taking screenshot...")
        page.screenshot(path="render_test.png")
        print("Screenshot saved to render_test.png")

        browser.close()

if __name__ == "__main__":
    test_visual_render()
