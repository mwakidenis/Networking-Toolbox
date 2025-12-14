import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { apiRegistry, listCategoryEndpoints } from '$lib/utils/api-registry';

export const GET: RequestHandler = async () => {
  // Group endpoints by category
  const categories = ['subnetting', 'cidr', 'ip-address-convertor', 'dns'];
  const endpoints: Record<string, any> = {};

  for (const category of categories) {
    const tools = listCategoryEndpoints(category);
    endpoints[category] = tools.map((tool) => ({
      endpoint: `/api/${category}/${tool}`,
      tool,
      description: apiRegistry[tool]?.description,
      method: 'POST',
    }));
  }

  return json({
    message: 'IP Calculator API',
    version: '1.0.0',
    categories,
    endpoints,
    usage: {
      description: 'Send POST requests to individual endpoints with parameters in the request body',
      example: {
        endpoint: '/api/cidr/deaggregate',
        method: 'POST',
        body: {
          input: '192.168.0.0/22\\n10.0.0.0-10.0.0.255',
          targetPrefix: 24,
        },
      },
    },
  });
};
