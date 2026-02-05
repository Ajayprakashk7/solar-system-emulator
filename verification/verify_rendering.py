from playwright.sync_api import sync_playwright

def verify_solar_system(page):
    print("Navigating to home page...")
    page.goto("http://localhost:3000", timeout=120000)

    print("Waiting for loading to finish...")
    # Wait for the canvas to be present
    page.wait_for_selector("canvas", timeout=60000)

    # Wait for the loader to disappear
    # "Loading 3D Scene..."
    try:
        page.wait_for_selector("text=Loading 3D Scene...", state="detached", timeout=60000)
    except Exception as e:
        print("Warning: Loader might have disappeared too quickly or never appeared. Continuing...")

    print("Scene loaded. Waiting a bit for rendering...")
    page.wait_for_timeout(10000) # Give it 10 seconds to render frames

    print("Taking screenshot...")
    page.screenshot(path="verification/solar_system.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_solar_system(page)
        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="verification/error.png")
            except:
                pass
        finally:
            browser.close()
