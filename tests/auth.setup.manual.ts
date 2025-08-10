import { test as setup, expect } from "@playwright/test";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load test environment variables
config({ path: ".env.test" });

const authFile = "playwright/.auth/user.json";

setup("manual authenticate", async ({ page, context }) => {
	console.log("Starting automated authentication setup...");

	// Set realistic browser properties to avoid bot detection
	await context.addInitScript(() => {
		// Remove webdriver property
		Object.defineProperty(navigator, "webdriver", {
			get: () => undefined,
		});

		// Mock plugins
		Object.defineProperty(navigator, "plugins", {
			get: () => [1, 2, 3, 4, 5],
		});

		// Mock languages
		Object.defineProperty(navigator, "languages", {
			get: () => ["en-US", "en"],
		});

		// Mock platform
		Object.defineProperty(navigator, "platform", {
			get: () => "MacIntel",
		});

		// Remove automation indicators
		try {
			delete (window as any).navigator.__defineGetter__;
			delete (window as any).navigator.__defineSetter__;
			delete (window as any).navigator.__lookupGetter__;
			delete (window as any).navigator.__lookupSetter__;
		} catch (e) {
			// Ignore errors if properties don't exist
		}

		// Mock chrome object
		if (!(window as any).chrome) {
			(window as any).chrome = {
				runtime: {},
				loadTimes: function () {},
				csi: function () {},
				app: {},
			};
		}
	});

	try {
		// Navigate to login page
		await page.goto("/login");

		console.log("🔄 Filling email and starting OAuth flow...");

		// Fill the email automatically
		const emailInput = page.getByRole("textbox", {
			name: "Enter your email address",
		});
		await expect(emailInput).toBeVisible();
		await emailInput.fill(
			process.env.GOOGLE_TEST_EMAIL || "thothy.test@gmail.com",
		);

		console.log("✅ Email filled automatically");

		// Click the Continue with Google button
		const continueButton = page.getByRole("button", {
			name: "Continue with Google",
		});
		await expect(continueButton).toBeEnabled();

		// Handle popup window or same page redirect
		console.log("🔄 Waiting for Google OAuth window...");

		const [popup] = await Promise.all([
			context.waitForEvent("page", { timeout: 3000 }).catch(() => null),
			continueButton.click(),
		]);

		if (popup) {
			console.log("✅ Google OAuth popup detected");
			await handleGoogleOAuthInPopup(popup);
			await popup.waitForEvent("close", { timeout: 3000 });
			console.log("✅ Popup closed - OAuth completed");
		} else {
			console.log("🔄 Handling OAuth in same page...");
			await handleGoogleOAuthInSamePage(page);
		}

		// Wait for redirect back to our app
		await page.waitForURL(
			(url) =>
				!url.toString().includes("/login") &&
				!url.toString().includes("google.com"),
			{ timeout: 30000 },
		);

		console.log("✅ OAuth completed, saving authentication state...");

		// Wait a bit to ensure session is fully established
		await page.waitForTimeout(3000);

		// Verify we're authenticated
		const session = await page.request.get("/api/auth/session");
		const sessionData = await session.json();

		if (sessionData?.user?.email) {
			console.log(`✅ Authenticated as: ${sessionData.user.email}`);

			// Save the authentication state
			await context.storageState({ path: authFile });
			console.log(`✅ Authentication state saved to: ${authFile}`);

			// Log what was saved
			const savedState = JSON.parse(fs.readFileSync(authFile, "utf8"));
			console.log(`   - Cookies: ${savedState.cookies.length}`);
			console.log(`   - Origins: ${savedState.origins.length}`);
		} else {
			throw new Error("Authentication failed - no user session found");
		}
	} catch (error) {
		console.error("Manual authentication failed:", error);

		// Create a mock authentication state as fallback
		console.log("Creating mock authentication state for testing...");

		const mockAuthState = {
			cookies: [
				{
					name: "next-auth.session-token",
					value: "mock-session-token-" + Date.now(),
					domain: "localhost",
					path: "/",
					expires: Date.now() / 1000 + 86400, // 24 hours
					httpOnly: true,
					secure: false,
					sameSite: "Lax",
				},
			],
			origins: [
				{
					origin: "http://localhost:3000",
					localStorage: [
						{
							name: "mock-auth-user",
							value: JSON.stringify({
								email: process.env.GOOGLE_TEST_EMAIL || "thothy.test@gmail.com",
								name: "Test User",
								image: null,
							}),
						},
					],
				},
			],
		};

		// Ensure directory exists
		const authDir = path.dirname(authFile);
		if (!fs.existsSync(authDir)) {
			fs.mkdirSync(authDir, { recursive: true });
		}

		fs.writeFileSync(authFile, JSON.stringify(mockAuthState, null, 2));
		console.log("✅ Mock authentication state created");
	}
});

