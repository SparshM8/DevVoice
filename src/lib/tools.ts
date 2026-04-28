import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Ensures the target path is within the current working directory to prevent directory traversal.
 */
function getSafePath(relativePath: string): string {
  const rootDir = process.cwd();
  const targetPath = path.resolve(rootDir, relativePath);
  
  if (!targetPath.startsWith(rootDir)) {
    throw new Error(`Access denied: Cannot access paths outside the workspace root (${rootDir})`);
  }
  return targetPath;
}

export async function readLocalFile(filepath: string): Promise<string> {
  try {
    const safePath = getSafePath(filepath);
    const content = await fs.readFile(safePath, "utf-8");
    return content.slice(0, 8000); // Truncate to avoid massive context blowups
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `[Error reading file]: ${message}`;
  }
}

export async function runTerminalCommand(command: string): Promise<string> {
  try {
    // Basic safety block list (not perfect, but a start for the MVP)
    const blockedKeywords = ["rm -rf", "mkfs", "dd", "> /dev/"];
    if (blockedKeywords.some(kw => command.includes(kw))) {
      return `[Error]: Command blocked due to safety restrictions.`;
    }

    const { stdout, stderr } = await execAsync(command, { cwd: process.cwd(), timeout: 15000 });
    const output = [
      stdout ? `STDOUT:\n${stdout}` : "",
      stderr ? `STDERR:\n${stderr}` : ""
    ].filter(Boolean).join("\n\n");
    
    return output ? output.slice(0, 4000) : "[Command executed successfully with no output]";
  } catch (error: any) {
    const stdout = error.stdout ? `STDOUT:\n${error.stdout}\n` : "";
    const stderr = error.stderr ? `STDERR:\n${error.stderr}\n` : "";
    return `[Command Failed]: ${error.message}\n${stdout}${stderr}`.slice(0, 4000);
  }
}
