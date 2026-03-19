import sys
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to http://localhost:3000...")

        try:
            page.goto('http://localhost:3000', timeout=60000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            sys.exit(1)

        print("Waiting for canvas to be attached...")
        try:
            page.wait_for_selector("canvas", state="attached", timeout=60000)
            print("Canvas found. Taking screenshot after a delay...")
            page.wait_for_timeout(10000)  # Wait for 3D elements to render
            page.screenshot(path="screenshot.png", timeout=120000)
            print("Screenshot saved to screenshot.png")
        except Exception as e:
            print(f"Error finding canvas: {e}")
            sys.exit(1)

        browser.close()

if __name__ == '__main__':
    verify()
