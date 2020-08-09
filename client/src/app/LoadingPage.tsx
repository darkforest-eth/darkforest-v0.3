import * as React from 'react';

const styles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default function LoadingPage() {
  return (
    <div style={styles.container}>Loading... (this may take a few seconds)</div>
  );
}
