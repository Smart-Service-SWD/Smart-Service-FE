import React from 'react';
import { Text } from 'react-native';
import { styles } from '../styles';

interface OverviewFieldProps {
  label: string;
  value: string;
}

export const OverviewField: React.FC<OverviewFieldProps> = ({ label, value }) => {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </>
  );
};
