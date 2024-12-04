import { error, getInput, setOutput } from '@actions/core';
import { inc, ReleaseType } from 'semver';
import { context } from '@actions/github';
import { execAsync } from '../utils';

const bumps: Record<string, ReleaseType> = {
    fix: 'patch',
    feat: 'minor',
    breaking: 'major'
};

const getBumpFactor = (): ReleaseType => {
    const commitMessage = context.payload.head_commit?.message as string;

    if (!commitMessage?.length) {
        // Running on a PR or any other weird use-case
        return 'minor';
    }

    const prefix = commitMessage.split(':', 2)[0].trim().toLowerCase();

    return bumps[prefix] || 'minor';
};

const getChangedProjects = async (): Promise<string> => {
    const stack = getInput('stack');

    const possibleComamnds: Record<string, string> = {
        nx: 'npx nx show projects  --with-target docker-build --json',
        csharp: 'dotnet ...'
    };

    if (!possibleComamnds[stack]) {
        error(`Cannot get changed projects: stack ${stack} is not supported`);
    }

    return execAsync(possibleComamnds[stack]);
};

const main = async () => {
    const inputProjectsText = await getChangedProjects();

    if (!inputProjectsText?.length) {
        error('Cannot find input "inputProjects"');

        return;
    }

    const inputProjects = JSON.parse(inputProjectsText) as string[];

    const bumpFactor = getBumpFactor();

    const serviceToBuild = await Promise.all(
        inputProjects.map(async project => {
            const tags = await execAsync(`git tag -l --sort=-creatordate "${project}@*"`);

            const currentTag = tags.length ? tags.split('\n', 2)[0].substring(project.length + 1) : null;

            const nextVersion = currentTag ? inc(currentTag, bumpFactor) : '1.0.0';

            return {
                project,
                currentVersion: currentTag,
                nextVersion
            };
        })
    );

    setOutput('servicesToBuild', { include: serviceToBuild });
};

main();
