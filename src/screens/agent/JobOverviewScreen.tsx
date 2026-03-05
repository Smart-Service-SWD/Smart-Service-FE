import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const GET_SERVICE_REQUEST = `
query getServiceRequestById($id: UUID!) {
  getServiceRequestById(id: $id) {
    id
    addressText
    categoryId
    complexity
    customerId
    description
    estimatedCost {
      amount
      currency
    }
    status
    createdAt
  }
}
`;

const GET_USER = `
query getUserById($id: UUID!) {
  getUserById(id: $id) {
    id
    fullName
    email
    phoneNumber
  }
}
`;

const GET_CATEGORY = `
query getServiceCategoryById($id: UUID!) {
  getServiceCategoryById(id: $id) {
    id
    name
    description
  }
}
`;

const JobOverviewScreen = () => {

  const route = useRoute<any>();
  const { jobId } = route.params || {};

  const { token, loading: authLoading } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const fetchGraphQL = async (query: string, variables: any) => {

    const url = await resolveGraphQLBaseUrl();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  };

  const fetchJobData = useCallback(async () => {

    try {

      console.log("JOB ID:", jobId);
      console.log("TOKEN:", token);

      // 1️⃣ ServiceRequest
      const serviceData = await fetchGraphQL(
        GET_SERVICE_REQUEST,
        { id: jobId }
      );

      const request = serviceData.getServiceRequestById;

      setJob(request);

      // 2️⃣ Customer
      const userData = await fetchGraphQL(
        GET_USER,
        { id: request.customerId }
      );

      setCustomer(userData.getUserById);

      // 3️⃣ Category
      const categoryData = await fetchGraphQL(
        GET_CATEGORY,
        { id: request.categoryId }
      );

      setCategory(categoryData.getServiceCategoryById);

    } catch (err: any) {

      console.error(err);

      Alert.alert("Error", err.message);

    } finally {

      setLoading(false);

    }

  }, [jobId, token]);

  useEffect(() => {

    if (!authLoading && token && jobId) {

      fetchJobData();

    }

  }, [authLoading, token, jobId, fetchJobData]);

  if (authLoading || loading) {

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  }

  if (!job) {

    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu công việc</Text>
      </View>
    );

  }

  return (

    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Job Overview</Text>

      <Text style={styles.label}>Customer</Text>
      <Text style={styles.value}>{customer?.fullName}</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{customer?.email}</Text>

      <Text style={styles.label}>Phone</Text>
      <Text style={styles.value}>{customer?.phoneNumber}</Text>

      <Text style={styles.label}>Address</Text>
      <Text style={styles.value}>{job.addressText}</Text>

      <Text style={styles.label}>Category</Text>
      <Text style={styles.value}>{category?.name}</Text>

      <Text style={styles.label}>Complexity</Text>
      <Text style={styles.value}>{job.complexity}</Text>

      <Text style={styles.label}>Description</Text>
      <Text style={styles.value}>{job.description}</Text>

      <Text style={styles.label}>Status</Text>
      <Text style={styles.value}>{job.status}</Text>

      <Text style={styles.label}>Estimated Cost</Text>
      <Text style={styles.value}>
        {job.estimatedCost
          ? `${job.estimatedCost.amount} ${job.estimatedCost.currency}`
          : "Not set"}
      </Text>

    </ScrollView>

  );

};

export default JobOverviewScreen;

const styles = StyleSheet.create({

  container: {
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },

  value: {
    marginTop: 4,
    fontSize: 16,
  },

});