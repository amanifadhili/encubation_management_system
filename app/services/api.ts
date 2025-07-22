// Mock API service (replace with real API calls later)
export const fetchMockData = async (endpoint: string) => {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 500));
  return { data: `Sample data from ${endpoint}` };
};
