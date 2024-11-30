// import { error, getInput } from '@actions/core';
import { inc } from 'semver';
import { execAsync } from './execAsync';

const main = async () => {
    // const inputProjectsText = ['backend', 'frontend'];
    // getInput('projects');

    // if (!inputProjectsText?.length) {
    //      error('Cannot find input "inputProjects"');

    //     return;
    // }

    const inputProjects = ['backend', 'frontend']; // JSON.parse(inputProjectsText) as string[];

    const currentVersions = await Promise.all(
        inputProjects.map(async project => {
            const tags = await execAsync(`git tag -l --sort=-creatordate "${project}@*"`);

            const currentTag = tags.length ? tags[0] : null;

            return {
                project,
                currentVersion: currentTag
            };
        })
    );

    console.log('curr', currentVersions);
};

// export const try1 = () => {
//     console.log('Major', inc('1.0.0', 'major'));
//     console.log('Minor', inc('1.0.0', 'minor'));
//     console.log('Patch', inc('1.0.0', 'patch'));
// };

// try1();

main();