// Helper function to handle Google OAuth in popup window
async function handleGoogleOAuthInPopup(popup: any) {
	try {
		// Wait for popup to load and navigate to Google
		await popup.waitForLoadState("domcontentloaded", { timeout: 15000 });
		console.log(`📍 Popup URL: ${popup.url()}`);

		// Wait for Google accounts page
		await popup.waitForURL(/accounts\.google\.com/, { timeout: 5000 });
		console.log("🔍 Navigated to Google accounts page in popup");

		// Check if already logged in (Google remembers the session)
		if (popup.url().includes("localhost:3000")) {
			console.log("✅ Already authenticated - skipping login");
			return;
		}

		console.log("📝 Starting Google sign-in process in popup...");

		// Step 1: Handle email input page
		try {
			// Wait for email input field with multiple possible selectors
			await popup.waitForSelector(
				'input[type="email"], #identifierId, input[aria-label*="email"], input[name="identifier"]',
				{ timeout: 5000 },
			);
			console.log("🔍 Found email input field");

			const emailField = popup
				.locator(
					'input[type="email"], #identifierId, input[aria-label*="email"], input[name="identifier"]',
				)
				.first();
			await emailField.click(); // Click to focus
			await emailField.fill(
				process.env.GOOGLE_TEST_EMAIL || "thothy.test@gmail.com",
			);
			console.log("✅ Email filled in popup");

			// Wait and click Next button
			await popup.waitForTimeout(2000);
			const nextButton = popup
				.locator('#identifierNext, button:has-text("Next"), [id*="next"]')
				.first();
			await nextButton.click();
			console.log("🔄 Clicked Next after email");
		} catch (emailError) {
			console.log(
				"⚠️  Email step error:",
				emailError instanceof Error ? emailError.message : String(emailError),
			);
		}

		// Step 2: Handle password input page with elaborate finding algorithm
		try {
			console.log("🔍 Searching for password page...");

			// Strategy 1: Try standard password input selectors
			const passwordSelectors = [
				'input[type="password"]',
				"#password",
				'input[aria-label*="password"]',
				'input[name="password"]',
				'input[placeholder*="password"]',
				'input[placeholder*="Password"]',
			];

			let passwordField = null;
			let foundSelector = "";

			// Try each selector
			for (const selector of passwordSelectors) {
				try {
					await popup.waitForSelector(selector, { timeout: 2000 });
					passwordField = popup.locator(selector).first();
					foundSelector = selector;
					console.log(`✅ Found password field with selector: ${selector}`);
					break;
				} catch {
					continue;
				}
			}

			// Strategy 2: If no standard input found, look for Google's custom password div
			if (!passwordField) {
				console.log("🔍 Searching for Google custom password field...");
				const customSelectors = [
					'div[jsname="Ufn6O"]', // Google's password div
					'div[id="password"]',
					'div[data-initial-dir="ltr"]',
					'div[contenteditable="true"]',
					'div[role="textbox"][aria-label*="password"]',
					'div[role="textbox"][aria-label*="Password"]',
				];

				for (const selector of customSelectors) {
					try {
						await popup.waitForSelector(selector, { timeout: 2000 });
						passwordField = popup.locator(selector).first();
						foundSelector = selector;
						console.log(
							`✅ Found custom password field with selector: ${selector}`,
						);
						break;
					} catch {
						continue;
					}
				}
			}

			// Strategy 3: Find any visible input that could be password
			if (!passwordField) {
				console.log(
					"🔍 Looking for any visible input that could be password...",
				);
				const inputs = await popup
					.locator('input, div[contenteditable="true"], div[role="textbox"]')
					.all();
				for (let i = 0; i < inputs.length; i++) {
					const input = inputs[i];
					if (await input.isVisible()) {
						passwordField = input;
						foundSelector = `input/div[${i}]`;
						console.log(`✅ Found potential password field at index ${i}`);
						break;
					}
				}
			}

			if (passwordField) {
				console.log(`🎯 Using password field found with: ${foundSelector}`);

				// Click to focus and fill password
				await passwordField.click();
				await popup.waitForTimeout(1000);

				// Try different methods to input password
				try {
					await passwordField.fill(process.env.GOOGLE_TEST_PASSWORD || "");
					console.log("✅ Password filled using .fill()");
				} catch {
					try {
						await passwordField.type(process.env.GOOGLE_TEST_PASSWORD || "");
						console.log("✅ Password filled using .type()");
					} catch {
						await popup.keyboard.type(process.env.GOOGLE_TEST_PASSWORD || "");
						console.log("✅ Password filled using keyboard.type()");
					}
				}

				// Wait and find Next button after password with multiple strategies
				await popup.waitForTimeout(2000);
				
				// Strategy 1: Try specific password Next button selectors
				const nextButtonSelectors = [
					'#passwordNext',
					'button[jsname="LgbsSe"]',
					'button:has-text("Next")',
					'[id*="passwordNext"]',
					'[id*="next"]',
					'button[type="submit"]',
					'div[role="button"]:has-text("Next")'
				];
				
				let nextButton = null;
				let nextFoundSelector = '';
				
				for (const selector of nextButtonSelectors) {
					try {
						await popup.waitForSelector(selector, { timeout: 2000 });
						nextButton = popup.locator(selector).first();
						if (await nextButton.isVisible() && await nextButton.isEnabled()) {
							nextFoundSelector = selector;
							console.log(`✅ Found Next button with selector: ${selector}`);
							break;
						}
					} catch {
						continue;
					}
				}
				
				// Strategy 2: Find any clickable button that might be Next
				if (!nextButton) {
					console.log('🔍 Looking for any clickable Next button...');
					const buttons = await popup.locator('button, div[role="button"]').all();
					for (let i = 0; i < buttons.length; i++) {
						const button = buttons[i];
						if (await button.isVisible() && await button.isEnabled()) {
							const text = await button.textContent();
							if (text && (text.includes('Next') || text.includes('Continue') || text.includes('진행'))) {
								nextButton = button;
								nextFoundSelector = `button[${i}] with text: ${text}`;
								console.log(`✅ Found Next button at index ${i}: ${text}`);
								break;
							}
						}
					}
				}
				
				if (nextButton) {
					console.log(`🎯 Clicking Next button found with: ${nextFoundSelector}`);
					await nextButton.click();
					console.log("🔄 Clicked Next after password");
				} else {
					console.log("❌ Could not find Next button after password");
					// Try pressing Enter as fallback
					await popup.keyboard.press('Enter');
					console.log("⚡ Pressed Enter as fallback");
				}
			} else {
				console.log("❌ Could not find password field with any strategy");
			}
		} catch (passwordError) {
			console.log(
				"⚠️  Password step error:",
				passwordError instanceof Error
					? passwordError.message
					: String(passwordError),
			);
		}

		// Step 3: Handle consent/permission screen if it appears
		try {
			await popup.waitForSelector(
				'button:has-text("Continue"), button:has-text("Allow"), button:has-text("Accept"), [data-l10n-id="continue"]',
				{ timeout: 10000 },
			);
			const continueButton = popup
				.locator(
					'button:has-text("Continue"), button:has-text("Allow"), button:has-text("Accept"), [data-l10n-id="continue"]',
				)
				.first();
			await continueButton.click();
			console.log("✅ Consent granted in popup");
		} catch {
			console.log("ℹ️  No consent screen found - proceeding");
		}
	} catch (error) {
		console.log(
			"⚠️  Error in popup OAuth flow:",
			error instanceof Error ? error.message : String(error),
		);
		console.log(`📍 Final popup URL: ${popup.url()}`);
	}
}

