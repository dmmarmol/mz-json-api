console.debug = function (...args) {
	// Check if the environment variable DEBUG is set
	if (JSON.parse(process.env.DEBUG as string)) {
		// Log the arguments to the console with a custom prefix
		console.log("\n[DEBUG]", ...args);
	}
};

// @ts-expect-error
console.debugGroup = function (...args) {
	// Check if the environment variable DEBUG is set
	if (JSON.parse(process.env.DEBUG as string)) {
		console.group();
		args.forEach((arg) => {
			console.log("[DEBUG]", arg);
		});
		console.groupEnd();
	}
};
