from playwright.sync_api import sync_playwright
import time

def verify_solar():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to localhost:3000...")
        try:
            page.goto("http://localhost:3000", timeout=120000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            page.screenshot(path="verification_fail_nav.png")
            browser.close()
            return

        print("Waiting for canvas...")
        try:
            # Wait for canvas to be present in DOM
            page.wait_for_selector("canvas", timeout=60000)
            print("Canvas found.")

            # Wait for loading overlay to disappear
            # The loading text is "Loading 3D Scene..."
            # Wait for it to be detached
            print("Waiting for loader to disappear...")
            try:
                page.wait_for_selector("text=Loading 3D Scene...", state="detached", timeout=60000)
                print("Loader disappeared.")
            except Exception as e:
                print(f"Loader wait timeout: {e}")

            # Additional wait for rendering
            print("Rendering...")
            time.sleep(10)

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_fail.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_solar()
