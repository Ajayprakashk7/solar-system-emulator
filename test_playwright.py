import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Next JS Dev Server is running on port 3001
        try:
            page.goto('http://localhost:3001', timeout=60000)
            print("Loaded page successfully.")

            # Wait for canvas to be attached
            page.wait_for_selector("canvas", state="attached", timeout=60000)
            print("Canvas attached.")

            # Additional wait for 3D components to render
            time.sleep(20)

            # Take screenshot
            page.screenshot(path="screenshot.png")
            print("Screenshot saved to screenshot.png.")

        except Exception as e:
            print(f"Error during Playwright test: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
