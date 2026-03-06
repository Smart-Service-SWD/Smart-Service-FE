export const resolveAgentJobRouteParams = (params: any) => {
  const passedJob = params?.job;
  const jobId = params?.jobId || passedJob?.serviceRequestId || passedJob?.id;

  return {
    passedJob,
    jobId,
  };
};
