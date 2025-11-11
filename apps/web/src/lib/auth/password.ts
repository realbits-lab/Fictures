/**
 * Password hashing utilities using Web Crypto API for Edge Runtime compatibility
 */

// Hash a password using PBKDF2
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);

	// Generate a random salt
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Import the password as a key
	const key = await crypto.subtle.importKey(
		"raw",
		data,
		{ name: "PBKDF2" },
		false,
		["deriveBits"],
	);

	// Derive key using PBKDF2
	const derivedKey = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		key,
		256,
	);

	// Combine salt and derived key
	const hashArray = new Uint8Array(
		salt.length + new Uint8Array(derivedKey).length,
	);
	hashArray.set(salt, 0);
	hashArray.set(new Uint8Array(derivedKey), salt.length);

	// Convert to base64
	return btoa(String.fromCharCode(...hashArray));
}

// Verify a password against a hash
export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(password);

		// Decode the hash
		const hashArray = new Uint8Array(
			atob(hash)
				.split("")
				.map((char) => char.charCodeAt(0)),
		);

		// Extract salt (first 16 bytes) and stored hash (remaining bytes)
		const salt = hashArray.slice(0, 16);
		const storedHash = hashArray.slice(16);

		// Import the password as a key
		const key = await crypto.subtle.importKey(
			"raw",
			data,
			{ name: "PBKDF2" },
			false,
			["deriveBits"],
		);

		// Derive key using the same parameters
		const derivedKey = await crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt: salt,
				iterations: 100000,
				hash: "SHA-256",
			},
			key,
			256,
		);

		// Compare the derived key with stored hash
		const derivedArray = new Uint8Array(derivedKey);

		if (derivedArray.length !== storedHash.length) {
			return false;
		}

		for (let i = 0; i < derivedArray.length; i++) {
			if (derivedArray[i] !== storedHash[i]) {
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error("Password verification error:", error);
		return false;
	}
}
