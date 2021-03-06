import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

import Logger from '../Logger';
import domRunner from '../domRunner';
import makeRequest from '../makeRequest';
import pageRunner from '../pageRunner';
import remoteRunner from '../remoteRunner';
import uploadReport from '../uploadReport';

export default async function runCommand(
  sha,
  config,
  { only, link, message, isAsync },
) {
  const logger = new Logger();
  const { apiKey, apiSecret, endpoint, project, plugins, pages } = config;

  rimraf.sync(config.tmpdir);
  mkdirp.sync(config.tmpdir);

  const staticPlugin = plugins.find(
    (plugin) => typeof plugin.generateStaticPackage === 'function',
  );
  let result;
  if (pages) {
    result = await pageRunner(config, { isAsync });
  } else if (staticPlugin) {
    result = await remoteRunner(config, staticPlugin, { isAsync });
  } else {
    result = await domRunner(config, { only, isAsync });
  }

  if (isAsync) {
    logger.start(`Creating async report for ${sha}...`);
    const allRequestIds = [];
    result.forEach((item) => allRequestIds.push(...item.result));
    const { id } = await makeRequest(
      {
        url: `${endpoint}/api/async-reports/${sha}`,
        method: 'POST',
        json: true,
        body: {
          requestIds: allRequestIds,
          link,
          message,
          project,
        },
      },
      { endpoint, apiKey, apiSecret, maxTries: 3 },
    );

    logger.success();
    logger.info(`Async report id: ${id}`);
  } else {
    logger.start(`Uploading report for ${sha}...`);
    const { url } = await uploadReport({
      snaps: result,
      sha,
      endpoint,
      apiKey,
      apiSecret,
      link,
      message,
      project,
    });
    logger.success();
    logger.info(`View results at ${url}`);
  }
  logger.info(`Done ${sha}`);
}
