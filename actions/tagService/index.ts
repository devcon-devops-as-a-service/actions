import { error, getInput, info } from '@actions/core';
import { execAsync } from '../utils';

const main = async () => {
    const service = getInput('service');

    if (!service?.length) {
        error('Cannot find input "service"');

        return;
    }

    const version = getInput('version');

    if (!version?.length) {
        error('Cannot find input "version"');

        return;
    }

    await execAsync(`git tag ${service}@${version}`);

    await execAsync(`git push origin tag ${service}@${version}`);

    info(`Service ${service} was tagged successfully`);
};

main();
