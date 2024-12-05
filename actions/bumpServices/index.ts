import { error, getInput, info, setOutput } from '@actions/core';
import { inc, ReleaseType } from 'semver';
import { context } from '@actions/github';
import { execAsync, ProjectInfo } from '../common';

const bumps: Record<string, ReleaseType> = {
    fix: 'patch',
    feat: 'minor',
    breaking: 'major'
};

interface ProjectProps {
    project: string;
    dockerfilePath: string;
}

const getBumpFactor = (): ReleaseType => {
    const commitMessage = context.payload.head_commit?.message as string;

    if (!commitMessage?.length) {
        // Running on a PR or any other weird use-case
        return 'minor';
    }

    const prefix = commitMessage.split(':', 2)[0].trim().toLowerCase();

    return bumps[prefix] || 'minor';
};

const getChangedProjects = async (): Promise<ProjectProps[]> => {
    const stack = getInput('stack');

    const possibleComamnds: Record<string, () => Promise<ProjectProps[]>> = {
        nx: async () => {
            const projects: string[] = JSON.parse(
                await execAsync('npx nx show projects  --with-target docker-build --json')
            );

            return projects.map(project => ({
                project,
                dockerfilePath: `apps/${project}/Dockerfile`
            }));
        },

        python: async () => {
            const projectsText = await execAsync('find . -name "Dockerfile"');

            return projectsText.split('\n').map(dockerfilePath => ({
                project: dockerfilePath.substring(2, dockerfilePath.length - 11),
                dockerfilePath
            }));
        }
    };

    if (!possibleComamnds[stack]) {
        error(`Cannot get changed projects: stack ${stack} is not supported`);
    }

    return await possibleComamnds[stack]();
};

const main = async () => {
    const inputProjects = await getChangedProjects();

    info('Inputs ' + JSON.stringify(inputProjects));

    if (!inputProjects?.length) {
        error('Cannot find input "inputProjects"');

        return;
    }

    const bumpFactor = getBumpFactor();

    const serviceToBuild = await Promise.all(
        inputProjects.map(async ({ project, dockerfilePath }) => {
            const tags = await execAsync(`git tag -l --sort=-creatordate "${project}@*"`);

            const currentTag = tags.length ? tags.split('\n', 2)[0].substring(project.length + 1) : null;

            const nextVersion = currentTag ? inc(currentTag, bumpFactor) : '1.0.0';

            return {
                project,
                dockerfilePath,
                currentVersion: currentTag,
                nextVersion
            } as ProjectInfo;
        })
    );

    setOutput('servicesToBuild', { include: serviceToBuild });
};

main();
