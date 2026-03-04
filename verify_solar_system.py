import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            await page.goto("http://localhost:3000", timeout=120000)

            print("Waiting for dynamic import loader to disappear...")
            await page.wait_for_selector('text=Loading Advanced Solar System...', state='detached', timeout=60000)

            print("Waiting for 3D scene loader to disappear...")
            await page.wait_for_selector('text=Loading 3D Scene...', state='detached', timeout=60000)

            print("Waiting for canvas to appear...")
            await page.wait_for_selector("canvas", timeout=30000)

            print("Waiting a bit for scene to render...")
            await page.wait_for_timeout(5000)

            print("Canvas found. Saving screenshot...")
            await page.screenshot(path="solar_system_verification.png")
            print("Screenshot saved to solar_system_verification.png")

        except Exception as e:
            print(f"Error occurred: {e}")
            await page.screenshot(path="error_state.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
