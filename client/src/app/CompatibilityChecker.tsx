import React, { useEffect, useState } from 'react';
import {
  unsupportedFeatures,
  enableEthereum,
  Incompatibility,
} from '../api/BrowserChecks';
import _ from 'lodash';
import Button from '../components/Button';
import { handleEthereumConfigChanges } from '../utils/EthereumUtils';

export const CompatibilityChecker = ({
  children,
  doChecks,
}: {
  children: React.ReactNode;
  doChecks: boolean;
}) => {
  const [issues, setIssues] = useState<Array<string> | null>(null);

  useEffect(() => {
    (async () => {
      setIssues(await unsupportedFeatures());
      handleEthereumConfigChanges(); // this reloads the page if network/account changes, so no cleanup needed
    })();
  }, []);

  if (!doChecks) {
    return <>{children}</>;
  } else if (issues === null) {
    return <div>Checking compatibility...</div>;
  } else if (issues.includes(Incompatibility.NotLoggedInOrEnabled)) {
    return (
      <>
        <Button onClick={enableEthereum}>Enable Ethereum</Button> Then refresh
      </>
    );
  } else if (_.some(Object.values(issues))) {
    return <>{JSON.stringify(issues)}</>;
  } else {
    return <>{children}</>;
  }
};

export default CompatibilityChecker;
