import { spawn } from "child_process";

/**
 * Checks if the development server starts successfully.
 * This script starts the dev server and monitors the output for 10 seconds
 * to detect any errors that might occur during startup.
 */
function checkDevServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Starting development server...");

    // Spawn the dev server process
    const serverProcess = spawn("yarn", ["dev"], {
      shell: true,
      stdio: "pipe",
    });

    let errorDetected = false;
    let output = "";

    // Listen for stdout data
    serverProcess.stdout.on("data", (data) => {
      const message = data.toString();
      output += message;
      console.log(message);
      const lowerCaseMessage = message.toLowerCase();

      // Check for common error patterns in the output
      if (
        lowerCaseMessage.includes("error:") ||
        lowerCaseMessage.includes("exception:") ||
        lowerCaseMessage.includes("failed to compile")
      ) {
        errorDetected = true;
        console.error("Error detected in server output!");
      }
    });

    // Listen for stderr data
    serverProcess.stderr.on("data", (data) => {
      const message = data.toString();
      output += message;
      console.error(message);
      const lowerCaseMessage = message.toLowerCase();

      // Stderr output often indicates errors
      if (!lowerCaseMessage.includes("warning:")) {
        errorDetected = true;
        console.error("Error detected in server stderr output!");
      }
    });

    // Handle server process exit
    serverProcess.on("error", (error) => {
      console.error("Failed to start server process:", error);
      reject(new Error(`Server process failed to start: ${error.message}`));
    });

    // Set timeout to wait for server to stabilize
    setTimeout(() => {
      // Kill the server process after timeout
      serverProcess.kill();

      if (errorDetected) {
        console.error(
          "Server check failed! Errors were detected during server startup.",
        );
        reject(
          new Error(
            "Errors detected during server startup. Check logs for details.",
          ),
        );
      } else if (!output.includes("Server running")) {
        console.error("Server check failed! Server did not start properly.");
        reject(new Error("Server did not indicate successful startup."));
      } else {
        console.log("Server check passed! Server started successfully.");
        resolve();
      }
    }, 10000); // Wait 10 seconds
  });
}

// Run the check and handle the result
checkDevServer()
  .then(() => {
    console.log("✅ Dev server check completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(`❌ Dev server check failed: ${error.message}`);
    process.exit(1);
  });
