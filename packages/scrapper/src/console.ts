console.debug = function (...args) {
	// Check if the environment variable DEBUG is set
	if (process.env.DEBUG) {
		// Log the arguments to the console with a custom prefix
		console.log("\n[DEBUG]", ...args);
	}
};

// @ts-expect-error
console.debugGroup = function (...args) {
	// Check if the environment variable DEBUG is set
	if (process.env.DEBUG) {
		console.group();
		args.forEach((arg) => {
			console.log("[DEBUG]", arg);
		});
		console.groupEnd();
	}
};
