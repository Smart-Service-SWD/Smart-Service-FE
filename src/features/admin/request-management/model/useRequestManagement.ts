import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  adminGraphqlService,
  ServiceRequest,
} from '../../../../shared/api/adminGraphqlService';
import { isPendingRequestStatus, RequestTabType } from './constants';

interface UseRequestManagementParams {
  initialTab: RequestTabType;
}

export const useRequestManagement = ({ initialTab }: UseRequestManagementParams) => {
  const [activeTab, setActiveTab] = useState<RequestTabType>(initialTab);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const [requestList, users, categories] = await Promise.all([
        adminGraphqlService.getServiceRequests(),
        adminGraphqlService.getUsers(),
        adminGraphqlService.getServiceCategories(),
      ]);

      setRequests(requestList);

      const userNameMap: Record<string, string> = {};
      const agentNameMap: Record<string, string> = {};
      users.forEach(user => {
        userNameMap[user.id] = user.fullName;
        if (user.role === 'AGENT') {
          agentNameMap[user.id] = user.fullName;
        }
      });
      setUserMap(userNameMap);
      setAgentMap(agentNameMap);

      const categoryNameMap: Record<string, string> = {};
      categories.forEach(category => {
        categoryNameMap[category.id] = category.name;
      });
      setCatMap(categoryNameMap);
    } catch {
      // keep silent here to preserve existing behavior
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pendingList = useMemo(
    () => requests.filter(request => isPendingRequestStatus(request.status)),
    [requests]
  );
  const completedList = useMemo(
    () => requests.filter(request => !isPendingRequestStatus(request.status)),
    [requests]
  );
  const filteredList = activeTab === 'pending' ? pendingList : completedList;

  return {
    activeTab,
    requests,
    userMap,
    catMap,
    agentMap,
    loading,
    refreshing,
    pendingList,
    completedList,
    filteredList,
    setActiveTab,
    loadData,
    onRefresh,
  };
};
