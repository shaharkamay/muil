import React from 'react';
import { Page } from 'shared/components';
import ApiKeys from './ApiKeys';
import SMTP from './SMTP';
import CloudStorage from './CloudStorage';
import Profile from './Profile';

const TABS = [
  { label: 'Api Keys', value: 'apiKeys' },
  { label: 'SMTP', value: 'smtp' },
  { label: 'Cloud Storage', value: 'cloudStorage' },
  { label: 'Profile', value: 'profile' },
];

const Settings = () => (
  <Page title="Settings" tabs={TABS}>
    <ApiKeys tab="apiKeys" />
    <SMTP tab="smtp" />
    <CloudStorage tab="cloudStorage" />
    <Profile tab="profile" />
  </Page>
);

export default Settings;
