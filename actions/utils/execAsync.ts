import { promisify } from 'node:util';
import { exec } from 'node:child_process';

export const execAsync = async (command: string) => {
    const { stdout } = await promisify(exec)(command);

    return stdout.trim();
};
