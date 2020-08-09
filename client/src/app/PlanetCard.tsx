import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

export function PlanetCard({ match }: RouteComponentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { location } = match.params as any;

  return <div>{location}</div>;
}