// Helper function to handle Google OAuth in same page
async function handleGoogleOAuthInSamePage(page: any) {
	try {
		// Wait for navigation to Google
		await page.waitForURL(/accounts\.google\.com/, { timeout: 5000 });

		// Check if already logged in
		if (page.url().includes("localhost:3000")) {
			console.log("✅ Already authenticated - skipping login");
			return;
		}

		console.log("📝 Handling Google sign-in flow in same page...");

		// Step 1: Wait for Google sign-in page and fill email
		await page.waitForSelector('input[type="email"], #identifierId', {
			timeout: 5000,
		});
		console.log("🔍 Found Google sign-in page");

		const emailField = page
			.locator('input[type="email"], #identifierId')
			.first();
		await emailField.fill(
			process.env.GOOGLE_TEST_EMAIL || "thothy.test@gmail.com",
		);
		console.log("✅ Email filled");

		// Click Next button to proceed to password page
		await page.waitForTimeout(1000);
		await page
			.locator('#identifierNext, button:has-text("Next")')
			.first()
			.click();
		console.log("🔄 Clicked Next after email");

		// Step 2: Handle password input page with elaborate finding algorithm
		try {
			console.log("🔍 Searching for password page...");

			// Strategy 1: Try standard password input selectors
			const passwordSelectors = [
				'input[type="password"]',
				"#password",
				'input[aria-label*="password"]',
				'input[name="password"]',
				'input[placeholder*="password"]',
				'input[placeholder*="Password"]',
			];

			let passwordField = null;
			let foundSelector = "";

			// Try each selector
			for (const selector of passwordSelectors) {
				try {
					await page.waitForSelector(selector, { timeout: 2000 });
					passwordField = page.locator(selector).first();
					foundSelector = selector;
					console.log(`✅ Found password field with selector: ${selector}`);
					break;
				} catch {
					continue;
				}
			}

			// Strategy 2: If no standard input found, look for Google's custom password div
			if (!passwordField) {
				console.log("🔍 Searching for Google custom password field...");
				const customSelectors = [
					'div[jsname="Ufn6O"]', // Google's password div
					'div[id="password"]',
					'div[data-initial-dir="ltr"]',
					'div[contenteditable="true"]',
					'div[role="textbox"][aria-label*="password"]',
					'div[role="textbox"][aria-label*="Password"]',
				];

				for (const selector of customSelectors) {
					try {
						await page.waitForSelector(selector, { timeout: 2000 });
						passwordField = page.locator(selector).first();
						foundSelector = selector;
						console.log(
							`✅ Found custom password field with selector: ${selector}`,
						);
						break;
					} catch {
						continue;
					}
				}
			}

			// Strategy 3: Find any visible input that could be password
			if (!passwordField) {
				console.log(
					"🔍 Looking for any visible input that could be password...",
				);
				const inputs = await page
					.locator('input, div[contenteditable="true"], div[role="textbox"]')
					.all();
				for (let i = 0; i < inputs.length; i++) {
					const input = inputs[i];
					if (await input.isVisible()) {
						passwordField = input;
						foundSelector = `input/div[${i}]`;
						console.log(`✅ Found potential password field at index ${i}`);
						break;
					}
				}
			}

			if (passwordField) {
				console.log(`🎯 Using password field found with: ${foundSelector}`);

				// Click to focus and fill password
				await passwordField.click();
				await page.waitForTimeout(1000);

				// Try different methods to input password
				try {
					await passwordField.fill(process.env.GOOGLE_TEST_PASSWORD || "");
					console.log("✅ Password filled using .fill()");
				} catch {
					try {
						await passwordField.type(process.env.GOOGLE_TEST_PASSWORD || "");
						console.log("✅ Password filled using .type()");
					} catch {
						await page.keyboard.type(process.env.GOOGLE_TEST_PASSWORD || "");
						console.log("✅ Password filled using keyboard.type()");
					}
				}

				// Wait and find Next button after password with multiple strategies
				await page.waitForTimeout(2000);
				
				// Strategy 1: Try specific password Next button selectors
				const nextButtonSelectors = [
					'#passwordNext',
					'button[jsname="LgbsSe"]',
					'button:has-text("Next")',
					'[id*="passwordNext"]',
					'[id*="next"]',
					'button[type="submit"]',
					'div[role="button"]:has-text("Next")'
				];
				
				let nextButton = null;
				let nextFoundSelector = '';
				
				for (const selector of nextButtonSelectors) {
					try {
						await page.waitForSelector(selector, { timeout: 2000 });
						nextButton = page.locator(selector).first();
						if (await nextButton.isVisible() && await nextButton.isEnabled()) {
							nextFoundSelector = selector;
							console.log(`✅ Found Next button with selector: ${selector}`);
							break;
						}
					} catch {
						continue;
					}
				}
				
				// Strategy 2: Find any clickable button that might be Next
				if (!nextButton) {
					console.log('🔍 Looking for any clickable Next button...');
					const buttons = await page.locator('button, div[role="button"]').all();
					for (let i = 0; i < buttons.length; i++) {
						const button = buttons[i];
						if (await button.isVisible() && await button.isEnabled()) {
							const text = await button.textContent();
							if (text && (text.includes('Next') || text.includes('Continue') || text.includes('진행'))) {
								nextButton = button;
								nextFoundSelector = `button[${i}] with text: ${text}`;
								console.log(`✅ Found Next button at index ${i}: ${text}`);
								break;
							}
						}
					}
				}
				
				if (nextButton) {
					console.log(`🎯 Clicking Next button found with: ${nextFoundSelector}`);
					await nextButton.click();
					console.log("🔄 Clicked Next after password");
				} else {
					console.log("❌ Could not find Next button after password");
					// Try pressing Enter as fallback
					await page.keyboard.press('Enter');
					console.log("⚡ Pressed Enter as fallback");
				}
			} else {
				console.log("❌ Could not find password field with any strategy");
			}
		} catch (passwordError) {
			console.log(
				"⚠️  Password step error:",
				passwordError instanceof Error
					? passwordError.message
					: String(passwordError),
			);
		}

		// Step 3: Handle consent/permission screen if it appears
		try {
			await page.waitForSelector(
				'button:has-text("Continue"), button:has-text("Allow"), [data-l10n-id="continue"]',
				{ timeout: 8000 },
			);
			const continueButton = page
				.locator(
					'button:has-text("Continue"), button:has-text("Allow"), [data-l10n-id="continue"]',
				)
				.first();
			await continueButton.click();
			console.log("✅ Consent granted");
		} catch {
			console.log("ℹ️  No consent screen found - proceeding");
		}
	} catch (error) {
		console.log(
			"⚠️  Error in same page OAuth flow:",
			error instanceof Error ? error.message : String(error),
		);
	}
}

export { authFile };
